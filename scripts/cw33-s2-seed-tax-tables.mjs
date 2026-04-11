#!/usr/bin/env node
/**
 * CW33-S2 Seed — US + EU tax / tariff tables.
 *
 * Processes 5 of 6 Sprint 2 items:
 *   P0.5 Section 301/232/IEEPA → us_additional_tariffs
 *   P0.6 US TRQ entries        → us_tariff_rate_quotas
 *   P0.7 EU VAT 27 members     → eu_reduced_vat_rates
 *   P0.8 EU seasonal tariffs   → eu_seasonal_tariffs
 *   P0.9 US state sales tax    → us_state_sales_tax
 *
 * P0.10 (price_break_rules from HTSUS) is done by a separate parser script.
 *
 * Sources (all from /Volumes/soulmaten/POTAL/):
 *   tlc_data/duty_rate/section_{301,232,ieepa_reciprocal}_hts.csv
 *   tlc_data/duty_rate/us_trq_entries.json
 *   tlc_data/vat_gst/{eu_27_vat_rates.csv,non_eu_vat_rates.csv}
 *   tlc_data/duty_rate/eu_seasonal_tariffs.json
 *   regulations/us/sales_tax/us_state_sales_tax_2024.json
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

const ROOT = '/Volumes/soulmaten/POTAL';
const TLC = `${ROOT}/tlc_data`;

// ─── CSV parser (RFC-4180 subset, handles quoted fields) ──
function parseCSV(text) {
  const rows = [];
  let cur = [''];
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') inQuote = false;
      else cur[cur.length - 1] += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ',') cur.push('');
      else if (c === '\n') { rows.push(cur); cur = ['']; }
      else if (c === '\r') { /* skip */ }
      else cur[cur.length - 1] += c;
    }
  }
  if (cur.length > 1 || cur[0]) rows.push(cur);
  const header = rows.shift();
  return rows.map(r => {
    const o = {};
    header.forEach((h, k) => { o[h] = r[k] ?? ''; });
    return o;
  });
}

function extractRatePct(rateText) {
  if (!rateText) return null;
  const m = String(rateText).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) / 100 : null;
}

// ─── P0.5 Section 301/232/IEEPA ──────────────────────────
console.log('\n=== P0.5 us_additional_tariffs ===');
async function seedAdditionalTariffs() {
  const files = [
    { file: 'section_301_hts.csv', program: 'sec301', legal: '19 USC §2411 (USTR Section 301)', origin: ['CN'] },
    { file: 'section_232_hts.csv', program: 'sec232', legal: '19 USC §1862 (Commerce Section 232)', origin: ['*'] },
    { file: 'ieepa_reciprocal_hts.csv', program: 'ieepa_reciprocal', legal: '50 USC §1701-1708 (IEEPA)', origin: ['MX', 'CA', 'CN', '*'] },
  ];
  const rows = [];
  for (const f of files) {
    const text = fs.readFileSync(`${TLC}/duty_rate/${f.file}`, 'utf8');
    const recs = parseCSV(text);
    for (const r of recs) {
      const hts = r.hts_code || r.htscode;
      if (!hts) continue;
      // Parse the applicable additional rate from general_rate text
      const rateStr = r.general_rate || '';
      const rate = extractRatePct(rateStr);
      rows.push({
        program: f.program,
        hs_prefix: hts,
        rate: rate ?? 0,
        origin_countries: f.origin,
        exempt_countries: [],
        product_description: (r.description || '').slice(0, 500),
        effective_date: '2026-03-18',
        legal_citation: f.legal,
        source_citation: `POTAL tlc_data/duty_rate/${f.file} (2026-03-18)`,
        data_confidence: 'official',
      });
    }
  }
  console.log(`  parsed ${rows.length} tariff rows`);
  // Clear + insert
  await sb.from('us_additional_tariffs').delete().not('id', 'is', null);
  const CHUNK = 500;
  let inserted = 0;
  for (let k = 0; k < rows.length; k += CHUNK) {
    const chunk = rows.slice(k, k + CHUNK);
    const { error } = await sb.from('us_additional_tariffs').insert(chunk);
    if (error) {
      console.log(`  chunk ${k}: ${error.message.slice(0, 150)}`);
    } else {
      inserted += chunk.length;
    }
  }
  console.log(`  ✓ inserted ${inserted} rows`);
}

// ─── P0.6 US TRQ ──────────────────────────────────────
console.log('\n=== P0.6 us_tariff_rate_quotas ===');
async function seedTRQ() {
  const j = JSON.parse(fs.readFileSync(`${TLC}/duty_rate/us_trq_entries.json`, 'utf8'));
  const entries = j.entries || [];
  const rows = entries.map(e => ({
    hs10: e.hts_code,
    description: (e.description || '').slice(0, 500),
    quota_year: 2026,
    in_quota_rate: e.general_rate || 'N/A',
    in_quota_rate_ad_valorem: extractRatePct(e.general_rate),
    over_quota_rate: e.other_rate || e.general_rate || 'N/A',
    over_quota_rate_ad_valorem: extractRatePct(e.other_rate || e.general_rate),
    effective_date: '2026-03-18',
    source_citation: j.metadata?.source || 'USITC HTS API',
    data_confidence: 'official',
  }));
  console.log(`  parsed ${rows.length} TRQ entries`);
  await sb.from('us_tariff_rate_quotas').delete().not('id', 'is', null);
  const CHUNK = 300;
  let inserted = 0;
  for (let k = 0; k < rows.length; k += CHUNK) {
    const chunk = rows.slice(k, k + CHUNK);
    const { error } = await sb.from('us_tariff_rate_quotas').insert(chunk);
    if (error) console.log(`  chunk ${k}: ${error.message.slice(0, 150)}`);
    else inserted += chunk.length;
  }
  console.log(`  ✓ inserted ${inserted} rows`);
}

// ─── P0.7 EU VAT ──────────────────────────────────────
console.log('\n=== P0.7 eu_reduced_vat_rates ===');
async function seedEuVat() {
  const euText = fs.readFileSync(`${TLC}/vat_gst/eu_27_vat_rates.csv`, 'utf8');
  const nonEuText = fs.existsSync(`${TLC}/vat_gst/non_eu_vat_rates.csv`)
    ? fs.readFileSync(`${TLC}/vat_gst/non_eu_vat_rates.csv`, 'utf8')
    : '';
  const euRows = parseCSV(euText);
  const nonEuRows = nonEuText ? parseCSV(nonEuText) : [];
  const all = [...euRows, ...nonEuRows];
  const rows = all.filter(r => r.country_code).map(r => ({
    country_code: r.country_code,
    country_name: r.country_name,
    standard_rate: parseFloat(r.standard_rate || 0) / 100,
    reduced_rate_1: r.reduced_rate_1 ? parseFloat(r.reduced_rate_1) / 100 : null,
    reduced_rate_2: r.reduced_rate_2 ? parseFloat(r.reduced_rate_2) / 100 : null,
    super_reduced_rate: r.super_reduced_rate ? parseFloat(r.super_reduced_rate) / 100 : null,
    parking_rate: r.parking_rate ? parseFloat(r.parking_rate) / 100 : null,
    zero_rated_categories: r.zero_rated_categories && r.zero_rated_categories !== 'none'
      ? r.zero_rated_categories.split(',').map(s => s.trim())
      : [],
    effective_date: '2026-03-18',
    source_citation: 'EU VAT Directive 2006/112/EC + national implementations (2026-03-18)',
    data_confidence: 'official',
  }));
  console.log(`  parsed ${rows.length} VAT rows`);
  await sb.from('eu_reduced_vat_rates').delete().not('id', 'is', null);
  const { error, data } = await sb.from('eu_reduced_vat_rates').insert(rows).select('country_code');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} rows`);
}

// ─── P0.8 EU seasonal tariffs ───────────────────────
console.log('\n=== P0.8 eu_seasonal_tariffs ===');
async function seedEuSeasonal() {
  const j = JSON.parse(fs.readFileSync(`${TLC}/duty_rate/eu_seasonal_tariffs.json`, 'utf8'));
  const entries = j.entry_price_products || [];

  // Parse "Oct-Jun higher, Jul-Sep lower" into month arrays
  function parseMonthRange(s) {
    const map = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const higher = new Set();
    const lower = new Set();
    const regex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(higher|lower|standard)/gi;
    let match;
    while ((match = regex.exec(s)) !== null) {
      const a = map[match[1].toLowerCase()];
      const b = map[match[2].toLowerCase()];
      const target = match[3].toLowerCase() === 'higher' ? higher : lower;
      // include months a..b (wrapping around end of year)
      let m = a;
      for (let i = 0; i < 12; i++) {
        target.add(m);
        if (m === b) break;
        m = m === 12 ? 1 : m + 1;
      }
    }
    return { higher: [...higher].sort((a, b) => a - b), lower: [...lower].sort((a, b) => a - b) };
  }

  const rows = entries.map(e => {
    const { higher, lower } = parseMonthRange(e.season || '');
    return {
      hs_subheading: e.hs,
      product_name: e.product,
      higher_months: higher,
      lower_months: lower,
      effective_year: 2026,
      source_citation: j.metadata?.source || 'EU TARIC Entry Price System',
      data_confidence: 'official',
    };
  });
  console.log(`  parsed ${rows.length} seasonal products`);
  await sb.from('eu_seasonal_tariffs').delete().not('id', 'is', null);
  const { error, data } = await sb.from('eu_seasonal_tariffs').insert(rows).select('hs_subheading');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} rows`);
}

// ─── P0.9 US State Sales Tax ──────────────────────
console.log('\n=== P0.9 us_state_sales_tax ===');
async function seedUsStateTax() {
  const j = JSON.parse(fs.readFileSync(`${ROOT}/regulations/us/sales_tax/us_state_sales_tax_2024.json`, 'utf8'));
  const states = j.states || [];

  // Economic nexus thresholds (post-Wayfair, South Dakota v. Wayfair 2018)
  // Sources: state DOR websites 2024 — most states use $100k or $100k/200 tx
  const nexusMap = {
    // $100k OR 200 tx
    'AL': { sales: 250000, tx: null }, 'AK': { sales: 100000, tx: 200 }, 'AZ': { sales: 100000, tx: null },
    'AR': { sales: 100000, tx: 200 }, 'CA': { sales: 500000, tx: null }, 'CO': { sales: 100000, tx: null },
    'CT': { sales: 100000, tx: 200 }, 'DC': { sales: 100000, tx: 200 }, 'FL': { sales: 100000, tx: null },
    'GA': { sales: 100000, tx: 200 }, 'HI': { sales: 100000, tx: 200 }, 'IA': { sales: 100000, tx: null },
    'ID': { sales: 100000, tx: null }, 'IL': { sales: 100000, tx: 200 }, 'IN': { sales: 100000, tx: null },
    'KS': { sales: 100000, tx: null }, 'KY': { sales: 100000, tx: 200 }, 'LA': { sales: 100000, tx: 200 },
    'MA': { sales: 100000, tx: null }, 'MD': { sales: 100000, tx: 200 }, 'ME': { sales: 100000, tx: null },
    'MI': { sales: 100000, tx: 200 }, 'MN': { sales: 100000, tx: 200 }, 'MO': { sales: 100000, tx: null },
    'MS': { sales: 250000, tx: null }, 'NC': { sales: 100000, tx: 200 }, 'ND': { sales: 100000, tx: null },
    'NE': { sales: 100000, tx: 200 }, 'NJ': { sales: 100000, tx: 200 }, 'NM': { sales: 100000, tx: null },
    'NV': { sales: 100000, tx: 200 }, 'NY': { sales: 500000, tx: 100 }, 'OH': { sales: 100000, tx: 200 },
    'OK': { sales: 100000, tx: null }, 'PA': { sales: 100000, tx: null }, 'RI': { sales: 100000, tx: 200 },
    'SC': { sales: 100000, tx: null }, 'SD': { sales: 100000, tx: null }, 'TN': { sales: 100000, tx: null },
    'TX': { sales: 500000, tx: null }, 'UT': { sales: 100000, tx: 200 }, 'VA': { sales: 100000, tx: 200 },
    'VT': { sales: 100000, tx: 200 }, 'WA': { sales: 100000, tx: null }, 'WI': { sales: 100000, tx: 200 },
    'WV': { sales: 100000, tx: 200 }, 'WY': { sales: 100000, tx: 200 },
    // No sales tax states
    'DE': { sales: null, tx: null }, 'MT': { sales: null, tx: null },
    'NH': { sales: null, tx: null }, 'OR': { sales: null, tx: null },
  };

  const rows = states.map(s => ({
    state_code: s.abbr,
    state_name: s.state,
    combined_avg_rate: s.combined_rate / 100,
    state_rate: s.state_rate / 100,
    max_local_rate: s.avg_local_rate / 100,
    nexus_sales_threshold_usd: nexusMap[s.abbr]?.sales ?? null,
    nexus_transactions_threshold: nexusMap[s.abbr]?.tx ?? null,
    marketplace_facilitator_law: s.state_rate > 0,
    post_wayfair: s.state_rate > 0,
    effective_date: '2024-01-01',
    source_citation: `${j.source} (${j.url}), nexus thresholds: state DOR websites`,
    data_confidence: 'secondary',  // 2024 data, pending 2026 refresh
  }));
  console.log(`  parsed ${rows.length} states`);
  await sb.from('us_state_sales_tax').delete().not('id', 'is', null);
  const { error, data } = await sb.from('us_state_sales_tax').insert(rows).select('state_code');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} states`);
}

// ─── Run all ───────────────────────────────────────
await seedAdditionalTariffs();
await seedTRQ();
await seedEuVat();
await seedEuSeasonal();
await seedUsStateTax();

console.log('\n=== Final counts ===');
for (const t of ['us_additional_tariffs', 'us_tariff_rate_quotas', 'eu_reduced_vat_rates', 'eu_seasonal_tariffs', 'us_state_sales_tax']) {
  const { data } = await sb.from(t).select('*').range(0, 9999);
  console.log(`  ${t.padEnd(30)} ${data?.length ?? 0} rows`);
}
