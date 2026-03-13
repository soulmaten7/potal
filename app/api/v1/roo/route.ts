/**
 * POTAL API v1 — /api/v1/roo
 *
 * Rules of Origin lookup endpoint.
 * Returns applicable FTA rules, required certificates, and origin criteria.
 *
 * POST /api/v1/roo
 * Body: {
 *   originCountry: string,         // required
 *   destinationCountry: string,    // required
 *   hsCode?: string,               // HS code for product-specific rules
 *   productName?: string           // auto-classify if no hsCode
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { getRulesOfOrigin, getCountryFtas } from '@/app/lib/cost-engine/hs-code/fta';
import { classifyProductAsync } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';

  if (!originCountry || originCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" must be a 2-letter ISO code.');
  }
  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"destinationCountry" must be a 2-letter ISO code.');
  }

  let hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;

  // Auto-classify if productName provided but no hsCode
  if (!hsCode && typeof body.productName === 'string' && body.productName.trim()) {
    try {
      const classification = await classifyProductAsync(body.productName.trim(), undefined, context.sellerId);
      if (classification.hsCode && classification.hsCode !== '9999') {
        hsCode = classification.hsCode;
      }
    } catch { /* classification failed */ }
  }

  // Get rules of origin
  const roo = getRulesOfOrigin(originCountry, destinationCountry, hsCode);

  // Get all FTAs for the country pair
  const originFtas = getCountryFtas(originCountry);
  const destFtas = getCountryFtas(destinationCountry);
  const commonFtas = originFtas.filter(f => destFtas.some(d => d.code === f.code));

  return apiSuccess(
    {
      originCountry,
      destinationCountry,
      hsCode: hsCode || null,
      rulesOfOrigin: roo ? {
        ftaCode: roo.ftaCode,
        ftaName: roo.ftaName,
        rules: roo.rules,
        accumulationAllowed: roo.accumulationAllowed,
        accumulationType: roo.accumulationType,
        certificateType: roo.certificateType,
        notes: roo.notes,
      } : null,
      availableFtas: commonFtas.map(f => ({
        code: f.code,
        name: f.name,
      })),
      hasFta: !!roo,
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { originCountry, destinationCountry, hsCode?, productName? }'
  );
}
