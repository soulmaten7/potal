#!/usr/bin/env node
/**
 * CW37-S6: LLM-friendly schema verification
 * Tests _metadata presence across all 5 key APIs
 */
const BASE = 'https://www.potal.app';
const H = { 'X-Demo-Request': 'true', 'Content-Type': 'application/json' };

let passed = 0, failed = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log('  ✅ ' + name); passed++; }
  else { console.log('  ❌ ' + name + ' ' + detail); failed++; }
}

async function post(path, body) {
  const res = await fetch(BASE + path, { method: 'POST', headers: H, body: JSON.stringify(body) });
  return (await res.json()).data || {};
}

console.log('━━ CW37-S6 LLM-Friendly Schema ━━\n');

// Test 1-3: calculate
console.log('Test 1-3: calculate _metadata');
const r1 = await post('/api/v1/calculate', { price: 50, origin: 'KR', destinationCountry: 'US', hsCode: '6109100010' });
test('_metadata exists', !!r1._metadata);
test('disclaimer present', r1._metadata?.disclaimer?.length > 20);
test('availableEnums.dutyRateSource', Array.isArray(r1._metadata?.availableEnums?.dutyRateSource));

// Test 4-5: classify
console.log('\nTest 4-5: classify _metadata');
const r2 = await post('/api/v1/classify', { productName: 'cotton t-shirt' });
test('_metadata exists', !!r2._metadata);
test('availableEnums.classificationMethod', Array.isArray(r2._metadata?.availableEnums?.classificationMethod));

// Test 6-7: restrictions
console.log('\nTest 6-7: restrictions _metadata');
const r3 = await post('/api/v1/restrictions', { hsCode: '850760', destinationCountry: 'US' });
test('_metadata exists', !!r3._metadata);
test('availableEnums.restrictionType', Array.isArray(r3._metadata?.availableEnums?.restrictionType));

// Test 8-9: roo/evaluate
console.log('\nTest 8-9: roo/evaluate _metadata');
const r4 = await post('/api/v1/roo/evaluate', { hs_code: '610910', origin: 'MX', destination: 'US', originating_content_pct: 70 });
test('_metadata exists', !!r4._metadata);
test('availableEnums.verdict', Array.isArray(r4._metadata?.availableEnums?.verdict));

// Test 10: screen-parties (already had disclaimer)
console.log('\nTest 10: screen-parties disclaimer');
const r5 = await post('/api/v1/screen-parties', { name: 'Test Corp' });
test('disclaimer field', typeof r5.disclaimer === 'string');

console.log('\n━━ RESULT: ' + passed + ' passed, ' + failed + ' failed ━━');
process.exit(failed > 0 ? 1 : 0);
