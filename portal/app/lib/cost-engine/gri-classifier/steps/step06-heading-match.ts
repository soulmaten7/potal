/**
 * Step 6: Match to Heading (4-digit) within Chapter.
 * LLM-based with keyword fallback.
 */

import type { ChapterCandidate, HeadingCandidate, KeywordResult, GriProductInput } from '../types';
import { getHeadingsForChapter } from '../data/heading-descriptions';
import { scoreMatch } from '../utils/text-matching';
import { callLLM } from '../utils/llm-call';
import { getChapterNote } from '../data/chapter-notes';

// Keyword fallback (original)
export function matchHeadingsKeyword(
  validChapters: ChapterCandidate[],
  keywordResult: KeywordResult
): { headingCandidates: HeadingCandidate[]; needsConflictResolution: boolean } {
  const { keywords, material } = keywordResult;
  const chapters = validChapters.map(c => c.chapter);
  const scored: HeadingCandidate[] = [];

  for (const chapter of chapters) {
    for (const { code, description } of getHeadingsForChapter(chapter)) {
      let score = scoreMatch(keywords, description);
      if (material && description.toLowerCase().includes(material)) score += 3;
      if (score > 0) scored.push({ heading: code, description, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  let candidates = scored.slice(0, 5);
  if (candidates.length === 0) {
    for (const ch of validChapters.slice(0, 2)) {
      const hds = getHeadingsForChapter(ch.chapter);
      const fallback = hds.find(h => h.description.toLowerCase().startsWith('other')) || hds[0];
      if (fallback) candidates.push({ heading: fallback.code, description: fallback.description, score: 0.1 });
    }
  }

  const needsConflictResolution = candidates.length >= 2 &&
    candidates[0].score > 0 && candidates[1].score > 0 &&
    (candidates[0].score - candidates[1].score) < 3;

  return { headingCandidates: candidates, needsConflictResolution };
}

// ─── LLM-based Heading Matching ─────────────────────

interface Step6LLMResponse {
  thinking: string;
  heading_1: string;
  heading_1_description: string;
  heading_2: string | null;
  heading_2_description: string | null;
  needs_conflict_resolution: boolean;
  confidence: number;
}

async function matchHeadingsLLM(
  validChapters: ChapterCandidate[],
  input: GriProductInput
): Promise<{ headingCandidates: HeadingCandidate[]; needsConflictResolution: boolean } | null> {
  const chapter = validChapters[0];
  if (!chapter) return null;

  const headings = getHeadingsForChapter(chapter.chapter);
  if (headings.length === 0) return null;

  const headingList = headings.map(h => `${h.code}: ${h.description}`).join('\n');

  const chNote = getChapterNote(chapter.chapter);
  const noteText = chNote?.chapter_note?.substring(0, 2000) || '';

  const prompt = `You are a licensed customs broker. You have determined:
- Chapter: ${chapter.chapter} (${chapter.description})

Now determine the 4-digit HEADING within Chapter ${chapter.chapter}.

## Available headings:
${headingList}

## Chapter Notes:
${noteText || 'None.'}

## Rules:
- GRI 1: classify by the TERMS of headings. Read descriptions literally.
- Specific heading beats generic heading (GRI 3a).
- "Other" headings ONLY if nothing else fits.
- Chapter notes can EXCLUDE or REDIRECT products.

## Input:
Product: "${input.productName}"
${input.material ? `Material: ${input.material}` : ''}
${input.price ? `Price: $${input.price}` : ''}

## Output (STRICT JSON):
{"thinking":"...","heading_1":"XXXX","heading_1_description":"...","heading_2":"XXXX or null","heading_2_description":"... or null","needs_conflict_resolution":false,"confidence":0.X}`;

  const result = await callLLM<Step6LLMResponse>({ userPrompt: prompt, maxTokens: 250 });
  if (!result.data || !result.data.heading_1) return null;

  const d = result.data;
  const candidates: HeadingCandidate[] = [];

  if (d.heading_1) {
    candidates.push({
      heading: String(d.heading_1).padStart(4, '0'),
      description: d.heading_1_description || '',
      score: (d.confidence || 0.7) * 10 + 5,
    });
  }
  if (d.heading_2) {
    candidates.push({
      heading: String(d.heading_2).padStart(4, '0'),
      description: d.heading_2_description || '',
      score: (d.confidence || 0.5) * 10,
    });
  }

  return {
    headingCandidates: candidates,
    needsConflictResolution: d.needs_conflict_resolution || false,
  };
}

/**
 * Main export — tries LLM first, falls back to keyword.
 */
export async function matchHeadings(
  validChapters: ChapterCandidate[],
  keywordResult: KeywordResult,
  input?: GriProductInput
): Promise<{ headingCandidates: HeadingCandidate[]; needsConflictResolution: boolean }> {
  if (input) {
    const llmResult = await matchHeadingsLLM(validChapters, input);
    if (llmResult && llmResult.headingCandidates.length > 0) return llmResult;
  }
  return matchHeadingsKeyword(validChapters, keywordResult);
}
