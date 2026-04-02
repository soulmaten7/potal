# Area 0: Homepage Guideline Page + API Docs — 9-Field Legal Standards

## 목표
1. `/guide` 페이지 생성 — 개인 셀러용 9-field 입력 가이드라인
2. `/developers/docs` 에 classify 엔드포인트 추가 — B2B 개발자용 API 문서
3. npm run build 검증

## ⚠️ 핵심 규칙
- 반드시 field-validator.ts 를 먼저 읽고 검증 로직 전부 반영
- 법적 기준: material=WCO 21 Section, category=WCO 97 Chapter, origin_country=ISO 3166-1, weight_spec=SI+trade units, price=USD
- 466조합 Ablation 정확도 데이터 반영: material +45%, category +33%, product_name +18%, description +5%
- 5회 자체 검수 후 결과 리포트

---

## Phase 1: 데이터 수집 (읽기만)

아래 파일들을 읽어서 9-field 법적 기준 + 검증 로직 전체를 파악한다:

```bash
cat app/lib/cost-engine/gri-classifier/field-validator.ts
cat app/lib/cost-engine/gri-classifier/data/field-guide.ts
cat app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts
cat app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts | head -130
```

**수집할 데이터:**
- MATERIAL_KEYWORDS 79그룹 전체 (각 그룹별 키워드 목록)
- PROCESSING_KEYWORDS 전체
- CHAPTER_DESCRIPTIONS 97개 + CHAPTER_TO_SECTION 매핑
- validateFields() 로직: error vs warning 조건 전부
- findClosestMaterial(), validateCategory(), validateDescription(), validateWeightSpec(), validatePrice() 로직
- VALID_WEIGHT_UNITS 70+개 전체
- estimated_accuracy 계산 공식

---

## Phase 2: /guide 페이지 생성

### 2-1. `app/guide/layout.tsx` 생성

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Classification Guide — 9-Field Input Standards | POTAL',
  description: 'Complete guide for HS Code classification input fields. Learn the legal standards (WCO, ISO, SI) and validation rules for each of the 9 fields to achieve 100% classification accuracy.',
  openGraph: {
    title: 'Classification Guide — 9-Field Input Standards | POTAL',
    description: 'WCO-based classification standards for 100% HS Code accuracy.',
    type: 'website',
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### 2-2. `app/guide/page.tsx` 생성

**"use client" React 페이지. 아래 구조를 따른다:**

**헤더 섹션:**
- 제목: "Classification Guide"
- 부제: "9-field input standards for HS Code classification. Each field is validated against international legal standards (WCO, ISO, SI) to achieve 100% classification accuracy."
- 정확도 공식 박스: product_name(+18%) + material(+45%) + category(+33%) + description(+4%) = 100%
- 범례: Required (빨간) 3개 / Recommended (주황) 6개

**9개 필드 카드 (클릭 펼침/접힘):**

각 카드에 반드시 포함할 내용:
1. **필드명 + Required/Recommended 배지 + 정확도 영향**
2. **Description** — 이 필드가 왜 중요한지 설명
3. **Legal Basis** — 법적 근거 (WCO, ISO, SI 등)
4. **Format** — 입력 포맷
5. **Validation Rules** — field-validator.ts 에서 가져온 error/warning 조건 전부
6. **Valid Examples** — 실제 허용 값 예시
7. **Common Mistakes** — 흔한 실수 (wrong → correct 형식)

**9개 필드 상세:**

| # | 필드 | Required | 법적 기준 | 정확도 | 검증 규칙 |
|---|------|----------|-----------|--------|-----------|
| 1 | product_name | ✅ | Customs Declaration | +18% | 빈값/2자미만 → Error |
| 2 | material | ✅ | WCO 21 Section (79 groups) | +45% | 빈값 → Error, 79그룹 불일치 → Error + closest_match |
| 3 | origin_country | ✅ | ISO 3166-1 alpha-2 (240국) | 7-10자리용 | 빈값 → Error, 국가명→코드 자동변환, 목록 불일치 → Error |
| 4 | category | - | WCO 97 Chapter + platform terms | +33% | 빈값 → Warning, Chapter keyword 불일치 → Error + closest_match |
| 5 | description | - | Customs Declaration Standard | +5% | 10자미만 → Warning, 알파벳 5자미만 → Warning |
| 6 | processing | - | WCO HS (Ch.61 knitted vs Ch.62 woven) | Heading용 | 빈값 → OK, PROCESSING_KEYWORDS 불일치 → Warning |
| 7 | composition | - | WCO Subheading Notes (%) | Subheading용 | 합계>100% → Warning |
| 8 | weight_spec | - | SI Units + trade units (70+) | 관세분기용 | "숫자+단위" 포맷 필수, 단위 불일치 → Warning + closest_match |
| 9 | price | - | WTO Customs Valuation (USD) | 가격분기용 | NaN/0/음수 → Error, >$1M → Warning |

**참조 테이블 (접기/펼치기):**
1. WCO 21 Section — Material → Section 매핑 전체 (MATERIAL_KEYWORDS 79그룹에서 추출)
2. 인정 단위 목록 (70+) — VALID_WEIGHT_UNITS 에서 추출, 카테고리별 정리

**하단 CTA:**
- "Ready to classify?" + API Documentation 링크 + Get API Key 링크

**스타일:**
- 배경: #0a0a0a, 텍스트: #e5e7eb (기존 potal.app 다크 테마와 일치)
- 강조색: #F59E0B (주황), #10b981 (초록), #ef4444 (빨강)
- field-validator.ts 의 실제 검증 로직과 100% 일치하도록 주의

---

## Phase 3: API 문서 업데이트

### 3-1. `app/developers/docs/page.tsx` 수정

**ENDPOINTS 배열 마지막 (health 뒤)에 2개 엔드포인트 추가:**

**엔드포인트 1: classify (정상 요청)**
```
id: 'classify'
method: POST
path: /api/v1/classify
summary: 'Classify Product (9-Field HS Code)'
tag: 'Classification'
auth: true
```

fields 9개:
- product_name (string, required): "Product title (min 2 chars). Anchor for classification."
- material (string, required): "Primary material — must match WCO 21 Section standard (79 material groups)"
- origin_country (string, required): "ISO 3166-1 alpha-2 country code (240 countries)"
- category (string, optional): "WCO 97 Chapter description or common platform category. +33% accuracy."
- processing (string, optional): "Manufacturing method (knitted, woven, forged, cast, etc.)"
- composition (string, optional): "Material percentage breakdown. Must sum ≤100%."
- weight_spec (string, optional): "Number + SI/trade unit (70+ recognized units)"
- price (number, optional): "Unit price in USD (positive number). Used for price-break tariff rules."
- description (string, optional): "Customs declaration style description (min 10 chars). +5% accuracy."

defaultBody 예시: Men's Cotton T-Shirt, cotton, CN, Clothing, knitted, 100% cotton, 200g/m², 19.99, description

exampleResponse: hsCode "6109.10", hsCode10 "6109.10.0012", validation { overall_status: "valid", estimated_accuracy: "100%" }

**엔드포인트 2: classify-validate (에러 응답 예시)**
```
id: 'classify-validate'
method: POST
path: /api/v1/classify
summary: 'Validation Error Response (Example)'
tag: 'Classification'
```

defaultBody: material="Alloy" (잘못된 값), origin_country="China" (국가명, 코드 아님)
exampleResponse: 422 + 필드별 error 상세 + closest_match + accuracy estimate

### 3-2. TAGS 배열 업데이트
```
기존: ['Calculation', 'Reference', 'Account', 'Key Management', 'System']
변경: ['Calculation', 'Classification', 'Reference', 'Account', 'Key Management', 'System']
```

---

## Phase 4: 빌드 검증

```bash
npm run build
```

- 0 errors 필수
- /guide 페이지 + /developers/docs 페이지 정상 빌드 확인

---

## Phase 5: 자체 검수 5회

### 검수 1: TypeScript Build
- npm run build → 0 errors

### 검수 2: field-validator.ts 데이터 일치 (10건)
guide 페이지의 내용이 field-validator.ts 실제 코드와 100% 일치하는지 확인:
1. material 79그룹 중 5개 랜덤 확인 (leather, cotton, steel, plastic, gold)
2. VALID_WEIGHT_UNITS 에서 5개 랜덤 확인 (kg, g/m², V, mAh, dozen)
3. category validation: CHAPTER_DESCRIPTIONS keyword 매칭 로직
4. description validation: 10자 + 5알파벳 기준
5. price validation: NaN/0/음수/1M 기준
6. origin_country: "China"→"CN" 자동변환
7. composition: 합계>100% warning
8. processing: PROCESSING_KEYWORDS 목록
9. estimated_accuracy 계산 공식
10. error vs warning 구분 기준

### 검수 3: API 문서 정확성 (5건)
1. classify 엔드포인트 fields 9개 전부 존재
2. required 3개 (product_name, material, origin_country) 정확
3. exampleResponse JSON 유효
4. curlExample 실행 가능한 형태
5. classify-validate 에러 응답 예시에 closest_match 포함

### 검수 4: 링크 확인 (3건)
1. /guide → /developers/docs 링크 존재
2. /guide → /developers 링크 존재
3. /guide ← / (홈으로 돌아가기) 링크 존재

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 기존 기능 깨짐 없음 확인

---

## Phase 6: 결과 파일 생성

`AREA0_GUIDE_API_DOCS_RESULT.md` 생성:
- Phase별 결과
- 검수 5회 결과
- 수정 파일 목록
- 생성 파일 목록

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가

---

## ⚠️ 주의사항
- Cowork에서 이미 만든 파일이 있을 수 있음 (app/guide/page.tsx, app/guide/layout.tsx). 있으면 덮어쓰기
- app/developers/docs/page.tsx 에 이미 classify 엔드포인트가 추가되어 있을 수 있음. 있으면 확인 후 정확한지 검수만 진행. 없으면 추가
- field-validator.ts 의 실제 코드를 반드시 읽고 그 내용과 100% 일치하도록 작성
- 기존 페이지 스타일(다크테마 #0a0a0a) 유지
