/**
 * POTAL API v1 — /api/v1/classify/batch
 *
 * Batch HS Code classification endpoint.
 * Classify multiple products in a single request.
 * Max 100 items per request.
 *
 * POST /api/v1/classify/batch
 * Body: {
 *   items: Array<{
 *     id: string,                // required — unique ID for mapping results
 *     productName: string,       // required
 *     category?: string
 *   }>,
 * }
 *
 * Returns: { results: [{id, hsCode, description, confidence, confidenceScore, method}], errors, summary }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { classifyProductAsync, calculateConfidenceScore, recordClassificationAudit } from '@/app/lib/cost-engine/ai-classifier';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_BATCH_SIZE = 100;
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

  if (items.length > MAX_BATCH_SIZE) {
    return apiError(
      ApiErrorCode.BAD_REQUEST,
      `Batch size ${items.length} exceeds maximum of ${MAX_BATCH_SIZE} items.`
    );
  }

  const results: {
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
  }[] = [];
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
    const category = typeof item.category === 'string' ? sanitizeText(item.category, 200) : undefined;

    if (!productName) {
      errors.push({ index: i, id: item.id, error: 'productName is empty after sanitization.' });
      continue;
    }

    try {
      const startMs = Date.now();
      const result = await classifyProductAsync(productName, category, context.sellerId);
      const confidence = calculateConfidenceScore(result, productName);
      const processingTimeMs = Date.now() - startMs;

      // Record audit (non-blocking)
      void recordClassificationAudit({
        sellerId: context.sellerId,
        productName,
        productCategory: category,
        result,
        classificationSource: result.classificationSource,
        confidenceScore: confidence,
        processingTimeMs,
      });

      results.push({
        id: item.id,
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
      });
    } catch {
      errors.push({ index: i, id: item.id, error: 'Classification failed.' });
    }
  }

  return apiSuccess(
    {
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: items.length,
        success: results.length,
        failed: errors.length,
      },
    },
    {
      sellerId: context.sellerId,
      plan: context.planId,
    }
  );
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { items: [{ id, productName, category? }] }. Max 100 items.'
  );
}
