/**
 * v3 Step 8: Subheading Reasoning — final 6-digit determination.
 */

import type { GriProductInput } from '../../types';
import { callLLM } from '../../utils/llm-call';
import { getSubheadingsForHeading } from '../../data/subheading-descriptions';

export interface Step8V3Result {
  reasoning: string;
  hs6: string;
  confidence: number;
}

export async function reasonSubheading(
  chain: { step1: string; step2: string; step4: string; step6: string },
  resolvedHeading: string,
  input: GriProductInput
): Promise<Step8V3Result> {
  const heading4 = resolvedHeading.substring(0, 4);
  const subheadings = getSubheadingsForHeading(heading4);

  if (subheadings.length === 0) {
    return { reasoning: 'No subheadings found.', hs6: heading4 + '00', confidence: 0.5 };
  }
  if (subheadings.length === 1) {
    return { reasoning: `Only one subheading under ${heading4}.`, hs6: subheadings[0].code, confidence: 0.9 };
  }

  const subList = subheadings.map(s => `${s.code}: ${s.description}`).join('\n');

  const prompt = `You are completing your classification as a licensed customs broker.

## YOUR REASONING CHAIN:
Step 1: "${chain.step1}"
Step 2: "${chain.step2}"
Step 4: "${chain.step4}"
Step 6: "${chain.step6}"

## YOUR JOB NOW:
Final step — determine the 6-digit SUBHEADING within heading ${heading4}.

## GRI 6:
Apply GRI 1-5 at the subheading level. Most specific subheading wins. "Other" = last resort.

## SUBHEADINGS UNDER ${heading4}:
${subList}

## COMMON DISTINCTIONS:
- Material specificity (cotton vs synthetic)
- Processing level (crude/refined, frozen/fresh)
- Size/weight/value thresholds
- Gender (men's/boys' vs women's/girls')
- "Other" = last resort

Product: "${input.productName}"
${input.material ? `Material: ${input.material}` : ''}

## OUTPUT (STRICT JSON):
{"broker_reasoning":"Your final reasoning","hs6":"XXXXXX","confidence":0.X}`;

  const result = await callLLM<{ broker_reasoning: string; hs6: string; confidence: number }>({
    userPrompt: prompt,
    maxTokens: 150,
    temperature: 0,
  });

  if (!result.data) return { reasoning: 'Unable to determine subheading.', hs6: heading4 + '00', confidence: 0.3 };

  return {
    reasoning: result.data.broker_reasoning || '',
    hs6: String(result.data.hs6 || heading4 + '00').replace(/\./g, '').substring(0, 6),
    confidence: result.data.confidence || 0.5,
  };
}
