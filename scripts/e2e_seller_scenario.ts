/**
 * POTAL E2E Seller Scenario Test
 *
 * Simulates real customer flows by calling calculateGlobalLandedCostAsync directly.
 * Tests 5 diverse product/country combinations + accuracy verification.
 */

import { calculateGlobalLandedCostAsync } from '../app/lib/cost-engine';
import type { GlobalCostInput } from '../app/lib/cost-engine/GlobalCostEngine';

interface TestCase {
  name: string;
  input: GlobalCostInput;
  expectedHs4?: string; // Expected HS4 prefix
  expectedMinDuty?: number; // Minimum expected duty %
  expectedMaxDuty?: number; // Maximum expected duty %
}

const testCases: TestCase[] = [
  {
    name: 'Cotton T-Shirt, CN→US, $25+$5',
    input: { productName: 'Cotton T-Shirt', origin: 'CN', destinationCountry: 'US', price: 25, shippingPrice: 5 },
    expectedHs4: '6109',
    expectedMinDuty: 0,
    expectedMaxDuty: 35,
  },
  {
    name: 'Laptop, CN→DE, $999+$20',
    input: { productName: 'Laptop Computer', origin: 'CN', destinationCountry: 'DE', price: 999, shippingPrice: 20 },
    expectedHs4: '8471',
    expectedMinDuty: 0,
    expectedMaxDuty: 15,
  },
  {
    name: 'Running Shoes, VN→JP, $80+$10',
    input: { productName: 'Running Shoes', origin: 'VN', destinationCountry: 'JP', price: 80, shippingPrice: 10 },
    expectedHs4: '6404',
    expectedMinDuty: 0,
    expectedMaxDuty: 40,
  },
  {
    name: 'Leather Handbag, IT→KR, $500+$15',
    input: { productName: 'Leather Handbag', origin: 'IT', destinationCountry: 'KR', price: 500, shippingPrice: 15 },
    expectedHs4: '4202',
    expectedMinDuty: 0,
    expectedMaxDuty: 20,
  },
  {
    name: 'Electronics (Headphones), CN→AU, $150+$12',
    input: { productName: 'Wireless Headphones', origin: 'CN', destinationCountry: 'AU', price: 150, shippingPrice: 12 },
    expectedHs4: '8518',
    expectedMinDuty: 0,
    expectedMaxDuty: 15,
  },
];

async function runTest(tc: TestCase) {
  const start = Date.now();
  try {
    const result = await calculateGlobalLandedCostAsync(tc.input);
    const elapsed = Date.now() - start;

    // Extract key fields
    const hs = result.hsClassification?.hsCode || result.hsCode || 'N/A';
    const hsConf = result.hsClassification?.confidence || 0;
    const dutyRate = result.breakdown?.dutyRate ?? result.dutyRate ?? 0;
    const dutyAmount = result.breakdown?.dutyAmount ?? result.duty ?? 0;
    const vatRate = result.breakdown?.vatRate ?? result.vatRate ?? 0;
    const vatAmount = result.breakdown?.vatAmount ?? result.vat ?? 0;
    const totalLandedCost = result.totalLandedCost ?? result.total ?? 0;
    const tariffOpt = result.tariffOptimization ? 'Yes' : 'No';
    const incoterms = result.incotermsBreakdown ? 'Yes' : 'No';
    const currency = result.currency || 'USD';

    // Accuracy checks
    const issues: string[] = [];

    // HS code check
    if (tc.expectedHs4 && hs !== 'N/A') {
      const hs4 = hs.substring(0, 4);
      if (hs4 !== tc.expectedHs4) {
        issues.push(`HS4 mismatch: got ${hs4}, expected ${tc.expectedHs4}`);
      }
    }

    // Duty rate range check
    const dutyPct = typeof dutyRate === 'number' ? dutyRate * 100 : parseFloat(String(dutyRate));
    if (tc.expectedMinDuty !== undefined && dutyPct < tc.expectedMinDuty) {
      issues.push(`Duty ${dutyPct}% below min ${tc.expectedMinDuty}%`);
    }
    if (tc.expectedMaxDuty !== undefined && dutyPct > tc.expectedMaxDuty) {
      issues.push(`Duty ${dutyPct}% above max ${tc.expectedMaxDuty}%`);
    }

    // Sanity: total should be >= product price
    const inputTotal = (tc.input.price as number) + (tc.input.shippingPrice || 0);
    if (totalLandedCost < inputTotal * 0.99) {
      issues.push(`Total $${totalLandedCost} < input $${inputTotal}`);
    }

    // Sanity: total = price + shipping + duty + vat + fees (approximately)
    const computedMin = inputTotal + dutyAmount + vatAmount;
    if (totalLandedCost > 0 && computedMin > 0 && Math.abs(totalLandedCost - computedMin) > computedMin * 0.5) {
      issues.push(`Total $${totalLandedCost} far from computed $${computedMin.toFixed(2)}`);
    }

    return {
      name: tc.name,
      status: issues.length === 0 ? '✅' : '⚠️',
      elapsed,
      hs,
      hsConf,
      dutyRate: dutyPct,
      dutyAmount,
      vatRate: typeof vatRate === 'number' ? (vatRate * 100) : parseFloat(String(vatRate)),
      vatAmount,
      totalLandedCost,
      currency,
      tariffOpt,
      incoterms,
      issues,
      raw: result,
    };
  } catch (err: any) {
    return {
      name: tc.name,
      status: '❌',
      elapsed: Date.now() - start,
      hs: 'ERR',
      hsConf: 0,
      dutyRate: 0,
      dutyAmount: 0,
      vatRate: 0,
      vatAmount: 0,
      totalLandedCost: 0,
      currency: 'N/A',
      tariffOpt: 'N/A',
      incoterms: 'N/A',
      issues: [err.message],
      raw: null,
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  POTAL E2E Seller Scenario Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = [];
  for (const tc of testCases) {
    process.stdout.write(`Testing: ${tc.name} ... `);
    const r = await runTest(tc);
    console.log(`${r.status} (${r.elapsed}ms)`);
    results.push(r);
  }

  // Summary table
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('| # | Scenario | Status | Time | HS Code | Duty% | Duty$ | VAT% | VAT$ | Total | TariffOpt | Incoterms |');
  console.log('|---|----------|--------|------|---------|-------|-------|------|------|-------|-----------|-----------|');

  results.forEach((r, i) => {
    console.log(
      `| ${i + 1} | ${r.name} | ${r.status} | ${r.elapsed}ms | ${r.hs} | ${r.dutyRate.toFixed(1)}% | $${r.dutyAmount.toFixed ? r.dutyAmount.toFixed(2) : r.dutyAmount} | ${r.vatRate.toFixed(1)}% | $${r.vatAmount.toFixed ? r.vatAmount.toFixed(2) : r.vatAmount} | $${r.totalLandedCost.toFixed ? r.totalLandedCost.toFixed(2) : r.totalLandedCost} | ${r.tariffOpt} | ${r.incoterms} |`
    );
  });

  // Issues
  const withIssues = results.filter(r => r.issues.length > 0);
  if (withIssues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    withIssues.forEach(r => {
      console.log(`  ${r.name}:`);
      r.issues.forEach(issue => console.log(`    - ${issue}`));
    });
  }

  // Print detailed breakdown for Cotton T-Shirt (accuracy verification)
  const cottonResult = results[0];
  if (cottonResult.raw) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ACCURACY DEEP DIVE: Cotton T-Shirt CN→US');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const r = cottonResult.raw;
    console.log('Full response keys:', Object.keys(r).join(', '));

    if (r.breakdown) {
      console.log('\nBreakdown:');
      Object.entries(r.breakdown).forEach(([k, v]) => {
        console.log(`  ${k}: ${JSON.stringify(v)}`);
      });
    }

    if (r.tariffOptimization) {
      console.log('\nTariff Optimization:');
      console.log(JSON.stringify(r.tariffOptimization, null, 2));
    }

    if (r.incotermsBreakdown) {
      console.log('\nIncoterms:');
      console.log(JSON.stringify(r.incotermsBreakdown, null, 2));
    }

    if (r.hsClassification) {
      console.log('\nHS Classification:');
      console.log(JSON.stringify(r.hsClassification, null, 2));
    }
  }

  // Overall
  const passed = results.filter(r => r.status === '✅').length;
  const warned = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  TOTAL: ${passed} passed, ${warned} warnings, ${failed} failed out of ${results.length}`);
  console.log(`  Average response time: ${Math.round(results.reduce((a, r) => a + r.elapsed, 0) / results.length)}ms`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
