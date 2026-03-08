/**
 * POTAL DDP Checkout — Stripe Integration
 *
 * Creates Stripe Checkout Sessions with DDP pricing.
 * Seller's Stripe account receives the product+shipping amount.
 * POTAL collects duties+taxes+service fee for remittance.
 *
 * Requires: STRIPE_SECRET_KEY in environment variables.
 */

import type {
  DdpCheckoutInput,
  DdpCheckoutSession,
  DdpPriceBreakdown,
} from './types';
import { calculateDdpPrice } from './ddp-calculator';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_API = 'https://api.stripe.com/v1';

// ─── Stripe API Helper ──────────────────────────────

async function stripePost(
  endpoint: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe API error: ${res.status} ${err}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Create Checkout Session ────────────────────────

/**
 * Create a DDP checkout session.
 *
 * 1. Calculate DDP breakdown
 * 2. Create Stripe Checkout Session with line items
 * 3. Return session with checkout URL
 */
export async function createDdpCheckoutSession(
  input: DdpCheckoutInput
): Promise<DdpCheckoutSession> {
  // Calculate DDP pricing
  const breakdown = await calculateDdpPrice(input);
  const sessionId = `potal_cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // If Stripe is not configured, return session without Stripe
  if (!STRIPE_SECRET_KEY) {
    return {
      sessionId,
      breakdown,
      status: 'created',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };
  }

  // Build Stripe line items
  const lineItems: Record<string, string> = {};
  let idx = 0;

  // Product items
  for (const item of breakdown.itemBreakdowns) {
    lineItems[`line_items[${idx}][price_data][currency]`] = breakdown.currency.toLowerCase();
    lineItems[`line_items[${idx}][price_data][product_data][name]`] = item.productName;
    lineItems[`line_items[${idx}][price_data][unit_amount]`] = String(Math.round(item.unitPrice * 100));
    lineItems[`line_items[${idx}][quantity]`] = String(item.quantity);
    idx++;
  }

  // Shipping as line item
  if (breakdown.shippingCost > 0) {
    lineItems[`line_items[${idx}][price_data][currency]`] = breakdown.currency.toLowerCase();
    lineItems[`line_items[${idx}][price_data][product_data][name]`] = 'Shipping';
    lineItems[`line_items[${idx}][price_data][unit_amount]`] = String(Math.round(breakdown.shippingCost * 100));
    lineItems[`line_items[${idx}][quantity]`] = '1';
    idx++;
  }

  // Import duties + taxes as single line item
  const dutiesAndTaxes = breakdown.importDuty + breakdown.vat + breakdown.customsFee + breakdown.serviceFee;
  if (dutiesAndTaxes > 0) {
    lineItems[`line_items[${idx}][price_data][currency]`] = breakdown.currency.toLowerCase();
    lineItems[`line_items[${idx}][price_data][product_data][name]`] = 'Import Duties, Taxes & Customs Fees (DDP)';
    lineItems[`line_items[${idx}][price_data][product_data][description]`] = 'Pre-paid import duties, VAT/GST, and customs processing. No additional fees at delivery.';
    lineItems[`line_items[${idx}][price_data][unit_amount]`] = String(Math.round(dutiesAndTaxes * 100));
    lineItems[`line_items[${idx}][quantity]`] = '1';
    idx++;
  }

  // Create Stripe Checkout Session
  const stripeBody: Record<string, string> = {
    ...lineItems,
    'mode': 'payment',
    'success_url': input.successUrl,
    'cancel_url': input.cancelUrl,
    [`metadata[potal_session_id]`]: sessionId,
    [`metadata[seller_id]`]: input.sellerId,
    [`metadata[origin]`]: input.originCountry,
    [`metadata[destination]`]: input.destinationCountry,
    [`metadata[duty_amount]`]: String(breakdown.importDuty),
    [`metadata[vat_amount]`]: String(breakdown.vat),
  };

  if (input.buyerEmail) {
    stripeBody['customer_email'] = input.buyerEmail;
  }

  const stripeSession = await stripePost('/checkout/sessions', stripeBody);

  return {
    sessionId,
    stripeSessionId: String(stripeSession.id || ''),
    checkoutUrl: String(stripeSession.url || ''),
    breakdown,
    status: 'created',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

/**
 * Get DDP price breakdown without creating a Stripe session.
 * Useful for displaying prices before checkout.
 */
export async function getDdpQuote(
  input: DdpCheckoutInput
): Promise<DdpPriceBreakdown> {
  return calculateDdpPrice(input);
}
