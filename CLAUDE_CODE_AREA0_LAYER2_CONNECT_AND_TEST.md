# Area 0 Layer 2: API 연결 + 실제 테스트
# Claude Code Terminal 2 전용
# 2026-03-23 KST

## 현재 상태
- field-validator.ts ✅ 생성 완료 (350줄, 10/10 PASS)
- data/field-guide.ts ✅ 생성 완료
- **❌ classify API route에 연결 안 됨** — validateFields import 없음, 422 반환 로직 없음
- **❌ GRI 엔진 경로가 9-field 중 5개만 전달** — origin_country, processing, composition, weight_spec 누락

## 절대 규칙
1. **기존 classify API의 이미지 분류, legacy 분류 로직 수정 금지**
2. **v3 파이프라인 코드 수정 금지**
3. **npm run build 통과 필수**

---

## Phase 1: classify API에 9-field 전달 수정

### 파일: `app/api/v1/classify/route.ts`

### 1-1. 현재 GRI 엔진 경로 (line ~225-253) 확인
현재 코드:
```typescript
const griResult = await classifyWithGRI({
  productName,
  description: category,           // ← category를 description으로 보냄
  price: body.price ? Number(body.price) : undefined,
  material: typeof body.material === 'string' ? body.material : undefined,
  destinationCountry: destCountryGri ? String(destCountryGri) : 'US',
});
```

### 1-2. 수정: 9-field 전부 전달
```typescript
const griResult = await classifyWithGRI({
  productName,
  description: typeof body.description === 'string' ? body.description : undefined,
  category: category,                                                    // 추가
  price: body.price ? Number(body.price) : undefined,
  material: typeof body.material === 'string' ? body.material : undefined,
  originCountry: typeof body.origin_country === 'string' ? body.origin_country :
                 typeof body.originCountry === 'string' ? body.originCountry : undefined,  // 추가
  processing: typeof body.processing === 'string' ? body.processing : undefined,            // 추가
  composition: typeof body.composition === 'string' ? body.composition : undefined,          // 추가
  weightSpec: typeof body.weight_spec === 'string' ? body.weight_spec :
              typeof body.weightSpec === 'string' ? body.weightSpec : undefined,              // 추가
  destinationCountry: destCountryGri ? String(destCountryGri) : 'US',
});
```

**⚠️ 주의**: `classifyWithGRI` 함수의 인터페이스가 이 필드들을 받는지 확인 필수.
먼저 확인:
```bash
cat app/lib/cost-engine/gri-classifier/index.ts
```
인터페이스가 안 맞으면 `classifyWithGRI` 래퍼도 수정 필요 (새 필드를 ClassifyInputV3에 매핑).

---

## Phase 2: validateFields 연결

### 파일: `app/api/v1/classify/route.ts`

### 2-1. import 추가 (파일 상단)
```typescript
import { validateFields } from '@/app/lib/cost-engine/gri-classifier/field-validator';
```

### 2-2. GRI 엔진 경로에 validation 삽입

현재 GRI 엔진 분기 (line ~224):
```typescript
const useGriEngine = process.env.CLASSIFICATION_ENGINE === 'gri';
if (useGriEngine && productName) {
```

수정 — validation 단계 추가:
```typescript
const useGriEngine = process.env.CLASSIFICATION_ENGINE === 'gri';
if (useGriEngine && productName) {
  // ── Layer 2: 9-Field Validation ──
  const validationInput = {
    product_name: productName,
    material: typeof body.material === 'string' ? body.material : undefined,
    origin_country: typeof body.origin_country === 'string' ? body.origin_country :
                    typeof body.originCountry === 'string' ? body.originCountry : undefined,
    category: category,
    description: typeof body.description === 'string' ? body.description : undefined,
    processing: typeof body.processing === 'string' ? body.processing : undefined,
    composition: typeof body.composition === 'string' ? body.composition : undefined,
    weight_spec: typeof body.weight_spec === 'string' ? body.weight_spec :
                 typeof body.weightSpec === 'string' ? body.weightSpec : undefined,
    price: body.price ? Number(body.price) : undefined,
  };

  const validation = validateFields(validationInput);

  // has_errors → 422 반환 (분류 진행 안 함)
  if (validation.overall_status === 'has_errors') {
    return apiError(
      ApiErrorCode.BAD_REQUEST,
      `Field validation failed. ${validation.error_field_count} field(s) have errors. See validation details.`,
      { validation, docs_url: 'https://potal.app/docs/api/fields' }
    );
  }

  // has_warnings 또는 valid → 분류 진행
  try {
    // ... (기존 classifyWithGRI 호출 — Phase 1에서 수정한 9-field 버전)

    // 응답에 validation 첨부
    return apiSuccess({
      ...griSuccessFields,
      validation: validation.overall_status === 'has_warnings' ? validation : undefined,
    }, { sellerId: context.sellerId, plan: context.planId });
  } catch {
    // GRI engine failed — fall through to legacy
  }
}
```

### 2-3. apiError에 추가 데이터 전달 가능한지 확인
```bash
cat app/lib/api-auth/response.ts | head -50
```
`apiError`가 3번째 파라미터(data/details)를 지원하는지 확인.
안 되면:
- 방법 A: apiError 함수에 optional data 파라미터 추가
- 방법 B: NextResponse.json 직접 사용

---

## Phase 3: classifyWithGRI 래퍼 확인 + 수정

### 3-1. GRI classifier index 확인
```bash
cat app/lib/cost-engine/gri-classifier/index.ts
```

`classifyWithGRI` 함수가 어떤 인터페이스를 받는지 확인.
ClassifyInputV3와 다르면 매핑 필요:

```
API body field     → ClassifyInputV3 field
-------------------------------------------------
productName        → product_name
material           → material
origin_country     → origin_country
category           → category
description        → description
processing         → processing
composition        → composition
weight_spec        → weight_spec
price              → price
destination_country → destination_country
```

### 3-2. 필요한 경우 classifyWithGRI 수정
- 새 필드를 받아서 ClassifyInputV3에 매핑
- 기존 호출 경로에 영향 없도록 optional로 추가

---

## Phase 4: npm run build

```bash
npm run build
```
0 errors 확인.

---

## Phase 5: 실제 API 테스트

### ⚠️ 중요: CLASSIFICATION_ENGINE=gri 환경변수 확인
GRI 엔진은 `process.env.CLASSIFICATION_ENGINE === 'gri'` 일 때만 동작.
로컬 테스트 시:
```bash
CLASSIFICATION_ENGINE=gri npx tsx -e "..."
```
또는 Vercel 환경변수에 설정 필요.

### 5-1. Validation Error 테스트 (material 누락)
```bash
# material과 origin_country 없이 호출 → 422 예상
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"productName": "Cotton T-Shirt"}' | jq .
```
예상 응답:
```json
{
  "error": "Field validation failed. 2 field(s) have errors.",
  "validation": {
    "overall_status": "has_errors",
    "fields": [
      { "field": "material", "status": "error", ... },
      { "field": "origin_country", "status": "error", ... }
    ]
  }
}
```

### 5-2. Validation Warning 테스트 (category 누락)
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"productName": "Cotton T-Shirt", "material": "cotton", "origin_country": "CN"}' | jq .
```
예상: 200 OK + hs_code + validation.overall_status="has_warnings"

### 5-3. Clean 테스트 (9-field 전부)
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{
    "productName": "Cotton T-Shirt",
    "material": "cotton",
    "origin_country": "CN",
    "category": "Clothing",
    "processing": "knitted",
    "composition": "100% cotton",
    "weight_spec": "180g/m²",
    "price": 9.99,
    "description": "Short sleeve crew neck",
    "destination_country": "US"
  }' | jq .
```
예상: 200 OK + hs_code=610910 + validation.overall_status="valid" (또는 validation 필드 없음)

### 5-4. material="Alloy" 테스트 (closest_match 확인)
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"productName": "Metal Bracket", "material": "Alloy", "origin_country": "CN"}' | jq .validation
```
예상: 422 + material error + closest_match="steel" or "aluminum"

### 5-5. origin_country="China" 테스트 (ISO 코드 안내)
```bash
curl -s -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_KEY" \
  -d '{"productName": "Cotton T-Shirt", "material": "cotton", "origin_country": "China"}' | jq .validation
```
예상: 422 + origin_country error + message에 "Use ISO code: CN" 포함

---

## Phase 6: 로컬 서버 없이 테스트하는 대안

로컬 서버(localhost:3000)를 띄울 수 없는 경우:

### 방법 A: 직접 함수 호출 테스트
```typescript
// test-api-integration.ts
import { validateFields } from './app/lib/cost-engine/gri-classifier/field-validator';

// Test 1: has_errors (material + origin 누락)
const r1 = validateFields({ product_name: 'Cotton T-Shirt' });
console.log('Test 1:', r1.overall_status === 'has_errors' ? '✅ PASS' : '❌ FAIL', r1.overall_status);

// Test 2: has_warnings (category 누락)
const r2 = validateFields({ product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN' });
console.log('Test 2:', r2.overall_status === 'has_warnings' ? '✅ PASS' : '❌ FAIL', r2.overall_status);

// Test 3: valid (9-field 전부)
const r3 = validateFields({
  product_name: 'Cotton T-Shirt', material: 'cotton', origin_country: 'CN',
  category: 'Clothing', processing: 'knitted', composition: '100% cotton',
  weight_spec: '180g/m²', price: 9.99, description: 'Short sleeve'
});
console.log('Test 3:', r3.overall_status === 'valid' ? '✅ PASS' : '❌ FAIL', r3.overall_status);

// Test 4: material="Alloy" → error + closest_match
const r4 = validateFields({ product_name: 'Metal Bracket', material: 'Alloy', origin_country: 'CN' });
const matField = r4.fields.find(f => f.field === 'material');
console.log('Test 4:', matField?.status === 'error' ? '✅ PASS' : '❌ FAIL', matField?.closest_match);

// Test 5: origin="China" → error
const r5 = validateFields({ product_name: 'T-Shirt', material: 'cotton', origin_country: 'China' });
const origField = r5.fields.find(f => f.field === 'origin_country');
console.log('Test 5:', origField?.status === 'error' ? '✅ PASS' : '❌ FAIL', origField?.message);
```

### 방법 B: API 라우트 코드에 연결 확인만 (코드 리뷰)
```bash
# validateFields import 존재 확인
grep -n "validateFields\|field-validator" app/api/v1/classify/route.ts

# validation 분기 존재 확인
grep -n "has_errors\|422\|validation_error" app/api/v1/classify/route.ts

# 9-field 전달 확인
grep -n "processing\|composition\|weight_spec\|origin_country" app/api/v1/classify/route.ts
```

---

## Phase 7: npm run build + 최종 검증

```bash
npm run build
```

검증 체크리스트:
- [ ] field-validator.ts → classify route에 import 됨
- [ ] GRI 엔진 경로에 9-field 전부 전달됨
- [ ] has_errors → 422 반환 확인
- [ ] has_warnings → 200 + validation 첨부 확인
- [ ] valid → 기존과 동일 동작 확인
- [ ] 기존 이미지 분류 경로 영향 없음
- [ ] 기존 legacy 텍스트 분류 경로 영향 없음
- [ ] npm run build ✅

---

## 완료 조건
- [ ] classify API route에 validateFields 연결
- [ ] 9-field 전부 GRI 엔진에 전달
- [ ] npm run build ✅
- [ ] 5건 이상 API 테스트 PASS
- [ ] 기존 경로 regression 없음
- [ ] 엑셀 로그 업데이트
