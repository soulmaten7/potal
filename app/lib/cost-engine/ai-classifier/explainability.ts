/**
 * POTAL F001 — HS Classification Explainability
 *
 * Builds reasoning_chain, chapter_notes, ruling_reference for each classification.
 * Provides full transparency into how an HS code was determined.
 */

import type { ReasoningStep, RulingReference, MultiDimensionalConfidence, HsClassificationResult } from '../hs-code/types';
import chapterNotesData from '../../data/chapter-notes.json';

// ─── Chapter Notes ──────────────────────────────────

interface ChapterNote {
  chapter: number;
  title: string;
  key_notes: string[];
}

const CHAPTER_NOTES: Record<string, ChapterNote> = chapterNotesData as Record<string, ChapterNote>;

export function getChapterNote(hsCode: string): { chapter: number; title: string; notes: string[] } | null {
  const chapter = hsCode.substring(0, 2);
  const note = CHAPTER_NOTES[chapter];
  if (!note) return null;
  return { chapter: note.chapter, title: note.title, notes: note.key_notes };
}

// ─── Reasoning Chain Builder ────────────────────────

export function buildReasoningChain(params: {
  classificationSource: string;
  productName: string;
  hsCode: string;
  description: string;
  confidence: number;
  category?: string;
  vectorSimilarity?: number;
  keywordMatchCount?: number;
  llmReasoning?: string;
  priceBreakApplied?: boolean;
  alternatives?: { hsCode: string; description: string; confidence: number }[];
}): ReasoningStep[] {
  const chain: ReasoningStep[] = [];
  const p = params;

  switch (p.classificationSource) {
    case 'cache':
      chain.push({
        step: 'cache',
        detail: `DB cache hit: '${p.productName.substring(0, 50)}' → HS ${p.hsCode} (${p.description})`,
        confidence: p.confidence,
      });
      break;

    case 'manual':
      chain.push({
        step: 'manual',
        detail: `Manual HS Code override: ${p.hsCode} provided by seller`,
        confidence: 1.0,
      });
      break;

    case 'vector':
      chain.push({
        step: 'vector',
        detail: `Vector similarity match: '${p.productName.substring(0, 50)}' → HS ${p.hsCode} (cosine similarity: ${(p.vectorSimilarity ?? p.confidence).toFixed(3)})`,
        confidence: p.vectorSimilarity ?? p.confidence,
      });
      break;

    case 'keyword':
      chain.push({
        step: 'keyword',
        detail: `Keyword matching: '${p.productName.substring(0, 50)}' matched ${p.keywordMatchCount ?? 'multiple'} keywords → HS ${p.hsCode}`,
        confidence: p.confidence,
      });
      break;

    case 'ai':
      chain.push({
        step: 'keyword',
        detail: `Keyword matching attempted: confidence below threshold (< 0.6), escalating to LLM`,
        confidence: 0.0,
      });
      chain.push({
        step: 'llm',
        detail: p.llmReasoning
          ? `LLM classification: ${p.llmReasoning}`
          : `LLM classified '${p.productName.substring(0, 50)}' → HS ${p.hsCode} (${p.description})`,
        confidence: p.confidence,
      });
      break;

    case 'keyword_fallback':
      chain.push({
        step: 'keyword',
        detail: `Keyword fallback: best match '${p.productName.substring(0, 50)}' → HS ${p.hsCode} (low confidence, LLM unavailable)`,
        confidence: p.confidence,
      });
      break;
  }

  // Add chapter note if available
  const chapterNote = getChapterNote(p.hsCode);
  if (chapterNote) {
    // Find the most relevant note for this classification
    const relevantNote = chapterNote.notes[0] || `Chapter ${chapterNote.chapter}: ${chapterNote.title}`;
    chain.push({
      step: 'chapter_note',
      detail: relevantNote,
      confidence: 1.0,
    });
  }

  // Add price break note if applied
  if (p.priceBreakApplied) {
    chain.push({
      step: 'price_break',
      detail: `Price-based tariff line selection applied (value threshold rule)`,
      confidence: 1.0,
    });
  }

  return chain;
}

// ─── Ruling Reference (Schema-only for now) ─────────

export function lookupRulingReference(_hsCode: string, _productName: string): RulingReference | null {
  // CBP CROSS rulings DB not yet loaded into Supabase.
  // When available, this will query cross_rulings table for matching HS codes
  // and return relevant classification rulings as supporting evidence.
  return null;
}

// ─── Multi-dimensional Confidence ───────────────────

export function buildMultiDimensionalConfidence(params: {
  classificationSource: string;
  baseConfidence: number;
  productName: string;
  hsCode: string;
  description: string;
  category?: string;
  alternatives?: { hsCode: string; description: string; confidence: number }[];
  hasPriceBreakRule?: boolean;
}): MultiDimensionalConfidence {
  const p = params;

  // 1. Category certainty — based on classification tier
  let categoryCertainty: number;
  switch (p.classificationSource) {
    case 'cache':
    case 'manual':
      categoryCertainty = 1.0;
      break;
    case 'vector':
      categoryCertainty = 0.92;
      break;
    case 'keyword':
      categoryCertainty = 0.85;
      break;
    case 'ai':
      categoryCertainty = Math.min(p.baseConfidence + 0.05, 0.95);
      break;
    default:
      categoryCertainty = 0.50;
  }

  // 2. Keyword overlap — how many product name words appear in HS description
  const productWords = p.productName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const descWords = p.description.toLowerCase().split(/\s+/);
  const categoryWords = (p.category || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const allQueryWords = [...new Set([...productWords, ...categoryWords])];
  const matchedWords = allQueryWords.filter(w => descWords.some(d => d.includes(w) || w.includes(d)));
  const keywordOverlap = allQueryWords.length > 0
    ? Math.min(matchedWords.length / allQueryWords.length, 1.0)
    : 0.5;

  // 3. Semantic match — approximated from base confidence + keyword overlap
  const semanticMatch = Math.min(
    (p.baseConfidence * 0.6 + keywordOverlap * 0.4),
    1.0
  );

  // 4. Price consistency — 1.0 if no price break rules apply or if they were checked
  const priceConsistency = p.hasPriceBreakRule === false ? 0.9 : 1.0;

  // 5. Overall — weighted average
  const overall = Math.round((
    semanticMatch * 0.30 +
    keywordOverlap * 0.20 +
    categoryCertainty * 0.35 +
    priceConsistency * 0.15
  ) * 100) / 100;

  // Ambiguity penalty: many alternatives at similar confidence = less certain
  let ambiguityPenalty = 0;
  if (p.alternatives && p.alternatives.length > 0) {
    const closeAlts = p.alternatives.filter(a => a.confidence >= p.baseConfidence * 0.8);
    if (closeAlts.length >= 3) ambiguityPenalty = 0.10;
    else if (closeAlts.length >= 1) ambiguityPenalty = 0.05;
  }

  const adjustedOverall = Math.max(overall - ambiguityPenalty, 0);

  return {
    overall: Math.round(adjustedOverall * 100) / 100,
    semantic_match: Math.round(semanticMatch * 100) / 100,
    keyword_overlap: Math.round(keywordOverlap * 100) / 100,
    category_certainty: Math.round(categoryCertainty * 100) / 100,
    price_consistency: Math.round(priceConsistency * 100) / 100,
    review_recommended: adjustedOverall < 0.85,
    review_required: adjustedOverall < 0.70,
  };
}
