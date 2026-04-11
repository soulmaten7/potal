#!/usr/bin/env node
/**
 * CW33-S1 Seed — fta_product_rules from tlc_data/rules_of_origin/ JSONs.
 *
 * Sources (all from 2026-03-18 collection):
 *   - roo_structured.json — 5 major FTAs chapter-level meta
 *   - usmca_psr_heading_level.json — 443 heading-level rules
 *   - rcep_psr_heading_level.json — ~5k rules
 *   - cptpp_psr_heading_level.json — ~2.3k rules
 *   - eu_uk_tca_psr_heading_level.json — ~1.1k rules
 *   - fta_psr_5_major.json — USMCA chapter-level canonical
 *
 * Target: fta_product_rules
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

const ROO_DIR = '/Volumes/soulmaten/POTAL/tlc_data/rules_of_origin';

function readJSON(name) {
  return JSON.parse(fs.readFileSync(`${ROO_DIR}/${name}`, 'utf8'));
}

// ─── Valid FTA codes in DB ──────────────────────────────
const { data: ftas } = await sb.from('fta_agreements').select('fta_code');
const validFtas = new Set(ftas.map(f => f.fta_code));
console.log(`Valid FTA codes in DB: ${validFtas.size}`);

// ─── Normalize HS scope string ─────────────────────────
function normalizeHsScope(raw) {
  return String(raw || '')
    .replace(/\s+/g, '')
    .replace(/\.(\d)/g, '$1')      // 01.01 → 0101
    .trim();
}
function classifyScopeLevel(hs) {
  const len = hs.replace(/-.*$/, '').length;
  if (hs.includes('-') && len <= 2) return 'chapter';
  if (len === 2) return 'chapter';
  if (len === 4) return 'heading';
  if (len === 6) return 'subheading';
  if (len === 8 || len === 10) return 'national';
  return 'chapter';
}

// ─── 1. roo_structured.json — FTA meta (chapter-level, 5 FTAs) ─
// Use this mainly for rvc/de_minimis/cumulation meta, not individual rules.
const rooMeta = readJSON('roo_structured.json');
console.log(`\nLoaded roo_structured.json (${Object.keys(rooMeta.fta_meta || {}).length} FTAs)`);

const ftaMetaMap = new Map();
for (const [ftaName, meta] of Object.entries(rooMeta.fta_meta || {})) {
  // Map roo_structured keys (USMCA, RCEP, ...) to DB fta_code
  const codeMap = {
    'USMCA': 'USMCA',
    'RCEP': 'RCEP',
    'CPTPP': 'CPTPP',
    'KORUS': 'KORUS',
    'EU-UK TCA': 'EU-UK-TCA',
    'EU-UK_TCA': 'EU-UK-TCA',
    'EU-Korea': 'EU-KR',
  };
  const code = codeMap[ftaName] || ftaName;
  if (validFtas.has(code)) ftaMetaMap.set(code, { ...meta, source: 'roo_structured.json' });
}

// ─── 2. Heading-level PSR JSONs ────────────────────────
const psrFiles = [
  { fta: 'USMCA', file: 'usmca_psr_heading_level.json' },
  { fta: 'RCEP', file: 'rcep_psr_heading_level.json' },
  { fta: 'CPTPP', file: 'cptpp_psr_heading_level.json' },
  { fta: 'EU-UK-TCA', file: 'eu_uk_tca_psr_heading_level.json' },
];

const rules = [];
for (const { fta, file } of psrFiles) {
  if (!validFtas.has(fta)) {
    console.log(`  ✗ ${fta}: not in DB, skip`);
    continue;
  }
  const j = readJSON(file);
  const arr = j.rules || [];
  const citation = j.metadata?.source || file;
  console.log(`  ✓ ${file} (${arr.length} rules) → ${fta}`);
  for (const r of arr) {
    const hs = normalizeHsScope(r.hs_code);
    if (!hs) continue;
    rules.push({
      fta_code: fta,
      hs_scope: hs.slice(0, 20),
      scope_level: classifyScopeLevel(hs),
      rule_type: r.rule_type || null,
      rule_text: String(r.rule || '').slice(0, 3000),
      rvc_percent: r.rvc_percent || null,
      rvc_method: r.rvc_method || null,
      de_minimis_percent: r.de_minimis_percent || null,
      cumulation_type: r.cumulation_type || null,
      source_citation: citation.slice(0, 200),
      data_confidence: 'official',
    });
  }
}

// ─── 3. fta_psr_5_major.json — chapter-level canonical ─
const major = readJSON('fta_psr_5_major.json');
for (const [ftaName, meta] of Object.entries(major)) {
  const codeMap = {
    'USMCA': 'USMCA', 'RCEP': 'RCEP', 'CPTPP': 'CPTPP',
    'KORUS': 'KORUS', 'EU-UK TCA': 'EU-UK-TCA',
  };
  const code = codeMap[ftaName];
  if (!code || !validFtas.has(code)) continue;
  for (const [hsRange, rule] of Object.entries(meta.chapter_rules || {})) {
    rules.push({
      fta_code: code,
      hs_scope: hsRange,
      scope_level: 'chapter',
      rule_type: rule.rule?.match(/\b(CTH|CTSH|CC|RVC|WO)\b/)?.[0] || 'MIXED',
      rule_text: (rule.rule + (rule.desc ? ` — ${rule.desc}` : '')).slice(0, 3000),
      de_minimis_percent: meta.de_minimis || null,
      cumulation_type: meta.cumulation || null,
      source_citation: `fta_psr_5_major.json (${ftaName})`,
      data_confidence: 'official',
    });
  }
}

console.log(`\nTotal rules to seed: ${rules.length}`);

// ─── Clear old rows for these FTAs (fresh re-seed) ────
const ftasSeeded = [...new Set(rules.map(r => r.fta_code))];
const { error: delErr } = await sb.from('fta_product_rules').delete().in('fta_code', ftasSeeded);
if (delErr) console.log(`Delete error: ${delErr.message}`);

// ─── Insert in chunks ─────────────────────────────────
const CHUNK = 500;
let inserted = 0;
for (let k = 0; k < rules.length; k += CHUNK) {
  const chunk = rules.slice(k, k + CHUNK);
  const { error } = await sb.from('fta_product_rules').insert(chunk);
  if (error) {
    console.log(`Insert chunk ${k}: ${error.message.slice(0, 200)}`);
    // try one-by-one to find the bad row
    for (const row of chunk) {
      const { error: e2 } = await sb.from('fta_product_rules').insert(row);
      if (e2) console.log(`  bad: ${row.fta_code}/${row.hs_scope}: ${e2.message.slice(0, 100)}`);
      else inserted++;
    }
  } else {
    inserted += chunk.length;
  }
}
console.log(`✓ Inserted ${inserted} rules`);

// ─── Verify per-FTA counts ────────────────────────────
for (const fta of ftasSeeded) {
  const { data } = await sb.from('fta_product_rules').select('fta_code').eq('fta_code', fta).range(0, 9999);
  console.log(`  ${fta.padEnd(12)} ${data?.length ?? 0} rules`);
}
