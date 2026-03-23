/**
 * Duty Rate Lookup — macmap 테이블에서 MFN 세율 조회
 *
 * 조회 체인: macmap_ntlc_rates (MFN) → macmap_min_rates (MIN, fallback)
 * EU 회원국 27개 → 'EU'로 자동 매핑
 *
 * mfn_rate 단위: 비율 (0.12 = 12%, 0.165 = 16.5%, 30.0 = 3000%)
 * 검증 완료: 610910 US=0.165→16.5%, EU=0.12→12%, KR=0.13→13%, JP=0.109→10.9%
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// EU 회원국 → macmap에서 'EU'로 조회
const EU_MEMBERS = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
  'PL','PT','RO','SK','SI','ES','SE'
]);

export interface DutyRateResult {
  duty_rate_pct: number;  // percentage (12.0 = 12%)
  rate_type: string;
  source: string;
}

export async function lookupDutyRate(
  hsCode: string,
  destinationCountry?: string
): Promise<DutyRateResult | null> {
  if (!destinationCountry || !hsCode) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  let country = destinationCountry.toUpperCase();
  if (EU_MEMBERS.has(country)) country = 'EU';

  const hs6 = hsCode.substring(0, 6);

  try {
    // 1차: macmap_ntlc_rates (MFN 세율, 53개국)
    const { data, error } = await supabase
      .from('macmap_ntlc_rates')
      .select('mfn_rate, rate_type')
      .eq('destination_country', country)
      .eq('hs6', hs6)
      .not('mfn_rate', 'is', null)
      .limit(5);

    if (!error && data && data.length > 0) {
      const adValorem = data.find((r: Record<string, unknown>) => r.rate_type === 'ad_valorem');
      const best = adValorem || data[0];
      const mfnRate = Number(best.mfn_rate);
      if (!isNaN(mfnRate)) {
        return {
          duty_rate_pct: Math.round(mfnRate * 10000) / 100, // 0.165 → 16.5, 0.12 → 12.0
          rate_type: String(best.rate_type || 'unknown'),
          source: 'macmap_ntlc',
        };
      }
    }

    // 2차: macmap_min_rates (MIN 세율, fallback)
    // min_rates 컬럼: reporter_iso2, hs6, av_duty
    const { data: minData, error: minErr } = await supabase
      .from('macmap_min_rates')
      .select('av_duty')
      .eq('reporter_iso2', country)
      .eq('hs6', hs6)
      .not('av_duty', 'is', null)
      .gt('av_duty', 0)
      .limit(5);

    if (!minErr && minData && minData.length > 0) {
      // MFN rate = max of min_rates for this hs6 (min_rates has partner-specific rates)
      const rates = minData.map((r: Record<string, unknown>) => Number(r.av_duty)).filter(n => !isNaN(n));
      if (rates.length > 0) {
        const mfnRate = Math.max(...rates); // MFN = highest rate (no preferential)
        return {
          duty_rate_pct: Math.round(mfnRate * 10000) / 100,
          rate_type: 'ad_valorem',
          source: 'macmap_min',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
