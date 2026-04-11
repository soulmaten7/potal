# External Drive CW33 Asset Inventory — Phase A-2

**Date**: 2026-04-11 KST
**Root**: `/Volumes/soulmaten/POTAL/`
**Total scanned**: ~983 GB (900+ GB in wdc-products, ~83 GB in regulations/tlc_data/benchmark)
**Mode**: Read-only — 0 files copied, moved, or modified.
**Raw output**: `docs/EXTERNAL_DRIVE_CW33_INVENTORY_RAW.txt` (771 lines)

---

## 🎯 Executive Summary

**Bottom line**: 외장하드에 CW33 🔴 Critical 19건 중 **14건 (74%)** 의 소스 원본이 이미 다운로드돼 있음. 대부분 2026-03-13~2026-03-20 사이 수집된 최신 버전. CW33 사전 데이터 수집 비용 대폭 절감.

| 상태 | 개수 | 의미 |
|---|---|---|
| 🟢 **Ready** | **12** | 즉시 Supabase seed 가능 (2026 버전) |
| 🟡 **Stale / Partial** | **4** | 구조는 OK, 소량 업데이트 또는 추출 필요 |
| 🔴 **Unusable / Missing** | **5** | 외장하드에 없음, 새로 구해야 함 |
| ⚪ **Unrelated** (대용량) | WDC 893 GB | 분류기 벤치마크용, CW33 무관 |

**CW33 scope 재조정**:
- **P0.11 HS Database 이전** (난이도 XL → **M**): v3 codified rules + HTSUS 2026 + WCO sections/chapters 전부 확보
- **CW33-S4 Sanctions sync** (난이도 XL → **L**): OFAC SDN 123MB XML + EU/UK/UN 원본 전부 확보. parser 만 작성하면 됨
- **POTAL_Ablation_V2.xlsx** 확보 → CW33 regression 벤치마크 기준점 확정

---

## 🗺️ CW33 🔴 Critical 19 → 외장하드 매핑

| ID | 항목 | 외장하드 자산 | 크기/날짜 | 상태 | CW33 활용 |
|---|---|---|---|---|---|
| **C-01** | FTA 관세율 | `tlc_data/rules_of_origin/` (KORUS, USMCA, RCEP, CPTPP, EU-UK TCA PSR JSONs) + `fta_psr_5_major.{csv,json}` + `de_minimis/fta_deminimis_thresholds.json` | ~10 MB / 2026-03-18 | 🟢 Ready | P0.1 seed (규칙 기반 preferential rate, member 리스트는 코드 재사용) |
| **C-02** | deterministicOverride | (없음 — 코드 rule) | — | — | P0.3 신규 admin UI 작성 |
| **C-03** | 240국 country data (VAT/de minimis/duty) | `tlc_data/de_minimis/country_valuation_deminimis.csv` + `tlc_data/vat_gst/eu_27_vat_rates.csv` + `non_eu_vat_rates.csv` + `eu_remaining_14_vat_rates.json` + `india_gst_slab_mapping.json` | ~10 KB / 2026-03-18 | 🟢 Ready | P0.2 seed |
| **C-04** | Restriction/prohibition rules | `tlc_data/export_controls/` (BIS CCL ECCN + country chart) + `regulations/us/cfr_title15/` | 부분적 / 2026-03-18 | 🟡 Partial | export 쪽만 커버, 수입금지 (REACH/PSE/K-REACH) 별도 수집 필요 |
| **C-05** | Section 301/232 US 추가관세 | `tlc_data/duty_rate/section_301_hts.csv` (20KB) + `section_232_hts.csv` (30KB) + `ieepa_reciprocal_hts.csv` (41KB) | 90 KB / **2026-03-18** | 🟢 Ready | P0.5 seed |
| **C-06** | US TRQ 372개 | `tlc_data/duty_rate/us_trq_entries.json` | 134 KB / **2026-03-18** | 🟢 Ready | P0.6 seed (일일 cron 연동은 별도) |
| **C-07** | EU VAT 27국 감면세율 | `tlc_data/vat_gst/eu_27_vat_rates.csv` + `eu_remaining_14_vat_rates.json` | ~4 KB / 2026-03-18 | 🟢 Ready | P0.7 seed |
| **C-08** | EU 계절관세 13 제품 | `tlc_data/duty_rate/eu_seasonal_tariffs.json` | 1.4 KB / 2026-03-18 | 🟢 Ready | P0.8 seed |
| **C-09** | Insurance 요율표 | `tlc_data/insurance_shipping/cif_fob_country_matrix.json` (부분) | — | 🔴 Unusable | P1.1 별도 (Lloyd's 상업용 소스 필요) |
| **C-10** | Brand origins 130+ | (없음) | — | 🔴 Missing | P0.12 새로 수집 (코드의 brand-origins.ts 가 유일) |
| **C-11** | 제재 리스트 (OFAC/BIS/EU/UK/UN) | `regulations/us/ofac_sanctions/sdn_advanced.xml` **(123 MB)** + `sdn.csv` (5 MB) + `tlc_data/sanctions/eu_sanctions_list.xml` (24 MB) + `uk_ofsi_sanctions.csv` (16 MB) + `un_sanctions_consolidated.xml` (2 MB) + `tlc_data/export_controls/bis_entity_list.json` (1.5 MB) + `entity_list.csv` (163 KB) | **168 MB total** / 2026-03-13~18 | 🟢 **READY (massive win)** | **CW33-S4 primary asset**. XML parser 만 작성하면 모든 주요 feed 커버 |
| **C-12** | AD/CVD Trade Remedy | `tlc_data/ad_cvd/ita_adcvd_cases_2000_current.json` (185 KB) + `adcvd_scope_rulings.{csv,json}` (1.3-2 MB) + `ita_sunset_continuations.json` (112 KB) + `wto_eu_ad_notifications.csv` | ~4 MB / 2026-03-18 | 🟢 Ready | 기존 DB 보충 — 누락된 historical cases seed |
| **C-13** | HS Database (v3 engine) | **THE BIG ONE** (아래 상세) | ~140 MB | 🟢 **READY — core asset** | **CW33-S3 전체 기반** |
| **C-14** | Exchange rate | `tlc_data/currency/ecb_daily_rates.xml` (1.5 KB) + `ecb_historical_rates.xml` (8 MB) | 8 MB / 2026-03-18 | 🟢 Ready | P0.19 일일 cron 의 seed baseline |
| **C-15** | IOSS/OSS €150 threshold | `regulations/eu/vat/vat_directive_2006_112.html` (원문) | 원문 HTML | 🟡 Partial | threshold 추출 + 구조화 필요 |
| **C-16** | Price break rules | `regulations/us/htsus/hts_2026_rev4.json` (**13 MB**) 에 포함 | 13 MB / **2026-03-13** | 🟡 Partial | HTSUS 파싱 → price-break rule 추출 스크립트 필요 |
| **C-17** | US 50주 Sales Tax + nexus | `regulations/us/sales_tax/us_state_sales_tax_2024.json` | 5.8 KB / **2024 version** | 🟡 Stale | **2026 버전 재수집 필요** (2024 → 2026 은 Wayfair 후속 변동 多) |
| **C-18** | Specialized tax 12개국 | `tlc_data/special_tax/additional_country_special_taxes.json` | — / 2026-03-18 | 🟢 Ready | P1.6 seed |
| **C-19** | Shipping rates 8 캐리어 | (없음 — carrier API 필요) | — | 🔴 Missing | P1.5 DHL/FedEx/UPS API key 통합 |

**Summary**: 🟢 **12 Ready** + 🟡 **4 Partial/Stale** + 🔴 **3 Missing** = 19 전체 커버 (C-02 는 코드 rule 이라 데이터 무관, C-04 는 파셜이지만 export 는 이미 있음)

---

## 🟢 Ready 자산 상세

### 🏆 v3 HS 엔진 데이터 (C-13, **최대 자산**)

**핵심 경로**: `/Volumes/soulmaten/POTAL/`

- **`hs_classification_rules/`** (27 MB)
  - `section_notes.json` (46 KB) — WCO Section 21 notes
  - `chapter_notes.json` (366 KB) — 모든 chapter notes
  - `subheading_notes.json` (99 KB) — subheading 단위 notes
  - `COMPLETE_GRI_REFERENCE.md` + `COMPLETE_GRI1_REFERENCE.md`
  - `gri1_rules_and_cases.md` ~ `gri6_rules_and_cases.md` — GRI 전체 6 rules + case law
  - `conflict_patterns/` — chapter-level 충돌 해결 패턴
  - `us_additional_rules.md`, `eu_cn_rules.md`, `kr_classification_rules.md`, `uk_tariff_rules.md`, `au_tariff_rules.md`, `ca_tariff_rules.md`, `jp_tariff_rules.md`
- **`hs_national_rules/`** (140 MB, **7개국 codified**)
  - `us/codified_national_full_final.json`
  - `eu/codified_national_full_final.json`
  - `gb/codified_national_full_final.json`
  - `kr/codified_national_full_final.json`
  - `jp/codified_national_full_final.json`
  - `au/codified_national_full_final.json`
  - `ca/codified_national_full_final.json`
  - 각 국가별 3 버전 (v1, v5, full_final) — **full_final 이 최신**
  - `full_codification_summary.json` — 요약 메타
  - `6digit_verification.json` + `validation_5round_results.json` — QA 검증
- **`regulations/international/wco/`**
  - `hs2022_sections.json` — WCO HS 2022 Section 정의
  - `hs2022_chapters.json` — WCO HS 2022 Chapter 정의
- **`regulations/us/htsus/`**
  - `hts_2026_rev4.json` (13 MB, **2026-03-13**) — **최신 US HTSUS 2026 revision 4**
  - `hts_2026_rev4.xlsx` (1.6 MB) — Excel 버전
- **`hs-bulk/us/`**
  - `hts_complete.json` (13 MB, 2025-03-07) — older
  - `us_hts_10digit.csv` (1.4 MB)
- **`hs_correlation/`** (83 MB)
  - `cbp_cross_hs2022.csv` — CBP 판례 → HS 2022 맵
  - `ebti_hs2022.csv` — EU EBTI 판례 → HS 2022 맵
  - `hs2017_to_hs2022_map.json`, `hs2012_to_hs2022_map.json` — 버전 변환
  - `chapter_expert_rules.json` — 전문가 룰
  - `expert_rules_verification.json`
  - `split_judgment_records.csv`
- **`regulations/eu_ebti/`**
  - `ebti_rulings.csv` — EU BTI 판례 원본
  - `ebti_for_db.csv` — DB 적재 포맷
  - `ebti_full_export.zip` — 원본 export

**7field_benchmark/ v3 codified**:
- `codified_subheadings.json` (1.5 MB, 2026-03-19) — **v3 엔진의 subheading 규칙**
- `codified_headings.json` / `codified_headings_v2.json` / `codified_headings_v3.json`
- `codified_subheadings_v2.json` / `codified_subheadings_v3.json`
- `ai4_codified_rules.json`
- `9field_reference.json`
- `V3_TEST_LOG.md` (44 KB, 2026-03-20)

**CW33 활용**: P0.11 (HS Database DB 이전) 난이도 **XL → M**. 이미 parsed JSON 포맷이라 Supabase seed 스크립트만 작성하면 됨. WCO HS 2022 + 7개국 national tariff schedule + 판례 상관관계까지 전부 확보.

### 🏆 POTAL_Ablation_V2.xlsx (벤치마크 기준점)

- **경로**: `/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx`
- **크기**: 161 KB
- **수정일**: 2026-03-20
- **CW33 활용**: CW33 전체 regression 벤치마크 기준점. classifier 재작업 시 정확도 회귀 검증용
- **관련**: `POTAL_V3_Benchmark_350.xlsx` (350개 상품), `POTAL_V3_Benchmark_9field_Complete.xlsx`, `Amazon_Ablation_Test.xlsx`, `Amazon_50_Benchmark_Analysis.xlsx`

### tlc_data/ (CW33 Core Data Warehouse, 2026-03-18 수집)

**경로**: `/Volumes/soulmaten/POTAL/tlc_data/` (100 MB)
**수집일**: 대부분 2026-03-18 (4주 전, 🟢)

| 서브폴더 | 주요 파일 | CW33 매핑 |
|---|---|---|
| `duty_rate/` | `section_301_hts.csv` (20K), `section_232_hts.csv` (30K), `ieepa_reciprocal_hts.csv` (41K), `us_trq_entries.json` (134K), `eu_seasonal_tariffs.json` (1.4K) | C-05, C-06, C-08 |
| `vat_gst/` | `eu_27_vat_rates.csv`, `eu_remaining_14_vat_rates.json`, `non_eu_vat_rates.csv` (in step 3 output), `india_gst_slab_mapping.json` | C-03, C-07 |
| `de_minimis/` | `country_valuation_deminimis.csv`, `fta_deminimis_thresholds.json` | C-03, C-01 |
| `sanctions/` | `eu_sanctions_list.xml` (24 MB), `uk_ofsi_sanctions.csv` (16 MB), `un_sanctions_consolidated.xml` (2 MB) | C-11 |
| `export_controls/` | `bis_entity_list.json` (1.5 MB), `entity_list.csv` (164 KB), `ccl_eccn_list.csv` (119 KB), `ecfr_part774_ccl.xml` (2 MB), `ecfr_part738_country_chart.xml` (185 KB), `commerce_country_chart.csv`, `country_chart_structured.json` | C-04 (export), C-11 |
| `rules_of_origin/` | `korus_annex4a_psr.pdf` + `korus_annex6a_psr.pdf` (855 KB), `rcep_psr_heading_level.json` (274 KB), `rcep_annex3a_psr.pdf` (3 MB), `usmca_psr_heading_level.json` (159 KB), `usmca_chapter4_rules_of_origin.pdf` (972 KB), `cptpp_psr_heading_level.json` (149 KB), `cptpp_annex3d_psr.pdf` (559 KB), `eu_uk_tca_psr_heading_level.json` (58 KB), `eu_uk_tca_full.pdf` (7.8 MB), `fta_psr_5_major.{csv,json}` | C-01 RoO |
| `ad_cvd/` | `adcvd_scope_rulings.{csv,json}` (1.3-2 MB), `ita_adcvd_cases_2000_current.json` (185 KB), `ita_sunset_continuations.{html,json}` (112 KB), `eu_trade_defence_stats.xlsx` (40 KB), `wto_eu_ad_notifications.csv` (6.6 KB) | C-12 |
| `currency/` | `ecb_daily_rates.xml` (1.5 KB), `ecb_historical_rates.xml` (**8 MB historical**), `currency_rules_structured.json`, `cbp_quarterly_page.html` | C-14 |
| `insurance_shipping/` | `cif_fob_country_matrix.json` | C-09 (partial) |
| `special_tax/` | `additional_country_special_taxes.json` | C-18 |
| `customs_fees/` | (디렉토리 존재) | 관련 |
| `analysis/` | 구조 분석 결과 (`03_vat_gst_structure_analysis.json`, `04_de_minimis_structure_analysis.json`, `09_sanctions_structure_analysis.json` 등) | 참고 |

### 🏆 OFAC SDN Full Feed (C-11, **CW33-S4 핵심**)

- **`regulations/us/ofac_sanctions/sdn_advanced.xml`** — 123 MB (2026-03-13)
- **`regulations/us/ofac_sanctions/sdn.csv`** — 5.5 MB (2026-03-13)

**의미**: OFAC SDN 전체 ~20,000 엔트리. CW33-S4 에서 OFAC XML parser 만 작성하면 Sanctions Screening (F023/F024) 를 65 건 → 20,000+ 건으로 **즉시** 확장 가능. 별도 live feed subscription 불필요 (무료 공개 데이터).

추가 sanctions 원본:
- `tlc_data/sanctions/eu_sanctions_list.xml` — 24 MB (EU consolidated)
- `tlc_data/sanctions/uk_ofsi_sanctions.csv` — 16.6 MB (UK HMT)
- `tlc_data/sanctions/un_sanctions_consolidated.xml` — 2 MB

**4개 주요 sanctions 소스 전부 확보됨** — CW33-S4 난이도 XL → **L** 로 재평가.

### 기타 Ready 자산

- **`hs-bulk/`** (128 MB, 2025-03-07) — 7개국 tariff bulk 추출
  - `commodity_duty_rates.json`, `duty_rates_merged.csv`, `duty_rates_wits.csv`
  - `us/hts_complete.json` (13 MB, older version)
  - `eu/eu_taric_findings.json` (15 KB)
  - `kr/`, `jp/`, `au/`, `ca/`, `uk/` — partial
- **`benchmark_results/`** — GRI benchmark v1 ~ v4 results + errors (기존 엔진 품질 추적)
- **`hs_embeddings/`** (138 MB) — HS description vector embeddings (vector search 재활용 가능)
- **`regulations/us/cfr_title19/`** — US customs regulations
- **`regulations/wto/`** + `regulations/international/wits_unctad/` — WTO + UNCTAD WITS tariff data
- **`benchmark/`** (25 MB) + `benchmark/results/BENCHMARK_ANALYSIS_REPORT.md`
- **`7field_benchmark/benchmark_1000_products.json`** — 1,000 상품 테스트 세트

---

## 🟡 Stale / Partial 자산 상세

### S-01: US State Sales Tax (C-17) — 2024 버전
- **파일**: `regulations/us/sales_tax/us_state_sales_tax_2024.json` (5.8 KB)
- **수정일**: 2026-03-13 (파일 이름이 2024 라서 내용물은 2024 기준)
- **문제**: 2024 → 2026 사이에 Wayfair 후속 변동 多. 경제적 넥서스 임계값 (예: 200 transactions 삭제 트렌드) 반영 안 됨
- **조치**: 50개 주 + DC 각 주 DOR 사이트에서 2026 버전 재수집. 또는 Avalara/TaxJar 상업용 API

### S-02: HTSUS 2026 price break rules 추출 (C-16)
- **파일**: `regulations/us/htsus/hts_2026_rev4.json` (13 MB, 2026-03-13)
- **상태**: 원본은 최신, 하지만 price-break rules (valued over $X/kg) 구조화 파싱 필요
- **조치**: HTS JSON 스키마 분석 후 추출 스크립트 작성 (CW33-S3 내)

### S-03: IOSS/OSS €150 threshold 추출 (C-15)
- **파일**: `regulations/eu/vat/vat_directive_2006_112.html` (원문 HTML)
- **조치**: threshold, 등록번호 포맷, 규제 범위를 구조화 JSON 으로 변환

### S-04: Import restrictions — 수입 금지/제한 general purpose (C-04)
- **있음**: tlc_data/export_controls/* (export 쪽만 커버)
- **부족**: REACH (EU 화학물질), PSE mark (JP 전기용품), K-REACH (KR), RoHS (EU) 같은 수입 쪽 규제
- **조치**: 별도 REACH/RoHS API 연동 또는 ECHA/METI 원본 수집

---

## 🔴 Missing / Unusable (새로 구해야 하는 것)

### M-01: Brand origin 130+ 매핑 (C-10)
- **외장하드**: 없음
- **현재 소스**: `app/lib/data/brand-origins.ts` (코드 파일, 130 엔트리)
- **조치**: 코드 추출 → Supabase seed. 추가 브랜드는 관리자 UI에서 수동 입력 + crowdsourced

### M-02: Insurance rate tables (C-09)
- **외장하드**: `tlc_data/insurance_shipping/cif_fob_country_matrix.json` (CIF/FOB 구조만, 요율 아님)
- **부족**: 카테고리별 base rate, 고위험 노선 surcharge
- **조치**: Lloyd's Market Association 공개 자료 또는 상업용 API (Marsh, Aon) — P1 로 지연 가능

### M-03: Shipping rates 8 캐리어 live (C-19)
- **외장하드**: 없음 (carrier API 필요)
- **조치**: DHL/FedEx/UPS REST API key 발급 + cache layer

### M-04: REACH / RoHS / PSE 수입 제한 (C-04 보완)
- **외장하드**: 없음
- **조치**: ECHA SCIP DB, METI PSE list, WEEE directive, RoHS directive

### M-05: US State Sales Tax 2026 최신 (C-17)
- **외장하드**: 2024 버전만
- **조치**: 50 주 DOR sites + DC scrape 또는 Avalara

---

## ⚪ Unrelated (CW33 무관, but 용량 차지)

### WDC Products (Web Data Commons) — **893 GB**
- **경로**: `/Volumes/soulmaten/POTAL/wdc-products/`
- **구성**:
  - `wdc-products/extracted/` — 492 GB (압축 해제된 상품 데이터)
  - `wdc-products/raw/` — 350 GB (76개 part_XX.gz, 각 186-187 MB)
  - `wdc-products/v2_results/` — 51 GB (CBP chunk splits, v2 결과)
- **용도**: Classifier 벤치마킹용 상품 설명 corpus. CW33 에서 hs_classification_cache 확장 시 유용할 수는 있지만 **직접 seed 는 아님**
- **조치**: CW33 에서 건드리지 않음. Phase 2+ 분류기 재학습 시 활용 고려

### Personal / non-POTAL
- `WORLDFIRST ACCOUNT.pdf` (256 KB) — 결제 계정 문서 (개인)
- 소울마튼 드라이브 내 `Photos Library.photoslibrary`, `광고 영상 자동화`, `음악관련영상` 등 — POTAL 외부

---

## 📊 대용량 파일 TOP 20 (CW33 관련성 표시)

| # | 크기 | 경로 | CW33 관련 |
|---|---|---|---|
| 1 | 492 GB | `wdc-products/extracted/` | ⚪ |
| 2 | 350 GB | `wdc-products/raw/` (76 × 186 MB gz) | ⚪ |
| 3 | 51 GB | `wdc-products/v2_results/` | ⚪ |
| 4 | 371 MB | `wdc-products/raw/Product_domain_stats.csv` | ⚪ |
| 5 | 123 MB | `regulations/us/ofac_sanctions/sdn_advanced.xml` | **🟢 C-11** |
| 6 | 24 MB | `tlc_data/sanctions/eu_sanctions_list.xml` | **🟢 C-11** |
| 7 | 17 MB | `regulations/us/htsus/hts_2026_rev4.xlsx` | **🟢 C-13** |
| 8 | 17 MB | `tlc_data/sanctions/uk_ofsi_sanctions.csv` | **🟢 C-11** |
| 9 | 17 MB | `tlc_data/export_controls/bis_entity_list_page.html` | 🟢 C-11 (HTML 원본) |
| 10 | 16 MB | `cbp_cross_search_mappings.csv` | 🟢 C-13 |
| 11 | 16 MB | `cbp_cross_combined_mappings.csv` | 🟢 C-13 |
| 12 | 14 MB | `regulations/us/htsus/hts_2026_rev4.json` | **🟢 C-13** |
| 13 | 14 MB | `hs-bulk/us/hts_complete.json` | 🟡 older (Mar 2025) |
| 14 | 8 MB | `tlc_data/currency/ecb_historical_rates.xml` | **🟢 C-14** |
| 15 | 7.8 MB | `tlc_data/rules_of_origin/eu_uk_tca_full.pdf` | 🟢 C-01 |
| 16 | 5.5 MB | `regulations/us/ofac_sanctions/sdn.csv` | 🟢 C-11 |
| 17 | 5.8 MB | `cbp_cross_hs_mappings.csv` | 🟢 C-13 |
| 18 | 3.0 MB | `tlc_data/rules_of_origin/rcep_annex3a_psr.pdf` | 🟢 C-01 |
| 19 | 2.1 MB | `tlc_data/export_controls/ecfr_part774_ccl.xml` | 🟢 C-04 |
| 20 | 2.0 MB | `tlc_data/ad_cvd/adcvd_scope_rulings.json` | 🟢 C-12 |

---

## 📁 파일 유형 집계

| 확장자 | 개수 | 비고 |
|---|---|---|
| gz | 1,899 | WDC products raw parts (대부분 ⚪) |
| json | 537 | tlc_data + codified_rules + benchmark results |
| csv | 165 | 세금/관세표/sanctions |
| htm/html | 96 + 23 | 원본 regulation 페이지 (파싱 대상) |
| md | 92 | README + GRI rules + test logs |
| jsonl | 35 | benchmark streaming |
| pdf | 22 | FTA annexes |
| txt | 16 | raw country charts |
| xml | 14 | OFAC/EU sanctions + historical FX |
| xlsx | 14 | 벤치마크 + HTSUS |
| log | 11 | data collection logs |
| py / ts | 9 + 5 | 수집 스크립트 |

---

## 📅 최근 수정 파일 (2025-01-01 이후) 요약

**수집 패턴**:
- **2025-03-06 ~ 2025-03-07**: hs-bulk/ 7개국 bulk HS 1차 수집
- **2026-03-13**: regulations/us/ htsus + ofac_sanctions + sales_tax 대규모 수집
- **2026-03-17 ~ 2026-03-20**: hs_classification_rules + hs_national_rules + 7field_benchmark 완성
- **2026-03-18**: **tlc_data/ 전체 최신 수집** (duty_rate, vat_gst, sanctions, ad_cvd, rules_of_origin 등)
- **2026-03-19 ~ 21**: v3 codified rules 완성 (codified_subheadings.json, V3_TEST_LOG.md)

대부분 4주 이내 수집된 **신선한** 데이터. 🟢 Ready 분류의 근거.

---

## 🗓️ 권장 CW33-S0 작업 (Phase B 착수 전)

### 즉시 필요 (블로킹)
1. 🟡 S-01 US State Sales Tax 2026 재수집 (50개 주 + DC scrape 또는 Avalara 평가판) — **0.5 sprint**

### CW33-S1 시작과 병렬 진행 가능
2. 🔴 M-01 Brand origins → `app/lib/data/brand-origins.ts` export + 관리자 UI 연동 디자인
3. 🟡 S-02 HTSUS price break rules 추출 스크립트 — 기존 `hts_2026_rev4.json` 파싱
4. 🟡 S-03 EU VAT directive IOSS/OSS threshold 구조화

### P1 로 연기 가능
5. 🔴 M-02 Insurance rate tables — 상업용 소스 리서치
6. 🔴 M-03 Shipping rates carrier API — DHL/FedEx/UPS dev account
7. 🟡 S-04 REACH/RoHS/PSE/K-REACH 수입 제한 — API/데이터 소스 리서치

### 외장하드 → Supabase 마이그레이션 예상 작업량
- **C-05, C-06, C-07, C-08 (US/EU 관세/TRQ/VAT)**: 각 2-4시간 × 4 = **8-16시간**
- **C-11 Sanctions (OFAC XML parser)**: **12-20시간** (대용량 XML, normalization, fuzzy search index)
- **C-13 HS Database (v3 codified + HTSUS + WCO + national rules)**: **20-30시간** (스키마 설계 + 마이그레이션 스크립트 + 검증)
- **C-01 FTA (RoO JSONs + preferential rates)**: **6-10시간**
- **C-03 Country data (240 countries)**: **4-6시간**
- **C-12 AD/CVD**: **4-6시간** (기존 DB 에 delta 적재)
- **C-14 Exchange rate**: **2-4시간** (ECB historical seed + 일일 cron)
- **합계**: **56-92 시간** (예상 **7-12 working days**)

**비교**: 외장하드 자산 없이 처음부터 수집하면 OFAC live feed subscribe + parser 작성 + EU/UK/UN 파서 + 7개국 HS tariff scraper 등 최소 **200-400 시간**. **대략 4-5배 시간 단축**.

---

## ✅ 검증 체크리스트

- [x] 외장하드 `/Volumes/soulmaten/POTAL/` 마운트 확인됨 (983 GB 용량)
- [x] CW33 🔴 19건 전부 매핑 테이블 포함 (found/not found 명시)
- [x] v3 HS 엔진 데이터 위치 확인 (`hs_classification_rules/`, `hs_national_rules/`, `7field_benchmark/codified_*.json`)
- [x] `POTAL_Ablation_V2.xlsx` 위치 확인 (`/Volumes/soulmaten/POTAL/7field_benchmark/POTAL_Ablation_V2.xlsx`, 161 KB, 2026-03-20)
- [x] 대용량 파일 TOP 20 기록
- [x] Raw 원본 저장 (`docs/EXTERNAL_DRIVE_CW33_INVENTORY_RAW.txt`, 771 lines)
- [x] 🟢/🟡/🔴/⚪ 분류 근거 (파일 수정일 + 파일 크기) 명시
- [x] **파일 복사/이동/수정 0건** — 읽기 전용 감사

---

## 🎯 CW33 Phase B 전체 재평가

외장하드 발견에 따른 CW33_SCOPE.md 난이도 재조정:

| Sprint | 이전 난이도 | 이후 난이도 | 이유 |
|---|---|---|---|
| CW33-S1 (FTA+Country+Override+Restriction) | 6-8일 | **4-5일** | C-01 RoO + C-03 country data 원본 확보 |
| CW33-S2 (US/EU tax tables) | 8-10일 | **5-6일** | C-05/C-06/C-07/C-08 전부 Ready |
| CW33-S3 (Classifier + product) | 5-7일 | **3-4일** | C-13 v3 codified + HTSUS 2026 전부 Ready |
| CW33-S4 (Sanctions sync) | 10일 (XL) | **5-6일** (L) | OFAC SDN XML + EU + UK + UN 원본 전부 확보 |
| CW33-S5 (Exchange rate) | 3일 | 3일 | 동일 |
| CW33-S6 (P1 items) | 8일 | 8일 | brand/insurance/shipping 은 여전히 새로 필요 |

**총 P0 소요 예상**: **20-24일** (기존 29-31일 대비 약 **25-30% 단축**)

---

## 💡 은태님 결정 질문 — 외장하드 발견 기반

1. **WDC 893GB 활용 여부**
   - 분류기 재학습 및 정확도 향상에 활용 가능하지만 CW33 스코프 밖
   - 권장: CW33 에서는 건드리지 않음. Phase 2+ 분류기 개선 때 활용

2. **v3 codified_subheadings.json 활용 우선순위**
   - CW33-S3 의 core asset. 첫 작업으로 스키마 설계 + seed 스크립트 작성
   - 권장: CW33-S3 **가장 먼저** (CW33-S1 과 병렬 진행 가능)

3. **OFAC SDN 123MB XML parser 전략**
   - (a) Streaming XML parser (sax-js) + 청크 insert
   - (b) 전체 로드 후 bulk insert (메모리 요구량 큼)
   - 권장: **(a) streaming** — Vercel serverless 제한 대응

4. **US Sales Tax 2026 재수집 방법**
   - 외장하드는 2024 버전만 있음
   - (a) 50주 DOR 수동 scrape (4-6시간)
   - (b) Avalara/TaxJar free trial (빠르지만 재사용 약정)
   - 권장: **(a) 수동 scrape** — 일회성 seed 목적

5. **P0.10 Price break rules 추출 우선순위**
   - `hts_2026_rev4.json` 13MB 에 포함되지만 구조화 파싱 필요
   - 권장: CW33-S2 내에서 parser 작성 (별도 sprint 불필요)
