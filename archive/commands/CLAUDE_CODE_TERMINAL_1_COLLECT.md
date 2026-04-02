# 터미널 1 — 데이터 수집 (P0 8개 + P1 5개)
# 복사-붙여넣기해서 실행

```
지금부터 POTAL에 필요한 미수집 데이터를 순차적으로 수집해줘.
저장 경로: /Volumes/soulmaten/POTAL/ 아래에 각 소스별 폴더.
한 번에 하나씩, 완료 후 다음으로 넘어가.
진행 로그: /Volumes/soulmaten/POTAL/data_collection.log

### 완료 신호 파일 규칙 (중요!)
각 소스 수집이 완료되면 반드시 아래 완료 신호 파일을 생성해줘.
터미널 2, 3이 이 파일을 감시하고 있어.

- CBLE 완료 → touch /Volumes/soulmaten/POTAL/benchmark/cble/DONE
- EBTI 완료 → touch /Volumes/soulmaten/POTAL/regulations/eu_ebti/DONE
- ECICS 완료 → touch /Volumes/soulmaten/POTAL/regulations/eu_ecics/DONE
- ATaR 완료 → touch /Volumes/soulmaten/POTAL/regulations/uk_atar/DONE
- ATLAS 완료 → touch /Volumes/soulmaten/POTAL/benchmark/atlas/DONE
- HSCodeComp 완료 → touch /Volumes/soulmaten/POTAL/benchmark/hscodecomp/DONE
- 한국 관세사 완료 → touch /Volumes/soulmaten/POTAL/benchmark/korea_customs/DONE
- 일본 通関士 완료 → touch /Volumes/soulmaten/POTAL/benchmark/japan_customs/DONE
- BIS CCL 완료 → touch /Volumes/soulmaten/POTAL/regulations/us_bis/DONE
- UN DG 완료 → touch /Volumes/soulmaten/POTAL/regulations/un_dg/DONE
- WTO Valuation 완료 → touch /Volumes/soulmaten/POTAL/regulations/wto/DONE
- FTA PSR 완료 → touch /Volumes/soulmaten/POTAL/regulations/fta_psr/DONE
- EU TARIC VAT 완료 → touch /Volumes/soulmaten/POTAL/regulations/eu_taric_vat/DONE

### P0 — 즉시 수집 (8개)

**P0-1. CBLE Past Exams (미국 관세사 기출)**
- URL: https://www.cbp.gov/trade/programs-administration/customs-brokers/license-examination-notice-examination
- 할 일: CBP 웹사이트에서 CBLE past exams PDF 전부 다운로드
- 각 PDF에서 문제+정답 추출
- HS 분류 관련 문제만 별도 추출 → /Volumes/soulmaten/POTAL/benchmark/cble/hs_questions.json
- 나머지 문제도 영역별 분류 → /Volumes/soulmaten/POTAL/benchmark/cble/all_questions.json
- 각 문제에 {question_id, question, answer, domain, potal_feature_id, product_name_if_applicable, correct_hs_code} 포함
- 완료 후: touch /Volumes/soulmaten/POTAL/benchmark/cble/DONE

**P0-2. EU EBTI Rulings (유럽 분류 결정문)**
- URL: https://ec.europa.eu/taxation_customs/dds2/ebti/ebti_consultation.jsp
- 할 일: HS 챕터 01~97 순차 검색, 각 결정문에서 goods_description + classification(CN코드) + 결정문번호 + 날짜 추출
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_rulings.csv
- product_hs_mappings 형태 CSV도 생성: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_for_db.csv
  - 컬럼: product_name, hs_code, confidence, source, country (confidence=1.0, source=ebti, country=EU)
- 요청 간격: 1-2초 (서버 부하 방지)
- 목표: 50K-100K건
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/eu_ebti/DONE

**P0-3. EU ECICS Chemical DB (화학물질 70K)**
- URL: https://ec.europa.eu/taxation_customs/dds2/ecics/chemicalsubstance_consultation.jsp
- 할 일: 화학물질 데이터베이스 전체 크롤링 — substance_name, cas_number, cn_code, molecular_formula
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/eu_ecics/ecics_chemicals.csv
- product_hs_mappings 형태도: /Volumes/soulmaten/POTAL/regulations/eu_ecics/ecics_for_db.csv
  - product_name=substance_name, hs_code=cn_code의 앞 6자리, source=ecics
- 목표: ~70K건
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/eu_ecics/DONE

**P0-4. UK ATaR Rulings (영국 분류 결정문)**
- UK Trade Tariff API 확인: https://www.trade-tariff.service.gov.uk/api/v2/ 또는 GOV.UK ATaR 검색 페이지
- 할 일: UK Advance Tariff Ruling 데이터 수집 — goods_description, commodity_code, ruling_reference
- CSV 저장: /Volumes/soulmaten/POTAL/regulations/uk_atar/uk_atar_rulings.csv
- product_hs_mappings 형태도: /Volumes/soulmaten/POTAL/regulations/uk_atar/atar_for_db.csv
- 목표: ~10K+건
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/uk_atar/DONE

**P0-5. ATLAS Dataset (18,731 CBP rulings)**
- 논문: arXiv:2509.18400
- 할 일: GitHub, HuggingFace, Zenodo, PapersWithCode에서 "ATLAS tariff classification" 검색
- 논문 PDF에서 저자/기관 GitHub 확인
- 데이터셋 다운로드 → /Volumes/soulmaten/POTAL/benchmark/atlas/
- 형태: ruling_id, product_description, hts_code (18,731건)
- 못 찾으면: 이유 보고 + 논문 저자 연락 방법 제시
- 완료 후: touch /Volumes/soulmaten/POTAL/benchmark/atlas/DONE

**P0-6. HSCodeComp Dataset (632 products)**
- 할 일: arxiv, semantic scholar, GitHub, HuggingFace, PapersWithCode에서 "HSCodeComp" 검색
- 632 expert-annotated 이커머스 상품 데이터셋 다운로드
- /Volumes/soulmaten/POTAL/benchmark/hscodecomp/
- 못 찾으면: 이유 보고
- 완료 후: touch /Volumes/soulmaten/POTAL/benchmark/hscodecomp/DONE

**P0-7. 한국 관세사 기출문제**
- URL: https://www.q-net.or.kr/ + 관세사 기출문제 검색
- 할 일: 최근 5-10년 관세사 1차/2차 기출문제 수집
- 품목분류 문제만 별도: /Volumes/soulmaten/POTAL/benchmark/korea_customs/hs_questions.json
- 전체 문제도: /Volumes/soulmaten/POTAL/benchmark/korea_customs/all_questions.json
- 완료 후: touch /Volumes/soulmaten/POTAL/benchmark/korea_customs/DONE

**P0-8. 日本 通関士 過去問**
- URL: https://www.customs.go.jp/tetsuzuki/c-answer/shiken/
- 할 일: 最近5年分の通関士試験 過去問 다운로드
- 品目分類 문제만: /Volumes/soulmaten/POTAL/benchmark/japan_customs/hs_questions.json
- 완료 후: touch /Volumes/soulmaten/POTAL/benchmark/japan_customs/DONE

### P1 — 이어서 수집 (5개)

**P1-1. BIS Commerce Control List (ECCN)**
- URL: https://www.bis.gov/regulations/commerce-control-list-ccl
- EAR Part 774에서 ECCN 코드 + 품목 설명 + 통제 사유 추출
- /Volumes/soulmaten/POTAL/regulations/us_bis/eccn_list.csv
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/us_bis/DONE

**P1-2. UN Dangerous Goods List**
- URL: https://unece.org/transport/dangerous-goods
- UN Number + 품명 + 위험등급 + 포장그룹 추출
- /Volumes/soulmaten/POTAL/regulations/un_dg/un_dg_list.csv
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/un_dg/DONE

**P1-3. WTO Customs Valuation Agreement**
- URL: https://www.wto.org/english/docs_e/legal_e/20-val.pdf
- PDF 다운로드 + 텍스트 추출
- /Volumes/soulmaten/POTAL/regulations/wto/
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/wto/DONE

**P1-4. FTA PSR Lists**
- WTO RTA-IS + 주요 FTA(USMCA, RCEP, CPTPP, KORUS, EU-UK TCA) PSR 수집
- /Volumes/soulmaten/POTAL/regulations/fta_psr/
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/fta_psr/DONE

**P1-5. EU TARIC VAT Rates**
- TARIC에서 CN코드별 VAT 세율 추출
- /Volumes/soulmaten/POTAL/regulations/eu_taric_vat/
- 완료 후: touch /Volumes/soulmaten/POTAL/regulations/eu_taric_vat/DONE

### 공통 규칙
- 한 번에 하나의 소스만 수집 (동시 다운로드 금지)
- 서버에 1-2초 간격 요청
- 각 소스 완료 시 data_collection.log에 날짜+시간+건수 기록
- 다운로드 불가능한 소스는 이유 보고 + 대안 제시 + DONE 파일에 "FAILED: 이유" 기록
- product_hs_mappings 형태 CSV가 가능한 소스는 반드시 *_for_db.csv 변환본도 생성
```
