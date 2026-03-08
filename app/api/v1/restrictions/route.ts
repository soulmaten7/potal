/**
 * POTAL API v1 — /api/v1/restrictions
 *
 * Check import restrictions for a product.
 *
 * POST /api/v1/restrictions
 * Body: {
 *   hsCode: string,           — HS code (2-10 digits)
 *   destinationCountry: string, — ISO 2-letter country code
 *   productName?: string       — Optional: auto-classify if no hsCode
 * }
 *
 * Returns: { hasRestrictions, isProhibited, restrictions[], hsCode, destinationCountry }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { checkRestrictions } from '@/app/lib/cost-engine/restrictions';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  let hsCode = typeof body.hsCode === 'string' ? body.hsCode.replace(/[^0-9.]/g, '').trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string'
    ? body.destinationCountry.trim().toUpperCase().slice(0, 2)
    : '';
  const productName = typeof body.productName === 'string' ? body.productName.trim().slice(0, 500) : '';

  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry must be a 2-letter ISO code (e.g. "US", "DE", "JP").');
  }

  // Auto-classify if no HS code provided but productName given
  if (!hsCode && productName) {
    try {
      const classification = await classifyProductAsync(productName, undefined, context.sellerId);
      if (classification.hsCode) {
        hsCode = classification.hsCode;
      }
    } catch {
      // Classification failed
    }
  }

  if (!hsCode) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide hsCode or productName for restriction check.');
  }

  const result = checkRestrictions(hsCode, destinationCountry);

  return apiSuccess({
    ...result,
    ...(productName ? { productName } : {}),
    autoClassified: !body.hsCode && !!productName,
  }, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { hsCode: "9302", destinationCountry: "US" } or { productName: "rifle scope", destinationCountry: "DE" }. See docs: /api/v1/docs'
  );
}
