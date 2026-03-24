/**
 * Amazon 350-product v3 full pipeline benchmark (Step 0~6)
 * Usage: npx tsx scripts/bench_amazon_300.ts
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zyurflkhiregundhisky.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const INPUT = `${BASE}/amazon_all_products.json`;
const OUTPUT = `${BASE}/amazon_350_bench_result.json`;

const DEST_COUNTRIES = ['US','US','US','EU','GB','KR','JP','AU','CA','BR','TH','DE'];

async function main() {
  const products: any[] = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`\n=== Amazon 350 Benchmark (Step 0~6) ===\n`);
  console.log(`Products: ${products.length}`);

  const results: any[] = [];
  let errors = 0;
  let expanded = 0; // HS8/HS10
  let dutyFound = 0;
  let priceBreaks = 0;
  let totalTime = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const dest = DEST_COUNTRIES[i % DEST_COUNTRIES.length];

    try {
      const r = await classifyV3({
        product_name: p.product_name || '',
        material: p.material || 'unknown',
        origin_country: p.origin_country || 'CN',
        destination_country: dest,
        category: typeof p.category === 'string' ? p.category : (Array.isArray(p.category) ? p.category.join(' > ') : String(p.category || '')),
        description: p.description || '',
        processing: p.processing || '',
        composition: p.composition || '',
        weight_spec: p.weight_spec || '',
        price: p.price || undefined,
      });

      totalTime += r.processing_time_ms;
      const finalCode = r.final_hs_code || r.confirmed_hs6 || '';
      const isExpanded = finalCode.length > 6;
      if (isExpanded) expanded++;
      const duty = r.country_specific?.duty_rate;
      if (duty !== undefined && duty !== null) dutyFound++;
      if (r.price_break_applied) priceBreaks++;

      results.push({
        idx: i + 1,
        query: p.search_query || '',
        product_name: (p.product_name || '').substring(0, 50),
        material: (p.material || '').substring(0, 25),
        dest,
        section: r.confirmed_section,
        chapter: r.confirmed_chapter,
        heading: r.confirmed_heading,
        hs6: r.confirmed_hs6,
        final_code: finalCode,
        precision: r.hs_code_precision || 'HS6',
        duty_rate: duty,
        price_break: r.price_break_applied || false,
        confidence: r.confidence,
        ai_calls: r.ai_call_count || 0,
        time_ms: r.processing_time_ms,
      });

      if (i < 5 || i % 50 === 0) {
        console.log(`[${i+1}/${products.length}] ${(p.product_name||'').substring(0,30)} → ${finalCode}(${r.hs_code_precision}) dest=${dest} duty=${duty !== undefined ? duty+'%' : 'N/A'} ${r.processing_time_ms}ms`);
      }
    } catch (err: any) {
      errors++;
      results.push({ idx: i+1, query: p.search_query, product_name: (p.product_name||'').substring(0,50), error: err.message });
      if (errors <= 5) console.log(`❌ [${i+1}] ${err.message}`);
    }
  }

  const N = products.length;
  console.log(`\n=== Results ===`);
  console.log(`Total: ${N}, Errors: ${errors}`);
  console.log(`HS Code expanded (>6 digits): ${expanded}/${N} (${(expanded/N*100).toFixed(1)}%)`);
  console.log(`Duty rate found: ${dutyFound}/${N} (${(dutyFound/N*100).toFixed(1)}%)`);
  console.log(`Price breaks applied: ${priceBreaks}`);
  console.log(`Avg time: ${(totalTime/N).toFixed(0)}ms/item`);
  console.log(`AI calls: ${results.reduce((s,r) => s + (r.ai_calls||0), 0)} total`);

  // Category analysis
  const byCat: Record<string, {total:number, sections: Set<number>, chapters: Set<number>}> = {};
  for (const r of results) {
    if (r.error) continue;
    const cat = r.query || 'unknown';
    if (!byCat[cat]) byCat[cat] = {total:0, sections: new Set(), chapters: new Set()};
    byCat[cat].total++;
    byCat[cat].sections.add(r.section);
    byCat[cat].chapters.add(r.chapter);
  }
  console.log(`\n=== Category → Section/Chapter ===`);
  for (const [cat, info] of Object.entries(byCat).sort((a,b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${cat}: ${info.total} items → S${[...info.sections].join('/')} Ch${[...info.chapters].join('/')}`);
  }

  // Destination analysis
  const byDest: Record<string, {total:number, expanded:number, dutyFound:number, avgDuty: number[]}> = {};
  for (const r of results) {
    if (r.error) continue;
    const d = r.dest;
    if (!byDest[d]) byDest[d] = {total:0, expanded:0, dutyFound:0, avgDuty:[]};
    byDest[d].total++;
    if (r.final_code && r.final_code.length > 6) byDest[d].expanded++;
    if (r.duty_rate !== undefined && r.duty_rate !== null) {
      byDest[d].dutyFound++;
      byDest[d].avgDuty.push(r.duty_rate);
    }
  }
  console.log(`\n=== Destination Analysis ===`);
  for (const [dest, info] of Object.entries(byDest).sort((a,b) => b[1].total - a[1].total)) {
    const avgDuty = info.avgDuty.length > 0 ? (info.avgDuty.reduce((a,b)=>a+b,0)/info.avgDuty.length).toFixed(1) : 'N/A';
    console.log(`  ${dest}: ${info.total} items, expanded=${info.expanded}, duty=${info.dutyFound}/${info.total}, avg=${avgDuty}%`);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved: ${OUTPUT}`);
}

main().catch(console.error);
