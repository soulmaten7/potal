/**
 * Amazon 50-product benchmark runner
 * Usage: npx tsx scripts/run_amazon_bench.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock Supabase to avoid DB dependency
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

// Import pipeline after env setup
import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

const INPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json';
const OUTPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/amazon_bench_result.json';

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  const products: any[] = JSON.parse(raw);

  console.log(`\n=== Amazon 50-Product Benchmark ===`);
  console.log(`Items: ${products.length}\n`);

  const results: any[] = [];
  let totalTime = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const input: ClassifyInputV3 = {
      product_name: p.product_name || '',
      material: p.material || '',
      origin_country: p.origin_country || 'CN',
      category: p.category || '',
      description: p.description || '',
      processing: p.processing || '',
      composition: p.composition || '',
      weight_spec: p.weight_spec || '',
      price: p.price || undefined,
    };

    try {
      const result = await classifyV3(input);
      totalTime += result.processing_time_ms;

      // Extract key decision path info
      const sectionStep = result.decision_path.find(d => d.step.includes('2-1'));
      const headingStep = result.decision_path.find(d => d.step.includes('Step 3'));
      const subheadingStep = result.decision_path.find(d => d.step.includes('Step 4'));

      results.push({
        idx: i + 1,
        asin: p.source_asin,
        query: p.search_query,
        product_name: (p.product_name || '').substring(0, 60),
        material: p.material,
        category: (p.category || '').substring(0, 40),
        section: result.confirmed_section,
        chapter: result.confirmed_chapter,
        heading: result.confirmed_heading,
        hs6: result.confirmed_hs6,
        confidence: result.confidence,
        section_method: sectionStep?.output_summary.substring(0, 60) || '',
        heading_method: headingStep?.output_summary.substring(0, 50) || '',
        subheading_method: subheadingStep?.output_summary.substring(0, 50) || '',
        time_ms: result.processing_time_ms,
      });

      const mark = result.confidence >= 0.5 ? '✅' : '⚠️';
      console.log(`${mark} #${i + 1} [${p.search_query}] → S${result.confirmed_section}/Ch${result.confirmed_chapter}/${result.confirmed_heading}/${result.confirmed_hs6} (${result.processing_time_ms}ms) "${(p.product_name || '').substring(0, 40)}"`);
    } catch (err: any) {
      console.log(`❌ #${i + 1} ERROR: ${err.message}`);
      results.push({
        idx: i + 1,
        asin: p.source_asin,
        query: p.search_query,
        product_name: (p.product_name || '').substring(0, 60),
        error: err.message,
      });
    }
  }

  // Summary by query category
  console.log(`\n=== Summary by Category ===`);
  const byQuery = new Map<string, any[]>();
  for (const r of results) {
    const q = r.query || 'unknown';
    if (!byQuery.has(q)) byQuery.set(q, []);
    byQuery.get(q)!.push(r);
  }
  for (const [query, items] of byQuery) {
    const sections = [...new Set(items.map(i => i.section))];
    const chapters = [...new Set(items.map(i => i.chapter))];
    const headings = [...new Set(items.map(i => i.heading))];
    console.log(`  ${query}: S${sections.join('/')} Ch${chapters.join('/')} H${headings.join('/')}`);
  }

  console.log(`\nTotal time: ${totalTime}ms, avg: ${(totalTime / products.length).toFixed(1)}ms/item`);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
