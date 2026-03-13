# 240개국 관세/세법/무역규정 데이터 수집 프로젝트 — Claude Code 명령어

## 목표
전 세계 240개국의 관세법, 세법, 수출입 규정, 분류 결정문, 무역협정 원문을 전부 수집하여 외장하드 /Volumes/soulmaten/POTAL/regulations/ 폴더에 저장.
이 데이터는 향후 벡터 DB(RAG)에 넣어서 "240개국 관세사/세무사 AI"를 만드는 기초 데이터임.
하나도 빠짐없이 가져와야 함. 수집 가능한 모든 소스를 탐색하고, 벌크 다운로드 가능하면 전부 다운로드.

## 절대 규칙
- 한 번에 하나의 다운로드만 (병렬 실행 금지)
- 각 소스별 다운로드 완료 후 파일 수/용량 기록
- 진행상황을 COLLECTION_LOG.md에 실시간 기록
- 에러 발생 시 스킵하지 말고 재시도 3회 후 로그에 기록
- **저장 위치: 외장하드** /Volumes/soulmaten/POTAL/regulations/ (local 저장공간 부족)

## 저장 구조
/Volumes/soulmaten/POTAL/regulations/ 아래에 국가별/기관별 폴더를 만들어서 저장:
- us/ (미국): htsus/, cross_rulings/, cfr_title19/, ear/, sales_tax/
- eu/ (EU): taric/, eur_lex/, bti_rulings/, fta_texts/
- uk/ (영국): trade_tariff/, hmrc_guides/, rulings/
- ca/ (캐나다): cbsa_tariff/, d_memoranda/, advance_rulings/
- au/ (호주): abf_tariff/, classification_decisions/, customs_act/
- jp/ (일본): tariff_schedule/, advance_rulings/, customs_law/
- kr/ (한국): tariff_schedule/, pre_rulings/, customs_law/, fta_rates/
- international/ (국제기구): wto/, wits_unctad/, macmap/, wco/
- regional/ (지역협정): asean/, gcc/, afcfta/, mercosur/, cptpp/, rcep/
- remaining/ (개별 국가): cn/, in/, br/ 등 국가코드별

## Phase 1 — 7개국 정부 공식 데이터 (최우선)

### 미국 (US)
1. HTSUS 전체 다운로드: https://hts.usitc.gov/ — 관세율표 전체 (PDF/Excel/XML)
2. CBP CROSS 분류 결정문: https://rulings.cbp.gov/ — 사전심사 결정문 22만건+ 전부 스크래핑
3. CFR Title 19 (관세법): https://www.ecfr.gov/current/title-19 — 관세법 전문 다운로드
4. EAR (수출관리규정): https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C — 전문 다운로드
5. OFAC 제재 리스트: https://sanctionslist.ofac.treas.gov/ — SDN/CSL 전체 (이미 있으면 최신화)
6. US Sales Tax 규정: 주별 세율 + 규칙 (Tax Foundation 등 공개 소스)

### EU
1. TARIC 전체: https://ec.europa.eu/taxation_customs/dds2/taric/ — 관세율표+규제 조치 전체
2. EUR-Lex 관세법: https://eur-lex.europa.eu/ — Union Customs Code (UCC) + 시행규칙 전문
3. BTI 분류 결정문: https://ec.europa.eu/taxation_customs/dds2/ebti/ — 구속적 관세분류 결정문 전부
4. EU VAT Directive: EUR-Lex에서 VAT 지침 전문
5. EU FTA 원문: EUR-Lex에서 EU가 체결한 모든 FTA 원문

### 영국 (UK)
1. UK Trade Tariff API: https://api.trade-tariff.service.gov.uk/ — 전체 관세율표 API로 수집
2. HMRC 관세 가이드: https://www.gov.uk/guidance/customs-procedures — 통관 절차 전체
3. UK 분류 결정문: HMRC Classification Opinions 전부

### 캐나다 (CA)
1. CBSA 관세표: https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/ — 전체 다운로드
2. CBSA D-Memoranda: https://www.cbsa-asfc.gc.ca/publications/dm-md/ — 관세 메모랜덤 전부 (정책 해석)
3. CBSA 사전심사 결정문: Advance Ruling 전부

### 호주 (AU)
1. ABF 관세표: https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification — 전체
2. ABF 분류 결정문: Tariff Classification decisions 전부
3. 호주 관세법: Customs Act 1901 + Customs Tariff Act 1995

### 일본 (JP)
1. 관세율표: https://www.customs.go.jp/english/tariff/ — 전체 다운로드
2. 事前教示 (사전심사): https://www.customs.go.jp/english/advance/index.htm — 결정문 전부
3. 관세법 원문: 일본어 + 영어 버전

### 한국 (KR)
1. 관세율표: https://www.customs.go.kr/ — HS 10자리 전체
2. 품목분류 사전심사: 관세청 결정문 전부
3. 관세법: 법령정보센터 — 관세법 + 시행령 + 시행규칙 전문
4. FTA 특혜세율: 한국이 체결한 모든 FTA 세율표

## Phase 2 — 국제기구 데이터 (다국가 일괄)

1. WTO IDB (Integrated Database): https://www.wto.org/ — 150개국+ 관세 데이터 벌크
2. WITS/UNCTAD TRAINS: https://wits.worldbank.org/ — 비관세조치(NTM) 65,000건+ 109개국 벌크
3. ITC MacMap 규제 데이터: https://www.macmap.org/ — 무역구제+비관세조치 (이미 접근권 있음)
4. WTO RTA Database: https://rtais.wto.org/ — 모든 지역무역협정(FTA/RTA) 원문
5. UNCTAD Rules of Origin: https://www.unctad.org/ — 300개+ 무역협정 원산지 규칙 전문
6. WCO HS 설명서 (Explanatory Notes): 유료 여부 확인 후 가능한 범위 수집
7. OECD Trade Facilitation Indicators: https://www.oecd.org/trade/topics/trade-facilitation/ — 160개국+

## Phase 3 — 지역/나머지 국가

1. EU 27개국: EUR-Lex에서 국가별 VAT 세율 + 특수 규정
2. ASEAN 10개국: https://atr.asean.org/ — ASEAN Trade Repository, 관세+NTM
3. GCC 6개국: GCC 통합 관세표 (사우디, UAE, 쿠웨이트, 카타르, 바레인, 오만)
4. AfCFTA 55개국: 아프리카 대륙자유무역지대 관세 양허표
5. Mercosur 4개국: 공동대외관세(CET) 전체
6. 태평양 동맹: 칠레, 콜롬비아, 멕시코, 페루 관세 데이터
7. CPTPP 11개국: 포괄적·점진적 환태평양경제동반자협정 양허표
8. RCEP 15개국: 역내포괄적경제동반자협정 양허표
9. 나머지 개별 국가: 각국 관세청 웹사이트에서 관세율표 + 규정 수집 가능한 만큼

## 수집 우선순위
1. 벌크 다운로드 가능한 것 먼저 (CSV, XML, JSON, Excel)
2. API 있으면 API로 전량 수집
3. PDF만 있으면 PDF 다운로드 후 목록화
4. 웹페이지만 있으면 HTML 스크래핑

## 완료 기준
- 각 소스별 다운로드 파일 수, 용량, 포맷을 /Volumes/soulmaten/POTAL/regulations/COLLECTION_LOG.md에 기록
- 에러/접근불가 소스도 기록 (이유 포함)
- Phase 1 완료 후 Phase 2 시작, Phase 2 완료 후 Phase 3 시작
- 전체 완료 시 총 파일 수/용량/국가 커버리지 요약

Phase 1부터 시작해. 한 번에 하나의 소스만 다운로드하고, 완료되면 다음으로 넘어가.
