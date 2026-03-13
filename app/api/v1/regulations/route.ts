/**
 * POTAL API v1 — /api/v1/regulations
 *
 * Regulation RAG search endpoint.
 * Searches 240-country regulation database using vector similarity.
 *
 * POST /api/v1/regulations
 * Body: {
 *   countryCode: string,    // required — ISO 2-letter code
 *   query: string,          // required — search query
 *   topic?: string,         // optional — filter by topic
 *   limit?: number          // optional — max results (default 5, max 20)
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { searchRegulations, REGULATION_TOPICS } from '@/app/lib/cost-engine/regulation-rag';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

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
    return apiError(
      ApiErrorCode.BAD_REQUEST,
      `Invalid topic "${topic}". Valid topics: ${REGULATION_TOPICS.join(', ')}`
    );
  }

  try {
    const result = await searchRegulations({ countryCode, query, topic, limit });

    return apiSuccess(
      {
        countryCode,
        query,
        topic: topic || null,
        documents: result.documents,
        totalFound: result.totalFound,
      },
      {
        sellerId: context.sellerId,
        plan: context.planId,
      }
    );
  } catch (err) {
    return apiError(
      ApiErrorCode.INTERNAL_ERROR,
      `Regulation search failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { countryCode: "US", query: "import duty on electronics", topic?: "tariff" }'
  );
}
