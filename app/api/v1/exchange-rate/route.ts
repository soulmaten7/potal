/**
 * POTAL API v1 — /api/v1/exchange-rate
 *
 * GET /api/v1/exchange-rate?from=USD&to=KRW&amount=100
 * Returns current exchange rate and converted amount.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { convertCurrency, getExchangeRates } from '@/app/lib/cost-engine/exchange-rate';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const from = (url.searchParams.get('from') || 'USD').toUpperCase();
  const to = (url.searchParams.get('to') || 'EUR').toUpperCase();
  const amount = parseFloat(url.searchParams.get('amount') || '1');

  if (from.length !== 3 || to.length !== 3) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"from" and "to" must be 3-letter currency codes (e.g., USD, EUR, KRW).');
  }
  if (isNaN(amount) || amount <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"amount" must be a positive number.');
  }

  try {
    const converted = await convertCurrency(amount, from, to);
    const rates = await getExchangeRates();
    const fromRate = rates.rates[from] || null;
    const toRate = rates.rates[to] || null;
    const directRate = fromRate && toRate ? Math.round((toRate / fromRate) * 1000000) / 1000000 : null;

    const response = apiSuccess({
      from,
      to,
      amount,
      convertedAmount: converted,
      rate: directRate,
      source: rates.source || 'ECB + Fed',
      updatedAt: rates.lastUpdated || new Date().toISOString().split('T')[0],
      supportedCurrencies: Object.keys(rates.rates).length,
      // CW37-S2: Deprecation notice
      _deprecation: { deprecated: true, replacement: '/api/v1/calculate', sunsetDate: '2027-01-31', message: 'Exchange rate is now included in calculate response as exchangeRateInfo.' },
    }, { sellerId: ctx.sellerId, plan: ctx.planId });
    response.headers.set('X-API-Deprecated', 'true');
    response.headers.set('X-API-Replacement', '/api/v1/calculate');
    response.headers.set('X-API-Sunset', '2027-01-31');
    return response;
  } catch (err) {
    return apiError(
      ApiErrorCode.INTERNAL_ERROR,
      `Exchange rate conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
});

export async function POST() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use GET. Query: ?from=USD&to=KRW&amount=100');
}
