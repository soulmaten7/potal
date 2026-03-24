# Area 0 Layer 2: 4-Field 법적 기준 검증 추가
# 2026-03-23 KST
# Terminal 2 전용

## 목표
field-validator.ts에서 4개 필드(category, description, weight_spec, price)의 검증을 국제 법적 기준에 맞게 수정한다.
현재 "아무 값이나 OK"로 통과시키는 문제를 해결.

## ⚠️ 절대 규칙
1. **v3 파이프라인 코드(steps/v3/) 수정 금지** — Layer 1은 절대 건드리지 않는다
2. **field-validator.ts만 수정** — 다른 파일 수정 최소화
3. **기존 material/origin_country/product_name 검증 로직 변경 금지** — 이미 잘 동작함
4. **npm run build 필수**
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
6. **수정 전/후 코드를 엑셀에 기록**

---

## Phase 1: 기존 코드 + 데이터 파일 읽기

### 1-1. 수정 대상
```
cat app/lib/cost-engine/gri-classifier/field-validator.ts
```

### 1-2. category 검증에 사용할 데이터
```
cat app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts
```
→ CHAPTER_DESCRIPTIONS (97개 Chapter) + CHAPTER_TO_SECTION (97→21 매핑) 확인

### 1-3. category 키워드 매칭 참고 (파이프라인이 실제 사용하는 방식)
```
# step2-1에서 CHAPTER_KEYWORDS 빌드하는 방식 확인
grep -A 30 "function buildChapterKeywords" app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts
```

### 1-4. 통화 데이터
```
# country-data.ts에서 사용 중인 currency 코드 전부 추출
grep "currency:" app/lib/cost-engine/country-data.ts | head -50
```

### 1-5. 환율 서비스
```
cat app/lib/cost-engine/exchange-rate/exchange-rate-service.ts
```

Phase 1 완료 후: 읽은 파일 목록 기록.

---

## Phase 2: 4개 필드 수정

### 2-1. category 검증 — WCO 97 Chapter 기준

**현재 (틀림):**
```typescript
function validateCategory(value) {
  if (!value) return warning;  // 비어있으면 경고
  return valid;                // ← 아무 값이나 OK
}
```

**수정 후:**
```typescript
import { CHAPTER_DESCRIPTIONS } from './data/chapter-descriptions';

// 모듈 로드 시 1회 빌드 — chapter-descriptions.ts에서 키워드 추출
// step2-1-section-candidate.ts의 buildChapterKeywords()와 동일한 방식
const CATEGORY_VALID_KEYWORDS: Set<string> = buildCategoryKeywords();

function buildCategoryKeywords(): Set<string> {
  const STOP = new Set(['and','or','of','the','thereof','other','not','elsewhere',
    'specified','included','articles','parts','accessories','products','preparations',
    'whether','their','with','than','such','like','similar','certain','kind']);
  const keywords = new Set<string>();

  for (const desc of Object.values(CHAPTER_DESCRIPTIONS)) {
    const tokens = desc.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
    for (const t of tokens) {
      if (t.length >= 3 && !STOP.has(t)) {
        keywords.add(t);
      }
    }
  }

  // 추가: 이커머스 플랫폼에서 흔히 쓰는 카테고리 → Chapter 매핑
  // 이건 "법적 기준"은 아니지만, 셀러가 플랫폼 카테고리를 그대로 보낼 수 있으므로
  // valid로 인정하되, WCO Chapter 매칭 여부를 표시
  const PLATFORM_CATEGORY_MAP: Record<string, number> = {
    'clothing': 61, 'apparel': 61, 'fashion': 61,
    'electronics': 85, 'computers': 84, 'phones': 85,
    'furniture': 94, 'home': 94,
    'toys': 95, 'games': 95,
    'footwear': 64, 'shoes': 64,
    'jewelry': 71, 'jewellery': 71,
    'food': 21, 'grocery': 21,
    'beauty': 33, 'cosmetics': 33,
    'sports': 95, 'fitness': 95,
    'automotive': 87, 'cars': 87,
    'books': 49, 'media': 49,
    'tools': 82, 'hardware': 83,
    'garden': 94, 'outdoor': 95,
    'pet': 23, 'pets': 23,
    'health': 30, 'pharmaceutical': 30, 'medicine': 30,
    'musical': 92, 'instruments': 92,
    'watches': 91, 'clocks': 91,
    'bags': 42, 'luggage': 42, 'handbags': 42,
    'ceramic': 69, 'pottery': 69,
    'glass': 70, 'glassware': 70,
    'paper': 48, 'stationery': 48,
    'plastic': 39, 'rubber': 40,
    'wood': 44, 'wooden': 44,
    'textile': 63, 'fabric': 60,
    'carpet': 57, 'rug': 57,
    'soap': 34, 'detergent': 34,
    'perfume': 33, 'fragrance': 33,
    'tobacco': 24, 'cigarettes': 24,
    'alcohol': 22, 'wine': 22, 'beer': 22, 'spirits': 22,
  };

  for (const k of Object.keys(PLATFORM_CATEGORY_MAP)) {
    keywords.add(k);
  }

  return keywords;
}

function validateCategory(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      field: 'category', status: 'warning', value,
      message: 'Adding category improves accuracy by ~33%. Use WCO Chapter description or common product category.',
      valid_examples: ['Clothing', 'Electronics', 'Furniture', 'Toys', 'Footwear', 'Jewelry', 'Pharmaceutical products'],
      impact: 'Missing category reduces accuracy by ~33% (Chapter-level ambiguity)',
    };
  }

  // 입력 토큰화
  const inputLower = value.toLowerCase().trim();
  const tokens = inputLower.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length >= 3);

  // WCO Chapter 키워드 매칭
  let matched = false;
  for (const token of tokens) {
    if (CATEGORY_VALID_KEYWORDS.has(token)) {
      matched = true;
      break;
    }
  }

  // 전체 문자열로도 시도 (예: "men's clothing" → "clothing" 토큰)
  if (!matched) {
    for (const kw of CATEGORY_VALID_KEYWORDS) {
      if (inputLower.includes(kw)) {
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    // Levenshtein으로 가장 가까운 키워드 찾기
    let bestMatch = '';
    let bestDist = Infinity;
    for (const kw of CATEGORY_VALID_KEYWORDS) {
      const d = levenshtein(inputLower, kw);
      if (d < bestDist) {
        bestDist = d;
        bestMatch = kw;
      }
    }

    return {
      field: 'category', status: 'error', value,
      message: `category '${value}' does not match WCO Chapter classifications.`,
      valid_examples: ['Clothing', 'Electronics', 'Footwear', 'Furniture', 'Toys', 'Jewelry', 'Pharmaceutical products'],
      closest_match: bestDist <= 4 ? bestMatch : undefined,
      impact: 'Invalid category reduces accuracy by ~33%',
    };
  }

  return { field: 'category', status: 'valid', value };
}
```

**검증 기준**: WCO 97 Chapter description에서 추출한 키워드 + 이커머스 플랫폼 카테고리 매핑
**매칭 안 되면**: error + closest_match + valid_examples
**핵심**: material과 동일한 패턴 — 법적 기준 키워드 매칭, 안 되면 거부

---

### 2-2. description 검증 — 세관 신고서 최소 요건

**현재 (틀림):**
```typescript
function validateDescription(value) {
  return { field: 'description', status: 'valid', value: value || null };
  // ← 빈 문자열이든, 숫자만이든, 의미없는 문자든 전부 valid
}
```

**수정 후:**
```typescript
function validateDescription(value: string | null | undefined): FieldValidationResult {
  // description은 선택 필드 — 비어있으면 valid (warning도 아님, impact +5%뿐)
  if (!value || value.trim().length === 0) {
    return { field: 'description', status: 'valid', value: null };
  }

  const trimmed = value.trim();

  // 너무 짧으면 세관 신고서로 의미 없음 (최소 10자)
  if (trimmed.length < 10) {
    return {
      field: 'description', status: 'warning', value,
      message: `Description too short (${trimmed.length} chars). Customs declarations require meaningful product description (min 10 chars).`,
      valid_examples: ['Short-sleeve crew-neck cotton t-shirt, screen printed', 'Wireless bluetooth earbuds with charging case'],
    };
  }

  // 숫자/특수문자만으로 이루어진 경우
  const alphaCount = (trimmed.match(/[a-zA-Z\u3000-\u9FFF\uAC00-\uD7AF]/g) || []).length;
  if (alphaCount < 5) {
    return {
      field: 'description', status: 'warning', value,
      message: 'Description should contain meaningful text describing the product, not just numbers or codes.',
      valid_examples: ['Men\'s cotton polo shirt, short sleeve, solid color', 'Stainless steel insulated water bottle, 500ml'],
    };
  }

  return { field: 'description', status: 'valid', value };
}
```

**검증 기준**: WCO Kyoto Convention 세관 신고서 "Goods Description" 최소 요건
- 비어있으면: valid (선택 필드)
- 있는데 10자 미만: warning
- 있는데 알파벳 5자 미만 (숫자/특수문자만): warning
- 정상: valid
- **error는 없음** — description은 자유 텍스트 성격이 강해서 warning까지만

---

### 2-3. weight_spec 검증 — SI 국제단위계 + 무역 단위

**현재 (틀림):**
```typescript
function validateWeightSpec(value) {
  if (!value) return valid;
  return valid;  // ← 아무 값이나 OK
}
```

**수정 후:**
```typescript
// SI 국제단위계 (International System of Units, ISO 80000)
// + 무역/세관에서 사용하는 비SI 단위
// + WCO HS Code에서 실제 사용되는 단위 ("weighing more than 200g/m²" 등)
const VALID_WEIGHT_UNITS: Set<string> = new Set([
  // ─── SI 질량 단위 ───
  'kg', 'g', 'mg', 'µg', 't',           // kilogram, gram, milligram, microgram, tonne
  // ─── 비SI 질량 단위 (무역 관행) ───
  'lb', 'lbs', 'oz',                      // pound, ounce
  'ct', 'carat',                           // carat (Ch.71 보석)
  // ─── SI 길이 단위 ───
  'm', 'cm', 'mm', 'µm', 'km',
  // ─── 비SI 길이 단위 ───
  'in', 'inch', 'inches', 'ft', 'feet', 'yd', 'yard', 'yards',
  // ─── SI 면적 단위 ───
  'm²', 'm2', 'cm²', 'cm2', 'mm²', 'mm2',
  'sqm', 'sqft', 'sqin',
  // ─── SI 부피 단위 ───
  'l', 'L', 'ml', 'mL', 'cl', 'cL',
  'gal', 'gallon', 'qt', 'quart', 'pt', 'pint', 'fl oz',
  // ─── 밀도/면밀도 (HS Code에서 실제 사용) ───
  'g/m²', 'g/m2', 'gsm',                  // grams per square meter (직물 Ch.52-63)
  'oz/yd²', 'oz/yd2',                     // ounces per square yard (직물)
  'kg/m³', 'kg/m3',                       // density
  'den', 'denier', 'dtex', 'tex',         // 섬유 굵기 단위 (Ch.50-55)
  // ─── 전기 단위 (Ch.85 등) ───
  'v', 'V', 'w', 'W', 'kw', 'kW', 'a', 'A', 'mah', 'mAh', 'wh', 'Wh', 'kwh', 'kWh',
  // ─── 기타 무역 단위 ───
  'pcs', 'pc', 'piece', 'pieces',
  'pair', 'pairs',
  'set', 'sets',
  'dozen', 'doz',
  'gross',
  'ream',
  'bbl', 'barrel',
]);

// 숫자 + 단위 패턴 (예: "200g/m²", "5kg", "0.5mm", "100% cotton 200gsm")
const WEIGHT_SPEC_PATTERN = /(\d+(?:\.\d+)?)\s*([a-zA-Zµ²³\/]+)/;

function validateWeightSpec(value: string | null | undefined): FieldValidationResult {
  if (!value || value.trim().length === 0) {
    return { field: 'weight_spec', status: 'valid', value };
  }

  const trimmed = value.trim();

  // 숫자+단위 패턴 매칭
  const match = trimmed.match(WEIGHT_SPEC_PATTERN);
  if (!match) {
    return {
      field: 'weight_spec', status: 'warning', value,
      message: 'weight_spec should be in "number + unit" format.',
      valid_examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '50W', '2000mAh'],
    };
  }

  const unit = match[2].trim();

  // 단위 검증 — 대소문자 구분하여 매칭
  const unitLower = unit.toLowerCase();
  const unitMatched = VALID_WEIGHT_UNITS.has(unit) ||
                      VALID_WEIGHT_UNITS.has(unitLower) ||
                      VALID_WEIGHT_UNITS.has(unit.replace('²', '2'));

  if (!unitMatched) {
    // 가장 가까운 단위 찾기
    let bestUnit = '';
    let bestDist = Infinity;
    for (const validUnit of VALID_WEIGHT_UNITS) {
      const d = levenshtein(unitLower, validUnit.toLowerCase());
      if (d < bestDist) {
        bestDist = d;
        bestUnit = validUnit;
      }
    }

    return {
      field: 'weight_spec', status: 'warning', value,
      message: `Unit '${unit}' not recognized. Use SI units or standard trade units.`,
      valid_examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '50W'],
      closest_match: bestDist <= 2 ? bestUnit : undefined,
    };
  }

  return { field: 'weight_spec', status: 'valid', value };
}
```

**검증 기준**: SI 국제단위계 (ISO 80000) + WCO HS Code에서 실제 사용하는 단위
- 비어있으면: valid (선택 필드)
- 숫자+단위 포맷 아니면: warning
- 단위가 유효 목록에 없으면: warning + closest_match
- **error는 없음** — weight_spec은 선택 필드

---

### 2-4. price 검증 — ISO 4217 통화 코드

**현재 (틀림):**
```typescript
function validatePrice(value) {
  if (value === null || value === undefined) return valid;
  if (value <= 0) return error;
  if (value > 1000000) return warning;
  return valid;  // ← 통화가 뭔지 모름
}
```

**수정 방향 — 2가지 옵션:**

**옵션 A: price_currency 필드 추가 (API 변경)**
- 9-field → 10-field가 됨
- price_currency가 ISO 4217에 없으면 error

**옵션 B: price는 USD 고정 + 안내 (API 변경 없음)**
- 현재 API가 이미 USD 기준으로 동작
- 다른 통화 입력 시 exchange-rate-service.ts로 자동 변환은 이미 있음
- price 필드 옆에 "USD 기준" 명시

**⭐ 옵션 B를 채택한다** — 이유:
1. 9-field 구조 유지 (API 호환성)
2. country-data.ts에 각 국가 currency 이미 있음 → TLC 계산에서 자동 변환
3. classify API는 HS Code 분류용이지 TLC 계산용이 아님 → USD 기준이면 충분
4. 가격 분기("valued over $X")는 USD 기준으로 작동

**수정 후:**
```typescript
function validatePrice(value: number | null | undefined): FieldValidationResult {
  if (value === null || value === undefined) {
    return { field: 'price', status: 'valid', value };
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: 'price', status: 'error', value,
      message: 'price must be a number (USD).',
      valid_examples: ['9.99', '49.99', '199.00'],
    };
  }

  if (value <= 0) {
    return {
      field: 'price', status: 'error', value,
      message: 'price must be positive (USD). Used for price-break tariff rules.',
      valid_examples: ['9.99', '49.99', '199.00'],
    };
  }

  if (value > 1000000) {
    return {
      field: 'price', status: 'warning', value,
      message: `price $${value.toLocaleString()} is unusually high. Verify this is the correct unit price in USD.`,
    };
  }

  return { field: 'price', status: 'valid', value };
}
```

**추가 — field-guide.ts도 수정:**
```typescript
price: {
  title: 'Price (USD)',
  required: false,
  impact: 'Price-break tariff rules ("valued over/under $X")',
  format: 'Positive number in USD. Other currencies will be converted automatically in TLC calculation.',
  examples: [9.99, 49.99, 199.00],
},
```

---

## Phase 3: field-guide.ts 동기화

field-guide.ts의 category/description/weight_spec/price 설명도 법적 기준에 맞게 업데이트:

```typescript
category: {
  title: 'Category',
  required: false,
  impact: '+33% accuracy',
  format: 'WCO Chapter description or common product category',
  examples: ['Clothing', 'Electronics', 'Furniture', 'Toys', 'Footwear', 'Jewelry', 'Pharmaceutical products'],
  common_mistakes: [
    { wrong: 'Random Stuff', correct: 'Use WCO Chapter terms: Clothing, Footwear, Furniture, etc.' },
    { wrong: 'Misc', correct: 'Specify the product type: Toys, Electronics, etc.' },
  ],
},
description: {
  title: 'Description',
  required: false,
  impact: '+5% accuracy at Heading level',
  format: 'Customs declaration style: meaningful product description (min 10 chars)',
  examples: ['Short-sleeve crew-neck cotton t-shirt, screen printed graphic', 'Wireless bluetooth earbuds with charging case, noise cancelling'],
},
weight_spec: {
  title: 'Weight/Spec',
  required: false,
  impact: 'Weight-based tariff distinctions',
  format: 'Number + SI unit or trade unit. HS Code uses these for tariff splits.',
  examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '2000mAh', '50W'],
},
price: {
  title: 'Price (USD)',
  required: false,
  impact: 'Price-break tariff rules ("valued over/under $X")',
  format: 'Positive number in USD. TLC calculation converts to local currency automatically.',
  examples: [9.99, 49.99, 199.00],
},
```

---

## Phase 4: npm run build

```bash
npm run build
```

빌드 실패 시 에러 수정 후 재빌드. 빌드 출력 마지막 10줄 기록.

---

## Phase 5: 테스트 (10건)

field-validator.ts의 validateFields() 직접 호출하여 테스트:

| # | 입력 | 예상 결과 | PASS? |
|---|------|----------|-------|
| 1 | category="Clothing" | valid | |
| 2 | category="Electronics" | valid | |
| 3 | category="Random Stuff 123" | error + closest_match | |
| 4 | category="Pharmaceutical products" | valid (WCO Ch.30 description) | |
| 5 | description="abc" (3자) | warning (too short) | |
| 6 | description="Men's cotton t-shirt with printed graphic" | valid | |
| 7 | weight_spec="200g/m²" | valid | |
| 8 | weight_spec="5zz" | warning (unit not recognized) | |
| 9 | price=-5 | error (must be positive) | |
| 10 | 9-field 전부 정상 입력 | overall_status=valid, estimated_accuracy=100% | |

테스트 방법:
```bash
npx tsx -e "
const { validateFields } = require('./app/lib/cost-engine/gri-classifier/field-validator');

// Test 1: category valid
const r1 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN', category: 'Clothing' });
console.log('Test 1 (category=Clothing):', r1.fields.find(f => f.field === 'category')?.status);

// Test 2: category invalid
const r2 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN', category: 'Random Stuff 123' });
console.log('Test 2 (category=Random Stuff):', r2.fields.find(f => f.field === 'category')?.status, r2.fields.find(f => f.field === 'category')?.closest_match);

// Test 3: description too short
const r3 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN', description: 'abc' });
console.log('Test 3 (desc=abc):', r3.fields.find(f => f.field === 'description')?.status);

// Test 4: description valid
const r4 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN', description: 'Mens cotton t-shirt with printed graphic' });
console.log('Test 4 (desc=valid):', r4.fields.find(f => f.field === 'description')?.status);

// Test 5: weight_spec valid
const r5 = validateFields({ product_name: 'Fabric', material: 'cotton', origin_country: 'CN', weight_spec: '200g/m²' });
console.log('Test 5 (weight=200g/m²):', r5.fields.find(f => f.field === 'weight_spec')?.status);

// Test 6: weight_spec invalid unit
const r6 = validateFields({ product_name: 'Fabric', material: 'cotton', origin_country: 'CN', weight_spec: '5zz' });
console.log('Test 6 (weight=5zz):', r6.fields.find(f => f.field === 'weight_spec')?.status);

// Test 7: price negative
const r7 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN', price: -5 });
console.log('Test 7 (price=-5):', r7.fields.find(f => f.field === 'price')?.status);

// Test 8: category=Pharmaceutical products (WCO Ch.30)
const r8 = validateFields({ product_name: 'Aspirin', material: 'chemical', origin_country: 'DE', category: 'Pharmaceutical products' });
console.log('Test 8 (category=Pharmaceutical):', r8.fields.find(f => f.field === 'category')?.status);

// Test 9: all 9 fields perfect
const r9 = validateFields({
  product_name: 'Men Cotton T-Shirt',
  material: 'cotton',
  origin_country: 'CN',
  category: 'Clothing',
  description: 'Short-sleeve crew-neck cotton t-shirt with screen printed graphic',
  processing: 'knitted',
  composition: '100% cotton',
  weight_spec: '200g/m²',
  price: 9.99,
});
console.log('Test 9 (all 9 perfect):', r9.overall_status, 'accuracy:', r9.estimated_accuracy);

// Test 10: category empty (should be warning, not error)
const r10 = validateFields({ product_name: 'T-shirt', material: 'cotton', origin_country: 'CN' });
console.log('Test 10 (no category):', r10.fields.find(f => f.field === 'category')?.status, r10.overall_status);
"
```

**예상 결과:**
- Test 1: valid
- Test 2: error + closest_match
- Test 3: warning
- Test 4: valid
- Test 5: valid
- Test 6: warning
- Test 7: error
- Test 8: valid
- Test 9: overall_status=valid, accuracy=100%
- Test 10: category=warning, overall=has_warnings

10/10 PASS 필수. FAIL 있으면 수정 후 재실행.

---

## Phase 6: API 통합 테스트 (curl 3건)

dev 서버 또는 빌드 후 테스트:

### Test 1: category 잘못된 값 → 422
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "T-shirt",
    "material": "cotton",
    "origin_country": "CN",
    "category": "asdfghjkl"
  }' | jq '.details.validation.fields[] | select(.field=="category")'
```
→ status=error, message에 "does not match WCO" 포함

### Test 2: weight_spec 잘못된 단위 → 200 + warning
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Fabric",
    "material": "cotton",
    "origin_country": "CN",
    "weight_spec": "5zz"
  }' | jq '.validation.fields[] | select(.field=="weight_spec")'
```
→ status=warning

### Test 3: 9-field 전부 정상 → 200 + 분류 성공
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Men Cotton T-Shirt",
    "material": "cotton",
    "origin_country": "CN",
    "category": "Clothing",
    "description": "Short-sleeve crew-neck cotton t-shirt",
    "processing": "knitted",
    "composition": "100% cotton",
    "weight_spec": "200g/m2",
    "price": 9.99
  }' | jq '{hsCode: .hsCode, method: .classificationMethod, accuracy: .validation.estimated_accuracy}'
```
→ hsCode 존재, method="gri-v3", accuracy="100%"

---

## Phase 7: 엑셀 로그 + 결과

### POTAL_Claude_Code_Work_Log.xlsx 시트 추가
- 시트명: YYMMDDHHMM
- 수정 전/후 코드 전부 기록

### 수정 요약 출력
```
=== Area 0 Layer 2: 4-Field 법적 기준 검증 추가 완료 ===

수정 파일:
- field-validator.ts: category(WCO 97 Chapter) + description(최소10자) + weight_spec(SI단위) + price(USD명시)
- field-guide.ts: 4필드 설명 업데이트

검증 기준:
✅ category: WCO 97 Chapter description 키워드 매칭 (CHAPTER_DESCRIPTIONS에서 추출)
✅ description: 최소 10자 + 알파벳 5자 이상 (세관 신고서 최소 요건)
✅ weight_spec: SI 국제단위계 + 무역 단위 목록 매칭 (70+ 유효 단위)
✅ price: USD 고정, 양수 필수 (ISO 4217은 TLC 계산에서 처리)

테스트: [N]/10 PASS
API 테스트: [N]/3 PASS
npm run build: ✅/❌
```

---

## 완료 조건
- [ ] field-validator.ts 4개 함수 수정 완료
- [ ] field-guide.ts 4개 필드 설명 업데이트
- [ ] npm run build ✅
- [ ] 단위 테스트 10/10 PASS
- [ ] API 통합 테스트 3/3 PASS (dev 서버 가능한 경우)
- [ ] 엑셀 로그 시트 추가
- [ ] 기존 material/origin_country/product_name 검증 변경 없음 확인

## ⚠️ 완료 후 멈춰라. 다른 작업으로 넘어가지 마라.
