/**
 * Phase 1: Build 9field_reference.json
 * Extracts ALL constant data from v3 pipeline TypeScript files
 * Usage: npx tsx scripts/build_9field_reference.ts
 */
import * as fs from 'fs';

// We'll read the TypeScript source files and extract constants via regex
// This avoids import issues with modules that have side effects

const BASE = 'app/lib/cost-engine/gri-classifier';
const STEPS = `${BASE}/steps/v3`;
const DATA = `${BASE}/data`;
const OUTPUT = `${BASE}/data/9field_reference.json`;
const BACKUP = '/Volumes/soulmaten/POTAL/7field_benchmark/9field_reference.json';

function readFile(path: string): string {
  try { return fs.readFileSync(path, 'utf-8'); }
  catch { console.log(`⚠️ File not found: ${path}`); return ''; }
}

// Extract JS object/array literal from source between matching braces
function extractConstant(source: string, name: string): string | null {
  // Match: const NAME = { ... } or const NAME = [ ... ] or const NAME: Type = { ... }
  const patterns = [
    new RegExp(`(?:const|export const)\\s+${name}[^=]*=\\s*`, 'g'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) continue;
    const start = match.index + match[0].length;
    const opener = source[start];
    if (opener !== '{' && opener !== '[' && opener !== "'") continue;

    if (opener === '{' || opener === '[') {
      const closer = opener === '{' ? '}' : ']';
      let depth = 0;
      let end = start;
      for (let i = start; i < source.length; i++) {
        if (source[i] === opener) depth++;
        else if (source[i] === closer) { depth--; if (depth === 0) { end = i + 1; break; } }
      }
      return source.substring(start, end);
    }
  }
  return null;
}

// Parse TypeScript object literal to JSON (simplified)
function tsToJson(ts: string): any {
  try {
    // Remove TypeScript-specific syntax
    let cleaned = ts
      .replace(/\/\/.*$/gm, '') // remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
      .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
      .replace(/(\w+)\s*:/g, '"$1":') // quote property names
      .replace(/:\s*'([^']*)'/g, ': "$1"') // single quotes to double
      .replace(/`[^`]*`/g, '""') // template literals to empty string
      ;
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

console.log('═══ Phase 1: Building 9field_reference.json ═══\n');

const reference: any = {
  version: 'v3.1',
  created: '2026-03-20',
  description: 'POTAL v3 pipeline complete reference data for 9-field extraction',
};

// ── step0-input.ts ──
console.log('Reading step0-input.ts...');
const step0 = readFile(`${STEPS}/step0-input.ts`);

// Extract MATERIAL_KEYWORDS
const matKwMatch = step0.match(/const MATERIAL_KEYWORDS[^=]*=\s*\{/);
if (matKwMatch) {
  const startIdx = step0.indexOf('{', matKwMatch.index!);
  let depth = 0, endIdx = startIdx;
  for (let i = startIdx; i < step0.length; i++) {
    if (step0[i] === '{') depth++;
    if (step0[i] === '}') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
  }
  const raw = step0.substring(startIdx, endIdx);
  // Parse manually — extract key: [values] pairs
  const materialKeywords: Record<string, string[]> = {};
  const entryRegex = /(\w+)\s*:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = entryRegex.exec(raw)) !== null) {
    const key = m[1];
    const vals = m[2].match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
    materialKeywords[key] = vals;
  }
  reference.material_keywords = {
    description: 'Material keyword groups. Maps primary material names to variant spellings.',
    count: Object.keys(materialKeywords).length,
    data: materialKeywords,
  };
  console.log(`  MATERIAL_KEYWORDS: ${Object.keys(materialKeywords).length} groups`);
}

// Extract PROCESSING_KEYWORDS
const procKwMatch = step0.match(/const PROCESSING_KEYWORDS\s*=\s*\[/);
if (procKwMatch) {
  const startIdx = step0.indexOf('[', procKwMatch.index!);
  const endIdx = step0.indexOf('];', startIdx) + 1;
  const raw = step0.substring(startIdx, endIdx);
  const keywords = raw.match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
  reference.processing_keywords = {
    description: 'Processing/manufacturing state keywords.',
    count: keywords.length,
    data: keywords,
  };
  console.log(`  PROCESSING_KEYWORDS: ${keywords.length} keywords`);
}

// ── step2-1-section-candidate.ts ──
console.log('Reading step2-1-section-candidate.ts...');
const step21 = readFile(`${STEPS}/step2-1-section-candidate.ts`);

// MATERIAL_TO_SECTION — parse manually
const matSecEntries: Record<string, any> = {};
const matSecRegex = /(\w+)\s*:\s*\[\s*\{[^}]*section:\s*(\d+)[^}]*score:\s*([\d.]+)/g;
let matSecMatch;
const matSecBlock = step21.substring(step21.indexOf('MATERIAL_TO_SECTION'), step21.indexOf('CATEGORY_TO_SECTION'));
while ((matSecMatch = matSecRegex.exec(matSecBlock)) !== null) {
  const mat = matSecMatch[1];
  if (!matSecEntries[mat]) matSecEntries[mat] = [];
  matSecEntries[mat].push({ section: parseInt(matSecMatch[2]), score: parseFloat(matSecMatch[3]) });
}
reference.material_to_section = {
  description: 'Material → HS Section mapping with confidence scores.',
  count: Object.keys(matSecEntries).length,
  data: matSecEntries,
};
console.log(`  MATERIAL_TO_SECTION: ${Object.keys(matSecEntries).length} materials`);

// CATEGORY_TO_SECTION
const catSecEntries: Record<string, any> = {};
const catSecRegex = /(\w+)\s*:\s*\{\s*section:\s*(\d+),\s*score:\s*([\d.]+)\s*\}/g;
const catSecBlock = step21.substring(step21.indexOf('CATEGORY_TO_SECTION'));
let catSecMatch;
while ((catSecMatch = catSecRegex.exec(catSecBlock)) !== null) {
  catSecEntries[catSecMatch[1]] = { section: parseInt(catSecMatch[2]), score: parseFloat(catSecMatch[3]) };
}
reference.category_to_section = {
  description: 'Category keyword → HS Section mapping.',
  count: Object.keys(catSecEntries).length,
  data: catSecEntries,
};
console.log(`  CATEGORY_TO_SECTION: ${Object.keys(catSecEntries).length} keywords`);

// PASSIVE_ACCESSORY_WORDS
const passiveMatch = step21.match(/PASSIVE_ACCESSORY_WORDS\s*=\s*\[([^\]]+)\]/);
if (passiveMatch) {
  const words = passiveMatch[1].match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
  reference.passive_accessory_words = {
    description: 'Passive accessory words — when present, material overrides electronics category.',
    data: words,
  };
  console.log(`  PASSIVE_ACCESSORY_WORDS: ${words.length} words`);
}

// ── step2-3-chapter-candidate.ts ──
console.log('Reading step2-3-chapter-candidate.ts...');
const step23 = readFile(`${STEPS}/step2-3-chapter-candidate.ts`);

const articleMatch = step23.match(/ARTICLE_KEYWORDS\s*=\s*\[([^\]]+)\]/);
if (articleMatch) {
  const words = articleMatch[1].match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
  reference.article_keywords = {
    description: 'Article keywords — indicate finished products (vs raw materials) for Section XV chapter selection.',
    data: words,
  };
  console.log(`  ARTICLE_KEYWORDS: ${words.length} keywords`);
}

// ── step3-heading.ts ──
console.log('Reading step3-heading.ts...');
const step3 = readFile(`${STEPS}/step3-heading.ts`);

// KEYWORD_TO_HEADINGS
const kwHeadings: Record<string, string[]> = {};
const kwHRegex = /'([^']+)'\s*:\s*\[([^\]]+)\]/g;
const kwHBlock = step3.substring(step3.indexOf('KEYWORD_TO_HEADINGS'), step3.indexOf('};', step3.indexOf('KEYWORD_TO_HEADINGS')) + 2);
let kwHMatch;
while ((kwHMatch = kwHRegex.exec(kwHBlock)) !== null) {
  const key = kwHMatch[1];
  const vals = kwHMatch[2].match(/'([^']+)'/g)?.map(v => v.replace(/'/g, '')) || [];
  kwHeadings[key] = vals;
}
reference.keyword_to_headings = {
  description: 'Product keyword → Heading code(s) mapping. Seller vocabulary → HS 4-digit heading.',
  count: Object.keys(kwHeadings).length,
  data: kwHeadings,
};
console.log(`  KEYWORD_TO_HEADINGS: ${Object.keys(kwHeadings).length} keywords`);

// ── step4-subheading.ts ──
console.log('Reading step4-subheading.ts...');
const step4 = readFile(`${STEPS}/step4-subheading.ts`);

// SUBHEADING_SYNONYMS
const subSynEntries: Record<string, any> = {};
const subSynRegex = /'([^']+)'\s*:\s*(\{[^}]+\}|\d+)/g;
const subSynStart = step4.indexOf('SUBHEADING_SYNONYMS');
if (subSynStart > -1) {
  const subSynEnd = step4.indexOf('};', subSynStart) + 2;
  const subSynBlock = step4.substring(subSynStart, subSynEnd);
  let subMatch;
  while ((subMatch = subSynRegex.exec(subSynBlock)) !== null) {
    const key = subMatch[1];
    const val = subMatch[2].trim();
    if (val.startsWith('{')) {
      // Complex entry with conditions
      subSynEntries[key] = val;
    } else {
      subSynEntries[key] = parseInt(val);
    }
  }
}
reference.subheading_synonyms = {
  description: 'Subheading synonym dictionary. Seller product keywords → 6-digit HS codes.',
  count: Object.keys(subSynEntries).length,
  data: subSynEntries,
};
console.log(`  SUBHEADING_SYNONYMS: ${Object.keys(subSynEntries).length} entries`);

// ── data/ files ──
console.log('\nReading data/ files...');

// heading-descriptions.ts
const hdFile = readFile(`${DATA}/heading-descriptions.ts`);
const headingDescs: Record<string, string> = {};
const hdRegex = /'(\d{4})'\s*:\s*'([^']+)'/g;
let hdMatch;
while ((hdMatch = hdRegex.exec(hdFile)) !== null) {
  headingDescs[hdMatch[1]] = hdMatch[2];
}
reference.heading_descriptions = {
  description: '1,233 Heading codes → official HS description text.',
  count: Object.keys(headingDescs).length,
  data: headingDescs,
};
console.log(`  HEADING_DESCRIPTIONS: ${Object.keys(headingDescs).length} headings`);

// heading-method-tags.ts
const hmtFile = readFile(`${DATA}/heading-method-tags.ts`);
const methodTags: Record<string, string> = {};
const hmtRegex = /'(\d{4})'\s*:\s*'(\w+)'/g;
let hmtMatch;
while ((hmtMatch = hmtRegex.exec(hmtFile)) !== null) {
  methodTags[hmtMatch[1]] = hmtMatch[2];
}
reference.heading_method_tags = {
  description: 'Heading → matching method tag (elimination/voting/both).',
  count: Object.keys(methodTags).length,
  data: methodTags,
};
console.log(`  HEADING_METHOD_TAGS: ${Object.keys(methodTags).length} tags`);

// section-notes.ts
const snFile = readFile(`${DATA}/section-notes.ts`);
const sectionNotes: any[] = [];
const snRegex = /\{\s*section_number:\s*(\d+)[^}]*title:\s*'([^']+)'[^}]*section_note:\s*'([^']*(?:\\.[^']*)*)'/g;
let snMatch;
while ((snMatch = snRegex.exec(snFile)) !== null) {
  sectionNotes.push({ section: parseInt(snMatch[1]), title: snMatch[2], note_preview: snMatch[3].substring(0, 200) });
}
reference.section_notes = {
  description: 'Section Notes — legal rules for each of 21 HS Sections.',
  count: sectionNotes.length,
  data: sectionNotes,
};
console.log(`  SECTION_NOTES: ${sectionNotes.length} sections`);

// codified-rules.ts — count rules
const crFile = readFile(`${DATA}/codified-rules.ts`);
const ruleCount = (crFile.match(/source:\s*'/g) || []).length;
reference.codified_rules_summary = {
  description: `${ruleCount} codified Section/Chapter Notes rules (exclusion, inclusion, threshold, material_condition, definition, ai_required).`,
  count: ruleCount,
  note: 'Full rules data too large for reference file. Rules are applied in step2-2 and step2-4.',
};
console.log(`  CODIFIED_RULES: ${ruleCount} rules (summary only — too large for full inclusion)`);

// codified-headings.ts — check structure
const chFile = readFile(`${DATA}/codified-headings.ts`);
const headingCondCount = (chFile.match(/code:\s*'/g) || []).length;
reference.codified_headings_summary = {
  description: `${headingCondCount} heading conditions with product_type, keywords, material_hint.`,
  count: headingCondCount,
  note: 'Full data too large. Used in step3 heading selection.',
};
console.log(`  CODIFIED_HEADINGS: ${headingCondCount} heading conditions (summary only)`);

// codified-subheadings.ts
const csFile = readFile(`${DATA}/codified-subheadings.ts`);
const subCondCount = (csFile.match(/code:\s*'/g) || []).length;
reference.codified_subheadings_summary = {
  description: `${subCondCount} subheading conditions with keywords.`,
  count: subCondCount,
  note: 'Full data too large. Used in step4 subheading selection.',
};
console.log(`  CODIFIED_SUBHEADINGS: ${subCondCount} subheading conditions (summary only)`);

// ── Write output ──
const jsonStr = JSON.stringify(reference, null, 2);
const sizeKB = Math.round(jsonStr.length / 1024);
const approxTokens = Math.round(jsonStr.length / 4); // ~4 chars per token

console.log(`\n═══ Reference File Stats ═══`);
console.log(`Size: ${sizeKB} KB`);
console.log(`Approx tokens: ${approxTokens} (~${Math.round(approxTokens / 1000)}K)`);
console.log(`Sections: ${Object.keys(reference).length}`);

if (approxTokens > 120000) {
  console.log(`⚠️ Exceeds 128K token limit — need to trim heading_descriptions`);
  // Trim heading descriptions to keywords only
  const trimmed: Record<string, string> = {};
  for (const [code, desc] of Object.entries(reference.heading_descriptions.data as Record<string, string>)) {
    trimmed[code] = desc.substring(0, 60); // First 60 chars only
  }
  reference.heading_descriptions.data = trimmed;
  reference.heading_descriptions.note = 'Descriptions trimmed to 60 chars to fit context window.';
  const newSize = JSON.stringify(reference, null, 2).length;
  console.log(`  Trimmed size: ${Math.round(newSize / 1024)} KB, ~${Math.round(newSize / 4000)}K tokens`);
}

fs.writeFileSync(OUTPUT, jsonStr);
console.log(`\n✅ Saved: ${OUTPUT}`);

// Backup
try {
  fs.writeFileSync(BACKUP, jsonStr);
  console.log(`✅ Backup: ${BACKUP}`);
} catch { console.log('⚠️ Backup location not available'); }
