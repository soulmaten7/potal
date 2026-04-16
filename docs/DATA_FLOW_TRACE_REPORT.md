# POTAL Data Flow Trace Report
**추적 일시**: 2026-04-17 KST
**추적자**: Claude Code (Opus)
**방법**: 코드 실제 읽기 + 함수 호출 체인 추적 + grep 전수 조사

---

## 1. Landed Cost 계산 흐름

### 엔트리 포인트
`app/api/v1/calculate/route.ts` L96 → `calculateGlobalLandedCostAsync(costInput)` → `GlobalCostEngine.ts` `calculateWithProfileAsync()`

### 데이터 흐름도 (Duty Rate 4-stage Waterfall)

```
POST /api/v1/calculate
  │
  ▼
Stage 0: Precomputed Cache
  │ db/precomputed-cache.ts:83 → SELECT from precomputed_landed_costs (117,600 rows)
  │ Hit → return (dutyRateSource = "precomputed_mfn/agr/min")
  │ Miss ▼
  │
Stage 1: MacMap 3-Table Parallel
  │ macmap-lookup.ts → 3 parallel queries:
  │   ├─ macmap_agr_rates (132M rows) — FTA agreement rates
  │   ├─ macmap_min_rates (112M rows) — minimum across all agreements
  │   └─ macmap_ntlc_rates (874K rows) — MFN general tariff
  │ + macmap_trade_agreements (agreement name resolution)
  │ Returns lowest rate across 3 tables
  │ Hit → return (dutyRateSource = "agr/min/ntlc/mfn")
  │ Miss ▼
  │
Stage 2: Government API (with duty_rates_live cache)
  │ tariff-api-client.ts:300 fetchDutyRateWithFallback()
  │   ├─ 2a: SELECT from duty_rates_live (cache read) ← 0 ROWS (빈 테이블)
  │   └─ 2b: Country-specific API call:
  │       US→USITC | GB→UK Trade Tariff | EU→TARIC XI
  │       CA→CBSA | AU→ABF | JP→Customs | KR→KCS
  │       Others→WTO API or Dutify API
  │   → UPSERT result into duty_rates_live (cache write)
  │ Hit → return (dutyRateSource = "live_db/external_api")
  │ Miss ▼
  │
Stage 3: Static duty_rates DB
  │ db/tariff-cache.ts:141 → duty_rates + additional_tariffs
  │ 5-minute in-memory cache (lazy init)
  │ Hit → return (dutyRateSource = "db")
  │ Miss ▼
  │
Stage 4: Hardcoded Fallback
  │ profile.avgDutyRate from country_profiles
  │ dutyRateSource = "hardcoded", confidence = 0.7
```

### FTA Rate Lookup (duty waterfall 이후)

```
GlobalCostEngine.ts L572-598:

Path A: getFtaRateFromLiveDb() → SELECT from fta_rates_live
  │ ← 항상 null (테이블 0 rows, INSERT 경로 없음)
  ▼
Path B: applyFtaRateFromDb() → getFtaAgreements()
  │ → SELECT from fta_agreements (65 rows) + fta_members (559 rows)
  │ 메모리 내 join → preferentialMultiplier 적용
  │ Fallback: hardcoded findApplicableFta() in hs-code/fta.ts
```

### 기타 데이터 소스

| 데이터 | 소스 | 테이블/API |
|--------|------|-----------|
| Trade Remedies | `trade-remedy-lookup.ts` | `trade_remedy_products` + `trade_remedy_cases` + `trade_remedy_duties` + `safeguard_exemptions` |
| Exchange Rate | `exchange-rate-service.ts` | ExchangeRate-API (live) → Fawaz CDN (fallback) → 하드코딩. **15분 in-memory cache. Supabase 미사용** |
| VAT/GST | `country-data-db.ts` | `country_profiles` → `vat_rate` 필드 |
| De minimis | `country-data-db.ts` | `de_minimis_thresholds` (241 rows) |
| Ruling Match | `rulings/lookup.ts` | `customs_rulings` (645K rows) |

---

## 2. HS Classification 흐름

### 엔트리 포인트
`app/api/v1/classify/route.ts` → `classifyProductAsync()` in `ai-classifier-wrapper.ts`

### 데이터 흐름도

```
POST /api/v1/classify
  │
  ▼
Step 1: Deterministic Override
  │ ai-classifier-wrapper.ts:263 → SELECT from hs_classification_overrides (18 rows)
  │ Hit → return (source = "override")
  │ Miss ▼
  │
Step 2: DB Cache
  │ → SELECT from hs_classification_cache (94 rows)
  │ Hit → return (source = "cache")
  │ Miss ▼
  │
Step 3: Vector Search (pgvector)
  │ → SELECT from regulation_vectors (cosine similarity)
  │ Hit (similarity ≥ threshold) → return (source = "vector")
  │ Miss ▼
  │
Step 4: Keyword Engine
  │ → SELECT from hs_codes (29,903) + hs_keywords (47,505)
  │ voting engine + decision tree evaluation
  │ → Chapter tree validation (hs_chapter_rules, 91 rows)
  │ Hit → return (source = "keyword")
  │ Miss ▼
  │
Step 5: AI (Anthropic/OpenAI)
  │ → https://api.anthropic.com/v1/messages (primary)
  │ → https://api.openai.com/v1/chat/completions (fallback)
  │ → UPSERT result into hs_classification_cache
  │ Hit → return (source = "ai")
  │ Miss ▼
  │
Step 6: Keyword Fallback
  │ → return best keyword match (source = "keyword_fallback")
```

---

## 3. Sanctions Screening 흐름

### 엔트리 포인트
`app/api/v1/screening/route.ts` → `screenParty()` from `cost-engine/screening/`

### 데이터 흐름도

```
POST /api/v1/screening (or /screen-parties)
  │
  ▼
screenParty() / screenPartyDb()
  │ → SELECT from sanctioned_entities (47,926 rows)
  │   WHERE name ILIKE '%query%' OR aliases contain query
  │   fuzzy matching via pg_trgm similarity()
  │ → Returns matches with matchScore (0-1)
  │
  ▼
checkEmbargo()
  │ → SELECT from embargo_programs (country-level embargoes)
```

**사용 테이블**: `sanctioned_entities` (primary, 47,926 rows)
**미사용**: `sanctions_entries` (25,472 rows) — 별도 경로, `screenParty`에서 직접 참조 안 함

---

## 4. FTA Lookup 흐름

### 엔트리 포인트
`app/api/v1/roo/evaluate/route.ts` → `evaluateRoOEnriched()` from `trade/roo-engine.ts`

### 데이터 흐름도

```
POST /api/v1/roo/evaluate
  │
  ▼
evaluateRoO()
  │ → FTA_CONFIG 하드코딩 (roo-engine.ts L59-115)
  │   USMCA / KORUS / CPTPP / RCEP / EU-KR / EFTA
  │   각 FTA: defaultRvc, chapterRvc, members[], cumulationType
  │ → findApplicableFta(origin, destination, ftaId)
  │ → getRvcThreshold(config, chapter) → chapter-specific RVC %
  │ → WO / PE / RVC / CTH / CC / CTSH 기준 평가
  │
  ▼ (enrichment — evaluateRoOEnriched)
  │
  ├─ lookupRulings() → customs_rulings (645K)
  ├─ lookupJpGuidance() → jp_classification_rules (89) [JP only]
  ├─ evaluateChapterTree() → hs_chapter_rules (91) [local JSON]
  └─ checkDataAvailability() → 정적 COVERED_JURISDICTIONS set
```

**핵심 발견**: RoO 엔진은 `fta_agreements` DB를 직접 쿼리하지 않음. `FTA_CONFIG` 하드코딩 사용. DB의 `fta_agreements` (65 rows)와 `fta_product_rules` (2,209 rows)는 cost engine의 FTA rate lookup에서만 사용.

---

## 5. update-tariffs Cron 흐름

### 엔트리 포인트
`app/api/v1/admin/update-tariffs/route.ts` → `runTariffUpdate()` from `updater/tariff-updater.ts`

### 데이터 흐름도

```
Cron: 0 4 * * * (daily 04:00 UTC)
  │
  ▼
runTariffUpdate()
  │ 7개 정부 API 순차 호출:
  │   US → USITC HTS API
  │   GB → UK Trade Tariff API
  │   EU → EU TARIC API (DE representative)
  │   CA → Canada CBSA
  │   AU → Australia ABF
  │   JP → Japan Customs
  │   KR → Korea KCS
  │
  ▼
upsertDutyRate() — tariff-updater.ts:78
  │ → POST to live_duty_rate_cache (via Supabase REST API)
  │ ← 이 테이블은 엔진에서 읽히지 않음!
  │
  ▼
health_check_logs에 결과 기록
```

**핵심 발견**: Cron은 `live_duty_rate_cache`에 씀 → 엔진은 `duty_rates_live`에서 읽음 → **완전 단절**

---

## 6. 유령 테이블 분석 결과

| 테이블 | 참조 파일 수 | 프로덕션 도달 | 현재 상태 | 영향 | 권장 조치 |
|--------|------------|-------------|---------|------|---------|
| `duty_rates_live` | 7곳 (tariff-api-client.ts) | **✅ 매 calculate 호출** | 0 rows | Stage 2 항상 miss → Stage 3 fallback | **P0: 테이블 존재하면 cron 연결, 없으면 생성** |
| `live_duty_rate_cache` | 1곳 (tariff-updater.ts) | **✅ 매일 cron** | 테이블 미존재 | Cron 결과 버려짐 | **P0: duty_rates_live 와 통합** |
| `fta_rates_live` | 3곳 (tariff-api-client.ts) | **✅ 매 calculate 호출** | 0 rows, INSERT 경로 없음 | 매번 null → fallback | **P1: 호출 제거 (dead code) 또는 population 구현** |
| `fta_country_pairs` | 2곳 (scripts/cw33-*.mjs) | ❌ 스크립트만 | 미존재 | 없음 | 스크립트에서 참조 제거 |
| `hs_code_mappings` | 0곳 | ❌ | 미존재 | 없음 | 무시 (코드에 없음) |

### 핵심 발견: Cron↔Engine 단절 문제

```
                    ┌─────────────────┐
  update-tariffs    │ live_duty_rate  │     ← Cron이 여기에 씀
  (daily cron)  ──▶ │ _cache          │     ← 테이블 미존재!
                    └─────────────────┘

                    ┌─────────────────┐
  GlobalCostEngine  │ duty_rates      │     ← 엔진이 여기서 읽음
  (calculate API)◀──│ _live           │     ← 0 rows!
                    └─────────────────┘

  → 두 테이블 완전 단절. Cron 결과가 엔진에 도달하지 않음.
```

**수정 방법**: `tariff-updater.ts:78`의 테이블명을 `live_duty_rate_cache` → `duty_rates_live`로 변경하고, `duty_rates_live` 테이블이 존재하는지 확인 (존재하면 스키마 일치 확인, 미존재하면 migration 추가).

---

## 7. 최종 데이터 흐름 요약도

### 사용자 API 호출 경로

```
POST /api/v1/calculate
  ├─ HS Classification: overrides(18) → cache(94) → vectors → keywords(47K) → AI
  ├─ Duty Rate: precomputed(117K) → MacMap(245M) → [duty_rates_live(0)→Gov API] → static DB → hardcoded
  ├─ FTA: [fta_rates_live(0)→null] → fta_agreements(65)+fta_members(559) → hardcoded
  ├─ Trade Remedy: trade_remedy_products + cases + duties
  ├─ Exchange Rate: ExchangeRate-API → Fawaz CDN → hardcoded (in-memory 15min cache)
  ├─ VAT: country_profiles → vat_rate
  ├─ De minimis: de_minimis_thresholds(241)
  ├─ Ruling: customs_rulings(645K)
  └─ Restrictions: restricted_items(161)
```

### Cron 갱신 경로

```
Daily crons:
  exchange-rate-sync → exchange_rate_history (✅ 정상)
  sdn-sync → sanctioned_entities (✅ 정상)
  update-tariffs → live_duty_rate_cache (❌ 단절 — 엔진 미연결)
  federal-register-monitor → country_regulatory_notes (✅ 정상)

Weekly crons:
  fta-change-monitor → 감지만, DB 미갱신
  trade-remedy-sync → trade_remedies 행 수 체크만
  rulings-update-monitor → 감지만, 수동 refresh 필요

Monthly crons:
  macmap-update-monitor → 감지만, 수동 Python import 필요
```

### 데이터 규모 요약

| 카테고리 | 총 Rows | 핵심 테이블 |
|---------|---------|-----------|
| **MacMap 관세율** | 245,496,084 | agr(132M) + min(112M) + ntlc(874K) |
| **Customs Rulings** | 645,591 | customs_rulings |
| **Precomputed Cache** | 117,600 | precomputed_landed_costs |
| **HS Classification** | 77,520 | hs_codes(29K) + hs_keywords(47K) |
| **Sanctions** | 47,926 | sanctioned_entities |
| **FTA Rules** | 2,833 | agreements(65) + members(559) + product_rules(2,209) |
| **Tax** | 654 | vat(241) + eu_reduced(46) + us_state(51) + de_minimis(241) + dst(33) + sub(42) |
| **Trade Remedies** | 633 | trade_remedies(590) + reg_notes(43) |
| **ECCN** | 658 | eccn_entries |
| **Restrictions** | 161 | restricted_items |
| **Countries** | 378 | countries(241) + profiles(137) |
| **총계** | **~246.4M rows** | |
