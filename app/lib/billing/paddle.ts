/**
 * POTAL Billing — Paddle Client
 *
 * Paddle = MoR (Merchant of Record). 세금/인보이스 자동 처리.
 * LemonSqueezy 거절(세션 35) → Paddle 전환(세션 36).
 *
 * 환경변수:
 *   PADDLE_API_KEY — Paddle API Key (Sandbox or Live)
 *   PADDLE_WEBHOOK_SECRET — Paddle Webhook Secret Key
 *   PADDLE_ENVIRONMENT — "sandbox" | "production"
 *   PADDLE_PRICE_BASIC_MONTHLY / PADDLE_PRICE_BASIC_ANNUAL
 *   PADDLE_PRICE_PRO_MONTHLY / PADDLE_PRICE_PRO_ANNUAL
 *   PADDLE_PRICE_ENTERPRISE_MONTHLY / PADDLE_PRICE_ENTERPRISE_ANNUAL
 */

export type PlanId = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * POTAL Plans — 신 요금제 (세션 28 확정)
 *
 * Alex Hormozi 전략: "중간은 죽음"
 * AI 원가 건당 $0.001 (캐시 $0.0003) → 33개 기능 전부 포함해도 건당 $0.008 이하
 * Basic $20/2K에서 마진 97%
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    apiCallsPerMonth: 100,
    overageRate: 0,
    paddlePriceIdMonthly: null,
    paddlePriceIdAnnual: null,
    ratePerMinute: 30,
    features: [
      '100 API calls / month',
      'Widget embed (light theme)',
      '240 countries supported',
      'AI-powered HS Code classification',
      'Basic duty & tax calculation',
      'Community support',
    ],
  },
  basic: {
    name: 'Basic',
    priceMonthly: 20,
    priceAnnual: 192,
    apiCallsPerMonth: 2000,
    overageRate: 0.015,
    paddlePriceIdMonthly: process.env.PADDLE_PRICE_BASIC_MONTHLY || null,
    paddlePriceIdAnnual: process.env.PADDLE_PRICE_BASIC_ANNUAL || null,
    ratePerMinute: 60,
    features: [
      '2,000 API calls / month',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      'Real-time exchange rates',
      'FTA & preferential rate detection',
      'Anti-dumping / countervailing duty alerts',
      'Sub-national tax (US/CA/BR/IN/AU + 7 more)',
      '30+ language support',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 80,
    priceAnnual: 768,
    apiCallsPerMonth: 10000,
    overageRate: 0.012,
    paddlePriceIdMonthly: process.env.PADDLE_PRICE_PRO_MONTHLY || null,
    paddlePriceIdAnnual: process.env.PADDLE_PRICE_PRO_ANNUAL || null,
    ratePerMinute: 120,
    features: [
      '10,000 API calls / month',
      'Custom widget branding',
      'Batch API (100 items)',
      'Webhook notifications',
      'Advanced analytics dashboard',
      'Priority email support',
      'All Basic features included',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 300,
    priceAnnual: 2880,
    apiCallsPerMonth: 50000,
    overageRate: 0.01,
    paddlePriceIdMonthly: process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY || null,
    paddlePriceIdAnnual: process.env.PADDLE_PRICE_ENTERPRISE_ANNUAL || null,
    ratePerMinute: -1,
    features: [
      '50,000+ API calls / month',
      'White-label widget',
      'Dedicated infrastructure',
      'SSO & team management',
      'SLA guarantee (99.99%)',
      'Custom integrations',
      'Bulk calculation API',
      'Dedicated account manager',
      'All Pro features included',
    ],
  },
} as const;

/**
 * Paddle API 헤더 생성
 */
export function getPaddleHeaders(): Record<string, string> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not set in environment variables');
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Paddle API Base URL
 */
export function getPaddleBaseUrl(): string {
  const env = process.env.PADDLE_ENVIRONMENT || 'sandbox';
  return env === 'production'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com';
}

/**
 * Paddle Price ID → POTAL Plan ID 매핑
 */
export function mapPriceToPlan(priceId: string): PlanId {
  if (priceId === process.env.PADDLE_PRICE_BASIC_MONTHLY || priceId === process.env.PADDLE_PRICE_BASIC_ANNUAL) return 'basic';
  if (priceId === process.env.PADDLE_PRICE_PRO_MONTHLY || priceId === process.env.PADDLE_PRICE_PRO_ANNUAL) return 'pro';
  if (priceId === process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY || priceId === process.env.PADDLE_PRICE_ENTERPRISE_ANNUAL) return 'enterprise';
  return 'free';
}
