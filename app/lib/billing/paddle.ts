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
 * POTAL Plans — Forever Free (CW22 확정)
 *
 * 모든 기능 무료. 100K calls/month soft cap (DDoS 방지).
 * Enterprise = Contact Us only.
 * basic/pro는 하위 호환성 유지용 (실제 동일 = Forever Free).
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Forever Free',
    priceMonthly: 0,
    priceAnnual: 0,
    apiCallsPerMonth: 100000,
    overageRate: 0,
    paddlePriceIdMonthly: null,
    paddlePriceIdAnnual: null,
    ratePerMinute: 60,
    features: [
      '100,000 API calls / month (soft cap)',
      'All 140+ features included',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      '240 countries supported',
      'Real-time exchange rates',
      'FTA & preferential rate detection',
      'Anti-dumping / countervailing duty alerts',
      'Sub-national tax (US/CA/BR/IN/AU + 7 more)',
      '50 language support',
      'Email support',
    ],
  },
  basic: {
    name: 'Forever Free',
    priceMonthly: 0,
    priceAnnual: 0,
    apiCallsPerMonth: 100000,
    overageRate: 0,
    paddlePriceIdMonthly: null,
    paddlePriceIdAnnual: null,
    ratePerMinute: 60,
    features: [
      '100,000 API calls / month (soft cap)',
      'All 140+ features included',
    ],
  },
  pro: {
    name: 'Forever Free',
    priceMonthly: 0,
    priceAnnual: 0,
    apiCallsPerMonth: 100000,
    overageRate: 0,
    paddlePriceIdMonthly: null,
    paddlePriceIdAnnual: null,
    ratePerMinute: 60,
    features: [
      '100,000 API calls / month (soft cap)',
      'All 140+ features included',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 0,
    priceAnnual: 0,
    apiCallsPerMonth: -1,
    overageRate: 0,
    paddlePriceIdMonthly: null,
    paddlePriceIdAnnual: null,
    ratePerMinute: -1,
    features: [
      'Custom API volume',
      'White-label widget',
      'Dedicated infrastructure',
      'SSO & team management',
      'SLA guarantee (99.99%)',
      'Custom integrations',
      'Dedicated account manager',
      'Contact us',
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
