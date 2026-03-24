# CLAUDE_CODE_STEP05_LLM_EXTRACTION.md
# Step 0.5 — GPT-4o-mini 기반 9-Field 자동 추출 시스템 구축 + 벤치마크
# 생성: 2026-03-20 KST (CW18 Cowork)

## 배경

v3 파이프라인은 9-field가 제대로 채워지면 HS6 100% (Amazon 50건 증명).
문제는 외부 데이터(플랫폼별로 필드 구조가 다름)에서 9-field를 정확히 채우는 것.

해결: GPT-4o-mini 1회 호출로 플랫폼 데이터 → POTAL 9-field 자동 추출.
이때 v3 파이프라인의 **모든 기준 데이터를 참조 파일로 첨부**해서
LLM이 HS 관세 분류 기준으로 정확하게 필드를 나누도록 함.

---

## Phase 1: 9field_reference.json 생성

v3 파이프라인의 기준 데이터를 **하나도 빠짐없이** 하나의 JSON 파일로 합친다.

### 포함해야 할 소스 파일 (전부 필수, 하나도 빠지면 안 됨):

**steps/v3/ 에서 추출:**
| 파일 | 추출할 데이터 |
|------|------------|
| step0-input.ts | MATERIAL_KEYWORDS (~40 그룹) 전체, PROCESSING_KEYWORDS 전체 |
| step2-1-section-candidate.ts | MATERIAL_TO_SECTION 매핑 전체, CATEGORY_TO_SECTION 매핑 전체, PASSIVE_ACCESSORY_WORDS 전체 |
| step2-3-chapter-candidate.ts | MATERIAL_CHAPTER_MAP 전체, PROCESSING_CHAPTER_MAP 전체, ARTICLE_KEYWORDS 전체 |
| step3-heading.ts | KEYWORD_TO_HEADINGS 전체 (~500+ 매핑) |
| step4-subheading.ts | SUBHEADING_SYNONYMS 전체 (~200+), MAT_SYN 전체 (소재 동의어 그룹) |

**data/ 에서 추출:**
| 파일 | 추출할 데이터 |
|------|------------|
| codified-rules.ts | CODIFIED_RULES 배열 전체 (592개 규칙) |
| heading-descriptions.ts | HEADING_DESCRIPTIONS 전체 (1,233개 heading → 설명 매핑) |
| subheading-descriptions.ts | SUBHEADING_DESCRIPTIONS 전체 (5,621개 subheading → 설명 매핑) |
| chapter-descriptions.ts | CHAPTER_DESCRIPTIONS 전체 (97개 chapter → 설명), CHAPTER_TO_SECTION 전체 |
| codified-headings.ts | HeadingKeywords 데이터 전체 (heading별 product_type, conditions 등) |
| codified-subheadings.ts | SubheadingKeywords 데이터 전체 |
| section-notes.ts | Section Notes 전체 (21개 Section) |
| chapter-notes.ts | Chapter Notes 전체 (97개 Chapter) |
| subheading-notes.ts | Subheading Notes 전체 |
| conflict-patterns.ts + conflict-patterns-data.ts | 대립 패턴 데이터 전체 |
| gri-rules.ts | GRI 1~6 규칙 전체 |
| heading-method-tags.ts | Heading method 태그 전체 |

### 생성할 파일 구조:

```json
{
  "version": "v3.1",
  "created": "2026-03-20",
  "description": "POTAL v3 파이프라인 전체 기준 데이터 — 9-field 추출용 참조",

  "material_keywords": {
    "description": "소재/재질 키워드 그룹. 상품 데이터에서 material 필드 추출 시 참조",
    "data": { ... MATERIAL_KEYWORDS 전체 ... }
  },

  "processing_keywords": {
    "description": "가공/제조 방식 키워드. processing 필드 추출 시 참조",
    "data": { ... PROCESSING_KEYWORDS 전체 ... }
  },

  "material_to_section": {
    "description": "소재 → HS Section 매핑. material이 어떤 Section에 속하는지",
    "data": { ... MATERIAL_TO_SECTION 전체 ... }
  },

  "category_to_section": {
    "description": "카테고리 → HS Section 매핑. category 추출 기준",
    "data": { ... CATEGORY_TO_SECTION 전체 ... }
  },

  "material_chapter_map": {
    "description": "소재 → Chapter 세부 매핑",
    "data": { ... }
  },

  "processing_chapter_map": {
    "description": "가공방식 → Chapter 매핑",
    "data": { ... }
  },

  "keyword_to_headings": {
    "description": "상품 키워드 → Heading 4자리 매핑 (~500+)",
    "data": { ... }
  },

  "subheading_synonyms": {
    "description": "Subheading 동의어 (~200+)",
    "data": { ... }
  },

  "mat_syn": {
    "description": "소재 동의어 그룹",
    "data": { ... }
  },

  "passive_accessory_words": {
    "description": "수동 액세서리 키워드 (stand, holder, mount 등)",
    "data": [ ... ]
  },

  "article_keywords": {
    "description": "제품 형태 키워드 (bottle, container 등)",
    "data": { ... }
  },

  "codified_rules": {
    "description": "Section/Chapter Notes 592개 규칙",
    "count": 592,
    "data": [ ... ]
  },

  "heading_descriptions": {
    "description": "1,233개 Heading → 설명 매핑",
    "count": 1233,
    "data": { ... }
  },

  "subheading_descriptions": {
    "description": "5,621개 Subheading → 설명 매핑",
    "count": 5621,
    "data": { ... }
  },

  "chapter_descriptions": {
    "description": "97개 Chapter → 설명 + Section 매핑",
    "data": { ... }
  },

  "codified_headings": {
    "description": "Heading별 product_type, conditions, keywords",
    "data": { ... }
  },

  "codified_subheadings": {
    "description": "Subheading별 conditions, keywords",
    "data": { ... }
  },

  "section_notes": {
    "description": "21개 Section Notes 원문",
    "data": { ... }
  },

  "chapter_notes": {
    "description": "97개 Chapter Notes 원문",
    "data": { ... }
  },

  "subheading_notes": {
    "description": "Subheading Notes 원문",
    "data": { ... }
  },

  "conflict_patterns": {
    "description": "대립 패턴 데이터 (heading 간 경합 시 판단 기준)",
    "data": { ... }
  },

  "gri_rules": {
    "description": "GRI 1~6 해석 규칙",
    "data": { ... }
  },

  "heading_method_tags": {
    "description": "Heading method 분류 태그",
    "data": { ... }
  }
}
```

### 실행 방법:

```bash
# 1. 각 TypeScript 파일에서 데이터 추출
# 2. 하나의 JSON으로 합치기
# 3. 파일 크기 확인 (GPT-4o-mini context window 128K 토큰 내에 들어가는지)

# 저장 위치:
# app/lib/cost-engine/gri-classifier/data/9field_reference.json
# 백업: /Volumes/soulmaten/POTAL/7field_benchmark/9field_reference.json
```

### ⚠️ 중요 체크:
- TypeScript 파일에서 const 데이터를 추출할 때 **전체를 빠짐없이** 가져올 것
- description 필드를 각 섹션에 추가해서 LLM이 각 데이터의 용도를 이해하도록
- 파일 크기가 128K 토큰을 초과하면 → heading_descriptions + subheading_descriptions를 요약 버전으로 (설명 텍스트 축약)
- 초과하지 않으면 전체 포함

---

## Phase 2: Step 0.5 — GPT-4o-mini 추출 코드 구현

### 파일 생성: `app/lib/cost-engine/gri-classifier/steps/v3/step05-field-extraction.ts`

```typescript
// Step 0.5: GPT-4o-mini 기반 9-Field 자동 추출
//
// 어떤 플랫폼에서 어떤 형식으로 데이터가 오든,
// 9field_reference.json을 참조해서 POTAL 9-field로 변환.
//
// 입력: 플랫폼에서 온 상품 데이터 (필드 구조 불명)
// 출력: POTAL 9-field JSON (없는 필드는 null)

import { OpenAI } from 'openai'; // 또는 기존 프로젝트의 LLM 호출 방식
import referenceData from '../data/9field_reference.json';

interface PotalNineFields {
  product_name: string | null;
  material: string | null;
  category: string | null;
  description: string | null;
  processing: string | null;
  composition: string | null;
  weight_spec: string | null;
  price: string | null;
  origin_country: string | null;
}

const SYSTEM_PROMPT = `너는 HS Code 관세 분류 전문가야.
아래 첨부된 기준 데이터를 참고해서, 입력된 상품 데이터를 POTAL 9-field로 나눠줘.

9-field 정의:
- product_name: 상품의 이름/명칭
- material: 주요 소재/재질 (기준 데이터의 material_keywords 참조)
- category: HS Section 기준 상품 카테고리 (기준 데이터의 category_to_section 참조)
- description: 상품의 기능, 용도, 특징 설명
- processing: 가공/제조 방식 (기준 데이터의 processing_keywords 참조)
- composition: 소재 성분비 (예: 80% Cotton 20% Polyester)
- weight_spec: 무게, 크기, 규격
- price: 가격
- origin_country: 원산지/제조국

규칙:
1. 데이터에 명시적으로 적혀 있는 내용만 추출할 것
2. 추측하지 말 것 — 데이터에 없으면 null
3. 하나의 필드에 여러 정보가 합쳐져 있으면 각각 분리해서 해당 field에 배치
4. 어떤 언어로 들어오든 영어로 출력
5. JSON으로만 응답 (다른 텍스트 없이)

기준 데이터:
${JSON.stringify(referenceData)}`;

export async function extractNineFields(
  platformData: Record<string, any>
): Promise<PotalNineFields> {

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(platformData) }
    ]
  });

  return JSON.parse(response.choices[0].message.content!) as PotalNineFields;
}
```

### ⚠️ 구현 시 확인사항:
1. **기존 프로젝트의 LLM 호출 방식 확인** — OpenAI SDK가 이미 있는지, 다른 방식인지
2. **OPENAI_API_KEY 환경변수** 확인 (Vercel + 로컬)
3. **9field_reference.json 크기가 시스템 프롬프트에 들어가는지** — 128K 토큰 초과 시 분할 전략 필요
4. **temperature: 0** — 추출이므로 창의성 불필요, 일관된 결과 필요
5. **response_format: json_object** — JSON만 응답하도록 강제

### pipeline-v3.ts 수정:

```typescript
// 기존 classifyV3() 함수 앞에 Step 0.5 추가:
export async function classifyV3(input: any) {
  // Step 0.5: 플랫폼 데이터 → 9-field 추출 (NEW)
  const nineFields = await extractNineFields(input);

  // Step 0: 기존 Input Normalization (nineFields 사용)
  const normalized = validateAndNormalize(nineFields);

  // Step 1~7: 기존 파이프라인 그대로
  // ...
}
```

---

## Phase 3: HSCodeComp 632건 재벤치마크

### 3-1. HSCodeComp 데이터 로드

```bash
# HuggingFace에서 HSCodeComp 데이터 다운로드 (이미 있으면 스킵)
# 위치: /Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_632.json

# 데이터 구조 확인:
# 각 항목: { product_name: "...", hs_code: "..." (ground truth), ... }
```

### 3-2. Step 0.5 적용 후 벤치마크

```typescript
// 벤치마크 스크립트: scripts/benchmark_step05.ts

import { extractNineFields } from '../app/lib/cost-engine/gri-classifier/steps/v3/step05-field-extraction';
import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';

// 1. HSCodeComp 632건 로드
const testData = loadHSCodeComp();

// 2. 각 항목에 Step 0.5 적용
for (const item of testData) {
  // Step 0.5: GPT-4o-mini가 product_name에서 9-field 추출
  const nineFields = await extractNineFields({
    product_name: item.product_name,
    // HSCodeComp에 다른 필드가 있으면 같이 전달
  });

  // v3 파이프라인 실행
  const result = await classifyV3(nineFields);

  // 정답과 비교
  compare(result.hs6, item.hs_code);
}

// 3. 결과 출력
// - HS6 정확도: X% (이전 6.3% 대비)
// - Chapter 정확도: X% (이전 42.6% 대비)
// - Heading 정확도: X% (이전 15.5% 대비)
// - 필드 추출 정확도: material X%, category X%, processing X%
// - 오류 분석: KEYWORD_MISSING vs FIELD_DEPENDENT vs EXTRACTION_ERROR (신규)
```

### 3-3. 비교 지표

| 지표 | 이전 (Step 0.5 없음) | 이후 (Step 0.5 적용) | 변화 |
|------|-------------------|-------------------|------|
| HS6 정확도 | 6.3% | ?% | |
| Heading 정확도 | 15.5% | ?% | |
| Chapter 정확도 | 42.6% | ?% | |
| Material 추출률 | 57% (362/632) | ?% | |
| Category 추출률 | ~2% | ?% | |
| Processing 추출률 | ~3% | ?% | |
| 평균 필드 수 | 3.5/9 | ?/9 | |

### 3-4. 오류 분류 (신규 카테고리 추가)

기존: KEYWORD_MISSING, FIELD_DEPENDENT
추가:
- **EXTRACTION_ERROR** — GPT-4o-mini가 필드를 잘못 추출한 경우
- **REFERENCE_GAP** — 기준 데이터(9field_reference.json)에 해당 키워드가 없는 경우

---

## Phase 4: 결과에 따른 다음 단계

### 시나리오 A: HS6 > 50%
→ Step 0.5 효과 입증. 키워드 사전 확장으로 추가 개선.

### 시나리오 B: HS6 20~50%
→ Step 0.5는 필드 추출에 효과적이나, Chapter 레벨 키워드 갭 여전.
→ 키워드 사전 대량 확장 (Ch.67/82/83/49/63) 병행 필요.

### 시나리오 C: HS6 < 20%
→ Step 0.5의 추출 정확도 자체를 점검.
→ 프롬프트 개선 or 필드별 분리 호출 검토.

어떤 시나리오든 **이전 6.3% 대비 개선 폭**이 핵심 지표.

---

## 실행 명령

```
Phase 1~3을 순서대로 실행하세요.

Phase 1: 9field_reference.json 생성
- app/lib/cost-engine/gri-classifier/ 아래 모든 TypeScript 파일에서 기준 데이터 추출
- steps/v3/의 step0-input.ts, step2-1, step2-3, step3, step4 + data/ 아래 13개 파일 전부
- 하나도 빠지지 않게 주의
- JSON 파일 크기 확인 (128K 토큰 이내인지)
- 저장: app/lib/cost-engine/gri-classifier/data/9field_reference.json

Phase 2: Step 0.5 코드 구현
- step05-field-extraction.ts 생성
- pipeline-v3.ts에 Step 0.5 통합
- 기존 프로젝트의 LLM 호출 방식에 맞춰 구현
- npm run build 통과 확인

Phase 3: HSCodeComp 632건 벤치마크
- HSCodeComp 데이터 로드
- Step 0.5 적용 후 v3 파이프라인 실행
- 이전 결과(6.3%)와 비교
- 오류 분석 (EXTRACTION_ERROR 신규 카테고리 포함)
- 결과 저장: /Volumes/soulmaten/POTAL/7field_benchmark/step05_benchmark_results.json

⚠️ GPT-4o-mini API 비용: 632건 × ~$0.0001 = ~$0.06 (6센트 미만)
⚠️ 9field_reference.json이 128K 토큰 초과 시: heading/subheading descriptions를 키워드만 남기고 축약
```
