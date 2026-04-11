#!/usr/bin/env node
/**
 * CW33-S4 Seed — sanctioned_entities from 5 sources:
 *
 *   1. OFAC SDN       sdn.csv (5.5 MB, ~18,700 rows)
 *   2. BIS Entity     bis_entity_list.json (1.5 MB, ~2,633 entities)
 *   3. UK HMT OFSI    uk_ofsi_sanctions.csv (16 MB)
 *   4. UN Consolidated un_sanctions_consolidated.xml (2 MB)
 *   5. EU Consolidated eu_sanctions_list.xml (24 MB) — sampled in this pass
 *
 * This script processes each feed, normalizes into the sanctioned_entities
 * schema, and bulk-inserts in chunks.
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

const ROOT = '/Volumes/soulmaten/POTAL';

function sanitizeDate(d) {
  if (!d) return null;
  // Strip trailing timezone offset suffix: "2015-04-07-04:00" → "2015-04-07"
  const m = String(d).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// ─── CSV parser (RFC-4180 subset) ────────────────────
function parseCSV(text, hasHeader = true) {
  const rows = [];
  let cur = [''];
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; }
      else if (c === '"') inQuote = false;
      else cur[cur.length - 1] += c;
    } else {
      if (c === '"') inQuote = true;
      else if (c === ',') cur.push('');
      else if (c === '\n') { rows.push(cur); cur = ['']; }
      else if (c === '\r') { /* skip */ }
      else cur[cur.length - 1] += c;
    }
  }
  if (cur.length > 1 || cur[0]) rows.push(cur);
  if (!hasHeader) return rows;
  const header = rows.shift();
  return rows.map(r => {
    const o = {};
    header.forEach((h, k) => { o[h] = r[k] ?? ''; });
    return o;
  });
}

const allRows = [];

// ─── 1. OFAC SDN CSV ────────────────────────────────
console.log('\n=== 1. OFAC SDN ===');
async function loadOfacSdn() {
  // OFAC SDN CSV has no header. Schema per column:
  //   0=uid, 1=primary name, 2=sdn type, 3=program (country/regime),
  //   4=title, 5=call sign, 6=vessel type, 7=tonnage,
  //   8=gross reg tons, 9=vessel flag, 10=vessel owner, 11=remarks
  // Source: https://sanctionssearch.ofac.treas.gov/
  const text = fs.readFileSync(`${ROOT}/regulations/us/ofac_sanctions/sdn.csv`, 'utf8');
  const rows = parseCSV(text, false);
  console.log(`  parsed ${rows.length} OFAC SDN rows`);

  let count = 0;
  for (const r of rows) {
    const uid = r[0];
    const name = (r[1] || '').trim();
    const sdnType = (r[2] || '').trim();
    const program = (r[3] || '').trim();
    const remarks = (r[11] || '').trim();
    if (!uid || !name || name === '-0-') continue;

    // Normalize entity_type
    const entityType = sdnType.toLowerCase().includes('individual') ? 'individual'
      : sdnType.toLowerCase().includes('vessel') ? 'vessel'
      : sdnType.toLowerCase().includes('aircraft') ? 'aircraft'
      : 'organization';

    // Try to extract country from program (heuristic)
    const countryCode = null; // OFAC program strings are regime names, not ISO

    allRows.push({
      source: 'ofac_sdn',
      source_uid: `ofac_${uid}`,
      entity_type: entityType,
      primary_name: name.slice(0, 500),
      aliases: [],
      country_code: countryCode,
      program_refs: program && program !== '-0-' ? [program.slice(0, 80)] : [],
      legal_citation: '31 CFR Part 501 — OFAC SDN List',
      source_citation: 'OFAC SDN https://sanctionssearch.ofac.treas.gov/ (collected 2026-03-13)',
      data_confidence: 'official',
    });
    count++;
  }
  console.log(`  accepted ${count} OFAC rows`);
}

// ─── 2. BIS Entity List JSON ────────────────────────
console.log('\n=== 2. BIS Entity List ===');
async function loadBisEntityList() {
  const j = JSON.parse(fs.readFileSync(`${ROOT}/tlc_data/export_controls/bis_entity_list.json`, 'utf8'));
  const entities = j.entities || [];
  console.log(`  parsed ${entities.length} BIS entries`);

  // Country name → ISO alpha-2 (partial map for the majors)
  const cMap = {
    'AFGHANISTAN': 'AF', 'CHINA': 'CN', 'RUSSIA': 'RU', 'IRAN': 'IR', 'NORTH KOREA': 'KP',
    'BELARUS': 'BY', 'VENEZUELA': 'VE', 'CUBA': 'CU', 'SYRIA': 'SY', 'MYANMAR': 'MM',
    'PAKISTAN': 'PK', 'SAUDI ARABIA': 'SA', 'UAE': 'AE', 'UNITED ARAB EMIRATES': 'AE',
    'HONG KONG': 'HK', 'TURKEY': 'TR', 'LEBANON': 'LB', 'YEMEN': 'YE', 'INDIA': 'IN',
    'JAPAN': 'JP', 'SOUTH KOREA': 'KR', 'GERMANY': 'DE', 'UNITED KINGDOM': 'GB',
    'FRANCE': 'FR', 'ITALY': 'IT', 'SPAIN': 'ES', 'SINGAPORE': 'SG', 'MALAYSIA': 'MY',
    'TAIWAN': 'TW', 'VIETNAM': 'VN', 'THAILAND': 'TH', 'INDONESIA': 'ID',
  };

  let idx = 0;
  for (const e of entities) {
    idx++;
    const name = (e.entity || '').replace(/\s*,\s*$/, '').split(',')[0].trim();
    if (!name || name.length < 3) continue;
    const country = (e.country || '').trim().toUpperCase();
    const country_code = cMap[country] || null;
    allRows.push({
      source: 'bis_entity',
      source_uid: `bis_${idx}`,
      entity_type: 'organization',
      primary_name: name.slice(0, 500),
      country_code,
      addresses: e.entity?.includes(',') ? [{ raw: e.entity.slice(0, 500) }] : [],
      program_refs: ['EAR Part 744'],
      legal_citation: e.federal_register_citation || '15 CFR Part 744 Supplement 4',
      source_citation: `BIS Entity List https://www.bis.gov/entity-list (${j.metadata?.date || '2026-03-18'})`,
      data_confidence: 'official',
    });
  }
  console.log(`  accepted ${idx} BIS rows`);
}

// ─── 3. UK HMT OFSI CSV ─────────────────────────────
console.log('\n=== 3. UK HMT OFSI ===');
async function loadUkOfsi() {
  const text = fs.readFileSync(`${ROOT}/tlc_data/sanctions/uk_ofsi_sanctions.csv`, 'utf8');
  // First line is "Last Updated,27/01/2026" — second line is the real header
  const lines = text.split('\n');
  const effectiveText = lines.slice(1).join('\n');
  const rows = parseCSV(effectiveText, true);
  console.log(`  parsed ${rows.length} UK OFSI rows`);

  let idx = 0;
  for (const r of rows) {
    idx++;
    const name1 = (r['Name 1'] || '').trim();
    const name6 = (r['Name 6'] || '').trim(); // family/primary
    const primary = [name6, name1, (r['Name 2'] || '').trim(), (r['Name 3'] || '').trim()]
      .filter(Boolean).join(' ').trim();
    if (!primary || primary.length < 2) continue;
    const groupType = (r['Group Type'] || '').trim();
    const regime = (r['Regime'] || '').trim();
    const country = (r['Country'] || '').trim();
    const groupId = (r['Group ID'] || '').trim();

    allRows.push({
      source: 'uk_hmt',
      source_uid: `uk_${groupId || idx}_${idx}`,
      entity_type: groupType.toLowerCase() === 'individual' ? 'individual' : 'organization',
      primary_name: primary.slice(0, 500),
      country_code: null,
      nationalities: country ? [country.slice(0, 60)] : [],
      program_refs: regime ? [regime.slice(0, 80)] : [],
      legal_citation: 'UK Sanctions and Anti-Money Laundering Act 2018',
      source_citation: `UK HMT Consolidated List (last updated ${lines[0].split(',')[1] || '2026-01-27'})`,
      data_confidence: 'official',
    });
  }
  console.log(`  accepted ${idx} UK rows`);
}

// ─── 4. UN Consolidated XML ─────────────────────────
console.log('\n=== 4. UN Consolidated ===');
async function loadUnConsolidated() {
  const xml = fs.readFileSync(`${ROOT}/tlc_data/sanctions/un_sanctions_consolidated.xml`, 'utf8');
  // Simple regex-based parser (doesn't require xml lib)
  const individuals = [...xml.matchAll(/<INDIVIDUAL>([\s\S]*?)<\/INDIVIDUAL>/g)].map(m => m[1]);
  const entities = [...xml.matchAll(/<ENTITY>([\s\S]*?)<\/ENTITY>/g)].map(m => m[1]);
  console.log(`  parsed ${individuals.length} individuals + ${entities.length} entities`);

  function field(block, name) {
    const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));
    return m ? m[1].trim() : null;
  }

  let idx = 0;
  for (const block of individuals) {
    idx++;
    const dataId = field(block, 'DATAID');
    const first = field(block, 'FIRST_NAME') || '';
    const second = field(block, 'SECOND_NAME') || '';
    const third = field(block, 'THIRD_NAME') || '';
    const primary = [first, second, third].filter(Boolean).join(' ').trim();
    if (!primary) continue;
    allRows.push({
      source: 'un_consolidated',
      source_uid: `un_i_${dataId || idx}`,
      entity_type: 'individual',
      primary_name: primary.slice(0, 500),
      country_code: null,
      listed_on: sanitizeDate(field(block, 'LISTED_ON')),
      program_refs: [field(block, 'UN_LIST_TYPE')].filter(Boolean),
      legal_citation: 'UN Security Council Resolutions',
      source_citation: 'UN Consolidated Sanctions List',
      data_confidence: 'official',
    });
  }
  for (const block of entities) {
    idx++;
    const dataId = field(block, 'DATAID');
    const name = field(block, 'FIRST_NAME') || field(block, 'NAME') || '';
    if (!name) continue;
    allRows.push({
      source: 'un_consolidated',
      source_uid: `un_e_${dataId || idx}`,
      entity_type: 'organization',
      primary_name: name.slice(0, 500),
      country_code: null,
      listed_on: sanitizeDate(field(block, 'LISTED_ON')),
      program_refs: [field(block, 'UN_LIST_TYPE')].filter(Boolean),
      legal_citation: 'UN Security Council Resolutions',
      source_citation: 'UN Consolidated Sanctions List',
      data_confidence: 'official',
    });
  }
  console.log(`  accepted ${idx} UN rows`);
}

// ─── 5. EU Consolidated XML (streaming) ────────────
console.log('\n=== 5. EU Consolidated ===');
async function loadEuConsolidated() {
  // EU XML is 24 MB — use streaming-ish parse by splitting on closing tags
  const xml = fs.readFileSync(`${ROOT}/tlc_data/sanctions/eu_sanctions_list.xml`, 'utf8');
  // EU schema uses <sanctionEntity> blocks containing <nameAlias wholeName="..."/>
  const entities = [...xml.matchAll(/<sanctionEntity[^>]*logicalId="(\d+)"[^>]*>([\s\S]*?)<\/sanctionEntity>/g)];
  console.log(`  parsed ${entities.length} EU entity blocks`);

  let idx = 0;
  for (const [, logicalId, block] of entities) {
    idx++;
    // Extract primary nameAlias
    const primary = block.match(/<nameAlias[^>]*wholeName="([^"]+)"/)?.[1];
    if (!primary) continue;
    const regulation = block.match(/<regulation[^>]*regulationType="([^"]+)"/)?.[1];
    const program = block.match(/<regulation[^>]*programme="([^"]+)"/)?.[1];

    allRows.push({
      source: 'eu_consolidated',
      source_uid: `eu_${logicalId}`,
      entity_type: block.includes('subjectType="person"') ? 'individual' : 'organization',
      primary_name: primary.slice(0, 500),
      country_code: null,
      program_refs: [regulation, program].filter(Boolean).map(s => s.slice(0, 80)),
      legal_citation: 'EU Council Decisions + Regulations (CFSP)',
      source_citation: 'EU Consolidated Sanctions List (FISMA)',
      data_confidence: 'official',
    });
  }
  console.log(`  accepted ${idx} EU rows`);
}

// ─── Execute loaders ────────────────────────────────
await loadOfacSdn();
await loadBisEntityList();
await loadUkOfsi();
await loadUnConsolidated();
await loadEuConsolidated();

console.log(`\n=== Total rows queued: ${allRows.length} ===`);

// ─── Deduplicate on (source, source_uid) ────────────
const seen = new Set();
const unique = [];
for (const r of allRows) {
  const key = `${r.source}|${r.source_uid}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(r);
}
console.log(`Unique after dedup: ${unique.length}`);

// ─── Clear + bulk insert ────────────────────────────
console.log('\nClearing old rows...');
await sb.from('sanctioned_entities').delete().not('id', 'is', null);

console.log('Inserting...');
const CHUNK = 500;
let inserted = 0;
let errors = 0;
for (let k = 0; k < unique.length; k += CHUNK) {
  const chunk = unique.slice(k, k + CHUNK);
  const { error } = await sb.from('sanctioned_entities').insert(chunk);
  if (error) {
    errors++;
    if (errors < 5) console.log(`  chunk ${k}: ${error.message.slice(0, 200)}`);
  } else {
    inserted += chunk.length;
    if ((k / CHUNK) % 10 === 0) console.log(`  progress: ${inserted} / ${unique.length}`);
  }
}
console.log(`\n✓ Inserted ${inserted} rows (errors: ${errors})`);

// ─── Verify ──────────────────────────────────────────
console.log('\n=== Verification ===');
for (const src of ['ofac_sdn', 'bis_entity', 'uk_hmt', 'un_consolidated', 'eu_consolidated']) {
  const { count } = await sb.from('sanctioned_entities').select('*', { count: 'exact', head: true }).eq('source', src);
  console.log(`  ${src.padEnd(20)} ${count} rows`);
}
