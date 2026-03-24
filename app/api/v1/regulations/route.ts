/**
 * POTAL API v1 — /api/v1/regulations
 *
 * Regulation RAG endpoints.
 * POST — Search regulations by semantic similarity
 * GET  — List regulations by country/topic
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { searchRegulations, insertRegulation, REGULATION_TOPICS } from '@/app/lib/cost-engine/regulation-rag';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

/** POST — Search regulations */
export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const action = typeof body.action === 'string' ? body.action : 'search';

  // Insert action (admin only)
  if (action === 'insert') {
    const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase().trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!countryCode || countryCode.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'countryCode must be 2-letter ISO code.');
    if (!title) return apiError(ApiErrorCode.BAD_REQUEST, 'title is required.');
    if (!content) return apiError(ApiErrorCode.BAD_REQUEST, 'content is required.');

    const result = await insertRegulation({
      countryCode, topic, title, content,
      sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
      effectiveDate: typeof body.effectiveDate === 'string' ? body.effectiveDate : undefined,
    });

    if (!result.success) return apiError(ApiErrorCode.BAD_REQUEST, result.error || 'Insert failed.');
    return apiSuccess({ inserted: result.id }, { sellerId: context.sellerId });
  }

  // Default: search
  const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase().trim() : '';
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : undefined;
  const limit = typeof body.limit === 'number' ? Math.min(Math.max(body.limit, 1), 20) : 5;

  if (!countryCode || countryCode.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"countryCode" must be a 2-letter ISO code.');
  }
  if (!query) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"query" is required.');
  }
  if (query.length > 500) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"query" must be under 500 characters.');
  }
  if (topic && !REGULATION_TOPICS.includes(topic as typeof REGULATION_TOPICS[number])) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Invalid topic "${topic}". Valid: ${REGULATION_TOPICS.join(', ')}`);
  }

  try {
    const result = await searchRegulations({ countryCode, query, topic, limit });

    return apiSuccess({
      countryCode,
      query,
      topic: topic || null,
      documents: result.documents,
      totalFound: result.totalFound,
      meta: result.meta,
    }, { sellerId: context.sellerId, plan: context.planId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Regulation search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
});

/** GET — List available topics */
export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  return apiSuccess({
    topics: REGULATION_TOPICS,
    topicCount: REGULATION_TOPICS.length,
    usage: 'POST /api/v1/regulations with { countryCode, query, topic? }',
  }, { sellerId: ctx.sellerId });
});
