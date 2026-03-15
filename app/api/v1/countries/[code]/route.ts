/**
 * POTAL API v1 — /api/v1/countries/[code]
 * Country profile with VAT, de minimis, FTAs, regulatory notes
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import { getCountryFtas } from '@/app/lib/cost-engine/hs-code/fta';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

export const GET = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const code = req.url.split('/countries/')[1]?.split('?')[0]?.toUpperCase();
  if (!code || code.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide 2-letter ISO country code.');
  }

  const sb = getSupabase();

  const [countryRes, vatRes, deminRes, feesRes, notesRes] = await Promise.all([
    sb.from('countries').select('*').eq('iso2', code).single(),
    sb.from('vat_gst_rates').select('*').eq('country_code', code).single(),
    sb.from('de_minimis_thresholds').select('*').eq('country_code', code).single(),
    sb.from('customs_fees').select('*').eq('country_code', code).single(),
    sb.from('country_regulatory_notes').select('category, note_text, effective_date, source').eq('country_code', code),
  ]);

  if (!countryRes.data) {
    return apiError(ApiErrorCode.NOT_FOUND, `Country ${code} not found.`);
  }

  const ftas = getCountryFtas(code);

  const c = countryRes.data;
  const v = vatRes.data;
  const d = deminRes.data;
  const f = feesRes.data;

  return apiSuccess({
    country_name: c.name || c.country_name,
    iso_code: code,
    iso3: c.iso3,
    region: c.region,
    currency: c.currency_code || c.currency,
    vat_rate: v ? parseFloat(v.rate || v.vat_rate || '0') : null,
    vat_label: v?.label || v?.tax_name || 'VAT',
    de_minimis: d ? {
      threshold: parseFloat(d.threshold || d.amount || '0'),
      currency: d.currency || d.threshold_currency,
      threshold_usd: d.threshold_usd ? parseFloat(d.threshold_usd) : null,
    } : null,
    customs_fee: f ? {
      processing_fee: f.processing_fee ? parseFloat(f.processing_fee) : null,
      description: f.description || f.fee_description,
    } : null,
    active_ftas: ftas.map(ft => ({ code: ft.code, name: ft.name, partners: ft.partners })),
    fta_count: ftas.length,
    regulatory_notes: (notesRes.data || []).map(n => ({
      category: n.category,
      note: n.note_text,
      effective_date: n.effective_date,
      source: n.source,
    })),
    data_freshness: {
      last_updated: new Date().toISOString().split('T')[0],
      badge: 'green',
    },
  }, { sellerId: _ctx.sellerId });
});
