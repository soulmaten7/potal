/**
 * POTAL API v1 — GET /api/v1/classify/confidence
 *
 * Returns detailed confidence breakdown for a given HS code or product.
 * Uses the single-source confidence-calibration module with real DB data.
 *
 * Query params:
 *   hs_code - HS code to assess (required unless product_name given)
 *   product_name - Product name (required unless hs_code given)
 *   country - ISO 2-letter code for 10-digit availability check
 *   match_score - Raw match score from classification (0-1, default 0.85)
 *   stage - Classification stage (default 'db_keyword_match')
 *   field_count - Number of input fields provided (0-9)
 */

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
  const fieldCountParam = url.searchParams.get('field_count');

  if (!hsCode && !productName) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code or product_name required.');
  }

  const matchScore = matchScoreParam ? Math.max(0, Math.min(1, parseFloat(matchScoreParam) || 0)) : 0.85;
  const stage = stageParam || 'db_keyword_match';
  const fieldCount = fieldCountParam ? Math.max(0, Math.min(9, parseInt(fieldCountParam, 10) || 0)) : undefined;

  const breakdown = await getConfidenceBreakdown({
    matchScore,
    stage,
    hsCode: hsCode || '000000',
    country,
    fieldCount,
  });

  const routing = routeByConfidence(breakdown.overall);
  const thresholds = getConfidenceThresholds();

  return apiSuccess({
    hs_code: hsCode || undefined,
    product_name: productName || undefined,
    country: country || undefined,
    confidence: breakdown.overall,
    grade: breakdown.grade,
    gradeLabel: breakdown.gradeLabel,
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
