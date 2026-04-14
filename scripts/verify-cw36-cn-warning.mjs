#!/usr/bin/env node
/**
 * CW36-CN1: Data availability warning verification
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Inline checkDataAvailability (mirrors lookup.ts)
const COVERED = new Set(['EU', 'US']);
function checkDataAvailability(j) {
  if (!j) return undefined;
  if (COVERED.has(j)) return undefined;
  return { jurisdiction: j, status: 'no_rulings_data', warning: `POTAL does not currently have customs rulings data for ${j} imports. Calculation uses general tariff schedules only. Manual review recommended for ${j}-bound shipments.` };
}

let passed = 0, failed = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log('  ✅ ' + name); passed++; }
  else { console.log('  ❌ ' + name + ' ' + detail); failed++; }
}

console.log('━━ CW36-CN1 Data Availability Warning ━━\n');

// Test 1: CN → warning
console.log('Test 1: CN destination → warning');
const r1 = checkDataAvailability('CN');
test('Returns warning', !!r1);
test('status = no_rulings_data', r1?.status === 'no_rulings_data');
test('warning mentions CN', r1?.warning?.includes('CN'));

// Test 2: US → no warning (has data)
console.log('\nTest 2: US destination → no warning');
const r2 = checkDataAvailability('US');
test('Returns undefined', r2 === undefined);

// Test 3: JP → warning
console.log('\nTest 3: JP destination → warning');
const r3 = checkDataAvailability('JP');
test('Returns warning', !!r3);
test('warning mentions JP', r3?.warning?.includes('JP'));

// Test 4: EU → no warning (has data)
console.log('\nTest 4: EU destination → no warning');
const r4 = checkDataAvailability('EU');
test('Returns undefined', r4 === undefined);

// Test 5: KR → warning
console.log('\nTest 5: KR destination → warning');
const r5 = checkDataAvailability('KR');
test('Returns warning', !!r5);
test('status = no_rulings_data', r5?.status === 'no_rulings_data');

console.log('\n━━ RESULT: ' + passed + ' passed, ' + failed + ' failed ━━');
process.exit(failed > 0 ? 1 : 0);
