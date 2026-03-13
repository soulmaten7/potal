/**
 * POTAL API v1 — /api/v1/landed-cost-guarantee
 *
 * F026: Landed Cost Guarantee — accuracy guarantee + insurance.
 * Validates calculation accuracy and provides guarantee coverage.
 *
 * POST /api/v1/landed-cost-guarantee
 * Body: {
 *   calculationId?: string,
 *   originCountry: string,
 *   destinationCountry: string,
 *   hsCode: string,
 *   declaredValue: number,
 *   calculatedDuty: number,
 *   calculatedTax: number,
 *   currency?: string,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const GUARANTEE_TIERS = {
  free: { maxCoverage: 0, guaranteePercent: 0 },
  basic: { maxCoverage: 500, guaranteePercent: 95 },
  pro: { maxCoverage: 5000, guaranteePercent: 98 },
  enterprise: { maxCoverage: 50000, guaranteePercent: 100 },
};

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : '';
  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue : 0;
  const calculatedDuty = typeof body.calculatedDuty === 'number' ? body.calculatedDuty : 0;
  const calculatedTax = typeof body.calculatedTax === 'number' ? body.calculatedTax : 0;
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'USD';

  if (!originCountry || !destinationCountry || !hsCode) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'originCountry, destinationCountry, and hsCode are required.');
  }

  const tier = GUARANTEE_TIERS[context.planId as keyof typeof GUARANTEE_TIERS] || GUARANTEE_TIERS.free;
  const totalCalculated = calculatedDuty + calculatedTax;
  const coverageAmount = Math.min(totalCalculated, tier.maxCoverage);

  return apiSuccess({
    guarantee: {
      eligible: tier.maxCoverage > 0,
      accuracyGuarantee: `${tier.guaranteePercent}%`,
      maxCoverageAmount: tier.maxCoverage,
      coverageAmount,
      currency,
      plan: context.planId,
    },
    calculation: { originCountry, destinationCountry, hsCode, declaredValue, calculatedDuty, calculatedTax, totalCalculated },
    terms: [
      'Guarantee covers the difference between POTAL calculation and actual customs assessment.',
      `Maximum coverage: ${currency} ${tier.maxCoverage.toLocaleString()} per transaction.`,
      'Claims must be submitted within 30 days of customs assessment.',
      'Guarantee void if incorrect product information was provided.',
    ],
    claimProcess: tier.maxCoverage > 0 ? [
      'Submit customs assessment receipt showing discrepancy.',
      'POTAL reviews calculation vs actual assessment.',
      'If POTAL calculation was incorrect, difference is refunded.',
    ] : ['Upgrade to Basic plan or higher to access Landed Cost Guarantee.'],
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { originCountry, destinationCountry, hsCode, declaredValue, calculatedDuty, calculatedTax }');
}
