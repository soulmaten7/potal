#!/usr/bin/env node
/**
 * CW36-WCO1: Extract decision trees from chapter_notes.json
 *
 * Strategy:
 * 1. Each chapter note has "does not cover" (exclude) lists → negative rules
 * 2. Each chapter note has "applies to" / "includes" → positive rules
 * 3. Cross-reference headings → routing rules
 * 4. Material/form/use keywords → classification hints
 *
 * Output: config/chapter_decision_trees.json
 */
import fs from 'node:fs';

const CHAPTER_NOTES = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/hs_classification_rules/chapter_notes.json', 'utf-8'));
const SUBHEADING_NOTES = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/hs_classification_rules/subheading_notes.json', 'utf-8'));

// ─── Keyword dictionaries for property extraction ───

const MATERIAL_INDICATORS = {
  cotton: ['cotton', 'baumwolle'], wool: ['wool', 'wolle'], silk: ['silk', 'seide'],
  leather: ['leather', 'leder', 'cuir'], rubber: ['rubber', 'caoutchouc'],
  plastic: ['plastic', 'plastics'], glass: ['glass'], ceramic: ['ceramic', 'ceramics'],
  wood: ['wood', 'timber'], paper: ['paper', 'paperboard'], iron: ['iron', 'steel'],
  copper: ['copper'], aluminium: ['aluminium', 'aluminum'], zinc: ['zinc'],
  nickel: ['nickel'], tin: ['tin'], lead: ['lead'], textile: ['textile', 'textiles'],
  vegetable: ['vegetable'], mineral: ['mineral'], chemical: ['chemical'],
  pharmaceutical: ['pharmaceutical'], meat: ['meat'], fish: ['fish'],
  dairy: ['dairy', 'milk'], fruit: ['fruit'], cereal: ['cereal', 'cereals'],
};

const FORM_INDICATORS = {
  knitted: ['knitted', 'crocheted', 'knit'], woven: ['woven', 'weave'],
  raw: ['raw', 'crude', 'unprocessed'], processed: ['processed', 'prepared'],
  frozen: ['frozen'], dried: ['dried'], canned: ['preserved', 'canned'],
  liquid: ['liquid'], powder: ['powder', 'ground'], sheet: ['sheet', 'plate'],
  tube: ['tube', 'pipe'], wire: ['wire'], bar: ['bar', 'rod'],
  cast: ['cast', 'casting'], forged: ['forged'], rolled: ['rolled'],
};

const USE_INDICATORS = {
  clothing: ['garments', 'clothing', 'apparel', 'wearing apparel'],
  industrial: ['industrial', 'machinery', 'machine'],
  medical: ['medical', 'surgical', 'pharmaceutical', 'medicament'],
  food: ['food', 'edible', 'preparations of meat', 'preparations of fish'],
  agriculture: ['agriculture', 'agricultural', 'horticultural'],
  construction: ['construction', 'building'],
  transport: ['vehicle', 'aircraft', 'ship', 'vessel', 'railway'],
  packaging: ['packing', 'packaging', 'container'],
};

// ─── Extraction functions ───

function extractExcludeRules(noteText) {
  const excludes = [];
  // Pattern: "does not cover:" followed by lettered list
  const excludeBlock = noteText.match(/does not cover[:\s]*\n([\s\S]*?)(?=\n\d+\.|\n---|\n##|$)/i);
  if (!excludeBlock) return excludes;

  const items = excludeBlock[1].matchAll(/[a-z]\)\s*(.+?)(?=\n\s*[a-z]\)|\n\d+\.|\n---|$)/gs);
  for (const item of items) {
    const text = item[1].trim().replace(/\s+/g, ' ');
    const headingRefs = [...text.matchAll(/heading (\d{4})/gi)].map(m => m[1]);
    excludes.push({ text: text.slice(0, 200), redirectHeadings: headingRefs });
  }
  return excludes;
}

function extractIncludeRules(noteText) {
  const includes = [];
  // Pattern: "applies only to" / "covers" / "includes"
  const applyMatch = noteText.match(/(?:applies only to|covers|includes)\s+(.+?)(?:\.\s|\n\d+\.)/i);
  if (applyMatch) {
    includes.push({ text: applyMatch[1].trim().slice(0, 200) });
  }
  return includes;
}

function extractMaterialHints(noteText) {
  const found = new Set();
  const lower = noteText.toLowerCase();
  for (const [mat, keywords] of Object.entries(MATERIAL_INDICATORS)) {
    if (keywords.some(k => lower.includes(k))) found.add(mat);
  }
  return [...found];
}

function extractFormHints(noteText) {
  const found = new Set();
  const lower = noteText.toLowerCase();
  for (const [form, keywords] of Object.entries(FORM_INDICATORS)) {
    if (keywords.some(k => lower.includes(k))) found.add(form);
  }
  return [...found];
}

function extractUseHints(noteText) {
  const found = new Set();
  const lower = noteText.toLowerCase();
  for (const [use, keywords] of Object.entries(USE_INDICATORS)) {
    if (keywords.some(k => lower.includes(k))) found.add(use);
  }
  return [...found];
}

function extractHeadingCrossRefs(noteText) {
  const refs = new Set();
  for (const m of noteText.matchAll(/heading (\d{4})/gi)) refs.add(m[1]);
  return [...refs];
}

// ─── Build chapter decision trees ───

const trees = {};
let totalNodes = 0;

for (const ch of CHAPTER_NOTES) {
  const note = ch.chapter_note || '';
  if (note.length < 30) continue;

  const excludes = extractExcludeRules(note);
  const includes = extractIncludeRules(note);
  const materials = extractMaterialHints(note);
  const forms = extractFormHints(note);
  const uses = extractUseHints(note);
  const crossRefs = extractHeadingCrossRefs(note);

  // Only create tree if we have actionable rules
  const hasRules = excludes.length > 0 || includes.length > 0 || materials.length > 0;
  if (!hasRules) continue;

  // Build decision node structure
  const rootNodes = [];

  // Include rules → positive classification
  for (const inc of includes) {
    rootNodes.push({
      type: 'include',
      condition: inc.text,
      action: 'classify_in_chapter',
      chapter: ch.chapter_code,
    });
  }

  // Exclude rules → redirect to other headings
  for (const exc of excludes) {
    rootNodes.push({
      type: 'exclude',
      condition: exc.text,
      redirectHeadings: exc.redirectHeadings,
      action: 'exclude_from_chapter',
    });
  }

  const nodeCount = rootNodes.length;
  totalNodes += nodeCount;

  trees[ch.chapter_code] = {
    chapter: ch.chapter_code,
    description: ch.description,
    noteLength: note.length,
    rules: rootNodes,
    materialHints: materials,
    formHints: forms,
    useHints: uses,
    crossRefHeadings: crossRefs,
    ruleCount: nodeCount,
  };
}

// Add subheading notes
for (const sh of SUBHEADING_NOTES) {
  const code = sh.chapter_code;
  if (trees[code] && sh.subheading_note) {
    trees[code].subheadingNote = sh.subheading_note.slice(0, 500);
    trees[code].hasSubheadingRules = true;
  }
}

// ─── Output ───

const output = {
  source: 'chapter_notes.json + subheading_notes.json',
  compiled_at: new Date().toISOString(),
  total_chapters: Object.keys(trees).length,
  total_rules: totalNodes,
  chapters: trees,
};

fs.writeFileSync('config/chapter_decision_trees.json', JSON.stringify(output, null, 2));

// Summary
console.log('━━ CW36-WCO1 Decision Tree Extraction ━━\n');
console.log(`Chapters with trees: ${Object.keys(trees).length} / 96`);
console.log(`Total rules extracted: ${totalNodes}`);
console.log(`\nBy rule count:`);
const sorted = Object.values(trees).sort((a, b) => b.ruleCount - a.ruleCount);
for (const t of sorted.slice(0, 15)) {
  console.log(`  Ch ${t.chapter}: ${t.description.slice(0, 35).padEnd(37)} — ${t.ruleCount} rules, mat=[${t.materialHints.join(',')}], form=[${t.formHints.join(',')}]`);
}
console.log(`\nMaterial coverage: ${Object.values(trees).filter(t => t.materialHints.length > 0).length} chapters`);
console.log(`Form coverage: ${Object.values(trees).filter(t => t.formHints.length > 0).length} chapters`);
console.log(`Use coverage: ${Object.values(trees).filter(t => t.useHints.length > 0).length} chapters`);
console.log(`Subheading rules: ${Object.values(trees).filter(t => t.hasSubheadingRules).length} chapters`);
