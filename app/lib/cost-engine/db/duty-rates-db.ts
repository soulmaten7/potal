/**
 * POTAL Duty Rates — DB-backed version
 *
 * Same interface as hs-code/duty-rates.ts but reads from Supabase.
 * Falls back to hardcoded data if DB is unavailable.
 */

import type { HsCodeDutyRate } from '../hs-code/types';
import { getDutyRates, getAdditionalTariffs } from './tariff-cache';
// Hardcoded fallback
import { getDutyRate as getHardcodedDutyRate, getEffectiveDutyRate as getHardcodedEffectiveDutyRate } from '../hs-code/duty-rates';
import { createClient } from '@supabase/supabase-js';

/** Rich duty rate result including specific/compound info from macmap_ntlc_rates */
export interface RichDutyRate {
  source: 'macmap_ntlc' | 'tariff_cache' | 'hardcoded';
  hsCode: string;
  rateType: 'ad_valorem' | 'specific' | 'compound';
  adValoremRate: number;
  navDutyText: string | null;
}

function getMacmapSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// EU members — for resolving country → 'EU' key
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/**
 * Get duty rate from DB.
 * Falls back to hardcoded data on DB error.
 */
export async function getDutyRateFromDb(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): Promise<HsCodeDutyRate | null> {
  try {
    const chapter = hsCode.substring(0, 2);
    const dest = destinationCountry.toUpperCase();
    const origin = originCountry?.toUpperCase();

    // Resolve EU members
    const destKey = EU_COUNTRIES.has(dest) ? 'EU' : dest;

    // Find matching duty rate
    const rates = await getDutyRates();
    const match = rates.find(
      (r) => r.hsChapter === chapter && r.destinationCountry === destKey
    );

    if (!match) return null;

    const result: HsCodeDutyRate = {
      hsCode,
      destinationCountry: dest,
      originCountry: origin,
      mfnRate: match.mfnRate,
    };

    // Check additional tariffs (e.g. Section 301)
    if (origin) {
      const additionalTariffs = await getAdditionalTariffs();
      const additionalMatch = additionalTariffs.find(
        (t) => t.originCountry === origin
          && t.destinationCountry === dest
          && t.hsChapter === chapter
      );

      if (additionalMatch) {
        result.additionalTariff = additionalMatch.rate;
        result.notes = `${additionalMatch.tariffName}: +${(additionalMatch.rate * 100).toFixed(1)}% on ${origin} origin`;
      }
    }

    return result;
  } catch {
    // Fallback to hardcoded
    return getHardcodedDutyRate(hsCode, destinationCountry, originCountry);
  }
}

/**
 * Get effective duty rate (MFN + additional) from DB.
 */
export async function getEffectiveDutyRateFromDb(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): Promise<number> {
  try {
    const rate = await getDutyRateFromDb(hsCode, destinationCountry, originCountry);
    if (!rate) return 0;
    return rate.mfnRate + (rate.additionalTariff || 0) + (rate.antiDumpingRate || 0);
  } catch {
    return getHardcodedEffectiveDutyRate(hsCode, destinationCountry, originCountry);
  }
}

/**
 * Check if DB has duty data for a country.
 */
export async function hasCountryDutyDataFromDb(countryCode: string): Promise<boolean> {
  try {
    const code = countryCode.toUpperCase();
    const destKey = EU_COUNTRIES.has(code) ? 'EU' : code;

    const rates = await getDutyRates();
    return rates.some((r) => r.destinationCountry === destKey);
  } catch {
    return false;
  }
}

/**
 * Rich duty rate lookup: macmap_ntlc_rates → tariff_cache fallback.
 * Returns rate_type + nav_duty_text for specific/compound duty calculation.
 */
export async function getRichDutyRate(
  hsCode: string,
  destinationCountry: string,
  originCountry?: string,
): Promise<RichDutyRate> {
  const hs = hsCode.replace(/\D/g, '');
  const dest = destinationCountry.toUpperCase();
  const destKey = EU_COUNTRIES.has(dest) ? 'EU' : dest;

  // 1. Try macmap_ntlc_rates (has rate_type + nav_duty_text)
  try {
    const sb = getMacmapSupabase();
    if (sb) {
      // Try exact match first, then HS6 prefix
      for (const q of [hs, hs.slice(0, 6)]) {
        const { data } = await sb
          .from('macmap_ntlc_rates')
          .select('hs_code, mfn_rate, rate_type, nav_duty_text')
          .eq('destination_country', dest)
          .like('hs_code', `${q}%`)
          .order('hs_code')
          .limit(1);

        if (data && data.length > 0) {
          const row = data[0];
          const rt = (row.rate_type || 'ad_valorem') as RichDutyRate['rateType'];
          return {
            source: 'macmap_ntlc',
            hsCode: row.hs_code,
            rateType: rt,
            adValoremRate: Number(row.mfn_rate) || 0,
            navDutyText: row.nav_duty_text || null,
          };
        }
      }
    }
  } catch { /* fall through */ }

  // 2. Fallback: existing tariff cache (ad_valorem only)
  try {
    const rate = await getDutyRateFromDb(hs, destinationCountry, originCountry);
    return {
      source: 'tariff_cache',
      hsCode: hs,
      rateType: 'ad_valorem',
      adValoremRate: rate?.mfnRate ?? 0,
      navDutyText: null,
    };
  } catch {
    return {
      source: 'hardcoded',
      hsCode: hs,
      rateType: 'ad_valorem',
      adValoremRate: 0,
      navDutyText: null,
    };
  }
}
