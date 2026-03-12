/**
 * Task 1: 14 Keyword Classifier Edge Case Tests
 * 10 material+product combos + 4 ambiguous single keywords
 */

import { classifyProduct } from '../app/lib/cost-engine/hs-code/classifier';

interface TestCase {
  input: string;
  acceptableHs4: string[]; // Accept multiple valid HS4 codes
  expectedMaxConf?: number;
  description: string;
}

const materialProductCombos: TestCase[] = [
  { input: 'Leather Wallet', acceptableHs4: ['4202'], description: 'leather+wallet → leather goods' },
  { input: 'Cotton T-Shirt', acceptableHs4: ['6109'], description: 'cotton+tshirt → knitted apparel' },
  { input: 'Silk Dress', acceptableHs4: ['6204', '6208', '6104'], description: 'silk+dress → women apparel (Ch61/62)' },
  { input: 'Wooden Chair', acceptableHs4: ['9401', '9403'], description: 'wood+chair → furniture' },
  { input: 'Steel Pipe', acceptableHs4: ['7303', '7304', '7305', '7306'], description: 'steel+pipe → iron/steel tubes' },
  { input: 'Rubber Boots', acceptableHs4: ['6401', '6402'], description: 'rubber+boots → footwear' },
  { input: 'Plastic Toy', acceptableHs4: ['9503'], description: 'plastic+toy → toys' },
  { input: 'Glass Vase', acceptableHs4: ['7013', '7017', '7019'], description: 'glass+vase → glassware' },
  { input: 'Gold Necklace', acceptableHs4: ['7113'], description: 'gold+necklace → jewelry' },
  { input: 'Canvas Backpack', acceptableHs4: ['4202'], description: 'canvas+backpack → bags' },
];

const ambiguousSingleKeywords: TestCase[] = [
  { input: 'cotton', acceptableHs4: ['ANY'], expectedMaxConf: 0.59, description: 'material-only → low confidence' },
  { input: 'leather', acceptableHs4: ['ANY'], expectedMaxConf: 0.59, description: 'material-only → low confidence' },
  { input: 'steel', acceptableHs4: ['ANY'], expectedMaxConf: 0.59, description: 'material-only → low confidence' },
  { input: 'glass', acceptableHs4: ['ANY'], expectedMaxConf: 0.59, description: 'material-only → low confidence' },
];

function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Task 1: Keyword Classifier Edge Case Tests (14 cases)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;
  const results: { input: string; hs: string; hs4: string; conf: number; status: string; expected: string; issue: string }[] = [];

  // Test material+product combos
  console.log('── Material + Product Combos (10) ──\n');
  for (const tc of materialProductCombos) {
    const result = classifyProduct(tc.input);
    const hs4 = result.hsCode.slice(0, 4);
    const ok = tc.acceptableHs4.includes(hs4);
    const status = ok ? '✅' : '❌';
    if (ok) passed++; else failed++;

    results.push({
      input: tc.input,
      hs: result.hsCode,
      hs4,
      conf: result.confidence,
      status,
      expected: tc.acceptableHs4.join('/'),
      issue: ok ? '' : `Got ${hs4}, expected ${tc.acceptableHs4.join('/')}`,
    });

    console.log(`${status} ${tc.input.padEnd(20)} → ${result.hsCode} (conf: ${result.confidence.toFixed(2)}) ${ok ? '' : `❌ expected ${tc.acceptableHs4.join('/')}`}`);
  }

  // Test ambiguous single keywords
  console.log('\n── Ambiguous Single Keywords (4) ──\n');
  for (const tc of ambiguousSingleKeywords) {
    const result = classifyProduct(tc.input);
    const hs4 = result.hsCode.slice(0, 4);
    const confOk = tc.expectedMaxConf !== undefined ? result.confidence <= tc.expectedMaxConf : true;
    const status = confOk ? '✅' : '❌';
    if (confOk) passed++; else failed++;

    results.push({
      input: tc.input,
      hs: result.hsCode,
      hs4,
      conf: result.confidence,
      status,
      expected: `conf ≤ ${tc.expectedMaxConf}`,
      issue: confOk ? '' : `Conf ${result.confidence} > ${tc.expectedMaxConf} (should go to LLM)`,
    });

    console.log(`${status} "${tc.input}" → ${result.hsCode} (conf: ${result.confidence.toFixed(2)}) ${confOk ? '→ LLM fallback ✓' : `❌ conf too high (${result.confidence} > ${tc.expectedMaxConf})`}`);
  }

  // Summary table
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESULTS TABLE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('| # | Input | HS Code | HS4 | Conf | Expected | Status | Issue |');
  console.log('|---|-------|---------|-----|------|----------|--------|-------|');
  results.forEach((r, i) => {
    console.log(`| ${(i+1).toString().padStart(2)} | ${r.input.padEnd(20)} | ${r.hs} | ${r.hs4} | ${r.conf.toFixed(2)} | ${r.expected.padEnd(16)} | ${r.status} | ${r.issue} |`);
  });

  console.log(`\n✅ Passed: ${passed}/14  ❌ Failed: ${failed}/14`);
  return { passed, failed, results };
}

const { passed, failed } = runTests();
process.exit(failed > 0 ? 1 : 0);
