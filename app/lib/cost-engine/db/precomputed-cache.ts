/**
 * POTAL Precomputed Landed Cost Cache
 *
 * Looks up pre-calculated landed cost data from the precomputed_landed_costs table.
 * Covers 490 HS6 × 240 countries = 117,600 combinations.
 * Response time: <50ms (single row lookup by primary key).
 *
 * Also handles HS10 candidates from precomputed_hs10_candidates.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ─────────────────────────────────────────

export interface PrecomputedLandedCost {
  hs6: string;
  destination_country: string;
  mfn_rate: number | null;
  min_rate: number | null;
  agr_rate: number | null;
  best_rate: number | null;
  best_rate_source: string | null;
  vat_gst_rate: number | null;
  de_minimis_usd: number | null;
  processing_fee_rate: number | null;
  fta_applicable: Array<{ id: number; regime: string }>;
  special_taxes: Record<string, unknown>;
  trade_remedy: Array<{
    type: string;
    measure: string;
    avg_rate: number | null;
    count: number;
  }>;
  last_updated: string;
}

export interface PrecomputedHs10 {
  hs6: string;
  country: string;
  hs10_candidates: Array<{
    hs_code: string;
    description: string;
    duty_rate_pct: number | null;
  }>;
}

// ─── In-memory cache ───────────────────────────────

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const memCache = new Map<string, { data: PrecomputedLandedCost; ts: number }>();

// ─── Supabase Client ───────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Precomputed Landed Cost Lookup ────────────────

/**
 * Look up precomputed landed cost for a given HS6 code and destination country.
 * Returns null if no precomputed data exists (cache miss).
 */
export async function getPrecomputedLandedCost(
  hs6: string,
  destinationCountry: string
): Promise<PrecomputedLandedCost | null> {
  const cacheKey = `${hs6}_${destinationCountry}`;

  // Check memory cache first
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('precomputed_landed_costs')
      .select('*')
      .eq('hs6', hs6)
      .eq('destination_country', destinationCountry)
      .single();

    if (error || !data) return null;

    const result = data as PrecomputedLandedCost;

    // Cache in memory
    memCache.set(cacheKey, { data: result, ts: Date.now() });

    return result;
  } catch {
    return null;
  }
}

/**
 * Batch lookup precomputed landed costs for multiple HS6 codes and a single destination.
 */
export async function getPrecomputedBatch(
  hs6Codes: string[],
  destinationCountry: string
): Promise<Map<string, PrecomputedLandedCost>> {
  const results = new Map<string, PrecomputedLandedCost>();
  const toFetch: string[] = [];

  // Check memory cache
  for (const hs6 of hs6Codes) {
    const cacheKey = `${hs6}_${destinationCountry}`;
    const cached = memCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      results.set(hs6, cached.data);
    } else {
      toFetch.push(hs6);
    }
  }

  if (toFetch.length === 0) return results;

  const supabase = getSupabase();
  if (!supabase) return results;

  try {
    const { data, error } = await supabase
      .from('precomputed_landed_costs')
      .select('*')
      .eq('destination_country', destinationCountry)
      .in('hs6', toFetch);

    if (error || !data) return results;

    for (const row of data as PrecomputedLandedCost[]) {
      results.set(row.hs6, row);
      memCache.set(`${row.hs6}_${destinationCountry}`, { data: row, ts: Date.now() });
    }
  } catch {
    // Return what we have from cache
  }

  return results;
}

// ─── HS10 Candidates Lookup ────────────────────────

/**
 * Look up precomputed HS10 candidates for a given HS6 code and country.
 */
export async function getPrecomputedHs10(
  hs6: string,
  country: string
): Promise<PrecomputedHs10 | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('precomputed_hs10_candidates')
      .select('*')
      .eq('hs6', hs6)
      .eq('country', country)
      .single();

    if (error || !data) return null;
    return data as PrecomputedHs10;
  } catch {
    return null;
  }
}

// ─── Cache Control ─────────────────────────────────

export function clearPrecomputedCache(): void {
  memCache.clear();
}

export function getPrecomputedCacheStats(): {
  size: number;
  totalCombinations: number;
  coverage: string;
} {
  return {
    size: memCache.size,
    totalCombinations: 117600,
    coverage: `${memCache.size}/117,600`,
  };
}
