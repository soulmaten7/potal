/**
 * Step 8: Match to Subheading (6-digit).
 * LLM-based with keyword fallback. Applies GRI 6.
 */

import type { KeywordResult, SubheadingResult, GriProductInput } from '../types';
import { getSubheadingsForHeading } from '../data/subheading-descriptions';
import { scoreMatch } from '../utils/text-matching';
import { callLLM } from '../utils/llm-call';

// Keyword fallback (original)
export function matchSubheadingKeyword(
  resolvedHeading: string,
  keywordResult: KeywordResult,
): SubheadingResult {
  const { keywords, material } = keywordResult;
  const heading4 = resolvedHeading.substring(0, 4);
  const subheadings = getSubheadingsForHeading(heading4);

  if (subheadings.length === 0) return { hs6: heading4 + '00', description: 'Default', confidence: 0.5 };
  if (subheadings.length === 1) return { hs6: subheadings[0].code, description: subheadings[0].description, confidence: 0.9 };

  const scored = subheadings.map(sh => {
    let score = scoreMatch(keywords, sh.description);
    if (material && sh.description.toLowerCase().includes(material)) score += 3;
    return { ...sh, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best.score <= 0) {
    const other = scored.find(s => s.description.toLowerCase().startsWith('other'));
    if (other) return { hs6: other.code, description: other.description, confidence: 0.5 };
  }

  return { hs6: best.code, description: best.description, confidence: Math.min(0.95, 0.6 + best.score * 0.03) };
}

// ─── LLM-based Subheading Matching ──────────────────

interface Step8LLMResponse {
  thinking: string;
  hs6: string;
  hs6_description: string;
  confidence: number;
}

async function matchSubheadingLLM(
  resolvedHeading: string,
  input: GriProductInput
): Promise<SubheadingResult | null> {
  const heading4 = resolvedHeading.substring(0, 4);
  const subheadings = getSubheadingsForHeading(heading4);
  if (subheadings.length <= 1) return null; // No need for LLM

  const subList = subheadings.map(s => `${s.code}: ${s.description}`).join('\n');

  const prompt = `You are a licensed customs broker. Heading: ${heading4}
Now determine the 6-digit SUBHEADING.

## GRI 6: Apply Rules 1-5 at subheading level.

## Available subheadings:
${subList}

## Distinctions at subheading level:
- Specific material (cotton vs synthetic)
- Form/processing (crude vs refined, frozen vs fresh)
- Size/value thresholds
- Gender (men's vs women's for apparel)
- Specific type within category

## Input:
Product: "${input.productName}"
${input.material ? `Material: ${input.material}` : ''}
${input.price ? `Price: $${input.price}` : ''}

## Output (STRICT JSON):
{"thinking":"...","hs6":"XXXXXX","hs6_description":"...","confidence":0.X}`;

  const result = await callLLM<Step8LLMResponse>({ userPrompt: prompt, maxTokens: 150 });
  if (!result.data || !result.data.hs6) return null;

  const code = String(result.data.hs6).replace(/\./g, '').substring(0, 6);
  return {
    hs6: code,
    description: result.data.hs6_description || '',
    confidence: result.data.confidence || 0.7,
  };
}

/**
 * Main export — tries LLM first, falls back to keyword.
 */
export async function matchSubheading(
  resolvedHeading: string,
  keywordResult: KeywordResult,
  price?: number,
  input?: GriProductInput
): Promise<SubheadingResult> {
  if (input) {
    const llmResult = await matchSubheadingLLM(resolvedHeading, input);
    if (llmResult) return llmResult;
  }
  return matchSubheadingKeyword(resolvedHeading, keywordResult);
}
