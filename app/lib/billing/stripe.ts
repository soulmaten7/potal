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
 * 요금제 구조 (2026-03-05 변경):
 * - Free: 500 calls/month (무료, 전환율 최적화를 위해 축소)
 * - Starter: $9/month, 5,000 calls (소규모 셀러/개발자 진입점)
 * - Growth: $29/month, 25,000 calls (성장하는 셀러)
 * - Enterprise: Custom pricing, unlimited (대형 고객)
 *
 * Stripe Price IDs는 환경변수로 관리 (test/live 모드 전환 용이)
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    apiCallsPerMonth: 500,
    stripePriceId: null, // Free plan
    features: [
      '500 API calls / month',
      'Widget embed (light theme)',
      '180+ countries supported',
      'AI-powered HS Code classification',
      'Community support',
    ],
  },
  starter: {
    name: 'Starter',
    priceMonthly: 9,
    apiCallsPerMonth: 5000,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || null,
    features: [
      '5,000 API calls / month',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      'Real-time exchange rates',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    priceMonthly: 29,
    apiCallsPerMonth: 25000,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH || null,
    features: [
      '25,000 API calls / month',
      'Custom widget branding',
      'FTA/preferential rate detection',
      'Batch API (100 items)',
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
