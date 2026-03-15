/**
 * POTAL API v1 — /api/v1/exchange-rate/historical
 * GET ?from=USD&to=EUR&date=2025-01-15
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const GET = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const from = (url.searchParams.get('from') || 'USD').toUpperCase();
  const to = (url.searchParams.get('to') || 'EUR').toUpperCase();
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'date must be YYYY-MM-DD format.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try exchange_rates table
  let rate: number | null = null;
  try {
    const { data } = await supabase
      .from('exchange_rates')
      .select('rate, updated_at')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .lte('updated_at', `${date}T23:59:59Z`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (data) rate = parseFloat(data.rate);
  } catch { /* try reverse */ }

  if (!rate) {
    try {
      const { data } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', to)
        .eq('to_currency', from)
        .lte('updated_at', `${date}T23:59:59Z`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (data) rate = 1 / parseFloat(data.rate);
    } catch { /* fallback */ }
  }

  // Fallback: current rate from exchange-rate module
  if (!rate) {
    try {
      const { convertCurrency } = await import('@/app/lib/cost-engine/exchange-rate');
      const result = await convertCurrency(1, from, to);
      if (result) rate = result.convertedAmount;
    } catch { /* no rate */ }
  }

  if (!rate) {
    return apiError(ApiErrorCode.NOT_FOUND, `No exchange rate found for ${from}→${to} on ${date}.`);
  }

  return apiSuccess({
    from, to, date,
    rate: Math.round(rate * 1000000) / 1000000,
    inverse_rate: Math.round((1 / rate) * 1000000) / 1000000,
  }, { sellerId: _ctx.sellerId });
});
