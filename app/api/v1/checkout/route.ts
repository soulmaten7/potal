/**
 * POTAL API v1 — /api/v1/checkout
 *
 * DDP (Delivered Duty Paid) Checkout — Quote & Session.
 *
 * POST /api/v1/checkout
 *   → Create DDP checkout session (returns quote with full breakdown)
 *
 * POST /api/v1/checkout?action=quote
 *   → Get DDP price quote only (same calculation, lighter response)
 *
 * Sellers use the returned breakdown to display all-inclusive DDP pricing
 * in their own checkout system (Stripe, PayPal, Shopify Payments, etc.).
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { createDdpCheckoutSession, getDdpQuote } from '@/app/lib/checkout';
import type { DdpCheckoutInput, DdpCheckoutItem } from '@/app/lib/checkout';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_ITEMS = 50;

function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>{}|\\]/g, '').trim().slice(0, maxLen);
}

function parseNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && isFinite(val) && val >= 0) return val;
  if (typeof val === 'string') { const n = parseFloat(val); if (isFinite(n) && n >= 0) return n; }
  return fallback;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'checkout';

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // Validate required fields
  const originCountry = sanitize(body.originCountry, 2).toUpperCase();
  const destinationCountry = sanitize(body.destinationCountry, 2).toUpperCase();

  if (!originCountry || originCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'originCountry must be 2-letter ISO code.');
  }
  if (!destinationCountry || destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'destinationCountry must be 2-letter ISO code.');
  }

  // Validate items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'items array is required with at least 1 item.');
  }
  if (body.items.length > MAX_ITEMS) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_ITEMS} items per checkout.`);
  }

  const items: DdpCheckoutItem[] = [];
  for (let i = 0; i < body.items.length; i++) {
    const raw = body.items[i] as Record<string, unknown>;
    if (!raw || typeof raw !== 'object') {
      return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i} is invalid.`);
    }
    const productName = sanitize(raw.productName);
    const price = parseNum(raw.price);
    const quantity = parseNum(raw.quantity);

    if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: productName required.`);
    if (price <= 0) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: price must be > 0.`);
    if (quantity <= 0) return apiError(ApiErrorCode.BAD_REQUEST, `Item ${i}: quantity must be > 0.`);

    items.push({
      productName,
      price,
      quantity,
      hsCode: sanitize(raw.hsCode, 12) || undefined,
      category: sanitize(raw.category, 200) || undefined,
      countryOfOrigin: sanitize(raw.countryOfOrigin, 2).toUpperCase() || undefined,
      weightKg: raw.weightKg ? parseNum(raw.weightKg) : undefined,
      imageUrl: sanitize(raw.imageUrl, 2000) || undefined,
    });
  }

  const input: DdpCheckoutInput = {
    sellerId: context.sellerId,
    originCountry,
    destinationCountry,
    zipcode: sanitize(body.zipcode, 20) || undefined,
    items,
    shippingCost: parseNum(body.shippingCost),
    insuranceCost: parseNum(body.insuranceCost),
    buyerEmail: sanitize(body.buyerEmail, 200) || undefined,
    buyerName: sanitize(body.buyerName, 200) || undefined,
    currency: sanitize(body.currency, 3).toUpperCase() || 'USD',
    successUrl: sanitize(body.successUrl, 2000) || undefined,
    cancelUrl: sanitize(body.cancelUrl, 2000) || undefined,
    metadata: body.metadata && typeof body.metadata === 'object'
      ? Object.fromEntries(
          Object.entries(body.metadata as Record<string, unknown>)
            .slice(0, 20)
            .map(([k, v]) => [k.slice(0, 50), String(v).slice(0, 500)])
        )
      : undefined,
  };

  try {
    if (action === 'quote') {
      const quote = await getDdpQuote(input);
      return apiSuccess({ quote }, {
        sellerId: context.sellerId,
        plan: context.planId,
        action: 'quote',
      });
    }

    const session = await createDdpCheckoutSession(input);
    return apiSuccess(session, {
      sellerId: context.sellerId,
      plan: context.planId,
      action: 'checkout',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, msg);
  }
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST. Body: { originCountry, destinationCountry, items: [{productName, price, quantity}], shippingCost }. Add ?action=quote for price-only breakdown.'
  );
}
