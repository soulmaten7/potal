/**
 * POTAL HS Classification — Accuracy Benchmark Runner
 *
 * Runs the classification pipeline against 1000 test cases
 * and measures accuracy at various levels:
 * - Exact 6-digit match
 * - 4-digit heading match
 * - 2-digit chapter match
 *
 * Usage:
 *   npx tsx accuracy-benchmark/run-benchmark.ts
 *   npx tsx accuracy-benchmark/run-benchmark.ts --method keyword
 *   npx tsx accuracy-benchmark/run-benchmark.ts --difficulty easy
 *   npx tsx accuracy-benchmark/run-benchmark.ts --category electronics
 */

import { TEST_CASES, type TestCase } from './test-cases';

// ─── Import classifier (dynamic to handle module resolution) ──

async function getClassifier() {
  try {
    const mod = await import('../app/lib/cost-engine/hs-code/classifier');
    return mod.classifyProduct;
  } catch {
    // Fallback: simple keyword classifier stub
    return (productName: string, _category?: string) => ({
      hsCode: '000000',
      description: 'Stub classifier',
      confidence: 0,
      method: 'keyword' as const,
    });
  }
}

// ─── Matching Logic ──────────────────────────────────

function matchLevel(predicted: string, expected: string): 'exact' | 'heading' | 'chapter' | 'miss' {
  const p = predicted.replace(/[^0-9]/g, '').slice(0, 6);
  const e = expected.replace(/[^0-9]/g, '').slice(0, 6);

  if (p === e) return 'exact';
  if (p.slice(0, 4) === e.slice(0, 4)) return 'heading';
  if (p.slice(0, 2) === e.slice(0, 2)) return 'chapter';
  return 'miss';
}

// ─── Benchmark Runner ────────────────────────────────

interface BenchmarkResult {
  totalCases: number;
  exactMatch: number;
  headingMatch: number;
  chapterMatch: number;
  miss: number;
  exactAccuracy: number;
  headingAccuracy: number;
  chapterAccuracy: number;
  avgConfidence: number;
  byDifficulty: Record<string, { total: number; exact: number; accuracy: number }>;
  byCategory: Record<string, { total: number; exact: number; accuracy: number }>;
  failures: Array<{
    id: number;
    productName: string;
    expected: string;
    predicted: string;
    confidence: number;
    matchLevel: string;
  }>;
  durationMs: number;
}

async function runBenchmark(
  cases: TestCase[],
  options?: { method?: string; verbose?: boolean },
): Promise<BenchmarkResult> {
  const classifyProduct = await getClassifier();
  const startTime = Date.now();

  let exactMatch = 0;
  let headingMatch = 0;
  let chapterMatch = 0;
  let miss = 0;
  let totalConfidence = 0;

  const byDifficulty: Record<string, { total: number; exact: number }> = {};
  const byCategory: Record<string, { total: number; exact: number }> = {};
  const failures: BenchmarkResult['failures'] = [];

  for (const tc of cases) {
    const result = classifyProduct(tc.productName, tc.category);
    const level = matchLevel(result.hsCode, tc.expectedHs6);
    totalConfidence += result.confidence;

    // Track by difficulty
    if (!byDifficulty[tc.difficulty]) byDifficulty[tc.difficulty] = { total: 0, exact: 0 };
    byDifficulty[tc.difficulty].total++;

    // Track by category
    const cat = tc.category || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, exact: 0 };
    byCategory[cat].total++;

    switch (level) {
      case 'exact':
        exactMatch++;
        byDifficulty[tc.difficulty].exact++;
        byCategory[cat].exact++;
        break;
      case 'heading':
        headingMatch++;
        break;
      case 'chapter':
        chapterMatch++;
        break;
      case 'miss':
        miss++;
        break;
    }

    if (level !== 'exact') {
      failures.push({
        id: tc.id,
        productName: tc.productName,
        expected: tc.expectedHs6,
        predicted: result.hsCode,
        confidence: result.confidence,
        matchLevel: level,
      });
    }

    if (options?.verbose && level === 'miss') {
      process.stdout.write(`  MISS #${tc.id}: "${tc.productName}" → ${result.hsCode} (expected ${tc.expectedHs6})\n`);
    }
  }

  const total = cases.length;
  const durationMs = Date.now() - startTime;

  return {
    totalCases: total,
    exactMatch,
    headingMatch,
    chapterMatch,
    miss,
    exactAccuracy: Math.round((exactMatch / total) * 10000) / 100,
    headingAccuracy: Math.round(((exactMatch + headingMatch) / total) * 10000) / 100,
    chapterAccuracy: Math.round(((exactMatch + headingMatch + chapterMatch) / total) * 10000) / 100,
    avgConfidence: Math.round((totalConfidence / total) * 1000) / 1000,
    byDifficulty: Object.fromEntries(
      Object.entries(byDifficulty).map(([k, v]) => [k, { ...v, accuracy: Math.round((v.exact / v.total) * 10000) / 100 }])
    ),
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, { ...v, accuracy: Math.round((v.exact / v.total) * 10000) / 100 }])
    ),
    failures: failures.slice(0, 50), // Top 50 failures
    durationMs,
  };
}

// ─── CLI ─────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const difficultyFilter = args.find(a => a.startsWith('--difficulty='))?.split('=')[1];
  const categoryFilter = args.find(a => a.startsWith('--category='))?.split('=')[1];
  const verbose = args.includes('--verbose') || args.includes('-v');

  let cases = TEST_CASES;

  if (difficultyFilter) {
    cases = cases.filter(tc => tc.difficulty === difficultyFilter);
    process.stdout.write(`Filtering by difficulty: ${difficultyFilter} (${cases.length} cases)\n`);
  }
  if (categoryFilter) {
    cases = cases.filter(tc => tc.category === categoryFilter);
    process.stdout.write(`Filtering by category: ${categoryFilter} (${cases.length} cases)\n`);
  }

  process.stdout.write(`\n=== POTAL HS Classification Benchmark ===\n`);
  process.stdout.write(`Running ${cases.length} test cases...\n\n`);

  const result = await runBenchmark(cases, { verbose });

  process.stdout.write(`\n=== Results ===\n`);
  process.stdout.write(`Total Cases:      ${result.totalCases}\n`);
  process.stdout.write(`Duration:         ${result.durationMs}ms\n`);
  process.stdout.write(`Avg Confidence:   ${result.avgConfidence}\n\n`);

  process.stdout.write(`Exact (6-digit):  ${result.exactMatch}/${result.totalCases} = ${result.exactAccuracy}%\n`);
  process.stdout.write(`Heading (4-digit): ${result.exactMatch + result.headingMatch}/${result.totalCases} = ${result.headingAccuracy}%\n`);
  process.stdout.write(`Chapter (2-digit): ${result.exactMatch + result.headingMatch + result.chapterMatch}/${result.totalCases} = ${result.chapterAccuracy}%\n`);
  process.stdout.write(`Miss:             ${result.miss}/${result.totalCases}\n\n`);

  process.stdout.write(`--- By Difficulty ---\n`);
  for (const [level, stats] of Object.entries(result.byDifficulty)) {
    process.stdout.write(`  ${level}: ${stats.exact}/${stats.total} = ${stats.accuracy}%\n`);
  }

  process.stdout.write(`\n--- By Category ---\n`);
  for (const [cat, stats] of Object.entries(result.byCategory)) {
    process.stdout.write(`  ${cat}: ${stats.exact}/${stats.total} = ${stats.accuracy}%\n`);
  }

  // Output JSON for programmatic consumption
  if (args.includes('--json')) {
    process.stdout.write(`\n${JSON.stringify(result, null, 2)}\n`);
  }
}

main().catch(err => {
  process.stderr.write(`Benchmark failed: ${err}\n`);
  process.exit(1);
});
