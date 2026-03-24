/**
 * POTAL API v1 — /api/v1/import
 * Batch import: CSV/JSON → bulk calculate landed costs
 * Concurrent processing (10 parallel) for performance.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync, type GlobalCostInput } from '@/app/lib/cost-engine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_IMPORT = 500;
const CONCURRENCY = 10;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const contentType = req.headers.get('content-type') || '';

  let items: Record<string, string>[];

  if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    const text = await req.text();
    items = parseCSV(text);
  } else {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }
    if (!Array.isArray(body.items)) return apiError(ApiErrorCode.BAD_REQUEST, 'items array required.');
    items = body.items as Record<string, string>[];
  }

  if (items.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'No items to import.');
  if (items.length > MAX_IMPORT) return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_IMPORT} items per import.`);

  // Validate all items first
  const validItems: { index: number; id: string; input: GlobalCostInput }[] = [];
  const results: { index: number; id: string; success: boolean; result?: unknown; error?: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item.id || item.sku || item.product_name || `row_${i + 1}`;
    const price = parseFloat(item.price || item.declared_value || '0');

    if (!price || price <= 0) {
      results.push({ index: i, id, success: false, error: 'Invalid or missing price.' });
      continue;
    }

    const input: GlobalCostInput = {
      price,
      shippingPrice: parseFloat(item.shipping_price || item.shipping || '0') || undefined,
      origin: item.origin || item.origin_country || undefined,
      destinationCountry: item.destination || item.destination_country || undefined,
      hsCode: item.hs_code || item.hsCode || undefined,
      productName: item.product_name || item.name || undefined,
      productCategory: item.product_category || item.category || undefined,
      shippingTerms: (['DDP', 'DDU', 'CIF', 'FOB', 'EXW'].includes((item.shipping_terms || '').toUpperCase())
        ? (item.shipping_terms || '').toUpperCase() as GlobalCostInput['shippingTerms']
        : undefined),
      weight_kg: parseFloat(item.weight_kg || '0') || undefined,
      quantity: parseInt(item.quantity || '1', 10) || undefined,
    };

    validItems.push({ index: i, id, input });
  }

  // Process with concurrency
  for (let start = 0; start < validItems.length; start += CONCURRENCY) {
    const chunk = validItems.slice(start, start + CONCURRENCY);
    const chunkResults = await Promise.allSettled(
      chunk.map(async ({ index, id, input }) => {
        const result = await calculateGlobalLandedCostAsync(input);
        return { index, id, success: true as const, result };
      })
    );

    for (let j = 0; j < chunkResults.length; j++) {
      const settled = chunkResults[j];
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        const vi = chunk[j];
        results.push({
          index: vi.index, id: vi.id, success: false,
          error: settled.reason instanceof Error ? settled.reason.message : 'Calculation failed',
        });
      }
    }
  }

  // Sort results by original index
  results.sort((a, b) => a.index - b.index);

  return apiSuccess({
    imported: items.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  }, { sellerId: ctx.sellerId });
});
