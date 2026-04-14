# CW34-S3 Master Plan — Customs Rulings Data Warehouse

**작성일**: 2026-04-14 KST
**스프린트 라벨**: CW34-S3 (Data Warehouse Sprint)
**스프린트 목표**: 외장하드의 1.2M+ 고아 판례 데이터를 **Medallion Architecture** 로 정제해서 POTAL 프로덕션(Supabase)이 런타임 조회 가능한 단일 테이블 `customs_rulings` 으로 통합.

**핵심 원칙**:
1. **LLM 없음** — 모든 변환은 deterministic (regex, dictionary, SQL, JSON schema). Rule 12 엄수.
2. **외장하드에서 가공, Supabase 에 최종 업로드** — Bronze/Silver/Gold 는 `/Volumes/soulmaten/POTAL/warehouse/`, Platinum 만 Supabase.
3. **10 Field 스키마가 정제의 공용어** — 판례의 조건부 분기, 복수 HS, 다국어 전부 10 Field 로 번역.
4. **Bronze 불변** — 원본은 절대 수정하지 않음. 재처리 필요 시 Silver 부터 재빌드.
5. **Cron 통합** — 기존 POTAL cron 인프라에 `rulings-update-monitor` 추가, 원본 갱신 시 자동 재처리.

---

## 🏛️ Medallion Architecture

### 레이어 정의

```
┌──────────────────────────────────────────────────────────────┐
│ Bronze — /Volumes/soulmaten/POTAL/warehouse/bronze/          │
│   • 외장하드 원본을 그대로 복사 + SHA256 hash 기록             │
│   • Immutable. 절대 수정 금지.                                │
│   • 포맷: 원본 그대로 (CSV, JSONL, JSON, XML)                  │
│   • 목적: 소스 of truth, 재처리 시 reset point                 │
└──────────────────────────────────────────────────────────────┘
                            ↓ (country_standards YAML 적용)
┌──────────────────────────────────────────────────────────────┐
│ Silver — /Volumes/soulmaten/POTAL/warehouse/silver/          │
│   • 문자셋 정규화 (UTF-8, NFKC)                               │
│   • 날짜/숫자/통화 표준화 (YYYY-MM-DD, 점 소수점, ISO 통화)     │
│   • 국가별 YAML 적용 (독일어 움라우트, 일본어 전각, 프랑스어 등) │
│   • 아직 split 안 함, 원본과 1:1                               │
│   • 포맷: JSONL (국가/소스별 파티션)                           │
└──────────────────────────────────────────────────────────────┘
                            ↓ (비즈니스 규칙 적용)
┌──────────────────────────────────────────────────────────────┐
│ Gold — /Volumes/soulmaten/POTAL/warehouse/gold/               │
│   • HS 코드 매핑 (6자리 WCO 정렬, 상위 fallback)                │
│   • rule_split (카테고리 3: 복수 HS → 각 row)                  │
│   • conditional_rules 추출 (카테고리 4-B: 조건부 → JSONB DSL)   │
│   • 10 Field 컬럼 채움 (material, composition, form, ...)     │
│   • duty parser (ad_valorem/specific/compound/alternate)      │
│   • 15 failure categories 개별 처리                            │
│   • 포맷: JSONL (Platinum 스키마와 동일)                       │
└──────────────────────────────────────────────────────────────┘
                            ↓ (COPY 업로드)
┌──────────────────────────────────────────────────────────────┐
│ Platinum — Supabase public.customs_rulings                   │
│   • 런타임 조회용. www.potal.app 이 SELECT.                   │
│   • 인덱스: (hs_code, country), (material, composition), ...  │
│   • 업로드 절차: staging 테이블 → 검증 → transaction swap      │
│   • 예상 row 수: ~1.2M                                        │
│   • 예상 크기: ~500MB~1GB                                     │
└──────────────────────────────────────────────────────────────┘
```

### 왜 Medallion 인가

| 문제 | Medallion 의 답 |
|------|---------------|
| 원본 파일 1GB+ → Supabase 비싸짐 | Bronze/Silver/Gold 는 외장하드에 보관. 최종 Platinum (500MB) 만 Supabase |
| 파이프라인 실험 반복 | Silver/Gold 만 재빌드. Supabase 건드리지 않음 |
| 인코딩/포맷 오류 원인 추적 | Bronze immutable → 언제든 원본 비교 가능 |
| 신규 컬럼 추가 | Gold 변환 단계에 컬럼 하나 추가하고 Silver 부터 재실행 |
| 여러 소스(EBTI/CROSS/unified) 통합 | 각 소스를 Silver 까지 독립 파이프라인, Gold 에서 공통 스키마로 병합 |

---

## 📋 15 Failure Categories → Medallion 레이어 매핑

| # | 카테고리 | 예시 | 해결 레이어 | 방법 |
|---|---------|------|------------|------|
| 1 | OCR 오류 | `l0%` → `10%` | Silver | 컨텍스트 정규식 (`\bl(\d)\b` → `1$1`) |
| 2 | HS 버전 차이 | 2012 vs 2022 | Silver | `hs_version_bridge` 매핑 테이블 |
| 3 | 복수 HS 코드 | "6109.10 or 6109.90" | Gold | rule_split → 각 HS 별 독립 row |
| 4-A | 단순 duty | "10%" | Silver | 직접 파싱 |
| 4-B | 조건부 duty | "10% if cotton>80" | Gold | `conditional_rules JSONB` DSL |
| 5 | 복합 단위 | "5 EUR/kg + 2%" | Silver | duty parser (이미 CW34-S2 에서 구현) |
| 6 | 다국어 | 독일어/일본어 | Silver | `country_standards/*.yaml` |
| 7 | 표 내부 데이터 | HTML `<table>` | Bronze→Silver | HTML parser → row extraction |
| 8 | 인코딩 깨짐 | `ä` → `Ã¤` | Silver | 인코딩 감지 + UTF-8 변환 |
| 9 | 날짜 포맷 | `15.03.2024` | Silver | YAML `date_format` 적용 |
| 10 | 재분류 | 2020 판례 superseded | Gold | `status='superseded'` 플래그 |
| 11 | 레거시 통화 | DM, 円(旧) | Silver | YAML `legacy.currency` |
| 12 | 키워드 없음 | full_text 만 | Gold | 10 Field 중 `hs_code` 기반 조회 (키워드 매칭 불필요) |
| 13 | 중복 | EBTI ↔ unified | Gold | dedupe by `(source, reference_number)` |
| 14 | 부분 정보 | HS 6자리만 | Gold | Platinum 에 그대로 저장, 조회 시 fallback |
| 15 | 국가 고유 표기 | JP 9자리 | Silver | `country_standards/JP.yaml` 의 `hs_digit_length: 9` |

**예상 null rate**: ~0.05% (500 / 1M). 나머지는 "수동 검토 필요" 플래그로 에스컬레이션.

---

## 🗂️ 10 Field Schema (POTAL 공용어)

아래 10개 필드가 판례의 속성을 구조화하는 표준. HsCodeCalculator.tsx 가 이미 사용 중.

| # | 필드 | 타입 | 예시 | 판례 매칭 역할 |
|---|------|------|------|-------------|
| 1 | `productName` | text | "cotton t-shirt" | 키워드 fallback |
| 2 | `hsCode` | text (10-digit) | "6109100010" | **Primary key** — 판례 조회의 핵심 |
| 3 | `material` | enum (106개) | "cotton" | 조건부 관세 분기 (category 3, 4-B) |
| 4 | `material_composition` | jsonb | `{cotton: 85, polyester: 15}` | % 임계치 평가 |
| 5 | `product_form` | enum | "knitted" | subheading 결정 (WCO 기준) |
| 6 | `intended_use` | enum | "clothing" | 용도별 분기 (medical, industrial, etc) |
| 7 | `weight_kg` | number | 0.2 | specific duty 계산 |
| 8 | `price_usd` | number | 25.00 | ad_valorem 계산 + 가치 임계치 |
| 9 | `origin_country` | ISO2 | "KR" | FTA / AD-CVD 분기 |
| 10 | `destination_country` | ISO2 | "US" | 관할권 |

**Platinum 테이블의 매칭 로직**:
```sql
SELECT * FROM customs_rulings
WHERE
  hs_code = $1                                     -- 10 Field [2]
  AND country = $2                                 -- 10 Field [10]
  AND (material IS NULL OR material = $3)          -- 10 Field [3]
  AND (material_composition_match_rule($4, material_composition_threshold))  -- [4]
  AND (product_form IS NULL OR product_form = $5)  -- 10 Field [5]
  -- conditional_rules 는 런타임에 JS evaluator 에서 처리
ORDER BY specificity_score(material, product_form, intended_use) DESC
LIMIT 10;
```

---

## 🌐 Country Standards YAML 스키마

파일: `config/country_standards/{ISO2}.yaml`

### 표준 필드

```yaml
country: DE                   # ISO2
language: de
hs_digit_length: 10           # 6 | 8 | 9 | 10

# 숫자 표기
decimal_separator: ","        # 독일은 1.234,56
thousand_separator: "."

# 날짜
date_format: "DD.MM.YYYY"     # 또는 "YYYY-MM-DD" 등
date_alt_formats:             # 판례 원본에서 등장하는 대체 포맷
  - "DD/MM/YYYY"
  - "D. Month YYYY"

# 통화
currency: EUR
currency_position: suffix     # "100 €" vs "€100"
currency_symbols: ["€", "EUR", "Euro", "euro"]

# 중량/수량 단위
unit_weight:
  - { raw: "kg",        normalized: "kg", factor: 1 }
  - { raw: "kilogramm", normalized: "kg", factor: 1 }
  - { raw: "kilo",      normalized: "kg", factor: 1 }
  - { raw: "tonne",     normalized: "kg", factor: 1000 }
  - { raw: "t",         normalized: "kg", factor: 1000 }
  - { raw: "100 kg",    normalized: "kg", factor: 100 }
  - { raw: "g",         normalized: "kg", factor: 0.001 }

unit_piece:
  - { raw: "stück",  normalized: "piece" }
  - { raw: "st.",    normalized: "piece" }
  - { raw: "piece",  normalized: "piece" }

unit_volume:
  - { raw: "liter",  normalized: "liter" }
  - { raw: "l",      normalized: "liter" }
  - { raw: "ml",     normalized: "liter", factor: 0.001 }

# Duty 키워드
duty_keywords:
  ad_valorem: ["prozent", "%", "v.h.", "vom hundert"]
  specific:   ["je kg", "je stück", "EUR/kg", "euro/kg"]
  compound:   ["zuzüglich", "plus"]
  alternate_greater: ["mindestens", "höher"]
  alternate_lesser:  ["höchstens", "niedriger"]

# 레거시 (구 통화, 구 표기)
legacy:
  currency:
    - { raw: "DM",   normalized: "EUR", factor: 0.51129, valid_until: "1998-12-31" }
  hs_version:
    - { version: "HS2012", valid_from: "2012-01-01", valid_until: "2016-12-31" }
    - { version: "HS2017", valid_from: "2017-01-01", valid_until: "2021-12-31" }
    - { version: "HS2022", valid_from: "2022-01-01", valid_until: null }

# OCR 보정 (이 국가의 원본에서 자주 발견되는 오류)
ocr_corrections:
  - { pattern: "l0%",  replace: "10%" }
  - { pattern: "O%",   replace: "0%" }
  - { pattern: "€uro", replace: "Euro" }
```

### 우선 6개국
- **US.yaml** — English, $ prefix, MM/DD/YYYY
- **DE.yaml** — German (EU BTI 의 최대 소스), € suffix, DD.MM.YYYY
- **GB.yaml** — English, £ prefix, DD/MM/YYYY
- **JP.yaml** — Japanese, ¥/円 suffix, YYYY年MM月DD日, hs_digit_length=9
- **KR.yaml** — Korean, ₩/원 suffix, YYYY-MM-DD, hs_digit_length=10
- **CN.yaml** — Chinese, ¥/元, YYYY年MM月DD日, hs_digit_length=10 or 13

---

## 📁 CW34-S3 명령어 파일 실행 순서

### 이미 작성됨 (지금 세션)
- `docs/COMMAND_CW34_S2_COMPLETE_DUTY_PARSER.md` — Steps 1-3 완결 (터미널1)
- `docs/COMMAND_CW34_S2_5_EBTI_SCHEMA_VERIFY.md` — 실측 감사 (터미널2)
- `docs/CW34_S3_MASTER_PLAN.md` — **이 파일**

### 다음 세션에서 작성 (S2.5 리포트 확정 후)
3. `docs/COMMAND_CW34_S3_A_INFRASTRUCTURE.md`
   - 외장하드 `warehouse/bronze|silver|gold/` 폴더 생성
   - `customs_rulings` + `customs_rulings_staging` Supabase migration
   - `config/country_standards/{US,DE,GB,JP,KR,CN}.yaml` 6개
   - `docs/10_FIELD_SCHEMA.md` 명세서
   - **예상 소요**: 60분

4. `docs/COMMAND_CW34_S3_B_BRONZE_INGESTION.md`
   - 외장하드 원본 → `warehouse/bronze/{source}/{yyyy-mm-dd}/`
   - SHA256 + row count 기록 (`bronze_manifest.json`)
   - 재실행 시 동일성 검증
   - **예상 소요**: 90분

5. `docs/COMMAND_CW34_S3_C_SILVER_NORMALIZATION.md`
   - YAML 파서 구현 (`lib/warehouse/country-standards.ts`)
   - Bronze → Silver 변환 스크립트
   - 15 failure categories 중 #1, #2, #6, #7, #8, #9, #11, #15 처리
   - **예상 소요**: 4-6시간

6. `docs/COMMAND_CW34_S3_D_GOLD_BUSINESS_RULES.md`
   - rule_split (카테고리 3)
   - conditional_rules DSL 추출기 (카테고리 4-B)
   - HS 매핑 보정 (카테고리 14)
   - dedupe (카테고리 13), superseded 플래그 (카테고리 10)
   - 10 Field 컬럼 채움
   - duty parser 재적용 (CW34-S2 의 `nav-duty-text-parser` 재사용)
   - **예상 소요**: 6-8시간

7. `docs/COMMAND_CW34_S3_E_PLATINUM_SUPABASE_LOAD.md`
   - Gold JSONL → `customs_rulings_staging` COPY
   - 1,000 row manual review 스크립트
   - `BEGIN; DROP staging; ALTER rename; COMMIT;` swap
   - 인덱스 생성 + ANALYZE
   - **예상 소요**: 90분

8. `docs/COMMAND_CW34_S3_F_CRON_INTEGRATION.md`
   - `vercel.json` 에 `rulings-update-monitor` cron (주 1회)
   - EBTI/CROSS 원본 갱신 감지 → 델타 Bronze 적재 → 파이프라인 재실행
   - 실패 시 텔레그램 알람
   - **예상 소요**: 90분

9. `docs/COMMAND_CW34_S3_G_VERIFICATION.md`
   - 1,000 sample manual review
   - 카테고리 1-15 failure mode 별 sampling
   - null rate 측정 (목표 ≤0.1%)
   - 최종 `docs/CW34_S3_VERIFICATION_REPORT.md`
   - **예상 소요**: 4-6시간 (수동 검토 포함)

### 런타임 통합 (2주차)
10. `docs/COMMAND_CW34_S4_RUNTIME_INTEGRATION.md`
    - `customs_rulings` 조회 로직을 Compare Countries API 에 wire
    - HsCodeCalculator 를 FTA Eligibility 에 전파
    - **conditional_rules 런타임 evaluator** 구현
    - Parser(기존) vs Ruling(신규) 우선순위
    - **예상 소요**: 4-6시간

11. `docs/COMMAND_CW34_S4_5_FTA_ELIGIBILITY_10FIELD.md`
    - FTA Eligibility UI 에 HsCodeCalculator
    - `fta_product_rules` 와 10 Field 매칭
    - **예상 소요**: 3-4시간

### 수집 대기 중 (3주차)
12. `docs/COMMAND_CW34_S5_PENDING_DATA_ACQUISITION.md`
    - WCO Explanatory Notes 유료 구독 평가
    - 중국 海关总署 판례 스크래핑 조사
    - 일본 事前教示制度 포털 조사
    - **예상 소요**: 조사만 4시간, 실제 수집은 CW35+

---

## 🔧 인프라 변경 요약

### 신규 Supabase 테이블 (migration)
```sql
-- public.customs_rulings (메인)
-- public.customs_rulings_staging (임시, swap 용)
```

### 신규 외장하드 디렉터리
```
/Volumes/soulmaten/POTAL/warehouse/
├── bronze/
│   ├── ebti/{yyyy-mm-dd}/
│   ├── cross/{yyyy-mm-dd}/
│   ├── unified/{yyyy-mm-dd}/
│   ├── ai4/{yyyy-mm-dd}/
│   └── _manifest.jsonl
├── silver/
│   ├── ebti.jsonl
│   ├── cross.jsonl
│   ├── unified.jsonl
│   └── ai4.jsonl
└── gold/
    ├── customs_rulings.jsonl   (최종, Platinum 스키마)
    └── _stats.json              (row count, null rate, 등)
```

### 신규 코드 모듈
```
app/lib/warehouse/
├── country-standards.ts       (YAML 로더 + 정규화 함수)
├── rule-splitter.ts            (카테고리 3)
├── conditional-rules-parser.ts (카테고리 4-B)
├── hs-bridge.ts                (카테고리 2: HS 버전 변환)
└── encoding-normalizer.ts      (카테고리 8)

app/lib/cost-engine/runtime/
└── conditional-evaluator.ts   (런타임 conditional_rules 평가)

config/country_standards/
├── US.yaml
├── DE.yaml
├── GB.yaml
├── JP.yaml
├── KR.yaml
└── CN.yaml

scripts/warehouse/
├── ingest-bronze.mjs
├── build-silver.mjs
├── build-gold.mjs
├── load-platinum.mjs
└── verify-sample.mjs

api/cron/
└── rulings-update-monitor/route.ts
```

---

## 📊 성공 지표

| 지표 | 현재 | CW34-S3 완료 후 목표 |
|------|------|---------------------|
| 판례 Supabase row 수 | 0 | ≥1,200,000 |
| HS 매핑률 (non-null) | N/A | ≥99% |
| duty_rate 추출률 | N/A | ≥95% |
| conditional_rules 추출률 | 0 | ≥80% (조건부 판례에서) |
| null rate (manual review 1000 샘플) | N/A | ≤0.1% |
| 쿼리 p50 응답 (hs + country) | N/A | <50ms |
| 쿼리 p95 응답 | N/A | <200ms |
| 외장하드 Bronze immutable 검증 | N/A | ✅ hash 일치 |
| cron 자동 재처리 | ❌ | ✅ 주 1회 |
| verify-cw32/33/34 회귀 | 28/23/4 | 28/23/4+N green |

---

## 🚨 제약사항 & 리스크

### 제약
- **외장하드 물리 연결 필수** — Bronze/Silver/Gold 처리는 은태님 맥 에서만. 터미널2 에 "외장하드 마운트 확인" 선행 단계.
- **LLM 금지** — Rule 12. 모든 변환 deterministic.
- **Supabase Pro 8GB 한도** — Platinum 예상 크기 500MB~1GB. 여유는 있지만 full_text 컬럼을 TEXT 로 두면 꾸준히 증가. 필요 시 별도 스토리지 분리 검토.
- **판례 저작권** — EBTI (공공), CBP CROSS (공공) 은 OK. WCO Explanatory Notes 는 유료. full_text 저장 시 라이선스 재확인.

### 리스크 & 완화
| 리스크 | 완화 |
|------|------|
| Silver 변환에서 데이터 손실 | Bronze immutable → 언제든 재빌드 가능 |
| HS 버전 bridge 불완전 | CW34-S3 범위에서 HS 2022 기준만 처리, 2017 이전은 status='legacy' 플래그 |
| Platinum swap 중 downtime | transaction rename 사용 (ms 단위) |
| cron 자동 재처리 실패 | 텔레그램 알람 + 수동 실행 가능한 CLI 유지 |
| null rate 목표 미달 | 수동 검토 플래그 + CW34-S5 에서 추가 보정 |

---

## 🎯 CW34 전체 로드맵 (CW34-S3 가 이 중 가장 큼)

| Sprint | 제목 | 상태 | 파일 수 |
|--------|------|------|--------|
| CW34-S1 | Playground 10-field UI + v3 분류 | ✅ (c428fcc 이전) | — |
| CW34-S2 | Specific Duty Parser (Steps 1-6) | 🟡 Steps 4-6 완료 / Steps 1-3 pending | 1 |
| CW34-S2.5 | EBTI/CROSS 스키마 감사 | ⬜ pending | 1 |
| **CW34-S3** | **Data Warehouse (판례)** | **⬜ pending** | **7** |
| CW34-S4 | 런타임 통합 | ⬜ pending | 1 |
| CW34-S4.5 | FTA Eligibility 10-field | ⬜ pending | 1 |
| CW34-S5 | Pending data acquisition | ⬜ pending | 1 |

**이 마스터 플랜의 역할**: 위 13개 파일 전체의 상위 설계 문서. 개별 명령어 파일은 이 문서를 참조해서 "실행 순서, 선행조건, 스키마 규격, 10 Field, country standards" 를 찾을 수 있어야 함.

---

## 📝 참조

- 상위 원칙: `CLAUDE.md` Rule 12, Rule 13
- 기존 Specific Duty 구현: CW34-S2 c428fcc
- 10 Field 원형: `components/playground/HsCodeCalculator.tsx` (CW34-S1)
- Cron 인프라: `vercel.json` (24 tasks 중 하나로 추가)
- 외장하드 파일 목록: `docs/EXTERNAL_DRIVE_FILES.md`
- Rule 12 원인 진단: (a) 데이터 부족 / (b) 매핑 오류 / (c) 데이터 미사용

---

**Next action**: 터미널1 에서 `COMMAND_CW34_S2_COMPLETE_DUTY_PARSER.md` 실행. 병렬로 터미널2 에서 `COMMAND_CW34_S2_5_EBTI_SCHEMA_VERIFY.md` 실행. 두 개 끝나면 다음 세션에서 파일 3-9 작성.
