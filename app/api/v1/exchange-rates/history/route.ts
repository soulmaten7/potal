import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateVolatility } from '@/app/lib/currency/volatility';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const from = (url.searchParams.get('from') || 'USD').toUpperCase();
  const to = (url.searchParams.get('to') || 'EUR').toUpperCase();
  const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 365);

  if (from.length !== 3 || to.length !== 3) return apiError(ApiErrorCode.BAD_REQUEST, 'from and to must be 3-letter currency codes.');

  // Generate simulated historical rates
  const baseRate = from === 'USD' && to === 'EUR' ? 0.92 : from === 'USD' && to === 'GBP' ? 0.79 : 1.0;
  const rates = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const variation = (Math.random() - 0.5) * 0.02;
    const rate = Math.round((baseRate + variation) * 10000) / 10000;
    rates.push({ date: d.toISOString().split('T')[0], rate, change_pct: Math.round(variation / baseRate * 10000) / 100 });
  }

  const rateValues = rates.map(r => r.rate);
  const vol = calculateVolatility(from, to);

  return apiSuccess({
    from, to, days, rates,
    stats: {
      min: Math.min(...rateValues),
      max: Math.max(...rateValues),
      avg: Math.round(rateValues.reduce((a, b) => a + b, 0) / rateValues.length * 10000) / 10000,
      volatility: vol.volatilityScore,
    },
  }, { sellerId: ctx.sellerId });
});
