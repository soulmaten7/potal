#!/usr/bin/env node
/**
 * CW34-S3-B Bronze Ingestion
 *
 * 외장하드 원본 → /Volumes/soulmaten/POTAL/warehouse/bronze/{source}/{YYYY-MM-DD}/
 * SHA256 + row count 를 _manifest.jsonl 에 append.
 *
 * 재실행 시: 이미 같은 hash 가 manifest 에 있으면 skip (idempotent).
 *
 * Usage:
 *   node scripts/warehouse/ingest-bronze.mjs                  # 전부
 *   node scripts/warehouse/ingest-bronze.mjs --source ebti_raw # 한 소스만
 *   node scripts/warehouse/ingest-bronze.mjs --dry-run         # 복사 없이 계획만
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import readline from 'node:readline';

const POTAL_ROOT = '/Volumes/soulmaten/POTAL';
const BRONZE_ROOT = `${POTAL_ROOT}/warehouse/bronze`;
const MANIFEST = `${BRONZE_ROOT}/_manifest.jsonl`;
const TODAY = new Date().toISOString().slice(0, 10);

// S2.5 실측 반영: 3개 소스. unified 경로 수정 (7field_benchmark 내)
const SOURCES = {
  ebti_raw: {
    label: 'EU BTI raw (15 cols)',
    bronzeDir: 'ebti',
    files: [
      { src: `${POTAL_ROOT}/regulations/eu_ebti/ebti_rulings.csv`, format: 'csv' },
    ],
  },
  cross_batch: {
    label: 'US CBP CROSS batches (full text)',
    bronzeDir: 'cross',
    dir: `${POTAL_ROOT}/regulations/us/cross_rulings/batches`,
    format: 'json',
  },
  unified: {
    label: 'Unified rulings (Silver-direct base)',
    bronzeDir: 'unified',
    files: [
      { src: `${POTAL_ROOT}/7field_benchmark/unified_rulings.jsonl`, format: 'jsonl' },
    ],
  },
};

// ─── Helpers ───

function sha256File(filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filepath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function countLines(filepath) {
  let count = 0;
  const rl = readline.createInterface({ input: createReadStream(filepath), crlfDelay: Infinity });
  for await (const _ of rl) count++;
  return count;
}

async function countRows(filepath, format) {
  if (format === 'csv') {
    const lines = await countLines(filepath);
    return Math.max(0, lines - 1); // header excluded
  }
  if (format === 'jsonl') {
    return countLines(filepath);
  }
  if (format === 'json') {
    const content = fs.readFileSync(filepath, 'utf-8');
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch {
      return 0;
    }
  }
  return 0;
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return [];
  return fs.readFileSync(MANIFEST, 'utf-8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
}

function appendManifest(entry) {
  fs.appendFileSync(MANIFEST, JSON.stringify(entry) + '\n');
}

function listDirectory(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => !f.startsWith('.'))
    .sort()
    .map(f => path.join(dir, f));
}

// ─── Ingestion ───

async function ingestSource(sourceKey, dryRun) {
  const def = SOURCES[sourceKey];
  if (!def) throw new Error(`Unknown source: ${sourceKey}`);
  console.log(`\n━━ Ingesting ${def.label} (${sourceKey}) ━━`);

  const existing = readManifest();
  const existingHashes = new Set(existing.map(e => e.sha256));

  // Build file list
  let fileList;
  if (def.files) {
    fileList = def.files;
  } else {
    fileList = listDirectory(def.dir).map(src => ({ src, format: def.format }));
  }

  let copied = 0, skipped = 0, failed = 0;

  for (const f of fileList) {
    if (!fs.existsSync(f.src)) {
      console.log(`  ❌ Missing: ${f.src}`);
      failed++;
      continue;
    }

    const hash = await sha256File(f.src);
    if (existingHashes.has(hash)) {
      console.log(`  ⊝ Skip (hash exists): ${path.basename(f.src)}`);
      skipped++;
      continue;
    }

    const size = fs.statSync(f.src).size;
    const dst = `${BRONZE_ROOT}/${def.bronzeDir}/${TODAY}/${path.basename(f.src)}`;

    if (dryRun) {
      console.log(`  [dry-run] → ${dst} (${(size / 1024 / 1024).toFixed(1)}MB)`);
      copied++;
      continue;
    }

    // Copy
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(f.src, dst);

    // Count rows (after copy to not block on large files unnecessarily if copy fails)
    const rows = await countRows(f.src, f.format);

    const entry = {
      source: sourceKey,
      filename: path.basename(f.src),
      bronze_path: dst,
      format: f.format,
      sha256: hash,
      row_count: rows,
      size_bytes: size,
      ingested_at: new Date().toISOString(),
    };
    appendManifest(entry);
    console.log(`  ✅ ${path.basename(f.src)} — ${rows.toLocaleString()} rows, ${(size / 1024 / 1024).toFixed(1)}MB`);
    copied++;
  }

  console.log(`  Summary: ${copied} copied, ${skipped} skipped, ${failed} failed`);
  return { copied, skipped, failed };
}

// ─── Main ───

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1]
  || (args.includes('--source') ? args[args.indexOf('--source') + 1] : null);

const targets = sourceArg ? [sourceArg] : Object.keys(SOURCES);
const totals = { copied: 0, skipped: 0, failed: 0 };

for (const key of targets) {
  try {
    const r = await ingestSource(key, dryRun);
    totals.copied += r.copied;
    totals.skipped += r.skipped;
    totals.failed += r.failed;
  } catch (e) {
    console.error(`  ERROR ${key}:`, e.message);
    totals.failed++;
  }
}

console.log('\n━━ TOTAL ━━');
console.log(`  copied:  ${totals.copied}`);
console.log(`  skipped: ${totals.skipped}`);
console.log(`  failed:  ${totals.failed}`);
if (dryRun) console.log('\n[DRY RUN — no files actually copied]');
process.exit(totals.failed > 0 ? 1 : 0);
