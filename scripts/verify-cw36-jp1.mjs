#!/usr/bin/env node
/**
 * CW36-JP1: JP classification guidance verification
 */
import fs from 'node:fs';

// Load JP rules JSON directly
const rules = JSON.parse(fs.readFileSync('config/jp_classification_rules.json', 'utf-8'));

// Inline JP guidance lookup (mirrors jp-rules-loader.ts)
function lookupJpGuidance(hsCode) {
  const chapter = hsCode.slice(0, 2);
  const ch = rules.chapters[chapter];
  if (!ch) return null;
  const heading = hsCode.slice(0, 4);
  const hs6 = hsCode.slice(0, 6);
  let matched = ch.codes.filter(c => c.hs6 === hs6);
  if (!matched.length) matched = ch.codes.filter(c => c.hs6.startsWith(heading));
  if (!matched.length) matched = ch.codes;
  return { source: 'JP_TARIFF_RULES', chapter, chapterTitle: ch.title, subdivisionAxes: ch.subdivision_axes, matchedCodes: matched.slice(0, 10) };
}

// Inline checkDataAvailability
const COVERED = new Set(['EU', 'US']);
function checkDA(jur, hsCode) {
  if (!jur) return undefined;
  if (COVERED.has(jur)) return undefined;
  if (jur === 'JP' && hsCode) {
    const g = lookupJpGuidance(hsCode);
    if (g) return { jurisdiction: jur, status: 'no_rulings_data_with_classification_guidance', classificationGuidance: g };
  }
  return { jurisdiction: jur, status: 'no_rulings_data' };
}

let passed = 0, failed = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log('  ✅ ' + name); passed++; }
  else { console.log('  ❌ ' + name + ' ' + detail); failed++; }
}

console.log('━━ CW36-JP1 JP Classification Guidance ━━\n');

// Test 1: JP + Chapter 84 (machinery)
console.log('Test 1: JP + HS 8413 (pumps)');
const r1 = checkDA('JP', '841350');
test('status = with_guidance', r1?.status === 'no_rulings_data_with_classification_guidance');
test('has classificationGuidance', !!r1?.classificationGuidance);
test('chapter = 84', r1?.classificationGuidance?.chapter === '84');
test('matchedCodes > 0', r1?.classificationGuidance?.matchedCodes?.length > 0);

// Test 2: JP + Chapter 22 (beverages)
console.log('\nTest 2: JP + HS 2204 (wine)');
const r2 = checkDA('JP', '220421');
test('has guidance', !!r2?.classificationGuidance);
test('chapter = 22', r2?.classificationGuidance?.chapter === '22');
const wineCode = r2?.classificationGuidance?.matchedCodes?.find(c => c.description?.includes('wine'));
test('wine code found', !!wineCode, `codes: ${r2?.classificationGuidance?.matchedCodes?.length}`);

// Test 3: JP + unknown chapter (chapter 99)
console.log('\nTest 3: JP + HS 9999 (no chapter data)');
const r3 = checkDA('JP', '999900');
test('status = no_rulings_data (no chapter)', r3?.status === 'no_rulings_data');
test('no classificationGuidance', !r3?.classificationGuidance);

// Test 4: US → no warning
console.log('\nTest 4: US destination');
const r4 = checkDA('US', '610910');
test('returns undefined', r4 === undefined);

// Test 5: CN → warning without guidance
console.log('\nTest 5: CN destination');
const r5 = checkDA('CN', '610910');
test('status = no_rulings_data', r5?.status === 'no_rulings_data');
test('no classificationGuidance', !r5?.classificationGuidance);

console.log('\n━━ RESULT: ' + passed + ' passed, ' + failed + ' failed ━━');
console.log('JP rules: ' + rules.total_rules + ' codes, ' + Object.keys(rules.chapters).length + ' chapters');
process.exit(failed > 0 ? 1 : 0);
