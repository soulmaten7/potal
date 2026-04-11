#!/usr/bin/env node
/**
 * CW33-S2 P0.10 — HTSUS price break rules parser.
 * Source: /Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json
 * Target: price_break_rules table
 *
 * Extracts entries whose description contains "valued over/not over $X/unit".
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const HTS_PATH = '/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json';
const hts = JSON.parse(fs.readFileSync(HTS_PATH, 'utf8'));
console.log(`Loaded HTSUS 2026 rev4: ${hts.length} entries`);

// Regex captures "valued (not) over/at (not more than) $X/unit"
const priceBreakRe = /valued\s+(not\s+over|over|at\s+not\s+more\s+than|not\s+more\s+than)\s+\$([0-9]+(?:\.[0-9]+)?)\s*(?:\/|per|each)?\s*(\w+)?/i;

function extractRatePct(rate) {
  if (!rate) return null;
  const m = String(rate).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) / 100 : null;
}

const rows = [];
for (const e of hts) {
  if (!e.htsno || !e.description) continue;
  const m = e.description.match(priceBreakRe);
  if (!m) continue;
  const operator = m[1].includes('not') ? 'under' : 'over';
  const threshold = parseFloat(m[2]);
  const unit = (m[3] || 'per_unit').toLowerCase();
  const normalizedUnit = unit.startsWith('k') ? 'per_kg'
    : unit.startsWith('lit') || unit === 'l' ? 'per_liter'
    : unit.startsWith('pair') ? 'per_pair'
    : unit.startsWith('dozen') || unit === 'doz' ? 'per_dozen'
    : 'per_unit';
  const hsCode = e.htsno.replace(/\./g, '');
  rows.push({
    hs_code: hsCode.slice(0, 10),
    threshold_usd: threshold,
    threshold_unit: normalizedUnit,
    operator,
    above_rate: operator === 'over' ? (e.general || null) : null,
    below_rate: operator === 'under' ? (e.general || null) : null,
    above_rate_ad_valorem: operator === 'over' ? extractRatePct(e.general) : null,
    below_rate_ad_valorem: operator === 'under' ? extractRatePct(e.general) : null,
    effective_date: '2026-01-01',
    source_citation: 'USITC HTSUS 2026 rev4',
    data_confidence: 'official',
  });
}
console.log(`Parsed ${rows.length} price-break rules`);

await sb.from('price_break_rules').delete().not('id', 'is', null);
const CHUNK = 300;
let inserted = 0;
for (let k = 0; k < rows.length; k += CHUNK) {
  const chunk = rows.slice(k, k + CHUNK);
  const { error } = await sb.from('price_break_rules').insert(chunk);
  if (error) console.log(`  chunk ${k}: ${error.message.slice(0, 150)}`);
  else inserted += chunk.length;
}
console.log(`✓ Inserted ${inserted} rows`);

// Sample verify
const { data } = await sb.from('price_break_rules').select('hs_code, threshold_usd, threshold_unit, operator, above_rate').limit(5);
console.log('\nSample rows:');
for (const r of data) console.log(`  ${r.hs_code} ${r.operator} $${r.threshold_usd}/${r.threshold_unit} → ${r.above_rate || '(n/a)'}`);
