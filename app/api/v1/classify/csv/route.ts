/**
 * POTAL API v1 — /api/v1/classify/csv
 *
 * Bulk HS code classification via CSV upload.
 *
 * POST /api/v1/classify/csv
 * Content-Type: multipart/form-data
 * Body: file (CSV with product_name column)
 *
 * CSV columns (required): product_name
 * CSV columns (optional): origin_country, category, material, description
 *
 * Returns: JSON with classification results + downloadable CSV
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { parseCsv } from '@/app/lib/csv/parser';
import { generateCsv } from '@/app/lib/csv/exporter';

const PLAN_ROW_LIMITS: Record<string, number> = {
  free: 50,
  basic: 500,
  pro: 5000,
  enterprise: 10000,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENCY = 5;

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Content-Type must be multipart/form-data with a CSV file.');
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Failed to parse form data.');
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'File field "file" is required.');
  }
  if (file.size > MAX_FILE_SIZE) {
    return apiError(ApiErrorCode.BAD_REQUEST, `File exceeds 5MB limit.`);
  }

  // Plan-based row limit
  const plan = (ctx.planId || 'free').toLowerCase();
  const maxRows = PLAN_ROW_LIMITS[plan] || PLAN_ROW_LIMITS.free;

  // Parse CSV
  const csvText = await file.text();
  const parsed = parseCsv(csvText, {
    maxRows,
    requiredColumns: ['product_name'],
    skipEmptyRows: true,
  });

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, parsed.errors.map(e => e.message).join('; '));
  }

  if (parsed.rows.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'CSV has no data rows.');
  }

  // Classify each row (batched concurrency)
  const results: Record<string, unknown>[] = [];
  const errors: { row: number; product_name: string; error: string }[] = [];

  for (let i = 0; i < parsed.rows.length; i += CONCURRENCY) {
    const batch = parsed.rows.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (row, batchIdx) => {
      const rowNum = i + batchIdx + 2; // +2 for 1-indexed + header
      const productName = row.product_name || row.productname || '';
      if (!productName) {
        errors.push({ row: rowNum, product_name: '', error: 'product_name is empty' });
        return;
      }

      try {
        const { classifyProductAsync } = await import('@/app/lib/cost-engine');
        const category = row.category || undefined;
        const result = await classifyProductAsync(productName, category);

        results.push({
          row: rowNum,
          product_name: productName,
          hs_code: result?.hsCode || '',
          confidence: result?.confidence || 0,
          description: result?.description || '',
          method: result?.classificationSource || 'unknown',
          origin: row.origin_country || row.origin || '',
          category: row.category || '',
        });
      } catch (err) {
        errors.push({
          row: rowNum,
          product_name: productName,
          error: err instanceof Error ? err.message : 'Classification failed',
        });
      }
    });

    await Promise.allSettled(promises);
  }

  // Generate result CSV
  const resultCsv = generateCsv({
    columns: [
      { key: 'row', header: 'Row' },
      { key: 'product_name', header: 'Product Name' },
      { key: 'hs_code', header: 'HS Code' },
      { key: 'confidence', header: 'Confidence' },
      { key: 'description', header: 'Description' },
      { key: 'method', header: 'Method' },
      { key: 'origin', header: 'Origin' },
      { key: 'category', header: 'Category' },
    ],
    data: results,
  });

  const avgConfidence = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (Number(r.confidence) || 0), 0) / results.length * 100) / 100
    : 0;

  return apiSuccess({
    results,
    errors: errors.length > 0 ? errors : undefined,
    resultCsv,
    summary: {
      total: parsed.rows.length,
      classified: results.length,
      failed: errors.length,
      avgConfidence,
      fileName: file.name,
    },
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST with multipart/form-data. Upload CSV with column: product_name (required), origin_country, category (optional). Max rows by plan: Free 50, Basic 500, Pro 5000.',
  );
}
