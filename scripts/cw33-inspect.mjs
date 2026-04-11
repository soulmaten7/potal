import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('=== fta_agreements (all 12) ===');
const { data: ftas } = await sb.from('fta_agreements').select('*').order('fta_code');
ftas?.forEach(f => console.log(`  ${f.fta_code.padEnd(14)} ${f.fta_name} mult=${f.preferential_multiplier} active=${f.is_active} excl=${JSON.stringify(f.excluded_chapters)}`));

console.log('\n=== fta_members (grouped by fta) ===');
const { data: mems } = await sb.from('fta_members').select('*');
const byFta = {};
mems?.forEach(m => { byFta[m.fta_code] = byFta[m.fta_code] || []; byFta[m.fta_code].push(m.country_code); });
Object.entries(byFta).forEach(([f, c]) => console.log(`  ${f.padEnd(14)} (${c.length}) ${c.sort().join(',')}`));

console.log('\n=== country_profiles (sample 5) ===');
const { data: cps } = await sb.from('country_profiles').select('*').limit(5);
cps?.forEach(c => console.log(`  ${c.country_code} ${c.country_name} vat=${c.vat_rate} dem=${c.de_minimis} ${c.currency || ''}`));
const { data: allCp } = await sb.from('country_profiles').select('country_code').range(0, 9999);
console.log(`  total: ${allCp?.length}`);

console.log('\n=== additional_tariffs (all 12) ===');
const { data: ats } = await sb.from('additional_tariffs').select('*');
ats?.forEach(a => console.log(`  ${JSON.stringify(a).slice(0,140)}`));

console.log('\n=== de_minimis_exceptions (all 33) ===');
const { data: dms } = await sb.from('de_minimis_exceptions').select('*').range(0, 50);
dms?.slice(0, 5).forEach(d => console.log(`  ${JSON.stringify(d).slice(0,150)}`));
console.log(`  total: ${dms?.length}`);

console.log('\n=== duty_rates (sample 3) ===');
const { data: drs } = await sb.from('duty_rates').select('*').limit(3);
drs?.forEach(d => console.log(`  cols: ${Object.keys(d).join(',')}`));
drs?.forEach(d => console.log(`  ${JSON.stringify(d).slice(0,120)}`));

console.log('\n=== restricted_items schema ===');
const { data: ris } = await sb.from('restricted_items').select('*').limit(2);
ris?.forEach(r => console.log(`  cols: ${Object.keys(r).join(',')}`));
console.log('\n=== dangerous_goods schema ===');
const { data: dgs } = await sb.from('dangerous_goods').select('*').limit(2);
dgs?.forEach(r => console.log(`  cols: ${Object.keys(r).join(',')}`));
