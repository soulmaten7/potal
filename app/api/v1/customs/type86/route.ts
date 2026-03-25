/**
 * POTAL API v1 — /api/v1/customs/type86
 *
 * C1: Type86 (Section 321) de minimis entry eligibility check.
 * US $800 threshold with origin/HS restrictions (2024+ rules).
 *
 * POST /api/v1/customs/type86
 * Body: {
 *   declaredValue: number,        // USD
 *   originCountry: string,        // 2-letter ISO
 *   destinationCountry?: string,  // default: US
 *   hsCode?: string,
 *   productName?: string,
 *   shipmentsPerWeek?: number,    // for frequency check
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  checkDeMinimisEligibility,
  getDeMinimisThreshold,
} from '@/app/lib/customs/de-minimis-tracker';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue : -1;
  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : 'US';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const productName = typeof body.productName === 'string' ? body.productName.trim() : undefined;
  const shipmentsPerWeek = typeof body.shipmentsPerWeek === 'number' ? body.shipmentsPerWeek : undefined;

  if (declaredValue < 0) return apiError(ApiErrorCode.BAD_REQUEST, '"declaredValue" must be a non-negative number.');
  if (!originCountry || originCountry.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" must be 2-letter ISO code.');

  const result = checkDeMinimisEligibility({
    destinationCountry,
    originCountry,
    hsCode,
    declaredValue,
    currency: 'USD',
    shipmentsPerWeek,
  });

  const threshold = getDeMinimisThreshold(destinationCountry);

  // Estimate duty if not eligible
  let estimatedDuty = 0;
  if (!result.eligible && declaredValue > 0) {
    // Rough estimate: average US duty ~5%
    estimatedDuty = Math.round(declaredValue * 0.05 * 100) / 100;
  }

  return apiSuccess({
    eligible: result.eligible,
    entryType: result.eligible ? 'type86' : 'formal',
    reason: result.reason,
    restrictions: result.restrictions.length > 0 ? result.restrictions : undefined,
    alternativeEntry: result.alternativeEntry || null,
    deMinimis: {
      threshold: threshold.value,
      currency: threshold.currency,
      notes: threshold.notes,
    },
    declaredValue,
    originCountry,
    destinationCountry,
    hsCode: hsCode || null,
    productName: productName || null,
    estimatedDuty: result.eligible ? 0 : estimatedDuty,
    estimatedDutyNote: result.eligible
      ? 'No duty under Section 321 de minimis.'
      : `Estimated duty ~$${estimatedDuty} (formal entry required). Actual rate depends on HS code.`,
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST. Body: { declaredValue, originCountry, hsCode?, destinationCountry? }',
  );
}
