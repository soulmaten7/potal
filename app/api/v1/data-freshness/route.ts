import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MASTER_DATA_REGISTRY, type DataSource } from '@/app/lib/data-management/master-data-registry';

let cache: { data: FreshnessResult[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

interface FreshnessResult {
  name: string;
  shortLabel: string;
  category: string;
  lastUpdated: string | null;
  source: string;
  sourceUrl: string;
  announcementUrl?: string;
  updateFrequency: string;
  automationLevel: string;
  coverage: string;
  publisher: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Table → timestamp column mapping
const TIMESTAMP_COLUMNS: Record<string, string> = {
  exchange_rate_history: 'created_at',
  fta_agreements: 'updated_at',
  sanctioned_entities: 'created_at',
  customs_rulings: 'updated_at',
  trade_remedies: 'created_at',
  country_regulatory_notes: 'created_at',
  precomputed_landed_costs: 'last_updated',
  hs_codes: 'created_at',
  vat_gst_rates: 'created_at',
  restricted_items: 'created_at',
  eccn_entries: 'created_at',
  duty_rates_live: 'updated_at',
};

async function fetchFreshness(): Promise<FreshnessResult[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const results: FreshnessResult[] = [];

  for (const src of MASTER_DATA_REGISTRY) {
    const primaryTable = src.tables[0];
    if (!primaryTable) continue;

    const col = TIMESTAMP_COLUMNS[primaryTable] || 'created_at';
    let lastUpdated: string | null = null;

    try {
      const { data } = await sb
        .from(primaryTable)
        .select(col)
        .order(col, { ascending: false })
        .limit(1);
      if (data?.[0]) {
        lastUpdated = (data[0] as unknown as Record<string, string>)[col] || null;
      }
    } catch { /* table may not exist */ }

    results.push({
      name: src.name,
      shortLabel: src.shortLabel,
      category: src.category,
      lastUpdated,
      source: primaryTable,
      sourceUrl: src.sourceUrl,
      announcementUrl: src.announcementUrl,
      updateFrequency: src.updateFrequency,
      automationLevel: src.automationLevel,
      coverage: src.coverage,
      publisher: src.publisher,
    });
  }

  return results;
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ sources: cache.data, cached: true, ttl: CACHE_TTL, totalSources: cache.data.length });
  }

  const freshness = await fetchFreshness();
  cache = { data: freshness, timestamp: Date.now() };

  return NextResponse.json(
    { sources: freshness, cached: false, ttl: CACHE_TTL, totalSources: freshness.length },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
