#!/usr/bin/env node
/**
 * CW33-S1 Seed — hs_classification_overrides
 *
 * Migrates the CW32 `deterministicOverride()` regex rules from
 * ai-classifier-wrapper.ts (lines 27-100) into the database so they can
 * be managed without code deploys.
 *
 * After this seed runs + code refactor, the wrapper will query this
 * table instead of hard-coding the regexes.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ─── Canonical override list (from CW32 deterministicOverride) ─
//
// Each entry is an atomic rule; priority determines execution order.
// Lower priority runs first. Battery rules must run before the generic
// "lithium battery" catch-all so the more specific chemistry wins.
const overrides = [
  // ─── Primary / non-rechargeable lithium (HS 850650) ──
  {
    priority: 10,
    pattern_regex: '(?:primary|non[-\\s]?rechargeable|disposable).*\\blithium\\b|\\blithium\\b.*(?:primary|non[-\\s]?rechargeable|disposable)',
    pattern_description: 'Primary (non-rechargeable) lithium battery — word boundary',
    hs_code: '850650',
    description: 'Primary cells and primary batteries — lithium (non-rechargeable)',
    confidence: 0.95,
    reason: 'CW32: 850650 primary lithium must not be confused with 850760 rechargeable. HAZMAT UN3090/3091.',
    source_citation: 'HS 2022 heading 8506 — primary cells and primary batteries; IATA DGR UN3090/3091',
  },
  {
    priority: 15,
    pattern_regex: '\\bcr\\d{4}\\b|button[-\\s]?cell',
    pattern_description: 'Coin cell / CR#### designator',
    hs_code: '850650',
    description: 'Primary cells and primary batteries — lithium (coin cell)',
    confidence: 0.95,
    reason: 'CR2032/CR2025 coin cells are lithium primary per IEC 60086',
    source_citation: 'IEC 60086-3 lithium coin cell; HS 850650',
  },

  // ─── Lithium-ion / rechargeable lithium (HS 850760) ──
  {
    priority: 20,
    pattern_regex: '\\blithium\\b.*(?:rechargeable|secondary|ion|accumulator|power[-\\s]?bank|18650|21700)|(?:li-?ion|lithium[-\\s]?ion)',
    pattern_description: 'Lithium-ion rechargeable (explicit chemistry markers)',
    hs_code: '850760',
    description: 'Electric accumulators — lithium-ion (rechargeable)',
    confidence: 0.95,
    reason: 'CW32: 850760 lithium-ion accumulator. HAZMAT UN3480/3481.',
    source_citation: 'HS 2022 heading 8507 — electric accumulators; IATA DGR UN3480/3481',
  },
  {
    priority: 30,
    pattern_regex: '\\blithium\\b.*\\bbattery\\b|\\bbattery\\b.*\\blithium\\b',
    pattern_description: 'Bare "lithium battery" (ambiguous, defaults to li-ion)',
    hs_code: '850760',
    description: 'Electric accumulators — lithium-ion (default for ambiguous "lithium battery")',
    confidence: 0.85,
    reason: 'CW32: ambiguous "lithium battery" defaults to li-ion (more common consumer case)',
    source_citation: 'Consumer market assumption, HS 8507',
  },

  // ─── Primary alkaline (AA/AAA) (HS 850610) ─────────
  {
    priority: 40,
    pattern_regex: '(?:primary|non[-\\s]?rechargeable|disposable|alkaline).*\\b(?:aa|aaa)\\b|\\b(?:aa|aaa)\\b.*(?:primary|alkaline)',
    pattern_description: 'AA / AAA alkaline primary battery',
    hs_code: '850610',
    description: 'Primary cells and primary batteries — manganese dioxide (alkaline)',
    confidence: 0.9,
    reason: 'AA/AAA alkaline cells are manganese-dioxide primary per IEC 60086',
    source_citation: 'IEC 60086-2 alkaline cell; HS 850610',
  },

  // ─── Cotton T-shirt consistency (HS 610910) ────────
  {
    priority: 50,
    pattern_regex: '\\b(?:cotton)\\b.*\\b(?:t[-\\s]?shirts?|tshirts?|tees?)\\b|\\b(?:t[-\\s]?shirts?|tshirts?|tees?)\\b.*\\b(?:cotton)\\b',
    pattern_description: 'Cotton T-shirt (knitted)',
    hs_code: '610910',
    description: 'T-shirts, singlets and other vests, knitted or crocheted, cotton',
    confidence: 0.95,
    reason: 'CW32: single/batch path HS drift fix — cotton T-shirts always 610910 (knitted), not 620630 (woven)',
    source_citation: 'WCO HS 2022 heading 6109 — T-shirts, knitted',
  },
];

console.log(`Seeding ${overrides.length} HS classification overrides...`);

// ─── Delete existing rows (fresh re-seed) ─────────────
await sb.from('hs_classification_overrides').delete().gte('priority', 0);

// ─── Insert ───────────────────────────────────────────
const rows = overrides.map(o => ({
  ...o,
  active: true,
  data_confidence: 'official',
}));

const { data, error } = await sb.from('hs_classification_overrides').insert(rows).select();
if (error) {
  console.error(`✗ Error: ${error.message}`);
  process.exit(1);
}
console.log(`✓ Inserted ${data.length} overrides`);

// ─── Verify ──────────────────────────────────────────
const { data: all } = await sb
  .from('hs_classification_overrides')
  .select('priority, pattern_description, hs_code, confidence')
  .order('priority');
console.log('\nFinal overrides (priority order):');
for (const row of all) {
  console.log(`  [${String(row.priority).padStart(3)}] ${row.pattern_description.padEnd(50)} → ${row.hs_code} (c=${row.confidence})`);
}
