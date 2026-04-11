#!/usr/bin/env node
/**
 * CW33-S5 Seed — exchange_rate_cache + trade_remedies
 *
 * Sources:
 *   - tlc_data/currency/ecb_historical_rates.xml (8 MB — ECB reference rates)
 *   - tlc_data/ad_cvd/ita_adcvd_cases_2000_current.json (590 cases)
 *   - tlc_data/ad_cvd/adcvd_scope_rulings.json (scope rulings)
 *   - tlc_data/ad_cvd/ita_sunset_continuations.json
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

const TLC = '/Volumes/soulmaten/POTAL/tlc_data';

// ─── P0.18 Exchange rate cache (ECB historical) ─────
console.log('=== P0.18 exchange_rate_cache ===');
async function seedEcbRates() {
  const xml = fs.readFileSync(`${TLC}/currency/ecb_historical_rates.xml`, 'utf8');
  // Parse each <Cube time="YYYY-MM-DD"> ... </Cube> block
  const dayBlocks = [...xml.matchAll(/<Cube time="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/Cube>/g)];
  console.log(`  parsed ${dayBlocks.length} daily blocks`);

  const rows = [];
  for (const [, date, block] of dayBlocks) {
    // ECB publishes rates as EUR→X. Inner Cubes: <Cube currency="USD" rate="1.1531"/>
    const currencies = [...block.matchAll(/<Cube currency="([A-Z]{3})" rate="([\d.]+)"\/>/g)];
    for (const [, ccy, rate] of currencies) {
      // We want USD-based rates — compute USD→ccy using EUR→USD and EUR→ccy.
      // For now, store EUR-based rates and another row for USD computed later.
      rows.push({
        base_currency: 'EUR',
        target_currency: ccy,
        rate: parseFloat(rate),
        rate_date: date,
        source: 'ecb',
        source_citation: 'European Central Bank reference rates (2026-03-18 snapshot)',
        data_confidence: 'official',
      });
    }
  }
  console.log(`  total EUR-based rows: ${rows.length}`);

  // Compute USD-based rates by inverse EUR/USD rate. Do this per-day.
  const usdRows = [];
  for (const [, date, block] of dayBlocks) {
    const usdMatch = block.match(/<Cube currency="USD" rate="([\d.]+)"\/>/);
    if (!usdMatch) continue;
    const eurToUsd = parseFloat(usdMatch[1]);
    if (!eurToUsd) continue;
    const currencies = [...block.matchAll(/<Cube currency="([A-Z]{3})" rate="([\d.]+)"\/>/g)];
    // USD → EUR = 1 / eurToUsd
    usdRows.push({
      base_currency: 'USD',
      target_currency: 'EUR',
      rate: 1 / eurToUsd,
      rate_date: date,
      source: 'ecb',
      source_citation: 'Derived from ECB EUR/USD reference rate',
      data_confidence: 'official',
    });
    // USD → X = (EUR → X) / (EUR → USD)
    for (const [, ccy, eurToCcy] of currencies) {
      if (ccy === 'USD') continue;
      usdRows.push({
        base_currency: 'USD',
        target_currency: ccy,
        rate: parseFloat(eurToCcy) / eurToUsd,
        rate_date: date,
        source: 'ecb',
        source_citation: 'Derived from ECB cross rates (EUR→X ÷ EUR→USD)',
        data_confidence: 'official',
      });
    }
  }
  console.log(`  total USD-based derived: ${usdRows.length}`);

  const all = [...rows, ...usdRows];
  // Keep last 400 days only to stay within a reasonable seed size
  // Sort by date desc, then take first 400 unique dates, then flatten
  const byDate = {};
  for (const r of all) {
    (byDate[r.rate_date] = byDate[r.rate_date] || []).push(r);
  }
  const sortedDates = Object.keys(byDate).sort().reverse().slice(0, 400);
  const filtered = sortedDates.flatMap(d => byDate[d]);
  console.log(`  keeping most recent ${sortedDates.length} days = ${filtered.length} rows`);

  await sb.from('exchange_rate_cache').delete().not('id', 'is', null);
  const CHUNK = 500;
  let inserted = 0, errors = 0;
  for (let k = 0; k < filtered.length; k += CHUNK) {
    const chunk = filtered.slice(k, k + CHUNK);
    const { error } = await sb.from('exchange_rate_cache').insert(chunk);
    if (error) { errors++; if (errors < 3) console.log(`  ${k}: ${error.message.slice(0, 150)}`); }
    else inserted += chunk.length;
  }
  console.log(`  ✓ inserted ${inserted} exchange rate rows (errors: ${errors})`);
}

// ─── P0.19 Trade remedies (AD/CVD cases) ─────
console.log('\n=== P0.19 trade_remedies ===');
async function seedTradeRemedies() {
  // The ita_adcvd_cases_2000_current.json is column-keyed (non-standard)
  // Structure: {metadata, fields[8], cases: [{col1:val1, col2:val2, ...}]}
  const j = JSON.parse(fs.readFileSync(`${TLC}/ad_cvd/ita_adcvd_cases_2000_current.json`, 'utf8'));
  const fieldKeys = j.fields || [];  // e.g. ['A-570-862', 'China (PRC)', 'Foundry Coke Products', ...]
  // fieldKeys[0] = case_number col header, [1] = country, [2] = product,
  // [3] = petition date, [4] = preliminary date, [5] = prelim determination,
  // [6] = final determination, [7] = order date
  const cases = j.cases || [];
  console.log(`  parsed ${cases.length} AD/CVD cases`);

  const rows = [];
  for (const c of cases) {
    const vals = fieldKeys.map(k => c[k]);
    const caseNumber = vals[0];
    if (!caseNumber || caseNumber.length < 5) continue;
    const remedyType = caseNumber.startsWith('A-') ? 'anti_dumping'
      : caseNumber.startsWith('C-') ? 'countervailing' : 'other';
    const countryRaw = (vals[1] || '').trim();
    // Extract ISO code from "China (PRC)" style
    const countryMap = {
      'China (PRC)': 'CN', 'China': 'CN', 'Vietnam': 'VN', 'Thailand': 'TH',
      'Taiwan': 'TW', 'Japan': 'JP', 'South Korea': 'KR', 'Korea': 'KR',
      'India': 'IN', 'Russia': 'RU', 'Turkey': 'TR', 'Brazil': 'BR',
      'Mexico': 'MX', 'Italy': 'IT', 'Germany': 'DE', 'France': 'FR',
      'Argentina': 'AR', 'Canada': 'CA', 'Spain': 'ES', 'United Kingdom': 'GB',
      'Indonesia': 'ID', 'Malaysia': 'MY', 'Ukraine': 'UA', 'Belarus': 'BY',
      'Australia': 'AU', 'South Africa': 'ZA', 'Egypt': 'EG', 'Saudi Arabia': 'SA',
    };
    const origin = countryMap[countryRaw] || (countryRaw.match(/\(([A-Z]{2,3})\)/)?.[1] || 'XX');

    function parseDate(s) {
      if (!s) return null;
      try {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
      } catch { return null; }
    }

    rows.push({
      case_number: caseNumber.slice(0, 20),
      remedy_type: remedyType,
      product_description: (vals[2] || '').slice(0, 500),
      origin_country: origin.slice(0, 2),
      destination_country: 'US',
      status: vals[7] ? 'order_in_effect' : (vals[6] ? 'final_determination' : 'initiated'),
      initiation_date: parseDate(vals[3]),
      order_date: parseDate(vals[7]),
      source_citation: `ITA Enforcement & Compliance 2000-2026 (${j.metadata?.date || '2026-03-18'})`,
      data_confidence: 'official',
    });
  }
  console.log(`  built ${rows.length} rows`);

  await sb.from('trade_remedies').delete().not('id', 'is', null);
  const CHUNK = 300;
  let inserted = 0, errors = 0;
  for (let k = 0; k < rows.length; k += CHUNK) {
    const chunk = rows.slice(k, k + CHUNK);
    const { error } = await sb.from('trade_remedies').insert(chunk);
    if (error) { errors++; if (errors < 3) console.log(`  ${k}: ${error.message.slice(0, 150)}`); }
    else inserted += chunk.length;
  }
  console.log(`  ✓ inserted ${inserted} AD/CVD rows (errors: ${errors})`);
}

await seedEcbRates();
await seedTradeRemedies();

console.log('\n=== Final counts ===');
for (const t of ['exchange_rate_cache', 'trade_remedies']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(`  ${t.padEnd(25)} ${count} rows`);
}
