/**
 * GRI v3.0 Broker Thinking Benchmark
 * Tests 100 CBP CROSS rulings against the GRI classification pipeline.
 * Run: npx tsx scripts/gri_benchmark.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  // dotenv not available, rely on system env vars
}

import { classifyWithGRI_v3 } from '../app/lib/cost-engine/gri-classifier/pipeline-v3';

const BENCHMARK_FILE = '/Volumes/soulmaten/POTAL/benchmark_test_data.json';
const OUTPUT_DIR = '/Volumes/soulmaten/POTAL/benchmark_results';

interface BenchmarkItem {
  id: number;
  ruling_number: string;
  item_name: string;
  description: string;
  hts_code_answer: string;
  hs6: string;
  hs_chapter: string;
}

interface BenchmarkResult {
  id: number;
  ruling_number: string;
  product_name: string;
  expected_hs6: string;
  expected_hts: string;
  predicted_hs6: string;
  predicted_code: string;
  match_6digit: boolean;
  match_4digit: boolean;
  match_2digit: boolean;
  confidence: number;
  ai_call_count: number;
  processing_time_ms: number;
  method: string;
  decision_path_summary: string;
}

async function runBenchmark() {
  // Load test data
  const rawData = fs.readFileSync(BENCHMARK_FILE, 'utf-8');
  const testItems: BenchmarkItem[] = JSON.parse(rawData);

  const results: BenchmarkResult[] = [];
  const errors: { id: number; error: string; item_name: string }[] = [];

  let exact6 = 0;
  let match4 = 0;
  let match2 = 0;
  let totalAiCalls = 0;
  let totalTimeMs = 0;
  const aiCallDist = { 0: 0, 1: 0, 2: 0 };

  process.stdout.write(`\nRunning GRI Benchmark on ${testItems.length} items...\n\n`);

  for (let i = 0; i < testItems.length; i++) {
    const item = testItems[i];
    const productName = item.item_name || item.description?.substring(0, 100) || '';
    const expectedHs6 = (item.hs6 || '').replace(/\./g, '').substring(0, 6);

    if (!productName || !expectedHs6) {
      errors.push({ id: item.id, error: 'Missing product name or expected HS6', item_name: productName });
      continue;
    }

    try {
      const result = await classifyWithGRI_v3({
        productName,
        destinationCountry: 'US',
      }, { skipCache: true });

      const predictedHs6 = result.hsCode.replace(/\./g, '').substring(0, 6);
      const is6Match = predictedHs6 === expectedHs6;
      const is4Match = predictedHs6.substring(0, 4) === expectedHs6.substring(0, 4);
      const is2Match = predictedHs6.substring(0, 2) === expectedHs6.substring(0, 2);

      if (is6Match) exact6++;
      if (is4Match) match4++;
      if (is2Match) match2++;

      totalAiCalls += result.aiCallCount;
      totalTimeMs += result.processingTimeMs;
      const callBucket = Math.min(result.aiCallCount, 2) as 0 | 1 | 2;
      aiCallDist[callBucket]++;

      const pathSummary = result.decisionPath
        .filter(s => s.output && s.output !== 'none' && s.output !== 'no conflict')
        .map(s => `S${s.step}:${s.output.substring(0, 30)}`)
        .join(' → ');

      results.push({
        id: item.id,
        ruling_number: item.ruling_number,
        product_name: productName.substring(0, 80),
        expected_hs6: expectedHs6,
        expected_hts: item.hts_code_answer,
        predicted_hs6: predictedHs6,
        predicted_code: result.hsCode,
        match_6digit: is6Match,
        match_4digit: is4Match,
        match_2digit: is2Match,
        confidence: result.confidence,
        ai_call_count: result.aiCallCount,
        processing_time_ms: result.processingTimeMs,
        method: result.decisionPath.find(s => s.method === 'ai')?.name || 'code_only',
        decision_path_summary: pathSummary,
      });

      // Progress
      if ((i + 1) % 10 === 0 || i === testItems.length - 1) {
        const pct6 = ((exact6 / (i + 1)) * 100).toFixed(1);
        process.stdout.write(`  [${i + 1}/${testItems.length}] 6-digit: ${exact6}/${i + 1} (${pct6}%)\n`);
      }
    } catch (err) {
      errors.push({
        id: item.id,
        error: err instanceof Error ? err.message : String(err),
        item_name: productName.substring(0, 80),
      });
    }
  }

  const totalProcessed = results.length;
  const timings = results.map(r => r.processing_time_ms).sort((a, b) => a - b);

  // Build summary
  const summary = `
GRI v3.0 Broker Thinking Benchmark — ${new Date().toISOString().split('T')[0]}
${'━'.repeat(50)}
6-digit Exact: ${exact6}/${totalProcessed} (${((exact6/totalProcessed)*100).toFixed(1)}%)
4-digit Heading: ${match4}/${totalProcessed} (${((match4/totalProcessed)*100).toFixed(1)}%)
2-digit Chapter: ${match2}/${totalProcessed} (${((match2/totalProcessed)*100).toFixed(1)}%)

AI Calls: avg ${(totalAiCalls/totalProcessed).toFixed(2)}/item, 0-call ${aiCallDist[0]}, 1-call ${aiCallDist[1]}, 2-call ${aiCallDist[2]}
Timing: avg ${(totalTimeMs/totalProcessed).toFixed(0)}ms, median ${timings[Math.floor(timings.length/2)] || 0}ms, max ${timings[timings.length-1] || 0}ms, min ${timings[0] || 0}ms
Errors: ${errors.length}

vs Previous POTAL versions:
- v2 (GPT-4o-mini): 25%
- v8 (GPT-4o): 37%
- v10 (GPT-4o + GRI prompt): 38%
→ GRI Agent Team v1: ${((exact6/totalProcessed)*100).toFixed(1)}% ★

vs Competitors:
- Tarifflo: 89%
- Avalara: 80%
- Zonos: 44%
- WCO BACUDA: 13%

Error Analysis:
${analyzeErrors(results, errors)}
${'━'.repeat(50)}
`;

  // Save results
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'gri_benchmark_v1_results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'gri_benchmark_v1_summary.md'), summary);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'gri_benchmark_v1_errors.json'), JSON.stringify(errors, null, 2));

  // Also save wrong answers for analysis
  const wrongAnswers = results.filter(r => !r.match_6digit);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'gri_benchmark_v1_wrong.json'), JSON.stringify(wrongAnswers, null, 2));

  process.stdout.write(summary);
  process.stdout.write(`\nResults saved to ${OUTPUT_DIR}\n`);
}

function analyzeErrors(results: BenchmarkResult[], errors: { id: number; error: string }[]): string {
  const wrong = results.filter(r => !r.match_6digit);
  if (wrong.length === 0) return 'No misclassifications!';

  // Categorize errors
  const categories: Record<string, number> = {
    'Wrong chapter (2-digit miss)': 0,
    'Right chapter, wrong heading (4-digit miss)': 0,
    'Right heading, wrong subheading': 0,
  };

  for (const w of wrong) {
    if (!w.match_2digit) categories['Wrong chapter (2-digit miss)']++;
    else if (!w.match_4digit) categories['Right chapter, wrong heading (4-digit miss)']++;
    else categories['Right heading, wrong subheading']++;
  }

  const lines = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k}: ${v} items`);

  if (errors.length > 0) {
    lines.push(`  Runtime errors: ${errors.length} items`);
  }

  return lines.join('\n');
}

runBenchmark().catch(err => {
  process.stderr.write(`Benchmark failed: ${err}\n`);
  process.exit(1);
});
