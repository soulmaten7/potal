/**
 * POTAL API v1 — /api/v1/calculate/csv
 *
 * Upload a CSV file for batch TLC calculation.
 * Max 500 rows per file. Returns JSON results.
 *
 * POST /api/v1/calculate/csv
 * Content-Type: multipart/form-data
 * Body: file (CSV), defaults (optional JSON string)
 *
 * CSV columns:
 *   id (required), price (required), shippingPrice, origin, destinationCountry,
 *   hsCode, productName, zipcode, shippingType, productCategory
 *
 * Response format same as /api/v1/calculate/batch
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync, type GlobalCostInput, type GlobalLandedCost } from '@/app/lib/cost-engine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_CSV_ROWS = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── CSV Parser (simple, no external deps) ──────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length && rows.length < MAX_CSV_ROWS; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const contentType = req.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Content-Type must be multipart/form-data with a CSV file.');
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Failed to parse form data.');
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'File field "file" is required. Upload a CSV file.');
  }

  if (file.size > MAX_FILE_SIZE) {
    return apiError(ApiErrorCode.BAD_REQUEST, `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of 5MB.`);
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'File must be a .csv or .txt file.');
  }

  // Parse defaults from form data
  interface Defaults { origin?: string; destinationCountry?: string; zipcode?: string }
  let defaults: Defaults = {};
  const defaultsStr = formData.get('defaults');
  if (defaultsStr && typeof defaultsStr === 'string') {
    try {
      defaults = JSON.parse(defaultsStr) as Defaults;
    } catch {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Field "defaults" must be valid JSON.');
    }
  }

  // Read and parse CSV
  const csvText = await file.text();
  const rows = parseCSV(csvText);

  if (rows.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'CSV file is empty or has no data rows. Required headers: id, price');
  }

  if (rows.length > MAX_CSV_ROWS) {
    return apiError(ApiErrorCode.BAD_REQUEST, `CSV has more than ${MAX_CSV_ROWS} rows. Split into multiple files.`);
  }

  // Check required columns
  const firstRow = rows[0];
  if (!('id' in firstRow) || !('price' in firstRow)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'CSV must have "id" and "price" columns. Got columns: ' + Object.keys(firstRow).join(', '));
  }

  // Process rows
  const results: { id: string; result: GlobalLandedCost }[] = [];
  const errors: { row: number; id?: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const id = row.id;

    if (!id) {
      errors.push({ row: i + 2, error: 'Missing "id" value.' });
      continue;
    }

    const priceStr = row.price || row.unitprice || row.unit_price || '';
    const priceNum = parseFloat(priceStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push({ row: i + 2, id, error: `Invalid price: "${priceStr}"` });
      continue;
    }

    const costInput: GlobalCostInput = {
      price: priceNum,
      shippingPrice: row.shippingprice || row.shipping_price ? parseFloat(row.shippingprice || row.shipping_price) : undefined,
      origin: row.origin || defaults.origin || undefined,
      destinationCountry: row.destinationcountry || row.destination_country || row.destination || defaults.destinationCountry || undefined,
      hsCode: row.hscode || row.hs_code || undefined,
      productName: row.productname || row.product_name || row.name || undefined,
      zipcode: row.zipcode || row.zip_code || row.zip || defaults.zipcode || undefined,
      shippingType: row.shippingtype || row.shipping_type || undefined,
      productCategory: row.productcategory || row.product_category || row.category || undefined,
    };

    try {
      const result = await calculateGlobalLandedCostAsync(costInput);
      results.push({ id, result });
    } catch (err) {
      errors.push({ row: i + 2, id, error: err instanceof Error ? err.message : 'Calculation failed' });
    }
  }

  return apiSuccess(
    {
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: rows.length,
        success: results.length,
        failed: errors.length,
        fileName: file.name,
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
    'Use POST with multipart/form-data. Upload a CSV file with columns: id, price, origin, destinationCountry, hsCode, productName. Max 500 rows.'
  );
}
