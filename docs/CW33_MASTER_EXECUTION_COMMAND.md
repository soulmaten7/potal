# CW33 Master Execution Command — "No Fake, All Real"

**작성일**: 2026-04-11 KST
**대상 터미널**: Terminal1 (Opus, `cd ~/potal && claude --dangerously-skip-permissions`)
**선행 작업**:
- CW33 Phase A Hardcoding Audit (`docs/HARDCODING_AUDIT.md`, 커밋 `f59c18c`)
- CW33 Phase A-2 External Drive Inventory (`docs/EXTERNAL_DRIVE_CW33_INVENTORY.md`, 커밋 `815e590`)
- 외장하드: `/Volumes/soulmaten/POTAL/` (983GB, 연결됨)

**작업 기간**: 예상 20~24일 (P0 19건 + P1 8건 + Missing 3건 + Partial 4건 = **27건 전부**)

---

## 🎯 북극성 원칙 (Absolute — 모든 결정의 근거)

### 원칙 1: 데모용 가짜 하드코딩 0건
"데모에 예쁘게 보이려고 숫자 박아넣기" = **금지**.
CW32에서 했던 `mergeWithHardcoded`, `deterministicOverride` 같이 "일단 작동만 되게" 패턴은 CW33에서 **전부 제거**한다.

### 원칙 2: "데이터 코드화" 는 하드코딩이 아니다
**중요한 구분**:
- ❌ **나쁜 하드코딩**: `if (hs === '8506') return { duty: 5.2, dangerous: true }` — 추측/근사치/데모용
- ✅ **좋은 코드화**: `tlc_data/duty_rate/section_301_hts.csv` 를 `us_additional_tariffs` 테이블로 import 후 SQL 조회 — **실제 USITC 원본 데이터**를 keyword/code 로 구조화
- ✅ **좋은 코드화**: OFAC SDN XML → `sanctioned_entities` 테이블로 parse — **진짜 OFAC 데이터**를 DB에 저장
- ✅ **좋은 코드화**: v3 codified_subheadings.json (HS 분류 키워드 사전) 을 `hs_keywords` 테이블로 import — **CBP/EBTI 판례 기반 실제 키워드**

**즉**: 원본 데이터가 실제이면, 그걸 DB/JSON/코드에 넣어서 lookup 하는 건 **정답**. 원본 없이 감으로 숫자 박는 게 **죄**.

### 원칙 3: 우선순위 없음 — 전부 완료
P0 19건, P1 8건, Missing 3건, Stale 4건 = **27건 전부 완료해야 CW33 닫힘**. 시간 부족해도 하나 빼지 마라.

### 원칙 4: 데이터 누락 시 "수단 방법 가리지 말고 찾아와"
외장하드에 없고 공식 소스도 애매한 데이터 (특히 🔴 Missing 3건):
- **C-10 Brand origins 130+**
- **C-09 Insurance rate tables**
- **C-19 Shipping carrier rates**

→ 공식 정부/기관 사이트, 학술 논문, 업계 리포트, Wikipedia 레퍼런스, GitHub open-source dataset, API 무료 티어, 크롤링, 공개 Kaggle 데이터셋 등 **모든 합법적 수단** 동원해서 가져와라. **WebSearch + WebFetch 적극 활용**.

### 원칙 5: 재시도 5회 + 재검증
1번 시도에 안 찾아지면 검색어/소스 바꿔서 **최소 5번까지 반복**. 그래도 안 되면 **대체 근사 소스**라도 찾아서 가져오고 "이건 대체 소스, 원본 확보 필요" 라고 명시. 그 후 **샘플 row 5~10건 직접 검증** (웹 원본과 DB 값 대조).

---

## 📋 은태님 결정 5개 (확정)

| # | 질문 | 결정 |
|---|---|---|
| 1 | WDC 893GB 활용 | **CW33 밖 유지** (분류기 벤치마크, 무관) |
| 2 | v3 codified_subheadings 우선순위 | **우선순위 없음 — S3를 S1과 병렬 진행** |
| 3 | OFAC SDN 123MB parser | **streaming (sax-js)** 로 구현 |
| 4 | US Sales Tax 2026 수집 | **50주 DOR 자동 + 수동 혼합 scrape** — 자동 실패 시 수동 fallback, 재시도 5회까지 |
| 5 | Price break rules 추출 | **CW33-S2 내 parser 작성** (별도 sprint 없음) |

**추가 원칙**: 위 5개 외 다른 선택 필요할 때는 **항상 "실제 데이터 확보" 쪽**으로 결정. 속도보다 정확성.

---

## 🗂️ 작업 범위 (27건 전부)

### Phase B-1: P0 Critical 19건 (DB 이전)

| ID | 항목 | 데이터 소스 (외장하드) | 신규 Supabase 테이블 | 난이도 |
|---|---|---|---|---|
| P0.1 | FTA agreements 63개 | `tlc_data/rules_of_origin/` + `fta_psr_5_major.{csv,json}` + `de_minimis/fta_deminimis_thresholds.json` | `fta_agreements`, `fta_members`, `fta_product_rules` | L |
| P0.2 | Country data 240국 | `tlc_data/de_minimis/country_valuation_deminimis.csv` + `tlc_data/vat_gst/*` | `country_profiles`, `de_minimis_exceptions` | L |
| P0.3 | HS override rules | (코드) `ai-classifier-wrapper.ts:27-100` 의 regex → DB | `hs_classification_overrides` + admin UI | M |
| P0.4 | Import restrictions | `tlc_data/export_controls/` + 수입쪽 별도 수집 | `import_restrictions` | M |
| P0.5 | Section 301/232/IEEPA | `tlc_data/duty_rate/section_301_hts.csv` (+232, +ieepa) | `us_additional_tariffs` | M |
| P0.6 | US TRQ 372 entries | `tlc_data/duty_rate/us_trq_entries.json` | `us_tariff_rate_quotas` + daily cron | L |
| P0.7 | EU VAT 27국 감면세율 | `tlc_data/vat_gst/eu_27_vat_rates.csv` + `eu_remaining_14_vat_rates.json` | `eu_reduced_vat_rates` | M |
| P0.8 | EU 계절관세 13제품 | `tlc_data/duty_rate/eu_seasonal_tariffs.json` | `eu_seasonal_tariffs` | M |
| P0.9 | US State Sales Tax 50+DC | `regulations/us/sales_tax/us_state_sales_tax_2024.json` **→ 2026 재수집 필수** | `us_state_sales_tax` | M |
| P0.10 | Price break rules | `regulations/us/htsus/hts_2026_rev4.json` parser 작성 | `price_break_rules` | M |
| P0.11 | HS Database (v3 engine) | `tlc_data/hs_classification_rules/codified_subheadings.json` + `codified_headings.json` + `hs_national_rules/` + `hts_2026_rev4.json` | `hs_codes`, `hs_keywords`, `hs_heading_rules`, `hs_subheading_rules` | **M** (외장하드 자산 덕분에 XL→M) |
| P0.12 | Brand origins 130+ | **외장하드 없음 → 수집** | `brand_origins`, `marketplace_origins` | M |
| P0.13 | IOSS/OSS €150 threshold | `regulations/eu/vat/vat_directive_2006_112.html` parser | `eu_vat_regimes` | S |
| P0.14 | OFAC SDN sync | `regulations/us/ofac_sanctions/sdn_advanced.xml` (123MB) — sax-js streaming parser | `sanctioned_entities` | L |
| P0.15 | BIS Entity List | `tlc_data/export_controls/bis_entity_list.json` + `entity_list.csv` | 동일 테이블 | M |
| P0.16 | EU + UK + UN sanctions | `tlc_data/sanctions/eu_sanctions_list.xml` (24MB) + `uk_ofsi_sanctions.csv` (16MB) + `un_sanctions_consolidated.xml` (2MB) | 동일 테이블 | M |
| P0.17 | Screening normalization | 기존 `screen.ts` 확장 | (로직) | M |
| P0.18 | Exchange rate 소스 확장 | Frankfurter (ECB 무료) + `tlc_data/currency/ecb_historical_rates.xml` seed | `exchange_rate_cache` + daily cron | M |
| P0.19 | AD/CVD Trade Remedy | `tlc_data/ad_cvd/ita_adcvd_cases_2000_current.json` + `adcvd_scope_rulings.*` + `ita_sunset_continuations.json` | `trade_remedies` | S |

### Phase B-2: P1 Important 8건 (외부 API)

| ID | 항목 | 소스 | 조치 |
|---|---|---|---|
| P1.1 | Insurance rate tables | **외장하드 없음 → 수집** (Lloyd's / AIG / 공개 리포트) | `insurance_rate_tables` + external fallback |
| P1.2 | VAT registration live check | VIES (EU) + HMRC (UK) API | API 통합 |
| P1.3 | Image classification | Claude Vision fallback chain | 로직 추가 |
| P1.4 | Shipping carrier rates | **DHL + FedEx + UPS API** (필요 시 무료 티어 + 크롤링) | `carrier_rate_cache` |
| P1.5 | OCR | AWS Textract 또는 Google Vision | 통합 |
| P1.6 | Checkout fraud | Stripe Radar | webhook |
| P1.7 | AI chatbot | Crisp + RAG | 통합 |
| P1.8 | Uptime monitoring | 외부 (UptimeRobot/Pingdom) | 외부 |

### Phase B-3: Stale 4건 (업데이트)

| ID | 항목 | 조치 |
|---|---|---|
| S-01 | US Sales Tax 2024 → 2026 | 50주 DOR + DC scrape, 재시도 5회, 수동 fallback |
| S-02 | HTSUS price break rules 추출 | HTSUS 2026 parser (P0.10 에서 처리) |
| S-03 | IOSS €150 threshold HTML 추출 | Directive 2006/112 parser (P0.13 에서 처리) |
| S-04 | Import restrictions 수입쪽 보완 | REACH/RoHS/PSE/K-REACH 별도 수집 (P0.4 에서 처리) |

### Phase B-4: Missing 3건 (새로 수집 — "수단 방법 가리지 마라")

| ID | 항목 | 수집 전략 (재시도 5회 프로토콜) |
|---|---|---|
| M-01 | Brand origins 130+ (C-10) | ① GS1 company prefix DB ② Wikipedia infobox brand→country crawl ③ OpenCorporates API ④ 공개 Kaggle 데이터셋 ⑤ 기존 `brand-origins.ts` + 확장 |
| M-02 | Insurance rate tables (C-09) | ① Lloyd's market reports ② IUMI (International Union of Marine Insurance) 공개 stats ③ CIF/FOB country risk 무료 학술 ④ 공개 reinsurance 리포트 ⑤ 업계 평균치 테이블 (대체 fallback) |
| M-03 | Shipping carrier rates (C-19) | ① DHL Express API (무료 티어) ② FedEx Rate API ③ UPS Rating API ④ EasyPost aggregator ⑤ 공개 rate sheet PDF 크롤링 |

---

## 🔄 재시도 5회 프로토콜 (데이터 수집 실패 시 필수)

모든 데이터 수집 작업은 **최대 5번까지 시도**. 각 시도마다:

```
시도 1: 가장 공식적인 소스 (정부/기관 API)
  ↓ 실패 시
시도 2: 두 번째 공식 소스 (정부 웹사이트 scrape)
  ↓ 실패 시
시도 3: 신뢰 가능한 3rd party (Reuters/Bloomberg/학술)
  ↓ 실패 시
시도 4: 오픈소스 데이터셋 (GitHub/Kaggle/HuggingFace)
  ↓ 실패 시
시도 5: 대체 근사 소스 + "대체임" 플래그
  ↓ 5회 전부 실패 시
→ docs/CW33_DATA_COLLECTION_FAILURES.md 에 기록 + 은태님에게 보고 (절대 포기 금지, 대체 수집 방법 질문)
```

**각 시도 후 샘플 검증 필수**: 받아온 데이터 5~10 row 를 **원본 (웹/PDF/공식 문서) 과 직접 대조**. 값 하나라도 틀리면 → 해당 시도는 실패로 간주.

---

## 📝 작업 순서 (순차 — 의존성 있음)

### Sprint 1: Foundation (P0.1, P0.2, P0.3, P0.4) — 4-5일
1. Supabase 마이그레이션 스크립트 작성 (신규 테이블 18개 전부)
2. `tlc_data/rules_of_origin/` → `fta_agreements/members/product_rules` seed
3. `tlc_data/de_minimis/` + `vat_gst/` → `country_profiles` + `de_minimis_exceptions` seed
4. `ai-classifier-wrapper.ts` 의 deterministicOverride regex → `hs_classification_overrides` seed
5. Admin UI 기초: FTA/override CRUD (기존 `app/dashboard/admin/` 재활용)
6. `fta.ts mergeWithHardcoded()` **제거** → DB-first only

### Sprint 2: US/EU Tax Tables (P0.5 ~ P0.10) — 5-6일
7. Section 301/232/IEEPA CSV → `us_additional_tariffs`
8. US TRQ JSON → `us_tariff_rate_quotas` + daily USDA cron
9. EU VAT 27국 → `eu_reduced_vat_rates`
10. EU seasonal → `eu_seasonal_tariffs`
11. US State Sales Tax — **2026 재수집 (재시도 5회 프로토콜 적용)** → `us_state_sales_tax`
12. HTSUS 2026 parser → `price_break_rules` 추출

### Sprint 3: Classifier + HS DB (P0.11 ~ P0.13) — 3-4일 (S1과 병렬)
13. v3 codified_subheadings.json + codified_headings.json → `hs_codes` + `hs_keywords`
14. hs_national_rules/ 7개국 → `hs_national_tariff_rules`
15. hts_2026_rev4.json → `hs_codes.us_duty_rate` 컬럼
16. Brand origins 130+ 수집 (재시도 5회 프로토콜) → `brand_origins`
17. EU VAT directive HTML → `eu_vat_regimes` (IOSS/OSS)

### Sprint 4: Sanctions (P0.14 ~ P0.17) — 5-6일
18. sax-js streaming parser 작성 (OFAC SDN 123MB XML)
19. OFAC → `sanctioned_entities` (예상 ~15,000 rows)
20. BIS Entity List → 동일 테이블
21. EU consolidated + UK HMT + UN → 동일 테이블 (예상 ~20,000 rows 합계)
22. `screening/screen.ts` DB-first 경로 + normalization 로직 확장
23. 일일 Vercel cron: 모든 sanctions feed re-sync
24. features-data.ts "19 global sources" 설명문 **진실로 만듦**

### Sprint 5: Currency + Trade Remedy (P0.18, P0.19) — 3일
25. Frankfurter API 통합 + ECB historical XML seed
26. `exchange_rate_cache` + daily cron
27. AD/CVD JSON → `trade_remedies`

### Sprint 6: P1 External APIs (P1.1 ~ P1.8) — 8일
28. Insurance rate tables 수집 (재시도 5회) → `insurance_rate_tables`
29. VIES + HMRC VAT registration live check
30. Claude Vision image classification fallback
31. Shipping carrier rates 수집 (재시도 5회) → `carrier_rate_cache`
32. AWS Textract OCR 통합
33. Stripe Radar webhook
34. Crisp + RAG chatbot
35. UptimeRobot 외부 모니터링

---

## ✅ 재검증 단계 (모든 Sprint 완료 후 필수)

### Step 1: 샘플 검증 (Sprint 마다)
각 Sprint 끝에 새로 seed 된 데이터 5~10 row를 원본과 대조.
- 예: `us_additional_tariffs` 에 들어간 HS 9903.88.01 의 추가관세율이 USITC 공식 HTSUS 원문과 일치하는가?
- 불일치 1건이라도 있으면 → 해당 seed 스크립트 재작성

### Step 2: regression (`verify-cw32.mjs` 28/28 green 유지)
CW32 회귀 테스트가 여전히 전부 통과하는가? 하나라도 깨지면 → 원인 찾아 수정.

### Step 3: 신규 `verify-cw33.mjs` (최소 50 케이스)
- FTA preferential rate (KORUS/USMCA/RCEP/CPTPP/EU-UK TCA/KCFTA/UK-KR) 각 3케이스
- Section 301/232/IEEPA 5케이스
- TRQ in-quota/over-quota 5케이스
- EU reduced VAT chapter-level 5케이스
- US State sales tax 5개 주 검증
- HS 분류 (v3 codified) 10케이스
- Sanctions hit 5케이스 (실제 SDN 이름으로)
- Exchange rate daily/historical 2케이스
- AD/CVD 5케이스

### Step 4: features-data.ts 140개 설명문 진실 검증
각 기능 설명의 숫자/출처가 실제 DB 상태와 일치하는가?
- "19 global sources" → `sanctioned_entities.source` distinct count ≥ 19 인가?
- "5,000+ HS codes" → `hs_codes.count()` ≥ 5,000 인가?
- "50 states + DC" → `us_state_sales_tax.count()` = 51 인가?

### Step 5: Cowork 프로덕션 검증 (Chrome MCP)
모든 Sprint 완료 후, Cowork 에서 Chrome MCP 로 6개 시나리오 전부 재검증.
- CW32 때 했던 동일 시나리오 (seller/d2c/importer/exporter/forwarder/custom)
- 결과값이 CW32 때와 **의미 있게 달라졌는지** 확인 (더 정확한 실제 데이터로 교체됐는지)

### Step 6: 보고서 작성
`docs/CW33_COMPLETION_REPORT.md`:
- 27건 각 항목 전/후 비교
- 신규 테이블 row count
- verify-cw33 결과
- 재시도 5회 프로토콜 통계 (몇 건이 1번에 성공, 몇 건이 5번까지 필요했는가)
- Missing 수집 성공/실패
- 남은 이슈 (있다면)

---

## 🚫 절대 금지

1. **"데모용 하드코딩" 금지** — CW32 mergeWithHardcoded 같은 폴백 경로 전부 제거
2. **"일단 값만 넣기" 금지** — 모든 데이터는 **원본 소스 인용** 필수 (table/row level source URL 또는 `source_citation` 컬럼)
3. **"재시도 1번에 포기" 금지** — 5회 프로토콜 무조건 준수
4. **"대체 근사값" 을 실제값인 척 저장 금지** — `data_confidence` 컬럼으로 명시 (`official` / `secondary` / `approximation`)
5. **우선순위 스킵 금지** — 27건 전부 완료
6. **verify-cw32.mjs 깨뜨리기 금지** — 회귀 방지
7. **B2C 코드 건드리기 금지** (절대 규칙 1번)
8. **Notion Task Board 업데이트 생략 금지** — 각 Sprint 완료 시 Cowork에서 기록
9. **features-data.ts 설명문 거짓 유지 금지** — CW33 완료 시 140개 설명이 전부 진실이어야 함
10. **외장하드 파일 수정/복사/삭제 금지** — 읽기 전용, 새 파일은 전부 `potal/data/cw33-imports/` 에 저장

---

## 📋 세션 문서 업데이트 (각 Sprint 완료 시)

1. `CLAUDE.md` 헤더 — 날짜 + 진행 상황
2. `docs/CHANGELOG.md` — CW33-S# 섹션
3. `session-context.md` — TODO 업데이트
4. `docs/NEXT_SESSION_START.md` — 다음 Sprint 인계
5. 커밋: `CW33-S# feat: [작업 요약]`

각 Sprint 완료 시 `npm run build` + `verify-cw32.mjs` + (생성 중인) `verify-cw33.mjs` 전부 green 확인 후 push.

---

## 💬 은태님 컨텍스트 (최종 지시)

CW32 까지는 "데모가 예쁘게 보이게" 였다. CW33 은 다르다:
- **가짜 하드코딩 0건** — 데이터 없는 건 만들어서 넣지 마라
- **진짜 데이터 코드화 OK** — 실제 원본을 DB/JSON 에 넣는 건 정답
- **우선순위 없음** — 27건 전부
- **수단 방법 가리지 마라** — Missing 은 반드시 찾아와
- **재시도 5회 후 재검증** — 1번에 안 되면 5번까지, 그 후 샘플 검증

이 지시는 "Enterprise 고객에게 API 팔기 전" 필수 단계다. 하나라도 하드코딩 남기고 "CW33 완료" 하면, 그건 거짓 완료다. 완벽하게 끝내라.

---

## 🎯 완료 기준 (CW33 전체 닫힘 조건)

- [ ] 27건 전부 DB 이전 또는 외부 API 통합 완료
- [ ] 신규 Supabase 테이블 18+ 생성 + 마이그레이션 green
- [ ] 모든 테이블에 `source_citation`, `data_confidence`, `last_verified_at` 컬럼 포함
- [ ] `verify-cw32.mjs` 28/28 green (회귀 없음)
- [ ] `verify-cw33.mjs` 50+ 케이스 green (신규 검증)
- [ ] `fta.ts mergeWithHardcoded()` **제거** 완료
- [ ] `ai-classifier-wrapper.ts deterministicOverride()` **DB 기반으로 재작성** (코드 regex 제거)
- [ ] `screening/screen.ts` DB-first only (SANCTION_ENTRIES 상수 제거)
- [ ] features-data.ts 140개 설명문 전부 진실
- [ ] `docs/CW33_COMPLETION_REPORT.md` 작성
- [ ] 4개 세션 문서 + CHANGELOG 갱신
- [ ] Notion Task Board CW33 에픽 Done
- [ ] Cowork Chrome MCP 6개 시나리오 최종 검증 green
- [ ] 재시도 5회 프로토콜 통계 보고 포함
- [ ] Missing 3건 (brand origins / insurance / shipping) 수집 완료 또는 `CW33_DATA_COLLECTION_FAILURES.md` 에 명시 + 대안 제시

---

**시작 명령**: Terminal1 Opus 에서 이 문서 전체 읽고 Sprint 1 부터 순차 진행. 각 Sprint 완료 시 세션 문서 + Notion 업데이트 후 다음 Sprint 로. 막히면 재시도 5회 프로토콜 준수. 하드코딩 유혹 들면 원칙 1/2 재독.
