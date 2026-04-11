import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  'fta_agreements','fta_country_pairs','fta_members','fta_product_rules',
  'country_profiles','de_minimis_exceptions','hs_classification_overrides','import_restrictions',
  'us_additional_tariffs','us_tariff_rate_quotas','us_state_sales_tax',
  'eu_reduced_vat_rates','eu_seasonal_tariffs','price_break_rules',
  'hs_codes','hs_keywords','eu_vat_regimes','brand_origins','marketplace_origins',
  'sanctioned_entities','exchange_rate_cache','trade_remedies',
  'insurance_rate_tables','specialized_tax_rates','carrier_rate_cache',
];
for (const t of tables) {
  const { data, error } = await supabase.from(t).select('*').limit(1);
  if (error) { console.log(`✗ ${t.padEnd(30)} ${error.message.slice(0,50)}`); continue; }
  const { count } = await supabase.from(t).select('*', { count: 'planned' }).limit(0);
  const { data: all } = await supabase.from(t).select('*').range(0, 9999);
  console.log(`${t.padEnd(30)} planned=${count ?? '?'} actual=${all?.length ?? 0}`);
  if (all?.length) console.log(`  sample cols: ${Object.keys(all[0]).slice(0,8).join(', ')}`);
}
