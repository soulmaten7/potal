/**
 * v3 Step 4: Chapter Reasoning — picks Chapter within Section using full reasoning chain.
 */

import type { GriProductInput, SectionCandidate } from '../../types';
import { callLLM } from '../../utils/llm-call';
import { CHAPTER_DESCRIPTIONS } from '../../data/chapter-descriptions';
import { getChapterNote } from '../../data/chapter-notes';

function buildChapterReference(sectionChapters: number[]): string {
  let ref = '';
  for (const ch of sectionChapters) {
    const desc = CHAPTER_DESCRIPTIONS[ch] || '';
    ref += `\n\n### CHAPTER ${ch}: ${desc}`;
    const note = getChapterNote(ch);
    if (note?.chapter_note) {
      const noteText = note.chapter_note.substring(0, 1500);
      ref += `\n\nChapter Note:\n${noteText}`;
      if (note.chapter_note.length > 1500) ref += '\n[... truncated]';
    }
  }
  return ref;
}

export interface Step4V3Result {
  reasoning: string;
  chapter_1: number;
  chapter_2: number | null;
  confidence: number;
}

export async function reasonChapter(
  chain: { step1: string; step2: string; step3: string },
  validSections: SectionCandidate[],
  input: GriProductInput
): Promise<Step4V3Result> {
  const section = validSections[0];
  if (!section) return { reasoning: 'No valid section.', chapter_1: 84, chapter_2: null, confidence: 0.3 };

  const chapterRef = buildChapterReference(section.chapters);

  const prompt = `You are continuing your classification as a licensed customs broker.

## YOUR REASONING SO FAR:
Step 1 (Product Understanding): "${chain.step1}"
Step 2 (Section Decision): "${chain.step2}"
Step 3 (Section Note Check): "${chain.step3}"

## YOUR JOB NOW:
Find the specific CHAPTER within Section ${section.section} (${section.title}).
Read Chapter descriptions AND Chapter Notes carefully.

## CHAPTERS IN SECTION ${section.section}:
${chapterRef}

## YOUR REASONING:
Continue your classification. Write 1-2 sentences.

## OUTPUT (STRICT JSON):
{"broker_reasoning":"Your reasoning referencing Chapter Notes","chapter_1":NN,"chapter_2":NN_or_null,"confidence":0.X}`;

  const result = await callLLM<{ broker_reasoning: string; chapter_1: number; chapter_2: number | null; confidence: number }>({
    userPrompt: prompt,
    maxTokens: 200,
    temperature: 0,
  });

  if (!result.data) return { reasoning: 'Unable to determine chapter.', chapter_1: section.chapters[0] || 84, chapter_2: null, confidence: 0.3 };

  return {
    reasoning: result.data.broker_reasoning || '',
    chapter_1: result.data.chapter_1 || section.chapters[0] || 84,
    chapter_2: result.data.chapter_2 || null,
    confidence: result.data.confidence || 0.5,
  };
}
