#!/usr/bin/env node
/**
 * CW33-S1 Seed — expand restricted_items with rules from rules.ts
 *
 * rules.ts (UNIVERSAL + COUNTRY_SPECIFIC + WATCHED_AND_CARRIER) is the
 * ground-truth restriction source used by checkRestrictions(). We want
 * the DB table restricted_items to be a superset, so future migrations
 * can read from DB only.
 *
 * This is additive: rules already present (matched by hs_code_pattern
 * prefix + country) are left alone.
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

// ─── Parse rules.ts ──────────────────────────────────────────
const rulesFile = new URL('../app/lib/cost-engine/restrictions/rules.ts', import.meta.url);
const src = fs.readFileSync(rulesFile, 'utf8');

// Strip line comments
const stripped = src.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

// Extract each array: UNIVERSAL, COUNTRY_SPECIFIC, WATCHED_AND_CARRIER
function extractArray(src, name) {
  const re = new RegExp(`const ${name}: Restriction\\[\\] = \\[`);
  const m = src.match(re);
  if (!m) { console.log(`  WARN: ${name} not found`); return []; }
  // Skip past the TS type annotation `Restriction[]` — find `= [`
  const eq = src.indexOf('= [', m.index);
  if (eq === -1) { console.log(`  WARN: ${name} = [ not found`); return []; }
  const start = eq + 2; // positioned at `[`
  let depth = 1;
  let i = start + 1;
  let inStr = false;
  let strCh = '';
  for (; i < src.length; i++) {
    const c = src[i];
    const prev = src[i - 1];
    if (inStr) {
      if (c === strCh && prev !== '\\') inStr = false;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = src.slice(start + 1, i);
  // Split into entries at top-level `},`
  const entries = [];
  let cur = '';
  let bd = 0;
  inStr = false;
  for (let j = 0; j < body.length; j++) {
    const c = body[j];
    const prev = body[j - 1];
    cur += c;
    if (inStr) { if (c === strCh && prev !== '\\') inStr = false; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '{') bd++;
    else if (c === '}') {
      bd--;
      if (bd === 0) { entries.push(cur.trim().replace(/^,?\s*/, '')); cur = ''; }
    }
  }
  return entries;
}

function parseEntry(block) {
  const sev = block.match(/severity:\s*'([^']+)'/)?.[1];
  const hsPrefix = block.match(/hsPrefix:\s*'([^']+)'/)?.[1];
  const category = block.match(/category:\s*'([^']+)'/)?.[1];
  const description = block.match(/description:\s*'([^']*)'/)?.[1];
  const countries = [...(block.match(/countries:\s*\[([^\]]*)\]/)?.[1] || '').matchAll(/'([A-Z]{2})'/g)].map(x => x[1]);
  const exempt = [...(block.match(/exemptCountries:\s*\[([^\]]*)\]/)?.[1] || '').matchAll(/'([A-Z]{2})'/g)].map(x => x[1]);
  const reqDocs = [...(block.match(/requiredDocuments:\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/'([^']+)'/g)].map(x => x[1]);
  const carriers = [...(block.match(/carrierRestrictions:\s*\[([\s\S]*?)\]/)?.[1] || '').matchAll(/'([^']+)'/g)].map(x => x[1]);
  return { severity: sev, hsPrefix, category, description, countries, exempt, reqDocs, carriers };
}

const allRules = [
  ...extractArray(stripped, 'UNIVERSAL'),
  ...extractArray(stripped, 'COUNTRY_SPECIFIC'),
  ...extractArray(stripped, 'WATCHED_AND_CARRIER'),
].map(parseEntry).filter(r => r.hsPrefix);

console.log(`Parsed ${allRules.length} restriction rules from rules.ts`);

// ─── Fetch existing DB rows ─────────────────────────────────
const { data: existing } = await sb.from('restricted_items').select('hs_code_pattern, destination_country, description');
const existingKeys = new Set(
  (existing || []).map(r => `${r.hs_code_pattern.replace(/%$/, '')}|${r.destination_country || '*'}|${(r.description || '').slice(0, 40)}`)
);
console.log(`Existing in DB: ${existing?.length ?? 0}`);

// ─── Map rule severity → restriction_type ──────────────────
function sevToType(sev) {
  switch (sev) {
    case 'prohibited': return 'banned';
    case 'restricted': return 'license_required';
    case 'watched': return 'license_required';
    case 'warning': return 'warning';
    default: return 'warning';
  }
}

// ─── Build rows to insert ──────────────────────────────────
const rowsToInsert = [];
for (const rule of allRules) {
  const pattern = `${rule.hsPrefix}%`;
  const countries = rule.countries.length > 0 ? rule.countries : [null];
  for (const dest of countries) {
    const key = `${rule.hsPrefix}|${dest || '*'}|${(rule.description || '').slice(0, 40)}`;
    if (existingKeys.has(key)) continue;
    const licenseInfo = rule.reqDocs.length > 0
      ? `Required: ${rule.reqDocs.join('; ')}`
      : rule.carriers.length > 0
        ? `Carrier restricted: ${rule.carriers.slice(0, 3).join(', ')}`
        : null;
    rowsToInsert.push({
      hs_code_pattern: pattern,
      origin_country: null,
      destination_country: dest,
      restriction_type: sevToType(rule.severity),
      description: `${rule.category || 'Restriction'}: ${rule.description || ''}`.slice(0, 500),
      license_info: licenseInfo,
      source: 'POTAL rules.ts (CW33-S1 seed)',
      direction: 'import',
    });
  }
}

console.log(`New rows to insert: ${rowsToInsert.length}`);

if (rowsToInsert.length > 0) {
  const { data, error } = await sb.from('restricted_items').insert(rowsToInsert).select();
  if (error) {
    console.log(`✗ Insert error: ${error.message.slice(0, 200)}`);
    // try one by one
    let ok = 0, bad = 0;
    for (const r of rowsToInsert) {
      const { error: e2 } = await sb.from('restricted_items').insert(r);
      if (e2) { bad++; if (bad < 5) console.log(`  ${r.hs_code_pattern}: ${e2.message.slice(0,80)}`); }
      else ok++;
    }
    console.log(`  individual: ok=${ok}, bad=${bad}`);
  } else {
    console.log(`✓ Inserted ${data?.length ?? 0} rows`);
  }
}

// ─── Verify final counts ─────────────────────────────────────
const { data: after } = await sb.from('restricted_items').select('*').range(0, 9999);
console.log(`\nFinal restricted_items count: ${after?.length ?? 0}`);
const patterns = [...new Set(after.map(r => r.hs_code_pattern))].sort();
const has8506 = patterns.includes('8506%');
const has8507 = patterns.includes('8507%');
console.log(`  HS 8506 (primary lithium): ${has8506 ? '✓' : '✗'}`);
console.log(`  HS 8507 (lithium-ion):     ${has8507 ? '✓' : '✗'}`);
