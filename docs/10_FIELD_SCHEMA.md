# 10 Field Schema — POTAL 판례/분류 공용어
**작성일**: 2026-04-14 KST
**스프린트**: CW34-S3 (Data Warehouse)
**참조**: `CW34_S3_MASTER_PLAN.md`, `components/playground/HsCodeCalculator.tsx`

---

## 개요

10 Field Schema는 POTAL이 상품을 분류하고 관세를 계산하는 데 사용하는 **표준 속성 집합**. 모든 데이터 파이프라인(판례 정제, 엔진 입력, UI 폼)이 이 10개 필드를 공통 인터페이스로 사용한다.

---

## 필드 정의

| # | 필드 | 타입 | 필수 | 예시 | 용도 |
|---|------|------|------|------|------|
| 1 | `productName` | text | **Y** | "cotton t-shirt" | 키워드 fallback, full-text 검색 |
| 2 | `hsCode` | text | **Y** | "6109100010" | 판례 조회 primary key, 관세율 조회 |
| 3 | `material` | text | N | "cotton" | 조건부 관세 분기, HS subheading 결정 |
| 4 | `materialComposition` | jsonb | N | `{"cotton":85,"polyester":15}` | % 임계치 평가 (e.g. cotton≥50%) |
| 5 | `productForm` | text | N | "knitted" | subheading 결정 (woven vs knitted) |
| 6 | `intendedUse` | text | N | "clothing" | 용도별 분기 (medical, industrial) |
| 7 | `weightKg` | number | N | 0.2 | specific duty 계산 |
| 8 | `priceUsd` | number | N | 25.00 | ad valorem 계산, 가치 임계치 |
| 9 | `originCountry` | text (ISO2) | N | "KR" | FTA / AD-CVD / rules of origin |
| 10 | `destinationCountry` | text (ISO2) | **Y** | "US" | 관할권, 적용 법률 결정 |

---

## 필드 상세

### 1. productName
- 상품의 일반적 영문 명칭
- 판례 매칭 시 full-text search fallback으로 사용
- 최소 2 단어, 최대 500자

### 2. hsCode
- HS (Harmonized System) 코드. WCO 6자리 기본, 국가별 확장 (US HTS 10자리, EU CN 10자리, JP 9자리)
- 저장 형식: 숫자만, dot 없음 (예: `6109100010`, NOT `6109.10.0010`)
- 6자리 미만은 invalid
- 판례 DB의 `hs_code` 컬럼과 직접 매칭

### 3. material
- 주요 소재/재질
- 키워드 사전에서 추출 (MATERIAL_TO_CATEGORIES 106개 + keyword_index.json 171개)
- **허용 값 예시**: cotton, polyester, nylon, leather, steel, aluminum, wood, glass, rubber, ceramic, plastic, silk, wool, linen
- null 허용 — null이면 HS 코드만으로 분류

### 4. materialComposition
- 소재 구성 비율 (JSONB)
- 조건부 관세에서 "cotton ≥ 50%" 같은 임계치 평가에 사용
- 예: `{"cotton": 85, "polyester": 15}` → 합계 100
- null 허용 — null이면 조건부 규칙에서 material만 사용

### 5. productForm
- 제조 형태/가공 방식
- **허용 값**: knitted, woven, nonwoven, molded, forged, cast, extruded, stamped, printed, laminated, coated, embroidered, crocheted, felted, tufted, braided, assembled, machined, welded, pressed
- 키워드 사전 매칭 (커버리지 목표 ≥35%)
- null 허용

### 6. intendedUse
- 상품의 의도된 용도
- **허용 값**: clothing, footwear, accessories, industrial, automotive, medical, pharmaceutical, food, beverage, toy, sport, furniture, construction, agricultural, electrical, electronic, cosmetic, packaging, military, veterinary
- 키워드 사전 매칭 (커버리지 목표 ≥15%)
- null 허용

### 7. weightKg
- 단위 중량 (킬로그램)
- specific duty 계산: `duty_per_unit_amount × weightKg`
- country_standards YAML의 unit_weight로 단위 변환
- null 허용 — null이면 specific duty 계산 불가, ad valorem만 적용

### 8. priceUsd
- 단위 가격 (미국 달러)
- ad valorem duty 계산: `priceUsd × duty_rate_ad_valorem / 100`
- 가치 임계치 분기에 사용 (예: "$200 이하면 면세")
- null 허용

### 9. originCountry
- 원산지 국가 (ISO 3166-1 alpha-2)
- FTA 적용 여부, AD/CVD (반덤핑/상계관세), rules of origin 결정
- null 허용 — null이면 FTA 미적용, MFN 세율

### 10. destinationCountry
- 수입 목적지 국가 (ISO 3166-1 alpha-2)
- 적용 법률 + 세율 스케줄 결정
- 예: "US" → HTS + Section 301/232, "EU" → TARIC + AD/CVD

---

## 데이터 소스별 매핑

### customs_rulings 테이블 → 10 Field

| 10 Field | customs_rulings 컬럼 | 비고 |
|----------|---------------------|------|
| productName | `product_name` | 직접 매핑 |
| hsCode | `hs_code` | 직접 매핑 |
| material | `material` | 키워드 사전 매칭으로 채움 |
| materialComposition | `material_composition` | 키워드 사전 매칭 (부분) |
| productForm | `product_form` | 키워드 사전 매칭으로 채움 |
| intendedUse | `intended_use` | 키워드 사전 매칭으로 채움 |
| weightKg | — | 판례에 없음, 런타임 사용자 입력 |
| priceUsd | — | 판례에 없음, 런타임 사용자 입력 |
| originCountry | `issuing_country` / `jurisdiction` | 판례 발행국 ≠ 원산지 |
| destinationCountry | `jurisdiction` | EBTI→EU, CROSS→US |

### HsCodeCalculator UI → 10 Field

| 10 Field | UI 컴포넌트 | 비고 |
|----------|------------|------|
| productName | 텍스트 입력 (필수) | |
| hsCode | AI 분류 결과 또는 수동 입력 | |
| material | 드롭다운 (106 options) | MATERIAL_TO_CATEGORIES |
| materialComposition | 슬라이더 (optional) | |
| productForm | 드롭다운 | |
| intendedUse | 드롭다운 | |
| weightKg | 숫자 입력 | |
| priceUsd | 숫자 입력 | |
| originCountry | 국가 선택 | |
| destinationCountry | 국가 선택 | |

---

## 매칭 우선순위 (런타임)

```
1. hs_code 정확 일치 (10자리)         → 최고 정확도
2. hs6 일치 (6자리) + material 일치   → 높은 정확도
3. hs6 일치 (6자리) only              → 중간 정확도
4. chapter 일치 + productName FTS     → 낮은 정확도 (fallback)
```

null 필드가 많을수록 confidence_score 낮아짐:
- 10/10 채움: 1.00
- hsCode + material + productForm: 0.85
- hsCode only: 0.60
- productName only (no HS): 0.30

---

## 키워드 사전 소스

| 사전 | 파일 | 엔트리 수 | 대상 필드 |
|------|------|---------|----------|
| MATERIAL_TO_CATEGORIES | `components/playground/HsCodeCalculator.tsx` | 106 | material |
| keyword_index.json | `/Volumes/soulmaten/POTAL/7field_benchmark/keyword_index.json` (추정) | 171 | material |
| product_form_dict | 신규 생성 (CW34-S3-C) | ~40 | productForm |
| intended_use_dict | 신규 생성 (CW34-S3-C) | ~20 | intendedUse |

---

## Conditional Rules DSL (Category 4-B)

판례에 조건부 관세가 포함된 경우의 구조화 형식:

```json
{
  "conditions": [
    { "field": "materialComposition.cotton", "op": ">=", "value": 50 }
  ],
  "then": { "ad_valorem": 10.0, "note": "cotton ≥50%" },
  "else": { "ad_valorem": 15.0, "note": "cotton <50%" }
}
```

**지원 연산자**: `>=`, `<=`, `>`, `<`, `==`, `!=`, `in`, `not_in`
**지원 필드**: materialComposition.{material}, weightKg, priceUsd, originCountry, productForm
**평가**: `app/lib/cost-engine/runtime/conditional-evaluator.ts` (CW34-S4에서 구현)
