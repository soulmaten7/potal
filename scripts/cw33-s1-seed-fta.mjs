#!/usr/bin/env node
/**
 * CW33-S1 Seed — expand fta_agreements + fta_members from hardcoded fta.ts
 *
 * Source: app/lib/cost-engine/hs-code/fta.ts FTA_AGREEMENTS (~65 entries)
 * Target: fta_agreements + fta_members tables
 *
 * Strategy:
 *   1. Parse fta.ts into JS via regex (TS file)
 *   2. Upsert rows into Supabase
 *   3. Verify count increase
 *
 * Idempotent — safe to re-run.
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

// ─── Parse fta.ts ─────────────────────────────────────────────
const ftaFile = new URL('../app/lib/cost-engine/hs-code/fta.ts', import.meta.url);
const ftaSrc = fs.readFileSync(ftaFile, 'utf8');

// Strip line comments so they don't confuse our parser
const stripped = ftaSrc.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

// Extract the FTA_AGREEMENTS array body
const arrStart = stripped.indexOf('const FTA_AGREEMENTS: FtaAgreement[] = [');
if (arrStart === -1) throw new Error('FTA_AGREEMENTS array not found in fta.ts');

// The TS declaration is `FtaAgreement[] = [...]`. We want the 2nd `[`,
// which is the array literal. Find `= [` to skip the type annotation.
const eqBracket = stripped.indexOf('= [', arrStart);
if (eqBracket === -1) throw new Error('Could not find = [');
let i = eqBracket + 3; // just past `= [`
const bodyStart = i;
let depth = 1;
let inString = false;
let stringChar = '';
let end = -1;
for (; i < stripped.length; i++) {
  const ch = stripped[i];
  const prev = stripped[i - 1];
  if (inString) {
    if (ch === stringChar && prev !== '\\') inString = false;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; continue; }
  if (ch === '[' || ch === '{') depth++;
  else if (ch === ']' || ch === '}') {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
if (end === -1) throw new Error('Could not find end of FTA_AGREEMENTS array');
const arrBody = stripped.slice(bodyStart, end);

// Split into entries at top-level `},` boundaries
const entries = [];
let cur = '';
let braceDepth = 0;
inString = false;
stringChar = '';
for (let j = 0; j < arrBody.length; j++) {
  const ch = arrBody[j];
  const prev = arrBody[j - 1];
  cur += ch;
  if (inString) {
    if (ch === stringChar && prev !== '\\') inString = false;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; continue; }
  if (ch === '{') braceDepth++;
  else if (ch === '}') {
    braceDepth--;
    if (braceDepth === 0) {
      entries.push(cur.trim().replace(/^,?\s*/, ''));
      cur = '';
    }
  }
}

// Parse each entry into FTA object
function extractField(block, name) {
  const re = new RegExp(`${name}:\\s*([^,\\n]+?)(?=,[\\n\\s]*[a-zA-Z]+:|[\\n\\s]*\\})`, 's');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}
function extractStringField(block, name) {
  const re = new RegExp(`${name}:\\s*'([^']*)'`);
  const m = block.match(re);
  return m ? m[1] : null;
}
function extractArrayField(block, name) {
  const re = new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\]`);
  const m = block.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}
function extractNumberField(block, name) {
  const re = new RegExp(`${name}:\\s*([0-9.]+)`);
  const m = block.match(re);
  return m ? parseFloat(m[1]) : null;
}
function extractBoolField(block, name) {
  const re = new RegExp(`${name}:\\s*(true|false)`);
  const m = block.match(re);
  return m ? m[1] === 'true' : null;
}

const ftas = entries.map(block => ({
  fta_code: extractStringField(block, 'code'),
  fta_name: extractStringField(block, 'name'),
  members: extractArrayField(block, 'members'),
  preferential_multiplier: extractNumberField(block, 'preferentialMultiplier'),
  excluded_chapters: extractArrayField(block, 'excludedChapters') || [],
  is_active: extractBoolField(block, 'isActive'),
})).filter(f => f.fta_code && f.fta_name);

console.log(`arrBody length: ${arrBody.length}, first 150 chars:`);
console.log(arrBody.slice(0, 150));
console.log(`end index: ${end}, body indexOf first {: ${arrBody.indexOf('{')}`);
console.log(`Raw entries parsed: ${entries.length}`);
console.log(`Filtered FTAs: ${ftas.length}`);
if (entries.length > 0 && ftas.length === 0) {
  console.log('First entry:', entries[0].slice(0, 200));
  const f = entries[0];
  console.log('Tried to extract:');
  console.log('  code:', extractStringField(f, 'code'));
  console.log('  name:', extractStringField(f, 'name'));
}
console.log();

// ─── Fetch existing rows ─────────────────────────────────────
const { data: existing } = await sb.from('fta_agreements').select('fta_code');
const existingCodes = new Set((existing || []).map(r => r.fta_code));
console.log(`Existing in DB: ${existingCodes.size}`);

// ─── Upsert FTAs ─────────────────────────────────────────────
const newOrUpdate = ftas.map(f => ({
  fta_code: f.fta_code,
  fta_name: f.fta_name,
  preferential_multiplier: f.preferential_multiplier,
  excluded_chapters: f.excluded_chapters,
  is_active: f.is_active ?? true,
  notes: `Seeded from app/lib/cost-engine/hs-code/fta.ts by CW33-S1`,
}));

let inserted = 0, updated = 0, errors = 0;
for (const row of newOrUpdate) {
  const { error } = await sb.from('fta_agreements').upsert(row, {
    onConflict: 'fta_code',
  });
  if (error) {
    errors++;
    console.log(`  ✗ ${row.fta_code}: ${error.message.slice(0, 80)}`);
  } else {
    if (existingCodes.has(row.fta_code)) updated++;
    else inserted++;
  }
}
console.log(`\nfta_agreements upsert: inserted=${inserted}, updated=${updated}, errors=${errors}`);

// ─── Upsert members ─────────────────────────────────────────
console.log(`\nSeeding fta_members…`);
let memInserted = 0, memErrors = 0;
for (const f of ftas) {
  if (!f.members) continue;
  for (const country of f.members) {
    const { error } = await sb.from('fta_members').upsert(
      { fta_code: f.fta_code, country_code: country },
      { onConflict: 'fta_code,country_code' }
    );
    if (error) {
      memErrors++;
      if (memErrors <= 5) console.log(`  ✗ ${f.fta_code}/${country}: ${error.message.slice(0, 70)}`);
    } else {
      memInserted++;
    }
  }
}
console.log(`fta_members upsert: ${memInserted} rows, ${memErrors} errors`);

// ─── Final count ─────────────────────────────────────────────
const { data: allFtas } = await sb.from('fta_agreements').select('fta_code').range(0, 9999);
const { data: allMems } = await sb.from('fta_members').select('*').range(0, 9999);
console.log(`\n✓ Final: ${allFtas.length} FTAs, ${allMems.length} members`);

// ─── Key verification: UK-KR and KCFTA present ───────────────
const keys = ['UK-KR', 'KCFTA', 'KORUS', 'EU-KR', 'RCEP', 'USMCA'];
const { data: keyRows } = await sb.from('fta_agreements').select('fta_code, fta_name').in('fta_code', keys);
console.log(`\nKey FTA check (${keyRows.length}/${keys.length}):`);
for (const k of keys) {
  const row = keyRows.find(r => r.fta_code === k);
  console.log(`  ${row ? '✓' : '✗'} ${k.padEnd(10)} ${row?.fta_name || '(missing)'}`);
}
