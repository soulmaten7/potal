import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { submitFeedback, getFeedbackStats } from '@/app/lib/classification/feedback-loop';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const originalQuery = typeof body.original_query === 'string' ? body.original_query.trim() : '';
  const predictedHs6 = typeof body.predicted_hs6 === 'string' ? body.predicted_hs6.trim() : '';
  const correctedHs6 = typeof body.corrected_hs6 === 'string' ? body.corrected_hs6.trim() : undefined;
  const feedbackType = typeof body.feedback_type === 'string' ? body.feedback_type : '';

  if (!originalQuery || !predictedHs6) return apiError(ApiErrorCode.BAD_REQUEST, 'original_query and predicted_hs6 required.');
  if (!['correct', 'incorrect', 'ambiguous'].includes(feedbackType)) return apiError(ApiErrorCode.BAD_REQUEST, 'feedback_type must be correct|incorrect|ambiguous.');

  try {
    await submitFeedback({
      originalQuery, predictedHs6, correctedHs6,
      userId: ctx.sellerId,
      feedbackType: feedbackType as 'correct' | 'incorrect' | 'ambiguous',
    });
    return apiSuccess({ submitted: true }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Failed to submit feedback.');
  }
});

export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  try {
    const stats = await getFeedbackStats();
    return apiSuccess(stats, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Failed to get stats.');
  }
});
