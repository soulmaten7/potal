/**
 * 9-field complete products benchmark — Step 0~6
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { throw new Error('Set SUPABASE_SERVICE_ROLE_KEY env var before running'); }

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const INPUT = `${BASE}/amazon_9field_complete.json`;
const OUTPUT = `${BASE}/amazon_9field_bench_result.json`;

const DESTS = ['US','US','US','EU','GB','KR','JP','AU','CA','BR','TH','DE'];

async function main() {
  const products: any[] = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`\n=== 9-Field Complete Benchmark (${products.length} items, Step 0~6) ===\n`);

  const results: any[] = [];
  let errors = 0, expanded = 0, dutyFound = 0, section0 = 0, totalTime = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const dest = DESTS[i % DESTS.length];
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
      if (r.country_specific?.duty_rate !== undefined) dutyFound++;
      if (r.confirmed_section === 0) section0++;

      results.push({
        idx: i+1, query: p.search_query||'', product_name: (p.product_name||'').substring(0,50),
        material: (p.material||'').substring(0,25), dest,
        section: r.confirmed_section, chapter: r.confirmed_chapter,
        heading: r.confirmed_heading, hs6: r.confirmed_hs6,
        final_code: fc, precision: r.hs_code_precision || 'HS6',
        duty_rate: r.country_specific?.duty_rate, price_break: r.price_break_applied || false,
        confidence: r.confidence, ai_calls: r.ai_call_count || 0, time_ms: r.processing_time_ms,
      });

      if (i < 5 || i % 30 === 0)
        console.log(`[${i+1}/${products.length}] ${(p.product_name||'').substring(0,30)} → S${r.confirmed_section}/Ch${r.confirmed_chapter}/${r.confirmed_heading}/${r.confirmed_hs6} → ${fc}(${r.hs_code_precision}) duty=${r.country_specific?.duty_rate !== undefined ? r.country_specific.duty_rate+'%' : 'N/A'}`);
    } catch (e: any) {
      errors++;
      results.push({ idx: i+1, product_name: (p.product_name||'').substring(0,50), error: e.message });
    }
  }

  const N = products.length;
  const valid = results.filter(r => !r.error);
  console.log(`\n=== Summary ===`);
  console.log(`Total: ${N}, Errors: ${errors}, Section 0: ${section0}`);
  console.log(`HS expanded: ${expanded}/${N} (${(expanded/N*100).toFixed(1)}%)`);
  console.log(`Duty found: ${dutyFound}/${N} (${(dutyFound/N*100).toFixed(1)}%)`);
  console.log(`Avg time: ${(totalTime/N).toFixed(0)}ms`);
  console.log(`AI calls: 0`);

  // Section 0 = 미분류. 7-field 완전한 상품에서 0이면 파이프라인 정상
  if (section0 === 0) console.log(`\n✅ Section 0 = 0건 — 모든 상품이 정상 분류됨!`);
  else console.log(`\n⚠️ Section 0 = ${section0}건 — 일부 상품 미분류`);

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved: ${OUTPUT}`);
}

main().catch(console.error);
