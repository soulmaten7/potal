#!/usr/bin/env node
/**
 * CW36-WCO1: Chapter decision tree verification
 */
import fs from 'node:fs';

const trees = JSON.parse(fs.readFileSync('config/chapter_decision_trees.json', 'utf-8'));

// Inline evaluator (mirrors chapter-tree-evaluator.ts)
function evaluateChapterTree(chapterCode, productName, material, form, use) {
  const tree = trees.chapters[chapterCode];
  if (!tree) return null;
  const lower = (productName || '').toLowerCase();
  const matLower = (material || '').toLowerCase();
  const excludeWarnings = [];
  const includeConfirmations = [];
  const suggestedRedirects = [];
  let confidence = 0.6;
  for (const rule of tree.rules) {
    if (rule.type === 'include') {
      const words = rule.condition.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => lower.includes(w))) { includeConfirmations.push(rule.condition); confidence += 0.1; }
    }
    if (rule.type === 'exclude') {
      const words = rule.condition.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const mc = words.filter(w => lower.includes(w) || matLower.includes(w)).length;
      if (mc >= 2) { excludeWarnings.push(rule.condition); if (rule.redirectHeadings) suggestedRedirects.push(...rule.redirectHeadings); confidence -= 0.15; }
    }
  }
  if (material && tree.materialHints.includes(matLower)) confidence += 0.1;
  if (form && tree.formHints.includes(form.toLowerCase())) confidence += 0.05;
  return { chapter: chapterCode, description: tree.description, materialHints: tree.materialHints, formHints: tree.formHints, useHints: tree.useHints, excludeWarnings, includeConfirmations, suggestedRedirects: [...new Set(suggestedRedirects)], confidence: Math.max(0, Math.min(1, confidence)) };
}

let passed = 0, failed = 0;
function test(name, cond, detail = '') {
  if (cond) { console.log('  ✅ ' + name); passed++; }
  else { console.log('  ❌ ' + name + ' ' + detail); failed++; }
}

console.log('━━ CW36-WCO1 Chapter Decision Trees ━━\n');

// Test 1: Chapter 42 (leather) exists
console.log('Test 1: Chapter 42 tree exists');
const t1 = evaluateChapterTree('42', 'leather wallet', 'leather');
test('Returns result', !!t1);
test('materialHints includes leather', t1?.materialHints?.includes('leather'));
test('confidence > 0.6', t1?.confidence > 0.6, `got ${t1?.confidence}`);

// Test 2: Chapter 61 (knitted apparel)
console.log('\nTest 2: Chapter 61 (knitted)');
const t2 = evaluateChapterTree('61', 'cotton knitted t-shirt', 'cotton', 'knitted');
test('Returns result', !!t2);
test('formHints includes knitted', t2?.formHints?.includes('knitted'));

// Test 3: Chapter 62 (woven apparel)
console.log('\nTest 3: Chapter 62 (woven)');
const t3 = evaluateChapterTree('62', 'woven cotton shirt', 'cotton', 'woven');
test('Returns result', !!t3);

// Test 4: Chapter 84 (machinery) material hints
console.log('\nTest 4: Chapter 84 material hints');
const t4 = evaluateChapterTree('84', 'hydraulic pump', undefined, undefined, 'industrial');
test('Returns result', !!t4);
test('useHints includes industrial', t4?.useHints?.includes('industrial'));

// Test 5: Chapter 30 (pharmaceutical)
console.log('\nTest 5: Chapter 30 (pharmaceutical)');
const t5 = evaluateChapterTree('30', 'aspirin tablet', undefined, undefined, 'medical');
test('Returns result', !!t5);
test('materialHints includes pharmaceutical', t5?.materialHints?.includes('pharmaceutical'));

// Test 6: Unknown chapter (99)
console.log('\nTest 6: Unknown chapter 99');
const t6 = evaluateChapterTree('99', 'something');
test('Returns null', t6 === null);

// Test 7: Chapter coverage stats
console.log('\nTest 7: Coverage stats');
const chCount = Object.keys(trees.chapters).length;
test('≥90 chapters', chCount >= 90, `got ${chCount}`);
test('total rules > 50', trees.total_rules > 50, `got ${trees.total_rules}`);
const matCoverage = Object.values(trees.chapters).filter(t => t.materialHints?.length > 0).length;
test('material coverage ≥ 85 chapters', matCoverage >= 85, `got ${matCoverage}`);

// Test 8: Cross-references exist
console.log('\nTest 8: Cross-references');
const ch42 = trees.chapters['42'];
test('Chapter 42 has cross-refs', ch42?.crossRefHeadings?.length > 0, `got ${ch42?.crossRefHeadings?.length}`);

// Test 9: Exclude rules in chapter 04 (dairy)
console.log('\nTest 9: Chapter 04 exclude rules');
const t9 = trees.chapters['04'];
test('Chapter 04 has exclude rules', t9?.rules?.some(r => r.type === 'exclude'));

// Test 10: findBestChapter scenario
console.log('\nTest 10: Material-based chapter selection');
// Textile chapters 50-63 → at least some have material hints
const textileChapters = ['50','51','52','53','54','55','56','57','58','59','60','61','62','63'];
const textileWithMat = textileChapters.filter(c => trees.chapters[c]?.materialHints?.length > 0);
test('≥8 textile chapters have material hints', textileWithMat.length >= 8, `got ${textileWithMat.length}: [${textileWithMat}]`);

console.log('\n━━ RESULT: ' + passed + ' passed, ' + failed + ' failed ━━');
console.log('Chapter coverage: ' + chCount + '/96, Rules: ' + trees.total_rules);
process.exit(failed > 0 ? 1 : 0);
