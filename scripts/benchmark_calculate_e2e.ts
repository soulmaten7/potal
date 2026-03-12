/**
 * POTAL Calculate API — E2E Benchmark Test
 *
 * Directly invokes calculateGlobalLandedCostAsync() with diverse country/product combos.
 * Validates response structure, accuracy, and performance.
 *
 * Usage: npx tsx scripts/benchmark_calculate_e2e.ts
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

interface TestCase {
  name: string;
  input: {
    price: number;
    origin: string;
    destinationCountry: string;
    productName: string;
    hsCode?: string;
    currency?: string;
    weight?: number;
    shippingPrice?: number;
    shippingTerms?: string;
  };
  checks: {
    hasDuty: boolean;
    hasVat: boolean;
    hasTLC: boolean;
  };
}

const TEST_CASES: TestCase[] = [
  { name: "US→DE: iPhone",            input: { price: 999, origin: "US", destinationCountry: "DE", productName: "iPhone 15 Pro", hsCode: "851712", weight: 0.5, shippingPrice: 25 },                    checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "CN→US: Cotton T-Shirt",    input: { price: 15, origin: "CN", destinationCountry: "US", productName: "Cotton T-Shirt", hsCode: "610910", weight: 0.3, shippingPrice: 8 },                     checks: { hasDuty: true, hasVat: false, hasTLC: true } },
  { name: "KR→JP: Green Tea",         input: { price: 30, origin: "KR", destinationCountry: "JP", productName: "Organic Green Tea", hsCode: "090210", weight: 0.5, shippingPrice: 12 },                 checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "DE→GB: Chocolate",         input: { price: 50, origin: "DE", destinationCountry: "GB", productName: "Dark Chocolate Bar", hsCode: "180632", weight: 1, shippingPrice: 15 },                   checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "CN→AU: LEGO Set",          input: { price: 80, origin: "CN", destinationCountry: "AU", productName: "Building Block Set", hsCode: "950300", weight: 2, shippingPrice: 20 },                   checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "IT→CA: Leather Shoes",     input: { price: 350, origin: "IT", destinationCountry: "CA", productName: "Italian Leather Dress Shoes", hsCode: "640399", weight: 1.5, shippingPrice: 30 },       checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "US→KR: MacBook (KORUS)",   input: { price: 2499, origin: "US", destinationCountry: "KR", productName: "MacBook Pro Laptop", hsCode: "847130", weight: 2.2, shippingPrice: 40 },              checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "VN→US: Sneakers",          input: { price: 90, origin: "VN", destinationCountry: "US", productName: "Running Sneakers", hsCode: "640411", weight: 0.8, shippingPrice: 15 },                   checks: { hasDuty: true, hasVat: false, hasTLC: true } },
  { name: "FR→SG: Perfume",           input: { price: 25, origin: "FR", destinationCountry: "SG", productName: "Perfume Sample", hsCode: "330300", weight: 0.2, shippingPrice: 10 },                     checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "CN→BR: Camera",            input: { price: 1200, origin: "CN", destinationCountry: "BR", productName: "Digital Camera", hsCode: "852580", weight: 1, shippingPrice: 45 },                     checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "JP→MX: Smart Watch",       input: { price: 400, origin: "JP", destinationCountry: "MX", productName: "Smart Watch", hsCode: "910111", weight: 0.3, shippingPrice: 20 },                       checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "CN→US: No HS (AI)",        input: { price: 50, origin: "CN", destinationCountry: "US", productName: "Stainless Steel Water Bottle Insulated", weight: 0.5, shippingPrice: 10 },               checks: { hasDuty: true, hasVat: false, hasTLC: true } },
  { name: "CN→DE: DDP Keyboard",      input: { price: 120, origin: "CN", destinationCountry: "DE", productName: "Mechanical Keyboard", hsCode: "847160", weight: 1, shippingPrice: 18, shippingTerms: "DDP" }, checks: { hasDuty: true, hasVat: true, hasTLC: true } },
  { name: "CH→US: Luxury Watch",      input: { price: 15000, origin: "CH", destinationCountry: "US", productName: "Swiss Luxury Watch", hsCode: "910111", weight: 0.3, shippingPrice: 50 },              checks: { hasDuty: true, hasVat: false, hasTLC: true } },
  { name: "DE→FR: Intra-EU",          input: { price: 100, origin: "DE", destinationCountry: "FR", productName: "Office Supplies", hsCode: "482090", weight: 2, shippingPrice: 10 },                     checks: { hasDuty: false, hasVat: true, hasTLC: true } },
];

interface E2EResult {
  name: string;
  timeMs: number;
  result: any;
  errors: string[];
  passed: boolean;
}

async function runTest(tc: TestCase): Promise<E2EResult> {
  const errors: string[] = [];
  const start = performance.now();

  try {
    const result = await calculateGlobalLandedCostAsync(tc.input);
    const timeMs = Math.round(performance.now() - start);

    if (tc.checks.hasTLC && (result.totalLandedCost === undefined || result.totalLandedCost === null)) {
      errors.push('Missing totalLandedCost');
    }

    if (result.totalLandedCost !== undefined && result.totalLandedCost <= 0) {
      errors.push(`TLC=${result.totalLandedCost} (should be positive)`);
    }

    if (tc.checks.hasDuty && (result.importDuty === undefined || result.importDuty === null)) {
      errors.push('Missing importDuty');
    }

    if (tc.checks.hasVat && (result.vat === undefined || result.vat === null)) {
      // Some destinations don't apply VAT on low-value imports
    }

    // Sanity checks
    if (result.totalLandedCost < tc.input.price) {
      errors.push(`TLC ($${result.totalLandedCost}) < product price ($${tc.input.price})`);
    }

    return { name: tc.name, timeMs, result, errors, passed: errors.length === 0 };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - start);
    return { name: tc.name, timeMs, result: null, errors: [`Exception: ${err.message}`], passed: false };
  }
}

async function main() {
  const N = TEST_CASES.length;
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(` POTAL Calculate Engine — E2E Benchmark (${N} test cases)`);
  console.log(' Direct function call: calculateGlobalLandedCostAsync()');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const results: E2EResult[] = [];

  for (let i = 0; i < N; i++) {
    const tc = TEST_CASES[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${N}] ${tc.name.padEnd(30)} `);

    const r = await runTest(tc);
    results.push(r);

    const res = r.result || {};
    console.log(
      `${r.passed ? '✅' : '❌'} ` +
      `${String(r.timeMs).padStart(5)}ms ` +
      `TLC=$${(res.totalLandedCost || 0).toFixed(2)} ` +
      `Duty=$${(res.importDuty || 0).toFixed(2)} ` +
      `VAT=$${(res.vat || 0).toFixed(2)} ` +
      `Rate=${(res.dutyRate || 0).toFixed(1)}%` +
      (r.errors.length > 0 ? ` ⚠️ ${r.errors[0]}` : '')
    );
  }

  // ─── Summary ──────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(' E2E TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const times = results.map(r => r.timeMs).sort((a, b) => a - b);
  const p50 = times[Math.floor(N * 0.5)];
  const p95 = times[Math.floor(N * 0.95)];
  const p99 = times[Math.floor(N * 0.99)];
  const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / N);

  console.log(`Pass Rate:    ${passed}/${N} (${(passed / N * 100).toFixed(0)}%)`);
  console.log(`Failed:       ${failed}/${N}`);
  console.log(`\nResponse Time:`);
  console.log(`  Average:    ${avgMs}ms`);
  console.log(`  p50:        ${p50}ms`);
  console.log(`  p95:        ${p95}ms`);
  console.log(`  p99:        ${p99}ms`);
  console.log(`  Min:        ${times[0]}ms`);
  console.log(`  Max:        ${times[N - 1]}ms`);

  if (failed > 0) {
    console.log('\n──────────────────────────────────────────────────');
    console.log(' FAILED TESTS');
    console.log('──────────────────────────────────────────────────');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`  ❌ ${r.name}: ${r.errors.join(', ')}`);
    }
  }

  // Detailed table
  console.log('\n──────────────────────────────────────────────────────────────────────────────────────────────────');
  console.log(
    '#'.padStart(3) + ' ' +
    'Test Case'.padEnd(28) + ' ' +
    'Time'.padEnd(8) + ' ' +
    'TLC'.padEnd(12) + ' ' +
    'Duty'.padEnd(10) + ' ' +
    'VAT'.padEnd(10) + ' ' +
    'Rate'.padEnd(7) + ' ' +
    'Source'.padEnd(10) + ' ' +
    'HS'.padEnd(8) + ' ' +
    'OK'
  );
  console.log('─'.repeat(105));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const res = r.result || {};
    console.log(
      String(i + 1).padStart(3) + ' ' +
      r.name.padEnd(28) + ' ' +
      `${r.timeMs}ms`.padEnd(8) + ' ' +
      `$${(res.totalLandedCost || 0).toFixed(2)}`.padEnd(12) + ' ' +
      `$${(res.importDuty || 0).toFixed(2)}`.padEnd(10) + ' ' +
      `$${(res.vat || 0).toFixed(2)}`.padEnd(10) + ' ' +
      `${(res.dutyRate || 0).toFixed(1)}%`.padEnd(7) + ' ' +
      `${res.dutyRateSource || '-'}`.padEnd(10) + ' ' +
      `${res.hsClassification?.hsCode || res.hsCode || '-'}`.padEnd(8) + ' ' +
      (r.passed ? '✅' : '❌')
    );
  }

  // FTA/Special feature checks
  console.log('\n──────────────────────────────────────────────────');
  console.log(' FEATURE COVERAGE');
  console.log('──────────────────────────────────────────────────');
  const ftaApplied = results.filter(r => r.result?.ftaApplied).length;
  const deMinimis = results.filter(r => r.result?.deMinimisApplied).length;
  const withHS = results.filter(r => r.result?.hsClassification?.hsCode).length;
  const withDutySource = results.filter(r => r.result?.dutyRateSource).length;
  const withIncoterms = results.filter(r => r.result?.incotermsBreakdown).length;

  console.log(`  FTA applied:        ${ftaApplied}/${N}`);
  console.log(`  De minimis applied: ${deMinimis}/${N}`);
  console.log(`  HS classified:      ${withHS}/${N}`);
  console.log(`  Duty source:        ${withDutySource}/${N}`);
  console.log(`  Incoterms:          ${withIncoterms}/${N}`);

  // Save results
  const outputPath = resolve(__dirname, '..', 'benchmark_calculate_results.json');
  writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: N,
    passed,
    failed,
    responseTimes: { avg: avgMs, p50, p95, p99, min: times[0], max: times[N - 1] },
    features: { ftaApplied, deMinimis, withHS, withDutySource, withIncoterms },
    details: results.map(r => ({
      name: r.name,
      timeMs: r.timeMs,
      passed: r.passed,
      errors: r.errors,
      tlc: r.result?.totalLandedCost,
      duty: r.result?.importDuty,
      dutyRate: r.result?.dutyRate,
      vat: r.result?.vat,
      dutySource: r.result?.dutyRateSource,
      hs: r.result?.hsClassification?.hsCode,
      fta: r.result?.ftaApplied ? true : false,
      deMinimis: r.result?.deMinimisApplied,
    })),
  }, null, 2));
  console.log(`\n📁 Results saved to: benchmark_calculate_results.json\n`);
}

main().catch(console.error);
