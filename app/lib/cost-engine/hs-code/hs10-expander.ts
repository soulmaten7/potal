/**
 * POTAL HS Code 10-Digit Expander
 *
 * Expands 6-digit HS codes to country-specific 10-digit tariff line codes.
 * Uses government APIs and cached expansion rules.
 *
 * Sources:
 * - USITC HTS (US 10-digit)
 * - UK Trade Tariff (10-digit commodity codes)
 * - EU TARIC (10-digit TARIC codes)
 * - Japan Customs (9-digit)
 * - Korea KCS (10-digit HSK)
 *
 * Fallback: hs_expansion_rules table in Supabase
 */

import { createClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────

export interface Hs10Variant {
  /** 10-digit tariff code */
  hs10: string;
  /** Description */
  description: string;
  /** Duty rate (if known) */
  dutyRate?: number;
  /** Unit of measure */
  unit?: string;
  /** Whether this is a statistical suffix */
  isStatistical?: boolean;
}

export interface Hs10ExpansionResult {
  /** Input 6-digit HS code */
  hs6: string;
  /** Country code */
  country: string;
  /** Expanded variants */
  variants: Hs10Variant[];
  /** Data source */
  source: string;
  /** Whether this came from cache */
  cached: boolean;
}

// ─── Supabase Client ──────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── DB Cache ─────────────────────────────────────

async function getFromExpansionCache(
  hs6: string,
  country: string,
): Promise<Hs10Variant[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('hs_expansion_rules')
      .select('hs10_variants, source')
      .eq('hs6', hs6)
      .eq('country', country.toUpperCase())
      .limit(1)
      .single();

    if (error || !data) return null;
    const variants = (data as any).hs10_variants;
    return Array.isArray(variants) ? variants : null;
  } catch {
    return null;
  }
}

async function saveToExpansionCache(
  hs6: string,
  country: string,
  variants: Hs10Variant[],
  source: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('hs_expansion_rules').upsert(
      {
        hs6,
        country: country.toUpperCase(),
        hs10_variants: variants,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'hs6,country' }
    );
  } catch {
    // Cache save failure is non-critical
  }
}

// ─── Government API Fetchers ──────────────────────

/**
 * Fetch US 10-digit HTS codes from USITC API.
 */
async function fetchUsHts10(hs6: string, timeoutMs = 10000): Promise<Hs10Variant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://hts.usitc.gov/api/search?query=${hs6}&from=0&size=20`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();

    if (!data?.results?.length) return [];

    return data.results
      .filter((r: any) => r.htsno?.startsWith(hs6.slice(0, 4)))
      .map((r: any) => ({
        hs10: (r.htsno || '').replace(/\./g, ''),
        description: r.description || '',
        dutyRate: r.general ? parseFloat(r.general.replace(/[^0-9.]/g, '')) / 100 : undefined,
        unit: r.unitOfQuantity || undefined,
      }))
      .filter((v: Hs10Variant) => v.hs10.length >= 8);
  } catch {
    return [];
  }
}

/**
 * Fetch UK 10-digit commodity codes from UK Trade Tariff API.
 */
async function fetchUkCommodity10(hs6: string, timeoutMs = 10000): Promise<Hs10Variant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    // UK API uses full heading lookup
    const heading = hs6.slice(0, 4);
    const url = `https://www.trade-tariff.service.gov.uk/api/v2/headings/${heading}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();

    const commodities = data?.data?.relationships?.commodities?.data || [];
    const included = data?.included || [];

    return commodities
      .map((c: any) => {
        const detail = included.find((i: any) => i.id === c.id && i.type === 'commodity');
        if (!detail) return null;
        const code = detail.attributes?.goods_nomenclature_item_id || '';
        if (!code.startsWith(hs6)) return null;
        return {
          hs10: code,
          description: detail.attributes?.description_plain || detail.attributes?.description || '',
        };
      })
      .filter(Boolean) as Hs10Variant[];
  } catch {
    return [];
  }
}

/**
 * Fetch EU TARIC 10-digit codes.
 */
async function fetchEuTaric10(hs6: string, timeoutMs = 10000): Promise<Hs10Variant[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const heading = hs6.slice(0, 4);
    const url = `https://www.trade-tariff.service.gov.uk/xi/api/v2/headings/${heading}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();

    const commodities = data?.data?.relationships?.commodities?.data || [];
    const included = data?.included || [];

    return commodities
      .map((c: any) => {
        const detail = included.find((i: any) => i.id === c.id && i.type === 'commodity');
        if (!detail) return null;
        const code = detail.attributes?.goods_nomenclature_item_id || '';
        if (!code.startsWith(hs6)) return null;
        return {
          hs10: code,
          description: detail.attributes?.description_plain || detail.attributes?.description || '',
        };
      })
      .filter(Boolean) as Hs10Variant[];
  } catch {
    return [];
  }
}

// ─── Main Expander ────────────────────────────────

/**
 * Expand a 6-digit HS code to country-specific 10-digit variants.
 *
 * @param hs6 - 6-digit HS code
 * @param countryCode - Destination country ISO code
 * @returns Expansion result with variants
 */
export async function expandHsCode(
  hs6: string,
  countryCode: string,
): Promise<Hs10ExpansionResult> {
  const cleanHs6 = hs6.replace(/[^0-9]/g, '').slice(0, 6);
  const country = countryCode.toUpperCase();

  // 1. Check DB cache
  const cached = await getFromExpansionCache(cleanHs6, country);
  if (cached && cached.length > 0) {
    return { hs6: cleanHs6, country, variants: cached, source: 'cache', cached: true };
  }

  // 2. Fetch from government API based on country
  let variants: Hs10Variant[] = [];
  let source = 'api';

  const EU_MEMBERS = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]);

  if (country === 'US') {
    variants = await fetchUsHts10(cleanHs6);
    source = 'usitc';
  } else if (country === 'GB') {
    variants = await fetchUkCommodity10(cleanHs6);
    source = 'uk-tariff';
  } else if (EU_MEMBERS.has(country)) {
    variants = await fetchEuTaric10(cleanHs6);
    source = 'eu-taric';
  }

  // 3. Save to cache if we got results
  if (variants.length > 0) {
    void saveToExpansionCache(cleanHs6, country, variants, source);
  }

  return {
    hs6: cleanHs6,
    country,
    variants,
    source: variants.length > 0 ? source : 'none',
    cached: false,
  };
}

/**
 * Get the best matching 10-digit code for a product.
 * Uses product name to pick the most relevant variant.
 */
export async function getBestHs10(
  hs6: string,
  countryCode: string,
  productName?: string,
): Promise<string | null> {
  const result = await expandHsCode(hs6, countryCode);
  if (result.variants.length === 0) return null;

  // If no product name, return first variant
  if (!productName) return result.variants[0].hs10;

  // Simple keyword matching to find best variant
  const productLower = productName.toLowerCase();
  const scored = result.variants.map(v => {
    const descLower = v.description.toLowerCase();
    const words = productLower.split(/\s+/);
    let score = 0;
    for (const word of words) {
      if (word.length >= 3 && descLower.includes(word)) score++;
    }
    return { variant: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].variant.hs10;
}

/**
 * Collect 10-digit data from government APIs for multiple HS codes.
 * Used for batch data collection.
 */
export async function collectHs10Data(
  hs6Codes: string[],
  country: string,
  delayMs = 500,
): Promise<Map<string, Hs10Variant[]>> {
  const results = new Map<string, Hs10Variant[]>();

  for (const hs6 of hs6Codes) {
    const expansion = await expandHsCode(hs6, country);
    results.set(hs6, expansion.variants);

    // Rate limiting delay
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
