/**
 * POTAL Country Data — DB-backed version
 *
 * Same interface as country-data.ts but reads from Supabase.
 * Falls back to hardcoded data if DB is unavailable.
 */

import type { CountryTaxProfile } from '../country-data';
import { getCountryProfiles, type CachedCountryProfile } from './tariff-cache';
// Hardcoded fallback
import { COUNTRY_DATA as HARDCODED_COUNTRY_DATA } from '../country-data';

function toCountryTaxProfile(cached: CachedCountryProfile): CountryTaxProfile {
  return {
    code: cached.countryCode,
    name: cached.countryName,
    region: cached.region as CountryTaxProfile['region'],
    vatRate: cached.vatRate,
    vatLabel: cached.vatLabel as CountryTaxProfile['vatLabel'],
    avgDutyRate: cached.avgDutyRate,
    deMinimis: cached.deMinimis,
    deMinimsCurrency: cached.deMinimsCurrency,
    deMinimisUsd: cached.deMinimisUsd,
    currency: cached.currency,
    hasFtaWithChina: cached.hasFtaWithChina,
    notes: cached.notes,
  };
}

/**
 * Get country profile from DB (with cache).
 * Falls back to hardcoded data on DB error.
 */
export async function getCountryProfileFromDb(code: string): Promise<CountryTaxProfile | null> {
  try {
    const profiles = await getCountryProfiles();
    const cached = profiles.get(code.toUpperCase());
    if (!cached) return null;
    return toCountryTaxProfile(cached);
  } catch {
    // Fallback to hardcoded
    return HARDCODED_COUNTRY_DATA[code.toUpperCase()] || null;
  }
}

/**
 * Get all supported countries from DB.
 */
export async function getSupportedCountriesFromDb(): Promise<CountryTaxProfile[]> {
  try {
    const profiles = await getCountryProfiles();
    return Array.from(profiles.values()).map(toCountryTaxProfile);
  } catch {
    return Object.values(HARDCODED_COUNTRY_DATA);
  }
}

/**
 * Get country count from DB.
 */
export async function getCountryCountFromDb(): Promise<number> {
  try {
    const profiles = await getCountryProfiles();
    return profiles.size;
  } catch {
    return Object.keys(HARDCODED_COUNTRY_DATA).length;
  }
}
