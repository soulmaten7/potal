# Claude Code 명령어: 7개국 관세율표 원본 코드화 (Step 0~3과 동일한 방식)

> **날짜**: 2026-03-21 KST
> **목표**: /Volumes/soulmaten/POTAL/hs_national_rules/ 의 7개국 관세율표 CSV + structure_and_rules.md를 분석하여 코드화(JSON). Step 0~3에서 WCO 원문을 코드화한 것과 동일한 방식 적용.
> **방법**: Step 0~3 코드화 과정을 참고. 1차 코드화 → 2차 검증 → 3차 정밀화 → 기존 코드화 데이터와 비교.
> **결과**: 코드 수정 안 함. 코드화 JSON 파일 생성 + 기존 데이터와 비교 보고서만.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 참고: Step 0~3 코드화가 어떻게 진행됐는지

Step 0~3의 코드화는 이렇게 여러 단계를 거쳐 정확해졌다:

### 기존 코드화 단계 (WCO 원문 → codified JSON):

**1단계: 원문 구조 파악**
- Section Notes 21개, Chapter Notes 97개 원문을 읽고 구조 분석
- 규칙 유형 분류: exclusion, inclusion, numeric_threshold, material_condition, definition

**2단계: 1차 코드화**
- 원문 텍스트 → JSON 변환 (키워드, 조건, 타겟 추출)
- codified_rules.json (592개), codified_headings.json (1,233개), codified_subheadings.json (5,621개)

**3단계: 교차 검증**
- CBP CROSS 220K 판결문 + EU EBTI 269K 판결문으로 검증
- 코드화한 규칙이 실제 분류 결정과 일치하는지 대조

**4단계: 오류 수정 + 재코드화**
- 불일치 항목 원인 분석 → 규칙 수정
- 누락 키워드 추가, 조건 보정

**5단계: 벤치마크**
- Amazon 50건 테스트 → 100% → 검증 완료

### 결과 파일:
```
data/codified-rules.ts      (172KB, 592개 규칙)
data/codified-headings.ts   (442KB, 1,233개 Heading)
data/codified-subheadings.ts (1.9MB, 5,621개 Subheading)
```

---

## 이번 코드화 대상

```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── wco/hs_convention_subdivisions.md
├── us/tariff_schedule.csv (28,718행) + structure_and_rules.md
├── eu/tariff_schedule.csv (17,278행) + structure_and_rules.md
├── gb/tariff_schedule.csv (17,289행) + structure_and_rules.md
├── kr/tariff_schedule.csv (6,646행) + structure_and_rules.md
├── jp/tariff_schedule.csv (6,633행) + structure_and_rules.md
├── au/tariff_schedule.csv (6,652행) + structure_and_rules.md
└── ca/tariff_schedule.csv (6,626행) + structure_and_rules.md
```

추가로 기존에 이미 있는 원본:
- US: `/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json` (15MB, US HTS 원본)

---

## Phase 1: 원문 구조 파악 (Step 0~3의 1단계와 동일)

### 1-1. 각 나라 CSV 구조 분석

7개국 tariff_schedule.csv를 읽고 컬럼 구조 + 샘플 확인:

```python
import csv
for country in ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']:
    path = f'/Volumes/soulmaten/POTAL/hs_national_rules/{country}/tariff_schedule.csv'
    with open(path) as f:
        reader = csv.reader(f)
        headers = next(reader)
        print(f'{country}: columns={headers}')
        for i, row in enumerate(reader):
            if i < 3: print(f'  {row}')
            else: break
```

### 1-2. structure_and_rules.md 내용 확인

각 나라의 세분화 규칙 문서 내용 확인:

```bash
for country in wco us eu gb kr jp au ca; do
  echo "=== $country ==="
  head -50 /Volumes/soulmaten/POTAL/hs_national_rules/$country/*.md
  echo ""
done
```

### 1-3. US 원본 JSON 구조 분석 (가장 상세한 소스)

```python
import json
with open('/Volumes/soulmaten/POTAL/regulations/us/htsus/hts_2026_rev4.json') as f:
    data = json.load(f)
# 구조 파악: indent, Additional Notes, Statistical Notes 위치 확인
```

### 1-4. 세분화 패턴 유형 분류

각 나라 CSV의 description을 분석하여 세분화 기준 패턴을 유형별로 분류:

```
패턴 유형 후보:
- MATERIAL_DETAIL: "of cotton", "of synthetic fibers", "of stainless steel"
- PRICE_THRESHOLD: "valued not over $X", "valued over $X each"
- SIZE_THRESHOLD: "not over 27.9 cm", "exceeding X cm"
- WEIGHT_THRESHOLD: "weighing not more than X kg"
- GENDER: "men's or boys'", "women's or girls'"
- PROCESSING: "knitted or crocheted", "woven", "roasted"
- END_USE: "for food contact", "for industrial use", "household"
- COMPOSITION_PCT: "containing 85 percent or more by weight"
- COUNTRY_ORIGIN: "described in general note 15" (US GSP)
- CATCH_ALL: "other", "n.e.c.", "not elsewhere"
- INDENT_PARENT: 상위 계층 (세율 없음, 하위 코드의 부모)
```

각 나라 CSV의 description을 전수 분석하여 패턴 유형별 건수 집계.

---

## Phase 2: 1차 코드화 (Step 0~3의 2단계와 동일)

### 2-1. 코드화 JSON 구조 설계

기존 codified_headings.json 구조를 참고하여 국가별 코드화 구조 설계:

```json
{
  "country": "US",
  "hs6": "691200",
  "subdivisions": [
    {
      "national_code": "6912001000",
      "description": "Of coarse-grained earthenware...",
      "indent": 2,
      "parent_code": "691200",
      "conditions": {
        "material_detail": "coarse-grained earthenware",
        "pattern_type": "MATERIAL_DETAIL"
      },
      "keywords": ["earthenware", "coarse-grained", "stoneware"]
    },
    {
      "national_code": "6912003510",
      "description": "Plates not over 27.9 cm; teacups and saucers; mugs",
      "indent": 6,
      "parent_code": "69120035",
      "conditions": {
        "product_types": ["plates", "teacups", "saucers", "mugs"],
        "size_threshold": {"max_cm": 27.9, "applies_to": "plates"},
        "price_threshold": {"aggregate_max": 38, "reference": "additional U.S. note 6(b)"},
        "pattern_type": "PRODUCT_TYPE + SIZE_THRESHOLD + PRICE_THRESHOLD"
      },
      "keywords": ["plate", "teacup", "saucer", "mug", "soup", "fruit", "cereal"]
    }
  ]
}
```

### 2-2. 7개국 전부 1차 코드화 실행

각 나라 CSV를 읽고 → description에서 패턴/조건/키워드 추출 → JSON 생성.

**나라별로 다른 처리:**

**US (가장 복잡):**
- indent 계층 활용 (parent-child 관계 구축)
- Additional Notes 참조 (있으면)
- 가격 threshold 파싱 ("valued not over $X" → {max: X})
- 크기/무게 threshold 파싱 ("not over X cm" → {max_cm: X})
- 성분비 파싱 ("containing 85 percent" → {min_pct: 85, material: "cotton"})
- 성별 파싱 ("men's or boys'" → {gender: "male"})

**EU/GB (중간):**
- indent 없음 → 코드 계층은 자릿수로 추론 (8자리 < 10자리)
- 소재/무게/가공 중심 세분화

**KR/JP/AU/CA (단순):**
- flat 구조
- 소재 + 가공 중심

### 2-3. 저장

```
/Volumes/soulmaten/POTAL/hs_national_rules/
├── us/codified_national.json   ← US 28,718행 코드화
├── eu/codified_national.json   ← EU 17,278행 코드화
├── gb/codified_national.json
├── kr/codified_national.json
├── jp/codified_national.json
├── au/codified_national.json
└── ca/codified_national.json
```

---

## Phase 3: 교차 검증 (Step 0~3의 3단계와 동일)

### 3-1. 코드화 결과 vs 원본 CSV 대조

코드화한 JSON의 national_code가 원본 CSV의 hs_code와 1:1 매칭되는지 확인.
누락된 코드, 잘못 파싱된 조건 찾기.

### 3-2. 패턴 유형별 분포 확인

```
각 나라별:
- MATERIAL_DETAIL: X건 (X%)
- PRICE_THRESHOLD: X건 (X%)
- SIZE_THRESHOLD: X건 (X%)
- WEIGHT_THRESHOLD: X건 (X%)
- GENDER: X건 (X%)
- PROCESSING: X건 (X%)
- END_USE: X건 (X%)
- COMPOSITION_PCT: X건 (X%)
- CATCH_ALL: X건 (X%)
- INDENT_PARENT: X건 (X%)
```

### 3-3. description → conditions 변환 정확도 확인

랜덤 50건 샘플링하여 description의 조건이 conditions JSON에 정확히 반영되었는지 수동 검증.

---

## Phase 4: 정밀화 (Step 0~3의 4단계와 동일)

Phase 3에서 발견한 오류/누락 수정.

---

## Phase 5: 기존 코드화 데이터와 비교 (핵심)

### 5-1. 기존 데이터 (Step 0~3에서 만든 것)

```
data/codified-rules.ts      → 592개 Notes 규칙
data/codified-headings.ts   → 1,233개 Heading (keywords 포함)
data/codified-subheadings.ts → 5,621개 Subheading
```

### 5-2. 비교 항목

**A. 키워드 커버리지:**
- 기존 codified-headings의 keywords vs 이번 코드화의 keywords
- 기존에 없는 키워드가 이번 코드화에서 나왔는지
- 이번 코드화에서 나온 keywords가 KEYWORD_TO_HEADINGS (380개)에 있는지

**B. 조건 커버리지:**
- 기존 codified-subheadings의 conditions vs 이번 코드화의 conditions
- 기존에 없는 조건 유형이 이번에 나왔는지 (예: 가격 threshold, 크기 threshold)

**C. 패턴 일치:**
- HS6 기준으로 기존 6자리 코드화와 이번 7~10자리 코드화가 연결되는지
- 예: codified_subheadings의 610910 → us/codified_national.json의 610910 하위 코드

**D. 신규 발견:**
- 이번 코드화에서 기존에 전혀 없던 정보가 나왔는지
- 예: 가격 threshold 규칙 (기존에 hs_price_break_rules 18건만 있었음)

### 5-3. 비교 보고서

```
기존 vs 이번 코드화 비교:
- 기존 키워드 총 수: X개 / 이번 키워드 총 수: X개 / 신규: X개
- 기존 조건 유형: X종 / 이번 조건 유형: X종 / 신규 유형: X종
- 기존 hs_price_break_rules: 18건 / 이번 PRICE_THRESHOLD: X건
- 연결성: HS6 X개 중 X개가 양쪽 모두 존재
```

---

## 결과물

### 1. 코드화 JSON 파일 (7개국)

```
/Volumes/soulmaten/POTAL/hs_national_rules/{country}/codified_national.json
```

### 2. 엑셀: `POTAL_7Country_Codification.xlsx`

**Sheet 1: Summary**
- 나라별 코드화 건수, 패턴 유형별 분포

**Sheet 2: Pattern Distribution**
- 7개국 × 10개 패턴 유형 건수 표

**Sheet 3: US Detail** (가장 복잡하므로 별도)
- indent 계층별 분석, 가격/크기/무게 threshold 목록

**Sheet 4: Comparison with Existing**
- 기존 코드화 vs 이번 코드화 비교표
- 신규 키워드 목록
- 신규 조건 유형 목록
- 신규 가격 threshold 목록

**Sheet 5: Validation**
- 50건 수동 검증 결과

### 3. 엑셀 로그

시트 마감: `=== 작업 종료 === | 코드화 7개국 X행 | 패턴 유형 X종 | 기존 대비 신규 키워드 X개 | 신규 조건 X개`

---

## ⚠️ 절대 규칙

1. **코드 수정 하지 않는다** — 코드화 JSON 생성 + 비교 보고서만
2. **7개국 전부 코드화** — 일부만 하지 않는다
3. **기존 코드화 방식과 동일하게** — 패턴 유형 분류, 키워드 추출, 조건 파싱
4. **Phase 3 교차 검증 필수** — 1차 코드화 후 반드시 원본과 대조
5. **기존 데이터와 비교 필수 (Phase 5)** — 이번 코드화가 기존보다 어떻게 다른지
6. **US는 indent 계층 반드시 반영** — 다른 6개국은 flat이지만 US는 0~11 indent
7. **가격/크기/무게 threshold는 숫자 파싱** — "valued not over $38" → {max: 38, currency: "USD"}
8. **엑셀에 코드화 과정 전부 기록**
