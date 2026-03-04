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
