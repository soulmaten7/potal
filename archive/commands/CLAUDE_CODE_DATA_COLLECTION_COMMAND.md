# Claude Code 데이터 수집 명령어
# 2026-03-16 생성 — Cowork CW15

## 사용법
아래 전체를 Claude Code 터미널 (1번 또는 3번, 업로드 안 하는 터미널)에 복사-붙여넣기

---

## 명령어

```
지금부터 POTAL에 필요한 미수집 데이터를 순차적으로 수집해줘.
저장 경로: /Volumes/soulmaten/POTAL/ 아래에 각 소스별 폴더.
수집 완료된 것은 product_hs_mappings CSV 형태로도 변환해둬.
한 번에 하나씩, 완료 후 다음으로 넘어가.

### P0 — 즉시 수집 (8개)

**P0-1. CBLE Past Exams (미국 관세사 기출)**
- URL: https://www.cbp.gov/trade/programs-administration/customs-brokers/license-examination-notice-examination
- 할 일: CBP 웹사이트에서 CBLE past exams PDF 전부 다운로드
- 각 PDF에서 문제+정답 추출 (OCR 필요하면 사용)
- HS 분류 관련 문제만 별도 추출 → /Volumes/soulmaten/POTAL/benchmark/cble/hs_questions.json
- 나머지 문제도 영역별 분류 → /Volumes/soulmaten/POTAL/benchmark/cble/all_questions.json
- 결과: 각 문제에 {question, answer, domain, potal_feature_id} 매핑

**P0-2. EU EBTI Rulings (유럽 분류 결정문)**
- URL: https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_consultation.jsp
- 할 일: HS 챕터 01~97 순차 검색, 각 결정문에서:
  - goods_description (상품 설명)
  - classification (CN 코드)
  - 결정문 번호, 날짜
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_rulings.csv
- product_hs_mappings 형태 CSV도 생성: product_name, hs_code, confidence=1.0, source=ebti, country=EU
- 요청 간격: 1-2초 (서버 부하 방지)
- 목표: 50K-100K건

**P0-3. EU ECICS Chemical DB (화학물질 70K)**
- URL: https://ec.europa.eu/taxation_customs/dds2/ecics/chemicalsubstance_consultation.jsp
- 할 일: 화학물질 데이터베이스 전체 크롤링
  - substance_name, cas_number, cn_code, molecular_formula
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/eu_ecics/ecics_chemicals.csv
- product_hs_mappings 형태도: product_name=substance_name, hs_code=cn_code, source=ecics
- 목표: ~70K건

**P0-4. UK ATaR Rulings (영국 분류 결정문)**
- URL: https://www.trade-tariff.service.gov.uk/ (API 확인) 또는 GOV.UK ATaR 검색
- 할 일: UK Advance Tariff Ruling 데이터 수집
  - goods_description, commodity_code, ruling_reference
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/uk_atar/uk_atar_rulings.csv
- product_hs_mappings 형태도 생성
- 목표: ~10K+건

**P0-5. ATLAS Dataset (18,731 CBP rulings)**
- 논문: arXiv:2509.18400
- 할 일: GitHub, HuggingFace, Zenodo에서 "ATLAS HS classification" 또는 "tariff classification benchmark" 검색
- 논문 저자/기관의 GitHub 확인
- 데이터셋 다운로드 → /Volumes/soulmaten/POTAL/benchmark/atlas/
- 형태: ruling_id, product_description, hts_code (18,731건)

**P0-6. HSCodeComp Dataset (632 products)**
- 할 일: arxiv, semantic scholar, GitHub, HuggingFace에서 "HSCodeComp" 검색
- 632 expert-annotated 이커머스 상품 데이터셋 다운로드
- /Volumes/soulmaten/POTAL/benchmark/hscodecomp/

**P0-7. 한국 관세사 기출문제**
- URL: https://www.q-net.or.kr/ + 관세사 기출문제 사이트들
- 할 일: 최근 5-10년 관세사 1차/2차 시험 기출문제 수집
- 품목분류 문제만 별도 추출 → /Volumes/soulmaten/POTAL/benchmark/korea_customs/hs_questions.json
- 전체 문제도 저장

**P0-8. 日本 通関士 過去問**
- URL: https://www.customs.go.jp/tetsuzuki/c-answer/shiken/
- 할 일: 最近5年分の通関士試験 過去問 다운로드
- 品目分類 문제만 추출 → /Volumes/soulmaten/POTAL/benchmark/japan_customs/hs_questions.json

### P1 — 이어서 수집 (5개)

**P1-1. BIS Commerce Control List (ECCN)**
- URL: https://www.bis.gov/regulations/commerce-control-list-ccl
- 할 일: EAR Part 774 CCL에서 전체 ECCN 코드 + 품목 설명 + 통제 사유 추출
- /Volumes/soulmaten/POTAL/regulations/us_bis/eccn_list.csv

**P1-2. UN Dangerous Goods List**
- URL: https://unece.org/transport/dangerous-goods
- 할 일: UN Number + 품명 + 위험등급 + 포장그룹 추출
- /Volumes/soulmaten/POTAL/regulations/un_dg/un_dg_list.csv

**P1-3. WTO Customs Valuation Agreement**
- URL: https://www.wto.org/english/docs_e/legal_e/20-val.pdf
- 할 일: PDF 다운로드, 규정 RAG용 텍스트 추출
- /Volumes/soulmaten/POTAL/regulations/wto/

**P1-4. FTA PSR Lists (63 FTA 원산지 규정)**
- URL: WTO RTA-IS + 주요 FTA 포털
- 할 일: 주요 FTA (USMCA, RCEP, CPTPP, KORUS, EU-UK TCA)부터 PSR 목록 수집
- /Volumes/soulmaten/POTAL/regulations/fta_psr/

**P1-5. EU TARIC VAT Rates**
- URL: https://ec.europa.eu/taxation_customs/dds2/taric/
- 할 일: CN 코드별 VAT 세율 (표준/경감/면세) 추출
- /Volumes/soulmaten/POTAL/regulations/eu_taric_vat/

### 공통 규칙
- 한 번에 하나의 소스만 수집 (동시 다운로드 금지)
- 서버에 1-2초 간격 요청 (크롤링 예의)
- 진행 상황 로그: /Volumes/soulmaten/POTAL/data_collection.log
- 각 소스 완료 시 건수 보고
- product_hs_mappings 형태 CSV가 가능한 소스는 반드시 변환본도 생성
- 다운로드 불가능한 소스는 이유 보고 + 대안 제시
```
