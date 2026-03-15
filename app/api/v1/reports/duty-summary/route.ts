/**
 * POTAL API v1 — /api/v1/reports/duty-summary
 * Duty summary report: duty breakdown by HS chapter, country, FTA utilization
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

export const GET = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const destination = (url.searchParams.get('destination') || '').toUpperCase();
  const hsChapter = url.searchParams.get('hs_chapter') || '';
  const origin = (url.searchParams.get('origin') || '').toUpperCase();

  if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, 'destination query param required.');

  const sb = getSupabase();

  // Get MFN rates for the destination, optionally filtered
  let query = sb.from('macmap_ntlc_rates')
    .select('hs_code, ntlc_rate, reporter_code')
    .eq('reporter_code', destination)
    .limit(100);

  if (hsChapter) {
    query = query.like('hs_code', `${hsChapter}%`);
  }

  const { data: mfnRates } = await query;

  // Get AGR/FTA rates if origin provided
  let agrRates: { hs_code: string; rate: number; agreement_code: string }[] = [];
  if (origin) {
    const { data } = await sb.from('macmap_agr_rates')
      .select('hs_code, rate, agreement_code')
      .eq('reporter_code', destination)
      .eq('partner_code', origin)
      .limit(100);
    if (data) agrRates = data.map((r: { hs_code: string; rate: number; agreement_code: string }) => r);
  }

  // Build summary by chapter
  const chapters: Record<string, { count: number; avg_rate: number; min_rate: number; max_rate: number; rates: number[] }> = {};
  for (const r of (mfnRates || [])) {
    const ch = (r.hs_code || '').substring(0, 2);
    const rate = parseFloat(r.ntlc_rate) || 0;
    if (!chapters[ch]) chapters[ch] = { count: 0, avg_rate: 0, min_rate: Infinity, max_rate: 0, rates: [] };
    chapters[ch].count++;
    chapters[ch].rates.push(rate);
    chapters[ch].min_rate = Math.min(chapters[ch].min_rate, rate);
    chapters[ch].max_rate = Math.max(chapters[ch].max_rate, rate);
  }

  const chapterSummary = Object.entries(chapters).map(([ch, v]) => ({
    chapter: ch,
    tariff_lines: v.count,
    avg_rate: v.rates.length > 0 ? Math.round(v.rates.reduce((a, b) => a + b, 0) / v.rates.length * 100) / 100 : 0,
    min_rate: v.min_rate === Infinity ? 0 : v.min_rate,
    max_rate: v.max_rate,
  })).sort((a, b) => a.chapter.localeCompare(b.chapter));

  // FTA savings summary
  const ftaSavings = agrRates.length > 0 ? {
    origin,
    preferential_lines: agrRates.length,
    avg_preferential_rate: Math.round(agrRates.reduce((s, r) => s + r.rate, 0) / agrRates.length * 100) / 100,
    agreements: [...new Set(agrRates.map(r => r.agreement_code))],
  } : null;

  return apiSuccess({
    destination,
    origin: origin || null,
    hs_chapter_filter: hsChapter || null,
    mfn_summary: {
      total_lines: (mfnRates || []).length,
      by_chapter: chapterSummary,
    },
    fta_savings: ftaSavings,
    generated_at: new Date().toISOString(),
  }, { sellerId: _ctx.sellerId });
});
