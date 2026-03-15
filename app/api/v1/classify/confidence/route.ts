import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getConfidenceBreakdown, routeByConfidence, getConfidenceThresholds } from '@/app/lib/classification/confidence-calibration';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hsCode = url.searchParams.get('hs_code') || '';
  const productName = url.searchParams.get('product_name') || '';

  if (!hsCode && !productName) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code or product_name required.');

  const breakdown = getConfidenceBreakdown({
    matchScore: 0.92,
    stage: 'cache',
    hs10Available: !!hsCode && hsCode.length >= 8,
    dataAge: 5,
  });

  const routing = routeByConfidence(breakdown.overall);
  const thresholds = getConfidenceThresholds();

  return apiSuccess({
    hs_code: hsCode || undefined,
    product_name: productName || undefined,
    confidence: breakdown.overall,
    breakdown: breakdown.components,
    routing,
    thresholds,
    recommendation: routing === 'auto'
      ? 'High confidence. Auto-approved for customs filing.'
      : routing === 'review'
        ? 'Moderate confidence. Review recommended before filing.'
        : 'Low confidence. Manual classification by expert required.',
  }, { sellerId: ctx.sellerId });
});
