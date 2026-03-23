/**
 * v3 Step 6: Heading Reasoning — picks 4-digit heading using full reasoning chain + all headings.
 */

import type { GriProductInput, ChapterCandidate } from '../../types';
import { callLLM } from '../../utils/llm-call';
import { getHeadingsForChapter } from '../../data/heading-descriptions';
import { getChapterNote } from '../../data/chapter-notes';

export interface Step6V3Result {
  reasoning: string;
  heading_1: string;
  heading_2: string | null;
  needsConflict: boolean;
  confidence: number;
}

export async function reasonHeading(
  chain: { step1: string; step2: string; step3: string; step4: string; step5: string },
  validChapters: ChapterCandidate[],
  input: GriProductInput
): Promise<Step6V3Result> {
  const chapter = validChapters[0];
  if (!chapter) return { reasoning: 'No valid chapter.', heading_1: '0000', heading_2: null, needsConflict: false, confidence: 0.3 };

  const headings = getHeadingsForChapter(chapter.chapter);
  const headingList = headings.map(h => `${h.code}: ${h.description}`).join('\n');

  const chNote = getChapterNote(chapter.chapter);
  const noteText = chNote?.chapter_note?.substring(0, 2000) || 'None.';

  const prompt = `You are continuing your classification as a licensed customs broker.

## YOUR COMPLETE REASONING CHAIN:
Step 1 (Product Understanding): "${chain.step1}"
Step 2 (Section Decision): "${chain.step2}"
Step 3 (Section Note Check): "${chain.step3}"
Step 4 (Chapter Decision): "${chain.step4}"
Step 5 (Chapter Note Check): "${chain.step5}"

## YOUR JOB NOW:
This is the CRITICAL step. Find the exact 4-digit HEADING within Chapter ${chapter.chapter}.

## GRI RULES FOR HEADING SELECTION:
- GRI 1: Classify by the TERMS of headings. These have LEGAL force.
- GRI 3(a): Most specific heading wins over general heading
- GRI 3(b): Composites/sets → essential character test
- "Other" headings are LAST RESORT

## ALL HEADINGS IN CHAPTER ${chapter.chapter}:
${headingList}

## CHAPTER ${chapter.chapter} NOTES:
${noteText}

## YOUR REASONING:
Write 2-3 sentences. Which heading's description BEST matches? Which GRI rule applies?

## OUTPUT (STRICT JSON):
{"broker_reasoning":"Your heading reasoning","heading_1":"XXXX","heading_2":"XXXX_or_null","needs_conflict_resolution":false,"confidence":0.X}`;

  const result = await callLLM<{ broker_reasoning: string; heading_1: string; heading_2: string | null; needs_conflict_resolution: boolean; confidence: number }>({
    userPrompt: prompt,
    maxTokens: 250,
    temperature: 0,
  });

  if (!result.data) return { reasoning: 'Unable to determine heading.', heading_1: headings[0]?.code || '0000', heading_2: null, needsConflict: false, confidence: 0.3 };

  return {
    reasoning: result.data.broker_reasoning || '',
    heading_1: String(result.data.heading_1 || headings[0]?.code || '0000').padStart(4, '0'),
    heading_2: result.data.heading_2 ? String(result.data.heading_2).padStart(4, '0') : null,
    needsConflict: result.data.needs_conflict_resolution || false,
    confidence: result.data.confidence || 0.5,
  };
}
