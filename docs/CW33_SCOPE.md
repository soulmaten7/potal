# CW33 Work Scope — Derived from Phase A Audit

**Source**: `docs/HARDCODING_AUDIT.md` (2026-04-11 KST)
**Goal**: Enterprise API 판매 전 프로덕션 레벨 데이터 정확성 확보
**Total scope**: 🔴 19건 + 🟡 8건 = **27 items**

---

## 📋 P0 — Critical (반드시 CW33 에서 해결)

### CW33-S1: Core tariff + FTA DB 이전 (Foundation)

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P0.1 | **FTA agreements → DB** | `fta.ts` → `fta_agreements` + `fta_members` + `fta_product_rules` | L |
| P0.2 | **Country data → DB seed** | `country-data.ts` → `country_profiles` (이미 테이블 있음, seed 필요) + `de_minimis_exceptions` 신규 | L |
| P0.3 | **deterministicOverride → admin table** | `ai-classifier-wrapper.ts:27-100` → `hs_classification_overrides` + 관리자 UI | M |
| P0.4 | **Restriction rules → DB** | `restrictions/rules.ts` → `import_restrictions` 신규 | M |

**예상 소요**: 1.5 sprint (약 6-8일)

**완료 기준**:
- 3개 신규 Supabase 테이블 + 마이그레이션
- `fta.ts` / `restrictions/rules.ts` 가 읽기 전용 **오프라인 seed** 로만 사용 (프로덕션 런타임 DB 읽음)
- `verify-cw32.mjs` 28/28 green 유지
- 관리자가 POTAL admin UI 에서 FTA 신설 / override 추가 가능

---

### CW33-S2: US/EU tax & tariff tables

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P0.5 | **Section 301/232 → DB** | `section301-lookup.ts` → `us_additional_tariffs` | M |
| P0.6 | **US TRQ → DB + USDA sync** | `trq-lookup.ts` → `us_tariff_rate_quotas` + daily cron | L |
| P0.7 | **EU reduced VAT → DB** | `eu-vat-rates.ts` → `eu_reduced_vat_rates` | M |
| P0.8 | **EU seasonal tariffs → DB + EC sync** | `eu-seasonal-tariffs.ts` → `eu_seasonal_tariffs` | M |
| P0.9 | **US state sales tax + nexus → DB** | `F056`, `F148` → `us_state_sales_tax` | M |
| P0.10 | **Price break rules → DB** | `price-break-rules.ts` → `price_break_rules` | M |

**예상 소요**: 2 sprint (약 8-10일)

**완료 기준**:
- 6개 신규 Supabase 테이블
- 연 2회 자동 sync (USITC HTSUS, EU CN, USDA TRQ)
- F020~F022 (AD/CVD/Safeguard) DB freshness check 추가

---

### CW33-S3: Classifier + product identity

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P0.11 | **HS Database → DB** | `hs-database.ts` + chapters/ → `hs_codes` + `hs_keywords` | XL |
| P0.12 | **Brand origins → DB** | `origin-detection.ts` + `brand-origins.ts` → `brand_origins` + `marketplace_origins` | M |
| P0.13 | **IOSS/OSS 규칙 → DB** | `ioss-oss.ts` → `eu_vat_regimes` | S |

**예상 소요**: 1 sprint (P0.11 단독으로 5-7일)

**주의**: P0.11 은 수천 row seed 필요 — WCO HS 2022 CSV 기반으로 자동화 스크립트 작성 권장

---

### CW33-S4: Sanctions & screening (허위광고 리스크 해결)

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P0.14 | **OFAC SDN daily sync** | `screening/screen.ts` → `sanctioned_entities` + OFAC XML feed | XL |
| P0.15 | **BIS Entity List sync** | 동일 테이블 + BIS feed | M |
| P0.16 | **EU Consolidated + UK HMT sync** | 동일 테이블 + EU feeds | M |
| P0.17 | **Screening normalization pipeline** | `screen.ts` normalization logic 확장 | M |

**예상 소요**: 2 sprint (약 10일, OFAC XML parser 개발 비중 큼)

**완료 기준**:
- `sanctioned_entities` 테이블에 ~20,000 건 live 데이터
- 일일 자동 sync (Vercel Cron)
- F023/F024 설명문 ("19 global sources") 이 진실이 되도록

---

### CW33-S5: Exchange rate + Multi-currency (F011/F044)

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P0.18 | **Exchange rate 유료 소스 추가** | `exchange-rate-service.ts` + Frankfurter/ECB | M |
| P0.19 | **일일 DB cache sync** | `exchange_rate_cache` + Vercel cron | S |

**예상 소요**: 3일

---

## 📋 P1 — Important (CW33 권장, 리소스 여력 시)

### CW33-S6: External API integrations

| # | 항목 | 파일 | 난이도 |
|---|---|---|---|
| P1.1 | **Insurance rate tables → DB** | `insurance-calculator.ts` → `insurance_rate_tables` | S |
| P1.2 | **AD/CVD trade remedy freshness** | `trade-remedy-lookup.ts` logging + alerting | S |
| P1.3 | **VAT registration live check** | F058 → VIES/HMRC API | M |
| P1.4 | **Image classification fallback chain** | F010 Claude Vision + log | S |
| P1.5 | **Shipping rates (DHL/FedEx/UPS)** | F060/F061 → carrier API | L |
| P1.6 | **Specialized tax 12개국 → DB** | F057 → `specialized_tax_rates` | M |
| P1.7 | **Checkout fraud detection** | F073 → Stripe Radar 통합 | M |
| P1.8 | **Carrier tracking webhooks** | F063 → DHL/FedEx webhooks | M |

**예상 소요**: 1.5 sprint

---

## 🗓️ Sprint 분할 제안 (총 9개 sprint, 6주)

```
Week 1  CW33-S1 Core tariff + FTA DB 이전 (P0.1-P0.4)
Week 2  CW33-S2 US/EU tax & tariff tables (P0.5-P0.10)
Week 3  CW33-S3 Classifier + product identity (P0.11-P0.13)
Week 4  CW33-S4a OFAC SDN sync pipeline (P0.14-P0.15)
Week 5  CW33-S4b EU/UK sanctions + normalization (P0.16-P0.17)
        CW33-S5 Exchange rate 확장 (P0.18-P0.19)
Week 6  CW33-S6 P1 items (리소스 여력 시)
```

**총 P0 소요 예상**: 4-5 주
**P1 포함 총 소요**: 6 주

---

## 🗄️ Supabase 스키마 Master List (신규 18개 테이블)

```sql
-- CW33-S1
fta_agreements           -- 63+ FTAs, status, supersedes
fta_members              -- treaty membership
fta_product_rules        -- chapter/heading preferential rates
de_minimis_exceptions    -- origin×dest exception table (IEEPA 등)
hs_classification_overrides  -- admin override rules (battery, cotton, etc.)
import_restrictions      -- 70+ rules → 수백 rules

-- CW33-S2
us_additional_tariffs    -- Section 301/232/IEEPA
us_tariff_rate_quotas    -- 372 → 전체 US TRQ
eu_reduced_vat_rates     -- 27국 × chapter
eu_seasonal_tariffs      -- EU CN 연례 업데이트
us_state_sales_tax       -- 51 rows (50주 + DC) + nexus thresholds
price_break_rules        -- valued over $X rules

-- CW33-S3
hs_codes                 -- WCO HS 2022 전체 (수천 rows)
hs_keywords              -- classifier keyword search
brand_origins            -- 130+ 브랜드 → 국가
marketplace_origins      -- 플랫폼 → default origin
eu_vat_regimes           -- IOSS/OSS threshold history

-- CW33-S4
sanctioned_entities      -- OFAC+BIS+EU+UK live feed

-- CW33-S5
exchange_rate_cache      -- 일일 환율 snapshot

-- CW33-S6 (P1)
insurance_rate_tables
specialized_tax_rates
carrier_rate_cache
```

---

## ⚠️ Phase A → Phase B 전환 전 선결 질문 (은태님 결정 필요)

1. **Sanction sync 비용 예산**
   - OFAC XML feed 는 무료. BIS Entity List 도 무료. 하지만 EU Consolidated 와 UK HMT 는 각자 파싱 필요.
   - 선택: (a) 전부 자체 파서 개발, (b) 유료 aggregator 사용 (Refinitiv World-Check $수천/월, Dow Jones WatchList 유사 비용)
   - 권장: **무료 feed 자체 파싱** (b2b 초기 단계 비용 최소화)

2. **HS Database 이전 범위 (P0.11)**
   - 전체 5,000+ HS 코드 seed 는 대규모 작업. 대안: (a) 현재 hs-database.ts 의 TS 구조 유지 + DB 에는 "override 만" (b) 전면 이전
   - 권장: **(a) 하이브리드 — 코드에 baseline, DB 에 override 만** (P0.11 난이도 XL → M 으로 감소)

3. **Exchange rate 유료 소스 비용**
   - Open Exchange Rates $12/월, Fixer $10/월, Frankfurter **무료** (ECB 기반)
   - 권장: **Frankfurter primary + 기존 2개 fallback** (추가 비용 0)

4. **admin UI 범위**
   - `hs_classification_overrides`, `import_restrictions` 테이블 CRUD admin UI 필요
   - 기존 `app/dashboard/admin/` 구조 재활용 가능한지 조사 필요

5. **Phase B 착수 시점**
   - 즉시 CW33-S1 시작 vs Phase 2 트래픽 유입 후 데이터 필요성 명확해지면 시작
   - 권장: **CW33-S1, S2 는 즉시 시작** (FTA+세금 테이블은 이미 드러난 사실이라 대기 무의미). S4 (sanctions) 는 첫 Enterprise 리드 시점에 맞춰 시작

---

## 검증 기준 (CW33 전체 완료 시)

- [ ] 27개 🔴/🟡 항목 전부 해결
- [ ] 신규 18개 Supabase 테이블 마이그레이션 완료
- [ ] `verify-cw32.mjs` 28/28 regression green
- [ ] 신규 `verify-cw33.mjs` (DB freshness + schema 검증) green
- [ ] `screening/screen.ts` SANCTION_ENTRIES 65 → 20,000+
- [ ] `deterministicOverride()` 제거, DB override table 사용
- [ ] `fta.ts mergeWithHardcoded()` 제거, DB-first only
- [ ] features-data.ts 설명문 전부 **진실이 됨** (특히 F023/F024 "19 global sources")
- [ ] 관리자 UI 에서 FTA/override/restriction CRUD 가능
- [ ] 4개 세션 문서 + CHANGELOG 갱신
- [ ] Notion Task Board CW33 에픽 닫힘
