#!/usr/bin/env node
/**
 * CW33 Completion Verification — row counts + sanity checks.
 * Does NOT require the server to be running.
 *
 * Verifies that all 27 CW33 items have data in their target tables.
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

// ─── Check list ────────────────────────────────────
const checks = [
  // Sprint 1 — Foundation
  { id: 'P0.1a', label: 'FTA agreements (expanded)', table: 'fta_agreements', min: 60 },
  { id: 'P0.1b', label: 'FTA members (expanded)', table: 'fta_members', min: 500 },
  { id: 'P0.1c', label: 'FTA product rules (RoO)', table: 'fta_product_rules', min: 2000 },
  { id: 'P0.2', label: 'Country profiles', table: 'country_profiles', min: 100 },
  { id: 'P0.3', label: 'HS classification overrides', table: 'hs_classification_overrides', min: 6 },
  { id: 'P0.4', label: 'Restricted items', table: 'restricted_items', min: 150 },
  // Sprint 2 — US/EU tax
  { id: 'P0.5', label: 'US additional tariffs (301/232/IEEPA)', table: 'us_additional_tariffs', min: 200 },
  { id: 'P0.6', label: 'US TRQ entries', table: 'us_tariff_rate_quotas', min: 300 },
  { id: 'P0.7', label: 'EU reduced VAT rates', table: 'eu_reduced_vat_rates', min: 30 },
  { id: 'P0.8', label: 'EU seasonal tariffs', table: 'eu_seasonal_tariffs', min: 10 },
  { id: 'P0.9', label: 'US state sales tax', table: 'us_state_sales_tax', min: 51 },
  { id: 'P0.10', label: 'Price break rules', table: 'price_break_rules', min: 200 },
  // Sprint 3 — Classifier + brands
  { id: 'P0.11a', label: 'HS codes (WCO + HTSUS)', table: 'hs_codes', min: 25000 },
  { id: 'P0.11b', label: 'HS keywords', table: 'hs_keywords', min: 40000 },
  { id: 'P0.12a', label: 'Brand origins', table: 'brand_origins', min: 250 },
  { id: 'P0.12b', label: 'Marketplace origins', table: 'marketplace_origins', min: 30 },
  { id: 'P0.13', label: 'EU VAT regimes (IOSS/OSS)', table: 'eu_vat_regimes', min: 4 },
  // Sprint 4 — Sanctions
  { id: 'P0.14-17', label: 'Sanctioned entities (5 sources)', table: 'sanctioned_entities', min: 45000 },
  // Sprint 5 — Currency + AD/CVD
  { id: 'P0.18', label: 'Exchange rate cache', table: 'exchange_rate_cache', min: 20000 },
  { id: 'P0.19', label: 'Trade remedies (AD/CVD)', table: 'trade_remedies', min: 500 },
  // Sprint 6 — P1
  { id: 'P1.1', label: 'Insurance rate tables', table: 'insurance_rate_tables', min: 5 },
  { id: 'P1.6', label: 'Specialized tax rates', table: 'specialized_tax_rates', min: 40 },
  { id: 'P1.ops', label: 'Data source health (registry)', table: 'data_source_health', min: 15 },
];

console.log('\n=== CW33 Completion Verification ===\n');
let passed = 0, failed = 0;
const results = [];
for (const c of checks) {
  const { count, error } = await sb.from(c.table).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`✗ ${c.id.padEnd(8)} ${c.label.padEnd(40)} ${c.table.padEnd(32)} ERROR: ${error.message.slice(0, 60)}`);
    failed++;
    results.push({ ...c, count: 0, ok: false });
  } else {
    const ok = (count ?? 0) >= c.min;
    const mark = ok ? '✓' : '✗';
    console.log(`${mark} ${c.id.padEnd(8)} ${c.label.padEnd(40)} ${c.table.padEnd(32)} ${String(count).padStart(7)} / ${c.min}+`);
    if (ok) passed++; else failed++;
    results.push({ ...c, count, ok });
  }
}

// ─── Source breakdown for sanctioned_entities ─────
console.log('\n=== Sanctions source breakdown ===');
for (const src of ['ofac_sdn', 'bis_entity', 'uk_hmt', 'un_consolidated', 'eu_consolidated']) {
  const { count } = await sb.from('sanctioned_entities').select('*', { count: 'exact', head: true }).eq('source', src);
  console.log(`  ${src.padEnd(20)} ${count}`);
}

// ─── FTA key check ─────────────────────────────
console.log('\n=== Key FTA presence ===');
const keys = ['UK-KR', 'KCFTA', 'KORUS', 'EU-KR', 'RCEP', 'USMCA', 'CPTPP'];
const { data: ftas } = await sb.from('fta_agreements').select('fta_code, fta_name').in('fta_code', keys);
for (const k of keys) {
  const row = (ftas || []).find(f => f.fta_code === k);
  console.log(`  ${row ? '✓' : '✗'} ${k.padEnd(10)} ${row?.fta_name || '(missing)'}`);
}

// ─── Summary ───────────────────────────────────
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}/${checks.length}`);
console.log(`Failed: ${failed}/${checks.length}`);
const totalRows = results.reduce((sum, r) => sum + (r.count || 0), 0);
console.log(`Total rows across CW33 tables: ${totalRows.toLocaleString()}`);

if (failed > 0) {
  console.log('\nFailed checks:');
  for (const r of results.filter(r => !r.ok)) {
    console.log(`  ${r.id} ${r.label}: ${r.count} / ${r.min}`);
  }
  process.exit(1);
}
