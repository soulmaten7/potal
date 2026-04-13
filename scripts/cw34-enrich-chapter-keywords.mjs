#!/usr/bin/env node
/**
 * CW34: Enrich ch*.ts chapter files with differentiated keywords from
 * codified-subheadings.ts.
 *
 * Problem: ch*.ts has heading-level keywords copy-pasted to all subheadings.
 *   e.g., ch42 420211~420299 all have ['trunks','suitcases','vanity',...]
 * Solution: Replace with subheading-specific keywords + material_hint from
 *   codified-subheadings.ts (5,621 entries with differentiated data).
 *
 * Usage:
 *   node scripts/cw34-enrich-chapter-keywords.mjs --chapter 42   # test one
 *   node scripts/cw34-enrich-chapter-keywords.mjs --all          # apply all
 *   node scripts/cw34-enrich-chapter-keywords.mjs --dry-run      # preview only
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const targetChapter = args.find(a => a.startsWith('--chapter'))?.split('=')[1]
  || (args.includes('--chapter') ? args[args.indexOf('--chapter') + 1] : null);
const doAll = args.includes('--all');
const dryRun = args.includes('--dry-run');

// ─── Load codified-subheadings.ts ─────────────────
const codSrc = fs.readFileSync('app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts', 'utf8');
const codStart = codSrc.indexOf('= {') + 2;
const codEnd = codSrc.lastIndexOf('};') + 1;
const codified = JSON.parse(codSrc.slice(codStart, codEnd));

// Build lookup: code (6-digit) → { keywords, material_hint, description }
const subLookup = new Map();
for (const [heading, entries] of Object.entries(codified)) {
  for (const e of entries) {
    const code6 = String(e.code).replace(/\./g, '');
    subLookup.set(code6, {
      keywords: e.keywords || [],
      material_hint: e.material_hint || [],
      description: e.description || '',
    });
  }
}
console.log(`Loaded codified-subheadings: ${subLookup.size} entries\n`);

// ─── Process a chapter file ───────────────────────
function processChapter(chNum) {
  const pad = String(chNum).padStart(2, '0');
  const filePath = `app/lib/cost-engine/hs-code/chapters/ch${pad}.ts`;
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP: ${filePath} not found`);
    return { updated: 0, total: 0, skipped: 0 };
  }

  let src = fs.readFileSync(filePath, 'utf8');

  // Match each entry: { code: 'XXXXXX', description: '...', chapter: '...', category: '...', keywords: [...] }
  const entryRegex = /\{\s*code:\s*'(\d+)',\s*description:\s*'([^']*)',\s*chapter:\s*'\d+',\s*category:\s*'([^']*)',\s*keywords:\s*\[([^\]]*)\]\s*\}/g;

  let match;
  let updated = 0;
  let total = 0;
  let skipped = 0;
  const replacements = [];

  while ((match = entryRegex.exec(src)) !== null) {
    total++;
    const code = match[1];
    const oldDesc = match[2];
    const category = match[3];
    const oldKwStr = match[4];
    const code6 = code.slice(0, 6);

    const codData = subLookup.get(code6);
    if (!codData || codData.keywords.length === 0) {
      skipped++;
      continue;
    }

    // Build new keywords: codified keywords + material_hint merged (deduped)
    const newKwSet = new Set(codData.keywords);
    for (const mat of codData.material_hint) newKwSet.add(mat);
    const newKwArr = [...newKwSet];

    // Build new keyword string
    const newKwStr = newKwArr.map(k => `'${k.replace(/'/g, "\\'")}'`).join(', ');

    // Use codified description if available and longer
    const newDesc = codData.description.length > oldDesc.length
      ? codData.description.replace(/'/g, "\\'").slice(0, 120)
      : oldDesc;

    const oldEntry = match[0];
    const newEntry = `{ code: '${code}', description: '${newDesc}', chapter: '${pad}', category: '${category}', keywords: [${newKwStr}] }`;

    if (oldEntry !== newEntry) {
      replacements.push({ code, oldKw: oldKwStr.trim().slice(0, 60), newKw: newKwStr.slice(0, 80) });
      src = src.replace(oldEntry, newEntry);
      updated++;
    }
  }

  if (!dryRun && updated > 0) {
    fs.writeFileSync(filePath, src);
  }

  return { updated, total, skipped, replacements };
}

// ─── Main ─────────────────────────────────────────
if (targetChapter) {
  console.log(`Processing ch${targetChapter.padStart(2, '0')}.ts ${dryRun ? '(DRY RUN)' : ''}...`);
  const result = processChapter(targetChapter);
  console.log(`  Total entries: ${result.total}`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Skipped (no codified data): ${result.skipped}`);
  if (result.replacements) {
    console.log(`\n  Changes:`);
    for (const r of result.replacements) {
      console.log(`    ${r.code}: ${r.oldKw}...`);
      console.log(`         → ${r.newKw}...`);
    }
  }
} else if (doAll) {
  console.log(`Processing ALL chapters ${dryRun ? '(DRY RUN)' : ''}...\n`);
  let totalUpdated = 0;
  let totalEntries = 0;
  for (let ch = 1; ch <= 99; ch++) {
    const pad = String(ch).padStart(2, '0');
    const filePath = `app/lib/cost-engine/hs-code/chapters/ch${pad}.ts`;
    if (!fs.existsSync(filePath)) continue;
    const result = processChapter(ch);
    if (result.updated > 0) {
      console.log(`  ch${pad}: ${result.updated}/${result.total} updated`);
    }
    totalUpdated += result.updated;
    totalEntries += result.total;
  }
  console.log(`\n  TOTAL: ${totalUpdated}/${totalEntries} entries updated across all chapters`);
} else {
  console.log('Usage:');
  console.log('  node scripts/cw34-enrich-chapter-keywords.mjs --chapter 42');
  console.log('  node scripts/cw34-enrich-chapter-keywords.mjs --all');
  console.log('  node scripts/cw34-enrich-chapter-keywords.mjs --all --dry-run');
}
