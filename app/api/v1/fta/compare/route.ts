/**
 * POTAL API v1 — /api/v1/fta/compare
 *
 * Compare all available FTAs for an origin-destination pair.
 * Returns FTA options with savings vs MFN rate.
 *
 * POST /api/v1/fta/compare
 * Body: { hs_code, origin, destination, product_value }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';
import { getCountryFtas } from '@/app/lib/cost-engine/hs-code/fta';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

interface FtaOption {
  name: string;
  code: string;
  rate: number;
  mfn_rate: number;
  savings: number;
  savings_percent: number;
  psr_summary: string | null;
}

export const POST = withApiAuth(async (req: NextRequest, _context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/[^0-9]/g, '') : '';
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase().trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase().trim() : '';
  const productValue = typeof body.product_value === 'number' ? body.product_value : 0;

  if (!hsCode || hsCode.length < 4) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid hs_code (at least 4 digits).');
  }
  if (!origin || origin.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid origin country code (ISO 2-letter).');
  }
  if (!destination || destination.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide valid destination country code (ISO 2-letter).');
  }

  const supabase = getSupabase();
  const hsChapter = hsCode.substring(0, 2);
  const hs6 = hsCode.substring(0, 6);

  // 1. Get MFN rate from NTLC
  let mfnRate = 0;
  try {
    const { data: ntlc } = await supabase
      .from('macmap_ntlc_rates')
      .select('av_duty')
      .eq('reporter_code', destination)
      .like('product_code', `${hs6}%`)
      .limit(1)
      .single();
    if (ntlc) mfnRate = parseFloat(ntlc.av_duty) / 100;
  } catch { /* fallback below */ }

  // If no NTLC, try hardcoded
  if (mfnRate === 0) {
    const CHAPTER_RATES: Record<string, number> = {
      '61': 0.12, '62': 0.12, '64': 0.10, '42': 0.08, '85': 0.035,
      '84': 0.025, '95': 0.05, '94': 0.04, '69': 0.06, '70': 0.06,
      '71': 0.065, '73': 0.04, '33': 0.05, '39': 0.05, '87': 0.025,
      '90': 0.03, '44': 0.035, '48': 0.03, '96': 0.05, '34': 0.04,
    };
    mfnRate = CHAPTER_RATES[hsChapter] || 0.05;
  }

  // 2. Get all FTAs between origin and destination
  const originFtas = getCountryFtas(origin);
  const destFtas = getCountryFtas(destination);

  // Find FTAs that include BOTH origin and destination
  const originCodes = new Set(originFtas.map(f => f.code));
  const sharedFtas = destFtas.filter(f => originCodes.has(f.code));

  // 3. For each shared FTA, look up AGR rate
  const ftaOptions: FtaOption[] = [];

  for (const fta of sharedFtas) {
    let ftaRate = mfnRate;

    // Try AGR rate
    try {
      const { data: agr } = await supabase
        .from('macmap_agr_rates')
        .select('av_duty, agreement_id')
        .eq('reporter_code', destination)
        .eq('partner_code', origin)
        .like('product_code', `${hs6}%`)
        .limit(5);

      if (agr && agr.length > 0) {
        // Find the best rate among AGR entries
        const bestAgr = agr.reduce((best, cur) => {
          const rate = parseFloat(cur.av_duty) / 100;
          return rate < best.rate ? { rate, id: cur.agreement_id } : best;
        }, { rate: Infinity, id: 0 });
        if (bestAgr.rate < Infinity) ftaRate = bestAgr.rate;
      }
    } catch { /* use default */ }

    // If AGR didn't produce a better rate, estimate from FTA multiplier
    if (ftaRate >= mfnRate) {
      // Typical FTA gives 50-100% reduction
      ftaRate = mfnRate * 0.5; // conservative estimate
    }

    // Look up PSR
    let psrSummary: string | null = null;
    try {
      const { data: psr } = await supabase
        .from('product_specific_rules')
        .select('rule_type, rule_text, threshold_pct')
        .eq('fta_code', fta.code)
        .or(`hs6_code.eq.${hs6},hs6_code.like.${hsCode.substring(0, 4)}%`)
        .limit(1)
        .single();

      if (psr) {
        psrSummary = `${psr.rule_type}: ${psr.rule_text}${psr.threshold_pct ? ` (threshold: ${psr.threshold_pct}%)` : ''}`;
      }
    } catch { /* no PSR found */ }

    const savings = productValue > 0 ? (mfnRate - ftaRate) * productValue : 0;
    const savingsPercent = mfnRate > 0 ? ((mfnRate - ftaRate) / mfnRate) * 100 : 0;

    ftaOptions.push({
      name: fta.name,
      code: fta.code,
      rate: Math.round(ftaRate * 10000) / 10000,
      mfn_rate: Math.round(mfnRate * 10000) / 10000,
      savings: Math.round(savings * 100) / 100,
      savings_percent: Math.round(savingsPercent * 10) / 10,
      psr_summary: psrSummary,
    });
  }

  // Sort by rate (lowest first)
  ftaOptions.sort((a, b) => a.rate - b.rate);

  const optimalFta = ftaOptions.length > 0 ? ftaOptions[0] : null;
  const totalSavings = optimalFta ? optimalFta.savings : 0;

  return apiSuccess({
    hs_code: hsCode,
    origin,
    destination,
    product_value: productValue,
    mfn_rate: Math.round(mfnRate * 10000) / 10000,
    fta_options: ftaOptions,
    optimal_fta: optimalFta ? {
      name: optimalFta.name,
      code: optimalFta.code,
      rate: optimalFta.rate,
      savings: optimalFta.savings,
    } : null,
    total_savings: totalSavings,
    ftas_available: ftaOptions.length,
  }, {
    sellerId: _context.sellerId,
    plan: _context.planId,
  });
});
