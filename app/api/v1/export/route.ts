/**
 * POTAL API v1 — /api/v1/export
 *
 * Export calculation results as CSV download.
 *
 * POST /api/v1/export
 * Body: {
 *   items: Array<{
 *     id: string,
 *     price: number | string,
 *     shippingPrice?: number,
 *     origin?: string,
 *     destinationCountry?: string,
 *     hsCode?: string,
 *     productName?: string,
 *     productCategory?: string,
 *     shippingTerms?: string
 *   }>,
 *   defaults?: { origin?, destinationCountry?, shippingTerms? },
 *   format?: "csv" | "json"   // default: "csv"
 * }
 *
 * Returns: CSV file download or JSON array
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync, type GlobalCostInput, type GlobalLandedCost } from '@/app/lib/cost-engine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_EXPORT_ITEMS = 500;

// ─── CSV Builder ────────────────────────────────────

function escapeCSV(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(results: { id: string; result: GlobalLandedCost }[]): string {
  const headers = [
    'id',
    'destination_country',
    'product_price',
    'shipping_cost',
    'import_duty',
    'vat_gst',
    'vat_label',
    'processing_fee',
    'insurance',
    'brokerage_fee',
    'total_landed_cost',
    'hs_code',
    'hs_description',
    'classification_method',
    'duty_rate_source',
    'duty_rate_percent',
    'vat_rate_percent',
    'de_minimis_applied',
    'fta_applied',
    'fta_name',
    'shipping_terms',
    'confidence_score',
    'accuracy_level',
    'currency',
    'local_total',
    'local_currency',
    'exchange_rate',
  ];

  const lines = [headers.join(',')];

  for (const { id, result } of results) {
    const row = [
      escapeCSV(id),
      escapeCSV(result.destinationCountry),
      escapeCSV(result.productPrice),
      escapeCSV(result.shippingCost),
      escapeCSV(result.importDuty),
      escapeCSV(result.vat),
      escapeCSV(result.vatLabel),
      escapeCSV(result.mpf),
      escapeCSV(result.insurance),
      escapeCSV(result.brokerageFee),
      escapeCSV(result.totalLandedCost),
      escapeCSV(result.hsClassification?.hsCode),
      escapeCSV(result.hsClassification?.description),
      escapeCSV(result.classificationSource),
      escapeCSV(result.dutyRateSource),
      escapeCSV(result.vatRate !== undefined ? (result.vatRate * 100).toFixed(2) : ''),
      escapeCSV(result.vatRate !== undefined ? (result.vatRate * 100).toFixed(2) : ''),
      escapeCSV(result.deMinimisApplied),
      escapeCSV(result.ftaApplied?.hasFta),
      escapeCSV(result.ftaApplied?.ftaName),
      escapeCSV(result.shippingTerms),
      escapeCSV(result.confidenceScore),
      escapeCSV(result.accuracyGuarantee?.level),
      escapeCSV(result.destinationCurrency),
      escapeCSV(result.localCurrency?.totalLandedCost),
      escapeCSV(result.localCurrency?.currency),
      escapeCSV(result.localCurrency?.exchangeRate),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// ─── POST Handler ───────────────────────────────────

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

  if (items.length > MAX_EXPORT_ITEMS) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Export size ${items.length} exceeds maximum of ${MAX_EXPORT_ITEMS} items.`);
  }

  const defaults = (body.defaults || {}) as Record<string, string>;
  const format = String(body.format || 'csv').toLowerCase();

  // Calculate all items
  const results: { id: string; result: GlobalLandedCost }[] = [];
  const errors: { index: number; id?: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;

    if (!item.id || typeof item.id !== 'string') {
      errors.push({ index: i, error: 'Field "id" is required.' });
      continue;
    }

    if (item.price === undefined || item.price === null) {
      errors.push({ index: i, id: item.id, error: 'Field "price" is required.' });
      continue;
    }

    const priceNum = typeof item.price === 'number'
      ? item.price
      : parseFloat(String(item.price).replace(/[^0-9.-]/g, ''));

    if (isNaN(priceNum) || priceNum < 0) {
      errors.push({ index: i, id: item.id, error: 'Invalid price value.' });
      continue;
    }

    const costInput: GlobalCostInput = {
      price: priceNum,
      shippingPrice: item.shippingPrice !== undefined ? Number(item.shippingPrice) : undefined,
      origin: (typeof item.origin === 'string' ? item.origin : defaults.origin) || undefined,
      destinationCountry: (typeof item.destinationCountry === 'string' ? item.destinationCountry : defaults.destinationCountry) || undefined,
      hsCode: typeof item.hsCode === 'string' ? item.hsCode : undefined,
      productName: typeof item.productName === 'string' ? item.productName : undefined,
      productCategory: typeof item.productCategory === 'string' ? item.productCategory : undefined,
      shippingTerms: (() => {
        const raw = String(item.shippingTerms || defaults.shippingTerms || '').toUpperCase();
        return (['DDP', 'DDU', 'CIF', 'FOB', 'EXW'].includes(raw) ? raw : undefined) as GlobalCostInput['shippingTerms'];
      })(),
    };

    try {
      const result = await calculateGlobalLandedCostAsync(costInput);
      results.push({ id: item.id, result });
    } catch (err) {
      errors.push({ index: i, id: item.id, error: err instanceof Error ? err.message : 'Calculation failed' });
    }
  }

  // Return as CSV download
  if (format === 'csv') {
    const csv = buildCSV(results);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="potal-export-${timestamp}.csv"`,
        'X-Export-Total': String(results.length),
        'X-Export-Errors': String(errors.length),
      },
    });
  }

  // Return as JSON (same format as batch)
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
    'Use POST method. Body: { items: [{id, price, ...}], format: "csv"|"json" }. Returns CSV file download.'
  );
}
