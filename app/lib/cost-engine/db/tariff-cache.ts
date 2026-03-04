/**
 * POTAL Tariff Data Cache
 *
 * In-memory cache layer for tariff data from Supabase.
 * Prevents hitting DB on every API request.
 *
 * Strategy:
 * - Load all data on first request (lazy init)
 * - Cache in memory with TTL (default 5 minutes)
 * - Background refresh: cache serves stale data while refreshing
 * - Manual invalidation via Admin API
 *
 * This runs on Vercel serverless, so cache is per-instance.
 * Each cold start loads fresh data from DB.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

export interface CachedCountryProfile {
  countryCode: string;
  countryName: string;
  region: string;
  vatRate: number;
  vatLabel: string;
  avgDutyRate: number;
  deMinimis: number;
  deMinimsCurrency: string;
  deMinimisUsd: number;
  currency: string;
  hasFtaWithChina: boolean;
  notes?: string;
}

export interface CachedDutyRate {
  hsChapter: string;
  hsCode: string | null;
  destinationCountry: string;
  mfnRate: number;
  additionalTariff: number;
  additionalTariffOrigin: string | null;
  additionalTariffName: string | null;
  notes?: string;
  source?: string;
}

export interface CachedAdditionalTariff {
  tariffName: string;
  originCountry: string;
  destinationCountry: string;
  hsChapter: string;
  rate: number;
  notes?: string;
}

export interface CachedFtaAgreement {
  ftaCode: string;
  ftaName: string;
  preferentialMultiplier: number;
  excludedChapters: string[];
  members: string[];
  isActive: boolean;
}

// ─── Cache Store ───────────────────────────────────

interface CacheEntry<T> {
  data: T;
  loadedAt: number;
  isLoading: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let countryCache: CacheEntry<Map<string, CachedCountryProfile>> | null = null;
let dutyRateCache: CacheEntry<CachedDutyRate[]> | null = null;
let additionalTariffCache: CacheEntry<CachedAdditionalTariff[]> | null = null;
let ftaCache: CacheEntry<CachedFtaAgreement[]> | null = null;

function isCacheValid<T>(cache: CacheEntry<T> | null): cache is CacheEntry<T> {
  if (!cache) return false;
  return (Date.now() - cache.loadedAt) < CACHE_TTL_MS;
}

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, key) as any;
}

// ─── Country Profiles ──────────────────────────────

export async function getCountryProfiles(): Promise<Map<string, CachedCountryProfile>> {
  if (isCacheValid(countryCache)) return countryCache.data;

  const supabase = getSupabase();
  const result: any = await supabase
    .from('country_profiles' as any)
    .select('*')
    .eq('is_active', true);

  if (result.error) {
    if (countryCache) return (countryCache as any).data;
    throw new Error(`Failed to load country profiles: ${result.error.message}`);
  }

  const data = result.data || [];

  const map = new Map<string, CachedCountryProfile>();
  for (const row of data) {
    map.set(row.country_code, {
      countryCode: row.country_code,
      countryName: row.country_name,
      region: row.region,
      vatRate: parseFloat(row.vat_rate),
      vatLabel: row.vat_label,
      avgDutyRate: parseFloat(row.avg_duty_rate),
      deMinimis: parseFloat(row.de_minimis),
      deMinimsCurrency: row.de_minimis_currency,
      deMinimisUsd: parseFloat(row.de_minimis_usd),
      currency: row.currency,
      hasFtaWithChina: row.has_fta_with_china,
      notes: row.notes,
    });
  }

  countryCache = { data: map, loadedAt: Date.now(), isLoading: false };
  return map;
}

// ─── Duty Rates ────────────────────────────────────

export async function getDutyRates(): Promise<CachedDutyRate[]> {
  if (isCacheValid(dutyRateCache)) return dutyRateCache.data;

  const supabase = getSupabase();
  const result: any = await supabase
    .from('duty_rates' as any)
    .select('*')
    .eq('is_active', true);

  if (result.error) {
    if (dutyRateCache) return (dutyRateCache as any).data;
    throw new Error(`Failed to load duty rates: ${result.error.message}`);
  }

  const rates: CachedDutyRate[] = (result.data || []).map((row: any) => ({
    hsChapter: row.hs_chapter,
    hsCode: row.hs_code,
    destinationCountry: row.destination_country,
    mfnRate: parseFloat(row.mfn_rate),
    additionalTariff: parseFloat(row.additional_tariff || '0'),
    additionalTariffOrigin: row.additional_tariff_origin,
    additionalTariffName: row.additional_tariff_name,
    notes: row.notes,
    source: row.source,
  }));

  dutyRateCache = { data: rates, loadedAt: Date.now(), isLoading: false };
  return rates;
}

// ─── Additional Tariffs ────────────────────────────

export async function getAdditionalTariffs(): Promise<CachedAdditionalTariff[]> {
  if (isCacheValid(additionalTariffCache)) return additionalTariffCache.data;

  const supabase = getSupabase();
  const result: any = await supabase
    .from('additional_tariffs' as any)
    .select('*')
    .eq('is_active', true);

  if (result.error) {
    if (additionalTariffCache) return (additionalTariffCache as any).data;
    throw new Error(`Failed to load additional tariffs: ${result.error.message}`);
  }

  const tariffs: CachedAdditionalTariff[] = (result.data || []).map((row: any) => ({
    tariffName: row.tariff_name,
    originCountry: row.origin_country,
    destinationCountry: row.destination_country,
    hsChapter: row.hs_chapter,
    rate: parseFloat(row.rate),
    notes: row.notes,
  }));

  additionalTariffCache = { data: tariffs, loadedAt: Date.now(), isLoading: false };
  return tariffs;
}

// ─── FTA Agreements ────────────────────────────────

export async function getFtaAgreements(): Promise<CachedFtaAgreement[]> {
  if (isCacheValid(ftaCache)) return ftaCache.data;

  const supabase = getSupabase();

  // Load agreements
  const res1: any = await supabase
    .from('fta_agreements' as any)
    .select('*')
    .eq('is_active', true);

  if (res1.error) {
    if (ftaCache) return (ftaCache as any).data;
    throw new Error(`Failed to load FTA agreements: ${res1.error.message}`);
  }

  // Load all members
  const res2: any = await supabase
    .from('fta_members' as any)
    .select('*');

  if (res2.error) {
    if (ftaCache) return (ftaCache as any).data;
    throw new Error(`Failed to load FTA members: ${res2.error.message}`);
  }

  // Group members by FTA code
  const membersByFta = new Map<string, string[]>();
  for (const m of (res2.data || [])) {
    const list = membersByFta.get(m.fta_code) || [];
    list.push(m.country_code);
    membersByFta.set(m.fta_code, list);
  }

  const ftas: CachedFtaAgreement[] = (res1.data || []).map((row: any) => ({
    ftaCode: row.fta_code,
    ftaName: row.fta_name,
    preferentialMultiplier: parseFloat(row.preferential_multiplier),
    excludedChapters: row.excluded_chapters || [],
    members: membersByFta.get(row.fta_code) || [],
    isActive: row.is_active,
  }));

  ftaCache = { data: ftas, loadedAt: Date.now(), isLoading: false };
  return ftas;
}

// ─── Cache Control ─────────────────────────────────

/**
 * Invalidate all caches (called after Admin updates)
 */
export function invalidateAllCaches(): void {
  countryCache = null;
  dutyRateCache = null;
  additionalTariffCache = null;
  ftaCache = null;
}

/**
 * Invalidate specific cache
 */
export function invalidateCache(table: 'country_profiles' | 'duty_rates' | 'additional_tariffs' | 'fta_agreements'): void {
  switch (table) {
    case 'country_profiles': countryCache = null; break;
    case 'duty_rates': dutyRateCache = null; break;
    case 'additional_tariffs': additionalTariffCache = null; break;
    case 'fta_agreements': ftaCache = null; break;
  }
}

/**
 * Get cache status (for health check / debugging)
 */
export function getCacheStatus(): Record<string, { loaded: boolean; age: number | null; size: number }> {
  const age = (entry: CacheEntry<any> | null) =>
    entry ? Math.round((Date.now() - entry.loadedAt) / 1000) : null;

  return {
    countryProfiles: {
      loaded: !!countryCache,
      age: age(countryCache),
      size: countryCache?.data.size || 0,
    },
    dutyRates: {
      loaded: !!dutyRateCache,
      age: age(dutyRateCache),
      size: dutyRateCache?.data.length || 0,
    },
    additionalTariffs: {
      loaded: !!additionalTariffCache,
      age: age(additionalTariffCache),
      size: additionalTariffCache?.data.length || 0,
    },
    ftaAgreements: {
      loaded: !!ftaCache,
      age: age(ftaCache),
      size: ftaCache?.data.length || 0,
    },
  };
}
