#!/usr/bin/env node
/**
 * CW34-S3-C Silver Normalization
 *
 * Bronze → Silver 변환. 3개 소스:
 *   1. unified_rulings.jsonl (575K) → silver/unified.jsonl       (Silver 베이스)
 *   2. ebti_rulings.csv (231K)      → silver/ebti_enrichment.jsonl (보강 필드)
 *   3. batches/*.json (39K)         → silver/cross_enrichment.jsonl (보강 필드)
 *
 * Usage:
 *   node scripts/warehouse/build-silver.mjs                # 전부
 *   node scripts/warehouse/build-silver.mjs --source unified  # 한 소스만
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Papa = require('papaparse');

const BRONZE = '/Volumes/soulmaten/POTAL/warehouse/bronze';
const SILVER = '/Volumes/soulmaten/POTAL/warehouse/silver';
const MANIFEST = `${BRONZE}/_manifest.jsonl`;

fs.mkdirSync(SILVER, { recursive: true });

// ─── Normalizers (inline) ───

function nfkc(text) {
  if (!text) return '';
  return String(text).normalize('NFKC');
}

function stripCrlf(text) {
  return String(text).replace(/\r\n?/g, '\n');
}

// Mojibake fixes (Latin-1 misread as UTF-8)
const MOJIBAKE = [
  [/Ã¤/g, 'ä'], [/Ã¶/g, 'ö'], [/Ã¼/g, 'ü'], [/ÃŸ/g, 'ß'],
  [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ã /g, 'à'], [/â‚¬/g, '€'], [/Â£/g, '£'],
];
function fixMojibake(text) {
  let t = text;
  for (const [pat, rep] of MOJIBAKE) t = t.replace(pat, rep);
  return t;
}

// OCR corrections (universal)
const OCR_FIXES = [
  [/\bl(\d)/g, '1$1'],  // l0% → 10%
  [/\bO(%)/g, '0$1'],   // O% → 0%
];
function fixOcr(text) {
  let t = text;
  for (const [pat, rep] of OCR_FIXES) t = t.replace(pat, rep);
  return t;
}

// Date: DD/MM/YYYY → YYYY-MM-DD
function parseDateDDMMYYYY(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
  // DD.MM.YYYY
  const m2 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  return null;
}

// Date: ISO-ish "2009-10-14T02:00:00" → "2009-10-14"
function parseDateISO(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// HS code: strip asterisks + dots, extract digits only
function normalizeHs(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/[^\d]/g, '');
  // EBTI: "7326909890************" → match digits before asterisks
  const m = String(raw).match(/^(\d{4,10})/);
  return m ? m[1] : digits.slice(0, 10);
}

// Strip ruling reference suffixes: "; NY N026477 affirmed" → removed
function stripRulingRef(text) {
  return text.replace(/;\s*(NY|HQ)\s+[A-Z]?\d{5,}.*$/i, '').trim();
}

// hs6 padding: 5→6 digits
function padHs6(raw) {
  let s = String(raw || '').trim();
  if (s.length === 5) s = '0' + s;
  return /^\d{6}$/.test(s) ? s : null;
}

// ─── Source 1: Unified (575K JSONL → Silver base) ───

async function buildUnified() {
  const bronzePath = `${BRONZE}/unified/2026-04-14/unified_rulings.jsonl`;
  if (!fs.existsSync(bronzePath)) throw new Error(`Missing: ${bronzePath}`);

  const out = fs.createWriteStream(`${SILVER}/unified.jsonl`);
  const rl = readline.createInterface({
    input: fs.createReadStream(bronzePath, 'utf-8'),
    crlfDelay: Infinity,
  });

  let count = 0, skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { skipped++; continue; }

    // source → country mapping
    const src = String(obj.source || '');
    let countryCode, canonicalSource;
    if (src.startsWith('cbp_cross')) {
      countryCode = 'US';
      canonicalSource = src === 'cbp_cross_search' ? 'cbp_cross_search' : 'cbp_cross';
    } else if (src.startsWith('eu_ebti')) {
      countryCode = 'EU';
      canonicalSource = 'eu_ebti';
    } else {
      skipped++;
      continue;
    }

    // hs6 normalize
    const hs6 = padHs6(obj.hs6);
    if (!hs6) { skipped++; continue; }

    // hts_code: remove dots
    const hsCodeFull = String(obj.hts_code || '').replace(/\./g, '').replace(/\D/g, '') || hs6;

    const chapter = Number(obj.chapter) || Number(hs6.slice(0, 2)) || 0;

    const record = {
      ruling_id: String(obj.ruling_id || ''),
      source: canonicalSource,
      country_code: countryCode,
      jurisdiction: countryCode === 'US' ? 'US' : 'EU',
      product_name: stripRulingRef(nfkc(obj.product_description || '').replace(/[\r\n]+/g, ' ').trim()),
      full_description: nfkc(obj.full_description || obj.product_description || '').replace(/[\r\n]+/g, ' ').trim(),
      hs6,
      hs_code: hsCodeFull,
      chapter,
      material: obj.material || null,
      processing: obj.processing || null,
    };

    out.write(JSON.stringify(record) + '\n');
    count++;
    if (count % 100000 === 0) process.stdout.write(`  unified: ${count.toLocaleString()}...\r`);
  }

  out.end();
  console.log(`  unified: ${count.toLocaleString()} written, ${skipped} skipped`);
  return { count, skipped };
}

// ─── Source 2: EBTI Raw (231K multiline CSV → enrichment) ───

async function buildEbtiEnrichment() {
  const bronzePath = `${BRONZE}/ebti/2026-04-14/ebti_rulings.csv`;
  if (!fs.existsSync(bronzePath)) throw new Error(`Missing: ${bronzePath}`);

  console.log('  Reading EBTI raw CSV (248MB, multiline)...');
  const raw = fs.readFileSync(bronzePath, 'utf-8');
  const cleaned = stripCrlf(fixMojibake(nfkc(raw)));

  console.log('  Parsing with papaparse...');
  const parsed = Papa.parse(cleaned, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`  Parsed ${parsed.data.length.toLocaleString()} rows, ${parsed.errors.length} errors`);

  const out = fs.createWriteStream(`${SILVER}/ebti_enrichment.jsonl`);
  let count = 0, skipped = 0;

  for (const row of parsed.data) {
    const ref = String(row.BTI_REFERENCE || '').trim();
    if (!ref) { skipped++; continue; }

    // ISSUING_COUNTRY: ISO2
    const issuingCountry = String(row.ISSUING_COUNTRY || '').toUpperCase().trim();

    // HS: strip asterisks
    const hsCode = normalizeHs(row.NOMENCLATURE_CODE || '');

    // Dates: DD/MM/YYYY → ISO
    const validFrom = parseDateDDMMYYYY(row.START_DATE_OF_VALIDITY);
    const validTo = parseDateDDMMYYYY(row.END_DATE_OF_VALIDITY);
    const dateOfIssue = parseDateDDMMYYYY(row.DATE_OF_ISSUE);

    // Status
    const statusRaw = String(row.STATUS || '').toUpperCase().trim();
    const status = statusRaw === 'INVALID' ? 'invalid' : 'active';

    // Language
    const language = String(row.LANGUAGE || '').toLowerCase().trim() || null;

    // Keywords
    const keywords = String(row.KEYWORDS || '')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    // Description: normalize
    let description = String(row.DESCRIPTION_OF_GOODS || '');
    description = nfkc(description).replace(/[\r\n]+/g, ' ').trim();
    description = fixOcr(description);

    // Classification justification
    let justification = String(row.CLASSIFICATION_JUSTIFICATION || '');
    justification = nfkc(justification).replace(/[\r\n]+/g, ' ').trim();

    const record = {
      join_key: ref,
      issuing_country: issuingCountry || null,
      hs_code_enriched: hsCode || null,
      valid_from: validFrom,
      valid_to: validTo,
      ruling_date: dateOfIssue,
      status,
      language,
      keywords: keywords.length > 0 ? keywords : null,
      description_enriched: description || null,
      classification_justification: justification || null,
    };

    out.write(JSON.stringify(record) + '\n');
    count++;
    if (count % 50000 === 0) process.stdout.write(`  ebti_enrichment: ${count.toLocaleString()}...\r`);
  }

  out.end();
  console.log(`  ebti_enrichment: ${count.toLocaleString()} written, ${skipped} skipped`);
  return { count, skipped };
}

// ─── Source 3: CROSS Batches (39K JSON → enrichment) ───

async function buildCrossEnrichment() {
  const batchDir = `${BRONZE}/cross/2026-04-14`;
  if (!fs.existsSync(batchDir)) throw new Error(`Missing: ${batchDir}`);

  const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.json')).sort();
  const out = fs.createWriteStream(`${SILVER}/cross_enrichment.jsonl`);
  let count = 0, skipped = 0;

  for (const file of files) {
    const filePath = path.join(batchDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    let arr;
    try { arr = JSON.parse(raw); } catch { console.error(`  Failed to parse ${file}`); continue; }
    if (!Array.isArray(arr)) continue;

    for (const obj of arr) {
      const ref = String(obj.rulingNumber || '').trim();
      if (!ref) { skipped++; continue; }

      // tariffs: ["9305.91.3030"] → strip dots
      const tariffs = Array.isArray(obj.tariffs) ? obj.tariffs : [];
      const allTariffs = tariffs
        .map(t => String(t).replace(/\./g, ''))
        .filter(t => /^\d{6,10}$/.test(t));

      // text: plain text, normalize line breaks
      const fullText = nfkc(String(obj.text || '')).replace(/\r+/g, '\n').trim();
      const fullTextClean = fixOcr(fullText);

      // ruling date
      const rulingDate = parseDateISO(obj.rulingDate);

      const record = {
        join_key: ref,
        full_text_enriched: fullTextClean || null,
        all_tariffs: allTariffs.length > 0 ? allTariffs : null,
        categories: (obj.categories || '').trim() || null,
        collection: obj.collection || null,
        is_usmca: obj.isUsmca === true,
        is_nafta: obj.isNafta === true,
        is_revoked: obj.isRevokedByOperationalLaw === true || obj.operationallyRevoked === true,
        ruling_date: rulingDate,
        subject: (obj.subject || '').trim() || null,
        url: obj.url || null,
      };

      out.write(JSON.stringify(record) + '\n');
      count++;
    }
    process.stdout.write(`  cross_enrichment: ${file} done (${count.toLocaleString()} total)\r`);
  }

  out.end();
  console.log(`  cross_enrichment: ${count.toLocaleString()} written, ${skipped} skipped`);
  return { count, skipped };
}

// ─── Main ───

const args = process.argv.slice(2);
const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1]
  || (args.includes('--source') ? args[args.indexOf('--source') + 1] : null);

const stats = {};
const targets = sourceArg ? [sourceArg] : ['unified', 'ebti_raw', 'cross_batch'];

console.log('━━ CW34-S3-C Silver Normalization ━━\n');

for (const t of targets) {
  try {
    if (t === 'unified') {
      console.log('▸ Building unified Silver...');
      stats.unified = await buildUnified();
    } else if (t === 'ebti_raw') {
      console.log('▸ Building EBTI enrichment Silver...');
      stats.ebti_enrichment = await buildEbtiEnrichment();
    } else if (t === 'cross_batch') {
      console.log('▸ Building CROSS enrichment Silver...');
      stats.cross_enrichment = await buildCrossEnrichment();
    }
  } catch (e) {
    console.error(`ERROR (${t}):`, e.message);
    stats[t] = { error: e.message };
  }
}

console.log('\n━━ SILVER SUMMARY ━━');
console.log(JSON.stringify(stats, null, 2));

fs.writeFileSync(`${SILVER}/_stats.json`, JSON.stringify({
  ...stats,
  generated_at: new Date().toISOString(),
  pipeline_version: 'cw34-s3-c-v1',
}, null, 2));

console.log(`\nStats written to ${SILVER}/_stats.json`);
