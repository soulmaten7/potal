#!/usr/bin/env node
/**
 * CW33 Phase B — Supabase table existence + row count audit.
 * Run from repo root: node scripts/cw33-check-tables.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const tables = [
  // CW33-S1 Foundation
  'fta_agreements', 'fta_country_pairs', 'fta_members', 'fta_product_rules',
  'country_profiles', 'de_minimis_exceptions',
  'hs_classification_overrides', 'import_restrictions',
  // CW33-S2 US/EU Tax
  'us_additional_tariffs', 'us_tariff_rate_quotas', 'us_state_sales_tax',
  'eu_reduced_vat_rates', 'eu_seasonal_tariffs', 'price_break_rules',
  // CW33-S3 Classifier
  'hs_codes', 'hs_keywords', 'eu_vat_regimes', 'brand_origins', 'marketplace_origins',
  // CW33-S4 Sanctions
  'sanctioned_entities',
  // CW33-S5 Currency + AD/CVD
  'exchange_rate_cache', 'trade_remedies',
  // CW33-S6 P1
  'insurance_rate_tables', 'specialized_tax_rates', 'carrier_rate_cache',
  // Existing (pre-CW33)
  'duty_rates', 'additional_tariffs', 'duty_rates_live',
  'dangerous_goods', 'restricted_items', 'special_tax_rules',
  'digital_services_tax', 'sub_national_taxes',
];

console.log(`\nCW33 Phase B — Supabase table audit (${process.env.NEXT_PUBLIC_SUPABASE_URL})\n`);
const missing = [];
const present = [];
for (const t of tables) {
  try {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      if (/does not exist|schema.*not found|relation.*not found|PGRST.*not find|Could not find/i.test(error.message)) {
        missing.push(t);
        console.log(`✗ ${t.padEnd(32)} MISSING`);
      } else {
        console.log(`? ${t.padEnd(32)} ${error.message.slice(0, 60)}`);
      }
    } else {
      present.push({ t, count });
      console.log(`✓ ${t.padEnd(32)} ${count} rows`);
    }
  } catch (e) {
    console.log(`✗ ${t.padEnd(32)} ${e.message.slice(0, 60)}`);
  }
}

console.log(`\n==== Summary ====`);
console.log(`Present: ${present.length}`);
console.log(`Missing: ${missing.length}`);
if (missing.length) {
  console.log(`\nMissing tables:`);
  missing.forEach(t => console.log(`  - ${t}`));
}
