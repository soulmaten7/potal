/**
 * Conflict Resolution Engine — selects the correct heading from 3-10 competing candidates.
 *
 * 6 strategies combined with weighted scoring:
 * 1. Keyword specificity scoring
 * 2. Chapter Note rule application
 * 3. Material/form/use matching
 * 4. GRI 3(a) specificity judgment
 * 5. Expert rules pattern matching (476 verified rules)
 * 6. Conflict patterns data (1,563 patterns from CBP+EBTI)
 */

import { HEADING_DESCRIPTIONS, getHeadingsForChapter } from './data/heading-descriptions';
import { getChapterNote, parseChapterNoteRules } from './data/chapter-notes';
import { findMatchingPattern } from './data/conflict-patterns';
import { normalize, stemBasic, scoreMatch, expandSynonyms } from './utils/text-matching';

// ─── Types ─────────────────────────────────

export interface ConflictInput {
  productName: string;
  productUnderstood?: string;
  material?: string;
  productType?: string;
  keywords: string[];
  chapter: number;
  candidateHeadings: string[]; // 4-digit codes
}

export interface ConflictResult {
  selectedHeading: string;
  confidence: number;
  reasoning: string;
  strategyScores: Record<string, { heading: string; score: number }>;
  gri_rule: string;
}

// ─── Material/Form/Use dictionaries ─────────

const MATERIAL_KEYWORDS: Record<string, string[]> = {
  iron: ['iron', 'steel', 'ferrous', 'stainless'],
  copper: ['copper', 'brass', 'bronze', 'cupro'],
  aluminum: ['aluminum', 'aluminium', 'alloy'],
  nickel: ['nickel', 'monel', 'inconel'],
  lead: ['lead', 'plumbum'],
  zinc: ['zinc', 'galvanized'],
  tin: ['tin', 'tinplate'],
  wood: ['wood', 'wooden', 'timber', 'lumber', 'plywood', 'fibreboard'],
  cotton: ['cotton', 'denim'],
  wool: ['wool', 'worsted', 'cashmere'],
  silk: ['silk', 'silken'],
  synthetic: ['polyester', 'nylon', 'acrylic', 'polypropylene', 'polyethylene', 'synthetic', 'man-made'],
  rubber: ['rubber', 'latex', 'vulcanized', 'elastomer'],
  plastic: ['plastic', 'polymer', 'resin', 'pvc', 'polycarbonate'],
  leather: ['leather', 'hide', 'skin', 'suede', 'chamois'],
  glass: ['glass', 'crystal', 'vitreous', 'glazed'],
  ceramic: ['ceramic', 'porcelain', 'earthenware', 'stoneware', 'terracotta', 'terra cotta'],
  paper: ['paper', 'cardboard', 'paperboard', 'pulp'],
  gold: ['gold', 'gilt', 'gilded'],
  silver: ['silver', 'sterling'],
  platinum: ['platinum', 'palladium', 'rhodium'],
};

const FORM_KEYWORDS: Record<string, string[]> = {
  bars_rods: ['bar', 'bars', 'rod', 'rods', 'billet', 'ingot', 'bloom'],
  wire: ['wire', 'cable', 'conductor', 'filament'],
  tubes_pipes: ['tube', 'tubes', 'pipe', 'pipes', 'hollow', 'conduit'],
  sheets_plates: ['sheet', 'plate', 'foil', 'strip', 'flat-rolled', 'coil'],
  powder: ['powder', 'granule', 'flake', 'pellet'],
  liquid: ['liquid', 'solution', 'suspension', 'emulsion', 'oil'],
  woven: ['woven', 'weave', 'fabric', 'textile', 'cloth'],
  knitted: ['knitted', 'knit', 'crocheted', 'jersey'],
  garment: ['shirt', 'jacket', 'pants', 'dress', 'coat', 'sweater', 'vest', 'blouse', 'skirt', 'trousers'],
  scrap_waste: ['scrap', 'waste', 'used', 'residue', 'spent', 'worn', 'refuse'],
  finished: ['article', 'product', 'finished', 'manufactured', 'assembled'],
};

const USE_KEYWORDS: Record<string, string[]> = {
  vehicle: ['vehicle', 'motor', 'automotive', 'car', 'truck', 'automobile'],
  construction: ['construction', 'building', 'structural', 'reinforcing'],
  electrical: ['electrical', 'electronic', 'electric', 'circuit', 'wiring'],
  medical: ['medical', 'surgical', 'dental', 'veterinary', 'pharmaceutical'],
  food: ['food', 'edible', 'culinary', 'cooking', 'dietary'],
  packaging: ['packaging', 'packing', 'wrapping', 'container', 'closure'],
  industrial: ['industrial', 'machinery', 'machine', 'equipment'],
  agricultural: ['agricultural', 'farming', 'seed', 'sowing'],
  decorative: ['decorative', 'ornamental', 'ornament', 'figurine'],
  sporting: ['sport', 'sporting', 'game', 'exercise', 'fitness'],
};

// ─── Strategy 1: Keyword Specificity ─────────

function strategyKeywordSpecificity(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};
  const allKeywords = expandSynonyms(input.keywords);

  // Add product-understood words
  if (input.productUnderstood) {
    const words = normalize(input.productUnderstood);
    for (const w of words) {
      if (!allKeywords.includes(w)) allKeywords.push(w);
    }
  }

  for (const heading of input.candidateHeadings) {
    const desc = HEADING_DESCRIPTIONS[heading] || '';
    scores[heading] = scoreMatch(allKeywords, desc);
  }

  return scores;
}

// ─── Strategy 2: Chapter Note Rules ─────────

function strategyChapterNotes(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};
  const note = getChapterNote(input.chapter);
  const rules = parseChapterNoteRules(note);

  for (const heading of input.candidateHeadings) {
    scores[heading] = 0;
  }

  if (!note?.chapter_note) return scores;

  const noteText = note.chapter_note.toLowerCase();
  const productText = (input.productName + ' ' + (input.productUnderstood || '') + ' ' + (input.material || '')).toLowerCase();

  // Check for "heading XXXX covers/includes..."
  for (const heading of input.candidateHeadings) {
    const h4dot = heading.substring(0, 2) + '.' + heading.substring(2);
    const patterns = [
      new RegExp(`heading\\s*${h4dot}[^.]*(?:covers?|includes?|applies)`, 'i'),
      new RegExp(`heading\\s*${heading}[^.]*(?:covers?|includes?|applies)`, 'i'),
    ];
    for (const p of patterns) {
      if (p.test(noteText)) {
        scores[heading] += 5;
      }
    }
  }

  // Check for exclusions: "heading XXXX does not cover..."
  for (const heading of input.candidateHeadings) {
    const h4dot = heading.substring(0, 2) + '.' + heading.substring(2);
    const excl = new RegExp(`heading\\s*(?:${h4dot}|${heading})[^.]*(?:does not|exclud)`, 'i');
    if (excl.test(noteText)) {
      // Check if the product is in the exclusion
      const productWords = normalize(productText);
      let excluded = false;
      for (const w of productWords) {
        if (w.length > 3 && noteText.includes(`${heading}`) && noteText.includes(w)) {
          excluded = true;
          break;
        }
      }
      if (excluded) {
        scores[heading] -= 10;
      }
    }
  }

  // Check definitions that match product
  for (const [term, definition] of Object.entries(rules.definitions)) {
    if (productText.includes(term)) {
      // Find which heading this definition applies to
      for (const heading of input.candidateHeadings) {
        const desc = (HEADING_DESCRIPTIONS[heading] || '').toLowerCase();
        if (desc.includes(term)) {
          scores[heading] += 3;
        }
      }
    }
  }

  return scores;
}

// ─── Strategy 3: Material/Form/Use Matching ─────────

function strategyMaterialFormUse(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};
  const productText = (input.productName + ' ' + (input.productUnderstood || '') + ' ' + (input.material || '')).toLowerCase();

  // Detect material, form, use from product
  const detectedMaterials: string[] = [];
  const detectedForms: string[] = [];
  const detectedUses: string[] = [];

  for (const [mat, kws] of Object.entries(MATERIAL_KEYWORDS)) {
    if (kws.some(k => productText.includes(k))) detectedMaterials.push(mat);
  }
  for (const [form, kws] of Object.entries(FORM_KEYWORDS)) {
    if (kws.some(k => productText.includes(k))) detectedForms.push(form);
  }
  for (const [use, kws] of Object.entries(USE_KEYWORDS)) {
    if (kws.some(k => productText.includes(k))) detectedUses.push(use);
  }

  for (const heading of input.candidateHeadings) {
    const desc = (HEADING_DESCRIPTIONS[heading] || '').toLowerCase();
    let score = 0;

    // Material match (weight 4)
    for (const mat of detectedMaterials) {
      if (MATERIAL_KEYWORDS[mat].some(k => desc.includes(k))) {
        score += 4;
      }
    }

    // Form match (weight 3)
    for (const form of detectedForms) {
      if (FORM_KEYWORDS[form].some(k => desc.includes(k))) {
        score += 3;
      }
    }

    // Use match (weight 2)
    for (const use of detectedUses) {
      if (USE_KEYWORDS[use].some(k => desc.includes(k))) {
        score += 2;
      }
    }

    scores[heading] = score;
  }

  return scores;
}

// ─── Strategy 4: GRI 3(a) Specificity ─────────

function strategySpecificity(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const heading of input.candidateHeadings) {
    const desc = (HEADING_DESCRIPTIONS[heading] || '').toLowerCase();
    let score = 0;

    // "Other" headings = least specific (penalty)
    if (desc.startsWith('other') || desc.includes('not elsewhere specified') || desc.includes('n.e.c')) {
      score -= 10;
    }

    // More words in description = more specific (generally)
    const wordCount = desc.split(/\s+/).length;
    score += Math.min(wordCount / 5, 3); // Cap at 3

    // Semicolons = lists of specific items = more specific
    const semicolons = (desc.match(/;/g) || []).length;
    score += semicolons * 0.5;

    // Named products = most specific
    const productWords = normalize(input.productName);
    for (const pw of productWords) {
      if (pw.length > 4 && desc.includes(pw)) {
        score += 2;
      }
    }

    scores[heading] = score;
  }

  return scores;
}

// ─── Strategy 5: Expert Rules Pattern ─────────

let expertRulesCache: Record<string, Record<string, unknown>[]> | null = null;

function loadExpertRules(): Record<string, Record<string, unknown>[]> {
  if (expertRulesCache) return expertRulesCache;
  try {
    const fs = require('fs');
    const path = '/Volumes/soulmaten/POTAL/hs_correlation/chapter_expert_rules.json';
    if (fs.existsSync(path)) {
      const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
      expertRulesCache = {};
      for (const [ch, chData] of Object.entries(data)) {
        const rules = (chData as Record<string, unknown>).decision_rules;
        if (Array.isArray(rules)) {
          expertRulesCache[ch] = rules;
        }
      }
      return expertRulesCache;
    }
  } catch { /* fall through */ }
  expertRulesCache = {};
  return expertRulesCache;
}

function strategyExpertRules(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const h of input.candidateHeadings) scores[h] = 0;

  const rules = loadExpertRules();
  const chRules = rules[String(input.chapter)] || [];

  const productText = (input.productName + ' ' + (input.productUnderstood || '')).toLowerCase();

  for (const rule of chRules) {
    const condition = String(rule.if_condition || '').toLowerCase();
    const heading = String(rule.then_heading || '').replace(/\./g, '').replace(/HS\s*/i, '').substring(0, 4);

    if (!input.candidateHeadings.includes(heading)) continue;

    // Check if condition keywords match product
    const condWords = normalize(condition);
    const productWords = normalize(productText);
    const overlap = condWords.filter(w => productWords.includes(w) || productWords.some(pw => stemBasic(pw) === stemBasic(w))).length;

    if (overlap >= 2) {
      scores[heading] = (scores[heading] || 0) + overlap * 2;
    }
  }

  return scores;
}

// ─── Strategy 6: Conflict Patterns ─────────

function strategyConflictPatterns(
  input: ConflictInput
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const h of input.candidateHeadings) scores[h] = 0;

  const pattern = findMatchingPattern(input.chapter, input.keywords, input.candidateHeadings);

  if (pattern) {
    const correctH = pattern.correct_heading;
    if (input.candidateHeadings.includes(correctH)) {
      scores[correctH] = 8;
    }
    // Penalize rejected heading
    for (const h of pattern.conflict_headings) {
      if (h !== correctH && input.candidateHeadings.includes(h)) {
        scores[h] = (scores[h] || 0) - 3;
      }
    }
  }

  return scores;
}

// ─── Main Engine ─────────────────────────────

// Strategy weights (tuned based on expert_rules_verification analysis)
const WEIGHTS = {
  keyword: 1.0,      // Strategy 1
  chapterNote: 2.0,  // Strategy 2 — Chapter Notes are legally binding
  materialFormUse: 1.5, // Strategy 3
  specificity: 1.2,  // Strategy 4 — GRI 3(a)
  expertRules: 2.5,  // Strategy 5 — validated against 476 rules
  conflictPatterns: 1.8, // Strategy 6
};

export function resolveHeadingConflict(input: ConflictInput): ConflictResult {
  if (input.candidateHeadings.length === 0) {
    return {
      selectedHeading: '0000',
      confidence: 0,
      reasoning: 'No candidate headings provided',
      strategyScores: {},
      gri_rule: 'none',
    };
  }

  if (input.candidateHeadings.length === 1) {
    return {
      selectedHeading: input.candidateHeadings[0],
      confidence: 0.95,
      reasoning: 'Only one candidate heading',
      strategyScores: {},
      gri_rule: 'GRI 1',
    };
  }

  // Run all 6 strategies
  const s1 = strategyKeywordSpecificity(input);
  const s2 = strategyChapterNotes(input);
  const s3 = strategyMaterialFormUse(input);
  const s4 = strategySpecificity(input);
  const s5 = strategyExpertRules(input);
  const s6 = strategyConflictPatterns(input);

  // Weighted combination
  const finalScores: Record<string, number> = {};
  const strategyDetail: Record<string, { heading: string; score: number }> = {};

  for (const heading of input.candidateHeadings) {
    finalScores[heading] =
      (s1[heading] || 0) * WEIGHTS.keyword +
      (s2[heading] || 0) * WEIGHTS.chapterNote +
      (s3[heading] || 0) * WEIGHTS.materialFormUse +
      (s4[heading] || 0) * WEIGHTS.specificity +
      (s5[heading] || 0) * WEIGHTS.expertRules +
      (s6[heading] || 0) * WEIGHTS.conflictPatterns;
  }

  // Find winner
  const sorted = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];
  const runnerUp = sorted[1];

  // Determine confidence
  const scoreDiff = winner[1] - (runnerUp?.[1] || 0);
  const confidence = Math.min(0.95, 0.5 + scoreDiff * 0.02);

  // Determine GRI rule
  let griRule = 'GRI 1';
  if (s2[winner[0]] > 0) griRule = 'GRI 1 + Chapter Note';
  if (s4[winner[0]] > s4[runnerUp?.[0] || '']) griRule = 'GRI 3(a)';
  if (s6[winner[0]] > 0) griRule = 'GRI 3(a) + precedent';

  // Build reasoning
  const winnerDesc = (HEADING_DESCRIPTIONS[winner[0]] || '').substring(0, 60);
  const reasons: string[] = [];
  if (s1[winner[0]] > 0) reasons.push(`keyword match (${s1[winner[0]].toFixed(0)})`);
  if (s2[winner[0]] > 0) reasons.push(`Chapter Note support`);
  if (s3[winner[0]] > 0) reasons.push(`material/form/use match`);
  if (s5[winner[0]] > 0) reasons.push(`expert rule match`);
  if (s6[winner[0]] > 0) reasons.push(`conflict pattern match`);

  // Strategy detail for transparency
  for (const h of input.candidateHeadings) {
    strategyDetail[h] = { heading: h, score: finalScores[h] };
  }

  return {
    selectedHeading: winner[0],
    confidence,
    reasoning: `Selected ${winner[0]} (${winnerDesc}): ${reasons.join(', ')}. Score ${winner[1].toFixed(1)} vs ${runnerUp?.[1]?.toFixed(1) || 0}.`,
    strategyScores: strategyDetail,
    gri_rule: griRule,
  };
}
