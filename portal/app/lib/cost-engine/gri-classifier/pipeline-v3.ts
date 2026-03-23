/**
 * v3.0 "관세사 사고방식" 파이프라인
 *
 * v2.1과 완전히 분리. 핵심: 추론 체인(reasoning chain).
 * 각 LLM이 이전 LLM의 사고 과정을 이어받음.
 */

import type {
  GriProductInput, GriClassificationResult, DecisionStep,
  SectionCandidate, ChapterCandidate, KeywordResult,
} from './types';
import { resetTokenCounter } from './utils/llm-call';

// v3 steps
import { understandProduct } from './steps/v3/step01-product-understanding';
import { reasonSection } from './steps/v3/step02-section-reasoning';
import { checkSectionNotes } from './steps/step03-section-note-check';
import { reasonChapter } from './steps/v3/step04-chapter-reasoning';
import { checkChapterNotes } from './steps/step05-chapter-note-check';
import { reasonHeading } from './steps/v3/step06-heading-reasoning';
import { reasonSubheading } from './steps/v3/step08-subheading-reasoning';
import { routeCountry } from './steps/step09-country-router';
import { applyPriceBreak } from './steps/step10-price-break';
import { finalResolve } from './steps/step11-final-resolve';

import { CHAPTER_DESCRIPTIONS } from './data/chapter-descriptions';

// Build compatibility shims for reusing existing code steps
function buildSectionCandidates(step2: { section_1: number; section_2: number | null; confidence: number }): SectionCandidate[] {
  const SECTION_CHAPTERS: Record<number, number[]> = {
    1: [1,2,3,4,5], 2: [6,7,8,9,10,11,12,13,14], 3: [15],
    4: [16,17,18,19,20,21,22,23,24], 5: [25,26,27],
    6: [28,29,30,31,32,33,34,35,36,37,38], 7: [39,40],
    8: [41,42,43], 9: [44,45,46], 10: [47,48,49],
    11: [50,51,52,53,54,55,56,57,58,59,60,61,62,63],
    12: [64,65,66,67], 13: [68,69,70], 14: [71],
    15: [72,73,74,75,76,78,79,80,81,82,83], 16: [84,85],
    17: [86,87,88,89], 18: [90,91,92], 19: [93],
    20: [94,95,96], 21: [97],
  };

  const candidates: SectionCandidate[] = [];
  if (step2.section_1) {
    candidates.push({
      section: step2.section_1,
      score: step2.confidence * 10,
      chapters: SECTION_CHAPTERS[step2.section_1] || [],
      title: '',
    });
  }
  if (step2.section_2) {
    candidates.push({
      section: step2.section_2,
      score: step2.confidence * 5,
      chapters: SECTION_CHAPTERS[step2.section_2] || [],
      title: '',
    });
  }
  return candidates;
}

function buildChapterCandidates(step4: { chapter_1: number; chapter_2: number | null; confidence: number }): ChapterCandidate[] {
  const candidates: ChapterCandidate[] = [];
  if (step4.chapter_1) {
    candidates.push({
      chapter: step4.chapter_1,
      score: step4.confidence * 10,
      description: CHAPTER_DESCRIPTIONS[step4.chapter_1] || '',
    });
  }
  if (step4.chapter_2) {
    candidates.push({
      chapter: step4.chapter_2,
      score: step4.confidence * 5,
      description: CHAPTER_DESCRIPTIONS[step4.chapter_2] || '',
    });
  }
  return candidates;
}

function buildKeywordCompat(step1: { material: string | null }): KeywordResult {
  return {
    keywords: [],
    material: step1.material || undefined,
    originalName: '',
  };
}

function formatNoteCheck(result: { validSections: SectionCandidate[]; excludedSections: { section: number; reason: string }[] }): string {
  if (result.excludedSections.length === 0) {
    return `Section Note check passed. Section ${result.validSections[0]?.section} confirmed valid.`;
  }
  return `Excluded: ${result.excludedSections.map(e => `Section ${e.section}: ${e.reason}`).join('; ')}. Valid: ${result.validSections.map(s => `Section ${s.section}`).join(', ')}.`;
}

function formatChapterNoteCheck(result: { validChapters: ChapterCandidate[]; excludedChapters: { chapter: number; reason: string }[] }): string {
  if (result.excludedChapters.length === 0) {
    return `Chapter Note check passed. Ch.${result.validChapters[0]?.chapter} confirmed valid.`;
  }
  return `Excluded: ${result.excludedChapters.map(e => `Ch.${e.chapter}: ${e.reason}`).join('; ')}. Valid: ${result.validChapters.map(c => `Ch.${c.chapter}`).join(', ')}.`;
}

export async function classifyWithGRI_v3(
  input: GriProductInput,
): Promise<GriClassificationResult> {
  const startTime = Date.now();
  const decisionPath: DecisionStep[] = [];
  const griRulesApplied: { rule: string; reason: string }[] = [];
  let aiCallCount = 0;

  resetTokenCounter();

  // ═══ Step 1: Product Understanding ═══
  let stepStart = Date.now();
  const step1 = await understandProduct(input);
  aiCallCount++;
  decisionPath.push({
    step: 1, name: 'product_understanding_v3',
    input: input.productName.substring(0, 60),
    output: step1.reasoning.substring(0, 80),
    method: 'ai', timeMs: Date.now() - stepStart,
  });
  griRulesApplied.push({ rule: 'GRI 1', reason: step1.reasoning.substring(0, 100) });

  // ═══ Step 2: Section Reasoning ═══
  stepStart = Date.now();
  const step2 = await reasonSection(step1.reasoning, input);
  aiCallCount++;
  decisionPath.push({
    step: 2, name: 'section_reasoning_v3',
    input: 'reasoning chain',
    output: `S${step2.section_1}${step2.section_2 ? `, S${step2.section_2}` : ''}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });

  const sectionCandidates = buildSectionCandidates(step2);

  // ═══ Step 3: Section Note Check (code) ═══
  stepStart = Date.now();
  const step3 = checkSectionNotes(sectionCandidates, buildKeywordCompat(step1));
  const step3Summary = formatNoteCheck(step3);
  decisionPath.push({
    step: 3, name: 'section_note_check',
    input: `${sectionCandidates.length} candidates`,
    output: step3Summary.substring(0, 60),
    method: 'code', timeMs: Date.now() - stepStart,
  });

  // ═══ Step 4: Chapter Reasoning ═══
  stepStart = Date.now();
  const step4 = await reasonChapter(
    { step1: step1.reasoning, step2: step2.reasoning, step3: step3Summary },
    step3.validSections,
    input
  );
  aiCallCount++;
  decisionPath.push({
    step: 4, name: 'chapter_reasoning_v3',
    input: `Section ${step3.validSections[0]?.section}`,
    output: `Ch.${step4.chapter_1}${step4.chapter_2 ? `, Ch.${step4.chapter_2}` : ''}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });

  const chapterCandidates = buildChapterCandidates(step4);

  // ═══ Step 5: Chapter Note Check (code) ═══
  stepStart = Date.now();
  const step5 = checkChapterNotes(chapterCandidates, buildKeywordCompat(step1));
  const step5Summary = formatChapterNoteCheck(step5);
  decisionPath.push({
    step: 5, name: 'chapter_note_check',
    input: `${chapterCandidates.length} candidates`,
    output: step5Summary.substring(0, 60),
    method: 'code', timeMs: Date.now() - stepStart,
  });

  // ═══ Step 6: Heading Reasoning ═══
  stepStart = Date.now();
  const step6 = await reasonHeading(
    { step1: step1.reasoning, step2: step2.reasoning, step3: step3Summary, step4: step4.reasoning, step5: step5Summary },
    step5.validChapters,
    input
  );
  aiCallCount++;
  decisionPath.push({
    step: 6, name: 'heading_reasoning_v3',
    input: `Ch.${step5.validChapters[0]?.chapter}`,
    output: `${step6.heading_1}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });

  const resolvedHeading = step6.heading_1;

  // ═══ Step 8: Subheading Reasoning ═══
  stepStart = Date.now();
  const step8 = await reasonSubheading(
    { step1: step1.reasoning, step2: step2.reasoning, step4: step4.reasoning, step6: step6.reasoning },
    resolvedHeading,
    input
  );
  aiCallCount++;
  decisionPath.push({
    step: 8, name: 'subheading_reasoning_v3',
    input: resolvedHeading,
    output: step8.hs6,
    method: 'ai', timeMs: Date.now() - stepStart,
  });

  // ═══ Steps 9-11: Reuse existing code ═══
  const step9 = await routeCountry(step8.hs6, input.destinationCountry, [], input.price, input.productName);
  const candidates = step9 ? [step9.nationalCode] : [step8.hs6];
  const step10 = await applyPriceBreak(candidates, input.price);

  return finalResolve({
    hs6: step8.hs6,
    hs6Description: step8.reasoning,
    confidence: step8.confidence,
    countryResult: step9,
    decisionPath,
    griRulesApplied,
    aiCallCount,
    startTime,
    productName: input.productName,
  });
}
