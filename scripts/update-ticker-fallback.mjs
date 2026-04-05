import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if env vars not set (local dev)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch { /* no .env.local */ }
}
const OUTPUT_PATH = join(__dirname, '..', 'data', 'ticker-fallback.json');

const SOURCE_QUERIES = [
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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('[ticker-fallback] Supabase env missing — keeping existing fallback');
    process.exit(0);
  }

  const sb = createClient(url, key);
  const results = [];

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
        results.push({ name: src.name, lastUpdated: null });
      } else {
        results.push({ name: src.name, lastUpdated: data[0][src.column] || null });
      }
    } catch {
      results.push({ name: src.name, lastUpdated: null });
    }
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const output = { generatedAt: new Date().toISOString(), sources: results };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`[ticker-fallback] ${results.filter(r => r.lastUpdated).length}/${results.length} sources updated`);
}

main().catch((err) => {
  console.error('[ticker-fallback] Error (build continues):', err.message);
  process.exit(0);
});
