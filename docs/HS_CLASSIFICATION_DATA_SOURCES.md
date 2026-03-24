# HS Code 분류 데이터 소스 마스터 목록
# 마지막 업데이트: 2026-03-16 16:30 KST

> 산업용/특수소재/화학물질/기계부품 HS Code 매핑 데이터 수집을 위한 전체 소스 카탈로그.
> 목표: product_name + HS_code 페어를 최대한 확보하여 product_hs_mappings DB 확장.

---

## 현재 보유 데이터

| 소스 | 건수 | 유형 | 상태 |
|------|------|------|------|
| WDC Phase 4 (소비자 상품) | ~1.36M | 소비자 (의류, 전자, 완구) | ✅ DB 로딩 중 |
| CBP CROSS Rulings 추출 | 142,251 | 산업+소비자 (53,540 산업) | ✅ CSV 준비 완료 |
| WDC Phase 1-3 (카테고리 매핑) | 8,389 | 소비자 카테고리 | ✅ DB 적재 완료 |
| Google Taxonomy | 164 | 카테고리 | ✅ DB 적재 완료 |
| **합계** | **~1.5M** | | |

---

## 목차
1. [국가별 분류 결정문](#1-국가별-분류-결정문)
2. [신상품/신기술 소스](#2-신상품신기술-소스)
3. [농산물/식품](#3-농산물식품)
4. [군수/이중용도](#4-군수이중용도)
5. [B2B 산업 데이터](#5-b2b-산업-데이터)
6. [우선순위 종합 + 수집 계획](#6-우선순위-종합--수집-계획)

---

## 1. 국가별 분류 결정문

### 1.1 미국 CBP CROSS Rulings ⭐ DONE
- **URL**: https://rulings.cbp.gov/
- **데이터**: 상품 설명 + HTS 10자리 코드, 공식 분류 결정문
- **형식**: JSON (이미 수집: batches 39,430건 + search_batches 180,684건)
- **추출 건수**: **142,251건** (산업 53,540 + 소비자 88,711, 중복 제거 후)
- **접근**: 공개 (이미 수집 완료)
- **자동 업데이트**: 주간 해시 비교 (`classification-ruling-monitor` Cron 구현 완료)
- **비고**: 산업용 커버리지 우수 — Ch.84 기계(1,559), Ch.85 전기(1,897), Ch.29 유기화학(570), Ch.39 플라스틱(1,842), Ch.73 철강(781), Ch.90 정밀기기(683)
- **파일**: `/Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv`
- **스크립트**: `scripts/extract_cbp_cross_mappings.py`

### 1.2 EU EBTI (European Binding Tariff Information) ⭐ HIGH
- **URL**: https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_home.jsp?Lang=en
- **Open Data**: https://data.europa.eu/data/datasets/european-binding-tariff-information
- **데이터**: 상품 상세 설명 + CN/TARIC 8-10자리 코드 (EU 회원국 세관 공식 분류)
- **형식**: Web UI (쿼리 기반) + EU Open Data Portal (벌크 가능성)
- **예상 건수**: **50,000~100,000+건** (EU 전체 회원국 누적)
- **접근**: 공개, Open Data Portal에서 벌크 다운로드 가능성 확인 필요
- **자동 업데이트**: EBTI 상시 발급 (BTI 유효기간 3년). `classification-ruling-monitor` Cron 구현 완료
- **비고**: 고품질 ground truth — 세관 당국이 직접 분류한 실제 상품. 산업 부품/화학물질/기계 커버리지 우수
- **API**: api.store에서 EU Customs API 확인 필요
- **우선순위**: **매우 높음** — CBP CROSS 다음 최우선 수집 대상

### 1.3 UK ATaR (Advance Tariff Rulings) — HIGH
- **URL**: https://www.tax.service.gov.uk/search-for-advance-tariff-rulings/
- **데이터**: 상품 설명 + UK commodity code (10자리, Brexit 이후 독자 분류)
- **형식**: Web UI (검색 기반, 날짜 범위 쿼리 가능)
- **예상 건수**: **5,000~15,000건** (Brexit 이후 누적)
- **접근**: 공개 (스크래핑 필요)
- **자동 업데이트**: `classification-ruling-monitor` Cron 구현 완료
- **비고**: EU EBTI와 별도 — Brexit 후 UK 독자 분류. EU와 다른 결정이 있을 수 있음

### 1.4 한국 사전심사 (관세품목분류 사전심사) — MEDIUM
- **URL**: https://unipass.customs.go.kr/clip/hsinfosrch/openULS0201002Q.do?engl=Y
- **Open Data**: https://www.data.go.kr/en/data/15049720/fileData.do
- **데이터**: HSK 10자리 코드 + 상품 설명 (한국어/영어)
- **형식**: Web UI + data.go.kr API (등록 필요)
- **예상 건수**: **12,000+건** (한국 관세율표 전체)
- **접근**: 공개 (data.go.kr 무료 API)
- **비고**: 기존 gov_tariff_schedules에 6,646건 있음. 확장 가능

### 1.5 일본 事前教示 (사전교시) — MEDIUM
- **URL**: https://www.customs.go.jp/english/advance/
- **데이터**: 상품 설명 + 일본 HS 코드 (사전 분류 결정)
- **형식**: Web UI (PDF)
- **예상 건수**: **5,000~10,000건**
- **접근**: 공개 (PDF 파싱 필요)
- **비고**: 일본어 중심, 영어 요약 있음

### 1.6 호주 Tariff Classification Advice — MEDIUM
- **URL**: https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification
- **데이터**: 관세 분류 결정 + Australian Tariff Classification Guide
- **형식**: PDF
- **예상 건수**: **2,000~5,000건**
- **접근**: 공개

### 1.7 캐나다 National Customs Rulings — MEDIUM
- **URL**: https://www.cbsa-asfc.gc.ca/publications/cn-ad-eng.html
- **데이터**: 분류 결정문 + HS 코드
- **형식**: HTML/PDF
- **예상 건수**: **3,000~8,000건**
- **접근**: 공개

### 1.8 인도 CBIC Advance Rulings — MEDIUM
- **URL**: https://www.cbic.gov.in / ICEGATE
- **Open Data**: https://www.data.gov.in/catalog/import-export-classification-itc-hs-code-and-import-policy-0
- **데이터**: ITC-HS 8자리 + 상품 설명 + 수입 정책
- **형식**: CSV (data.gov.in에서 벌크 다운로드)
- **예상 건수**: **11,000~12,000건** (ITC-HS 전체)
- **접근**: 공개, 무료 다운로드
- **비고**: data.gov.in에서 CSV 직접 다운로드 가능 — 높은 접근성

### 1.9 남아공 SARS Tariff Determinations — LOW
- **URL**: https://tdn.sars.gov.za/portal/
- **데이터**: 분류 결정문 168+건
- **형식**: Web UI
- **예상 건수**: **168+건** (소규모)
- **접근**: 공개 (확인 완료)

### 1.10 중국 GACC 분류 결정 — LOW
- **URL**: http://english.customs.gov.cn/
- **데이터**: 관세 분류 관련 공고
- **형식**: HTML/PDF (중국어 중심)
- **예상 건수**: 미확인 (접근 어려움, SSL 이슈)
- **접근**: 제한적

---

## 2. 신상품/신기술 소스

### 2.1 WCO 분류 결정/의견 — HIGH
- **URL**: https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/tools-to-assist-with-the-classification-in-the-hs/hs_classification-decisions/classification-decisions.aspx
- **데이터**: WCO 공식 분류 결정 (HSC 세션별), HS Explanatory Notes
- **형식**: Web (유료 구독: wcotradetools.org)
- **예상 건수**: **수천 건** (분류 결정), Explanatory Notes는 5,371 HS6 전체 해설
- **접근**: 분류 결정 웹 공개 / Explanatory Notes **유료** (WCO Trade Tools 구독)
- **업데이트**: HSC 세션 후 연 2회 (3월/9월)
- **비고**: HS 분류의 최종 권위. Explanatory Notes는 상품 설명이 매우 상세 — 구독 가치 있음

### 2.2 US Federal Register — 분류 고시 — MEDIUM
- **URL**: https://www.federalregister.gov/api/v1/documents.json
- **데이터**: USITC/CBP 관세 분류 관련 연방 관보 문서
- **형식**: REST API (JSON)
- **접근**: 공개, API 키 불필요
- **비고**: `federal-register-monitor` Cron으로 이미 모니터링 중. 신상품/기술 분류 변경 감지

### 2.3 EU 분류 규정 (Combined Nomenclature) — HIGH
- **URL**: EUR-Lex 검색: "classification of certain goods in the Combined Nomenclature"
- **데이터**: EU 위원회 이행 규정 — 특정 상품의 CN 코드 분류 확정
- **형식**: HTML/PDF (EUR-Lex, 24개 언어)
- **예상 건수**: **수백 건** (매년 10-20개 신규 분류 규정)
- **접근**: 공개 (EUR-Lex 무료)
- **비고**: TARIC RSS로 모니터링 가능 (`taric-rss-monitor` Cron 구현 완료)

### 2.4 USITC HTS 다운로드 ⭐ HIGH
- **URL**: https://hts.usitc.gov/download
- **데이터**: 미국 HTS 전체 관세율표 — HTS 8-10자리 + 상품 설명 + 관세율
- **형식**: CSV/JSON/Excel (무료 직접 다운로드)
- **예상 건수**: **17,000~19,000건** (HTS 8자리 소제목 전체)
- **접근**: **공개, 무료, 등록 불필요**
- **비고**: gov_tariff_schedules에 28,718건 있지만, USITC 공식 다운로드가 더 깨끗한 CSV. 정기 업데이트 (연간 + 수시 개정)

---

## 3. 농산물/식품

### 3.1 USDA FAS GATS — MEDIUM
- **URL**: https://apps.fas.usda.gov/gats/default.aspx
- **API**: https://apps.fas.usda.gov/opendatawebV2/ (api.data.gov 키 필요)
- **데이터**: 농산물 무역 데이터 — 품목명 + HS6/HS10 코드
- **형식**: JSON API
- **예상 건수**: **2,000~3,000건** (농산물 품목 목록)
- **접근**: 무료 API (api.data.gov 키 발급)
- **비고**: Chapter 01-24 농산물 커버. 기계/화학 미포함

### 3.2 Codex Alimentarius — LOW
- **URL**: http://www.fao.org/fao-who-codexalimentarius/
- **데이터**: 식품 표준 (HS 연결 간접적)
- **비고**: HS 코드 직접 포함하지 않음. 교차 참조용

### 3.3 EU 농산물 CN 코드 — MEDIUM
- **URL**: EUR-Lex 부속서 (농산물 관세 할당)
- **데이터**: 농산물별 CN 코드 + 할당량
- **형식**: HTML/PDF
- **비고**: TARIC에 이미 포함

### 3.4 US FDA Import Alerts — LOW
- **URL**: https://www.fda.gov/industry/actions-enforcement/import-alerts
- **데이터**: 수입 경고 제품 + HS 코드 (일부)
- **예상 건수**: **수천 건** (경고 제품 목록)
- **접근**: 공개
- **비고**: 규제 목적 — 제한 품목 매핑에 유용

---

## 4. 군수/이중용도

### 4.1 US EAR Commerce Control List (CCL) — MEDIUM
- **URL**: https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear
- **eCFR**: 15 CFR Part 774 (이미 수집: eCFR Title 15)
- **데이터**: ECCN 번호 + 상품 설명 (이중용도 품목)
- **형식**: PDF/HTML (eCFR)
- **예상 건수**: **~600 ECCN** (각각 상세 기술 파라미터 포함)
- **접근**: 공개 (이미 eCFR 수집 완료)
- **비고**: ECCN↔HS 교차 참조 테이블은 별도 구축 필요. 수출 통제 기능(export-controls.ts)에 활용

### 4.2 Wassenaar Arrangement — MEDIUM
- **URL**: https://www.wassenaar.org/
- **데이터**: Dual-Use List + Munitions List (42개 참여국 공통)
- **형식**: PDF
- **예상 건수**: **~300 카테고리** (상세 기술 사양)
- **접근**: 공개 (PDF 다운로드)
- **비고**: EAR CCL의 국제 기반. 교차 참조용

### 4.3 EU Dual-Use Regulation — MEDIUM
- **URL**: EUR-Lex: Regulation (EU) 2021/821 Annex I
- **데이터**: EU 이중용도 품목 목록 + CN 코드 교차 참조
- **형식**: HTML/PDF (EUR-Lex)
- **예상 건수**: **~600 품목** (EAR과 유사 범위)
- **접근**: 공개

### 4.4 US Munitions List (ITAR/USML) — LOW
- **URL**: 22 CFR 121 (eCFR)
- **데이터**: 군수품 카테고리 (Category I-XXI)
- **형식**: HTML/PDF
- **비고**: HS 코드 직접 포함하지 않음. 수출 통제 참조용

---

## 5. B2B 산업 데이터

### 5.1 EU ECICS (화학물질 목록) ⭐ HIGH
- **URL**: https://taxation-customs.ec.europa.eu/online-services/online-services-and-databases-customs/ecics-european-customs-inventory-chemical-substances_en
- **데이터**: 화학물질명 (11개 EU 언어) + CN 8자리 코드 + CAS 번호 + EC 번호
- **형식**: Web UI (DDS2 시스템)
- **예상 건수**: **~70,000건** (공식 문서 확인)
- **접근**: 공개 (벌크 요청: taxud-dds-ecics@ec.europa.eu)
- **비고**: 의약품, 산업 화학물질, 특수 소재 커버리지 압도적. 화학물질명→HS 매핑의 최대 공개 소스
- **우선순위**: **매우 높음** — 70,000건 화학물질 HS 매핑

### 5.2 US Census Schedule B — HIGH
- **URL**: https://www.census.gov/foreign-trade/schedules/b/
- **데이터**: 수출 분류 번호 (HS 6자리 기반) + 상품 설명
- **형식**: ZIP/ASCII/CSV
- **예상 건수**: **10,000~17,000건**
- **접근**: 공개, 무료 다운로드
- **비고**: HTS와 첫 6자리 동일. Concordance 파일 (NAICS, End-use, SITC 교차)도 제공

### 5.3 UN Comtrade 참조 테이블 — LOW
- **URL**: https://comtradeplus.un.org/
- **데이터**: HS6 코드 + 공식 WCO 상품 설명
- **형식**: JSON/CSV API
- **예상 건수**: ~5,300건 (HS6 nomenclature)
- **접근**: 무료 API (등록 필요)
- **비고**: 이미 보유한 HS6 설명과 동일. 추가 가치 낮음

### 5.4 Alibaba/Made-in-China — ❌ 불가
- **결론**: 상품 페이지에 HS 코드 미표시. 내부 API(`aliexpress.solution.hscode.query`)는 비공개. 스크래핑 봇 차단 강력.
- **예상 건수**: 0
- **비고**: B2B 마켓플레이스에서 HS 코드를 공개하지 않는 것이 업계 표준

### 5.5 US 정부 조달 (SAM.gov/FPDS) — LOW
- **URL**: https://sam.gov/data-services, https://www.fpds.gov/
- **데이터**: PSC(Product Service Code) + NAICS — HS 코드 아님
- **비고**: PSC→HS 공식 교차 테이블 없음. 직접 활용 불가

### 5.6 UK Trade Tariff API — HIGH
- **URL**: https://api.trade-tariff.service.gov.uk/
- **데이터**: UK commodity code (10자리) + 상품 설명 + 관세율
- **형식**: JSON REST API (인증 불필요)
- **예상 건수**: **17,000+건**
- **접근**: **공개, 무료, 인증 불필요**
- **비고**: gov_tariff_schedules에 17,289건 있지만 API에서 더 풍부한 설명 추출 가능. 계층적 탐색: sections→chapters→headings→commodities

### 5.7 인도 ITC-HS (data.gov.in) — HIGH
- **URL**: https://www.data.gov.in/catalog/import-export-classification-itc-hs-code-and-import-policy-0
- **데이터**: ITC-HS 8자리 + 상품 설명 + 수입 정책
- **형식**: CSV (벌크 다운로드)
- **예상 건수**: **11,000~12,000건**
- **접근**: 공개, 무료

### 5.8 GitHub 데이터셋 — MEDIUM
| 레포 | 내용 | 건수 | 우선순위 |
|------|------|------|---------|
| `captaincereal/Harmonized-Tariff-Schedule-of-the-United-States-2025` | US HTS 2025 정제 CSV + ML 모델 | ~17,000 HTS8 | **HIGH** |
| `datasets/harmonized-system` | HS6 코드 + WCO 설명 (UN Comtrade) | ~5,300 | LOW |
| `warrantgroup/WCO-HS-Codes` | WCO HS 코드 CSV | ~5,300 | LOW |
| `cid-harvard/classifications` | 다중 무역 분류 (HS, SITC 등) CSV | 미확인 | MEDIUM |
| `pyhscodes` (PyPI) | HS 코드 + 설명 + 규제 표준 | 6,940 | MEDIUM |

### 5.9 Kaggle 데이터셋 — MEDIUM
| 데이터셋 | 내용 | 우선순위 |
|----------|------|---------|
| `irakozekelly/harmonized-tariff-schedule-of-the-united-states` | US HTS + 관세율 | HIGH |
| `sohier/us-tariff-rates` | US 관세율 (2017, 구버전) | LOW |

### 5.10 CAS-HScode.org (화학물질 HS) — MEDIUM
- **URL**: https://cas-hscode.org/ (SSL 인증서 만료 상태)
- **데이터**: CAS 번호 → HS 코드 매핑 (다국가: EU, US, MX, Mercosur, WCO)
- **커버리지**: Ch.05, 12, 13, 15, 17, 22, 23, 25-27, 28-38, 39-40, 72-81
- **접근**: 유료 구독 추정
- **비고**: ECICS(무료)가 대안

### 5.11 Open Food Facts — LOW
- **URL**: https://world.openfoodfacts.org/
- **데이터**: 식품 DB (HS 코드 미포함)
- **비고**: HS 코드 필드 없음

### 5.12 GS1 GPC (Global Product Classification) — LOW
- **URL**: https://gpc-browser.gs1.org/
- **데이터**: 40,000+ GPC brick 코드 + 설명
- **형식**: XML/Excel (무료 다운로드)
- **비고**: HS 코드 직접 포함하지 않음. GPC→HS 교차 테이블 필요 (공식 것 없음)

---

## 6. 우선순위 종합 + 수집 계획

### Tier 1: 즉시 수집 가능 (무료, 벌크, HIGH ROI)

| # | 소스 | 예상 건수 | 형식 | 비용 | 상태 |
|---|------|----------|------|------|------|
| 1 | **CBP CROSS Rulings** | 142,251 | CSV | $0 | ✅ 추출 완료 |
| 2 | **EU EBTI (Open Data)** | 50,000~100,000+ | data.europa.eu | $0 | ⏳ 벌크 형식 확인 필요 |
| 3 | **EU ECICS (화학물질)** | ~70,000 | 이메일 요청/스크래핑 | $0 | ⏳ 벌크 요청 필요 |
| 4 | **USITC HTS 다운로드** | ~17,000~19,000 | CSV/JSON | $0 | ⏳ hts.usitc.gov/download |
| 5 | **인도 ITC-HS** | ~12,000 | CSV | $0 | ⏳ data.gov.in |
| 6 | **UK Trade Tariff API** | ~17,000 | JSON API | $0 | ⏳ API 크롤링 |

**Tier 1 합계: ~308,000~360,000건** (CBP 포함)

### Tier 2: 중기 수집 (스크래핑/파싱 필요)

| # | 소스 | 예상 건수 | 접근 방법 |
|---|------|----------|----------|
| 7 | UK ATaR | 5,000~15,000 | 웹 스크래핑 |
| 8 | 한국 HSK (data.go.kr) | ~12,000 | API |
| 9 | 일본 사전교시 | 5,000~10,000 | PDF 파싱 |
| 10 | 캐나다 National Customs Rulings | 3,000~8,000 | HTML 파싱 |
| 11 | 호주 분류 결정 | 2,000~5,000 | PDF 파싱 |
| 12 | USDA FAS GATS (농산물) | 2,000~3,000 | API |
| 13 | GitHub US HTS 2025 | ~17,000 | CSV 다운로드 |

**Tier 2 합계: ~46,000~70,000건**

### Tier 3: 장기/참조용

| # | 소스 | 비고 |
|---|------|------|
| 14 | WCO Explanatory Notes | 유료 구독. 분류 정확도 향상에 핵심 |
| 15 | EU Dual-Use / EAR CCL | 수출 통제 교차 참조 (~600 ECCN) |
| 16 | Wassenaar | 군수/이중용도 참조 |
| 17 | CAS-HScode.org | 유료. ECICS가 무료 대안 |
| 18 | GS1 GPC | HS 교차 테이블 없음. 향후 구축 가능 |

### 수집 로드맵

| 단계 | 작업 | 예상 건수 | 기간 |
|------|------|----------|------|
| **Phase 1** (완료) | CBP CROSS 142K 추출 | 142,251 | ✅ 완료 |
| **Phase 2** | EU EBTI 벌크 다운로드 + ECICS 이메일 요청 | ~120,000~170,000 | 1주 |
| **Phase 3** | USITC HTS + India ITC-HS + UK API | ~46,000 | 2-3일 |
| **Phase 4** | UK ATaR + 한국/일본/캐나다/호주 분류결정 | ~27,000~50,000 | 1-2주 |
| **Phase 5** | GitHub/Kaggle + USDA + Schedule B | ~20,000 | 1일 |

**전체 목표: ~355,000~428,000건** (CBP 포함)
→ 기존 WDC 1.36M + CBP 142K + 추가 ~213,000~286,000 = **~1.7M~1.8M product_hs_mappings**

### 산업 분야별 커버리지 예상

| 분야 | 주요 소스 | 예상 건수 |
|------|----------|----------|
| 기계/전기 (Ch.84-85) | CBP CROSS + EBTI + USITC | ~15,000+ |
| 화학물질 (Ch.28-38) | ECICS + CBP CROSS + EBTI | ~80,000+ |
| 금속/철강 (Ch.72-83) | CBP CROSS + EBTI + USITC | ~8,000+ |
| 플라스틱/고무 (Ch.39-40) | CBP CROSS + EBTI | ~5,000+ |
| 의약품 (Ch.30) | CBP CROSS + ECICS + EBTI | ~3,000+ |
| 정밀기기 (Ch.90) | CBP CROSS + EBTI | ~4,000+ |
| 차량/항공 (Ch.86-89) | CBP CROSS + EBTI | ~3,000+ |
| 농산물 (Ch.01-24) | CBP CROSS + USDA + India | ~15,000+ |
| **산업 소계** | | **~133,000+** |

### 자동 업데이트 Cron (이미 구현)

| Cron | 소스 | 주기 |
|------|------|------|
| `classification-ruling-monitor` | CBP CROSS + EU EBTI + UK ATaR + WCO + SARS | 매주 수 |
| `federal-register-monitor` | US Federal Register 분류 고시 | 매일 |
| `taric-rss-monitor` | EU TARIC/CN 변경 | 매일 |
| `wco-news-monitor` | WCO 분류 결정 + HS 2028 | 매월 |
