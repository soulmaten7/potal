/**
 * Amazon 50-product Ablation (field removal) test
 * Usage: npx tsx scripts/ablation_test.ts
 */

import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

const INPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json';
const OUTPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/ablation_results.json';

// Ground truth: heading-level (4-digit) correctness from baseline run
// We'll compute baseline first, then compare each ablation against it

interface AblationResult {
  name: string;
  fields_used: string[];
  fields_removed: string[];
  field_count: number;
  section_correct: number;
  chapter_correct: number;
  heading_correct: number;
  hs6_correct: number;
  total: number;
  section_pct: number;
  chapter_pct: number;
  heading_pct: number;
  hs6_pct: number;
}

const ALL_FIELDS = ['product_name', 'material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price'];

async function runTest(products: any[], removedFields: string[], testName: string, baseline: any[] | null): Promise<AblationResult> {
  const fieldsUsed = ALL_FIELDS.filter(f => !removedFields.includes(f));
  let sectionOk = 0, chapterOk = 0, headingOk = 0, hs6Ok = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const input: ClassifyInputV3 = {
      product_name: removedFields.includes('product_name') ? 'unknown product' : (p.product_name || ''),
      material: removedFields.includes('material') ? '' : (p.material || ''),
      origin_country: removedFields.includes('origin_country') ? '' : (p.origin_country || 'CN'),
      category: removedFields.includes('category') ? '' : (p.category || ''),
      description: removedFields.includes('description') ? '' : (p.description || ''),
      processing: removedFields.includes('processing') ? '' : (p.processing || ''),
      composition: removedFields.includes('composition') ? '' : (p.composition || ''),
      weight_spec: removedFields.includes('weight_spec') ? '' : (p.weight_spec || ''),
      price: removedFields.includes('price') ? undefined : (p.price || undefined),
    };

    // material and origin_country are required (min 2 chars) — provide defaults
    if (!input.material || input.material.length < 2) input.material = 'unknown';
    if (!input.origin_country || input.origin_country.length < 2) input.origin_country = 'CN';

    try {
      const result = await classifyV3(input);

      if (baseline) {
        const b = baseline[i];
        if (result.confirmed_section === b.section) sectionOk++;
        if (result.confirmed_chapter === b.chapter) chapterOk++;
        if (result.confirmed_heading === b.heading) headingOk++;
        if (result.confirmed_hs6 === b.hs6) hs6Ok++;
      } else {
        // First run = baseline, always "correct"
        sectionOk++; chapterOk++; headingOk++; hs6Ok++;
      }
    } catch {
      // Error = incorrect
    }
  }

  return {
    name: testName,
    fields_used: fieldsUsed,
    fields_removed: removedFields,
    field_count: fieldsUsed.length,
    section_correct: sectionOk,
    chapter_correct: chapterOk,
    heading_correct: headingOk,
    hs6_correct: hs6Ok,
    total: products.length,
    section_pct: Math.round(sectionOk / products.length * 100),
    chapter_pct: Math.round(chapterOk / products.length * 100),
    heading_pct: Math.round(headingOk / products.length * 100),
    hs6_pct: Math.round(hs6Ok / products.length * 100),
  };
}

async function getBaseline(products: any[]): Promise<any[]> {
  const results: any[] = [];
  for (const p of products) {
    const input: ClassifyInputV3 = {
      product_name: p.product_name || '',
      material: p.material || 'unknown',
      origin_country: p.origin_country || 'CN',
      category: p.category || '',
      description: p.description || '',
      processing: p.processing || '',
      composition: p.composition || '',
      weight_spec: p.weight_spec || '',
      price: p.price || undefined,
    };
    if (!input.material || input.material.length < 2) input.material = 'unknown';
    try {
      const r = await classifyV3(input);
      results.push({
        section: r.confirmed_section,
        chapter: r.confirmed_chapter,
        heading: r.confirmed_heading,
        hs6: r.confirmed_hs6,
      });
    } catch {
      results.push({ section: -1, chapter: -1, heading: '', hs6: '' });
    }
  }
  return results;
}

async function main() {
  const products: any[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`\n=== Ablation Test — ${products.length} Amazon Products ===\n`);

  // Get baseline
  console.log('Computing baseline (9/9 fields)...');
  const baseline = await getBaseline(products);

  const allResults: AblationResult[] = [];

  // Baseline entry
  allResults.push({
    name: 'Baseline (9/9)',
    fields_used: [...ALL_FIELDS],
    fields_removed: [],
    field_count: 9,
    section_correct: 50, chapter_correct: 50, heading_correct: 50, hs6_correct: 50,
    total: 50,
    section_pct: 100, chapter_pct: 100, heading_pct: 100, hs6_pct: 100,
  });

  // ── Round 1: Remove 1 field at a time ──
  console.log('\n--- Round 1: Remove 1 field ---');
  for (const field of ALL_FIELDS) {
    const result = await runTest(products, [field], `Remove ${field}`, baseline);
    allResults.push(result);
    console.log(`  -${field}: S${result.section_pct}% Ch${result.chapter_pct}% H${result.heading_pct}% HS6=${result.hs6_pct}%`);
  }

  // ── Round 2: Minimum combinations ──
  console.log('\n--- Round 2: Minimum combinations ---');
  const round2Tests: [string[], string][] = [
    [['material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name only'],
    [['origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name + material'],
    [['material', 'origin_country', 'description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name + category'],
    [['category', 'description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name + material + origin'],
    [['origin_country', 'description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name + material + category'],
    [['description', 'processing', 'composition', 'weight_spec', 'price'], 'product_name + material + category + origin'],
  ];
  for (const [removed, name] of round2Tests) {
    const result = await runTest(products, removed, name, baseline);
    allResults.push(result);
    console.log(`  ${name}: S${result.section_pct}% Ch${result.chapter_pct}% H${result.heading_pct}% HS6=${result.hs6_pct}%`);
  }

  // ── Round 3: Remove 2 fields ──
  console.log('\n--- Round 3: Remove 2 fields ---');
  const round3Tests: [string[], string][] = [
    [['material', 'category'], 'Remove material + category'],
    [['material', 'description'], 'Remove material + description'],
    [['category', 'description'], 'Remove category + description'],
    [['processing', 'composition'], 'Remove processing + composition'],
    [['weight_spec', 'price'], 'Remove weight_spec + price'],
  ];
  for (const [removed, name] of round3Tests) {
    const result = await runTest(products, removed, name, baseline);
    allResults.push(result);
    console.log(`  ${name}: S${result.section_pct}% Ch${result.chapter_pct}% H${result.heading_pct}% HS6=${result.hs6_pct}%`);
  }

  // Save JSON
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allResults, null, 2));
  console.log(`\nResults saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
