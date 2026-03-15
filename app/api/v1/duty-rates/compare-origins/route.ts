import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/\./g, '') : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase() : '';
  const origins = Array.isArray(body.origins) ? body.origins.map((o: unknown) => typeof o === 'string' ? o.toUpperCase() : '') : [];

  if (!hsCode || !destination || origins.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, destination, origins required.');

  const hs6 = hsCode.slice(0, 6);
  const sb = getSupabase();
  const results = [];

  for (const origin of origins) {
    const { data: ntlc } = await sb.from('macmap_ntlc_rates').select('applied_rate').eq('reporter', destination).eq('partner', origin).like('product_code', `${hs6}%`).limit(1);
    const mfnRate = ntlc?.[0] ? parseFloat(ntlc[0].applied_rate || '0') : 5;

    const { data: min } = await sb.from('macmap_min_rates').select('min_rate').eq('reporter', destination).eq('partner', origin).like('product_code', `${hs6}%`).limit(1);
    const bestFtaRate = min?.[0] ? parseFloat(min[0].min_rate || '0') : mfnRate;

    results.push({ country: origin, mfn_rate: mfnRate, best_fta_rate: bestFtaRate, total_effective_rate: Math.min(mfnRate, bestFtaRate) });
  }

  const cheapest = results.reduce((a, b) => a.total_effective_rate < b.total_effective_rate ? a : b);

  return apiSuccess({
    destination, hs_code: hsCode,
    origins: results,
    cheapest_origin: cheapest.country,
  }, { sellerId: ctx.sellerId });
});
