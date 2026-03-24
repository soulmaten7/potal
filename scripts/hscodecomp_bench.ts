/**
 * HSCodeComp 632-item benchmark
 * Phase 0: Map to 9-field → Phase 1: Run pipeline → Phase 1.3: Error analysis
 * Usage: npx tsx scripts/hscodecomp_bench.ts
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';

// ═══ Phase 0: Load + Map ═══
const raw: any[] = JSON.parse(fs.readFileSync(`${BASE}/hscodecomp_raw.json`, 'utf-8'));
console.log(`═══ Phase 0: Data Mapping ═══`);
console.log(`Raw items: ${raw.length}`);
console.log(`Columns: ${Object.keys(raw[0]).join(', ')}`);

// Parse product_attributes JSON
function parseAttrs(attrsStr: string): Record<string, string> {
  try {
    return JSON.parse(attrsStr);
  } catch {
    // Handle malformed JSON — try basic key-value extraction
    const result: Record<string, string> = {};
    const matches = attrsStr.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g);
    for (const m of matches) result[m[1]] = m[2];
    return result;
  }
}

interface MappedItem {
  source: string;
  id: number;
  product_name: string;
  material: string;
  origin_country: string;
  category: string;
  description: string;
  processing: string;
  composition: string;
  weight_spec: string;
  price: number | null;
  verified_hs6: string;
  verified_hs_full: string;
  available_fields: string[];
  available_field_count: number;
}

const mapped: MappedItem[] = [];

for (const item of raw) {
  const attrs = parseAttrs(item.product_attributes || '{}');

  // Extract material from attributes
  const material = attrs['Material'] || attrs['material'] || '';

  // Build category from cate_lv1 > lv2 > lv3 > lv4 > lv5
  const catParts = [item.cate_lv1_desc, item.cate_lv2_desc, item.cate_lv3_desc, item.cate_lv4_desc, item.cate_lv5_desc]
    .filter((c: string) => c && c.trim());
  const category = catParts.join(' > ');

  // Origin
  const origin = attrs['Origin'] || '';
  let originCode = '';
  if (origin.includes('China') || origin.includes('中国')) originCode = 'CN';
  else if (origin.includes('India')) originCode = 'IN';
  else if (origin.includes('Korea')) originCode = 'KR';
  else if (origin.includes('Japan')) originCode = 'JP';
  else if (origin.includes('US') || origin.includes('United States')) originCode = 'US';

  // Weight
  const weight = attrs['Weight'] || attrs['Package weight'] || '';

  // HS code — convert to string, pad to 10 digits, take first 6
  const hsRaw = String(item.hs_code || '');
  const hsFull = hsRaw.padStart(10, '0');
  const hs6 = hsFull.substring(0, 6);

  // Price
  let price: number | null = null;
  if (item.price && item.currency_code === 'USD') {
    price = item.price;
  } else if (item.price && item.currency_code === 'CNY') {
    price = item.price / 7.2; // approximate CNY→USD
  }

  // Track available fields
  const available: string[] = ['product_name']; // always present
  if (material) available.push('material');
  if (originCode) available.push('origin_country');
  if (category) available.push('category');
  // description = product_name (no separate field in this dataset)
  if (weight) available.push('weight_spec');
  if (price !== null) available.push('price');

  mapped.push({
    source: 'HSCodeComp',
    id: item.task_id,
    product_name: item.product_name || '',
    material,
    origin_country: originCode,
    category,
    description: '', // no separate description field
    processing: '',
    composition: '',
    weight_spec: weight,
    price,
    verified_hs6: hs6,
    verified_hs_full: hsFull,
    available_fields: available,
    available_field_count: available.length,
  });
}

fs.writeFileSync(`${BASE}/hscodecomp_mapped.json`, JSON.stringify(mapped, null, 2));
console.log(`Mapped: ${mapped.length} items`);

// Field availability stats
const fieldCounts: Record<string, number> = {};
for (const m of mapped) {
  for (const f of m.available_fields) {
    fieldCounts[f] = (fieldCounts[f] || 0) + 1;
  }
}
console.log('\n=== Field Availability ===');
for (const [f, c] of Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f}: ${c}/${mapped.length} (${(c / mapped.length * 100).toFixed(1)}%)`);
}
console.log(`  description: 0/632 (0%) — no separate description field`);
console.log(`  processing: 0/632 (0%)`);
console.log(`  composition: 0/632 (0%)`);

// HS code digit distribution
const hsLens: Record<string, number> = {};
for (const m of mapped) {
  const stripped = m.verified_hs_full.replace(/^0+/, '');
  const len = stripped.length;
  const key = `${len} digits`;
  hsLens[key] = (hsLens[key] || 0) + 1;
}
console.log('\n=== HS Code Length ===');
for (const [k, v] of Object.entries(hsLens)) console.log(`  ${k}: ${v}`);
console.log(`  All are 10-digit US HTS codes (padded to 10)`);

// ═══ Phase 1: Run Pipeline ═══
async function runBenchmark() {
console.log('\n═══ Phase 1: 632-item Benchmark ═══\n');

interface BenchResult {
  id: number;
  product_name: string;
  material: string;
  category_short: string;
  available_field_count: number;
  verified_hs6: string;
  verified_section: number;
  verified_chapter: number;
  verified_heading: string;
  pipeline_section: number;
  pipeline_chapter: number;
  pipeline_heading: string;
  pipeline_hs6: string;
  section_match: boolean;
  chapter_match: boolean;
  heading_match: boolean;
  hs6_match: boolean;
  decision_path_summary: string;
  time_ms: number;
}

interface ErrorItem {
  id: number;
  product_name: string;
  available_fields: string[];
  available_field_count: number;
  verified_hs6: string;
  pipeline_hs6: string;
  fail_step: string;
  error_type: string;
  root_cause: string;
  code_fix_needed: boolean;
  fix_description: string;
}

const benchResults: BenchResult[] = [];
const errorItems: ErrorItem[] = [];

let sOk = 0, cOk = 0, hOk = 0, h6Ok = 0;
let totalTime = 0;

for (let i = 0; i < mapped.length; i++) {
  const m = mapped[i];

  const input: ClassifyInputV3 = {
    product_name: m.product_name,
    material: m.material || 'unknown',
    origin_country: m.origin_country || 'CN',
    category: m.category,
    description: m.description,
    processing: m.processing,
    composition: m.composition,
    weight_spec: m.weight_spec,
    price: m.price || undefined,
  };
  if (input.material.length < 2) input.material = 'unknown';

  const vSection = parseInt(m.verified_hs6.substring(0, 2), 10) <= 5 ? Math.ceil(parseInt(m.verified_hs6.substring(0, 2), 10) / 5) : 0;
  const vChapter = parseInt(m.verified_hs6.substring(0, 2), 10);
  const vHeading = m.verified_hs6.substring(0, 4);

  try {
    const r = await classifyV3(input);
    const pSection = r.confirmed_section;
    const pChapter = r.confirmed_chapter;
    const pHeading = r.confirmed_heading || '';
    const pHs6 = r.confirmed_hs6 || '';
    const dp = r.decision_path;

    const sMatch = pChapter > 0 && Math.floor(pChapter) === vChapter ? false : false; // compare chapter directly
    // Actually compare at each level properly
    const chapterMatch = pChapter === vChapter;
    const headingMatch = pHeading === vHeading;
    const hs6Match = pHs6 === m.verified_hs6;

    // Section: need to map chapter → section for verified data too
    // We'll just track chapter-level and below
    if (chapterMatch) cOk++;
    if (headingMatch) hOk++;
    if (hs6Match) h6Ok++;

    // Section match: compare sections (need to derive section from chapter)
    // Use pipeline's section check against verified chapter's section
    // For simplicity, count section as matching if chapter matches or section's chapter range includes verified chapter
    const sMatch2 = pChapter === vChapter; // if chapter matches, section must match
    if (sMatch2) sOk++; else {
      // Check if at least the section is right by checking chapter range
      // Simple: just check if pSection contains vChapter
      // We'll approximate — if chapter is wrong but in same section range
    }

    totalTime += r.processing_time_ms;

    const dpSummary = dp.map(d => `${d.step.split(':')[0]}:${d.output_summary.substring(0, 30)}`).join(' → ');

    benchResults.push({
      id: m.id,
      product_name: m.product_name.substring(0, 60),
      material: m.material,
      category_short: m.category.split(' > ').slice(0, 2).join(' > '),
      available_field_count: m.available_field_count,
      verified_hs6: m.verified_hs6,
      verified_section: 0, // will be filled
      verified_chapter: vChapter,
      verified_heading: vHeading,
      pipeline_section: pSection,
      pipeline_chapter: pChapter,
      pipeline_heading: pHeading,
      pipeline_hs6: pHs6,
      section_match: sMatch2,
      chapter_match: chapterMatch,
      heading_match: headingMatch,
      hs6_match: hs6Match,
      decision_path_summary: dpSummary.substring(0, 120),
      time_ms: r.processing_time_ms,
    });

    if (!hs6Match) {
      // Determine fail step and error type
      let failStep = 'Step 4';
      let errorType = 'KEYWORD_MISSING';
      let rootCause = '';
      let codeFix = false;
      let fixDesc = '';

      if (!chapterMatch) {
        failStep = 'Step 2-3';
        if (!m.material || m.material === 'unknown') {
          errorType = 'FIELD_DEPENDENT';
          rootCause = 'material unavailable → chapter routing degraded';
        } else {
          errorType = 'KEYWORD_MISSING';
          rootCause = `Chapter mismatch: expected Ch${vChapter}, got Ch${pChapter}. Material="${m.material}"`;
          codeFix = true;
          fixDesc = `Add chapter mapping for material="${m.material}" in step2-3`;
        }
      } else if (!headingMatch) {
        failStep = 'Step 3';
        errorType = 'KEYWORD_MISSING';
        rootCause = `Heading mismatch: expected ${vHeading}, got ${pHeading}. Product="${m.product_name.substring(0, 40)}"`;
        codeFix = true;
        fixDesc = `Add heading keyword for "${m.product_name.substring(0, 30)}" → ${vHeading}`;
      } else {
        failStep = 'Step 4';
        errorType = 'KEYWORD_MISSING';
        rootCause = `Subheading mismatch: expected ${m.verified_hs6}, got ${pHs6}`;
        codeFix = true;
        fixDesc = `Add subheading disambiguation for ${vHeading} → ${m.verified_hs6}`;
      }

      errorItems.push({
        id: m.id,
        product_name: m.product_name.substring(0, 60),
        available_fields: m.available_fields,
        available_field_count: m.available_field_count,
        verified_hs6: m.verified_hs6,
        pipeline_hs6: pHs6,
        fail_step: failStep,
        error_type: errorType,
        root_cause: rootCause,
        code_fix_needed: codeFix,
        fix_description: fixDesc,
      });
    }

    const mark = hs6Match ? '✅' : (headingMatch ? '🔶' : (chapterMatch ? '🟡' : '❌'));
    if (i < 20 || !hs6Match && errorItems.length <= 50) {
      console.log(`[${i + 1}/632] ${mark} "${m.product_name.substring(0, 35)}" verified=${m.verified_hs6} got=${pHs6}`);
    } else if (i % 100 === 0) {
      console.log(`[${i + 1}/632] ... (${h6Ok} HS6 correct so far)`);
    }
  } catch (err: any) {
    benchResults.push({
      id: m.id, product_name: m.product_name.substring(0, 60), material: m.material,
      category_short: '', available_field_count: m.available_field_count,
      verified_hs6: m.verified_hs6, verified_section: 0, verified_chapter: vChapter, verified_heading: vHeading,
      pipeline_section: -1, pipeline_chapter: -1, pipeline_heading: '', pipeline_hs6: '',
      section_match: false, chapter_match: false, heading_match: false, hs6_match: false,
      decision_path_summary: `ERROR: ${err.message}`, time_ms: 0,
    });
    errorItems.push({
      id: m.id, product_name: m.product_name.substring(0, 60),
      available_fields: m.available_fields, available_field_count: m.available_field_count,
      verified_hs6: m.verified_hs6, pipeline_hs6: '', fail_step: 'Step 0',
      error_type: 'LOGIC_BUG', root_cause: `Pipeline error: ${err.message}`,
      code_fix_needed: true, fix_description: 'Fix pipeline error',
    });
  }
}

// ═══ Results ═══
const N = mapped.length;
console.log(`\n═══ HSCodeComp 632 Results ═══`);
console.log(`Chapter: ${cOk}/${N} (${(cOk / N * 100).toFixed(1)}%)`);
console.log(`Heading: ${hOk}/${N} (${(hOk / N * 100).toFixed(1)}%)`);
console.log(`HS6:     ${h6Ok}/${N} (${(h6Ok / N * 100).toFixed(1)}%)`);
console.log(`Avg time: ${(totalTime / N).toFixed(1)}ms/item`);
console.log(`Errors:  ${errorItems.length}`);

// Error type distribution
const byType: Record<string, number> = {};
const byStep: Record<string, number> = {};
for (const e of errorItems) {
  byType[e.error_type] = (byType[e.error_type] || 0) + 1;
  byStep[e.fail_step] = (byStep[e.fail_step] || 0) + 1;
}
console.log('\nError types:');
for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${c} (${(c / errorItems.length * 100).toFixed(1)}%)`);
}
console.log('\nBy step:');
for (const [s, c] of Object.entries(byStep).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${s}: ${c}`);
}

// Category breakdown
const byCat: Record<string, { total: number; correct: number }> = {};
for (const r of benchResults) {
  const cat = r.category_short || 'Unknown';
  if (!byCat[cat]) byCat[cat] = { total: 0, correct: 0 };
  byCat[cat].total++;
  if (r.hs6_match) byCat[cat].correct++;
}
console.log('\nCategory accuracy (top 15):');
const sortedCats = Object.entries(byCat).sort((a, b) => b[1].total - a[1].total).slice(0, 15);
for (const [cat, { total, correct }] of sortedCats) {
  console.log(`  ${cat}: ${correct}/${total} (${(correct / total * 100).toFixed(1)}%)`);
}

// Competitor comparison
console.log('\n=== Competitor Comparison ===');
console.log(`POTAL v3:    ${(h6Ok / N * 100).toFixed(1)}% (HSCodeComp 632, code-only, $0)`);
console.log(`Tarifflo:    89% (self-reported 103 items, non-public)`);
console.log(`Avalara:     80% (Tarifflo paper)`);
console.log(`Zonos:       44% (Tarifflo paper)`);
console.log(`WCO BACUDA:  13% (arXiv paper)`);

// Save
fs.writeFileSync(`${BASE}/hscodecomp_results.json`, JSON.stringify(benchResults, null, 2));
fs.writeFileSync(`${BASE}/hscodecomp_errors.json`, JSON.stringify(errorItems, null, 2));
fs.writeFileSync(`${BASE}/hscodecomp_fixes.json`, JSON.stringify({
  total: N,
  chapter_correct: cOk,
  heading_correct: hOk,
  hs6_correct: h6Ok,
  error_count: errorItems.length,
  by_type: byType,
  by_step: byStep,
  code_fix_needed: errorItems.filter(e => e.code_fix_needed).length,
}, null, 2));

console.log(`\n✅ Results saved to ${BASE}/hscodecomp_*.json`);
} // end runBenchmark

runBenchmark().catch(console.error);
