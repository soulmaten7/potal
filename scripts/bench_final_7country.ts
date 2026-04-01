/**
 * Final Benchmark: 169 valid items × 7 countries = 1,183 runs
 * + US 169 HTS description verification
 * + WRONG_SUBCODE tracking
 */
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { throw new Error('Set SUPABASE_SERVICE_ROLE_KEY env var before running'); }

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const INVALID_MATS = new Set(['blend', 'other', 'unknown', 'various', 'mixed', 'n/a', 'na', 'none', '']);
const COUNTRIES = ['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA'];

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const all: any[] = JSON.parse(fs.readFileSync(`${BASE}/amazon_9field_complete.json`, 'utf-8'));
  const products = all.filter(p => !INVALID_MATS.has((p.material || '').trim().toLowerCase()));
  console.log(`\n=== Final Benchmark: ${products.length} valid × 7 countries = ${products.length * 7} runs ===\n`);

  const countryResults: Record<string, any[]> = {};
  const countryStats: Record<string, any> = {};

  for (const dest of COUNTRIES) {
    const results: any[] = [];
    let expanded = 0, errors = 0, totalTime = 0;
    const methods: Record<string, number> = {};

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        const r = await classifyV3({
          product_name: p.product_name || '',
          material: p.material || 'unknown',
          origin_country: p.origin_country || 'CN',
          destination_country: dest,
          category: typeof p.category === 'string' ? p.category : String(p.category || ''),
          description: p.description || '',
          processing: p.processing || '',
          composition: p.composition || '',
          weight_spec: p.weight_spec || '',
          price: p.price || undefined,
        });

        totalTime += r.processing_time_ms;
        const fc = r.final_hs_code || r.confirmed_hs6 || '';
        if (fc.length > 6) expanded++;
        const method = r.country_specific?.method || 'none';
        methods[method] = (methods[method] || 0) + 1;

        results.push({
          idx: i + 1,
          product_name: (p.product_name || '').substring(0, 50),
          material: (p.material || '').substring(0, 20),
          dest,
          hs6: r.confirmed_hs6,
          final_code: fc,
          precision: r.hs_code_precision || 'HS6',
          duty_rate: r.country_specific?.duty_rate,
          method,
          confidence: r.confidence,
          time_ms: r.processing_time_ms,
        });
      } catch (e: any) {
        errors++;
        results.push({ idx: i + 1, product_name: (p.product_name || '').substring(0, 50), dest, error: e.message });
      }
    }

    countryResults[dest] = results;
    const N = products.length;
    const dutyFound = results.filter(r => r.duty_rate !== undefined && r.duty_rate !== null).length;
    countryStats[dest] = {
      total: N, expanded, errors, dutyFound,
      expandPct: Math.round(expanded / N * 100),
      dutyPct: Math.round(dutyFound / N * 100),
      avgTime: Math.round(totalTime / N),
      methods,
    };

    console.log(`${dest}: expanded=${expanded}/${N} (${countryStats[dest].expandPct}%) duty=${dutyFound} method=${JSON.stringify(methods).substring(0, 80)}`);
  }

  // ═══ US HTS Description Verification ═══
  console.log('\n=== US HTS Description Verification ===');
  const usResults = countryResults['US'];
  let match = 0, partial = 0, review = 0, noExp = 0;

  for (const r of usResults) {
    if (r.error || !r.final_code || r.final_code.length <= 6) {
      noExp++;
      r.judgment = 'NO_EXPANSION';
      continue;
    }

    // Lookup HTS description
    const { data } = await supabase
      .from('gov_tariff_schedules')
      .select('description')
      .eq('country', 'US')
      .eq('hs_code', r.final_code)
      .limit(1);

    const htsDesc = data?.[0]?.description || '';
    r.hts_description = htsDesc;

    const nl = (r.product_name || '').toLowerCase();
    const ml = (r.material || '').toLowerCase();
    const dl = htsDesc.toLowerCase();

    if (ml.length > 2 && dl.includes(ml)) { match++; r.judgment = 'MATCH'; }
    else if (['cotton','steel','leather','bamboo','ceramic','glass','plastic','rubber','aluminum','silk','wool','polyester','iron','wax']
      .some(m => ml.includes(m) && dl.includes(m))) { match++; r.judgment = 'MATCH'; }
    else {
      const words = nl.split(/\s+/).filter(w => w.length > 3);
      const matched = words.filter(w => dl.includes(w));
      if (matched.length >= 2) { match++; r.judgment = 'MATCH'; }
      else if (matched.length >= 1 || dl.includes('other')) { partial++; r.judgment = 'PARTIAL'; }
      else { review++; r.judgment = 'REVIEW'; }
    }
  }

  const expanded154 = usResults.filter(r => r.final_code && r.final_code.length > 6).length;
  console.log(`US Verification: MATCH=${match} PARTIAL=${partial} REVIEW=${review} NO_EXP=${noExp}`);
  console.log(`10-digit accuracy (MATCH+PARTIAL): ${match + partial}/${expanded154} (${Math.round((match + partial) / expanded154 * 100)}%)`);

  // ═══ Summary ═══
  console.log('\n=== 7-Country Summary ===');
  console.log('Country  Expand  Expand%  Duty  Duty%  AvgMs  Pattern  DB');
  for (const dest of COUNTRIES) {
    const s = countryStats[dest];
    const pat = (s.methods.pattern_strong || 0) + (s.methods.pattern_match || 0) + (s.methods.pattern_catch_all || 0);
    const db = (s.methods.db_keyword_match || 0) + (s.methods.exact_match || 0);
    console.log(`${dest}  ${s.expanded}/${s.total}  ${s.expandPct}%  ${s.dutyFound}  ${s.dutyPct}%  ${s.avgTime}ms  ${pat}  ${db}`);
  }

  // Save
  fs.writeFileSync(`${BASE}/final_7country_benchmark.json`, JSON.stringify({
    countryStats, usVerification: { match, partial, review, noExp },
  }, null, 2));

  fs.writeFileSync(`${BASE}/final_us_169_detail.json`, JSON.stringify(usResults, null, 2));

  console.log(`\n✅ Saved: final_7country_benchmark.json + final_us_169_detail.json`);
}

main().catch(console.error);
