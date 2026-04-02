# Area 0 Layer 2: 9-Field Validation System 구현
# Claude Code Terminal 1 전용
# 2026-03-23 KST

## 핵심 개념
Layer 2는 "데이터를 고쳐주는 것"이 아니라 **"법적 기준에 맞는지 검증하고, 틀리면 에러 + 가이드를 반환"**하는 것이다.
고객이 법적 기준에 맞게 수정해서 다시 보내면 → Layer 1 진입 → 100%.

## 절대 규칙
1. **v3 파이프라인 코드(step0~step7, pipeline-v3.ts) 수정 금지** — 별도 모듈로 구현
2. **MATERIAL_KEYWORDS, KEYWORD_TO_HEADINGS 등 기존 사전 수정 금지**
3. **npm run build 통과 필수**
4. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx

---

## Phase 1: field-validator.ts 생성

### 파일 위치
`app/lib/cost-engine/gri-classifier/field-validator.ts`

### 구현 내용

```typescript
/**
 * 9-Field Validation — Layer 2
 *
 * 법적 기준(WCO):
 * - material: MATERIAL_KEYWORDS 79그룹 (= WCO 21 Section 기준)
 * - category: WCO 97 Chapter descriptions
 * - processing: PROCESSING_KEYWORDS 허용 목록
 * - composition: "XX% material" 형식
 * - weight_spec: 숫자 + 단위 형식
 * - price: 양수
 * - origin_country: ISO 3166-1 alpha-2, 240개국
 * - product_name: 최소 2자
 * - description: 선택, 검증 없음
 *
 * 검증 결과: field별 status (valid/error/warning) + message + valid_examples + guide_url
 */

export interface FieldValidationResult {
  field: string;
  status: 'valid' | 'error' | 'warning';
  value: string | number | null;
  message?: string;
  valid_examples?: string[];
  closest_match?: string;  // 가장 가까운 허용값 (오타 도움)
  guide_url?: string;
  impact?: string;  // "material 누락 시 정확도 -45%" 같은 진단
}

export interface ValidationReport {
  overall_status: 'valid' | 'has_errors' | 'has_warnings';
  valid_field_count: number;
  error_field_count: number;
  warning_field_count: number;
  estimated_accuracy: string;  // "100%" or "~55%" 등
  fields: FieldValidationResult[];
  guide_summary?: string;  // 전체 요약 메시지
}
```

### 검증 규칙 상세

#### 1. product_name (필수)
```
- 조건: string, 최소 2자, 비어있지 않음
- error: "product_name is required (minimum 2 characters)"
- impact: "Without product_name, classification is impossible"
```

#### 2. material (필수 — CRITICAL)
```
- 법적 기준: MATERIAL_KEYWORDS 79그룹 (step0-input.ts에서 import)
- 검증 방식:
  1. input.material.toLowerCase()
  2. MATERIAL_KEYWORDS의 모든 variant에 대해 includes() 체크
  3. 하나라도 매칭 → valid
  4. 매칭 없음 → error
- error message: "material '{value}' does not match WCO classification standards. Must contain one of the recognized material terms."
- valid_examples: material 그룹명 리스트에서 상위 10개 (leather, cotton, polyester, steel, plastic, wood, glass, ceramic, rubber, gold)
- closest_match: Levenshtein distance로 가장 가까운 variant 1개
- impact: "Missing or invalid material reduces accuracy by ~45% (Section-level failure)"
- guide_url: "https://potal.app/docs/fields/material"
```

**⚠️ MATERIAL_KEYWORDS를 step0-input.ts에서 직접 import하지 말 것. step0-input.ts를 수정하지 않기 위해, MATERIAL_KEYWORDS를 별도 파일로 분리하거나, step0-input.ts에서 export하고 있다면 그걸 import할 것. 현재 step0-input.ts에서 MATERIAL_KEYWORDS는 const로 선언되어 있어 export 안 됨. → 두 가지 방법 중 선택:**
- **방법 A**: step0-input.ts 맨 위에 `export` 키워드만 추가 (`export const MATERIAL_KEYWORDS`)
- **방법 B**: field-validator.ts에서 동일 목록 참조 (data/material-keywords.json 별도 파일로 추출)
- **방법 A 권장** (최소 변경, 기존 로직 영향 0)

#### 3. origin_country (필수)
```
- 법적 기준: ISO 3166-1 alpha-2, 240개국 (countries 테이블)
- 검증 방식:
  1. input.origin_country.toUpperCase()
  2. 2자리 문자열인지
  3. 240개국 목록에 있는지 (country-data.ts에서 import 또는 하드코딩)
- error: "origin_country '{value}' is not a valid ISO 3166-1 alpha-2 code"
- valid_examples: ["US", "CN", "DE", "JP", "KR"]
- guide_url: "https://potal.app/docs/fields/origin-country"
```

#### 4. category (선택이지만 중요)
```
- 법적 기준: WCO 97 Chapter descriptions
- 검증 방식:
  1. 빈 값 → warning (error 아님): "category improves accuracy by ~33%"
  2. 값이 있으면 → WCO Chapter description과 키워드 매칭
  3. 매칭 실패 → warning: "category '{value}' could not be mapped to a WCO Chapter"
- impact: "Missing category reduces accuracy by ~33% (Chapter-level ambiguity)"
- valid_examples: ["Clothing", "Electronics", "Furniture", "Toys", "Footwear", "Jewelry", "Machinery"]
- guide_url: "https://potal.app/docs/fields/category"
```

#### 5. processing (선택)
```
- 법적 기준: PROCESSING_KEYWORDS 목록
- 검증 방식:
  1. 빈 값 → valid (Heading 레벨에서만 영향)
  2. 값이 있으면 → PROCESSING_KEYWORDS에 단어 매칭
  3. 매칭 없음 → warning: "processing '{value}' not recognized"
- valid_examples: ["knitted", "woven", "forged", "cast", "molded", "assembled", "frozen", "dried"]
- guide_url: "https://potal.app/docs/fields/processing"
```

#### 6. composition (선택)
```
- 검증 방식:
  1. 빈 값 → valid (Subheading 레벨에서만 영향)
  2. 값이 있으면 → "XX% material" 패턴 매칭
  3. 패턴 불일치 → warning: "composition format not recognized. Expected: '85% cotton, 15% polyester'"
  4. 퍼센트 합계 > 100% → warning
- valid_examples: ["100% cotton", "80% polyester 20% cotton", "leather upper, rubber outsole"]
- guide_url: "https://potal.app/docs/fields/composition"
```

#### 7. weight_spec (선택)
```
- 검증 방식:
  1. 빈 값 → valid
  2. 값이 있으면 → 숫자 + 단위 패턴 ("200g/m²", "5kg", "0.5mm")
  3. 패턴 불일치 → warning
- valid_examples: ["200g/m²", "5kg", "0.5mm", "1.2m", "500ml"]
```

#### 8. price (선택)
```
- 검증 방식:
  1. null/undefined → valid
  2. number이면 → > 0 확인
  3. <= 0 → error: "price must be positive"
  4. > 1000000 → warning: "Unusually high price. Please verify."
```

#### 9. description (선택 — 검증 없음)
```
- 항상 valid
- 값이 있으면 Heading 정확도 +5% 기여
```

### estimated_accuracy 계산 (466조합 Ablation 데이터 기반)
```
base = 0  (모든 필드 빈 값)
if product_name valid: base += 18
if material valid: base += 45
if category valid: base += 33
if description valid: base += 5
// processing, composition, weight_spec, price는 Section/Chapter 레벨에 영향 없음 (Ablation 결과)
// 하지만 Heading/Subheading에서 영향

estimated = min(base, 100)
return `~${estimated}%`

// 9-field 전부 valid → "100%"
// product_name + material + category → "~96%"  (Magic 3)
// product_name + material → "~63%"
// product_name only → "~18%"
```

---

## Phase 2: API 응답 포맷 업데이트

### 파일: `app/api/v1/classify/route.ts` (또는 해당 API 라우트)

기존 classify API에 validation 단계 추가:

```typescript
// 1. Validation (Layer 2)
const validation = validateFields(input);

// 2. has_errors이면 → validation report만 반환 (분류 진행 안 함)
if (validation.overall_status === 'has_errors') {
  return NextResponse.json({
    status: 'validation_error',
    message: 'Required fields are missing or invalid. Please fix and retry.',
    validation: validation,
    docs_url: 'https://potal.app/docs/api/fields'
  }, { status: 422 });
}

// 3. has_warnings이면 → 분류 진행하되 warnings 첨부
const result = await classifyV3(input);
return NextResponse.json({
  ...result,
  validation: validation,  // warnings 포함
});

// 4. valid이면 → 기존대로 분류 진행
```

### 응답 예시 (validation_error)
```json
{
  "status": "validation_error",
  "message": "Required fields are missing or invalid. Please fix and retry.",
  "validation": {
    "overall_status": "has_errors",
    "valid_field_count": 1,
    "error_field_count": 2,
    "warning_field_count": 0,
    "estimated_accuracy": "~18%",
    "fields": [
      {
        "field": "product_name",
        "status": "valid",
        "value": "Cotton T-Shirt"
      },
      {
        "field": "material",
        "status": "error",
        "value": null,
        "message": "material is required for accurate classification.",
        "valid_examples": ["cotton", "polyester", "steel", "leather", "plastic", "wood"],
        "impact": "Missing material reduces accuracy by ~45%",
        "guide_url": "https://potal.app/docs/fields/material"
      },
      {
        "field": "origin_country",
        "status": "error",
        "value": null,
        "message": "origin_country is required. Use ISO 3166-1 alpha-2 code.",
        "valid_examples": ["US", "CN", "DE", "JP", "KR"],
        "guide_url": "https://potal.app/docs/fields/origin-country"
      }
    ],
    "guide_summary": "Provide material and origin_country to enable classification. See https://potal.app/docs/api/fields"
  },
  "docs_url": "https://potal.app/docs/api/fields"
}
```

### 응답 예시 (has_warnings — 분류 성공 + warning)
```json
{
  "hs_code": "610910",
  "confidence": 0.96,
  "validation": {
    "overall_status": "has_warnings",
    "valid_field_count": 3,
    "error_field_count": 0,
    "warning_field_count": 1,
    "estimated_accuracy": "~96%",
    "fields": [
      { "field": "product_name", "status": "valid", "value": "Cotton T-Shirt" },
      { "field": "material", "status": "valid", "value": "cotton" },
      { "field": "origin_country", "status": "valid", "value": "CN" },
      {
        "field": "category",
        "status": "warning",
        "value": null,
        "message": "Adding category can improve accuracy from ~96% to ~100%",
        "valid_examples": ["Clothing", "Apparel > T-Shirts"],
        "guide_url": "https://potal.app/docs/fields/category"
      }
    ]
  }
}
```

---

## Phase 3: classify API 라우트 찾기 + 연결

### 3-1. classify 관련 API 라우트 확인
```bash
find app/api -name "route.ts" | xargs grep -l "classifyV3\|classify\|hs.code\|hs_code" | head -20
```

### 3-2. 해당 라우트에 validation 단계 삽입
- classifyV3() 호출 **전**에 validateFields() 호출
- error → 422 반환 (분류 안 함)
- warning → 분류 진행 + validation 첨부
- valid → 기존대로

### 3-3. MCP 서버 업데이트 (mcp-server/)
- classify_product 도구에도 동일한 validation 로직 적용
- 또는 API를 호출하는 방식이면 자동 적용

---

## Phase 4: 가이드 페이지 데이터 생성

### 파일: `app/lib/cost-engine/gri-classifier/data/field-guide.ts`

각 필드에 대한 가이드 데이터 (API 문서 + 홈페이지 공통 사용):

```typescript
export const FIELD_GUIDE = {
  material: {
    title: "Material",
    description: "The primary physical material of your product, following WCO Section classification.",
    required: true,
    impact: "Most critical field. Determines HS Code Section (45% of accuracy).",
    format: "Plain text, one or more material names",
    valid_groups: [
      // MATERIAL_KEYWORDS 79그룹에서 추출
      { group: "Textiles", examples: ["cotton", "polyester", "silk", "wool", "nylon", "linen"] },
      { group: "Metals", examples: ["steel", "iron", "aluminum", "copper", "zinc", "titanium"] },
      { group: "Plastics & Rubber", examples: ["plastic", "rubber", "silicone", "pvc", "abs"] },
      { group: "Wood & Paper", examples: ["wood", "bamboo", "paper", "cardboard"] },
      { group: "Glass & Ceramic", examples: ["glass", "ceramic", "porcelain"] },
      { group: "Precious", examples: ["gold", "silver", "platinum", "diamond", "pearl"] },
      { group: "Food & Agriculture", examples: ["meat", "seafood", "grain", "fruit", "coffee", "tea"] },
      { group: "Chemicals", examples: ["chemical", "pharmaceutical", "cosmetic", "soap", "fertilizer"] },
      // ... 모든 79그룹
    ],
    common_mistakes: [
      { wrong: "Alloy", correct: "steel or aluminum (specify the base metal)" },
      { wrong: "Mixed", correct: "Specify the primary material (>50% by weight)" },
      { wrong: "Blend", correct: "Use composition field: '60% cotton, 40% polyester'" },
      { wrong: "N/A", correct: "Every physical product has a material" },
    ],
    api_example: '"material": "cotton"',
  },
  category: {
    title: "Category",
    description: "Product category following your platform's taxonomy (e.g., Shopify, Amazon category).",
    required: false,
    impact: "Determines Chapter selection (33% of accuracy). Resolves material vs function ambiguity.",
    format: "Category path or simple category name",
    valid_examples: [
      "Clothing", "Clothing > T-Shirts", "Electronics", "Electronics > Smartphones",
      "Furniture", "Toys", "Footwear", "Jewelry", "Machinery", "Tools",
      "Food & Beverage", "Health & Beauty", "Sports & Outdoors", "Automotive"
    ],
    common_mistakes: [
      { wrong: "SKU-12345", correct: "Use a descriptive category like 'Electronics'" },
      { wrong: "Miscellaneous", correct: "Be specific: 'Kitchen Utensils' or 'Office Supplies'" },
    ],
    api_example: '"category": "Clothing > T-Shirts"',
  },
  origin_country: {
    title: "Origin Country",
    description: "Country where the product was manufactured, using ISO 3166-1 alpha-2 code.",
    required: true,
    impact: "Required for 7-10 digit national HS code extension and duty rate lookup.",
    format: "2-letter ISO country code",
    valid_examples: ["US", "CN", "DE", "JP", "KR", "VN", "IN", "MX", "GB", "IT"],
    common_mistakes: [
      { wrong: "China", correct: "CN" },
      { wrong: "USA", correct: "US" },
      { wrong: "UK", correct: "GB" },
      { wrong: "Korea", correct: "KR" },
    ],
    api_example: '"origin_country": "CN"',
  },
  processing: {
    title: "Processing Method",
    description: "How the product was manufactured or processed.",
    required: false,
    impact: "Helps distinguish Chapter within Section (e.g., knitted vs woven textiles).",
    format: "One or more processing terms",
    valid_examples: [
      "knitted", "woven", "crocheted", "embroidered",
      "forged", "cast", "machined", "stamped", "welded",
      "molded", "assembled", "frozen", "dried", "roasted"
    ],
    api_example: '"processing": "knitted"',
  },
  composition: {
    title: "Composition",
    description: "Material breakdown by percentage (for textiles, alloys, mixtures).",
    required: false,
    impact: "Determines Subheading (6-digit). Critical for textiles and mixed materials.",
    format: "'XX% material, YY% material' or 'material upper, material outsole'",
    valid_examples: [
      "100% cotton", "85% cotton, 15% polyester", "60% wool, 40% synthetic",
      "leather upper, rubber outsole", "18/8 stainless steel"
    ],
    api_example: '"composition": "85% cotton, 15% polyester"',
  },
  weight_spec: {
    title: "Weight Specification",
    description: "Product weight or density (for weight-based tariff distinctions).",
    required: false,
    impact: "Some HS subheadings distinguish by weight (e.g., 'weighing >200g/m²').",
    format: "Number + unit",
    valid_examples: ["200g/m²", "5kg", "0.5mm thick", "1.2m length", "500ml"],
    api_example: '"weight_spec": "200g/m²"',
  },
  price: {
    title: "Price (USD)",
    description: "Unit price in USD for price-break tariff rules.",
    required: false,
    impact: "Some HS codes change based on value (e.g., 'valued over $5 each').",
    format: "Positive number (USD)",
    valid_examples: [9.99, 49.99, 199.00, 1500.00],
    api_example: '"price": 49.99',
  },
  description: {
    title: "Description",
    description: "Free-text product description for additional context.",
    required: false,
    impact: "Provides +5% accuracy improvement at Heading level.",
    format: "Free text",
    api_example: '"description": "Men\'s short-sleeve crew-neck t-shirt, screen printed graphic"',
  },
};
```

---

## Phase 5: npm run build + 테스트

### 5-1. 빌드 확인
```bash
npm run build
```

### 5-2. Validation 테스트 (10건)

| # | Input | 예상 결과 |
|---|-------|----------|
| 1 | 9-field 전부 valid | overall_status=valid, estimated=100% |
| 2 | product_name + material + origin | overall_status=has_warnings (category missing), estimated=~96% |
| 3 | product_name only | overall_status=has_errors (material, origin 누락), estimated=~18% |
| 4 | material="Alloy" | error, closest_match="steel" or "aluminum" |
| 5 | origin_country="China" | error, message="Use ISO code: CN" |
| 6 | origin_country="XX" | error, not in 240 countries |
| 7 | price=-5 | error, "price must be positive" |
| 8 | composition="200% cotton" | warning, percentage > 100% |
| 9 | product_name="" | error, "required" |
| 10 | 전부 빈 값 | has_errors, estimated=0% |

### 5-3. API 통합 테스트

```bash
# 1. validation_error 반환 확인 (material 누락)
curl -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"product_name": "Cotton T-Shirt"}'

# 예상: 422, validation_error

# 2. has_warnings 반환 확인 (category 누락)
curl -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"product_name": "Cotton T-Shirt", "material": "cotton", "origin_country": "CN"}'

# 예상: 200, hs_code + validation.overall_status=has_warnings

# 3. clean 반환 확인 (9-field 전부)
curl -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"product_name": "Cotton T-Shirt", "material": "cotton", "origin_country": "CN", "category": "Clothing", "processing": "knitted", "composition": "100% cotton", "weight_spec": "180g/m²", "price": 9.99, "description": "Short sleeve crew neck"}'

# 예상: 200, hs_code=610910, validation.overall_status=valid
```

---

## Phase 6: 5회 자체 검수

### 검수 1: npm run build ✅
### 검수 2: 10건 validation 테스트 전부 PASS
### 검수 3: 기존 v3 파이프라인 regression — 9-field 완전 입력 시 기존과 동일 결과 나오는지
### 검수 4: API 422/200 분기 정확한지
### 검수 5: MATERIAL_KEYWORDS 79그룹 전부 valid로 통과하는지 (1건도 false negative 없어야 함)

---

## Phase 7: 엑셀 로그 + 결과 파일

### POTAL_Claude_Code_Work_Log.xlsx 시트 추가
- 모든 작업 기록

### AREA0_LAYER2_VALIDATION_RESULT.md 생성
```markdown
# Area 0 Layer 2: Validation System — Implementation Result
- 생성 파일: [목록]
- 수정 파일: [목록]
- 테스트: [N]/10 PASS
- npm run build: ✅/❌
- regression: ✅/❌
```

---

## 완료 조건
- [ ] field-validator.ts 생성 (9-field 검증)
- [ ] classify API에 validation 단계 연결
- [ ] field-guide.ts 데이터 파일 생성
- [ ] npm run build ✅
- [ ] 10건 테스트 전부 PASS
- [ ] 기존 regression 유지
- [ ] 엑셀 로그 완료
- [ ] 결과 파일 생성
