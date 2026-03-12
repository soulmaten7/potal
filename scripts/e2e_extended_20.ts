/**
 * POTAL E2E Extended Test — 20 Scenarios + Edge Cases + LLM Fallback Check
 */
import { calculateGlobalLandedCostAsync } from '../app/lib/cost-engine';
import { classifyProductAsync } from '../app/lib/cost-engine';
import type { GlobalCostInput } from '../app/lib/cost-engine/GlobalCostEngine';

interface TestCase {
  id: number;
  category: string;
  name: string;
  input: GlobalCostInput;
  expectedHs4?: string;
  notes?: string;
}

const mainTests: TestCase[] = [
  // 의류
  { id: 1, category: '의류', name: 'Cotton T-Shirt CN→US', input: { productName: 'Cotton T-Shirt', origin: 'CN', destinationCountry: 'US', price: 25, shippingPrice: 5 }, expectedHs4: '6109' },
  { id: 2, category: '의류', name: 'Silk Dress IT→JP', input: { productName: 'Silk Dress', origin: 'IT', destinationCountry: 'JP', price: 350, shippingPrice: 15 }, expectedHs4: '6204' },
  { id: 3, category: '의류', name: 'Winter Jacket BD→DE', input: { productName: 'Winter Jacket', origin: 'BD', destinationCountry: 'DE', price: 120, shippingPrice: 18 }, expectedHs4: '6201' },
  // 전자
  { id: 4, category: '전자', name: 'Laptop CN→DE', input: { productName: 'Laptop Computer', origin: 'CN', destinationCountry: 'DE', price: 999, shippingPrice: 20 }, expectedHs4: '8471' },
  { id: 5, category: '전자', name: 'Wireless Headphones CN→AU', input: { productName: 'Wireless Headphones', origin: 'CN', destinationCountry: 'AU', price: 150, shippingPrice: 12 }, expectedHs4: '8518' },
  { id: 6, category: '전자', name: 'Smartphone KR→US', input: { productName: 'Smartphone', origin: 'KR', destinationCountry: 'US', price: 800, shippingPrice: 15 }, expectedHs4: '8517' },
  // 신발
  { id: 7, category: '신발', name: 'Running Shoes VN→JP', input: { productName: 'Running Shoes', origin: 'VN', destinationCountry: 'JP', price: 80, shippingPrice: 10 }, expectedHs4: '6404' },
  { id: 8, category: '신발', name: 'Leather Boots IT→KR', input: { productName: 'Leather Boots', origin: 'IT', destinationCountry: 'KR', price: 280, shippingPrice: 20 }, expectedHs4: '6403' },
  { id: 9, category: '신발', name: 'Sneakers CN→GB', input: { productName: 'Sneakers', origin: 'CN', destinationCountry: 'GB', price: 65, shippingPrice: 10 }, expectedHs4: '6404' },
  // 가방
  { id: 10, category: '가방', name: 'Leather Handbag IT→KR', input: { productName: 'Leather Handbag', origin: 'IT', destinationCountry: 'KR', price: 500, shippingPrice: 15 }, expectedHs4: '4202' },
  { id: 11, category: '가방', name: 'Canvas Backpack CN→CA', input: { productName: 'Canvas Backpack', origin: 'CN', destinationCountry: 'CA', price: 45, shippingPrice: 8 }, expectedHs4: '4202' },
  // 식품
  { id: 12, category: '식품', name: 'Green Tea JP→US', input: { productName: 'Green Tea', origin: 'JP', destinationCountry: 'US', price: 30, shippingPrice: 8 }, expectedHs4: '0902' },
  { id: 13, category: '식품', name: 'Chocolate BE→AU', input: { productName: 'Chocolate', origin: 'BE', destinationCountry: 'AU', price: 25, shippingPrice: 10 }, expectedHs4: '1806' },
  { id: 14, category: '식품', name: 'Olive Oil ES→BR', input: { productName: 'Olive Oil', origin: 'ES', destinationCountry: 'BR', price: 40, shippingPrice: 12 }, expectedHs4: '1509' },
  // 화장품
  { id: 15, category: '화장품', name: 'Skincare Set KR→US', input: { productName: 'Skincare Set', origin: 'KR', destinationCountry: 'US', price: 60, shippingPrice: 8 }, expectedHs4: '3304' },
  { id: 16, category: '화장품', name: 'Perfume FR→JP', input: { productName: 'Perfume', origin: 'FR', destinationCountry: 'JP', price: 120, shippingPrice: 10 }, expectedHs4: '3303' },
  // 산업재
  { id: 17, category: '산업재', name: 'Steel Pipe CN→US (AD)', input: { productName: 'Steel Pipe', origin: 'CN', destinationCountry: 'US', price: 200, shippingPrice: 50 }, expectedHs4: '7304', notes: 'AD/CVD 대상' },
  { id: 18, category: '산업재', name: 'Solar Panel CN→DE', input: { productName: 'Solar Panel', origin: 'CN', destinationCountry: 'DE', price: 500, shippingPrice: 40 }, expectedHs4: '8541' },
  // 고가품
  { id: 19, category: '고가품', name: 'Diamond Ring IN→US', input: { productName: 'Diamond Ring', origin: 'IN', destinationCountry: 'US', price: 5000, shippingPrice: 30 }, expectedHs4: '7113' },
  { id: 20, category: '고가품', name: 'Swiss Watch CH→KR', input: { productName: 'Swiss Watch', origin: 'CH', destinationCountry: 'KR', price: 3000, shippingPrice: 25 }, expectedHs4: '9101' },
];

const edgeCases: TestCase[] = [
  { id: 21, category: 'Edge', name: 'Phone Case CN→US $3 (de minimis)', input: { productName: 'Phone Case', origin: 'CN', destinationCountry: 'US', price: 3, shippingPrice: 2 }, notes: 'de minimis $800' },
  { id: 22, category: 'Edge', name: 'Same country CN→CN', input: { productName: 'Cotton T-Shirt', origin: 'CN', destinationCountry: 'CN', price: 25, shippingPrice: 5 }, notes: 'domestic' },
  { id: 23, category: 'Edge', name: '$50K Watch CN→US', input: { productName: 'Luxury Watch', origin: 'CN', destinationCountry: 'US', price: 50000, shippingPrice: 50 }, notes: 'high value formal entry' },
  { id: 24, category: 'Edge', name: '$0.50 Sticker CN→US', input: { productName: 'Sticker', origin: 'CN', destinationCountry: 'US', price: 0.50, shippingPrice: 1 }, notes: 'ultra low value' },
  { id: 25, category: 'Edge', name: "Special chars product", input: { productName: "Men's 100% Organic Cotton T-Shirt (XL)", origin: 'CN', destinationCountry: 'US', price: 35, shippingPrice: 5 }, notes: 'special chars' },
  { id: 26, category: 'Edge', name: 'Very long product name', input: { productName: 'Premium High-Quality Handmade Italian Genuine Full-Grain Leather Executive Business Travel Briefcase Laptop Bag with Multiple Compartments and Shoulder Strap', origin: 'IT', destinationCountry: 'US', price: 400, shippingPrice: 25 }, notes: 'long name' },
];

interface Result {
  id: number;
  category: string;
  name: string;
  status: string;
  elapsed: number;
  hsCode: string;
  hsMethod: string;
  hsConf: number;
  duty: string;
  tax: string;
  total: number;
  fta: string;
  incoterms: string;
  issues: string[];
  notes: string;
}

async function runCalcTest(tc: TestCase): Promise<Result> {
  const start = Date.now();
  try {
    const r = await calculateGlobalLandedCostAsync(tc.input);
    const elapsed = Date.now() - start;

    const hs = r.hsClassification?.hsCode || 'N/A';
    const hsMethod = r.hsClassification?.method || r.classificationSource || 'unknown';
    const hsConf = r.hsClassification?.confidence || 0;

    // Extract duty from breakdown
    const dutyItem = (r.breakdown as any[])?.find((b: any) => b.label?.toLowerCase().includes('duty'));
    const dutyStr = dutyItem ? `$${dutyItem.amount} (${dutyItem.note || ''})` : `$${r.importDuty ?? 0}`;

    // Extract tax from breakdown
    const taxItem = (r.breakdown as any[])?.find((b: any) =>
      b.label?.toLowerCase().includes('tax') || b.label?.toLowerCase().includes('vat') ||
      b.label?.toLowerCase().includes('gst') || b.label?.toLowerCase().includes('jct')
    );
    const taxStr = taxItem ? `$${taxItem.amount} (${taxItem.note || ''})` : `$${r.vat ?? r.salesTax ?? 0}`;

    const ftaName = r.ftaApplied?.ftaName || r.ftaApplied?.ftaCode || (r.ftaApplied?.hasFta ? 'Yes' : 'None');
    const total = r.totalLandedCost ?? 0;

    // Validation
    const issues: string[] = [];
    const inputTotal = (tc.input.price as number) + (tc.input.shippingPrice || 0);

    // HS4 check
    if (tc.expectedHs4 && hs !== 'N/A') {
      const hs4 = hs.substring(0, 4);
      if (hs4 !== tc.expectedHs4) {
        issues.push(`HS4: ${hs4}≠${tc.expectedHs4}`);
      }
    }

    // Total sanity
    if (total < inputTotal * 0.99 && tc.input.destinationCountry !== (tc.input.origin || 'CN')) {
      issues.push(`Total $${total} < input $${inputTotal}`);
    }

    // Breakdown sum check
    if (r.breakdown && Array.isArray(r.breakdown)) {
      const breakdownSum = (r.breakdown as any[]).reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
      if (Math.abs(total - breakdownSum) > 0.02) {
        issues.push(`Sum mismatch: total=$${total} vs breakdown=$${breakdownSum.toFixed(2)}`);
      }
    }

    return {
      id: tc.id, category: tc.category, name: tc.name, status: issues.length === 0 ? '✅' : '⚠️',
      elapsed, hsCode: hs, hsMethod, hsConf, duty: dutyStr, tax: taxStr, total,
      fta: ftaName, incoterms: r.incotermsBreakdown?.term || 'N/A',
      issues, notes: tc.notes || '',
    };
  } catch (err: any) {
    return {
      id: tc.id, category: tc.category, name: tc.name, status: '❌',
      elapsed: Date.now() - start, hsCode: 'ERR', hsMethod: '-', hsConf: 0,
      duty: '-', tax: '-', total: 0, fta: '-', incoterms: '-',
      issues: [err.message.substring(0, 80)], notes: tc.notes || '',
    };
  }
}

async function testClassifyLLM() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PART 3: LLM FALLBACK VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const products = [
    // Previously misclassified by keyword
    { name: 'Cotton T-Shirt', expected: '6109' },
    { name: 'Running Shoes', expected: '6404' },
    { name: 'Leather Handbag', expected: '4202' },
    // Additional hard-to-classify items
    { name: 'Silk Dress', expected: '6204' },
    { name: 'Swiss Watch', expected: '9101' },
    { name: 'Diamond Ring', expected: '7113' },
    { name: 'Solar Panel', expected: '8541' },
    { name: 'Skincare Set', expected: '3304' },
    { name: "Men's 100% Organic Cotton T-Shirt (XL)", expected: '6109' },
    { name: 'Premium High-Quality Italian Leather Briefcase', expected: '4202' },
  ];

  console.log('| # | Product | HS Code | HS4 | Expected | Match | Method | Confidence | Time |');
  console.log('|---|---------|---------|-----|----------|-------|--------|------------|------|');

  let correct = 0;
  let llmUsed = 0;
  let vectorUsed = 0;
  let keywordUsed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const start = Date.now();
    try {
      const r = await classifyProductAsync(p.name);
      const elapsed = Date.now() - start;
      const hs4 = r.hsCode.substring(0, 4);
      const match = hs4 === p.expected ? '✅' : '❌';
      if (hs4 === p.expected) correct++;

      const source = (r as any).classificationSource || r.method;
      if (source === 'ai' || source === 'llm') llmUsed++;
      else if (source === 'vector') vectorUsed++;
      else if (source.includes('keyword')) keywordUsed++;

      console.log(`| ${i+1} | ${p.name.substring(0,40)} | ${r.hsCode} | ${hs4} | ${p.expected} | ${match} | ${source} | ${(r.confidence*100).toFixed(0)}% | ${elapsed}ms |`);
    } catch (e: any) {
      console.log(`| ${i+1} | ${p.name.substring(0,40)} | ERR | - | ${p.expected} | ❌ | error | - | - |`);
    }
  }

  console.log(`\nClassification Summary: ${correct}/${products.length} correct (${(correct/products.length*100).toFixed(0)}%)`);
  console.log(`  LLM: ${llmUsed} | Vector: ${vectorUsed} | Keyword: ${keywordUsed}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  POTAL E2E Extended Test — 26 Scenarios');
  console.log('  ' + new Date().toISOString());
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Part 1: Main 20 tests
  console.log('━━━ PART 1: Calculate API — 20 Core Scenarios ━━━\n');
  const results: Result[] = [];
  for (const tc of mainTests) {
    process.stdout.write(`  [${tc.id}/20] ${tc.name} ... `);
    const r = await runCalcTest(tc);
    console.log(`${r.status} ${r.hsMethod} ${r.elapsed}ms`);
    results.push(r);
  }

  // Part 2: Edge cases
  console.log('\n━━━ PART 2: Edge Cases — 6 Scenarios ━━━\n');
  for (const tc of edgeCases) {
    process.stdout.write(`  [${tc.id}] ${tc.name} ... `);
    const r = await runCalcTest(tc);
    console.log(`${r.status} ${r.elapsed}ms`);
    results.push(r);
  }

  // Summary tables
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PART 1+2 RESULTS TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('| # | Category | Scenario | St | HS | Method | Duty | Tax | Total | FTA | Inco | ms |');
  console.log('|---|----------|----------|----|----|--------|------|-----|-------|-----|------|----|');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.category} | ${r.name.substring(0,30)} | ${r.status} | ${r.hsCode} | ${r.hsMethod} | ${r.duty.substring(0,20)} | ${r.tax.substring(0,18)} | $${r.total.toFixed(2)} | ${(r.fta as string).substring(0,12)} | ${r.incoterms} | ${r.elapsed} |`);
  }

  // Issues
  const withIssues = results.filter(r => r.issues.length > 0);
  if (withIssues.length > 0) {
    console.log('\n⚠️ Issues:');
    withIssues.forEach(r => {
      console.log(`  #${r.id} ${r.name}: ${r.issues.join(', ')}`);
    });
  }

  // Stats
  const passed = results.filter(r => r.status === '✅').length;
  const warned = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;
  const avgTime = Math.round(results.reduce((a, r) => a + r.elapsed, 0) / results.length);

  const methodCounts: Record<string, number> = {};
  results.forEach(r => { methodCounts[r.hsMethod] = (methodCounts[r.hsMethod] || 0) + 1; });

  console.log(`\n━━━ STATS ━━━`);
  console.log(`  Results: ${passed}✅ ${warned}⚠️ ${failed}❌ / ${results.length}`);
  console.log(`  Avg response: ${avgTime}ms`);
  console.log(`  Classification methods: ${Object.entries(methodCounts).map(([k,v]) => `${k}=${v}`).join(', ')}`);

  // Part 3: LLM fallback
  await testClassifyLLM();

  // Overall
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
