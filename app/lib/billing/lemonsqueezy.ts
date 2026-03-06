/**
 * POTAL Billing — LemonSqueezy Client
 *
 * Initializes LemonSqueezy SDK for server-side usage.
 * Requires LEMONSQUEEZY_API_KEY in environment.
 *
 * Replaces Stripe (account suspended). LemonSqueezy = MoR (Merchant of Record).
 * No ITIN/SSN required. 5% + $0.50 per transaction.
 */

import {
  lemonSqueezySetup,
  type Checkout,
} from '@lemonsqueezy/lemonsqueezy.js';

let initialized = false;

export function initLemonSqueezy() {
  if (!initialized) {
    const key = process.env.LEMONSQUEEZY_API_KEY;
    if (!key) {
      throw new Error('LEMONSQUEEZY_API_KEY is not set in environment variables');
    }
    lemonSqueezySetup({ apiKey: key });
    initialized = true;
  }
}

export function getStoreId(): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID is not set in environment variables');
  }
  return storeId;
}

/**
 * POTAL Plans — LemonSqueezy Variant IDs
 *
 * 요금제 구조 (2026-03-06):
 * - Free: 500 calls/month (무료, 전환율 최적화를 위해 축소)
 * - Starter: $9/month, 5,000 calls (소규모 셀러/개발자 진입점)
 * - Growth: $29/month, 25,000 calls (성장하는 셀러)
 * - Enterprise: Custom pricing, unlimited (대형 고객)
 *
 * LemonSqueezy Variant IDs는 환경변수로 관리 (test/live 모드 전환 용이)
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    apiCallsPerMonth: 500,
    variantId: null, // Free plan — no payment
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_STARTER || null,
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_GROWTH || null,
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
    variantId: process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE || null,
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

export type { Checkout };
