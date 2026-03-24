/**
 * v3 Pipeline — Systematic Ablation + Error Diagnosis V2
 * Phase 1: Baseline + Verification
 * Phase 2: 466 combinations with per-item error diagnosis
 * Usage: npx tsx scripts/ablation_v2_diag.ts
 */

import * as fs from 'fs';
import * as path from 'path';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3, V3DecisionStep } from '../app/lib/cost-engine/gri-classifier/types';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const INPUT_PATH = `${BASE}/amazon_50_products.json`;
const CBP_DIR = '/Volumes/soulmaten/POTAL/regulations/cbp_cross';
const RESULTS_PATH = `${BASE}/ablation_v2_results.json`;
const ERRORS_PATH = `${BASE}/ablation_v2_errors.json`;
const FIXES_PATH = `${BASE}/ablation_v2_fixes.json`;
const CSV_PATH = `${BASE}/baseline_verification.csv`;

const ALL_FIELDS = ['product_name', 'material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price'];

// ── Types ──
interface BaselineItem {
  idx: number;
  product_name: string;
  material: string;
  category: string;
  section: number;
  chapter: number;
  heading: string;
  hs6: string;
  decision_path: V3DecisionStep[];
  step21_output: string;
  step23_output: string;
  step3_output: string;
  step4_output: string;
}

interface ErrorRecord {
  product_name: string;
  product_idx: number;
  combo_id: string;
  level: number;
  removed_fields: string[];
  fail_step: string;
  baseline_section: number;
  got_section: number;
  baseline_chapter: number;
  got_chapter: number;
  baseline_heading: string;
  got_heading: string;
  baseline_hs6: string;
  got_hs6: string;
  error_type: string;
  root_cause: string;
  fix_possible: string;
  code_fix_needed: boolean;
}

interface ComboResult {
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
  error_count: number;
}

// ── Helpers ──
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  return [...combinations(rest, k - 1).map(c => [first, ...c]), ...combinations(rest, k)];
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

function classifyError(removed: string[], baseline: BaselineItem, gotSection: number, gotChapter: number, gotHeading: string, gotHs6: string): { fail_step: string; error_type: string; root_cause: string; fix_possible: string; code_fix_needed: boolean } {
  const sectionWrong = gotSection !== baseline.section;
  const chapterWrong = gotChapter !== baseline.chapter;
  const headingWrong = gotHeading !== baseline.heading;
  const hs6Wrong = gotHs6 !== baseline.hs6;

  let fail_step = 'none';
  if (sectionWrong) fail_step = 'Step 2-1';
  else if (chapterWrong) fail_step = 'Step 2-3';
  else if (headingWrong) fail_step = 'Step 3';
  else if (hs6Wrong) fail_step = 'Step 4';

  // Determine error type
  const materialRemoved = removed.includes('material');
  const categoryRemoved = removed.includes('category');
  const nameRemoved = removed.includes('product_name');
  const descRemoved = removed.includes('description');

  // If the critical field for that step is removed → FIELD_DEPENDENT
  if (sectionWrong && materialRemoved) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `material removed → Section selection relies on material for primary routing`, fix_possible: 'Add material field', code_fix_needed: false };
  }
  if (sectionWrong && categoryRemoved && !materialRemoved) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `category removed → Section override not available`, fix_possible: 'Add category field', code_fix_needed: false };
  }
  if (chapterWrong && materialRemoved) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `material removed → Chapter selection has no material input`, fix_possible: 'Add material field', code_fix_needed: false };
  }
  if (headingWrong && (categoryRemoved || nameRemoved)) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `${nameRemoved ? 'product_name' : 'category'} removed → Heading keyword matching degraded`, fix_possible: `Add ${nameRemoved ? 'product_name' : 'category'} field`, code_fix_needed: false };
  }
  if (hs6Wrong && !sectionWrong && !chapterWrong && !headingWrong && descRemoved) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `description removed → Subheading disambiguation lost`, fix_possible: 'Add description field', code_fix_needed: false };
  }

  // If section wrong but material AND category present → could be KEYWORD_MISSING or LOGIC_BUG
  if (sectionWrong && !materialRemoved && !categoryRemoved) {
    return { fail_step, error_type: 'LOGIC_BUG', root_cause: `Section wrong despite material+category present — override logic issue`, fix_possible: 'Check step2-1 priority logic', code_fix_needed: true };
  }
  if (chapterWrong && !materialRemoved) {
    if (categoryRemoved) {
      return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `category removed → Chapter hint missing`, fix_possible: 'Add category field', code_fix_needed: false };
    }
    return { fail_step, error_type: 'KEYWORD_MISSING', root_cause: `Chapter wrong despite material present — chapter mapping incomplete`, fix_possible: 'Add chapter mapping', code_fix_needed: true };
  }
  if (headingWrong && !nameRemoved && !categoryRemoved) {
    return { fail_step, error_type: 'KEYWORD_MISSING', root_cause: `Heading wrong despite name+category present — heading synonym missing`, fix_possible: 'Add heading keyword', code_fix_needed: true };
  }
  if (hs6Wrong && !headingWrong) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `Subheading wrong — detail fields removed`, fix_possible: 'Add description/composition fields', code_fix_needed: false };
  }

  // General field-dependent fallback
  if (removed.length > 0) {
    return { fail_step, error_type: 'FIELD_DEPENDENT', root_cause: `${removed.join('+')} removed → insufficient data for ${fail_step}`, fix_possible: `Add ${removed[0]} field`, code_fix_needed: false };
  }

  return { fail_step, error_type: 'LOGIC_BUG', root_cause: 'Unknown — all fields present but still wrong', fix_possible: 'Investigate pipeline logic', code_fix_needed: true };
}

// ── CBP CROSS search ──
function searchCBP(productName: string): { hs6: string; ruling: string } | null {
  // Check if CBP data directory exists
  if (!fs.existsSync(CBP_DIR)) return null;
  try {
    const files = fs.readdirSync(CBP_DIR).filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));
    if (files.length === 0) return null;

    const searchTerms = productName.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (searchTerms.length === 0) return null;

    // Quick search in first available file (sampling)
    const file = files[0];
    const content = fs.readFileSync(path.join(CBP_DIR, file), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).slice(0, 10000);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const subject = (entry.subject || entry.product_name || entry.title || '').toLowerCase();
        const matchCount = searchTerms.filter(t => subject.includes(t)).length;
        if (matchCount >= 2) {
          const hs = entry.hs_code || entry.tariff_no || entry.hts || '';
          if (hs.length >= 6) {
            return { hs6: hs.substring(0, 6), ruling: entry.ruling_number || entry.id || '' };
          }
        }
      } catch { /* skip bad lines */ }
    }
  } catch { /* directory issues */ }
  return null;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  const products: any[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  const N = products.length;

  console.log('═══ Phase 1: Baseline (9/9) ═══');

  // ── Phase 1-1: Run baseline ──
  const baseline: BaselineItem[] = [];
  let baselineErrors = 0;

  for (let i = 0; i < N; i++) {
    const p = products[i];
    try {
      const r = await classifyV3(buildInput(p, []));
      const dp = r.decision_path;
      const step21 = dp.find(d => d.step.includes('2-1'))?.output_summary || '';
      const step23 = dp.find(d => d.step.includes('2-3'))?.output_summary || '';
      const step3 = dp.find(d => d.step.includes('Step 3'))?.output_summary || '';
      const step4 = dp.find(d => d.step.includes('Step 4'))?.output_summary || '';

      baseline.push({
        idx: i,
        product_name: (p.product_name || '').substring(0, 60),
        material: p.material || '',
        category: (p.category || '').substring(0, 50),
        section: r.confirmed_section,
        chapter: r.confirmed_chapter,
        heading: r.confirmed_heading || '',
        hs6: r.confirmed_hs6 || '',
        decision_path: dp,
        step21_output: step21.substring(0, 80),
        step23_output: step23.substring(0, 80),
        step3_output: step3.substring(0, 80),
        step4_output: step4.substring(0, 80),
      });

      console.log(`[${i + 1}/${N}] ${p.product_name?.substring(0, 35)} → S${r.confirmed_section} Ch${r.confirmed_chapter} H${r.confirmed_heading} HS${r.confirmed_hs6} ✅`);
    } catch (err: any) {
      console.log(`[${i + 1}/${N}] ❌ ERROR: ${err.message}`);
      baseline.push({
        idx: i, product_name: p.product_name?.substring(0, 60) || '', material: '', category: '',
        section: -1, chapter: -1, heading: '', hs6: '',
        decision_path: [], step21_output: 'ERROR', step23_output: '', step3_output: '', step4_output: '',
      });
      baselineErrors++;
    }
  }

  console.log(`\nBaseline: ${N - baselineErrors}/${N} completed`);

  // ── Phase 1-2: CBP cross-verification + CSV ──
  console.log('\n── CBP Cross-Verification ──');
  const csvLines: string[] = ['product_name|material|category|pipeline_section|pipeline_chapter|pipeline_heading|pipeline_hs6|cbp_match_hs6|match_status|verification_note'];

  let confirmed = 0, mismatch = 0, noData = 0;
  for (let i = 0; i < N; i++) {
    const b = baseline[i];
    const cbp = searchCBP(products[i].product_name || '');
    let matchStatus = 'NO_CBP_DATA';
    let cbpHs6 = '';
    let note = '';

    if (cbp) {
      cbpHs6 = cbp.hs6;
      if (cbp.hs6.substring(0, 4) === b.heading) {
        matchStatus = 'CONFIRMED';
        note = `CBP ruling ${cbp.ruling} heading match`;
        confirmed++;
      } else {
        matchStatus = 'MISMATCH';
        note = `CBP ${cbp.hs6} vs pipeline ${b.hs6} — CBP ruling ${cbp.ruling}`;
        mismatch++;
      }
    } else {
      noData++;
    }

    csvLines.push(`${b.product_name}|${b.material}|${b.category}|${b.section}|${b.chapter}|${b.heading}|${b.hs6}|${cbpHs6}|${matchStatus}|${note}`);
  }

  fs.writeFileSync(CSV_PATH, csvLines.join('\n'));
  console.log(`CBP verification: CONFIRMED=${confirmed}, MISMATCH=${mismatch}, NO_DATA=${noData}`);
  console.log(`CSV saved: ${CSV_PATH}`);

  if (baselineErrors > 0) {
    console.log(`\n⚠️ ${baselineErrors} baseline errors — stopping for review`);
    return;
  }

  console.log(`\nBaseline: ${N}/${N} ✅ — proceeding to Phase 2\n`);

  // ═══════════════════════════════════════
  // Phase 2: Systematic Ablation
  // ═══════════════════════════════════════
  console.log('═══ Phase 2: Systematic Ablation (466 combos) ═══\n');

  const allResults: ComboResult[] = [];
  const allErrors: ErrorRecord[] = [];

  // Baseline entry
  allResults.push({
    level: 9, removed_fields: [], used_fields: [...ALL_FIELDS], combo_id: 'baseline_9F',
    step_section_correct: N, step_chapter_correct: N, step_heading_correct: N, step_hs6_correct: N,
    step_section_pct: 100, step_chapter_pct: 100, step_heading_pct: 100, step_hs6_pct: 100,
    total: N, first_fail_step: 'none', error_count: 0,
  });

  for (let removeCount = 1; removeCount <= 6; removeCount++) {
    const level = 9 - removeCount;
    const combos = combinations(ALL_FIELDS, removeCount);
    console.log(`[Level ${level}] ${combos.length} combinations (remove ${removeCount})...`);

    for (let ci = 0; ci < combos.length; ci++) {
      const removed = combos[ci];
      const used = ALL_FIELDS.filter(f => !removed.includes(f));
      const comboId = `${level}F_no_${removed.join('_')}`;

      let sOk = 0, cOk = 0, hOk = 0, h6Ok = 0;
      let comboErrors = 0;

      for (let pi = 0; pi < N; pi++) {
        try {
          const r = await classifyV3(buildInput(products[pi], removed));
          const b = baseline[pi];
          const sMatch = r.confirmed_section === b.section;
          const cMatch = r.confirmed_chapter === b.chapter;
          const hMatch = (r.confirmed_heading || '') === b.heading;
          const h6Match = (r.confirmed_hs6 || '') === b.hs6;

          if (sMatch) sOk++;
          if (cMatch) cOk++;
          if (hMatch) hOk++;
          if (h6Match) h6Ok++;

          if (!h6Match) {
            comboErrors++;
            const diag = classifyError(removed, b,
              r.confirmed_section, r.confirmed_chapter,
              r.confirmed_heading || '', r.confirmed_hs6 || '');

            allErrors.push({
              product_name: b.product_name,
              product_idx: pi,
              combo_id: comboId,
              level,
              removed_fields: removed,
              fail_step: diag.fail_step,
              baseline_section: b.section,
              got_section: r.confirmed_section,
              baseline_chapter: b.chapter,
              got_chapter: r.confirmed_chapter,
              baseline_heading: b.heading,
              got_heading: r.confirmed_heading || '',
              baseline_hs6: b.hs6,
              got_hs6: r.confirmed_hs6 || '',
              error_type: diag.error_type,
              root_cause: diag.root_cause,
              fix_possible: diag.fix_possible,
              code_fix_needed: diag.code_fix_needed,
            });
          }
        } catch {
          comboErrors++;
        }
      }

      const sPct = Math.round(sOk / N * 100);
      const cPct = Math.round(cOk / N * 100);
      const hPct = Math.round(hOk / N * 100);
      const h6Pct = Math.round(h6Ok / N * 100);

      let firstFail = 'none';
      if (sPct < 100) firstFail = 'Section';
      else if (cPct < 100) firstFail = 'Chapter';
      else if (hPct < 100) firstFail = 'Heading';
      else if (h6Pct < 100) firstFail = 'HS6';

      allResults.push({
        level, removed_fields: removed, used_fields: used, combo_id: comboId,
        step_section_correct: sOk, step_chapter_correct: cOk,
        step_heading_correct: hOk, step_hs6_correct: h6Ok,
        step_section_pct: sPct, step_chapter_pct: cPct,
        step_heading_pct: hPct, step_hs6_pct: h6Pct,
        total: N, first_fail_step: firstFail, error_count: comboErrors,
      });

      if (combos.length <= 36 || ci % 20 === 0 || ci === combos.length - 1) {
        const errSummary = comboErrors > 0 ? ` (${comboErrors} errors)` : '';
        console.log(`  [${level}] ${ci + 1}/${combos.length} no_${removed.join('+')}: S${sPct}% Ch${cPct}% H${hPct}% HS6=${h6Pct}%${errSummary}`);
      }
    }
  }

  // ═══════════════════════════════════════
  // Phase 3: Error Diagnosis Summary
  // ═══════════════════════════════════════
  console.log('\n═══ Phase 3: Error Diagnosis ═══\n');

  const totalErrors = allErrors.length;
  const byType: Record<string, number> = {};
  const byStep: Record<string, number> = {};
  const codeFix = allErrors.filter(e => e.code_fix_needed);

  for (const e of allErrors) {
    byType[e.error_type] = (byType[e.error_type] || 0) + 1;
    byStep[e.fail_step] = (byStep[e.fail_step] || 0) + 1;
  }

  console.log(`Total errors: ${totalErrors}`);
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count} (${(count / totalErrors * 100).toFixed(1)}%)`);
  }
  console.log(`\nBy Step:`);
  for (const [step, count] of Object.entries(byStep).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${step}: ${count}`);
  }
  console.log(`\nCode fix needed: ${codeFix.length} errors (${(codeFix.length / totalErrors * 100).toFixed(1)}%)`);

  // Unique code-fix errors (by product × fail_step)
  const uniqueFixes = new Map<string, ErrorRecord>();
  for (const e of codeFix) {
    const key = `${e.product_idx}_${e.fail_step}_${e.error_type}`;
    if (!uniqueFixes.has(key)) uniqueFixes.set(key, e);
  }
  console.log(`Unique code-fix patterns: ${uniqueFixes.size}`);
  for (const [, e] of uniqueFixes) {
    console.log(`  ❌ #${e.product_idx} "${e.product_name.substring(0, 30)}" ${e.fail_step} ${e.error_type}: ${e.root_cause.substring(0, 60)}`);
  }

  // ── Save results ──
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(allResults, null, 2));
  fs.writeFileSync(ERRORS_PATH, JSON.stringify(allErrors, null, 2));
  fs.writeFileSync(FIXES_PATH, JSON.stringify({
    total_errors: totalErrors,
    by_type: byType,
    by_step: byStep,
    code_fix_needed: codeFix.length,
    unique_fix_patterns: Array.from(uniqueFixes.values()).map(e => ({
      product: e.product_name,
      step: e.fail_step,
      type: e.error_type,
      cause: e.root_cause,
    })),
    baseline_items: baseline.map(b => ({
      product_name: b.product_name,
      section: b.section,
      chapter: b.chapter,
      heading: b.heading,
      hs6: b.hs6,
    })),
  }, null, 2));

  console.log(`\n✅ Results: ${RESULTS_PATH} (${allResults.length} combos)`);
  console.log(`✅ Errors: ${ERRORS_PATH} (${allErrors.length} records)`);
  console.log(`✅ Fixes: ${FIXES_PATH}`);

  // Level summary
  console.log('\n=== Level Summary ===');
  for (let level = 9; level >= 3; level--) {
    const lr = allResults.filter(r => r.level === level);
    const n = lr.length;
    const avgS = Math.round(lr.reduce((s, r) => s + r.step_section_pct, 0) / n);
    const avgC = Math.round(lr.reduce((s, r) => s + r.step_chapter_pct, 0) / n);
    const avgH = Math.round(lr.reduce((s, r) => s + r.step_heading_pct, 0) / n);
    const avg6 = Math.round(lr.reduce((s, r) => s + r.step_hs6_pct, 0) / n);
    const totalErr = lr.reduce((s, r) => s + r.error_count, 0);
    const perfect = lr.filter(r => r.step_hs6_pct === 100).length;
    console.log(`  Level ${level} (${n}): S=${avgS}% Ch=${avgC}% H=${avgH}% HS6=${avg6}% errors=${totalErr} perfect=${perfect}`);
  }
}

main().catch(console.error);
