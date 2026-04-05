import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let cache: { data: DataFreshness[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

interface DataFreshness {
  name: string;
  lastUpdated: string | null;
  source: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface SourceQuery {
  name: string;
  table: string;
  column: string;
  filter?: { column: string; op: 'eq' | 'ilike' | 'neq'; value: string };
}

const SOURCE_QUERIES: SourceQuery[] = [
  { name: 'USITC', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'US' } },
  { name: 'UK Trade Tariff', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'GB' } },
  { name: 'EU TARIC', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'DE' } },
  { name: 'Canada CBSA', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'CA' } },
  { name: 'Australia ABF', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'AU' } },
  { name: 'Korea KCS', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'KR' } },
  { name: 'Japan Customs', table: 'precomputed_landed_costs', column: 'last_updated', filter: { column: 'destination_country', op: 'eq', value: 'JP' } },
  { name: 'MacMap MFN', table: 'precomputed_landed_costs', column: 'last_updated' },
  { name: 'Exchange Rates', table: 'exchange_rate_history', column: 'created_at' },
  { name: 'Section 301/232', table: 'country_regulatory_notes', column: 'created_at', filter: { column: 'category', op: 'neq', value: '__shannon_probe__' } },
  { name: 'Trade Remedies', table: 'country_regulatory_notes', column: 'created_at', filter: { column: 'category', op: 'eq', value: 'trade' } },
  { name: 'FTA Agreements', table: 'fta_agreements', column: 'updated_at' },
];

async function fetchFreshness(): Promise<DataFreshness[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const results: DataFreshness[] = [];

  for (const src of SOURCE_QUERIES) {
    try {
      let query = sb.from(src.table).select(src.column).order(src.column, { ascending: false }).limit(1);

      if (src.filter) {
        if (src.filter.op === 'eq') query = query.eq(src.filter.column, src.filter.value);
        else if (src.filter.op === 'ilike') query = query.ilike(src.filter.column, src.filter.value);
        else if (src.filter.op === 'neq') query = query.neq(src.filter.column, src.filter.value);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        results.push({ name: src.name, lastUpdated: null, source: src.table });
      } else {
        const row = data[0] as unknown as Record<string, string>;
        results.push({ name: src.name, lastUpdated: row[src.column] || null, source: src.table });
      }
    } catch {
      results.push({ name: src.name, lastUpdated: null, source: src.table });
    }
  }

  return results;
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ sources: cache.data, cached: true, ttl: CACHE_TTL });
  }

  const freshness = await fetchFreshness();
  cache = { data: freshness, timestamp: Date.now() };

  return NextResponse.json(
    { sources: freshness, cached: false, ttl: CACHE_TTL },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
