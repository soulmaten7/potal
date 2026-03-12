/**
 * POTAL Calculate Engine — Load Test (100 Concurrent Users)
 *
 * Simulates 100 concurrent users calling calculateGlobalLandedCostAsync().
 * Measures p50/p95/p99 response times, error rate, and bottlenecks.
 *
 * Usage: npx tsx scripts/benchmark_load_test.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
try {
  const envPath = resolve(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { calculateGlobalLandedCostAsync } = require('../app/lib/cost-engine');

// ─── Test Payloads (diverse scenarios) ───────────────────────
const PAYLOADS = [
  { price: 999, origin: "CN", destinationCountry: "US", productName: "Laptop Computer", hsCode: "847130", shippingPrice: 25 },
  { price: 50, origin: "CN", destinationCountry: "DE", productName: "Phone Case", hsCode: "392690", shippingPrice: 8 },
  { price: 200, origin: "US", destinationCountry: "GB", productName: "Running Shoes", hsCode: "640411", shippingPrice: 15 },
  { price: 30, origin: "KR", destinationCountry: "JP", productName: "Green Tea", hsCode: "090210", shippingPrice: 10 },
  { price: 500, origin: "IT", destinationCountry: "CA", productName: "Leather Bag", hsCode: "420221", shippingPrice: 30 },
  { price: 80, origin: "CN", destinationCountry: "AU", productName: "Toy Set", hsCode: "950300", shippingPrice: 12 },
  { price: 1200, origin: "JP", destinationCountry: "US", productName: "Camera", hsCode: "852580", shippingPrice: 35 },
  { price: 25, origin: "CN", destinationCountry: "SG", productName: "USB Cable", hsCode: "854442", shippingPrice: 5 },
  { price: 350, origin: "DE", destinationCountry: "KR", productName: "Kitchen Mixer", hsCode: "850940", shippingPrice: 40 },
  { price: 150, origin: "VN", destinationCountry: "FR", productName: "Cotton Dress", hsCode: "620442", shippingPrice: 18 },
];

interface RequestResult {
  idx: number;
  timeMs: number;
  success: boolean;
  error?: string;
  tlc?: number;
}

async function runSingleRequest(idx: number): Promise<RequestResult> {
  const payload = PAYLOADS[idx % PAYLOADS.length];
  const start = performance.now();

  try {
    const result = await calculateGlobalLandedCostAsync(payload);
    const timeMs = Math.round(performance.now() - start);

    if (!result || result.totalLandedCost === undefined) {
      return { idx, timeMs, success: false, error: 'No TLC in response' };
    }

    return { idx, timeMs, success: true, tlc: result.totalLandedCost };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - start);
    return { idx, timeMs, success: false, error: err.message?.substring(0, 100) };
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

async function main() {
  const CONCURRENCY = 100;
  const WARMUP = 5;

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(` POTAL Calculate Engine — Load Test`);
  console.log(` Concurrency: ${CONCURRENCY} simultaneous requests`);
  console.log(` Payloads: ${PAYLOADS.length} diverse scenarios (round-robin)`);
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // ─── Warmup Phase ──────────────────────────────────────────
  console.log(`🔥 Warmup: ${WARMUP} sequential requests...`);
  for (let i = 0; i < WARMUP; i++) {
    const r = await runSingleRequest(i);
    process.stdout.write(`  warmup[${i + 1}] ${r.timeMs}ms ${r.success ? '✅' : '❌'}\n`);
  }

  // ─── Load Test Phase ──────────────────────────────────────
  console.log(`\n🚀 Load Test: ${CONCURRENCY} concurrent requests...\n`);

  const loadStart = performance.now();

  // Launch all requests concurrently
  const promises: Promise<RequestResult>[] = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(runSingleRequest(i));
  }

  const results = await Promise.all(promises);
  const totalElapsed = Math.round(performance.now() - loadStart);

  // ─── Analysis ─────────────────────────────────────────────
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const times = successful.map(r => r.timeMs).sort((a, b) => a - b);

  const p50 = times.length > 0 ? percentile(times, 0.5) : 0;
  const p75 = times.length > 0 ? percentile(times, 0.75) : 0;
  const p90 = times.length > 0 ? percentile(times, 0.9) : 0;
  const p95 = times.length > 0 ? percentile(times, 0.95) : 0;
  const p99 = times.length > 0 ? percentile(times, 0.99) : 0;
  const avgMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' LOAD TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`Total Requests:   ${CONCURRENCY}`);
  console.log(`Successful:       ${successful.length}/${CONCURRENCY} (${(successful.length / CONCURRENCY * 100).toFixed(0)}%)`);
  console.log(`Failed:           ${failed.length}/${CONCURRENCY} (${(failed.length / CONCURRENCY * 100).toFixed(1)}%)`);
  console.log(`Total Elapsed:    ${totalElapsed}ms`);
  console.log(`Throughput:       ${(successful.length / (totalElapsed / 1000)).toFixed(1)} req/s`);

  console.log(`\nResponse Time Distribution:`);
  console.log(`  Min:     ${times[0] || 0}ms`);
  console.log(`  p50:     ${p50}ms`);
  console.log(`  p75:     ${p75}ms`);
  console.log(`  p90:     ${p90}ms`);
  console.log(`  p95:     ${p95}ms`);
  console.log(`  p99:     ${p99}ms`);
  console.log(`  Max:     ${times[times.length - 1] || 0}ms`);
  console.log(`  Average: ${avgMs}ms`);

  // Timeout analysis (>10s = timeout)
  const timeouts = results.filter(r => r.timeMs > 10000).length;
  const slow = results.filter(r => r.timeMs > 5000).length;
  console.log(`\nSlow Requests:`);
  console.log(`  >5s:     ${slow}/${CONCURRENCY}`);
  console.log(`  >10s:    ${timeouts}/${CONCURRENCY} (timeouts)`);

  // Error breakdown
  if (failed.length > 0) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(` ERROR BREAKDOWN`);
    console.log(`──────────────────────────────────────────────────`);
    const errorCounts = new Map<string, number>();
    for (const r of failed) {
      const err = r.error || 'unknown';
      errorCounts.set(err, (errorCounts.get(err) || 0) + 1);
    }
    for (const [err, count] of [...errorCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${count}x: ${err}`);
    }
  }

  // Histogram
  console.log(`\n──────────────────────────────────────────────────`);
  console.log(` RESPONSE TIME HISTOGRAM`);
  console.log(`──────────────────────────────────────────────────`);

  const buckets = [
    { label: '0-200ms', min: 0, max: 200 },
    { label: '200-500ms', min: 200, max: 500 },
    { label: '500ms-1s', min: 500, max: 1000 },
    { label: '1-2s', min: 1000, max: 2000 },
    { label: '2-5s', min: 2000, max: 5000 },
    { label: '5-10s', min: 5000, max: 10000 },
    { label: '10s+', min: 10000, max: Infinity },
  ];

  const allTimes = results.map(r => r.timeMs);
  for (const b of buckets) {
    const count = allTimes.filter(t => t >= b.min && t < b.max).length;
    const bar = '█'.repeat(Math.round(count / CONCURRENCY * 50));
    console.log(`  ${b.label.padEnd(10)} │ ${String(count).padStart(3)} │ ${bar} ${(count / CONCURRENCY * 100).toFixed(0)}%`);
  }

  // Bottleneck analysis
  console.log(`\n──────────────────────────────────────────────────`);
  console.log(` BOTTLENECK ANALYSIS`);
  console.log(`──────────────────────────────────────────────────`);

  if (p95 > 5000) {
    console.log(`  ⚠️  p95 > 5s — DB connection pool likely saturated under ${CONCURRENCY} concurrent`);
  } else if (p95 > 2000) {
    console.log(`  🟡 p95 > 2s — Some DB contention, acceptable for ${CONCURRENCY} concurrent`);
  } else {
    console.log(`  ✅ p95 < 2s — Good performance under ${CONCURRENCY} concurrent load`);
  }

  if (failed.length > CONCURRENCY * 0.05) {
    console.log(`  ⚠️  Error rate > 5% — Connection pool exhaustion or rate limiting`);
  } else if (failed.length > 0) {
    console.log(`  🟡 Some errors (${failed.length}/${CONCURRENCY}) — Minor issues under load`);
  } else {
    console.log(`  ✅ Zero errors — All requests completed successfully`);
  }

  const rps = successful.length / (totalElapsed / 1000);
  if (rps < 5) {
    console.log(`  ⚠️  Throughput ${rps.toFixed(1)} req/s — Below target for production`);
  } else if (rps < 20) {
    console.log(`  🟡 Throughput ${rps.toFixed(1)} req/s — Acceptable but could improve`);
  } else {
    console.log(`  ✅ Throughput ${rps.toFixed(1)} req/s — Good for production`);
  }

  // Save results
  const outputPath = resolve(__dirname, '..', 'benchmark_load_results.json');
  writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    concurrency: CONCURRENCY,
    totalRequests: CONCURRENCY,
    successful: successful.length,
    failed: failed.length,
    totalElapsedMs: totalElapsed,
    throughputRps: parseFloat(rps.toFixed(1)),
    responseTimes: { avg: avgMs, p50, p75, p90, p95, p99, min: times[0] || 0, max: times[times.length - 1] || 0 },
    errors: failed.map(r => ({ idx: r.idx, error: r.error, timeMs: r.timeMs })),
  }, null, 2));
  console.log(`\n📁 Results saved to: benchmark_load_results.json\n`);
}

main().catch(console.error);
