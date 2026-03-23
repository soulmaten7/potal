/**
 * Step 4: Match to Chapter within valid sections.
 * LLM-based with keyword fallback.
 */

import type { SectionCandidate, ChapterCandidate, KeywordResult, GriProductInput } from '../types';
import { CHAPTER_DESCRIPTIONS } from '../data/chapter-descriptions';
import { scoreMatch } from '../utils/text-matching';
import { callLLM } from '../utils/llm-call';
import { getSectionNote } from '../data/section-notes';

// Keyword fallback (original)
export function matchChaptersKeyword(
  validSections: SectionCandidate[],
  keywordResult: KeywordResult
): ChapterCandidate[] {
  const { keywords, material } = keywordResult;
  const candidateChapters = new Set<number>();
  for (const section of validSections) {
    for (const ch of section.chapters) {
      candidateChapters.add(ch);
    }
  }

  const chapterScores: ChapterCandidate[] = [];
  for (const ch of candidateChapters) {
    const description = CHAPTER_DESCRIPTIONS[ch] || '';
    let score = scoreMatch(keywords, description);
    if (material && description.toLowerCase().includes(material)) {
      score += 3;
    }
    chapterScores.push({ chapter: ch, score, description: description || `Chapter ${ch}` });
  }

  chapterScores.sort((a, b) => b.score - a.score);
  return chapterScores.slice(0, 5);
}

// ─── LLM-based Chapter Matching ─────────────────────

interface Step4LLMResponse {
  thinking: string;
  chapter_1: number;
  chapter_2: number | null;
  confidence: number;
}

async function matchChaptersLLM(
  validSections: SectionCandidate[],
  input: GriProductInput
): Promise<ChapterCandidate[]> {
  const section = validSections[0];
  if (!section) return [];

  const sectionNote = getSectionNote(section.section);
  const noteText = sectionNote?.section_note?.substring(0, 1000) || '';

  const chapterList = section.chapters
    .map(ch => `Ch.${ch}: ${CHAPTER_DESCRIPTIONS[ch] || ''}`)
    .join('\n');

  const prompt = `You are a licensed customs broker. You have determined this product belongs to HS Section ${section.section} (${section.title}).

Now determine the specific CHAPTER within this section.

## Chapters in Section ${section.section}:
${chapterList}

## Section Note:
${noteText || 'No section notes.'}

## Key distinctions:
- DEGREE OF PROCESSING: raw → semi-processed → finished
- SPECIFIC MATERIAL: each material may have its own chapter
- RAW vs PREPARED: raw meat (Ch.2) vs prepared meat (Ch.16)
- WASTE/SCRAP: goes to the raw material chapter

## Input:
Product: "${input.productName}"
${input.material ? `Material: ${input.material}` : ''}

## Output (STRICT JSON):
{"thinking":"...","chapter_1":NN,"chapter_2":NN_or_null,"confidence":0.X}`;

  const result = await callLLM<Step4LLMResponse>({ userPrompt: prompt, maxTokens: 150 });
  if (!result.data || !result.data.chapter_1) return [];

  const candidates: ChapterCandidate[] = [];
  const d = result.data;

  if (d.chapter_1 && CHAPTER_DESCRIPTIONS[d.chapter_1]) {
    candidates.push({
      chapter: d.chapter_1,
      score: (d.confidence || 0.7) * 10 + 5,
      description: CHAPTER_DESCRIPTIONS[d.chapter_1],
    });
  }
  if (d.chapter_2 && CHAPTER_DESCRIPTIONS[d.chapter_2]) {
    candidates.push({
      chapter: d.chapter_2,
      score: (d.confidence || 0.5) * 10,
      description: CHAPTER_DESCRIPTIONS[d.chapter_2],
    });
  }

  return candidates;
}

/**
 * Main export — tries LLM first, falls back to keyword.
 */
export async function matchChapters(
  validSections: SectionCandidate[],
  keywordResult: KeywordResult,
  input?: GriProductInput
): Promise<ChapterCandidate[]> {
  if (input) {
    const llmResult = await matchChaptersLLM(validSections, input);
    if (llmResult.length > 0) return llmResult;
  }
  return matchChaptersKeyword(validSections, keywordResult);
}
