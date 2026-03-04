/**
 * POTAL API v1 — /api/v1/calculate/batch
 *
 * Batch Total Landed Cost calculation endpoint.
 * Calculate TLC for multiple items in a single request.
 * Max 100 items per request.
 *
 * POST /api/v1/calculate/batch
 * Body: {
 *   items: Array<{
 *     id: string,                    // required — unique ID for mapping results
 *     price: number | string,        // required
 *     shippingPrice?: number,
 *     origin?: string,
 *     shippingType?: string,
 *     zipcode?: string,
 *     hsCode?: string,
 *     destinationCountry?: string
 *   }>,
 *   defaults?: {                     // optional — shared defaults for all items
 *     origin?: string,
 *     zipcode?: string,
 *     destinationCountry?: string
 *   }
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCost, type GlobalCostInput, type GlobalLandedCost } from '@/app/lib/cost-engine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_BATCH_SIZE = 100;

interface BatchItem extends GlobalCostInput {
  id: string;
}

interface BatchDefaults {
  origin?: string;
  zipcode?: string;
  destinationCountry?: string;
}

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // 1. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // 2. Validate items array
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

  // 3. Parse defaults
  const defaults = (body.defaults || {}) as BatchDefaults;

  // 4. Validate each item and calculate
  const results: { id: string; result: GlobalLandedCost }[] = [];
  const errors: { index: number; id?: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;

    // Validate id
    if (!item.id || typeof item.id !== 'string') {
      errors.push({ index: i, error: 'Field "id" is required and must be a string.' });
      continue;
    }

    // Validate price
    if (item.price === undefined || item.price === null || item.price === '') {
      errors.push({ index: i, id: item.id, error: 'Field "price" is required.' });
      continue;
    }

    const priceNum = typeof item.price === 'number'
      ? item.price
      : parseFloat(String(item.price).replace(/[^0-9.-]/g, ''));

    if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0) {
      errors.push({ index: i, id: item.id, error: 'Field "price" must be a valid non-negative number.' });
      continue;
    }

    // Build CostInput with defaults (includes HS Code classification)
    const costInput: GlobalCostInput = {
      price: item.price as string | number,
      shippingPrice: item.shippingPrice !== undefined ? Number(item.shippingPrice) : undefined,
      origin: (typeof item.origin === 'string' ? item.origin : defaults.origin) || undefined,
      shippingType: typeof item.shippingType === 'string' ? item.shippingType : undefined,
      zipcode: (typeof item.zipcode === 'string' ? item.zipcode : defaults.zipcode) || undefined,
      hsCode: typeof item.hsCode === 'string' ? item.hsCode : undefined,
      destinationCountry: (typeof item.destinationCountry === 'string'
        ? item.destinationCountry
        : defaults.destinationCountry) || undefined,
      productName: typeof item.productName === 'string' ? item.productName : undefined,
      productCategory: typeof item.productCategory === 'string' ? item.productCategory : undefined,
    };

    const result = calculateGlobalLandedCost(costInput);
    results.push({ id: item.id, result });
  }

  // 5. Return response
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

// ─── GET Handler (method not allowed) ───────────────

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method with JSON body. See docs: /api/v1/docs'
  );
}
