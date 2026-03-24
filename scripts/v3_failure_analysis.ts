/**
 * v3.0 Failure Analysis — deep-dive into all 76 wrong answers.
 * Records every Step's intermediate output for each benchmark item.
 */

import * as fs from 'fs';
import * as path from 'path';

try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {}

import { classifyWithGRI_v3 } from '../app/lib/cost-engine/gri-classifier/pipeline-v3';

const BENCHMARK_FILE = '/Volumes/soulmaten/POTAL/benchmark_test_data.json';
const OUTPUT_JSON = '/Volumes/soulmaten/POTAL/v3_failure_analysis.json';
const OUTPUT_MD = '/Volumes/soulmaten/POTAL/v3_failure_summary.md';

interface BenchmarkItem {
  id: number;
  ruling_number: string;
  item_name: string;
  description: string;
  hts_code_answer: string;
  hs6: string;
  hs_chapter: string;
}

async function main() {
  const testItems: BenchmarkItem[] = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf-8'));
  process.stdout.write(`\nAnalyzing ${testItems.length} items with v3.0 pipeline...\n\n`);

  const allResults: Record<string, unknown>[] = [];
  const failures: Record<string, unknown>[] = [];
  let correct = 0;

  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    const productName = item.item_name || item.description?.substring(0, 150) || '';
    const expectedHs6 = (item.hs6 || '').replace(/\./g, '').substring(0, 6);

    if (!productName || !expectedHs6 || expectedHs6.length < 6) continue;

    try {
      const result = await classifyWithGRI_v3({ productName, destinationCountry: 'US' });
      const predictedHs6 = result.hsCode.replace(/\./g, '').substring(0, 6);

      const is6 = predictedHs6 === expectedHs6;
      const is4 = predictedHs6.substring(0, 4) === expectedHs6.substring(0, 4);
      const is2 = predictedHs6.substring(0, 2) === expectedHs6.substring(0, 2);
      if (is6) correct++;

      // Extract step-by-step info from decisionPath
      const steps: Record<string, string> = {};
      for (const s of result.decisionPath) {
        steps[`step${s.step}_${s.name}`] = s.output;
      }

      // Determine failure category
      let category = 'CORRECT';
      let firstWrongStep = '';
      if (!is6) {
        if (!is2) {
          // Check if Section was wrong (chapter prefix = section indicator)
          category = 'SECTION_MISS';
          firstWrongStep = 'Step 2 (Section)';
        } else if (!is4) {
          // Chapter correct (same 2-digit), but heading wrong
          // Check if the correct heading was even a candidate
          const step6Out = steps['step6_heading_reasoning_v3'] || '';
          const correctH4 = expectedHs6.substring(0, 4);
          if (step6Out.includes(correctH4)) {
            category = 'HEADING_MISS'; // Was candidate, picked wrong one
            firstWrongStep = 'Step 6 (Heading selection)';
          } else {
            category = 'HEADING_CANDIDATE_MISS'; // Not even a candidate
            firstWrongStep = 'Step 6 (Heading not in candidates)';
          }
        } else {
          // Same heading, wrong subheading
          category = 'SUBHEADING_MISS';
          firstWrongStep = 'Step 8 (Subheading)';
        }

        // Check for NEAR_MISS (same chapter, adjacent heading)
        if (category === 'HEADING_MISS' || category === 'HEADING_CANDIDATE_MISS') {
          const predH = parseInt(predictedHs6.substring(0, 4), 10);
          const expH = parseInt(expectedHs6.substring(0, 4), 10);
          if (Math.abs(predH - expH) <= 3) {
            category = 'NEAR_MISS';
          }
        }

        // CHAPTER_MISS: same section but wrong chapter
        if (is2 && !is4) {
          const predCh = parseInt(predictedHs6.substring(0, 2), 10);
          const expCh = parseInt(expectedHs6.substring(0, 2), 10);
          if (predCh !== expCh) {
            category = 'CHAPTER_MISS';
            firstWrongStep = 'Step 4 (Chapter)';
          }
        }
      }

      const record = {
        id: item.id,
        product_name: productName.substring(0, 100),
        expected_hs6: expectedHs6,
        predicted_hs6: predictedHs6,
        expected_chapter: expectedHs6.substring(0, 2),
        predicted_chapter: predictedHs6.substring(0, 2),
        expected_heading: expectedHs6.substring(0, 4),
        predicted_heading: predictedHs6.substring(0, 4),
        match_6: is6,
        match_4: is4,
        match_2: is2,
        category,
        first_wrong_step: firstWrongStep,
        steps,
        gri_rules: result.griRulesApplied.map(g => g.rule).join(', '),
        confidence: result.confidence,
        ai_calls: result.aiCallCount,
      };

      allResults.push(record);
      if (!is6) failures.push(record);

    } catch (err) {
      failures.push({
        id: item.id,
        product_name: productName.substring(0, 100),
        expected_hs6: expectedHs6,
        category: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`  [${i + 1}/${testItems.length}] correct=${correct}, failures=${failures.length}\n`);
    }
  }

  // ─── Analyze categories ───
  const categories: Record<string, typeof failures> = {};
  for (const f of failures) {
    const cat = String(f.category);
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(f);
  }

  // Chapter concentration
  const chapterErrors: Record<string, number> = {};
  for (const f of failures) {
    const ch = String(f.expected_chapter || '??');
    chapterErrors[ch] = (chapterErrors[ch] || 0) + 1;
  }

  // ─── Build summary ───
  let md = `# v3.0 Failure Analysis — ${failures.length} Wrong Answers\n\n`;
  md += `**Total:** ${allResults.length} items | **Correct:** ${correct} (${((correct/allResults.length)*100).toFixed(1)}%) | **Wrong:** ${failures.length}\n\n`;

  md += `## Category Breakdown\n\n`;
  md += `| Category | Count | % of Failures | Description |\n`;
  md += `|----------|-------|---------------|-------------|\n`;

  const catOrder = ['SECTION_MISS', 'CHAPTER_MISS', 'HEADING_CANDIDATE_MISS', 'HEADING_MISS', 'NEAR_MISS', 'SUBHEADING_MISS', 'ERROR'];
  const catDescs: Record<string, string> = {
    SECTION_MISS: 'Section wrong → everything wrong',
    CHAPTER_MISS: 'Section OK, wrong Chapter',
    HEADING_CANDIDATE_MISS: 'Correct heading not even a candidate',
    HEADING_MISS: 'Correct heading was candidate, picked wrong',
    NEAR_MISS: 'Same chapter, adjacent heading (within ±3)',
    SUBHEADING_MISS: 'Heading correct, wrong subheading',
    ERROR: 'Runtime error',
  };

  for (const cat of catOrder) {
    const items = categories[cat] || [];
    if (items.length === 0) continue;
    md += `| ${cat} | ${items.length} | ${((items.length/failures.length)*100).toFixed(1)}% | ${catDescs[cat] || ''} |\n`;
  }

  // Top 3 causes
  md += `\n## TOP 3 Failure Causes + Solutions\n\n`;

  const sortedCats = Object.entries(categories).sort((a, b) => b[1].length - a[1].length);

  for (let rank = 0; rank < Math.min(3, sortedCats.length); rank++) {
    const [cat, items] = sortedCats[rank];
    md += `### #${rank + 1}: ${cat} (${items.length} items, ${((items.length/failures.length)*100).toFixed(1)}%)\n\n`;

    // Show 3 examples
    md += `**Examples:**\n`;
    for (const ex of items.slice(0, 3)) {
      md += `- "${String(ex.product_name).substring(0, 60)}" → expected ${ex.expected_hs6}, got ${ex.predicted_hs6}\n`;
      md += `  - First wrong: ${ex.first_wrong_step || 'unknown'}\n`;
      const step1 = String(ex.steps?.['step1_product_understanding_v3'] || '').substring(0, 80);
      if (step1) md += `  - Step 1 understanding: "${step1}..."\n`;
    }

    // Solution
    md += `\n**Root cause:** `;
    if (cat === 'SECTION_MISS') md += `LLM misidentifies the product's fundamental category. Trade names / CBP ruling format confuses the model.`;
    else if (cat === 'HEADING_CANDIDATE_MISS') md += `LLM picks wrong headings because Chapter Note rules or heading specifics aren't fully applied.`;
    else if (cat === 'HEADING_MISS' || cat === 'NEAR_MISS') md += `LLM sees the right heading but picks an adjacent one. GRI 3(a) specificity judgment fails.`;
    else if (cat === 'SUBHEADING_MISS') md += `Heading is correct but the subheading distinction (material, processing, gender) is missed.`;
    else if (cat === 'CHAPTER_MISS') md += `Section is correct but the wrong Chapter within the Section is selected.`;
    else md += `Unknown`;

    md += `\n\n**Solution:** `;
    if (cat === 'SECTION_MISS') md += `Improve Step 1 prompt with more CBP ruling format examples. Add "extract the actual product from the ruling title" instruction.`;
    else if (cat === 'HEADING_CANDIDATE_MISS') md += `Feed ALL chapter headings to LLM, not just top candidates. Ensure Step 6 sees the complete heading list.`;
    else if (cat === 'HEADING_MISS' || cat === 'NEAR_MISS') md += `Strengthen GRI 3(a) specificity prompt. Add Chapter Note definitions to Step 6 context.`;
    else if (cat === 'SUBHEADING_MISS') md += `Add material/processing/gender extraction to Step 1 and pass to Step 8.`;
    else if (cat === 'CHAPTER_MISS') md += `Add more Chapter distinction context in Step 4. Include Chapter Notes excerpts.`;

    md += `\n\n`;
  }

  // Chapter concentration
  md += `## Chapter Error Concentration\n\n`;
  const sortedCh = Object.entries(chapterErrors).sort((a, b) => b[1] - a[1]).slice(0, 15);
  md += `| Chapter | Errors | % |\n|---------|--------|---|\n`;
  for (const [ch, cnt] of sortedCh) {
    md += `| Ch.${ch} | ${cnt} | ${((cnt/failures.length)*100).toFixed(1)}% |\n`;
  }

  // ─── Save ───
  const output = {
    summary: {
      total: allResults.length,
      correct,
      wrong: failures.length,
      categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.length])),
      chapter_errors: chapterErrors,
    },
    failures,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_MD, md);

  process.stdout.write(md);
  process.stdout.write(`\nSaved: ${OUTPUT_JSON}\nSaved: ${OUTPUT_MD}\n`);
}

main().catch(err => {
  process.stderr.write(`Error: ${err}\n`);
  process.exit(1);
});
