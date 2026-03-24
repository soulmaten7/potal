/**
 * POTAL API v1 — /api/v1/landed-cost-guarantee
 *
 * F026: Landed Cost Guarantee
 * POST — Assess guarantee eligibility for a calculation
 * GET  — Retrieve seller's guarantee claims
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  assessGuarantee,
  submitClaim,
  getClaims,
  TIER_CONFIG,
  PLAN_TO_TIER,
  type GuaranteeTier,
} from '@/app/lib/cost-engine/landed-cost-guarantee';

const ISO2_PATTERN = /^[A-Z]{2}$/;
const HS_CODE_PATTERN = /^\d{6,10}$/;

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const action = typeof body.action === 'string' ? body.action : 'assess';

  // ─── Action: submit_claim ─────────────────────────
  if (action === 'submit_claim') {
    const calculationId = typeof body.calculationId === 'string' ? body.calculationId : '';
    const calculatedAmount = typeof body.calculatedAmount === 'number' ? body.calculatedAmount : 0;
    const actualAmount = typeof body.actualAmount === 'number' ? body.actualAmount : 0;

    if (!calculationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'calculationId is required for claim submission.');
    }
    if (calculatedAmount <= 0 || actualAmount <= 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'calculatedAmount and actualAmount must be positive numbers.');
    }

    const tier = PLAN_TO_TIER[context.planId] || 'standard';
    const result = await submitClaim({
      sellerId: context.sellerId,
      calculationId,
      calculatedAmount,
      actualAmount,
      tier,
    });

    if ('error' in result) {
      return apiError(ApiErrorCode.BAD_REQUEST, result.error);
    }

    return apiSuccess({ claim: result }, { sellerId: context.sellerId });
  }

  // ─── Action: assess (default) ─────────────────────
  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.replace(/[\s.\-]/g, '') : '';
  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue : 0;
  const calculatedDuty = typeof body.calculatedDuty === 'number' ? body.calculatedDuty : 0;
  const calculatedTax = typeof body.calculatedTax === 'number' ? body.calculatedTax : 0;
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase().trim() : 'USD';
  const confidenceScore = typeof body.confidenceScore === 'number' ? body.confidenceScore : 0.85;

  // Validation
  if (!originCountry || !ISO2_PATTERN.test(originCountry)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'originCountry must be a valid ISO 3166-1 alpha-2 code (e.g. "CN").');
  }
  if (!destinationCountry || !ISO2_PATTERN.test(destinationCountry)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry must be a valid ISO 3166-1 alpha-2 code (e.g. "US").');
  }
  if (!hsCode || !HS_CODE_PATTERN.test(hsCode)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hsCode must be 6-10 digits.');
  }
  if (declaredValue <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'declaredValue must be a positive number.');
  }
  if (calculatedDuty < 0 || calculatedTax < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'calculatedDuty and calculatedTax must be non-negative.');
  }

  const tier: GuaranteeTier = PLAN_TO_TIER[context.planId] || 'standard';
  const tierConfig = TIER_CONFIG[tier];
  const totalCalculated = calculatedDuty + calculatedTax;

  const guarantee = assessGuarantee({
    planId: context.planId,
    confidenceScore,
    dataQuality: 'fresh',
    dutyRateSource: 'api',
    hsCodeSource: 'potal',
    hasTradeRemedies: false,
    isSanctioned: false,
  });

  return apiSuccess({
    guarantee,
    calculation: {
      originCountry,
      destinationCountry,
      hsCode,
      declaredValue,
      calculatedDuty,
      calculatedTax,
      totalCalculated,
      currency,
    },
    tierDetails: {
      tier,
      coveragePercentage: tierConfig.coverage,
      maxClaimAmount: tierConfig.maxClaim,
      validDays: tierConfig.validDays,
    },
    claimProcess: [
      'Submit customs assessment receipt showing discrepancy via POST with action: "submit_claim".',
      'POTAL reviews calculation vs actual assessment.',
      `If difference exceeds ±${tierConfig.coverage}%, eligible amount (up to $${tierConfig.maxClaim.toLocaleString()}) is refunded.`,
    ],
  }, { sellerId: context.sellerId, plan: context.planId });
});

/** GET — Retrieve seller's guarantee claims */
export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  try {
    const claims = await getClaims(ctx.sellerId);
    return apiSuccess({
      claims,
      total: claims.length,
      tier: PLAN_TO_TIER[ctx.planId] || 'standard',
    }, { sellerId: ctx.sellerId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to retrieve claims.');
  }
});
