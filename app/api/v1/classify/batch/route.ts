/**
 * POTAL API v1 — /api/v1/classify/batch
 *
 * Batch HS Code classification endpoint.
 * Supports 9-field input for GRI pipeline classification.
 * Plan-based limits: Free=50, Basic=100, Pro=500, Enterprise=5000
 * Concurrent processing (10 parallel) for performance.
 *
 * POST /api/v1/classify/batch
 * Body: {
 *   items: Array<{
 *     id: string,                // required — unique ID for mapping results
 *     productName: string,       // required
 *     material?: string,         // 9-field: WCO material group
 *     category?: string,         // 9-field: product category
 *     description?: string,
 *     processing?: string,
 *     composition?: string,
 *     weight_spec?: string,
 *     price?: number,
 *     origin_country?: string,
 *   }>,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, recordClassificationAudit } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const PLAN_BATCH_LIMITS: Record<string, number> = {
  free: 50,
  basic: 100,
  pro: 500,
  enterprise: 5000,
};
const DEFAULT_BATCH_LIMIT = 50;
const CONCURRENCY = 10;
const MAX_TEXT_LENGTH = 500;

function sanitizeText(input: string, maxLen: number = MAX_TEXT_LENGTH): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[<>{}|\\]/g, '')
    .trim()
    .slice(0, maxLen);
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "items" must be a non-empty array.');
  }

  // Plan-based batch limit
  const batchLimit = PLAN_BATCH_LIMITS[context.planId] || DEFAULT_BATCH_LIMIT;
  if (items.length > batchLimit) {
    return apiError(
      ApiErrorCode.BAD_REQUEST,
      `Batch size ${items.length} exceeds your plan limit of ${batchLimit} items (${context.planId} plan).`
    );
  }

  // Validate all items first
  const validItems: { index: number; id: string; productName: string; item: Record<string, unknown> }[] = [];
  const errors: { index: number; id?: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;

    if (!item.id || typeof item.id !== 'string') {
      errors.push({ index: i, error: 'Field "id" is required and must be a string.' });
      continue;
    }

    if (!item.productName || typeof item.productName !== 'string') {
      errors.push({ index: i, id: item.id, error: 'Field "productName" is required.' });
      continue;
    }

    const productName = sanitizeText(item.productName);
    if (!productName) {
      errors.push({ index: i, id: item.id, error: 'productName is empty after sanitization.' });
      continue;
    }

    validItems.push({ index: i, id: item.id, productName, item });
  }

  // Deduplicate by productName (classify once, copy result)
  const uniqueNames = new Map<string, number>(); // name → first index in validItems
  const deduped: typeof validItems = [];
  for (const vi of validItems) {
    const key = vi.productName.toLowerCase();
    if (!uniqueNames.has(key)) {
      uniqueNames.set(key, deduped.length);
      deduped.push(vi);
    }
  }

  // Process with concurrency
  interface BatchResult {
    id: string;
    hsCode: string;
    description: string;
    confidence: number;
    confidenceScore: {
      overall: number;
      grade: string;
      gradeLabel: string;
      reviewRecommended: boolean;
    };
    method: string;
    countryOfOrigin?: string;
    alternatives?: { hsCode: string; description: string; confidence: number }[];
    fieldsProvided?: number;
  }

  const results: BatchResult[] = [];
  const ITEM_TIMEOUT_MS = 10000; // 10s per item

  for (let start = 0; start < deduped.length; start += CONCURRENCY) {
    const chunk = deduped.slice(start, start + CONCURRENCY);
    const chunkResults = await Promise.allSettled(
      chunk.map(async ({ id, productName, item }) => {
        const category = typeof item.category === 'string' ? sanitizeText(item.category, 200) : undefined;
        const startMs = Date.now();
        const result = await Promise.race([
          classifyProductAsync(productName, category, context.sellerId),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Classification timeout')), ITEM_TIMEOUT_MS)),
        ]);
        const confidence = calculateConfidenceScore(result, productName);
        const processingTimeMs = Date.now() - startMs;

        // Count provided fields for field validation context
        const fieldKeys = ['productName', 'material', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price', 'origin_country'];
        const fieldsProvided = fieldKeys.filter(k => item[k] !== undefined && item[k] !== null && item[k] !== '').length;

        // Audit (fire-and-forget)
        void recordClassificationAudit({
          sellerId: context.sellerId,
          productName,
          productCategory: category,
          result,
          classificationSource: result.classificationSource,
          confidenceScore: confidence,
          processingTimeMs,
        });

        return {
          id,
          hsCode: result.hsCode,
          description: result.description,
          confidence: result.confidence,
          confidenceScore: {
            overall: confidence.overall,
            grade: confidence.grade,
            gradeLabel: confidence.gradeLabel,
            reviewRecommended: confidence.reviewRecommended,
          },
          method: result.classificationSource,
          countryOfOrigin: result.countryOfOrigin,
          alternatives: result.alternatives,
          fieldsProvided,
        } as BatchResult;
      })
    );

    for (let j = 0; j < chunkResults.length; j++) {
      const settled = chunkResults[j];
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        const vi = chunk[j];
        errors.push({ index: vi.index, id: vi.id, error: 'Classification failed.' });
      }
    }
  }

  // Copy results for deduplicated items
  const finalResults: BatchResult[] = [];
  for (const vi of validItems) {
    const key = vi.productName.toLowerCase();
    const existing = results.find(r => r.id === vi.id);
    if (existing) {
      finalResults.push(existing);
    } else {
      // Find result from deduped original
      const dedupIdx = uniqueNames.get(key);
      if (dedupIdx !== undefined) {
        const original = results.find(r => r.id === deduped[dedupIdx].id);
        if (original) {
          finalResults.push({ ...original, id: vi.id });
        }
      }
    }
  }

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {};
  for (const r of finalResults) {
    sourceBreakdown[r.method] = (sourceBreakdown[r.method] || 0) + 1;
  }

  const avgConfidence = finalResults.length > 0
    ? Math.round(finalResults.reduce((sum, r) => sum + r.confidence, 0) / finalResults.length * 1000) / 1000
    : 0;

  return apiSuccess(
    {
      results: finalResults,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: items.length,
        classified: finalResults.length,
        failed: errors.length,
        avgConfidence,
        deduplicated: validItems.length - deduped.length,
        sourceBreakdown,
        batchLimit,
        plan: context.planId,
      },
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { items: [{ id, productName, material?, category?, ... }] }. Limits: Free=50, Basic=100, Pro=500, Enterprise=5000.'
  );
}
