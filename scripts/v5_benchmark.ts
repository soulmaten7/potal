/**
 * v5.0 Benchmark — "Generate Description First, Then Classify"
 * Step 0: LLM generates comprehensive product description
 * Steps 1-8: v3.0 pipeline unchanged (uses description as input)
 */

import * as fs from 'fs';
import * as path from 'path';

try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {}

import { classifyWithGRI_v3 } from '../app/lib/cost-engine/gri-classifier/pipeline-v3';
import { callLLM, resetTokenCounter, getTotalTokensUsed } from '../app/lib/cost-engine/gri-classifier/utils/llm-call';

const BENCHMARK_FILE = '/Volumes/soulmaten/POTAL/benchmark_test_data.json';
const V3_FAILURES = '/Volumes/soulmaten/POTAL/v3_failure_analysis.json';
const OUTPUT_JSON = '/Volumes/soulmaten/POTAL/v5_benchmark_results.json';
const OUTPUT_MD = '/Volumes/soulmaten/POTAL/v5_benchmark_summary.md';

interface BenchmarkItem {
  id: number;
  ruling_number: string;
  item_name: string;
  description: string;
  hs6: string;
}

const STEP0_PROMPT = `You are a trade compliance specialist. A product needs customs documentation.
Write a 2-3 sentence technical description of this product for customs declaration purposes.

You MUST include ALL of these attributes:
- MATERIAL: What is it made of? (metal, plastic, textile fiber type, animal/plant origin, chemical compound, etc.)
- PROCESSING STATE: Raw, semi-processed, or finished manufactured article?
- FUNCTION/USE: What is it used for? (food consumption, industrial machinery, clothing, decoration, transportation, etc.)
- PHYSICAL FORM: Liquid, powder, sheet, wire, assembled device, garment, etc.
- COMPOSITION: Single material or composite/mixture?
- INDUSTRY: Agriculture, electronics, textiles, chemicals, metals, automotive, etc.

CRITICAL RULES:
- Use customs/trade terminology, NOT casual language
- "Grease" from restaurants = used cooking fat/oil (animal or vegetable origin)
- "Lumber" = sawn wood
- "Sneakers" = footwear with rubber/plastic outer sole and textile upper
- Extract the ACTUAL PRODUCT from CBP ruling titles (ignore "tariff classification of..." preamble)
- If a brand name appears, describe the generic product it represents
- DO NOT mention HS codes, tariff numbers, or classification. Only describe the product.

Product name: "{PRODUCT}"

Technical description:`;

async function generateDescription(productName: string): Promise<string> {
  const prompt = STEP0_PROMPT.replace('{PRODUCT}', productName);
  const result = await callLLM<{ description: string }>({
    userPrompt: prompt + '\n\nRespond in JSON: {"description": "your 2-3 sentence technical description"}',
    maxTokens: 300,
    temperature: 0,
  });

  if (result.data?.description) {
    return result.data.description;
  }
  // Fallback: try to extract from raw
  if (result.raw) {
    try {
      const parsed = JSON.parse(result.raw);
      if (parsed.description) return parsed.description;
    } catch {
      // Not JSON, use raw text
    }
    // Strip JSON wrapper if partial
    const cleaned = result.raw.replace(/^\s*\{?\s*"description"\s*:\s*"?/i, '').replace(/"?\s*\}?\s*$/, '');
    if (cleaned.length > 10) return cleaned.substring(0, 300);
  }
  return productName; // Ultimate fallback: use original name
}

async function main() {
  const testItems: BenchmarkItem[] = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf-8'));

  // Load v3 failure data for comparison
  let v3Failures: Set<number> = new Set();
  let v3SectionMisses: Set<number> = new Set();
  try {
    const v3Data = JSON.parse(fs.readFileSync(V3_FAILURES, 'utf-8'));
    for (const f of v3Data.failures) {
      v3Failures.add(f.id);
      if (f.category === 'SECTION_MISS') v3SectionMisses.add(f.id);
    }
  } catch {}

  process.stdout.write(`\nv5.0 Benchmark — Description-First Pipeline\n`);
  process.stdout.write(`Test items: ${testItems.length}\n`);
  process.stdout.write(`v3.0 SECTION_MISS tracking: ${v3SectionMisses.size} items\n\n`);

  const results: Record<string, unknown>[] = [];
  let correct6 = 0, correct4 = 0, correct2 = 0;
  let sectionMissFixed = 0, sectionMissStillWrong = 0;
  let totalLLMCalls = 0;

  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    const productName = item.item_name || item.description?.substring(0, 150) || '';
    const expectedHs6 = (item.hs6 || '').replace(/\./g, '').substring(0, 6);

    if (!productName || !expectedHs6 || expectedHs6.length < 6) continue;

    resetTokenCounter();

    try {
      // Step 0: Generate comprehensive description
      const genDesc = await generateDescription(productName);
      totalLLMCalls++;

      // Feed original name as productName, generated description as separate field
      const result = await classifyWithGRI_v3({
        productName: genDesc ? `${productName} — ${genDesc}` : productName,
        description: genDesc || undefined,
        destinationCountry: 'US',
      });

      totalLLMCalls += result.aiCallCount;

      const predictedHs6 = result.hsCode.replace(/\./g, '').substring(0, 6);
      const is6 = predictedHs6 === expectedHs6;
      const is4 = predictedHs6.substring(0, 4) === expectedHs6.substring(0, 4);
      const is2 = predictedHs6.substring(0, 2) === expectedHs6.substring(0, 2);

      if (is6) correct6++;
      if (is4) correct4++;
      if (is2) correct2++;

      // Track v3 SECTION_MISS improvements
      const wasV3SectionMiss = v3SectionMisses.has(item.id);
      if (wasV3SectionMiss) {
        if (is2) sectionMissFixed++;
        else sectionMissStillWrong++;
      }

      results.push({
        id: item.id,
        product_name: productName.substring(0, 80),
        generated_description: genDesc.substring(0, 200),
        expected_hs6: expectedHs6,
        predicted_hs6: predictedHs6,
        match_6: is6,
        match_4: is4,
        match_2: is2,
        was_v3_section_miss: wasV3SectionMiss,
        v3_section_miss_fixed: wasV3SectionMiss && is2,
        decision_path: result.decisionPath.map(s => `S${s.step}:${s.output.substring(0, 40)}`).join(' → '),
        tokens_used: getTotalTokensUsed(),
      });
    } catch (err) {
      results.push({
        id: item.id,
        product_name: productName.substring(0, 80),
        error: err instanceof Error ? err.message : String(err),
        match_6: false, match_4: false, match_2: false,
      });
    }

    if ((i + 1) % 10 === 0) {
      const pct = ((correct6 / (i + 1)) * 100).toFixed(1);
      process.stdout.write(`  [${i + 1}/${testItems.length}] 6-digit: ${correct6}/${i + 1} (${pct}%) | section_miss fixed: ${sectionMissFixed}\n`);
    }
  }

  const total = results.length;

  // ─── Build summary ───
  let md = `# v5.0 Benchmark Results — Description-First Pipeline\n\n`;
  md += `## Accuracy\n`;
  md += `| Metric | v3.0 | v5.0 | Change |\n`;
  md += `|--------|------|------|--------|\n`;
  md += `| 6-digit | 24% | ${((correct6/total)*100).toFixed(1)}% | ${correct6 > 24 ? '+' : ''}${(correct6 - 24)}건 |\n`;
  md += `| 4-digit | 42% | ${((correct4/total)*100).toFixed(1)}% | ${correct4 > 42 ? '+' : ''}${(correct4 - 42)}건 |\n`;
  md += `| Chapter | 59% | ${((correct2/total)*100).toFixed(1)}% | ${correct2 > 59 ? '+' : ''}${(correct2 - 59)}건 |\n\n`;

  md += `## v3.0 SECTION_MISS 개선\n`;
  md += `- v3.0 SECTION_MISS: ${v3SectionMisses.size}건\n`;
  md += `- v5.0에서 Section 정답: ${sectionMissFixed}건 (${((sectionMissFixed/Math.max(v3SectionMisses.size,1))*100).toFixed(1)}% 해결)\n`;
  md += `- 여전히 Section 오답: ${sectionMissStillWrong}건\n\n`;

  md += `## 비용\n`;
  md += `- LLM 호출: 평균 ${(totalLLMCalls/total).toFixed(1)}회/건 (v3.0: 5회)\n`;
  md += `- Step 0 추가 비용: ~$0.0005/건\n\n`;

  // Description 도움 사례
  md += `## Description이 도움된 사례\n`;
  const helped = results.filter(r => r.was_v3_section_miss && r.match_2);
  for (const h of (helped as Record<string, unknown>[]).slice(0, 5)) {
    md += `- "${String(h.product_name).substring(0, 50)}" → desc: "${String(h.generated_description).substring(0, 80)}"\n`;
  }

  md += `\n## Description에도 불구하고 틀린 사례\n`;
  const stillWrong = results.filter(r => r.was_v3_section_miss && !r.match_2);
  for (const w of (stillWrong as Record<string, unknown>[]).slice(0, 5)) {
    md += `- "${String(w.product_name).substring(0, 50)}" → desc: "${String(w.generated_description).substring(0, 80)}"\n`;
    md += `  expected: ${w.expected_hs6}, got: ${w.predicted_hs6}\n`;
  }

  // Save
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ summary: { correct6, correct4, correct2, total, sectionMissFixed, sectionMissStillWrong, totalLLMCalls }, results }, null, 2));
  fs.writeFileSync(OUTPUT_MD, md);

  process.stdout.write(`\n${md}`);
  process.stdout.write(`\nSaved: ${OUTPUT_JSON}\nSaved: ${OUTPUT_MD}\n`);
}

main().catch(err => {
  process.stderr.write(`Error: ${err}\n`);
  process.exit(1);
});
