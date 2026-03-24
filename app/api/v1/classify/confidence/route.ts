import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getConfidenceBreakdown, routeByConfidence, getConfidenceThresholds } from '@/app/lib/classification/confidence-calibration';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hsCode = url.searchParams.get('hs_code') || '';
  const productName = url.searchParams.get('product_name') || '';
  const country = url.searchParams.get('country') || undefined;
  const matchScoreParam = url.searchParams.get('match_score');
  const stageParam = url.searchParams.get('stage');

  if (!hsCode && !productName) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code or product_name required.');

  // Use provided match_score/stage from classification result, or defaults for lookup-only requests
  const matchScore = matchScoreParam ? parseFloat(matchScoreParam) : 0.85;
  const stage = stageParam || 'db_keyword_match';

  const breakdown = await getConfidenceBreakdown({
    matchScore: Math.max(0, Math.min(1, matchScore)),
    stage,
    hsCode: hsCode || '000000',
    country,
  });

  const routing = routeByConfidence(breakdown.overall);
  const thresholds = getConfidenceThresholds();

  return apiSuccess({
    hs_code: hsCode || undefined,
    product_name: productName || undefined,
    country: country || undefined,
    confidence: breakdown.overall,
    breakdown: breakdown.components,
    data_sources: breakdown.dataSources,
    routing,
    thresholds,
    recommendation: routing === 'auto'
      ? 'High confidence. Auto-approved for customs filing.'
      : routing === 'review'
        ? 'Moderate confidence. Review recommended before filing.'
        : 'Low confidence. Manual classification by expert required.',
  }, { sellerId: ctx.sellerId });
});
