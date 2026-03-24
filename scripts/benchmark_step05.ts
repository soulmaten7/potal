/**
 * Phase 3: HSCodeComp 632 benchmark with Step 0.5
 * Tests GPT-4o-mini field extraction → v3 pipeline
 * Usage: npx tsx scripts/benchmark_step05.ts
 */
import * as fs from 'fs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

// Check OPENAI_API_KEY
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=your_key');
  process.exit(1);
}

import { extractNineFields, toClassifyInput } from '../app/lib/cost-engine/gri-classifier/steps/v3/step05-field-extraction';
import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const RAW_PATH = `${BASE}/hscodecomp_raw.json`;
const OUTPUT_PATH = `${BASE}/step05_benchmark_results.json`;

interface BenchResult {
  id: number;
  product_name: string;
  verified_hs6: string;
  extracted_fields: Record<string, any>;
  extracted_field_count: number;
  pipeline_hs6: string;
  chapter_match: boolean;
  heading_match: boolean;
  hs6_match: boolean;
  error_type: string;
  time_ms: number;
}

async function main() {
  const raw: any[] = JSON.parse(fs.readFileSync(RAW_PATH, 'utf-8'));
  const N = raw.length;

  console.log(`═══ Phase 3: HSCodeComp ${N} — Step 0.5 Benchmark ═══`);
  console.log(`Using GPT-4o-mini for field extraction\n`);

  const results: BenchResult[] = [];
  let chOk = 0, hOk = 0, h6Ok = 0;
  let extractionErrors = 0;
  let totalCost = 0;

  for (let i = 0; i < N; i++) {
    const item = raw[i];
    const hsRaw = String(item.hs_code || '').padStart(10, '0');
    const hs6 = hsRaw.substring(0, 6);
    const vChapter = parseInt(hs6.substring(0, 2), 10);
    const vHeading = hs6.substring(0, 4);

    const t0 = Date.now();

    try {
      // Step 0.5: GPT-4o-mini extracts 9 fields from raw platform data
      const platformData: Record<string, any> = {
        product_name: item.product_name,
        product_attributes: item.product_attributes,
        price: item.price,
        currency_code: item.currency_code,
        cate_lv1_desc: item.cate_lv1_desc,
        cate_lv2_desc: item.cate_lv2_desc,
        cate_lv3_desc: item.cate_lv3_desc,
        cate_lv4_desc: item.cate_lv4_desc,
        cate_lv5_desc: item.cate_lv5_desc,
      };

      const extracted = await extractNineFields(platformData);
      const input = toClassifyInput(extracted);

      // Count non-null extracted fields
      const fieldCount = Object.values(extracted).filter(v => v !== null && v !== '').length;

      // Run v3 pipeline
      const result = await classifyV3(input);
      const pHs6 = result.confirmed_hs6 || '';
      const pChapter = result.confirmed_chapter;
      const pHeading = result.confirmed_heading || '';

      const chMatch = pChapter === vChapter;
      const hMatch = pHeading === vHeading;
      const h6Match = pHs6 === hs6;

      if (chMatch) chOk++;
      if (hMatch) hOk++;
      if (h6Match) h6Ok++;

      let errorType = '';
      if (!h6Match) {
        if (!chMatch) errorType = 'CHAPTER_WRONG';
        else if (!hMatch) errorType = 'HEADING_WRONG';
        else errorType = 'SUBHEADING_WRONG';
      }

      results.push({
        id: item.task_id,
        product_name: (item.product_name || '').substring(0, 60),
        verified_hs6: hs6,
        extracted_fields: {
          material: extracted.material,
          category: extracted.category,
          processing: extracted.processing,
          composition: extracted.composition,
          origin_country: extracted.origin_country,
        },
        extracted_field_count: fieldCount,
        pipeline_hs6: pHs6,
        chapter_match: chMatch,
        heading_match: hMatch,
        hs6_match: h6Match,
        error_type: errorType,
        time_ms: Date.now() - t0,
      });

      const mark = h6Match ? '✅' : (hMatch ? '🔶' : (chMatch ? '🟡' : '❌'));
      if (i < 10 || h6Match || i % 50 === 0) {
        console.log(`[${i + 1}/${N}] ${mark} "${(item.product_name || '').substring(0, 30)}" v=${hs6} p=${pHs6} mat=${extracted.material || '-'} cat=${(extracted.category || '-').substring(0, 20)} (${fieldCount}F)`);
      }

      // Rate limit: ~1 req/sec to be safe
      await new Promise(r => setTimeout(r, 200));

    } catch (err: any) {
      extractionErrors++;
      results.push({
        id: item.task_id,
        product_name: (item.product_name || '').substring(0, 60),
        verified_hs6: hs6,
        extracted_fields: {},
        extracted_field_count: 0,
        pipeline_hs6: '',
        chapter_match: false,
        heading_match: false,
        hs6_match: false,
        error_type: `EXTRACTION_ERROR: ${err.message}`,
        time_ms: Date.now() - t0,
      });

      if (i < 20) console.log(`[${i + 1}/${N}] 💥 Error: ${err.message}`);

      // On API error, wait longer
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('  Rate limited — waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // ═══ Results ═══
  console.log(`\n═══ Step 0.5 Benchmark Results ═══`);
  console.log(`Chapter: ${chOk}/${N} (${(chOk / N * 100).toFixed(1)}%)`);
  console.log(`Heading: ${hOk}/${N} (${(hOk / N * 100).toFixed(1)}%)`);
  console.log(`HS6:     ${h6Ok}/${N} (${(h6Ok / N * 100).toFixed(1)}%)`);
  console.log(`Extraction errors: ${extractionErrors}`);

  // Field extraction stats
  const matExtracted = results.filter(r => r.extracted_fields.material).length;
  const catExtracted = results.filter(r => r.extracted_fields.category).length;
  const procExtracted = results.filter(r => r.extracted_fields.processing).length;
  const compExtracted = results.filter(r => r.extracted_fields.composition).length;
  const avgFields = results.reduce((s, r) => s + r.extracted_field_count, 0) / N;

  console.log(`\nField extraction rates:`);
  console.log(`  material:    ${matExtracted}/${N} (${(matExtracted / N * 100).toFixed(1)}%)`);
  console.log(`  category:    ${catExtracted}/${N} (${(catExtracted / N * 100).toFixed(1)}%)`);
  console.log(`  processing:  ${procExtracted}/${N} (${(procExtracted / N * 100).toFixed(1)}%)`);
  console.log(`  composition: ${compExtracted}/${N} (${(compExtracted / N * 100).toFixed(1)}%)`);
  console.log(`  avg fields:  ${avgFields.toFixed(1)}/9`);

  // Comparison
  console.log(`\n═══ Comparison (Before vs After Step 0.5) ═══`);
  console.log(`| Metric | Before (no 0.5) | After (with 0.5) | Change |`);
  console.log(`|--------|----------------|-----------------|--------|`);
  console.log(`| HS6    | 6.3% (40/632)  | ${(h6Ok / N * 100).toFixed(1)}% (${h6Ok}/${N}) | ${h6Ok > 40 ? '+' : ''}${((h6Ok / N * 100) - 6.3).toFixed(1)}% |`);
  console.log(`| Heading| 15.5% (98/632) | ${(hOk / N * 100).toFixed(1)}% (${hOk}/${N}) | ${hOk > 98 ? '+' : ''}${((hOk / N * 100) - 15.5).toFixed(1)}% |`);
  console.log(`| Chapter| 42.6% (269/632)| ${(chOk / N * 100).toFixed(1)}% (${chOk}/${N}) | ${chOk > 269 ? '+' : ''}${((chOk / N * 100) - 42.6).toFixed(1)}% |`);
  console.log(`| Material| 57% (362/632) | ${(matExtracted / N * 100).toFixed(1)}% (${matExtracted}/${N}) | ${((matExtracted / N * 100) - 57).toFixed(1)}% |`);
  console.log(`| Avg fields| 3.5/9        | ${avgFields.toFixed(1)}/9 | +${(avgFields - 3.5).toFixed(1)} |`);

  // Error type distribution
  const byType: Record<string, number> = {};
  for (const r of results) {
    if (r.error_type) byType[r.error_type] = (byType[r.error_type] || 0) + 1;
  }
  console.log(`\nError types:`);
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${t}: ${c}`);
  }

  // Save
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    summary: { total: N, chapter_correct: chOk, heading_correct: hOk, hs6_correct: h6Ok, extraction_errors: extractionErrors, avg_fields: avgFields },
    comparison: { before_hs6: 40, after_hs6: h6Ok, before_pct: 6.3, after_pct: parseFloat((h6Ok / N * 100).toFixed(1)) },
    field_extraction: { material: matExtracted, category: catExtracted, processing: procExtracted, composition: compExtracted },
    error_types: byType,
    results: results,
  }, null, 2));

  console.log(`\n✅ Results saved: ${OUTPUT_PATH}`);
  console.log(`Estimated API cost: ~$${(N * 0.0001).toFixed(2)}`);
}

main().catch(console.error);
