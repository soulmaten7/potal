# 외장하드 데이터 실측 검증 리포트
> 작성: 2026-04-14 KST | CW34-S1 HF2 진단 결과

---

## 1. JP HS10 Seed 가능성

### 현황 (이전 진단 수정)

**`gov_tariff_schedules` 테이블에 JP 데이터가 이미 존재함.** 이전 CW34 진단에서 "JP row 0건"이라고 했지만 실측 결과 **89,842 rows across 7 countries (US/EU/UK/KR/CA/AU/JP)** 전부 seed 완료 상태.

- Seed 소스: `scripts/collect_national_codes.py` → macmap_ntlc (JP 9자리 코드 포함)
- JP 전용 데이터: 16,076 entries (CSV + JSON 동일)

### JP HS10 미반환 진짜 원인

JP 코드는 **9자리** 체계 (예: `610910010`, `610910020`). US/EU/UK는 10자리.
`hs10-resolver.ts`가 `HS10_COUNTRIES`에 JP를 포함하지만, JP의 9자리 코드가 "HS10 precision"으로 인정되지 않을 가능성이 있음.

### 외장하드 JP 파일

| 파일 | 크기 | 내용 | 상태 |
|------|------|------|------|
| `hs_national_rules/jp/codified_national_full_final.json` | 7.9MB | 16,076 entries, hs_code/description/duty_rate_pct/conditions/keywords | DB와 동일 소스 |
| `hs_national_rules/jp/tariff_schedule_full.csv` | 2.7MB | 16,076 rows, hs_code/description/duty_rate_text/duty_rate_pct/special_rates/units/indent | DB seed 원본 |
| `regulations/jp/customs_tariff/jp_tariff_ch*.htm` | 98 files | 2026년판 JP 관세율표 HTML (customs.go.jp 출처) | 참조용 |
| `regulations/jp/customs_tariff/jp_tariff_2025_all.xlsx` | — | 엑셀 전체본 | 참조용 |

### 610910 (Cotton T-shirt) JP 10자리

| 코드 | 설명 | duty_rate_pct | 비고 |
|------|------|---------------|------|
| `610910` | Of cotton | 9.2% | 6자리 parent |
| `610910010` | Of yarns of different colours or printed | null | 9자리 sub-item |
| `610910020` | Other (cotton) | null | 9자리 sub-item |

**권장 소스**: `tariff_schedule_full.csv` (이미 DB에 있음)
**난이도**: S (Small) — 데이터 이미 seed됨. hs10-resolver의 JP 9자리 처리 로직만 확인/수정 필요.

---

## 2. Specific Duty 파이프라인 Gap

### DB에 이미 있는 데이터

**`macmap_ntlc_rates` 테이블 rate_type 분포:**

| rate_type | 건수 | 비율 |
|-----------|------|------|
| ad_valorem | 516,283 | 96.0% |
| compound | 20,014 | 3.7% |
| specific | 1,601 | 0.3% |
| **합계** | **537,898** | |

**JP non-ad-valorem 샘플:**

| hs_code | rate_type | nav_duty_text | 설명 |
|---------|-----------|---------------|------|
| 010121290 | compound | 6.1% + 3,400,000 yen/each | 생마 |
| 010229100 | compound | 12.4% + 38,250 yen/each | 소 ≤300kg |
| 020311020 | compound | 120.7% + 361 yen/kg | 돼지고기 |
| 010392012 | specific | gate-price mechanism | 생돈 |

### 외장하드 추가 데이터

| 파일 | 크기 | specific/compound | 상태 |
|------|------|-------------------|------|
| `duty_rates_merged.csv` | 53.9MB | **0건** (WTO ad_valorem only, 1,027,674 rows) | 사용 불가 |
| `commodity_duty_rates.json` | 135.5KB | 68건 (GB compound, POC 수준) | 사용 불가 |
| `hs_national_rules/*/codified_national_full_final.json` | 7개국 | compound 742건 (JP만), specific 포함 가능 | 이미 DB에 반영됨 |

### 코드 수정 4단계 실현 가능 여부

| 단계 | 파일:라인 | 현재 상태 | 수정 내용 | 실현 가능 |
|------|----------|----------|----------|-----------|
| 1. DB query 확장 | `app/lib/cost-engine/db/duty-rates-db.ts:24-68` | `getDutyRateFromDb()`가 chapter-level cache만 조회, `macmap_ntlc_rates` 미사용 | `rate_type` + `nav_duty_text` 반환하도록 `macmap_ntlc_rates` JOIN 추가 | ✅ 가능 |
| 2. dutyType 동적화 | `app/lib/cost-engine/GlobalCostEngine.ts:1018` | `dutyType = 'ad_valorem'` 하드코딩 | DB에서 받은 `rate_type`으로 설정 | ✅ 가능 |
| 3. API weight 전달 | `app/api/v1/calculate/compare/route.ts:27-38` | `weight_kg` 미읽음 | `body.weight_kg` 읽어서 `GlobalCostInput`에 전달 | ✅ 가능 |
| 4. UI weight 필드 | `lib/playground/scenario-endpoints.ts` Compare params | weight_kg 없음 | DDP vs DDU처럼 weight_kg 필드 추가 | ✅ 가능 |

**추가 발견**: `nav_duty_text` 파싱 로직 필요 — "361 yen/kg" → `specificRatePerKg = 361 * USD/JPY_rate`로 변환해야 함. `calculateDutyByType()` 함수 자체는 이미 specific/compound/mixed 로직 완비.

---

## 3. Rule 12 원인 판정

### JP HS10

**원인: (c) 데이터 미사용**

데이터는 `gov_tariff_schedules`에 이미 seed됨 (JP 9자리 포함). HS10 resolver가 JP를 화이트리스트에 포함하고 쿼리도 실행하지만, JP 코드가 9자리(US/EU 10자리와 다른 체계)라서 "HS10" precision으로 반환되지 않거나, 특정 HS6에 대해 후보가 0건이 되는 조건이 있을 수 있음. **코드 수정 영역**: `hs10-resolver.ts`의 JP 9자리 코드 처리 로직.

### Specific Duty

**원인: (c) 데이터 미사용**

`macmap_ntlc_rates` 테이블에 **21,615건**의 specific/compound duty 데이터가 이미 존재. `calculateDutyByType()` 함수도 완비. 그러나 3곳에서 파이프라인이 끊김:
1. `duty-rates-db.ts` → `macmap_ntlc_rates` 미조회
2. `GlobalCostEngine.ts:1018` → `dutyType` 하드코딩
3. `compare/route.ts` → `weight_kg` 미전달

---

## 4. 놓친 데이터

| 파일 | 현재 상태 | POTAL 활용 여부 |
|------|----------|----------------|
| `regulations/jp/customs_tariff/jp_tariff_2025_all.xlsx` | JP 관세율표 엑셀 원본 | 미사용 (HTML만 참조) |
| `7field_benchmark/master_classification_engine.json` (15.4MB) | 575K 판결문 패턴, category_fallback 21,340 키워드 | category_fallback 미연결 (heading-level만, subheading 없음) |
| `benchmark/formulas/keyword_index.json` (173KB) | 171개 material/form 키워드 → HS6 매핑 | 미연결 (v3 파이프라인 미사용) |

---

## 5. 수정 명령어 초안

### JP HS10 수정 (난이도 S)
```
1. hs10-resolver.ts에서 JP 코드 길이 처리 확인:
   - JP는 9자리 체계 → hsCodePrecision을 'HS9' 또는 'HS10'으로 반환하는 조건 확인
   - 9자리도 유효한 national code로 인정하도록 수정
   
2. 테스트: /api/v1/classify에 destination_country=JP로 요청 → hs10Code 반환 확인
```

### Specific Duty 수정 (난이도 M)
```
Step 1: duty-rates-db.ts
  - macmap_ntlc_rates 테이블에서 hs6+country로 rate_type, nav_duty_text 조회
  - 반환 타입에 rateType: DutyType, navDutyText: string 추가

Step 2: nav_duty_text 파서 (신규 유틸)
  - "361 yen/kg" → { specificRatePerKg: 361, currency: 'JPY' }
  - "6.1% + 3,400,000 yen/each" → { adValoremRate: 0.061, specificRatePerUnit: 3400000, currency: 'JPY' }
  - USD 변환은 기존 convertCurrency() 활용

Step 3: GlobalCostEngine.ts:1018
  - DB에서 받은 rate_type으로 dutyType 설정
  - specificRatePerKg를 파싱된 값으로 전달

Step 4: compare/route.ts + scenario-endpoints.ts
  - body.weight_kg 읽어서 GlobalCostInput에 전달
  - Compare params에 weight_kg 필드 추가
```
