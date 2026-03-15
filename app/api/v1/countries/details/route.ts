import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').toUpperCase();
  if (!code || code.length !== 2) return apiError(ApiErrorCode.BAD_REQUEST, 'code (2-letter) required.');

  const sb = getSupabase();
  const [countryRes, vatRes, deminRes, ftaRes] = await Promise.all([
    sb.from('countries').select('*').eq('country_code', code).single(),
    sb.from('vat_gst_rates').select('*').eq('country_code', code).single(),
    sb.from('de_minimis_thresholds').select('*').eq('country_code', code).single(),
    sb.from('macmap_trade_agreements').select('agreement_name').or(`reporter_code.eq.${code},partner_code.eq.${code}`).limit(20),
  ]);

  if (!countryRes.data) return apiError(ApiErrorCode.NOT_FOUND, `Country ${code} not found.`);

  const govRes = await sb.from('gov_tariff_schedules').select('*', { count: 'exact', head: true }).eq('country_code', code);
  const govCount = govRes.count ?? 0;

  return apiSuccess({
    country: { code, name: countryRes.data.country_name || countryRes.data.name, region: countryRes.data.region || '' },
    vat_gst: vatRes.data ? { rate: vatRes.data.standard_rate || vatRes.data.rate, type: vatRes.data.tax_type || 'VAT' } : null,
    de_minimis: deminRes.data ? { threshold: deminRes.data.threshold_usd || deminRes.data.threshold, currency: deminRes.data.currency || 'USD' } : null,
    data_coverage: {
      gov_schedule: govCount > 0,
      gov_schedule_count: govCount,
      mfn_rates: true,
      trade_agreements: (ftaRes.data || []).length,
    },
    trade_agreements: (ftaRes.data || []).map(f => ({ name: f.agreement_name })),
  }, { sellerId: ctx.sellerId });
});
