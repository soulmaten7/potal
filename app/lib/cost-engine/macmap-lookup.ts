/**
 * POTAL MacMap 4-Stage Duty Rate Lookup
 *
 * 4단계 폴백 순서 (가장 유리한 세율 → 일반 세율):
 *   ① macmap_agr_rates  — AGR 협정세율 (FTA 기반, 가장 정확)
 *   ② macmap_min_rates  — MIN 최소세율 (모든 협정 중 최저)
 *   ③ macmap_ntlc_rates — NTLC 일반세율 (MFN 기본)
 *   ④ hardcoded/MFN     — 하드코딩 챕터 레벨 폴백
 *
 * 각 단계에서 데이터 없으면 다음 단계로 넘어감.
 * HS Code prefix matching: exact → 8자리 → 6자리 순.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

export type DutySource = 'agr' | 'min' | 'ntlc' | 'mfn';

export interface MacMapDutyResult {
  /** Ad valorem duty rate (0.12 = 12%) */
  avDuty: number;
  /** Which fallback stage produced the result */
  source: DutySource;
  /** Confidence score: agr=1.0, min=0.9, ntlc=0.8, mfn=0.7 */
  confidenceScore: number;
  /** Matched product code */
  matchedCode: string;
  /** Match type for debugging */
  matchType: string;
  /** Non-ad-valorem duty text (if applicable) */
  navDutyText?: string;
  /** Agreement ID (AGR only) */
  agreementId?: number;
}

const CONFIDENCE_MAP: Record<DutySource, number> = {
  agr: 1.0,
  min: 0.9,
  ntlc: 0.8,
  mfn: 0.7,
};

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Generate HS code prefix variants for fallback matching (exact → 8 → 6) */
function getHsPrefixes(productCode: string): string[] {
  const clean = productCode.replace(/\./g, '').trim();
  const prefixes = [clean];
  if (clean.length > 8) prefixes.push(clean.substring(0, 8));
  if (clean.length > 6) prefixes.push(clean.substring(0, 6));
  // Deduplicate
  return [...new Set(prefixes)];
}

// ─── Stage 1: AGR (Agreement Rates) ────────────────

async function lookupAgr(
  supabase: any,
  reporterIso2: string,
  partnerIso2: string,
  productCode: string,
): Promise<MacMapDutyResult | null> {
  const prefixes = getHsPrefixes(productCode);

  for (const prefix of prefixes) {
    const result: any = await supabase
      .from('macmap_agr_rates' as any)
      .select('product_code, av_duty, nav_duty, agreement_id')
      .eq('reporter_iso2', reporterIso2)
      .eq('partner_iso2', partnerIso2)
      .eq('hs6', prefix.substring(0, 6))
      .limit(10);

    if (result.error || !result.data || result.data.length === 0) continue;

    const rows = result.data as any[];
    const exact = rows.find(r => r.product_code === prefix);
    const match = exact || rows[0];

    if (match && match.av_duty !== null) {
      return {
        avDuty: parseFloat(match.av_duty),
        source: 'agr' as DutySource,
        confidenceScore: CONFIDENCE_MAP.agr,
        matchedCode: match.product_code,
        matchType: exact ? 'exact_agr' : 'prefix_agr',
        navDutyText: match.nav_duty || undefined,
        agreementId: match.agreement_id,
      };
    }
  }

  return null;
}

// ─── Stage 2: MIN (Minimum Rates) ──────────────────

async function lookupMin(
  supabase: any,
  reporterIso2: string,
  partnerIso2: string,
  productCode: string,
): Promise<MacMapDutyResult | null> {
  const prefixes = getHsPrefixes(productCode);

  for (const prefix of prefixes) {
    const result: any = await supabase
      .from('macmap_min_rates' as any)
      .select('product_code, av_duty')
      .eq('reporter_iso2', reporterIso2)
      .eq('partner_iso2', partnerIso2)
      .eq('hs6', prefix.substring(0, 6))
      .limit(10);

    if (result.error || !result.data || result.data.length === 0) continue;

    const rows = result.data as any[];
    const exact = rows.find(r => r.product_code === prefix);
    const match = exact || rows[0];

    if (match && match.av_duty !== null) {
      return {
        avDuty: parseFloat(match.av_duty),
        source: 'min' as DutySource,
        confidenceScore: CONFIDENCE_MAP.min,
        matchedCode: match.product_code,
        matchType: exact ? 'exact_min' : 'prefix_min',
      };
    }
  }

  return null;
}

// ─── Stage 3: NTLC (National Tariff Line Code — MFN) ─

async function lookupNtlc(
  supabase: any,
  reporterIso2: string,
  productCode: string,
): Promise<MacMapDutyResult | null> {
  const prefixes = getHsPrefixes(productCode);

  for (const prefix of prefixes) {
    const result: any = await supabase
      .from('macmap_ntlc_rates' as any)
      .select('hs_code, mfn_rate, nav_duty_text')
      .eq('destination_country', reporterIso2)
      .eq('hs6', prefix.substring(0, 6))
      .limit(10);

    if (result.error || !result.data || result.data.length === 0) continue;

    const rows = result.data as any[];
    const exact = rows.find(r => r.hs_code === prefix);
    const match = exact || rows[0];

    if (match && match.mfn_rate !== null) {
      return {
        avDuty: parseFloat(match.mfn_rate),
        source: 'ntlc' as DutySource,
        confidenceScore: CONFIDENCE_MAP.ntlc,
        matchedCode: match.hs_code,
        matchType: exact ? 'exact_ntlc' : 'prefix_ntlc',
        navDutyText: match.nav_duty_text || undefined,
      };
    }
  }

  return null;
}

// ─── Main Lookup Function ──────────────────────────

/**
 * MacMap 4단계 폴백 관세율 조회
 *
 * @param destinationCountry  목적지 국가 ISO2 (= reporter)
 * @param originCountry       원산지 국가 ISO2 (= partner)
 * @param hsCode              HS 코드 (6~12자리)
 * @returns MacMapDutyResult or null (hardcoded fallback 필요)
 */
export async function lookupMacMapDutyRate(
  destinationCountry: string,
  originCountry: string,
  hsCode: string,
): Promise<MacMapDutyResult | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const reporter = destinationCountry.toUpperCase();
  const partner = originCountry.toUpperCase();
  const productCode = hsCode.replace(/\./g, '').trim();

  try {
    // Stage 1: AGR (협정세율)
    const agrResult = await lookupAgr(supabase, reporter, partner, productCode);
    if (agrResult) return agrResult;

    // Stage 2: MIN (최소세율)
    const minResult = await lookupMin(supabase, reporter, partner, productCode);
    if (minResult) return minResult;

    // Stage 3: NTLC (MFN 기본세율)
    const ntlcResult = await lookupNtlc(supabase, reporter, productCode);
    if (ntlcResult) return ntlcResult;

    // Stage 4: null → caller uses hardcoded/MFN fallback
    return null;
  } catch {
    return null;
  }
}
