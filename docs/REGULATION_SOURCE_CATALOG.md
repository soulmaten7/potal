# REGULATION_SOURCE_CATALOG.md — 240개국 규정 RAG 수집처 카탈로그
# 마지막 업데이트: 2026-03-16 12:00 KST

> POTAL 240개국 관세법/세법/무역규정/분류결정문/FTA 원문 수집을 위한 전체 소스 카탈로그.
> Phase 1(7개국) 완료, Phase 2~3 수집 계획용.

---

## 목차
1. [이미 완료된 소스 (Phase 1)](#1-이미-완료된-소스-phase-1)
2. [국제기구 소스 (Phase 2)](#2-국제기구-소스-phase-2)
3. [지역기구 소스 (Phase 3)](#3-지역기구-소스-phase-3)
4. [개별 국가 소스 (Phase 3)](#4-개별-국가-소스-phase-3)
5. [FTA 원문 소스](#5-fta-원문-소스)
6. [데이터 유지보수 자동화 — 추가 필요 항목](#6-데이터-유지보수-자동화--추가-필요-항목)

---

## 1. 이미 완료된 소스 (Phase 1)

| 소스 | 데이터 | 건수 | 저장 위치 |
|------|--------|------|-----------|
| USITC HTSUS | 미국 관세율표 | 35,733건 | /Volumes/soulmaten/POTAL/regulations/us/ |
| CBP CROSS Rulings | 미국 분류결정문 | 220,114건 | /Volumes/soulmaten/POTAL/regulations/us/ |
| eCFR Title 19 | 미국 관세법 | 전문 | /Volumes/soulmaten/POTAL/regulations/us/ |
| eCFR Title 15 (EAR) | 미국 수출통제규정 | 전문 | /Volumes/soulmaten/POTAL/regulations/us/ |
| OFAC SDN | 미국 제재 목록 | 122MB | /Volumes/soulmaten/POTAL/regulations/us/ |
| EU UCC + VAT Directive + CN 2025 | EU 관세법/VAT/관세율표 | 30.2MB | /Volumes/soulmaten/POTAL/regulations/eu/ |
| UK Trade Tariff API | 영국 관세율표 | 99 chapters, 13MB | /Volumes/soulmaten/POTAL/regulations/uk/ |
| Canada Customs Act + Tariff | 캐나다 관세법/율표 | 2.3MB | /Volumes/soulmaten/POTAL/regulations/ca/ |
| Australia Customs/Tariff Act | 호주 관세법 | 134KB | /Volumes/soulmaten/POTAL/regulations/au/ |
| Japan Tariff Schedule | 일본 관세율표 | 96 chapters, 40MB | /Volumes/soulmaten/POTAL/regulations/jp/ |
| Korea Customs Act | 한국 관세법 | 19KB | /Volumes/soulmaten/POTAL/regulations/kr/ |
| WTO Reporters/Indicators | WTO 메타데이터 | 288 reporters, 56 indicators | /Volumes/soulmaten/POTAL/regulations/international/wto/ |
| WTO Tariff Profiles | 국가별 관세 프로필 | 36/227국 (부분) | /Volumes/soulmaten/POTAL/regulations/international/wto/ |
| WCO HS Structure | HS 2022 구조 | 21 sections, 96 chapters | /Volumes/soulmaten/POTAL/regulations/international/wco/ |

**총 수집량**: ~544MB, 310파일, 49 디렉토리

---

## 2. 국제기구 소스 (Phase 2)

### 2.1 WTO Timeseries API ⭐ HIGH
- **URL**: https://apiportal.wto.org/
- **데이터 유형**: Bound/Applied/Preferential 관세율, NTM 지표, 무역 통계
- **형식**: REST API (JSON)
- **예상 데이터량**: 150+ 경제권, 1996년~ 연간 데이터
- **접근 방법**: 무료 API 키 (이미 보유: `e6b00ecdb5b34e09aabe15e68ab71d1d`)
- **업데이트 주기**: 연간 (IDB 데이터), 반기 (WTO Status of Submissions)
- **변경 감지**: API 쿼리로 최신 데이터 여부 확인
- **우선순위**: HIGH — 프로그래밍 방식 관세율 접근, API 키 이미 보유
- **비고**: stats.wto.org 웹 UI로도 접근 가능. Bound rates 보완용

### 2.2 WTO ePing — TBT/SPS 통보문 ⭐ HIGH
- **URL**: https://eping.wto.org/
- **알림 서비스**: https://www.epingalert.org/ (무료 이메일 알림)
- **데이터 유형**: 기술장벽(TBT) + 위생검역(SPS) 통보문
- **형식**: Web UI + API 엔드포인트 (`eping.wto.org/api`)
- **예상 데이터량**: 연간 5,000+ 통보문, 전체 WTO 회원국
- **접근 방법**: 공개 (웹), API는 미문서화
- **업데이트 주기**: 수시 (회원국 통보 시)
- **변경 감지**: **ePing email alerts** — HS 코드/국가별 일간/주간 알림 구독 가능
- **우선순위**: HIGH — 제품 규제 변경 알림, 240개국 RAG에 직접 기여
- **비고**: tbtims.wto.org에서 리다이렉트됨. EN/FR/ES/PT/VI/ZH 지원

### 2.3 WTO TTD (Tariff & Trade Data) — MEDIUM
- **URL**: https://ttd.wto.org/en
- **데이터 유형**: Applied tariffs (IDB) + Bound rates (CTS)
- **형식**: Web UI + 다운로드 섹션 (API 없음)
- **예상 데이터량**: 150+ 경제권
- **접근 방법**: WTO 계정 등록 필요 (무료)
- **업데이트 주기**: 연간
- **변경 감지**: 페이지 해시 비교
- **우선순위**: MEDIUM — MacMap/WITS에서 이미 대부분 커버
- **비고**: tao.wto.org, tdf.wto.org에서 리다이렉트. 베타 버전

### 2.4 UNCTAD TRAINS — 비관세장벽(NTM) ⭐ HIGH
- **URL**: https://trainsonline.unctad.org/home
- **데이터 유형**: 비관세조치 — 기술규정, 적합성 평가, 라이선스, 쿼터, 가격통제
- **형식**: Web UI (Cloudflare 보호), WITS 통합 접근 가능
- **예상 데이터량**: 주요 무역국 전체 NTM 데이터
- **접근 방법**: 공개 웹 / WITS 통합
- **업데이트 주기**: 국가별 상이 (데이터 입수 시)
- **변경 감지**: WITS 통합 또는 Cloudflare 우회 필요
- **우선순위**: HIGH — NTM은 POTAL 데이터의 최대 공백. 제품 제한/수입 라이선스 데이터
- **비고**: Cloudflare 차단으로 직접 접근 어려움. WITS 경유 추천

### 2.5 ITC Rules of Origin Facilitator ⭐ HIGH
- **URL**: https://findrulesoforigin.org/
- **데이터 유형**: FTA별 품목별 원산지규정 (HS6 수준)
- **형식**: Web UI (쿼리 기반, API 없음)
- **예상 데이터량**: 주요 글로벌 FTA 전체 품목별 RoO
- **접근 방법**: 공개, 무료
- **업데이트 주기**: FTA 발효/개정 시
- **변경 감지**: 페이지 해시 비교
- **우선순위**: HIGH — FTA 관세 절감 계산에 핵심. ITC+WCO+WTO+GRIPS 공동 운영
- **비고**: API/벌크 다운로드 없음. 스크래핑 필요. 108+ 언어 지원

### 2.6 WCO Trade Tools — HS Explanatory Notes ⭐ HIGH
- **URL**: https://wcotradetools.org/
- **데이터 유형**: HS Explanatory Notes, 분류 의견, 상관표 (HS2022↔HS2028)
- **형식**: Web 도구 (유료 구독)
- **예상 데이터량**: HS 5,371+ 코드 전체 해설
- **접근 방법**: **유료 구독** (WCO 정책)
- **업데이트 주기**: HSC 세션 후 (연 2회, 3월/9월경)
- **변경 감지**: 페이지 해시 비교 (wcoomd.org 뉴스룸)
- **우선순위**: HIGH — HS 분류 정확도 향상의 결정적 참고 자료
- **비고**: HS Nomenclature 자체는 무료, Explanatory Notes는 유료

### 2.7 WTO I-TIP (NTM 포털) — MEDIUM
- **URL**: https://i-tip.wto.org/goods/default.aspx
- **데이터 유형**: AD/CVD/세이프가드, 수량 제한, SPS/TBT, 국영무역
- **형식**: Web UI (4가지 쿼리 방식), API 없음
- **예상 데이터량**: 전 WTO 회원국, 2001~2020 AD/CVD 데이터
- **접근 방법**: 공개
- **업데이트 주기**: SPS/TBT는 ePing으로 이관, AD/CVD는 수시
- **변경 감지**: 페이지 해시 비교
- **우선순위**: MEDIUM — 무역구제 119,706건 이미 보유. NTM 보완용
- **비고**: SPS/TBT 데이터는 2023까지 업데이트 중단, ePing으로 이관

### 2.8 WITS (World Bank) — MEDIUM
- **URL**: https://wits.worldbank.org/
- **데이터 유형**: MFN/Bound/Preferential 관세율, NTM (TRAINS 통합)
- **형식**: Web UI + API (불안정: 404/405/413 에러)
- **예상 데이터량**: 207개국, HS 6자리+
- **접근 방법**: 공개 (웹), API 불안정
- **업데이트 주기**: 연간 (1-2년 래그)
- **변경 감지**: 페이지 해시 비교
- **우선순위**: MEDIUM — MFN 1,027,674건 이미 보유. API 신뢰도 낮음
- **비고**: SDMX API 소규모 쿼리는 작동. 벌크는 웹 스크래핑 필요

### 2.9 WTO Dispute Settlement — LOW
- **URL**: https://www.wto.org/english/tratop_e/dispu_e/find_dispu_cases_e.htm
- **데이터 유형**: 분쟁 판결문, 패널 보고서, 상소기구 결정
- **형식**: Web 검색 UI (API 없음, 벌크 다운로드 없음)
- **예상 데이터량**: 631+ 협의 요청, 350+ 판결
- **접근 방법**: 공개
- **업데이트 주기**: 수시
- **우선순위**: LOW — 법률 해석용 RAG, 관세 계산에 직접 불필요

### 2.10 WTO TFAD (무역 원활화 협정) — LOW
- **URL**: https://tfadatabase.org/
- **데이터 유형**: TFA 이행 현황 (36개 조치 × 회원국)
- **형식**: Web UI, API 없음
- **접근 방법**: 공개
- **우선순위**: LOW — 통관 절차 정보, 관세율과 직접 무관

### 2.11 ITC Trade Map — LOW
- **URL**: https://www.trademap.org/
- **데이터 유형**: 수출입 통계, 시장점유율
- **형식**: Web UI (유료/무료 혼합)
- **우선순위**: LOW — 무역 통계, 관세율 아님. D15 Intelligence용

### 2.12 World Bank Trading Across Borders — LOW
- **URL**: https://archive.doingbusiness.org/en/data/exploretopics/trading-across-borders
- **데이터 유형**: 수출입 시간/비용 (2019년 데이터, 폐기됨)
- **형식**: Excel/PDF
- **우선순위**: LOW — 2019년 이후 업데이트 중단

### 2.13 IMF DOTS — LOW
- **URL**: https://data.imf.org/
- **데이터 유형**: 양자 무역 흐름 통계
- **형식**: API + Excel (API 타임아웃 빈발)
- **우선순위**: LOW — 무역 통계, 관세율 아님

### 2.14 UN Comtrade — LOW
- **URL**: https://comtrade.un.org/
- **데이터 유형**: 국제 상품 무역 통계
- **형식**: API (구 API 403, 신 API 404 — 전환 중)
- **우선순위**: LOW — 무역 통계, 관세율 아님

### 2.15 UNECE UN/CEFACT — LOW
- **URL**: https://unece.org/trade/uncefact (403 반환)
- **데이터 유형**: 무역 원활화 표준, 전자 세관 신고 XML 스키마
- **우선순위**: LOW — 표준 규격, 데이터 소스 아님

---

## 3. 지역기구 소스 (Phase 3)

### 3.1 EU — EUR-Lex + TARIC ⭐ HIGH
- **EUR-Lex**: https://eur-lex.europa.eu — EU 전체 법률 텍스트 (관세법, FTA, 규정)
- **TARIC 조회**: https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp
- **TARIC RSS**: https://data.europa.eu/api/hub/search/en/feeds/datasets/eu-customs-tariff-taric.rss
- **TARIC API**: https://api.store/ EU 관세 API
- **EBTI (분류결정문)**: https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_home.jsp?Lang=en
- **데이터 유형**: 관세율표 (CN/TARIC), 관세법 (UCC), BTI 분류결정문, FTA 텍스트
- **형식**: HTML/PDF (24개 EU 언어) + API + RSS
- **예상 데이터량**: 9,093 국제 협정, TARIC 매일 업데이트
- **접근 방법**: 공개
- **업데이트 주기**: CN 연간 (10/31 발표, 1/1 시행), TARIC 매일
- **변경 감지**: **TARIC RSS + TARIC API** (최고 수준 자동화 가능)
- **우선순위**: HIGH — 가장 잘 구조화된 소스

### 3.2 ASEAN Trade Repository — MEDIUM
- **URL**: https://atr.asean.org/
- **ASEAN Tariff Finder**: ASEAN 사이트 내
- **데이터 유형**: ATIGA 관세율표, 비관세조치, 원산지규정
- **형식**: Web UI
- **예상 데이터량**: 10개 ASEAN 회원국 관세율표
- **접근 방법**: 공개
- **업데이트 주기**: ATIGA 양허표 변경 시
- **변경 감지**: 페이지 해시 비교
- **우선순위**: MEDIUM

### 3.3 GCC 공동관세율표 — HIGH
- **데이터 유형**: 6개국 통합 관세율표 (SA, UAE, KW, BH, OM, QA)
- **형식**: PDF (GCC 사무국 또는 각국 관세청)
- **예상 데이터량**: ~7,000+ 관세 라인 (대부분 5% 기본세율)
- **접근 방법**: 각국 관세청 PDF 다운로드
- **업데이트 주기**: GCC 공동 결정 시 (드묾)
- **변경 감지**: 각국 관세청 페이지 해시 비교
- **우선순위**: HIGH — 1개 데이터셋으로 6개국 커버
- **비고**: 2025년 6월부터 12자리 통합관세 시행

### 3.4 AfCFTA — MEDIUM
- **URL**: https://au-afcfta.org/
- **e-Tariff Book**: https://au-afcfta.org/etariff/
- **데이터 유형**: 54개 AU 회원국 관세양허표, 원산지규정, 비관세장벽 추적
- **형식**: PDF + Web 플랫폼
- **예상 데이터량**: Phase I 양허 (일부 국가만 제출)
- **접근 방법**: 공개
- **업데이트 주기**: 협상 진행에 따라 수시
- **변경 감지**: 페이지 해시 비교
- **우선순위**: MEDIUM — 아직 이행 초기, 관세양허표 불완전

### 3.5 Mercosur CET (공동대외관세) — MEDIUM
- **데이터 유형**: NCM 8자리 관세율표 (브라질, 아르헨티나, 우루과이, 파라과이)
- **형식**: PDF/Excel (각국 관세청)
- **접근 방법**: WITS TRAINS 또는 각국 관세청
- **우선순위**: MEDIUM — 4개국 동일 관세율표

### 3.6 EAEU 공동관세율표 — MEDIUM
- **데이터 유형**: 러시아, 벨라루스, 카자흐스탄, 아르메니아, 키르기스스탄 공동 관세
- **형식**: Web/PDF (러시아어 중심)
- **접근 방법**: EAEU 위원회 사이트 또는 러시아 관세청
- **우선순위**: MEDIUM — 5개국 커버하지만 러시아어 장벽

### 3.7 EAC (동아프리카공동체) — LOW
- **URL**: https://www.eac.int/customs/tariff-regimes
- **데이터 유형**: CET 관세율표 (케냐, 탄자니아, 우간다, 르완다, 부룬디, 남수단, 콩고DR)
- **우선순위**: LOW

### 3.8 SACU (남부아프리카관세동맹) — MEDIUM
- **데이터 유형**: 공동 관세율표 (남아공, 보츠와나, 레소토, 나미비아, 에스와티니)
- **형식**: SARS 사이트에서 확인 가능
- **접근 방법**: https://www.sars.gov.za/customs-and-excise/tariff/
- **우선순위**: MEDIUM — SARS 데이터로 5개국 커버

### 3.9 CPTPP (포괄적·점진적 환태평양경제동반자협정) ⭐ HIGH
- **URL**: https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cptpp-ptpgp/text-texte/index.aspx
- **회원국**: 11개국 (호주, 브루나이, 캐나다, 칠레, 일본, 말레이시아, 멕시코, 뉴질랜드, 페루, 싱가포르, 베트남) + 영국 가입
- **데이터 유형**: 관세양허표 (11개국 개별 PDF), 원산지규정 (Chapter 3, 품목별)
- **형식**: PDF (4~23MB/국가) + HTML
- **접근 방법**: 공개 직접 다운로드
- **업데이트 주기**: 영국 가입 등 변경 시
- **우선순위**: HIGH — 글로벌 GDP ~13% 커버

### 3.10 RCEP (역내포괄적경제동반자협정) ⭐ HIGH
- **URL**: rcepsec.org (대안: NZ MFAT, AU DFAT, 일본 MOFA)
- **회원국**: 15개국 (ASEAN 10 + 중국, 일본, 한국, 호주, 뉴질랜드)
- **데이터 유형**: 관세양허표 (15개국 개별), 원산지규정 (Chapter 3 + 부속서)
- **형식**: PDF
- **접근 방법**: 공개
- **업데이트 주기**: 양허 단계별 인하 시
- **우선순위**: HIGH — 세계 최대 FTA (GDP 30%)

### 3.11 USMCA (미국-멕시코-캐나다 협정) ⭐ HIGH
- **URL**: https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement/agreement-between
- **데이터 유형**: 관세양허표 (3개국), 품목별 원산지규정 (Chapter 4), 자동차 RVC
- **형식**: PDF (챕터별 개별 파일)
- **접근 방법**: 공개 직접 다운로드
- **업데이트 주기**: 6년 검토 주기 (2026년 예정)
- **우선순위**: HIGH — 북미 무역 핵심

### 3.12 Pacific Alliance (태평양동맹) — MEDIUM
- **회원국**: 칠레, 콜롬비아, 멕시코, 페루
- **데이터 유형**: 관세양허표, 원산지규정
- **형식**: PDF (SICE/OAS 경유)
- **접근 방법**: https://sice.oas.org/
- **우선순위**: MEDIUM

### 3.13 EFTA FTA 네트워크 — MEDIUM
- **URL**: https://www.efta.int/free-trade/free-trade-agreements
- **회원국**: 스위스, 노르웨이, 아이슬란드, 리히텐슈타인
- **데이터 유형**: 30+ FTA 텍스트, 관세양허표, 원산지규정
- **형식**: PDF/HTML
- **접근 방법**: 공개
- **우선순위**: MEDIUM — 스위스/노르웨이 무역 경로

### 3.14 ECOWAS (서아프리카경제공동체) — LOW
- **URL**: https://www.ecowas.int/
- **회원국**: 15개국 (나이지리아, 가나, 세네갈, 코트디부아르 등)
- **데이터 유형**: CET 관세율표
- **우선순위**: LOW

### 3.15 COMESA (동남부아프리카공동시장) — LOW
- **URL**: https://www.comesa.int/
- **회원국**: 21개국
- **데이터 유형**: 공동관세율표, 원산지규정
- **우선순위**: LOW

---

## 4. 개별 국가 소스 (Phase 3)

### 4.1 중국 🇨🇳

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| **China FTA Calculator** | https://fta.mofcom.gov.cn/ftanew/taxSearch.shtml | FTA 특혜세율 (20+ FTA) | HTML (백엔드 API 감지) | 공개, CAPTCHA 필요 | **HIGH** |
| GACC (해관총서) | https://english.customs.gov.cn | 무역통계, 규정 | HTML | SSL 인증서 이슈 | MEDIUM |
| 재정부 관세위원회 | http://gss.mof.gov.cn/gzdt/gszctgzdt/ | 연간 관세율표 조정 공고 | PDF 첨부 | 502 에러 빈발 | HIGH |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

### 4.2 인도 🇮🇳

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| **Indian Trade Portal** | https://indiantradeportal.in | ITC-HS, FTA 세율, GST | HTML (JS 렌더링) | 공개 | **HIGH** |
| CBIC | https://www.cbic.gov.in | 관세법, 통지, 회람 | HTML (JS only) | 공개 | MEDIUM |
| ICEGATE | https://www.icegate.gov.in | EDI, CTH 조회 | HTML/API | 등록 필요, SSL 이슈 | HIGH |
| CBIC API Portal | https://apim.cbic.gov.in/ | 관세 API | REST API | ECONNREFUSED (내부/제한적) | HIGH |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

### 4.3 브라질 🇧🇷

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| **Receita Federal (NCM)** | https://www.gov.br/receitafederal/.../tabela-ncm | NCM 8자리 관세율표 | HTML/PDF/Excel | 공개 | **HIGH** |
| SISCOMEX API (Sifrein) | https://sifrein.siscomex.gov.br/.../api/docs.html | NCM, 세율, 제한품목 | REST API (JSON) | 브라질 내 접근만 가능할 수 있음 | HIGH |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

### 4.4 멕시코 🇲🇽

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| SAT | https://www.sat.gob.mx/.../consulta-la-informacion-arancelaria | TIGIE 관세율표 | HTML (JS) | 403 봇 차단 | HIGH |
| SIICEX | https://www.siicex.gob.mx/.../Fraccion.aspx | TIGIE, FTA, RoO | HTML | ECONNREFUSED | MEDIUM |
| DOF (관보) | https://www.dof.gob.mx/ | 관세 변경 공고 | HTML/PDF | 공개 | MEDIUM |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

### 4.5 터키 🇹🇷

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| 무역부 관세 | https://ticaret.gov.tr/gumruk-islemleri | GTIP (TARIC 기반 8자리) | HTML/PDF | 404 (구조 변경) | HIGH |
| GIB (세무청) | https://www.gib.gov.tr/en | VAT (1%/10%/20%), OTV | HTML | 접근 가능 | MEDIUM |
| EU TARIC | POTAL 기존 인프라 | EU-터키 관세동맹 적용 | API | ✅ 이미 보유 | **HIGH** |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

### 4.6 사우디아라비아 🇸🇦 + UAE 🇦🇪

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| ZATCA (사우디) | https://zatca.gov.sa/en/Pages/default.aspx | GCC 공동관세, VAT 15% | HTML (JS) | 공개 | MEDIUM |
| UAE 관세청 | https://www.customs.ae/ | GCC 통합관세 (12자리) | HTML | 공개 | MEDIUM |
| Dubai Customs | https://www.dubaicustoms.gov.ae/.../TariffSearch.aspx | HS 조회, 세율 | HTML (JS) | 타임아웃 빈발 | MEDIUM |
| **GCC 공동관세** | GCC 사무국 | 6개국 통합 | PDF | 공개 | **HIGH** |

### 4.7 싱가포르 🇸🇬

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| Singapore Customs | https://www.customs.gov.sg/.../hs-classification | STCCED 8자리 | HTML | 403 봇 차단 | HIGH |
| **FTA Network** | https://www.customs.gov.sg/.../trading-under-free-trade-agreements | 27+ FTA 특혜세율, RoO | HTML | 403 봇 차단 | **HIGH** |
| TradeNet | https://www.tradenet.gov.sg | 전자 무역 신고 | API | 등록 필요 (공인 신고인) | MEDIUM |

### 4.8 태국/베트남/인도네시아 🇹🇭🇻🇳🇮🇩

| 국가 | 소스 | URL | 우선순위 | 비고 |
|------|------|-----|---------|------|
| 태국 | Thai Customs | https://www.customs.go.th | HIGH | ECONNREFUSED (불안정) |
| 베트남 | Vietnam Customs | https://www.customs.gov.vn | MEDIUM | 레거시 JSP, 404 빈발 |
| 인도네시아 | **INSW** | https://www.insw.go.id/intr | **HIGH** | BTKI 10자리, React SPA |
| 인도네시아 | DJBC | https://www.beacukai.go.id/btbmi | MEDIUM | INSW로 이관 중 |
| 전체 | **WITS/TRAINS** | wits.worldbank.org | **HIGH** | 3개국 모두 가장 안정적 |

### 4.9 남아공 🇿🇦

| 소스 | URL | 데이터 유형 | 형식 | 접근 | 우선순위 |
|------|-----|------------|------|------|---------|
| **SARS Tariff Book** | https://www.sars.gov.za/customs-and-excise/tariff/ | SACU 관세율표 (Schedule 1-10) | HTML/PDF | 공개 ✅ 접근 확인 | **HIGH** |
| SARS 분류결정 | https://tdn.sars.gov.za/portal/ | 분류 결정문 168+ | HTML | 공개 ✅ 접근 확인 | MEDIUM |
| SARS 관세 개정 | https://www.sars.gov.za/.../tariff-amendments/tariff-amendments-2026/ | 연간 관세 개정 | Government Gazette (PDF) | 공개 ✅ 접근 확인 | MEDIUM |
| MacMap | DB 완료 | NTLC/MIN/AGR | - | ✅ 53개국 포함 | **DONE** |

---

## 5. FTA 원문 소스

### 5.1 WTO RTA Database ⭐ HIGH (마스터 인덱스)
- **URL**: https://rtais.wto.org/UI/PublicMaintainRTAHome.aspx
- **커버리지**: 380+ 통보 RTA + ~67 미통보
- **형식**: HTML 인터페이스, PDF 관세 프로필, "Export all RTAs" 벌크 기능
- **관세양허표**: 특혜관세 분석 도구, PDF 프로필
- **접근**: 공개
- **업데이트 주기**: 회원국 통보 시 수시
- **변경 감지**: 페이지 해시 비교 (RSS/알림 없음)
- **비고**: 원문 직접 호스팅 아님, 외부 링크 제공. 발견/인덱스 도구로 최적

### 5.2 USTR (미국 FTA) ⭐ HIGH
- **URL**: https://ustr.gov/trade-agreements/free-trade-agreements
- **커버리지**: 20개 미국 FTA (호주, 바레인, 캐나다, 칠레, 콜롬비아 등)
- **USMCA 전문**: https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement/agreement-between
- **형식**: PDF (챕터별 개별 파일)
- **관세양허표**: ✅ USMCA: 미국/멕시코/캐나다 관세 철폐 스케줄 별도 PDF
- **원산지규정**: ✅ Chapter 4 품목별 규정
- **접근**: 공개, 직접 다운로드

### 5.3 EU DG Trade + EUR-Lex ⭐ HIGH
- **인덱스**: https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/negotiations-and-agreements_en
- **법률 텍스트**: https://eur-lex.europa.eu
- **커버리지**: 80+ EU FTA (EU-일본 EPA, EU-캐나다 CETA, EU-한국, EU-베트남, EU-싱가포르, EU-영국 TCA, EU-뉴질랜드 등)
- **형식**: PDF/HTML, 24개 EU 언어, CELEX 번호 부여
- **관세양허표**: ✅ Official Journal 부속서
- **원산지규정**: ✅ 각 FTA Protocol 챕터
- **예상 데이터량**: ~59,953 FTA 관련 문서
- **비고**: 가장 잘 구조화된 소스 (CELEX 식별자, 다국어)

### 5.4 CPTPP 전문 ⭐ HIGH
- **URL**: https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cptpp-ptpgp/text-texte/index.aspx
- **커버리지**: 11개 회원국 (호주, 브루나이, 캐나다, 칠레, 일본, 말레이시아, 멕시코, 뉴질랜드, 페루, 싱가포르, 베트남 + 영국 가입)
- **형식**: PDF (관세양허표 4~23MB/국가) + HTML 챕터 텍스트
- **관세양허표**: ✅ 11개국 개별 관세 철폐 스케줄 PDF
- **원산지규정**: ✅ Chapter 3 (품목별 규정 포함)
- **비고**: 캐나다 국제무역부가 주 호스팅. 글로벌 GDP ~13% 커버

### 5.5 RCEP 전문 ⭐ HIGH
- **공식**: rcepsec.org (점검 중이었음)
- **대안**: NZ MFAT, AU DFAT, 일본 MOFA (https://www.mofa.go.jp/policy/economy/page6e_000013.html)
- **커버리지**: 15개 회원국 (ASEAN 10 + 중국, 일본, 한국, 호주, 뉴질랜드)
- **형식**: PDF
- **관세양허표**: ✅ 15개국 개별 스케줄 (대용량 PDF)
- **원산지규정**: ✅ Chapter 3 + 부속서 품목별 규정

### 5.6 SICE/OAS (미주 FTA) ⭐ HIGH
- **URL**: https://sice.oas.org/agreements_e.asp
- **커버리지**: 100+ 협정 (미주 32개국 + 외부 파트너)
- **형식**: PDF/HTML, 영어/스페인어
- **관세양허표**: ✅
- **원산지규정**: ✅
- **비고**: 중남미 FTA의 유일한 종합 소스 (칠레-콜롬비아, Pacific Alliance, CAFTA-DR, 안데안 공동체 등)

### 5.7 UK FTA Network ⭐ HIGH
- **URL**: https://www.gov.uk/government/collections/the-uks-trade-agreements
- **커버리지**: 40개 협정, 74개국 + EU (CPTPP, UK-호주, UK-뉴질랜드, UK-일본 CEPA, UK-EU TCA, UK-인도 등)
- **형식**: PDF
- **관세양허표**: ✅
- **원산지규정**: ✅
- **비고**: Brexit 이후 UK 고유 관세양허표 — EU 소스에 없음

### 5.8 국가별 FTA 포털 — MEDIUM

| 국가 | URL | FTA 수 |
|------|-----|--------|
| 호주 DFAT | https://www.dfat.gov.au/trade/agreements | ~16 |
| 뉴질랜드 MFAT | https://www.mfat.govt.nz/en/trade/free-trade-agreements/free-trade-agreements-in-force/ | ~17 |
| 한국 FTA | https://fta.motir.go.kr/ | ~23 |
| 일본 MOFA | https://www.mofa.go.jp/policy/economy/fta/index.html | ~21 |
| 캐나다 | https://international.canada.ca/.../investment-agreements | ~75 |
| 싱가포르 | https://www.enterprisesg.gov.sg/.../free-trade-agreements/overview | ~27 |

### 5.9 ITC Rules of Origin Facilitator — HIGH (RoO 전용)
- **URL**: https://findrulesoforigin.org/
- **관세양허표**: ❌
- **원산지규정**: ✅ HS6 수준 품목별 RoO, 주요 글로벌 FTA 전체
- **비고**: 벌크 다운로드/API 없음. 스크래핑 필요

### 5.10 ADB ARIC — MEDIUM (메타데이터)
- **URL**: https://aric.adb.org/fta
- **커버리지**: 아시아-태평양 48개국 FTA
- **형식**: HTML 데이터베이스
- **관세양허표**: ❌ (메타데이터/분석만)

### 5.11 TRALAC (아프리카 FTA) — MEDIUM
- **URL**: https://www.tralac.org (403 반환)
- **커버리지**: AfCFTA, SADC, EAC, ECOWAS, COMESA 등
- **대안**: https://au.int/en/documents (아프리카연합)

### FTA 소스 요약

| 우선순위 | 소스 | 관세양허표 | 원산지규정 | 형식 |
|---------|------|-----------|-----------|------|
| **HIGH** | USTR | ✅ | ✅ | PDF |
| **HIGH** | EU DG Trade + EUR-Lex | ✅ | ✅ | PDF/HTML, 24언어 |
| **HIGH** | CPTPP (캐나다) | ✅ (11국) | ✅ | PDF |
| **HIGH** | SICE/OAS | ✅ | ✅ | PDF/HTML |
| **HIGH** | UK GOV.UK | ✅ | ✅ | PDF |
| **HIGH** | ITC RoO Facilitator | ❌ | ✅ (HS6별) | HTML |
| **HIGH** | WTO RTA DB | 분석 도구 | 인덱스 | HTML/PDF |
| **HIGH** | RCEP (대안 호스트) | ✅ (15국) | ✅ | PDF |
| MEDIUM | 국가별 FTA 포털 (6개국) | ✅ | ✅ | PDF |
| MEDIUM | ADB ARIC | ❌ | ❌ | HTML |
| MEDIUM | TRALAC | 일부 | 일부 | PDF |

**핵심 인사이트**:
- 5~6개 HIGH 소스로 63개 FTA 대부분 커버 가능
- 관세양허표는 국가별/FTA별 개별 PDF (CPTPP 11개, RCEP 15개 등 → 수백 개 PDF, 수 GB)
- 품목별 원산지규정은 ITC findrulesoforigin.org가 유일한 구조화 소스 (API 없음)
- EUR-Lex가 가장 자동화 친화적 (CELEX ID, 24언어, HTML 구조화)

---

## 6. 데이터 유지보수 자동화 — 추가 필요 항목

### 6.1 product_hs_mappings 품질 검증

현재 POTAL에 ~1.36M 매핑이 있으나 주기적 정확도 검증 체계가 없다.

| 벤치마크 소스 | URL | 업데이트 주기 | 감지 방법 | 비고 |
|--------------|-----|-------------|----------|------|
| **WCO 분류 결정/의견** | https://www.wcoomd.org/.../classification-decisions.aspx | HSC 세션 후 연 2회 (3월/9월) | 페이지 해시 비교 | Compendium은 유료 (wcotradetools.org) |
| **CBP CROSS Rulings** | https://rulings.cbp.gov/ | 월 수회 (예: 2일간 77건) | 홈페이지 해시 ("Last updated [date] with [N] rulings") | 이미 220,114건 보유. 신규분 정기 수집 필요 |
| **EU EBTI** | https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_home.jsp?Lang=en | 상시 (회원국 발급 시) | 날짜 범위 쿼리 | BTI 유효기간 3년. 연간 ~50M 조회 |
| **UK ATaR** | https://www.tax.service.gov.uk/search-for-advance-tariff-rulings/ | 상시 (30~120일 내 발급) | 날짜별 검색 + 해시 비교 | Brexit 이후 EU EBTI와 별도 |
| **Global Trade Alert** | https://globaltradealert.org/ | 거의 실시간 | 웹 모니터링 | 국가별 관세 개입 추적 |

**권장 자동화**: Vercel Cron 주 1회 → CBP CROSS 홈페이지 + EU EBTI 최신 날짜 쿼리 → 신규 분류 결정과 기존 매핑 교차 검증

### 6.2 WCO HS Code 개정 감지

| 항목 | 내용 |
|------|------|
| **다음 개정** | HS 2028 (2028년 1월 1일 시행) |
| **현재 상태** | 2025년 6월 WCO 이사회 채택, 2025년 7월~12월 이의제기 기간, 2026년 1월 최종 발표 |
| **변경 내용** | 299 세트 개정안 |
| **상관표** | HS2022→HS2028 (2026~2027년 개발 중, 아직 미공개) |
| **이전 상관표 참고** | https://www.wcoomd.org/.../correlation-tables-hs-2017-2022.aspx |
| **공고 페이지** | https://www.wcoomd.org/en/media/newsroom/ |
| **감지 방법** | 페이지 해시 비교 (RSS/API 없음), 월 1회 체크 |
| **POTAL 액션** | 상관표 공개 시 → product_hs_mappings 마이그레이션 계획 수립 |

### 6.3 7개국 정부 관세율표 연간 개정

| 국가 | 관세청 | 개정 공고 URL | 개정 시기 | 감지 방법 |
|------|--------|-------------|----------|----------|
| **US** | USITC | https://www.usitc.gov/harmonized_tariff_information/modifications_to_hts | 연간 (1/1) + 수시 | **Federal Register API** ⭐ (REST, JSON, 기관/주제 필터) + RSS + 이메일 |
| **EU** | DG TAXUD | https://taxation-customs.ec.europa.eu/customs/customs-tariff/eu-customs-tariff-taric_en | CN 연간 (10/31 발표, 1/1 시행), TARIC 매일 | **TARIC RSS** ⭐ + **TARIC API** |
| **UK** | HMRC | https://www.trade-tariff.service.gov.uk/news | 연간 (1/1) + 수시 Statutory Instruments | 이메일 구독 (tariffmanagement@hmrc.gov.uk) + legislation.gov.uk RSS |
| **Canada** | CBSA | https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html | 연간 (1/1) + 수시 | Customs Notices 페이지 해시 비교 |
| **Australia** | ABF | https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff | 연간 (1/1 또는 7/1) + Gazette | ABF Newsroom 해시 비교 |
| **Japan** | Japan Customs | https://www.customs.go.jp/english/tariff/index.htm | 연간 (1/1, 때때로 4/1 중간 갱신) | 관세율표 인덱스 페이지 해시 비교 |
| **Korea** | KCS | https://www.customs.go.kr/english/ad/ct/CustomsTariffList.do?mi=8037 | 연간 (1/1) + 대통령령 | 영문 포털 해시 비교 |

**최고 자동화 가능 소스**: US (Federal Register REST API), EU (TARIC RSS + API)
**나머지**: 주간 페이지 해시 비교 (Vercel Cron)

### 6.4 FTA 신규 체결 / 양허표 변경 감지

| 감지 대상 | 소스 | URL | 감지 방법 | 체크 주기 |
|----------|------|-----|----------|----------|
| 신규 RTA 통보 | WTO RTA-IS | https://rtais.wto.org/ | 페이지 해시 비교 (RSS 없음) | 주간 |
| SPS/TBT 통보 | **ePing** | https://www.epingalert.org/ | **이메일 알림** ⭐ (무료, HS/국가 맞춤) | 자동 (일/주간) |
| 미국 FTA | USTR | https://ustr.gov/trade-agreements | 페이지 해시 비교 | 주간 |
| EU FTA | Access2Markets | https://trade.ec.europa.eu/access-to-markets/en/content/trade-agreements | 페이지 해시 비교 | 주간 |
| 영국 FTA | DIT/DBT | https://www.gov.uk/government/collections/the-uks-trade-agreements | 페이지 해시 비교 | 주간 |
| 캐나다 FTA | GAC | https://www.international.gc.ca/.../agr-acc/index.aspx | 페이지 해시 비교 | 주간 |
| 호주 FTA | DFAT | https://www.dfat.gov.au/trade/agreements | 페이지 해시 비교 | 주간 |
| 일본 EPA | MOFA | https://www.mofa.go.jp/policy/economy/fta/index.html | 페이지 해시 비교 | 주간 |
| 한국 FTA | KCS | https://www.customs.go.kr/engportal/cm/cntnts/cntntsView.do?mi=7312&cntntsId=2334 | 페이지 해시 비교 | 주간 |

### 6.5 MacMap/WITS 연간 데이터 갱신

| 소스 | 업데이트 주기 | 확인 방법 | URL |
|------|-------------|----------|-----|
| **MacMap** | 연 1회/국가 (국가별 상이) | `macmap.org/en/about/data-availability` 페이지의 "Last update" 필드 | https://www.macmap.org/en/about/data-availability |
| **WITS** | 연간 (1~2년 래그) | wits.worldbank.org 메인 페이지 체크 | https://wits.worldbank.org/ |
| **WTO IDB** | 연간 (회원국 통보), 6개월마다 Status of Submissions 발표 | ttd.wto.org | https://ttd.wto.org/en |

**감지 방법**: MacMap data-availability 페이지 월 1회 해시 비교
**연락처**: marketanalysis@intracen.org (ITC MacMap 팀)
**비고**: 알림 시스템 없음. 수동 폴링만 가능

### 6.6 240개국 관세 변경 공고 페이지 URL 목록 (상위 50개국)

Cowork 12에서 설계한 "공고 페이지 해시 비교" Vercel Cron 자동화에 필요한 실제 URL.

| # | 국가 | 관세청 | 변경 공고 URL | 감지 방법 |
|---|------|--------|-------------|----------|
| 1 | **US** | USITC/CBP | https://www.usitc.gov/harmonized_tariff_information/modifications_to_hts | **Federal Register API** ⭐ |
| 2 | **EU** (27국 포함) | DG TAXUD | https://taxation-customs.ec.europa.eu/customs/customs-tariff/eu-customs-tariff-taric_en | **TARIC RSS + API** ⭐ |
| 3 | **UK** | HMRC | https://www.trade-tariff.service.gov.uk/news | **이메일** + 해시 |
| 4 | **Canada** | CBSA | https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html | 해시 |
| 5 | **Australia** | ABF | https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff | 해시 |
| 6 | **Japan** | Japan Customs | https://www.customs.go.jp/english/tariff/index.htm | 해시 |
| 7 | **Korea** | KCS | https://www.customs.go.kr/english/ad/ct/CustomsTariffList.do?mi=8037 | 해시 |
| 8 | **China** | GACC | http://english.customs.gov.cn/ | 해시 |
| 9 | **India** | CBIC | https://www.cbic.gov.in/entities/cbic-content-mst/Njk= | 해시 |
| 10 | **Brazil** | Receita Federal | https://www.gov.br/receitafederal/ | 해시 (DOU 관보) |
| 11 | **Mexico** | SAT | https://www.dof.gob.mx/ (관보 DOF) | 해시 |
| 12 | **Turkey** | 무역부 | https://ticaret.gov.tr/gumruk-islemleri | 해시 |
| 13 | **Saudi Arabia** | ZATCA | https://zatca.gov.sa/en/Pages/default.aspx | 해시 |
| 14 | **UAE** | 연방관세청 | https://www.customs.ae/ | 해시 |
| 15 | **Singapore** | Singapore Customs | https://www.customs.gov.sg/news-and-media/ | 해시 |
| 16 | **Thailand** | Thai Customs | https://www.customs.go.th | 해시 |
| 17 | **Vietnam** | Vietnam Customs | https://www.customs.gov.vn/index.jsp?pageId=3&cid=30 | 해시 |
| 18 | **Indonesia** | DJBC | https://www.beacukai.go.id/ | 해시 |
| 19 | **South Africa** | SARS | https://www.sars.gov.za/legal-counsel/secondary-legislation/tariff-amendments/tariff-amendments-2026/ | 해시 |
| 20 | **Russia** | FCS | https://customs.gov.ru/ | 해시 |
| 21 | **Switzerland** | BAZG | https://www.bazg.admin.ch/.../zolltarif-tares.html | 해시 |
| 22 | **Norway** | Tolletaten | https://www.toll.no/en/corporate/norwegian-customs-tariff/ | 해시 |
| 23 | **New Zealand** | NZ Customs | https://www.customs.govt.nz/about-us/news/important-notices/ | 해시 |
| 24 | **Israel** | 관세청 | https://shaarolami-query.customs.mof.gov.il/CustomspilotWeb/en/CustomsBook/Import/Doubt | 해시 |
| 25 | **Chile** | Aduanas | https://www.aduana.cl/ | 해시 |
| 26 | **Colombia** | DIAN | https://www.dian.gov.co/ | 해시 |
| 27 | **Peru** | SUNAT | https://www.sunat.gob.pe/customsinformation/ | 해시 |
| 28 | **Argentina** | AFIP/Aduana | https://www.afip.gob.ar/aduana/ | 해시 |
| 29 | **Philippines** | Tariff Commission | https://finder.tariffcommission.gov.ph/ | 해시 |
| 30 | **Malaysia** | JKDM | https://www.customs.gov.my/en/ip/Pages/ip_trfv.aspx | 해시 |
| 31 | **Taiwan** | Customs Admin | https://web.customs.gov.tw/en/multiplehtml/3349 | 해시 |
| 32 | **Hong Kong** | C&ED | https://www.customs.gov.hk/en/service-enforcement-information/trade-facilitation/fta/update/ | 해시 |
| 33 | **Egypt** | 관세청 | http://www.fei.org.eg/tariff/tariff.php | 해시 |
| 34 | **Nigeria** | NCS | https://customs.gov.ng/?page_id=3133 | 해시 |
| 35 | **Kenya** | KRA + EAC | https://www.eac.int/customs/tariff-regimes | 해시 |
| 36 | **Morocco** | Douanes | https://www.douane.gov.ma/ | 해시 |
| 37 | **Pakistan** | FBR | https://www.fbr.gov.pk/categ/customs-tariff/51149/70853/131188 | 해시 |
| 38 | **Bangladesh** | NBR | https://nbr.gov.bd/taxtype/tariff-schedule/eng | 해시 |
| 39 | **Sri Lanka** | Customs | https://www.customs.gov.lk/customs-tariff/ | 해시 |
| 40 | **Cambodia** | GDCE | https://www.customs.gov.kh/ | 해시 |
| 41 | **Myanmar** | Customs | https://www.customs.gov.mm/ | 해시 |
| 42 | **Laos** | Customs | https://www.customs.gov.la/ | 해시 |
| 43 | **Oman** | Royal Oman Police | https://www.rop.gov.om/ | 해시 |
| 44 | **Bahrain** | Customs Affairs | https://www.bahraincustoms.gov.bh/ | 해시 |
| 45 | **Kuwait** | GAC | https://www.customs.gov.kw/ | 해시 |
| 46 | **Qatar** | GAC | https://www.customs.gov.qa/ | 해시 |
| 47 | **Jordan** | Jordan Customs | https://www.customs.gov.jo/en | 해시 |
| 48 | **Ukraine** | SCS | https://customs.gov.ua/en | 해시 |
| 49 | **Poland** | EU 회원국 | (EU TARIC 동일) | TARIC RSS |
| 50 | **Czech Republic** | EU 회원국 | (EU TARIC 동일) | TARIC RSS |

**API가 있는 소스 (최고 자동화)**:
1. **US Federal Register** — REST API, JSON, 기관/주제 필터 가능
2. **EU TARIC** — RSS 피드 + REST API (data.europa.eu)
3. **ePing** — 무료 이메일 알림 (SPS/TBT, HS/국가 맞춤)

**나머지 47개국**: 주간 페이지 해시 비교 (Vercel Cron)

### 권장 구현 계획

| 단계 | 작업 | 비용 | 효과 | 상태 |
|------|------|------|------|------|
| **1단계** | ePing 이메일 알림 구독 (SPS/TBT) | $0 | 제품 규제 변경 자동 감지 | ✅ 설정 가이드 작성 (아래 참고) |
| **2단계** | US Federal Register API 연동 (Vercel Cron 일간) | $0 | 미국 관세 변경 실시간 감지 | ✅ `api/v1/cron/federal-register-monitor` |
| **3단계** | EU TARIC RSS 구독 (Vercel Cron 일간) | $0 | EU 관세율 변경 일간 감지 | ✅ `api/v1/cron/taric-rss-monitor` |
| **4단계** | 50개국 공고 페이지 해시 비교 Vercel Cron (주간) | $0 | 50개국 관세 변경 감지 | ✅ `api/v1/cron/tariff-change-monitor` |
| **5단계** | CBP CROSS + EU EBTI 신규 분류결정문 수집 (주간) | $0 | product_hs_mappings 품질 검증 | ✅ `api/v1/cron/classification-ruling-monitor` |
| **6단계** | MacMap data-availability 폴링 (월간) | $0 | MIN/AGR 데이터 갱신 시점 감지 | ✅ `api/v1/cron/macmap-update-monitor` |
| **7단계** | WCO 뉴스룸 모니터 (월간) | $0 | HS 2028 상관표 공개 감지 | ✅ `api/v1/cron/wco-news-monitor` |
| **8단계** | WTO RTA-IS + 7개국 FTA 포털 해시 (주간) | $0 | 신규 FTA 감지 | ✅ `api/v1/cron/fta-change-monitor` |

**총 비용**: 일일 ~$0 (Vercel Cron 무료 티어 내)
**Vercel Cron 총 21개** (기존 14 + 신규 7)

### ePing 이메일 알림 구독 설정 가이드 (1단계)

ePing은 WTO의 무료 SPS/TBT 통보 알림 서비스. 수동 구독이 필요하다.

**구독 URL**: https://www.epingalert.org/

**설정 순서**:
1. https://www.epingalert.org/ 접속
2. "Sign Up" 또는 "Register" 클릭
3. 이메일: `contact@potal.app` 입력
4. 알림 설정:
   - **Products**: "All products" 선택 (또는 HS 전체 섹션 선택)
   - **Countries**: "All WTO members" 선택 (240개국 최대 커버)
   - **Frequency**: "Weekly digest" 권장 (일간은 과도)
   - **Type**: TBT + SPS 둘 다 선택
5. 이메일 인증 완료

**결과**: 매주 contact@potal.app로 전 세계 SPS/TBT 통보 요약 수신.
**비용**: $0
**활용**: 제품 규제 변경 사전 감지 → regulation_vectors RAG 업데이트 트리거

### Vercel Cron 스케줄 요약 (신규 7개)

| Cron | 경로 | 스케줄 | 주기 |
|------|------|--------|------|
| Federal Register | `/api/v1/cron/federal-register-monitor` | `0 6 * * *` | 매일 06:00 UTC |
| TARIC RSS | `/api/v1/cron/taric-rss-monitor` | `0 7 * * *` | 매일 07:00 UTC |
| 50국 관세 변경 | `/api/v1/cron/tariff-change-monitor` | `0 5 * * 0` | 매주 일 05:00 UTC |
| 분류결정문 | `/api/v1/cron/classification-ruling-monitor` | `0 6 * * 3` | 매주 수 06:00 UTC |
| MacMap 갱신 | `/api/v1/cron/macmap-update-monitor` | `0 8 1 * *` | 매월 1일 08:00 UTC |
| WCO 뉴스 | `/api/v1/cron/wco-news-monitor` | `0 8 15 * *` | 매월 15일 08:00 UTC |
| FTA 변경 | `/api/v1/cron/fta-change-monitor` | `0 6 * * 5` | 매주 금 06:00 UTC |

모든 Cron 공통: CRON_SECRET 인증 + health_check_logs 기록 + 변경 감지 시 Resend 이메일 알림
