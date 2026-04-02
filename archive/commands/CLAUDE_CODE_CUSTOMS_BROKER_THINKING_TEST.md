# Claude Code 명령어: "관세사 사고방식" 패러다임 테스트 (v3.0)

## ⚠️ 중요: v2.1 코드 수정 금지 — 별도 파일로 테스트

## 핵심 패러다임 전환

**기존 (v2.1)**:
```
Step 1: LLM → 키워드 추출 (구조화된 JSON)
Step 2: LLM → 키워드 기반 Section 매칭 (JSON: section_1, section_2)
Step 4: LLM → Chapter 매칭 (JSON: chapter_1, chapter_2)
Step 6: LLM → Heading 매칭 (JSON: heading_1, heading_2)
Step 8: LLM → Subheading 매칭 (JSON: hs6)
→ 각 LLM이 독립적으로 판단, 이전 LLM의 "사고 과정"을 모름
```

**신규 (v3.0 "관세사 사고방식")**:
```
Step 1: LLM → 관세사처럼 사고하는 문단 생성 (키워드 X, 추론 문단 O)
         "이 상품은 폐식용유다. 지방/유지류에 해당하므로 Section III,
          Chapter 15를 봐야 한다. 특히 heading 1518(화학변성 비식용 유지)
          또는 1522(유지 잔류물)이 후보다."
Step 2: LLM → Step 1의 추론을 읽고, Section Notes 원문을 참조하여 판단 이어감
Step 4: LLM → 이전 추론 + Chapter Notes 원문을 읽고 판단 이어감
Step 6: LLM → 이전 추론 + 해당 Chapter의 모든 heading 설명을 읽고 판단
Step 8: LLM → 이전 추론 + 해당 heading의 모든 subheading 설명을 읽고 최종 판단
→ 하나의 연속된 사고 과정, 관세사가 HS Nomenclature를 넘기며 분류하는 것과 동일
```

## 원리: 관세사는 이렇게 분류한다

실제 관세사의 분류 과정:
1. 상품을 본다 → "이게 뭔지" 이해한다 (키워드가 아닌 의미 파악)
2. HS Nomenclature 책을 편다 → 해당 Section을 찾는다 (Section Notes 읽음)
3. Section 내에서 Chapter를 찾는다 (Chapter Notes 읽음)
4. Chapter 내에서 Heading을 찾는다 (heading 설명 하나하나 읽음)
5. Heading 내에서 Subheading을 찾는다 (subheading 설명 읽음)
6. 매 단계에서 이전 판단의 이유를 기억하고 있다

**v2.1의 문제**: 각 LLM이 이전 LLM의 사고 과정을 모름. 키워드만 전달되므로 의미가 손실됨.
**v3.0의 해결**: 이전 LLM의 추론 문단을 다음 LLM에게 그대로 전달. 관세사가 메모를 남기며 분류하는 것과 같음.

---

## 구현 상세

### 파일 구조 (v2.1과 분리)

```
app/lib/cost-engine/gri-classifier/
├── pipeline.ts              ← 수정 금지 (v2.1)
├── pipeline-v3.ts           ← 새로 생성 (v3.0 테스트용)
├── steps/
│   ├── step01-keyword-extract.ts    ← 수정 금지
│   ├── step02-section-match.ts      ← 수정 금지
│   ├── v3/                          ← 새 폴더
│   │   ├── step01-product-understanding.ts
│   │   ├── step02-section-reasoning.ts
│   │   ├── step03-section-note-check.ts   (코드, 기존 재사용 가능)
│   │   ├── step04-chapter-reasoning.ts
│   │   ├── step05-chapter-note-check.ts   (코드, 기존 재사용 가능)
│   │   ├── step06-heading-reasoning.ts
│   │   ├── step07-conflict-resolve.ts     (기존 재사용)
│   │   └── step08-subheading-reasoning.ts
│   │   └── types-v3.ts
```

### 핵심 타입 (types-v3.ts)

```typescript
/**
 * v3.0 "관세사 사고방식" — 추론 체인 타입
 *
 * 핵심: 각 스텝은 이전 스텝의 reasoning(추론 문단)을 받고,
 * 자신의 reasoning을 추가하여 다음 스텝에 전달한다.
 */

export interface BrokerReasoning {
  /** 이 스텝에서 관세사가 내린 추론 문단 (1~3문장, 자연어) */
  reasoning: string;

  /** 추론의 결론 (구조화된 결과 — 코드 처리용) */
  conclusion: {
    type: 'section' | 'chapter' | 'heading' | 'subheading';
    primary: string | number;
    secondary?: string | number | null;
    confidence: number;
  };
}

export interface ReasoningChain {
  /** Step 1: 상품 이해 추론 */
  productUnderstanding: string;

  /** Step 2: Section 판단 추론 */
  sectionReasoning?: string;

  /** Step 3: Section Note 적용 결과 */
  sectionNoteResult?: string;

  /** Step 4: Chapter 판단 추론 */
  chapterReasoning?: string;

  /** Step 5: Chapter Note 적용 결과 */
  chapterNoteResult?: string;

  /** Step 6: Heading 판단 추론 */
  headingReasoning?: string;

  /** Step 8: Subheading 판단 추론 */
  subheadingReasoning?: string;
}
```

---

### Step 1: 상품 이해 (Product Understanding) — 가장 중요한 변경

**v2.1**: 키워드 배열 + material + productType 등 구조화된 JSON 추출
**v3.0**: 관세사가 상품을 처음 봤을 때의 사고 과정을 문단으로 생성

```typescript
// step01-product-understanding.ts

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
→ "This is an electronic audio device — specifically wireless earphones using Bluetooth technology, sold with a battery charging case. The primary function is sound reproduction/reception. I would look at Section XVI (Machinery and electrical equipment), Chapter 85 (Electrical machinery). The charging case is an accessory sold with the main product, so it doesn't change classification. Key heading would be 8518 (microphones, loudspeakers, headphones, earphones)."

Product: "Men's Cotton Polo Shirt"
→ "This is a men's upper body garment made of cotton fabric, specifically a polo shirt (knitted, with collar and partial button placket). I would look at Section XI (Textiles), but the critical question is Chapter 61 (knitted/crocheted garments) vs Chapter 62 (not knitted). Polo shirts are typically knitted, so Chapter 61. Within that, heading 6105 covers men's shirts, knitted or crocheted."

Product: "Stainless Steel Kitchen Sink"
→ "This is a plumbing fixture made of stainless steel, used in kitchens for washing. While it's made of base metal (Section XV), I need to check if it's classified as a sanitary/plumbing fixture. Section XV Chapter 73 covers articles of iron or steel. Heading 7324 specifically covers 'sanitary ware and parts thereof, of iron or steel' including sinks and wash basins. This is the correct heading."

## CRITICAL RULES FOR YOUR THINKING:
- Think about MEANING, not keywords. "Used Restaurant Grease" = waste fat, not "restaurant equipment"
- Consider the GRI hierarchy: Section → Chapter → Heading → Subheading
- Brand names are irrelevant to classification — "Nike Air Max" = men's sports footwear with rubber/plastic soles
- If composite: what gives it the ESSENTIAL CHARACTER?
- If a set: classify by the component giving essential character
- If unfinished: GRI 2(a) — classify as the finished article if it has the essential character
- WASTE goes with the ORIGINAL MATERIAL (metal scrap → Ch.72-83, textile waste → Ch.63)
- PARTS: with the machine/article they're for, unless they're general-purpose (screws → Ch.73)

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
```

**핵심 차이점**:
- v2.1 Step 1은 `keywords: ["bluetooth", "wireless", "earbuds", "charging", "case"]` 같은 배열 생성
- v3.0 Step 1은 `"This is an electronic audio device..."` 같은 추론 문단 생성
- v3.0의 추론 문단이 Step 2로 그대로 전달됨

---

### Step 2: Section 추론 (Section Reasoning)

**v2.1**: 21개 Section 제목만 보고 매칭
**v3.0**: Step 1의 추론을 읽고, 21개 Section의 **전체 설명 + Section Notes 원문**을 참조

```typescript
// step02-section-reasoning.ts

// 핵심: Section Notes 원문을 LLM에게 제공
// section-notes.ts에 있는 전체 WCO Section Notes 텍스트를 사용
import { SECTION_NOTES } from '../../data/section-notes';
import { CHAPTER_DESCRIPTIONS, CHAPTER_TO_SECTION } from '../../data/chapter-descriptions';

function buildSectionReference(): string {
  // 21개 Section별로:
  // - Section 번호 + 제목
  // - 포함 Chapter 목록 (번호 + 설명)
  // - Section Note 전문 (있는 경우)
  //
  // 토큰 절약: Section Notes가 매우 긴 경우(Section XI = 16,765자)
  // → 핵심 포함/제외 규칙만 추출 (각 Section 최대 500자)
  //
  // 하지만 은태님 지시: "디테일하게 방대하게 주는게 중요"
  // → 가능한 한 많이 포함. GPT-4o-mini의 128K context를 활용

  let reference = '';

  for (let s = 1; s <= 21; s++) {
    const note = SECTION_NOTES[s];
    if (!note) continue;

    reference += `\n\n### SECTION ${s}: ${note.title}`;
    reference += `\nChapters: `;

    // 해당 Section의 Chapter 목록 + 설명
    const chapters = Object.entries(CHAPTER_DESCRIPTIONS)
      .filter(([ch]) => CHAPTER_TO_SECTION[parseInt(ch)] === s)
      .map(([ch, desc]) => `Ch.${ch} (${desc})`);
    reference += chapters.join(', ');

    // Section Note 원문 (있으면)
    if (note.section_note) {
      // 핵심 부분만 추출 (각 Section 최대 800자)
      // Section Note의 처음 800자에 포함/제외 규칙이 거의 다 있음
      const noteText = note.section_note.substring(0, 800);
      reference += `\n\nSection Note (official WCO text):\n${noteText}`;
      if (note.section_note.length > 800) {
        reference += '\n[... truncated for brevity]';
      }
    }
  }

  return reference;
}

const STEP2_BROKER_PROMPT = `You are continuing your classification as a licensed customs broker.

## WHAT HAPPENED IN STEP 1:
You examined the product and wrote down your initial assessment. Here it is:

"{step1_reasoning}"

## YOUR JOB NOW:
Look at the 21 Sections of the HS Nomenclature below. Based on your initial assessment, determine which Section this product belongs to.

Read the Section Notes carefully — they contain INCLUSION and EXCLUSION rules that OVERRIDE the section titles. For example:
- Section XI Note 1 says "this Section does not cover" certain items (textile-covered furniture → Section XX)
- Section XV Note 1 says "this Section does not cover" paints/inks containing metallic flakes (→ Ch.32)

## HS NOMENCLATURE — ALL 21 SECTIONS:
{section_reference}

## YOUR REASONING:
Continue your classification reasoning. Write 1-2 sentences:
1. Based on your Step 1 understanding, which Section applies?
2. Did any Section Notes EXCLUDE this product from your initial guess?
3. If excluded, which Section should it go to instead?

## OUTPUT (STRICT JSON):
{
  "broker_reasoning": "Your continued reasoning, referencing specific Section Notes if relevant",
  "section_1": N,
  "section_2": N_or_null,
  "confidence": 0.X
}`;
```

---

### Step 3: Section Note Check (코드 — 기존 로직 재사용)

Step 3은 코드로 Section Notes의 포함/제외 규칙을 검증한다.
**변경점**: 검증 결과를 `ReasoningChain.sectionNoteResult`에 자연어로 기록하여 Step 4에 전달.

```typescript
// step03-section-note-check.ts (v3)
// 기존 checkSectionNotes() 로직 재사용
// + 결과를 자연어 문단으로 변환

function formatNoteCheckResult(result: SectionNoteCheckResult): string {
  if (result.excludedSections.length === 0) {
    return `Section Note check passed. Section ${result.validSections[0].section} is confirmed valid. No exclusion rules apply.`;
  }

  const excluded = result.excludedSections
    .map(e => `Section ${e.section} excluded: ${e.reason}`)
    .join('; ');

  return `Section Note check: ${excluded}. Valid sections remaining: ${result.validSections.map(s => `Section ${s.section}`).join(', ')}.`;
}
```

---

### Step 4: Chapter 추론 (Chapter Reasoning)

**v2.1**: Section 내 Chapter 목록 + 짧은 설명만 제공
**v3.0**: 이전 추론 체인 + **Chapter Notes 전문** 제공

```typescript
// step04-chapter-reasoning.ts

import { getChapterNote } from '../../data/chapter-notes';
import { CHAPTER_DESCRIPTIONS } from '../../data/chapter-descriptions';

function buildChapterReference(sectionChapters: number[]): string {
  let reference = '';

  for (const ch of sectionChapters) {
    const desc = CHAPTER_DESCRIPTIONS[ch] || '';
    const note = getChapterNote(ch);

    reference += `\n\n### CHAPTER ${ch}: ${desc}`;

    if (note?.chapter_note) {
      // Chapter Notes 전문 포함 (최대 1500자)
      // Chapter Notes에는 "이 Chapter에 포함/제외되는 품목"이 상세히 적혀 있음
      // 이것이 관세사가 실제로 읽는 것
      const noteText = note.chapter_note.substring(0, 1500);
      reference += `\n\nChapter Note (official WCO text):\n${noteText}`;
      if (note.chapter_note.length > 1500) {
        reference += '\n[... truncated]';
      }
    }
  }

  return reference;
}

const STEP4_BROKER_PROMPT = `You are continuing your classification as a licensed customs broker.

## YOUR REASONING SO FAR:
Step 1 (Product Understanding): "{step1_reasoning}"
Step 2 (Section Decision): "{step2_reasoning}"
Step 3 (Section Note Check): "{step3_result}"

## YOUR JOB NOW:
You've determined the Section. Now find the specific CHAPTER within this Section.
Read the Chapter descriptions AND Chapter Notes below carefully.

Chapter Notes are critical — they define:
- What IS and ISN'T covered by this Chapter
- How to handle composites, sets, parts
- Special definitions (e.g., "stainless steel" = alloy with ≥10.5% chromium in Ch.72 Note 1(d))

## CHAPTERS IN SECTION {section_num}:
{chapter_reference}

## YOUR REASONING:
Continue your classification. Write 1-2 sentences:
1. Which Chapter best fits the product?
2. Did any Chapter Notes redirect or clarify?
3. Key reasoning for your choice.

## OUTPUT (STRICT JSON):
{
  "broker_reasoning": "Your continued reasoning, referencing Chapter Notes",
  "chapter_1": NN,
  "chapter_2": NN_or_null,
  "confidence": 0.X
}`;
```

---

### Step 5: Chapter Note Check (코드 — 기존 재사용)

기존 `checkChapterNotes()` 재사용 + 결과를 자연어로 변환.

---

### Step 6: Heading 추론 (Heading Reasoning) — 가장 중요한 정확도 결정 단계

**v2.1**: Chapter 내 heading 목록만 제공 (각 heading 1줄 설명)
**v3.0**: 이전 추론 체인 + **해당 Chapter의 모든 heading 설명 전문** + **Chapter Notes 전문**

```typescript
// step06-heading-reasoning.ts

import { getHeadingsForChapter } from '../../data/heading-descriptions';
import { getChapterNote } from '../../data/chapter-notes';

const STEP6_BROKER_PROMPT = `You are continuing your classification as a licensed customs broker.

## YOUR COMPLETE REASONING CHAIN:
Step 1 (Product Understanding): "{step1_reasoning}"
Step 2 (Section Decision): "{step2_reasoning}"
Step 3 (Section Note Check): "{step3_result}"
Step 4 (Chapter Decision): "{step4_reasoning}"
Step 5 (Chapter Note Check): "{step5_result}"

## YOUR JOB NOW:
This is the CRITICAL step. You need to find the exact 4-digit HEADING within Chapter {chapter}.

## GRI RULES FOR HEADING SELECTION:
- GRI 1: Classify by the TERMS of headings and Section/Chapter Notes. These have LEGAL force.
- GRI 2(a): Incomplete/unfinished articles → classify as the complete article if they have its essential character
- GRI 2(b): Mixtures/composites → classify under the heading covering the material/component giving essential character
- GRI 3(a): Most specific heading wins over general heading
- GRI 3(b): Composites/sets → essential character test
- GRI 3(c): If still tied → last in numerical order
- GRI 4: Most akin → similar goods
- "Other" headings are LAST RESORT — only when nothing else fits

## ALL HEADINGS IN CHAPTER {chapter}:
{heading_list_with_full_descriptions}

## CHAPTER {chapter} NOTES (full text):
{chapter_note_full_text}

## YOUR REASONING:
This is where your expertise matters most. Write 2-3 sentences:
1. Which heading's description BEST matches this product?
2. If multiple headings could apply, which GRI rule resolves the conflict?
3. Did any Chapter Note redirect this product to a specific heading?

## OUTPUT (STRICT JSON):
{
  "broker_reasoning": "Your detailed reasoning for heading selection",
  "heading_1": "XXXX",
  "heading_1_description": "...",
  "heading_2": "XXXX_or_null",
  "heading_2_description": "..._or_null",
  "needs_conflict_resolution": false,
  "confidence": 0.X
}`;
```

**핵심**: heading 목록을 줄 때 전체 설명을 다 보여준다. heading-descriptions.ts의 1,229개 중 해당 Chapter의 heading만 (보통 10~30개) 전부 포함. 관세사가 실제로 해당 Chapter 페이지를 넘기며 읽는 것과 동일.

---

### Step 8: Subheading 추론 (Subheading Reasoning)

**v2.1**: heading 내 subheading 목록만 제공
**v3.0**: 전체 추론 체인 + 해당 heading의 **모든 subheading 설명** + GRI 6 규칙

```typescript
// step08-subheading-reasoning.ts

import { getSubheadingsForHeading } from '../../data/subheading-descriptions';

const STEP8_BROKER_PROMPT = `You are completing your classification as a licensed customs broker.

## YOUR COMPLETE REASONING CHAIN:
Step 1: "{step1_reasoning}"
Step 2: "{step2_reasoning}"
Step 4: "{step4_reasoning}"
Step 6: "{step6_reasoning}"

## YOUR JOB NOW:
Final step — determine the 6-digit SUBHEADING within heading {heading}.

## GRI 6:
"Classification of goods in the subheadings of a heading shall be determined according to the terms of those subheadings and any related Subheading Notes, and mutatis mutandis, to the above Rules [GRI 1-5]."

In plain English: Apply the same GRI 1-5 rules, but now at the subheading level.

## SUBHEADING HIERARCHY in {heading}:
{subheading_tree}

## COMMON DISTINCTIONS AT SUBHEADING LEVEL:
- Material specificity (cotton vs man-made fiber vs other)
- Processing level (crude/refined, raw/prepared, unworked/worked)
- Size/weight/value thresholds
- Gender specificity (men's/boys' vs women's/girls')
- Specific variety within category
- "Other" = last resort

## YOUR REASONING:
Write 1-2 sentences:
1. Which subheading's terms best describe this product?
2. What specific attribute (material, processing, use) determines the choice?

## OUTPUT (STRICT JSON):
{
  "broker_reasoning": "Your final reasoning",
  "hs6": "XXXXXX",
  "hs6_description": "...",
  "confidence": 0.X
}`;
```

---

### pipeline-v3.ts (테스트 오케스트레이터)

```typescript
// pipeline-v3.ts

/**
 * v3.0 "관세사 사고방식" 파이프라인
 *
 * v2.1과 완전히 분리된 테스트 파이프라인.
 * 핵심 차이: 추론 체인 (reasoning chain) — 각 LLM이 이전 LLM의 사고 과정을 이어받음.
 */

import type { GriProductInput, GriClassificationResult, DecisionStep } from './types';
import { resetTokenCounter, getTotalTokensUsed, callLLM } from './utils/llm-call';

// v3 steps
import { understandProduct } from './steps/v3/step01-product-understanding';
import { reasonSection } from './steps/v3/step02-section-reasoning';
import { checkSectionNotes } from './steps/step03-section-note-check'; // 기존 재사용
import { reasonChapter } from './steps/v3/step04-chapter-reasoning';
import { checkChapterNotes } from './steps/step05-chapter-note-check'; // 기존 재사용
import { reasonHeading } from './steps/v3/step06-heading-reasoning';
import { resolveConflict } from './steps/step07-conflict-resolve'; // 기존 재사용
import { reasonSubheading } from './steps/v3/step08-subheading-reasoning';
import { routeCountry } from './steps/step09-country-router'; // 기존 재사용
import { applyPriceBreak } from './steps/step10-price-break'; // 기존 재사용
import { finalResolve, hashProductName } from './steps/step11-final-resolve'; // 기존 재사용

export async function classifyWithGRI_v3(
  input: GriProductInput,
): Promise<GriClassificationResult> {
  const startTime = Date.now();
  const decisionPath: DecisionStep[] = [];
  const griRulesApplied: { rule: string; reason: string }[] = [];
  let aiCallCount = 0;

  resetTokenCounter();

  // ═══ Step 1: Product Understanding (관세사 사고 시작) ═══
  const step1 = await understandProduct(input);
  aiCallCount++;
  decisionPath.push({
    step: 1, name: 'product_understanding_v3',
    input: input.productName,
    output: step1.reasoning.substring(0, 80) + '...',
    method: 'ai', timeMs: Date.now() - startTime,
  });

  // 추론 체인 시작
  const reasoningChain = {
    step1: step1.reasoning,
  };

  // ═══ Step 2: Section Reasoning (추론 이어감) ═══
  let stepStart = Date.now();
  const step2 = await reasonSection(reasoningChain.step1, input);
  aiCallCount++;
  decisionPath.push({
    step: 2, name: 'section_reasoning_v3',
    input: `Reasoning from Step 1`,
    output: `S${step2.section_1}${step2.section_2 ? `, S${step2.section_2}` : ''} — ${step2.reasoning.substring(0, 60)}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });
  reasoningChain.step2 = step2.reasoning;

  // Step 2 결과를 SectionCandidate[] 형태로 변환 (기존 코드 호환)
  const sectionCandidates = buildSectionCandidates(step2);

  // ═══ Step 3: Section Note Check (코드) ═══
  stepStart = Date.now();
  const step3 = checkSectionNotes(sectionCandidates, buildKeywordResultCompat(step1));
  const step3Summary = formatNoteCheck(step3);
  reasoningChain.step3 = step3Summary;
  decisionPath.push({
    step: 3, name: 'section_note_check',
    input: `${sectionCandidates.length} candidates`,
    output: step3Summary.substring(0, 80),
    method: 'code', timeMs: Date.now() - stepStart,
  });

  // ═══ Step 4: Chapter Reasoning (추론 이어감) ═══
  stepStart = Date.now();
  const step4 = await reasonChapter(reasoningChain, step3.validSections, input);
  aiCallCount++;
  decisionPath.push({
    step: 4, name: 'chapter_reasoning_v3',
    input: `Section ${step3.validSections[0]?.section}`,
    output: `Ch.${step4.chapter_1}${step4.chapter_2 ? `, Ch.${step4.chapter_2}` : ''} — ${step4.reasoning.substring(0, 60)}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });
  reasoningChain.step4 = step4.reasoning;

  // Step 4 결과를 ChapterCandidate[] 형태로 변환
  const chapterCandidates = buildChapterCandidates(step4);

  // ═══ Step 5: Chapter Note Check (코드) ═══
  stepStart = Date.now();
  const step5 = checkChapterNotes(chapterCandidates, buildKeywordResultCompat(step1));
  const step5Summary = formatChapterNoteCheck(step5);
  reasoningChain.step5 = step5Summary;
  decisionPath.push({
    step: 5, name: 'chapter_note_check',
    input: `${chapterCandidates.length} candidates`,
    output: step5Summary.substring(0, 80),
    method: 'code', timeMs: Date.now() - stepStart,
  });

  // ═══ Step 6: Heading Reasoning (추론 이어감) ═══
  stepStart = Date.now();
  const step6 = await reasonHeading(reasoningChain, step5.validChapters, input);
  aiCallCount++;
  decisionPath.push({
    step: 6, name: 'heading_reasoning_v3',
    input: `Ch.${step5.validChapters[0]?.chapter}`,
    output: `${step6.heading_1} — ${step6.reasoning.substring(0, 60)}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });
  reasoningChain.step6 = step6.reasoning;

  // Step 7: Conflict Resolution (기존 로직)
  let resolvedHeading = step6.heading_1;
  // ... (기존 conflict resolution 로직 재사용)

  // ═══ Step 8: Subheading Reasoning (최종 추론) ═══
  stepStart = Date.now();
  const step8 = await reasonSubheading(reasoningChain, resolvedHeading, input);
  aiCallCount++;
  decisionPath.push({
    step: 8, name: 'subheading_reasoning_v3',
    input: resolvedHeading,
    output: `${step8.hs6} — ${step8.reasoning.substring(0, 60)}`,
    method: 'ai', timeMs: Date.now() - stepStart,
  });

  // Steps 9-11: 기존 로직 재사용 (Country Router, Price Break, Final Resolve)
  // ...

  return finalResult;
}
```

---

## 참조 파일 활용 전략

각 Step에서 제공할 참조 파일의 **정확한 범위와 분량**:

| Step | 참조 파일 | 포함 범위 | 예상 토큰 |
|------|----------|----------|----------|
| Step 1 | 없음 (순수 상품 이해) | — | ~500 (프롬프트만) |
| Step 2 | section-notes.ts 21개 전부 | Section 제목 + Chapter 목록 + Section Note 핵심 (각 800자) | ~8,000 |
| Step 3 | (코드) | — | 0 |
| Step 4 | chapter-notes.ts 해당 Section만 | Chapter 설명 + Chapter Note 전문 (각 1,500자) | ~4,000 |
| Step 5 | (코드) | — | 0 |
| Step 6 | heading-descriptions.ts 해당 Chapter만 + chapter-notes.ts | 10~30개 heading 전체 설명 + Chapter Note | ~3,000 |
| Step 7 | conflict-patterns-data.ts 해당 Chapter만 | 대립 패턴 (필요 시) | ~1,000 |
| Step 8 | subheading-descriptions.ts 해당 heading만 | 3~20개 subheading 전체 설명 | ~1,500 |

**총 예상 토큰**: 입력 ~18,000 + 출력 ~1,500 = ~19,500 토큰/건
**예상 비용**: GPT-4o-mini 기준 ~$0.004/건 (v2.1의 ~$0.001 대비 4배, 여전히 경쟁사 대비 1/40)

---

## 벤치마크 실행 방법

### 1. 구현 순서

```bash
# 1. v3 폴더 생성
mkdir -p app/lib/cost-engine/gri-classifier/steps/v3/

# 2. 각 step 파일 생성 (위 설계대로)

# 3. pipeline-v3.ts 생성

# 4. 벤치마크 스크립트 수정 (v3 파이프라인 호출)
# scripts/gri_benchmark.ts → scripts/gri_benchmark_v3.ts
# import { classifyWithGRI_v3 } from '../app/lib/cost-engine/gri-classifier/pipeline-v3';

# 5. 빌드 확인
npm run build

# 6. 벤치마크 실행
npx tsx scripts/gri_benchmark_v3.ts
```

### 2. 결과 비교 포맷

```
GRI 파이프라인 버전별 정확도 비교
═══════════════════════════════════
                  6-digit  4-digit  Chapter  AI calls  Cost/call  Avg time
v1.2 (keyword):    6%      16%      35%      0         $0         ~1s
v2.0 (LLM):       13%      28%      44%      4         $0.001     ~8s
v2.1 (+Step1):    20%      36%      52%      5         $0.001     ~10s
v3.0 (Broker):    ??%      ??%      ??%      5         ~$0.004    ~??s

핵심 변화:
- chapter_miss: 48 → ?? 건 (v2.1에서 48건이 잘못된 Chapter)
- heading_miss: 16 → ?? 건
- subheading_miss: 16 → ?? 건

v3.0 reasoning 체인 예시 (1번 문제):
Step 1: "..."
Step 2: "..."
Step 4: "..."
Step 6: "..."
Step 8: "..."
→ 정답: XXXXXX / 예측: XXXXXX (O/X)
```

### 3. 오류 분석

틀린 문제마다 reasoning chain 전체를 기록하여 **어느 Step에서 추론이 잘못됐는지** 파악:
- reasoning_miss_step1: Step 1에서 상품 자체를 잘못 이해 (예: "grease" = 윤활유 vs 식용유)
- reasoning_miss_step2: 상품 이해는 맞았으나 Section 선택이 잘못됨
- reasoning_miss_step4: Section은 맞았으나 Chapter 선택이 잘못됨
- reasoning_miss_step6: Chapter는 맞았으나 Heading 선택이 잘못됨
- reasoning_miss_step8: Heading은 맞았으나 Subheading 선택이 잘못됨

이 분석이 v2.1에서는 불가능했음 (키워드만 전달되므로 "왜 틀렸는지" 알 수 없음).
v3.0에서는 추론 문단이 있으므로 **정확히 어디서 잘못됐는지** 진단 가능.

---

## 실행 규칙

1. **v2.1 코드 수정 절대 금지** — v3는 완전히 별도 파일
2. **npm run build 통과 확인 후 벤치마크 실행**
3. **100건 전체 벤치마크** (scripts/gri_benchmark.ts와 동일 데이터)
4. **결과 저장**: `/Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v3.0_results.json`
5. **reasoning chain 로그 저장**: 각 문제의 전체 reasoning chain을 JSON에 포함
6. **v2.1 vs v3.0 비교표 출력**
7. **오류 분석**: reasoning_miss_step 별 건수 집계

## 예상 결과

**낙관적**: 6-digit 35~45%, 4-digit 55~65%, Chapter 70~80%
- 근거: 관세사의 실제 사고 방식을 모사, Section Notes/Chapter Notes 원문 참조

**보수적**: 6-digit 25~30%, 4-digit 40~50%, Chapter 55~65%
- 근거: GPT-4o-mini의 한계 (추론 능력이 GPT-4o 대비 낮음)

**어느 쪽이든 v2.1(20%/36%/52%) 대비 유의미한 변화가 있으면 방향성 확인 완료.**
v3.0이 성공하면 → GPT-4o로 교체 시 89%+ 가능성 열림.
v3.0이 실패하면 → 추론 체인이 아닌 다른 접근 필요 (예: few-shot, fine-tuning).
