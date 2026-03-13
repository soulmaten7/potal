/**
 * POTAL API v1 — /api/v1/calculate
 *
 * Single-item Total Landed Cost calculation endpoint.
 * Requires API key (pk_live_ or sk_live_).
 *
 * POST /api/v1/calculate
 * Body: {
 *   price: number | string,        // required
 *   shippingPrice?: number,         // default 0
 *   origin?: string,                // ISO code ("CN") or platform name ("AliExpress")
 *   shippingType?: string,          // "domestic" | "international" | "global"
 *   zipcode?: string,               // US ZIP for sales tax
 *   hsCode?: string,                // HS Code (future use)
 *   destinationCountry?: string,    // default "US"
 *   firmName?: string               // Exporter firm name for AD/CVD matching
 *   shippingTerms?: string,         // Incoterms: "DDP" (default) | "DDU" | "CIF" | "FOB" | "EXW"
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── POST Handler ───────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // 1. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // 2. Validate required field: price
  if (body.price === undefined || body.price === null || body.price === '') {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "price" is required.');
  }

  // 3. Validate price is a number or numeric string
  const priceNum = typeof body.price === 'number'
    ? body.price
    : parseFloat(String(body.price).replace(/[^0-9.-]/g, ''));

  if (isNaN(priceNum) || !isFinite(priceNum) || priceNum < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "price" must be a valid non-negative number.');
  }

  // 4. Validate optional numeric fields
  if (body.shippingPrice !== undefined) {
    const sp = Number(body.shippingPrice);
    if (isNaN(sp) || sp < 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Field "shippingPrice" must be a non-negative number.');
    }
  }

  // 5. Build CostInput (with HS Code classification support)
  const costInput: GlobalCostInput = {
    price: body.price as string | number,
    shippingPrice: body.shippingPrice !== undefined ? Number(body.shippingPrice) : undefined,
    origin: typeof body.origin === 'string' ? body.origin : undefined,
    shippingType: typeof body.shippingType === 'string' ? body.shippingType : undefined,
    zipcode: typeof body.zipcode === 'string' ? body.zipcode : undefined,
    hsCode: typeof body.hsCode === 'string' ? body.hsCode : undefined,
    destinationCountry: typeof body.destinationCountry === 'string' ? body.destinationCountry : undefined,
    productName: typeof body.productName === 'string' ? body.productName : undefined,
    productCategory: typeof body.productCategory === 'string' ? body.productCategory : undefined,
    firmName: typeof body.firmName === 'string' ? body.firmName : undefined,
    shippingTerms: (['DDP', 'DDU', 'CIF', 'FOB', 'EXW'].includes(String(body.shippingTerms || '').toUpperCase())
      ? String(body.shippingTerms).toUpperCase() as GlobalCostInput['shippingTerms']
      : undefined),
  };

  // 6. Calculate (DB-backed global engine — supports 58+ countries)
  try {
    const result = await calculateGlobalLandedCostAsync(costInput);

    // 7. Return response
    return apiSuccess(result, {
      sellerId: context.sellerId,
      plan: context.planId,
    });
  } catch (err) {
    console.error('[calculate] Calculation failed:', err instanceof Error ? err.message : err);
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Calculation failed. Please try again.');
  }
});

// ─── GET Handler (method not allowed) ───────────────

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method with JSON body. See docs: /api/v1/docs'
  );
}
