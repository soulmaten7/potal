# POTAL Data Source Audit Report
**감사 일시**: 2026-04-16 KST
**감사자**: Claude Code (Opus)
**방법**: Supabase 실측 쿼리 + 코드베이스 grep + cron health_check_logs

---

## Executive Summary

- **총 소스 수**: 42개 (DB 테이블 + 외부 API + 정적 파일)
- **정상**: 28개
- **문제 (있는데 부실)**: 8개
- **갭 (필요한데 없음)**: 6개
- **즉시 조치 필요**: 3건

---

## Phase 2: 카테고리별 상세

### 2-A. Tariff & Duty Rates (관세율)

| 테이블 | Rows | 최신 갱신 | 상태 |
|--------|------|---------|------|
| `precomputed_landed_costs` | 117,600 | N/A (배치 생성) | ✅ |
| `macmap_ntlc_rates` | 874,302 | 시드 시점 | ✅ |
| `macmap_agr_rates` | 132,686,330 | 시드 시점 | ✅ |
| `macmap_min_rates` | 112,935,450 | 시드 시점 | ✅ |
| `us_additional_tariffs` | 235 | 시드 시점 | ✅ |
| `us_tariff_rate_quotas` | 372 | 시드 시점 | ✅ |
| `duty_rates_live` | **0** | — | ⚠️ 빈 테이블 |
| `live_duty_rate_cache` | — | — | ❌ 테이블 미존재 |

**Tariff API providers** (12 files):
- **Live API 연동 (7)**: USITC, UK Trade Tariff, EU TARIC, Canada CBSA, Japan Customs, Korea KCS, tariff-api-client (WTO/Dutify fallback)
- **정적/하드코딩 (4)**: ASEAN, Australia ABF, India CBIC, Turkey TGA
- **인덱스 (1)**: index.ts

**문제**:
- `duty_rates_live` 0 rows — cron `update-tariffs`는 green이지만 이 테이블에 안 쓰는 것으로 보임 (API 캐시는 런타임 메모리 또는 다른 경로)
- `live_duty_rate_cache` 테이블 미존재 — 코드에서 참조하지만 migration 누락 가능
- ASEAN/Australia/India/Turkey provider에 live URL 없음 → 정적 데이터만

### 2-B. Sanctions & Screening (제재)

| 테이블 | Rows | 상태 |
|--------|------|------|
| `sanctioned_entities` | 47,926 | ✅ (OFAC+BIS+EU+UK+UN) |
| `sanctions_entries` | 25,472 | ✅ |
| `sanctions_aliases` | 22,341 | ✅ |
| `sanctions_load_meta` | 1 (probe only) | ⚠️ 실제 로드 메타 없음 |
| `eccn_entries` | 658 | ✅ (BIS CCL) |

**Cron**: `sdn-sync` daily 05:00 UTC — health_check_logs에서 `auto_import_ofac_sdn=green` 확인.

**문제**: `sanctions_load_meta`에 실제 import 이력 없음 (probe row만). SDN auto-import는 동작하지만 메타 기록이 안 됨.

### 2-C. Free Trade Agreements (FTA)

| 테이블 | Rows | 상태 |
|--------|------|------|
| `fta_agreements` | 65 | ✅ |
| `fta_members` | 559 | ✅ |
| `fta_product_rules` | 2,209 | ✅ (USMCA/RCEP/CPTPP/EU-UK-TCA/KORUS) |
| `fta_rates_live` | **0** | ⚠️ 빈 테이블 |
| `fta_country_pairs` | — | ❌ 테이블 미존재 |

**Cron**: `fta-change-monitor` weekly 금 06:00 UTC — 변경 감지만, DB 자동 갱신 없음.

**문제**: `fta_rates_live` 0 rows — preferential rate DB 조회 경로가 빈 상태. 런타임에서 `roo-engine.ts`의 하드코딩 FTA_CONFIG 사용.

### 2-D. Exchange Rates (환율)

| 테이블 | Rows | 최신 | 상태 |
|--------|------|------|------|
| `exchange_rate_history` | 50 | 2026-04-16 00:30 UTC | ✅ |

**API**: ExchangeRate-API (primary) + Fawaz Ahmed CDN (fallback) + 하드코딩 fallback
**Cron**: `exchange-rate-sync` daily 00:30 UTC — ✅ 정상

### 2-E. VAT/GST & Tax (부가세)

| 테이블 | Rows | 상태 |
|--------|------|------|
| `vat_gst_rates` | 241 | ✅ |
| `eu_reduced_vat_rates` | 46 | ✅ |
| `us_state_sales_tax` | 51 | ✅ |
| `de_minimis_thresholds` | 241 | ✅ |
| `digital_services_tax` | 33 | ✅ |
| `sub_national_taxes` | 42 | ✅ |

**문제 없음**. 6개 테이블 전부 populated.

### 2-F. Trade Remedies (무역구제)

| 테이블 | Rows | 상태 |
|--------|------|------|
| `trade_remedies` | 590 | ✅ |
| `country_regulatory_notes` | 43 | ✅ (Federal Register cron) |

**Cron**: `trade-remedy-sync` weekly 월 06:30 UTC + `federal-register-monitor` daily 06:00 UTC

### 2-G. HS Classification (분류)

| 테이블 | Rows | 상태 |
|--------|------|------|
| `hs_codes` | 29,903 | ✅ |
| `hs_keywords` | 47,505 | ✅ |
| `hs_classification_cache` | 94 | ✅ (런타임 캐시) |
| `hs_classification_overrides` | 18 | ✅ |
| `hs_chapter_rules` | 91 | ✅ (CW36) |
| `customs_rulings` | 645,591 | ✅ (CW34-S3) |
| `jp_classification_rules` | 89 | ✅ (CW36) |
| `hs_code_mappings` | — | ❌ 테이블 미존재 |

**GRI classifier data**: 16 files (chapter-notes, subheading-notes, codified-rules 등)
**hs-database.ts**: 229 lines

### 2-H. Restrictions & Export Controls

| 테이블 | Rows | 상태 |
|--------|------|------|
| `restricted_items` | 161 | ✅ |
| `eccn_entries` | 658 | ✅ (CW37-S4) |

### 2-I. Regulatory Monitoring (cron)

| Cron | 주기 | 마지막 실행 | 상태 |
|------|------|-----------|------|
| `update-tariffs` | 매일 04:00 UTC | ~10h ago | ✅ green |
| `exchange-rate-sync` | 매일 00:30 UTC | ~14h ago | ✅ green |
| `sdn-sync` | 매일 05:00 UTC | ~9h ago | ✅ green |
| `federal-register-monitor` | 매일 06:00 UTC | ~8h ago | ✅ green |
| `taric-rss-monitor` | 매일 07:00 UTC | ~7h ago | ✅ green |
| `gov-api-health` | 12시간 | ~2h ago | ⚠️ yellow |
| `health-check` | 6시간 | ~2h ago | ✅ green |
| `trade-remedy-sync` | 주간 월 | — | ✅ |
| `tariff-change-monitor` | 주간 일 | — | ✅ |
| `fta-change-monitor` | 주간 금 | — | ✅ |
| `classification-ruling-monitor` | 주간 수 | — | ✅ green |
| `wco-news-monitor` | 월간 15일 | — | ✅ green |
| `rulings-update-monitor` | 주간 월 | — | ✅ |

**gov-api-health yellow**: 7개 정부 API 상태 체크에서 간헐적 yellow (타임아웃 또는 일시 불가). 실제 서비스 영향 없음 (fallback 작동).

### 2-J. Countries & Metadata

| 테이블 | Rows | 상태 |
|--------|------|------|
| `countries` | 241 | ✅ |
| `country_profiles` | 137 | ⚠️ 57% 커버리지 |

**문제**: 241개 국가 중 137개만 프로필 있음. 104개국 프로필 미완성.

---

## Phase 3: 갭 분석

### 테이블 1: 정상 동작 중인 소스 (28개)

| 소스 | 카테고리 | 갱신 주기 | 자동화 |
|------|---------|---------|--------|
| Exchange Rates (ExchangeRate-API) | Exchange Rate | 매일 | ✅ cron |
| OFAC SDN | Sanctions | 매일 | ✅ cron |
| Federal Register | Regulatory | 매일 | ✅ cron |
| EU TARIC RSS | Regulatory | 매일 | ✅ cron |
| MacMap NTLC (874K) | Tariff | 수동 시드 | ⚠️ 모니터만 |
| MacMap AGR (132M) | Tariff | 수동 시드 | ⚠️ 모니터만 |
| MacMap MIN (112M) | Tariff | 수동 시드 | ⚠️ 모니터만 |
| Precomputed costs (117K) | Tariff | 배치 | ✅ |
| US Additional Tariffs (235) | Tariff | 수동 시드 | ⚠️ |
| US TRQ (372) | Tariff | 수동 시드 | ⚠️ |
| VAT/GST rates (241) | Tax | 수동 시드 | ⚠️ |
| EU reduced VAT (46) | Tax | 수동 시드 | ⚠️ |
| US state sales tax (51) | Tax | 수동 시드 | ⚠️ |
| De minimis (241) | Tax | 수동 시드 | ⚠️ |
| FTA agreements (65) | FTA | 수동 시드 | ⚠️ 모니터만 |
| FTA product rules (2,209) | FTA | 수동 시드 | ⚠️ |
| Sanctioned entities (47,926) | Sanctions | 매일 | ✅ cron |
| ECCN entries (658) | Export Control | 수동 시드 | ⚠️ |
| HS codes (29,903) | Classification | 수동 시드 | ⚠️ |
| HS keywords (47,505) | Classification | 수동 시드 | ⚠️ |
| Customs rulings (645,591) | Classification | 주간 모니터 | ✅ cron |
| Trade remedies (590) | Trade Remedy | 주간 | ✅ cron |
| Regulatory notes (43) | Regulatory | 매일 | ✅ cron |
| Restricted items (161) | Restrictions | 수동 시드 | ⚠️ |
| Countries (241) | Metadata | 수동 시드 | ⚠️ |
| Chapter rules (91) | Classification | 수동 시드 | ⚠️ |
| JP classification (89) | Classification | 수동 시드 | ⚠️ |
| Digital services tax (33) | Tax | 수동 시드 | ⚠️ |

### 테이블 2: 문제 있는 소스 (8개)

| 소스 | 문제 | 원인 | 필요 조치 | 우선순위 |
|------|------|------|---------|---------|
| `duty_rates_live` | 0 rows | cron은 실행되지만 이 테이블에 미기록 | 캐시 경로 확인 + 미사용이면 제거 | P1 |
| `live_duty_rate_cache` | 테이블 미존재 | migration 누락 | 코드에서 참조 확인 → 불필요시 참조 제거 | P1 |
| `fta_rates_live` | 0 rows | preferential rate DB 미입력 | roo-engine FTA_CONFIG → DB 이전 | P2 |
| `fta_country_pairs` | 테이블 미존재 | migration에 없음 | 코드 참조 확인 → 불필요시 제거 | P2 |
| `hs_code_mappings` | 테이블 미존재 | migration에 있으나 데이터 없음 | WDC import 또는 참조 제거 | P3 |
| `sanctions_load_meta` | probe row만 | SDN import가 메타 미기록 | sdn-sync에 메타 기록 추가 | P2 |
| `country_profiles` | 137/241 (57%) | 104개국 프로필 미완성 | 누락 국가 프로필 시드 | P2 |
| Gov API health | 간헐적 yellow | 정부 사이트 응답 지연 | 타임아웃 조정 (비실질 이슈) | P3 |

### 테이블 3: 필요한데 없는 소스 (6개)

| 필요한 소스 | 이유 | 출처 | 권장 갱신 | 우선순위 |
|------------|------|------|---------|---------|
| Canada SEMA 제재 리스트 | CA 향 수출 시 필수 screening | Global Affairs Canada | 매월 | P2 |
| Australia DFAT 제재 리스트 | AU 향 수출 시 필수 screening | DFAT | 매월 | P2 |
| EU dual-use regulation (2021/821) | EU 수출 통제 판정에 필수 | EUR-Lex | 분기 | P2 |
| HS2022→HS2027 전환 매핑 | 2027년 HS 개정 대비 | WCO | 연 1회 (2026 발표) | P3 |
| 각국 customs broker 수수료 | landed cost 정확도 | 업계 데이터 | 연 1회 | P3 |
| 각국 공휴일/세관 운영일 | 배송 일정 예측 | 정부 공시 | 연 1회 | P3 |

---

## Phase 4: 갱신 주기 분류

### 실시간 / 매일 (자동 cron)
- Exchange Rates (ECB daily 00:30 UTC)
- OFAC SDN (daily 05:00 UTC, auto-import on change)
- Federal Register (daily 06:00 UTC)
- EU TARIC RSS (daily 07:00 UTC)
- Update Tariffs — 7개국 정부 API (daily 04:00 UTC)
- Spot Check (daily 04:00 UTC)

### 매주 (자동 모니터)
- FTA change monitor (금 06:00 UTC) — 감지만, DB 미갱신
- Trade remedy sync (월 06:30 UTC)
- Tariff change monitor (일 05:00 UTC) — 47개국 해시 비교
- Classification ruling monitor (수 06:00 UTC)
- API key monitor (월 07:00 UTC)
- Rulings update monitor (월 06:00 UTC)

### 매월 (자동 모니터)
- MacMap update monitor (1일 08:00 UTC)
- WCO news monitor (15일 08:00 UTC)

### 반기 (자동 모니터)
- US nexus threshold check (1/1 + 7/1)

### 수동 시드 (cron 없음)
- MacMap 3개 테이블 (874K + 132M + 112M) — Python bulk import
- FTA agreements/members/product rules — seed scripts
- VAT/GST/tax 6개 테이블 — seed scripts
- HS codes/keywords — seed scripts
- Customs rulings (645K) — warehouse pipeline
- ECCN entries (658) — CSV import
- Restricted items (161) — seed
- Country profiles (137) — seed

### 거의 안 바뀜
- WCO HS nomenclature (5년 주기, 다음 2027)
- Incoterms (10년 주기, 현재 2020)

---

## Phase 5: 권장 사항

### P0 — 즉시 조치 필요 (데이터 정확성 영향)

1. **`source-publications.json` ticker 갱신 연결** (2h)
   - 문제: LiveTicker가 3/14 이후 "STALE" 표시 — 실제 cron은 동작하지만 ticker JSON 미갱신
   - 조치: `update-tariffs` cron 완료 시 `source-publications.json` 타임스탬프 자동 갱신
   - 영향: 사용자 신뢰도 (데이터 신선도 표시)

2. **`duty_rates_live` / `live_duty_rate_cache` 경로 정리** (1h)
   - 문제: 0 rows / 테이블 미존재이지만 코드에서 참조
   - 조치: 코드 참조 확인 → 실제 캐시 경로 파악 → 미사용 테이블 참조 제거 또는 migration 추가
   - 영향: 불필요한 DB 조회 시도 → 성능

3. **`country_profiles` 104개국 누락 보완** (4h)
   - 문제: 241개 중 137개만 프로필 → 104개국에서 fallback 사용
   - 조치: 누락 국가 최소 필드 (currency, VAT rate, de minimis) 시드
   - 영향: 104개국 대상 계산 정확도

### P1 — 단기 개선 (1-2주)

4. **`sanctions_load_meta` 실제 기록** (1h) — SDN auto-import 시 메타 기록 추가
5. **`fta_rates_live` 시드** (4h) — roo-engine FTA_CONFIG 하드코딩 → DB 이전
6. **ASEAN/Australia/India/Turkey tariff provider live 연결** (8h) — 현재 정적 → 정부 API 또는 WTO API 연결

### P2 — 중기 개선 (로드맵)

7. **Canada SEMA + Australia DFAT 제재 리스트 추가** (4h)
8. **EU dual-use regulation import** (4h)
9. **MacMap 데이터 갱신 자동화** (8h) — 현재 수동 Python import

### P3 — 장기 고려

10. **HS2027 전환 매핑 준비** — WCO 발표 후 (2026 하반기)
11. **각국 broker 수수료 데이터** — 업계 조사 필요
12. **`hs_code_mappings` / `fta_country_pairs` 정리** — 미사용 테이블이면 코드 참조 제거
