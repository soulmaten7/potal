#!/usr/bin/env node
/**
 * CW34-S4.5 FTA Eligibility 10-Field — 10 test cases
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { evaluateRoO } = require('../app/lib/trade/roo-engine');

let passed = 0, failed = 0;
function test(name, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name} ${detail}`); failed++; }
}

console.log('━━ CW34-S4.5 FTA Eligibility Verification ━━\n');

// Test 1: KR→US with USMCA specified — KR not USMCA member, auto-detects KORUS
console.log('Test 1: KR→US ftaId=USMCA (auto-detects KORUS instead)');
const r1 = evaluateRoO({ hs6: '610910', origin: 'KR', destination: 'US', ftaId: 'USMCA', originatingContentPct: 70 });
test('eligible via KORUS auto-detect', r1.verdict === 'eligible', `got ${r1.verdict}`);
test('details mentions KORUS', r1.details.includes('KORUS'), `got: ${r1.details.slice(0,80)}`);

// Test 2: USMCA MX→US + RVC 70% → eligible
console.log('\nTest 2: USMCA MX→US RVC 70%');
const r2 = evaluateRoO({ hs6: '610910', origin: 'MX', destination: 'US', ftaId: 'USMCA', originatingContentPct: 70, productValue: 100 });
test('verdict = eligible', r2.verdict === 'eligible', `got ${r2.verdict}`);
test('RVC in criteriaMetList', r2.criteriaMetList.includes('RVC'));

// Test 3: USMCA MX→US + RVC 30% → ineligible (textile needs 65%)
console.log('\nTest 3: USMCA MX→US RVC 30% (below 65% textile threshold)');
const r3 = evaluateRoO({ hs6: '610910', origin: 'MX', destination: 'US', ftaId: 'USMCA', originatingContentPct: 30, productValue: 100 });
test('verdict = ineligible', r3.verdict === 'ineligible', `got ${r3.verdict}`);
test('RVC in criteriaFailed', r3.criteriaFailed.includes('RVC'));
test('requiredRvc = 65', r3.requiredRvc === 65, `got ${r3.requiredRvc}`);

// Test 4: KORUS KR→US + RVC 40% → eligible (KORUS default 35%)
console.log('\nTest 4: KORUS KR→US RVC 40%');
const r4 = evaluateRoO({ hs6: '850760', origin: 'KR', destination: 'US', ftaId: 'KORUS', originatingContentPct: 40, productValue: 500 });
test('verdict = eligible', r4.verdict === 'eligible', `got ${r4.verdict}`);
test('requiredRvc = 35', r4.requiredRvc === 35, `got ${r4.requiredRvc}`);

// Test 5: RCEP VN→JP + RVC 45% → eligible (RCEP default 40%)
console.log('\nTest 5: RCEP VN→JP RVC 45%');
const r5 = evaluateRoO({ hs6: '610910', origin: 'VN', destination: 'JP', ftaId: 'RCEP', originatingContentPct: 45, productValue: 200 });
test('verdict = eligible', r5.verdict === 'eligible', `got ${r5.verdict}`);

// Test 6: No FTA between BR→US → ineligible
console.log('\nTest 6: No FTA BR→US');
const r6 = evaluateRoO({ hs6: '610910', origin: 'BR', destination: 'US' });
test('verdict = ineligible', r6.verdict === 'ineligible', `got ${r6.verdict}`);
test('details mentions no FTA', r6.details.includes('No active FTA'));

// Test 7: indeterminate — no productValue, no materials, no originatingContentPct
console.log('\nTest 7: Indeterminate (no data)');
const r7 = evaluateRoO({ hs6: '610910', origin: 'MX', destination: 'US', ftaId: 'USMCA' });
test('verdict = indeterminate', r7.verdict === 'indeterminate', `got ${r7.verdict}`);
test('warnings include insufficient data', r7.warnings.some(w => w.includes('Insufficient')));

// Test 8: 10-field evidence in result
console.log('\nTest 8: 10-field evidence');
const r8 = evaluateRoO({ hs6: '610910', origin: 'MX', destination: 'US', ftaId: 'USMCA', material: 'cotton', productForm: 'knitted', originatingContentPct: 70 });
test('tenFieldEvidence has material', r8.tenFieldEvidence?.material === 'cotton');
test('tenFieldEvidence has productForm', r8.tenFieldEvidence?.productForm === 'knitted');
test('tenFieldEvidence has originatingContentPct', r8.tenFieldEvidence?.originatingContentPct === 70);

// Test 9: CPTPP AU→JP + WO chapter 01 → eligible
console.log('\nTest 9: CPTPP AU→JP WO (chapter 01)');
const r9 = evaluateRoO({ hs6: '010110', origin: 'AU', destination: 'JP', ftaId: 'CPTPP' });
test('WO in criteriaMetList', r9.criteriaMetList.includes('WO'));
test('verdict = eligible', r9.verdict === 'eligible', `got ${r9.verdict}`);

// Test 10: Chapter-specific RVC — automotive ch87 USMCA needs 75%
console.log('\nTest 10: USMCA automotive ch87 RVC 60% (needs 75%)');
const r10 = evaluateRoO({ hs6: '870321', origin: 'MX', destination: 'US', ftaId: 'USMCA', originatingContentPct: 60, productValue: 30000 });
test('verdict = ineligible', r10.verdict === 'ineligible', `got ${r10.verdict}`);
test('requiredRvc = 75', r10.requiredRvc === 75, `got ${r10.requiredRvc}`);
test('rvcPercentage = 60', r10.rvcPercentage === 60, `got ${r10.rvcPercentage}`);

// Summary
console.log(`\n━━ RESULT: ${passed} passed, ${failed} failed ━━`);
process.exit(failed > 0 ? 1 : 0);
