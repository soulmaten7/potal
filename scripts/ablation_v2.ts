/**
 * v3 Pipeline — Systematic Ablation Test V2
 * 466 combinations × 50 products = 23,300 pipeline runs
 * Usage: npx tsx scripts/ablation_v2.ts
 */

import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

const INPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json';
const OUTPUT_PATH = '/Volumes/soulmaten/POTAL/7field_benchmark/ablation_v2_results.json';

const ALL_FIELDS = ['product_name', 'material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price'];

interface BaselineItem {
  section: number;
  chapter: number;
  heading: string;
  hs6: string;
}

interface AblationResultV2 {
  level: number;
  removed_fields: string[];
  used_fields: string[];
  combo_id: string;
  step_section_correct: number;
  step_chapter_correct: number;
  step_heading_correct: number;
  step_hs6_correct: number;
  step_section_pct: number;
  step_chapter_pct: number;
  step_heading_pct: number;
  step_hs6_pct: number;
  total: number;
  first_fail_step: string;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function buildInput(p: any, removedFields: string[]): ClassifyInputV3 {
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
  if (!input.material || input.material.length < 2) input.material = 'unknown';
  if (!input.origin_country || input.origin_country.length < 2) input.origin_country = 'CN';
  return input;
}

async function runCombo(products: any[], removedFields: string[], baseline: BaselineItem[]): Promise<AblationResultV2> {
  const usedFields = ALL_FIELDS.filter(f => !removedFields.includes(f));
  const level = usedFields.length;
  let sOk = 0, cOk = 0, hOk = 0, h6Ok = 0;

  for (let i = 0; i < products.length; i++) {
    try {
      const r = await classifyV3(buildInput(products[i], removedFields));
      const b = baseline[i];
      if (r.confirmed_section === b.section) sOk++;
      if (r.confirmed_chapter === b.chapter) cOk++;
      if (r.confirmed_heading === b.heading) hOk++;
      if (r.confirmed_hs6 === b.hs6) h6Ok++;
    } catch {
      // error = mismatch
    }
  }

  const n = products.length;
  const sPct = Math.round(sOk / n * 100);
  const cPct = Math.round(cOk / n * 100);
  const hPct = Math.round(hOk / n * 100);
  const h6Pct = Math.round(h6Ok / n * 100);

  let firstFail = 'none';
  if (sPct < 100) firstFail = 'Section';
  else if (cPct < 100) firstFail = 'Chapter';
  else if (hPct < 100) firstFail = 'Heading';
  else if (h6Pct < 100) firstFail = 'HS6';

  const comboId = removedFields.length === 0
    ? 'baseline_9F'
    : `${level}F_no_${removedFields.join('_')}`;

  return {
    level,
    removed_fields: removedFields,
    used_fields: usedFields,
    combo_id: comboId,
    step_section_correct: sOk,
    step_chapter_correct: cOk,
    step_heading_correct: hOk,
    step_hs6_correct: h6Ok,
    step_section_pct: sPct,
    step_chapter_pct: cPct,
    step_heading_pct: hPct,
    step_hs6_pct: h6Pct,
    total: n,
    first_fail_step: firstFail,
  };
}

async function main() {
  const products: any[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const N = products.length;
  console.log(`\n=== Systematic Ablation V2 — ${N} Products ===\n`);

  // Baseline
  console.log('[Level 9] Computing baseline (9/9)...');
  const baseline: BaselineItem[] = [];
  for (const p of products) {
    try {
      const r = await classifyV3(buildInput(p, []));
      baseline.push({ section: r.confirmed_section, chapter: r.confirmed_chapter, heading: r.confirmed_heading || '', hs6: r.confirmed_hs6 || '' });
    } catch {
      baseline.push({ section: -1, chapter: -1, heading: '', hs6: '' });
    }
  }

  const allResults: AblationResultV2[] = [];

  // Baseline result
  allResults.push({
    level: 9, removed_fields: [], used_fields: [...ALL_FIELDS], combo_id: 'baseline_9F',
    step_section_correct: N, step_chapter_correct: N, step_heading_correct: N, step_hs6_correct: N,
    step_section_pct: 100, step_chapter_pct: 100, step_heading_pct: 100, step_hs6_pct: 100,
    total: N, first_fail_step: 'none',
  });
  console.log('[Level 9] 1/1 — baseline: S100% Ch100% H100% HS6=100%');

  // Levels 8 down to 3 (remove 1 to 6 fields)
  for (let removeCount = 1; removeCount <= 6; removeCount++) {
    const level = 9 - removeCount;
    const combos = combinations(ALL_FIELDS, removeCount);
    console.log(`\n[Level ${level}] ${combos.length} combinations (remove ${removeCount})...`);

    for (let ci = 0; ci < combos.length; ci++) {
      const removed = combos[ci];
      const result = await runCombo(products, removed, baseline);
      allResults.push(result);

      if (combos.length <= 36 || ci % 10 === 0 || ci === combos.length - 1) {
        console.log(`  [Level ${level}] ${ci + 1}/${combos.length} — no_${removed.join('+')}:` +
          ` S${result.step_section_pct}% Ch${result.step_chapter_pct}% H${result.step_heading_pct}% HS6=${result.step_hs6_pct}%`);
      }
    }
  }

  // Save
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allResults, null, 2));
  console.log(`\n✅ ${allResults.length} combinations saved to ${OUTPUT_PATH}`);

  // Summary
  console.log('\n=== Level Summary ===');
  for (let level = 9; level >= 3; level--) {
    const levelResults = allResults.filter(r => r.level === level);
    const avgS = Math.round(levelResults.reduce((s, r) => s + r.step_section_pct, 0) / levelResults.length);
    const avgC = Math.round(levelResults.reduce((s, r) => s + r.step_chapter_pct, 0) / levelResults.length);
    const avgH = Math.round(levelResults.reduce((s, r) => s + r.step_heading_pct, 0) / levelResults.length);
    const avg6 = Math.round(levelResults.reduce((s, r) => s + r.step_hs6_pct, 0) / levelResults.length);
    const min6 = Math.min(...levelResults.map(r => r.step_hs6_pct));
    const max6 = Math.max(...levelResults.map(r => r.step_hs6_pct));
    const perfect = levelResults.filter(r => r.step_hs6_pct === 100).length;
    console.log(`  Level ${level} (${levelResults.length} combos): avgS=${avgS}% avgCh=${avgC}% avgH=${avgH}% avgHS6=${avg6}% min=${min6}% max=${max6}% perfect=${perfect}`);
  }
}

main().catch(console.error);
