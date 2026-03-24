# Claude Code 명령어: Step 2 Section Match 개선 (v2.2)

## 목표
Step 2의 Section 매칭 정확도를 개선한다.
핵심: **코드로 후보를 먼저 좁히고, LLM한테 후보 + 맥락을 줘서 판단만 시킨다.**

## 배경
- v2.0 (Step2~8 LLM): 13%/28%/44%
- v2.1 (+Step1 LLM): 20%/36%/52%
- chapter_miss: 48건 (48%) — Step 2~4에서 잘못된 Section/Chapter로 간 것
- **문제**: 현재 Step 2 LLM이 21개 Section 제목만 보고 판단 → heading-descriptions.ts 1,229개의 구체적 키워드를 활용하지 못함
- **해결**: 코드가 heading 설명에서 키워드 매칭으로 후보를 먼저 좁히고, LLM한테 후보만 제공

## 변경 파일
`app/lib/cost-engine/gri-classifier/steps/step02-section-match.ts`

## 구현 상세

### 1단계: 코드 pre-filtering 함수 추가

```typescript
/**
 * 코드로 heading-descriptions 1,229개에서 Step 1 키워드와 매칭되는
 * Chapter/Section 후보를 추출한다.
 *
 * 관세사가 하는 것과 같은 순서:
 * "이 키워드가 어떤 heading 설명에 등장하는지 찾기" → 해당 Chapter → Section
 */
function preFilterSections(keywordResult: KeywordResult): {
  candidateSections: number[];
  matchedHeadings: { code: string; description: string; chapter: number; section: number; matchedKeywords: string[] }[];
  matchSummary: string;
} {
  const { keywords, material, productType, productUnderstood } = keywordResult;

  // 1. Step 1에서 나온 모든 키워드 수집 (productUnderstood에서도 추출)
  const allKeywords = [...keywords];
  if (productUnderstood) {
    // productUnderstood에서 추가 키워드 추출
    // "chocolate-covered wafer bar" → ["chocolate", "wafer", "bar"]
    const understoodWords = productUnderstood
      .toLowerCase()
      .replace(/[^a-z0-9\s\-\/]/g, ' ')
      .split(/[\s\/]+/)
      .filter(w => w.length > 2 && !HEADING_STOPWORDS.has(w));
    for (const w of understoodWords) {
      if (!allKeywords.includes(w)) allKeywords.push(w);
    }
  }

  // 2. heading-descriptions 1,229개에서 키워드 매칭
  const headingMatches: Map<string, { description: string; chapter: number; section: number; matchedKeywords: string[] }> = new Map();

  for (const [code, description] of Object.entries(HEADING_DESCRIPTIONS)) {
    const descLower = description.toLowerCase();
    const chapter = parseInt(code.substring(0, 2), 10);
    const section = CHAPTER_TO_SECTION[chapter];
    if (!section) continue;

    const matched: string[] = [];
    for (const kw of allKeywords) {
      // 정확 매칭
      if (descLower.includes(kw)) {
        matched.push(kw);
      }
      // stem 매칭 (shirts↔shirt)
      const kwStem = stemBasic(kw);
      if (kwStem !== kw && kwStem.length > 3) {
        const descWords = descLower.split(/\s+/);
        for (const dw of descWords) {
          if (stemBasic(dw) === kwStem && !matched.includes(kw)) {
            matched.push(kw + '~');  // ~ = stem match
            break;
          }
        }
      }
    }

    if (matched.length > 0) {
      headingMatches.set(code, { description, chapter, section, matchedKeywords: matched });
    }
  }

  // 3. Section별 매칭 점수 계산
  const sectionScores: Map<number, number> = new Map();
  const sectionHeadings: Map<number, string[]> = new Map();

  for (const [code, match] of headingMatches) {
    const s = match.section;
    sectionScores.set(s, (sectionScores.get(s) || 0) + match.matchedKeywords.length);
    if (!sectionHeadings.has(s)) sectionHeadings.set(s, []);
    sectionHeadings.get(s)!.push(`${code}: ${match.description}`);
  }

  // material/productType 보너스 (기존 로직 유지)
  if (material) {
    const bonusSections = MATERIAL_SECTION_BONUS[material];
    if (bonusSections) {
      for (const s of bonusSections) {
        sectionScores.set(s, (sectionScores.get(s) || 0) + 3);
      }
    }
  }
  if (productType) {
    const bonusSections = PRODUCT_TYPE_SECTION_BONUS[productType];
    if (bonusSections) {
      for (const s of bonusSections) {
        sectionScores.set(s, (sectionScores.get(s) || 0) + 3);
      }
    }
  }

  // 4. 상위 5개 Section 후보 (최소 1개는 보장)
  const sorted = [...sectionScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 매칭 0건인 경우 fallback (Section 16, 20)
  if (sorted.length === 0) {
    sorted.push([16, 0.1], [20, 0.1]);
  }

  const candidateSections = sorted.map(([s]) => s);

  // 5. LLM에게 보여줄 매칭 요약 생성
  let summary = '';
  for (const [s, score] of sorted) {
    const headings = sectionHeadings.get(s) || [];
    const title = SECTION_KEYWORDS[s]?.title || '';
    summary += `\n\nSection ${s} (${title}) — ${score} keyword matches:`;
    // 매칭된 heading 중 상위 5개만 (토큰 절약)
    for (const h of headings.slice(0, 5)) {
      summary += `\n  - ${h}`;
    }
    if (headings.length > 5) {
      summary += `\n  - ... and ${headings.length - 5} more headings`;
    }
  }

  return {
    candidateSections,
    matchedHeadings: [...headingMatches.entries()].map(([code, m]) => ({ code, ...m })),
    matchSummary: summary,
  };
}
```

### 2단계: LLM 프롬프트 개선

기존 STEP2_PROMPT를 **완전히 새로 작성**한다.

```typescript
const STEP2_PROMPT_V2 = `You are a licensed customs broker classifying a product into the correct HS Section.

## WHAT HAPPENED BEFORE YOU:
1. Step 1 (Product Understanding): An AI analyzed the product name and identified what the product actually IS — its material, type, processing level, and relevant HS keywords.
2. Pre-filtering (Code): We searched all 1,229 HS heading descriptions for keywords from Step 1. The matching headings were grouped by Section, and the top candidates are shown below.

## YOUR JOB:
Look at the candidate Sections below. Each candidate shows:
- The Section number and title
- How many keywords matched
- The actual heading descriptions that matched (these are WCO official HS heading texts)

Pick the BEST Section. The keyword matching already did the hard work of finding WHERE the keywords appear. You need to judge WHICH match is the correct one for this specific product.

## JUDGMENT RULES:
1. MORE keyword matches in a Section = stronger signal, but not always decisive
2. MATERIAL priority for raw/semi-processed goods (e.g., copper wire → Section XV base metals, NOT XVI electrical)
3. FUNCTION priority for finished goods (e.g., washing machine → Section XVI machinery, NOT XV base metals)
4. SPECIFIC sections override general (clothing → ALWAYS Section XI/XII, pharmaceuticals → ALWAYS Section VI)
5. WASTE/SCRAP goes with the ORIGINAL MATERIAL (metal scrap → XV, used cooking oil → III)
6. TOY versions go to Section XX (toy car = XX, NOT XVII vehicles)
7. PARTS of machines: with the machine (XVI) unless general-use parts like screws (XV)
8. If the pre-filter missed the right Section (0 keyword matches for the correct one), you CAN pick a Section not in the candidate list — but explain why

## CRITICAL:
- The heading descriptions shown are the OFFICIAL WCO HS text. Trust them.
- If you see the product's exact material or form described in a heading, that's very strong evidence.
- "n.e.c." means "not elsewhere classified" — only use these as last resort.`;

// LLM 호출 부분
async function matchSectionsLLMv2(
  input: GriProductInput,
  keywordResult: KeywordResult
): Promise<SectionCandidate[]> {
  // 1. 코드 pre-filtering
  const preFilter = preFilterSections(keywordResult);

  // 2. LLM 프롬프트 조립
  const userPrompt = `## PRODUCT INFORMATION (from Step 1):
Product name: "${input.productName}"
${keywordResult.productUnderstood ? `Product understood as: "${keywordResult.productUnderstood}"` : ''}
${keywordResult.material ? `Primary material: ${keywordResult.material}` : ''}
${keywordResult.materialSecondary ? `Secondary material: ${keywordResult.materialSecondary}` : ''}
${keywordResult.productType ? `Product type: ${keywordResult.productType}` : ''}
${keywordResult.processingLevel ? `Processing level: ${keywordResult.processingLevel}` : ''}
${keywordResult.isWaste ? `⚠️ WASTE/USED product` : ''}
${keywordResult.isComposite ? `Composite/multi-material product` : ''}
${keywordResult.hsNotes ? `HS classification notes: ${keywordResult.hsNotes}` : ''}
Keywords: ${keywordResult.keywords.slice(0, 15).join(', ')}

## CANDIDATE SECTIONS (pre-filtered by keyword matching against 1,229 heading descriptions):
${preFilter.matchSummary}

## YOUR ANSWER (STRICT JSON only):
{"thinking":"your reasoning in 1-2 sentences","section_1":N,"section_2":N_or_null,"section_3":N_or_null,"confidence":0.X}`;

  const result = await callLLM<Step2LLMResponse>({
    userPrompt: STEP2_PROMPT_V2 + '\n\n' + userPrompt,
    maxTokens: 200,
    temperature: 0,
  });

  // ... 기존 후처리 로직 유지
}
```

### 3단계: matchSections() 메인 함수 수정

```typescript
export async function matchSections(
  keywordResult: KeywordResult,
  input: GriProductInput,
): Promise<SectionCandidate[]> {
  // v2.2: LLM with pre-filtered candidates
  try {
    const llmResult = await matchSectionsLLMv2(input, keywordResult);
    if (llmResult.length > 0) return llmResult;
  } catch {
    // LLM failed, fall through to keyword-only
  }

  // Fallback: keyword-only matching
  return matchSectionsKeyword(keywordResult);
}
```

## 실행 순서

1. **현재 벤치마크 결과 확인** (이미 완료: v2.1 = 20%/36%/52%)
2. `step02-section-match.ts` 수정 (위 구현 적용)
3. `npm run build` — 빌드 에러 0 확인
4. 벤치마크 실행: `npx tsx scripts/gri_benchmark.ts`
5. 결과 저장: `gri_benchmark_v2.2_results.json`
6. v2.1 vs v2.2 비교표 출력:
   ```
   GRI v2.1 vs v2.2 비교표
   ══════════════════════════
                 6-digit  4-digit  Chapter  AI calls  Avg time
   v2.1:          20%      36%      52%      5.0       28.0s
   v2.2:          ??%      ??%      ??%      ?.?       ??.?s
                  ↑+?%     ↑+?%     ↑+?%

   오류 변화:
   - chapter_miss: 48 → ?? 건
   - heading_miss: 16 → ?? 건
   - subheading_miss: 16 → ?? 건
   ```
7. 틀린 항목 상세 분석 (패턴 분류)

## 핵심 원리
- **데이터 안에 이미 답이 있다**: heading-descriptions.ts 1,229개에 각 heading의 구체적 설명이 있음
- **코드로 후보를 좁히고, LLM한테 판단만 시킨다**: 21개 전체 → 3~5개 후보
- **LLM한테 맥락을 제공한다**: Step 1의 이해 결과 + 코드 매칭 결과를 함께 전달
- **관세사와 동일한 순서**: 키워드로 관련 heading 찾기 → 후보 중 판단

## 비용 영향
- LLM 호출 횟수: 변동 없음 (여전히 Step 2에서 1회)
- Input 토큰: 약간 증가 (후보 heading 설명 추가), 하지만 21개 Section 전체 설명은 삭제
- 예상: 건당 $0.001 → $0.001 (차이 무시할 수준)
