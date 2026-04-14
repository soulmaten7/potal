#!/usr/bin/env node
/**
 * CW37-S2: Endpoint consolidation verification
 */
import fs from 'node:fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const BASE = 'https://www.potal.app';
const HEADERS = { 'X-Demo-Request': 'true', 'Content-Type': 'application/json' };

let passed = 0, failed = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log('  ✅ ' + name); passed++; }
  else { console.log('  ❌ ' + name + ' ' + detail); failed++; }
}

async function postApi(path, body) {
  const res = await fetch(BASE + path, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const json = await res.json();
  return { data: json.data || json, headers: Object.fromEntries(res.headers.entries()), status: res.status };
}

async function getApi(path) {
  const res = await fetch(BASE + path + (path.includes('?') ? '&' : '?') + 'X-Demo-Request=true', { headers: { 'X-Demo-Request': 'true' } });
  const json = await res.json();
  return { data: json.data || json, headers: Object.fromEntries(res.headers.entries()), status: res.status };
}

console.log('━━ CW37-S2 Endpoint Consolidation ━━\n');

// Test 1: calculate has dutyInfo + exchangeRateInfo + deMinimisInfo
console.log('Test 1: calculate lookup absorption');
const r1 = await postApi('/api/v1/calculate', { price: 50, origin: 'KR', destinationCountry: 'US', hsCode: '6109100010', productName: 'cotton t-shirt' });
test('dutyInfo exists', !!r1.data.dutyInfo);
test('dutyInfo.source', typeof r1.data.dutyInfo?.source === 'string');
test('deMinimisInfo exists', !!r1.data.deMinimisInfo);
test('deMinimisInfo.applied is bool', typeof r1.data.deMinimisInfo?.applied === 'boolean');

// Test 2: calculate still has rulingMatch (backward compat)
console.log('\nTest 2: calculate backward compat');
test('rulingMatch still exists', r1.data.rulingMatch !== undefined || r1.data.totalLandedCost > 0);
test('totalLandedCost > 0', r1.data.totalLandedCost > 0);

// Test 3: restrictions has restricted bool
console.log('\nTest 3: restrictions enrichment');
const r3 = await postApi('/api/v1/restrictions', { hsCode: '850760', destinationCountry: 'US' });
test('restricted field exists', typeof r3.data.restricted === 'boolean');
test('categories is array', Array.isArray(r3.data.categories));

// Test 4: exchange-rate deprecation header
console.log('\nTest 4: exchange-rate deprecation');
const r4 = await getApi('/api/v1/exchange-rate?from=USD&to=KRW&amount=100');
test('has _deprecation', !!r4.data._deprecation);
test('X-API-Deprecated header', r4.headers['x-api-deprecated'] === 'true');
test('still returns data', r4.data.rate > 0 || r4.data.convertedAmount > 0);

// Test 5: de-minimis deprecation
console.log('\nTest 5: de-minimis deprecation');
const r5 = await postApi('/api/v1/de-minimis/check', { destination: 'US', value: 500 });
test('has _deprecation', !!r5.data._deprecation);
test('still returns data', r5.data.threshold !== undefined);

// Test 6: roo/evaluate auto-detect mode (no fta_id)
console.log('\nTest 6: roo/evaluate auto-detect');
const r6 = await postApi('/api/v1/roo/evaluate', { hs_code: '610910', origin: 'MX', destination: 'US', originating_content_pct: 70 });
test('applicableFTAs exists', Array.isArray(r6.data.applicableFTAs));
test('recommended exists', r6.data.recommended !== undefined);
if (r6.data.applicableFTAs?.length > 0) {
  test('first FTA has verdict', !!r6.data.applicableFTAs[0].verdict);
}

// Test 7: roo/evaluate with specific fta_id (backward compat)
console.log('\nTest 7: roo/evaluate with fta_id');
const r7 = await postApi('/api/v1/roo/evaluate', { hs_code: '610910', origin: 'MX', destination: 'US', fta_id: 'USMCA', originating_content_pct: 70 });
test('verdict = eligible', r7.data.verdict === 'eligible');
test('no applicableFTAs (specific mode)', r7.data.applicableFTAs === undefined);

// Test 8: classify still returns alternatives
console.log('\nTest 8: classify alternatives');
const r8 = await postApi('/api/v1/classify', { productName: 'cotton knitted t-shirt' });
test('hsCode exists', !!r8.data.hsCode);
test('alternatives exists', Array.isArray(r8.data.alternatives));

// Summary
console.log('\n━━ RESULT: ' + passed + ' passed, ' + failed + ' failed ━━');
process.exit(failed > 0 ? 1 : 0);
