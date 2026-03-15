import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hsCode = (url.searchParams.get('hs_code') || '').replace(/\./g, '');
  const country = (url.searchParams.get('country') || '').toUpperCase();
  if (!hsCode || !country) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code and country required.');

  const hs6 = hsCode.slice(0, 6);
  const sb = getSupabase();

  const [ntlcRes, govRes, remedyRes] = await Promise.all([
    sb.from('macmap_ntlc_rates').select('*').eq('reporter', country).like('product_code', `${hs6}%`).limit(5),
    sb.from('gov_tariff_schedules').select('*').eq('country_code', country).like('hs_code', `${hs6}%`).limit(10),
    sb.from('trade_remedy_cases').select('case_number, measure_type').eq('imposing_country', country).limit(5),
  ]);

  const rates = [];
  if (ntlcRes.data?.length) {
    for (const r of ntlcRes.data) {
      rates.push({ type: 'MFN', rate: parseFloat(r.applied_rate || r.tariff_rate || '0'), rate_type: 'ad_valorem', source: 'MacMap NTLC' });
    }
  }
  if (govRes.data?.length) {
    for (const r of govRes.data) {
      rates.push({ type: 'MFN', rate: parseFloat(r.duty_rate || '0'), rate_type: 'ad_valorem', hs_code: r.hs_code, description: r.description, source: 'Government schedule' });
    }
  }

  const effectiveRate = rates.length > 0 ? Math.min(...rates.map(r => r.rate)) : 0;

  return apiSuccess({
    hs_code: hsCode, country, rates, effective_rate: effectiveRate,
    remedies_exist: (remedyRes.data || []).length > 0,
  }, { sellerId: ctx.sellerId });
});
