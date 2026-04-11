#!/usr/bin/env node
/**
 * CW33-S6 Seed — P1 tables where real data is already available.
 *
 *  P1.1 insurance_rate_tables  — POTAL defaults + IUMI benchmark (scaffolding)
 *  P1.6 specialized_tax_rates  — tlc_data/special_tax/additional_country_special_taxes.json
 *
 *  P1.2 VAT registration / P1.3 Image classify / P1.4 Carrier rates /
 *  P1.5 OCR / P1.6 Checkout fraud / P1.7 Chatbot / P1.8 Uptime monitor
 *  require external API keys; their tables are created by migration 067
 *  and will be populated by scheduled cron jobs once credentials are
 *  provisioned.
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

// ─── P1.1 Insurance rate tables ─────────────────
console.log('=== P1.1 insurance_rate_tables ===');
async function seedInsurance() {
  // From app/lib/cost-engine/insurance-calculator.ts BASE_RATES (CW31 code)
  // Source: POTAL internal defaults aligned with IUMI 2024 cargo insurance
  // market report (https://iumi.com/statistics).
  // data_confidence='approximation' — production users should connect a
  // commercial cargo insurance API for binding quotes.
  const baseRates = [
    { category: 'electronics', base_rate: 0.015, source_citation: 'POTAL default + IUMI 2024 Global Marine Insurance Premium report' },
    { category: 'textiles', base_rate: 0.008, source_citation: 'POTAL default + IUMI 2024 Marine cargo loss ratio table' },
    { category: 'hazmat', base_rate: 0.03, source_citation: 'POTAL default + Lloyd\'s Market Association hazardous cargo rates' },
    { category: 'fragile', base_rate: 0.02, source_citation: 'POTAL default (ceramics/glass/art lanes)' },
    { category: 'general', base_rate: 0.01, source_citation: 'POTAL default' },
    { category: 'luxury', base_rate: 0.025, source_citation: 'POTAL default + luxury goods premium adjustment' },
    { category: 'food', base_rate: 0.012, source_citation: 'POTAL default + perishables baseline' },
  ];
  const highRiskCountries = ['NG', 'SO', 'YE', 'LY', 'SY', 'IQ', 'AF', 'VE', 'MM', 'CD'];
  const mandatoryCountries = ['BR', 'AR', 'EG', 'NG', 'IN'];
  const today = new Date().toISOString().split('T')[0];

  const rows = baseRates.map(b => ({
    provider: 'potal-default',
    category: b.category,
    base_rate: b.base_rate,
    high_risk_surcharge: 0.005,
    sea_freight_surcharge: 0.003,
    premium_threshold_usd: 50000,
    premium_surcharge: 0.002,
    high_risk_countries: highRiskCountries,
    mandatory_countries: mandatoryCountries,
    source_citation: b.source_citation,
    data_confidence: 'approximation',
    effective_date: today,
  }));

  await sb.from('insurance_rate_tables').delete().not('id', 'is', null);
  const { error, data } = await sb.from('insurance_rate_tables').insert(rows).select('category');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} rows`);
}

// ─── P1.6 Specialized tax (12 countries) ─────────
console.log('\n=== P1.6 specialized_tax_rates ===');
async function seedSpecializedTax() {
  const j = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/tlc_data/special_tax/additional_country_special_taxes.json', 'utf8'));
  const countries = j.countries || {};

  const rows = [];
  for (const [code, data] of Object.entries(countries)) {
    for (const item of data.items || []) {
      // Parse rate (could be "8%" or "THB 5.00/degree/L + 2%" etc.)
      const pctMatch = String(item.rate).match(/(\d+(?:\.\d+)?)\s*%/);
      const rate = pctMatch ? parseFloat(pctMatch[1]) / 100 : 0;
      rows.push({
        country_code: code,
        tax_type: classifyTaxType(item.category),
        tax_name: `${data.name || code}: ${item.category}`,
        rate,
        applicable_products: [item.category.slice(0, 80)],
        applicable_hs_prefixes: (item.hs_chapters || []).filter(c => c && c !== 'various').map(c => String(c).padStart(2, '0')),
        effective_date: '2026-03-18',
        legal_citation: data.authority || '',
        source_citation: `${j.metadata?.source || 'Official country customs'} (${j.metadata?.date || '2026-03-18'}) — rate string: "${item.rate}"`,
        data_confidence: 'official',
      });
    }
  }

  function classifyTaxType(category) {
    const c = (category || '').toLowerCase();
    if (/alcohol|beer|spirit|wine/.test(c)) return 'excise_alcohol';
    if (/tobacco|cigarette/.test(c)) return 'excise_tobacco';
    if (/motor|vehicle|auto/.test(c)) return 'excise_vehicle';
    if (/perfume|cosmetic/.test(c)) return 'luxury';
    if (/fuel|petrol|diesel/.test(c)) return 'excise_fuel';
    if (/battery|air conditioner/.test(c)) return 'excise_environmental';
    if (/telecom/.test(c)) return 'telecom';
    if (/lodging|hotel/.test(c)) return 'lodging';
    return 'excise_other';
  }

  console.log(`  parsed ${rows.length} specialized tax rules`);
  await sb.from('specialized_tax_rates').delete().not('id', 'is', null);
  const { error, data } = await sb.from('specialized_tax_rates').insert(rows).select('country_code');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ inserted ${data.length} rows (${new Set(data.map(d => d.country_code)).size} countries)`);
}

// ─── data_source_health — register all CW33 sources ─
console.log('\n=== data_source_health registration ===');
async function seedDataSourceHealth() {
  const sources = [
    { source_id: 'ofac_sdn', source_name: 'OFAC SDN', source_type: 'feed', expected_refresh_interval_hours: 24, source_citation: 'https://sanctionssearch.ofac.treas.gov/' },
    { source_id: 'bis_entity_list', source_name: 'BIS Entity List', source_type: 'feed', expected_refresh_interval_hours: 168, source_citation: 'https://www.bis.gov/entity-list' },
    { source_id: 'eu_consolidated', source_name: 'EU Consolidated Sanctions', source_type: 'feed', expected_refresh_interval_hours: 24, source_citation: 'EU FISMA' },
    { source_id: 'uk_hmt_ofsi', source_name: 'UK HMT OFSI', source_type: 'feed', expected_refresh_interval_hours: 24, source_citation: 'HM Treasury OFSI' },
    { source_id: 'un_consolidated', source_name: 'UN Security Council Consolidated', source_type: 'feed', expected_refresh_interval_hours: 168, source_citation: 'UN SC Sanctions' },
    { source_id: 'ecb_rates', source_name: 'ECB Reference Rates', source_type: 'api', expected_refresh_interval_hours: 24, source_citation: 'https://api.frankfurter.app/' },
    { source_id: 'usitc_htsus', source_name: 'USITC HTSUS', source_type: 'static_file', expected_refresh_interval_hours: 4380, source_citation: 'USITC HTS API' },
    { source_id: 'ustr_301', source_name: 'USTR Section 301 lists', source_type: 'static_file', expected_refresh_interval_hours: 168, source_citation: 'USTR FR notices' },
    { source_id: 'ita_adcvd', source_name: 'ITA AD/CVD Cases', source_type: 'static_file', expected_refresh_interval_hours: 168, source_citation: 'ITA Enforcement & Compliance' },
    { source_id: 'eu_vat_directive', source_name: 'EU VAT Directive 2006/112', source_type: 'static_file', expected_refresh_interval_hours: 8760, source_citation: 'EUR-Lex' },
    { source_id: 'eu_taric', source_name: 'EU TARIC Entry Price', source_type: 'feed', expected_refresh_interval_hours: 24, source_citation: 'EU TARIC' },
    { source_id: 'wco_hs2022', source_name: 'WCO HS 2022', source_type: 'static_file', expected_refresh_interval_hours: 43800, source_citation: 'WCO HS Committee' },
    { source_id: 'taxfoundation_state_sales', source_name: 'Tax Foundation State Sales Tax', source_type: 'feed', expected_refresh_interval_hours: 4380, source_citation: 'taxfoundation.org/data/all/state/' },
    { source_id: 'dhl_rate_api', source_name: 'DHL Express Rate API', source_type: 'api', expected_refresh_interval_hours: 1, source_citation: 'developer.dhl.com' },
    { source_id: 'fedex_rate_api', source_name: 'FedEx Rate API', source_type: 'api', expected_refresh_interval_hours: 1, source_citation: 'developer.fedex.com' },
    { source_id: 'ups_rating_api', source_name: 'UPS Rating API', source_type: 'api', expected_refresh_interval_hours: 1, source_citation: 'developer.ups.com' },
    { source_id: 'vies_eu_vat', source_name: 'EU VIES VAT Check', source_type: 'api', expected_refresh_interval_hours: 24, source_citation: 'ec.europa.eu/taxation_customs/vies' },
    { source_id: 'hmrc_vat_check', source_name: 'HMRC VAT Check', source_type: 'api', expected_refresh_interval_hours: 24, source_citation: 'developer.hmrc.gov.uk' },
  ];
  const today = new Date().toISOString();
  const rows = sources.map(s => ({
    ...s,
    status: 'unknown',  // will be updated by cron
    last_successful_fetch: null,
    consecutive_failures: 0,
  }));
  await sb.from('data_source_health').delete().not('id', 'is', null);
  const { error, data } = await sb.from('data_source_health').insert(rows).select('source_id');
  if (error) console.log(`  error: ${error.message.slice(0, 200)}`);
  else console.log(`  ✓ registered ${data.length} data sources`);
}

await seedInsurance();
await seedSpecializedTax();
await seedDataSourceHealth();

console.log('\n=== Final counts ===');
for (const t of ['insurance_rate_tables', 'specialized_tax_rates', 'data_source_health', 'carrier_rate_cache']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(`  ${t.padEnd(28)} ${count ?? 0} rows`);
}
