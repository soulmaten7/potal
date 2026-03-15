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

  const countries = Array.isArray(body.countries) ? body.countries.map((c: unknown) => typeof c === 'string' ? c.toUpperCase() : '') : [];
  if (countries.length < 2 || countries.length > 10) return apiError(ApiErrorCode.BAD_REQUEST, '2-10 countries required.');

  const sb = getSupabase();
  const comparison = [];

  for (const code of countries) {
    const [vatRes, deminRes, ftaRes] = await Promise.all([
      sb.from('vat_gst_rates').select('*').eq('country_code', code).single(),
      sb.from('de_minimis_thresholds').select('*').eq('country_code', code).single(),
      sb.from('macmap_trade_agreements').select('*', { count: 'exact', head: true }).or(`reporter_code.eq.${code},partner_code.eq.${code}`),
    ]);

    comparison.push({
      country: code,
      vat_rate: vatRes.data ? parseFloat(vatRes.data.standard_rate || vatRes.data.rate || '0') : 0,
      de_minimis: deminRes.data ? parseFloat(deminRes.data.threshold_usd || deminRes.data.threshold || '0') : 0,
      fta_count: ftaRes.count || 0,
    });
  }

  return apiSuccess({ comparison }, { sellerId: ctx.sellerId });
});
