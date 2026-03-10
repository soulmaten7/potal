/**
 * POTAL DDP Checkout — Quote Service
 *
 * Provides DDP (Delivered Duty Paid) price quotes.
 * Sellers use these quotes to display all-inclusive pricing
 * in their own checkout system (Stripe, PayPal, Shopify, etc.).
 *
 * Flow:
 *   1. Seller calls /api/v1/checkout?action=quote
 *   2. POTAL returns DDP breakdown (duties + taxes + fees)
 *   3. Seller adds the DDP amounts to their own checkout
 *   4. Buyer pays one price — no surprise fees at delivery
 */

import type {
  DdpCheckoutInput,
  DdpCheckoutSession,
  DdpPriceBreakdown,
} from './types';
import { calculateDdpPrice } from './ddp-calculator';

// ─── Create DDP Checkout Session (Quote-only) ────

/**
 * Create a DDP checkout session with full price breakdown.
 *
 * Returns a session object containing the DDP quote.
 * Sellers integrate this into their own payment flow.
 */
export async function createDdpCheckoutSession(
  input: DdpCheckoutInput
): Promise<DdpCheckoutSession> {
  const breakdown = await calculateDdpPrice(input);
  const sessionId = `potal_cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    sessionId,
    breakdown,
    status: 'created',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };
}

/**
 * Get DDP price breakdown without creating a session.
 * Useful for displaying prices before checkout.
 */
export async function getDdpQuote(
  input: DdpCheckoutInput
): Promise<DdpPriceBreakdown> {
  return calculateDdpPrice(input);
}
