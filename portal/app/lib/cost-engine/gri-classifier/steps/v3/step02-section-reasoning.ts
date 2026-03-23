/**
 * v3 Step 2: Section Reasoning — continues the broker's reasoning chain.
 * Provides all 21 Sections with Notes for informed decision.
 */

import type { GriProductInput } from '../../types';
import { callLLM } from '../../utils/llm-call';
import { getAllSectionNotes } from '../../data/section-notes';
import { CHAPTER_DESCRIPTIONS, CHAPTER_TO_SECTION } from '../../data/chapter-descriptions';

function buildSectionReference(): string {
  const notes = getAllSectionNotes();
  let ref = '';

  for (let s = 1; s <= 21; s++) {
    const note = notes.find(n => n.section_number === s);
    if (!note) continue;

    ref += `\n\n### SECTION ${s}: ${note.title}`;
    ref += '\nChapters: ';

    const chapters = Object.entries(CHAPTER_DESCRIPTIONS)
      .filter(([ch]) => CHAPTER_TO_SECTION[parseInt(ch)] === s)
      .map(([ch, desc]) => `Ch.${ch} (${desc})`);
    ref += chapters.join(', ');

    if (note.section_note) {
      const noteText = note.section_note.substring(0, 800);
      ref += `\n\nSection Note:\n${noteText}`;
      if (note.section_note.length > 800) ref += '\n[... truncated]';
    }
  }

  return ref;
}

// Cache the reference (built once)
let cachedRef: string | null = null;
function getSectionRef(): string {
  if (!cachedRef) cachedRef = buildSectionReference();
  return cachedRef;
}

export interface Step2V3Result {
  reasoning: string;
  section_1: number;
  section_2: number | null;
  confidence: number;
}

export async function reasonSection(
  step1Reasoning: string,
  input: GriProductInput
): Promise<Step2V3Result> {
  const prompt = `You are continuing your classification as a licensed customs broker.

## WHAT HAPPENED IN STEP 1:
You examined the product and wrote down your initial assessment:

"${step1Reasoning}"

## YOUR JOB NOW:
Look at the 21 Sections of the HS Nomenclature below. Based on your initial assessment, determine which Section this product belongs to.

Read the Section Notes carefully — they contain INCLUSION and EXCLUSION rules that OVERRIDE section titles.

## HS NOMENCLATURE — ALL 21 SECTIONS:
${getSectionRef()}

## YOUR REASONING:
Continue your classification reasoning. Write 1-2 sentences:
1. Based on Step 1 understanding, which Section applies?
2. Did any Section Notes EXCLUDE this product from your initial guess?

## OUTPUT (STRICT JSON):
{"broker_reasoning":"Your continued reasoning","section_1":N,"section_2":N_or_null,"confidence":0.X}`;

  const result = await callLLM<{ broker_reasoning: string; section_1: number; section_2: number | null; confidence: number }>({
    userPrompt: prompt,
    maxTokens: 200,
    temperature: 0,
  });

  if (!result.data) {
    return { reasoning: 'Unable to determine section.', section_1: 16, section_2: null, confidence: 0.3 };
  }

  return {
    reasoning: result.data.broker_reasoning || '',
    section_1: result.data.section_1 || 16,
    section_2: result.data.section_2 || null,
    confidence: result.data.confidence || 0.5,
  };
}
