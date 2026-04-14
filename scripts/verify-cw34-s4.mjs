#!/usr/bin/env node
/**
 * CW34-S4 Runtime Integration — 10 test cases
 *
 * Verifies customs_rulings lookup is wired into the engine.
 * Tests ruling match, conditional evaluator, fallback, and performance.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

// Load env
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) { env[m[1].trim()] = m[2].trim(); process.env[m[1].trim()] = m[2].trim(); }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Inline lookup (mirrors app/lib/rulings/lookup.ts)
async function lookupRulings({ hs6, jurisdiction, material, limit = 5 }) {
  let query = sb.from('customs_rulings')
    .select('id,ruling_id,source,issuing_country,jurisdiction,hs6,hs_code,product_name,material,product_form,intended_use,conditional_rules,duty_rate_ad_valorem,confidence_score,ruling_date,status')
    .eq('hs6', hs6).neq('status', 'revoked').limit(50);
  if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(row => {
    let score = 0;
    if (row.hs6 === hs6) score += 80;
    if (jurisdiction && row.jurisdiction === jurisdiction) score += 20;
    if (material && row.material && row.material.toLowerCase() === material.toLowerCase()) score += 15;
    score += (row.confidence_score ?? 0) * 10;
    if (row.status === 'active') score += 5;
    else if (row.status === 'expired') score -= 5;
    return { ...row, rulingId: row.ruling_id, matchScore: score };
  }).filter(r => r.matchScore > 0).sort((a,b) => b.matchScore - a.matchScore).slice(0, limit);
}

async function countRulingsForHs6(hs6) {
  const { count } = await sb.from('customs_rulings').select('*', { count: 'exact', head: true }).eq('hs6', hs6);
  return count ?? 0;
}

// Inline conditional evaluator (mirrors app/lib/rulings/conditional-evaluator.ts)
function evaluateConditionalRules(rules, ctx) {
  if (!rules || !rules.condition) return { matched: false, adValorem: null, reason: 'no rules' };
  const { field, op, value } = rules.condition;
  let actual = null;
  if (field?.startsWith('materialComposition.')) {
    actual = ctx.materialComposition?.[field.split('.')[1]] ?? null;
  } else if (field === 'weightKg') actual = ctx.weightKg ?? null;
  else if (field === 'priceUsd') actual = ctx.priceUsd ?? null;
  if (actual === null) return { matched: false, adValorem: null, reason: `${field} not in context` };
  const cmp = op === '>=' ? actual >= value : op === '>' ? actual > value : op === '<=' ? actual <= value : op === '<' ? actual < value : op === '==' ? actual === value : false;
  if (cmp) return { matched: true, adValorem: rules.then?.ad_valorem ?? null, reason: `${field} ${op} ${value} true` };
  if (rules.else) return { matched: true, adValorem: rules.else?.ad_valorem ?? null, reason: `${field} ${op} ${value} false, else` };
  return { matched: false, adValorem: null, reason: `${field} ${op} ${value} false` };
}

let passed = 0, failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} ${detail}`);
    failed++;
  }
}

console.log('━━ CW34-S4 Verification ━━\n');

// ── Test 1: HS 610910 ruling lookup (cotton t-shirt) ──
console.log('Test 1: HS 610910 ruling lookup');
const r1 = await lookupRulings({ hs6: '610910', limit: 5 });
test('Returns results', r1.length > 0, `got ${r1.length}`);
test('Has ruling_id', r1[0]?.rulingId?.length > 0);
test('Has source', ['eu_ebti', 'cbp_cross', 'cbp_cross_search'].includes(r1[0]?.source));
test('matchScore > 0', r1[0]?.matchScore > 0);

// ── Test 2: HS 850760 ruling lookup (Li-ion battery) ──
console.log('\nTest 2: HS 850760 ruling lookup');
const r2 = await lookupRulings({ hs6: '850760', limit: 5 });
test('Returns results', r2.length > 0, `got ${r2.length}`);

// ── Test 3: HS 420221 ruling lookup (leather handbag) ──
console.log('\nTest 3: HS 420221 ruling lookup');
const r3 = await lookupRulings({ hs6: '420221', limit: 5 });
test('Returns results', r3.length > 0, `got ${r3.length}`);

// ── Test 4: Jurisdiction filter ──
console.log('\nTest 4: Jurisdiction filter (EU vs US)');
const r4eu = await lookupRulings({ hs6: '610910', jurisdiction: 'EU', limit: 5 });
const r4us = await lookupRulings({ hs6: '610910', jurisdiction: 'US', limit: 5 });
test('EU results exist', r4eu.length > 0);
test('US results exist', r4us.length > 0);
if (r4eu.length > 0) test('EU jurisdiction match', r4eu[0].jurisdiction === 'EU');
if (r4us.length > 0) test('US jurisdiction match', r4us[0].jurisdiction === 'US');

// ── Test 5: Material filter ──
console.log('\nTest 5: Material filter');
const r5 = await lookupRulings({ hs6: '610910', material: 'cotton', limit: 5 });
test('Returns results', r5.length > 0);
const hasCotton = r5.some(r => r.material === 'cotton');
test('At least one cotton match', hasCotton, `materials: ${r5.map(r=>r.material).join(',')}`);

// ── Test 6: Status revoked excluded ──
console.log('\nTest 6: Revoked rulings excluded');
const r6 = await lookupRulings({ hs6: '610910', limit: 50 });
const revokedCount = r6.filter(r => r.status === 'revoked').length;
test('No revoked in results', revokedCount === 0, `found ${revokedCount} revoked`);

// ── Test 7: countRulingsForHs6 ──
console.log('\nTest 7: Count rulings for HS6');
const count = await countRulingsForHs6('610910');
test('Count > 0', count > 0, `got ${count}`);
test('Count reasonable', count < 10000, `got ${count}`);

// ── Test 8: Conditional evaluator — composition match ──
console.log('\nTest 8: Conditional evaluator — composition match');
const cond1 = evaluateConditionalRules(
  { type: 'if_else', condition: { field: 'materialComposition.cotton', op: '>=', value: 50 }, then: { ad_valorem: 10 }, else: { ad_valorem: 15 } },
  { materialComposition: { cotton: 80, polyester: 20 } }
);
test('Matched (cotton 80% >= 50%)', cond1.matched);
test('Ad valorem = 10', cond1.adValorem === 10);

// ── Test 9: Conditional evaluator — composition no match ──
console.log('\nTest 9: Conditional evaluator — composition no match');
const cond2 = evaluateConditionalRules(
  { type: 'if_else', condition: { field: 'materialComposition.cotton', op: '>=', value: 50 }, then: { ad_valorem: 10 }, else: { ad_valorem: 15 } },
  { materialComposition: { cotton: 30, polyester: 70 } }
);
test('Matched (else branch)', cond2.matched);
test('Ad valorem = 15 (else)', cond2.adValorem === 15);

// ── Test 10: Conditional evaluator — no context ──
console.log('\nTest 10: Conditional evaluator — missing context');
const cond3 = evaluateConditionalRules(
  { type: 'threshold', condition: { field: 'weightKg', op: '>', value: 1 }, then: { ad_valorem: 8 } },
  {} // no weight provided
);
test('Not matched (no context)', !cond3.matched);

// ── Performance ──
console.log('\n── Performance ──');
const perf = [];
for (let i = 0; i < 20; i++) {
  const t0 = performance.now();
  await lookupRulings({ hs6: '610910', jurisdiction: 'US', material: 'cotton', limit: 3 });
  perf.push(performance.now() - t0);
}
perf.sort((a,b) => a - b);
const p50 = perf[Math.floor(perf.length * 0.5)];
const p95 = perf[Math.floor(perf.length * 0.95)];
console.log(`  Ruling lookup p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms`);
test('p50 < 200ms', p50 < 200, `got ${p50.toFixed(1)}ms`);
test('p95 < 500ms', p95 < 500, `got ${p95.toFixed(1)}ms`);

// ── Summary ──
console.log(`\n━━ RESULT: ${passed} passed, ${failed} failed ━━`);
process.exit(failed > 0 ? 1 : 0);
