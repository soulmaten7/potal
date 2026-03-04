/**
 * POTAL Billing — Stripe Client
 *
 * Singleton Stripe instance for server-side usage.
 * Requires STRIPE_SECRET_KEY in environment.
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(key, {
      typescript: true,
    });
  }
  return stripeInstance;
}

/**
 * POTAL Plans — Stripe Price IDs
 *
 * These are set via environment variables so we can switch
 * between Stripe test mode and live mode easily.
 *
 * STRIPE_PRICE_GROWTH = price_xxx (Growth plan $49/mo)
 * STRIPE_PRICE_ENTERPRISE = price_xxx (Enterprise custom)
 *
 * Starter plan is free — no Stripe price needed.
 */
export const PLAN_CONFIG = {
  starter: {
    name: 'Starter',
    priceMonthly: 0,
    apiCallsPerMonth: 5000,
    stripePriceId: null, // Free plan
    features: [
      '5,000 API calls / month',
      'Widget embed (light theme)',
      '139 countries supported',
      'Community support',
    ],
  },
  growth: {
    name: 'Growth',
    priceMonthly: 49,
    apiCallsPerMonth: 50000,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH || null,
    features: [
      '50,000 API calls / month',
      'Widget embed (all themes)',
      'Custom widget branding',
      'HS Code classification API',
      'Priority email support',
      'Advanced analytics',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: null, // Custom pricing
    apiCallsPerMonth: -1, // Unlimited
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    features: [
      'Unlimited API calls',
      'White-label widget',
      'Dedicated infrastructure',
      'SSO & team management',
      'SLA guarantee (99.99%)',
      'Custom integrations',
    ],
  },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;
