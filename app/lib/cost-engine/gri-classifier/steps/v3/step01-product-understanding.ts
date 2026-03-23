/**
 * v3 Step 1: Product Understanding — "관세사 사고방식"
 * Generates a reasoning paragraph, not keywords.
 */

import type { GriProductInput } from '../../types';
import { callLLM } from '../../utils/llm-call';

const STEP1_BROKER_PROMPT = `You are an experienced licensed customs broker with 20 years of experience classifying goods under the Harmonized System.

A client just handed you a product to classify. Your job is to THINK about this product the way you would in real life — before you even open the HS Nomenclature book.

## YOUR THOUGHT PROCESS:
Write 2-4 sentences explaining:
1. WHAT this product actually IS (not keywords — your understanding)
2. What MATERIAL it is primarily made of (if determinable)
3. What its PRIMARY FUNCTION or USE is
4. Which SECTION of the HS Nomenclature you would look at FIRST and WHY
5. Any TRICKY aspects — is this a composite product? A set? A part? Waste/scrap? An unfinished good?

## EXAMPLES OF HOW YOU THINK:

Product: "Used Restaurant Grease"
→ "This is waste cooking oil/fat from restaurant use. It's an animal or vegetable fat that has been used and is no longer fit for human consumption. I would look at Section III (Animal, vegetable or microbial fats and oils) — specifically Chapter 15. The key question is whether this is crude/refined fat (heading 1518 for chemically modified fats) or residue/waste (heading 1522 for degras and residues). Since it's 'used' restaurant grease, heading 1522 (residues from treatment of fatty substances) is most likely."

Product: "Bluetooth Wireless Earbuds with Charging Case"
→ "This is an electronic audio device — specifically wireless earphones using Bluetooth technology, sold with a battery charging case. The primary function is sound reproduction/reception. I would look at Section XVI (Machinery and electrical equipment), Chapter 85. The charging case is an accessory sold with the main product, so it doesn't change classification. Key heading would be 8518 (microphones, loudspeakers, headphones, earphones)."

Product: "Men's Cotton Polo Shirt"
→ "This is a men's upper body garment made of cotton fabric, specifically a polo shirt (knitted, with collar and partial button placket). I would look at Section XI (Textiles), but the critical question is Chapter 61 (knitted/crocheted garments) vs Chapter 62 (not knitted). Polo shirts are typically knitted, so Chapter 61. Within that, heading 6105 covers men's shirts, knitted or crocheted."

Product: "Stainless Steel Kitchen Sink"
→ "This is a plumbing fixture made of stainless steel, used in kitchens for washing. Section XV Chapter 73 covers articles of iron or steel. Heading 7324 specifically covers 'sanitary ware and parts thereof, of iron or steel' including sinks and wash basins."

## CRITICAL RULES FOR YOUR THINKING:
- Think about MEANING, not keywords. "Used Restaurant Grease" = waste fat, not "restaurant equipment"
- Brand names are irrelevant — "Nike Air Max" = men's sports footwear with rubber/plastic soles
- If composite: what gives it the ESSENTIAL CHARACTER?
- WASTE goes with the ORIGINAL MATERIAL (metal scrap → Ch.72-83, textile waste → Ch.63)
- PARTS: with the machine/article they're for, unless general-purpose (screws → Ch.73)
- CBP ruling titles: extract the ACTUAL PRODUCT from the ruling description

## OUTPUT FORMAT (STRICT JSON):
{
  "broker_reasoning": "Your 2-4 sentence reasoning paragraph as shown in examples above",
  "likely_section": N,
  "likely_chapter": NN,
  "likely_heading": "NNNN or null if uncertain",
  "material": "primary material or null",
  "is_composite": false,
  "is_waste": false,
  "is_part": false,
  "confidence": 0.X
}`;

export interface Step1V3Result {
  reasoning: string;
  likelySection: number;
  likelyChapter: number;
  likelyHeading: string | null;
  material: string | null;
  isComposite: boolean;
  isWaste: boolean;
  isPart: boolean;
  confidence: number;
}

interface Step1LLMResponse {
  broker_reasoning: string;
  likely_section: number;
  likely_chapter: number;
  likely_heading: string | null;
  material: string | null;
  is_composite: boolean;
  is_waste: boolean;
  is_part: boolean;
  confidence: number;
}

export async function understandProduct(input: GriProductInput): Promise<Step1V3Result> {
  const userPrompt = `Product: "${input.productName}"
${input.description ? `Description: ${input.description}` : ''}
${input.material ? `Material: ${input.material}` : ''}
${input.price ? `Price: $${input.price}` : ''}`;

  const result = await callLLM<Step1LLMResponse>({
    userPrompt: STEP1_BROKER_PROMPT + '\n\n' + userPrompt,
    maxTokens: 350,
    temperature: 0,
  });

  if (!result.data) {
    return {
      reasoning: `Product "${input.productName}" — unable to analyze.`,
      likelySection: 16, likelyChapter: 84, likelyHeading: null,
      material: null, isComposite: false, isWaste: false, isPart: false, confidence: 0.3,
    };
  }

  const d = result.data;
  return {
    reasoning: d.broker_reasoning || '',
    likelySection: d.likely_section || 16,
    likelyChapter: d.likely_chapter || 84,
    likelyHeading: d.likely_heading || null,
    material: d.material || null,
    isComposite: d.is_composite || false,
    isWaste: d.is_waste || false,
    isPart: d.is_part || false,
    confidence: d.confidence || 0.5,
  };
}
