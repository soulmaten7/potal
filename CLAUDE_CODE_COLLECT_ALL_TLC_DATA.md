# Claude Code 명령어: 11개 TLC 파이프라인 누락 데이터 전부 수집

## 목표
11개 TLC 파이프라인 설계서(docs/pipelines/)에서 파악된 **108개+ 누락 데이터 항목**을 수단과 방법을 가리지 말고 전부 수집한다.
- 공개 API가 있으면 API로
- 웹사이트에서 다운로드 가능하면 다운로드로
- 정형 데이터가 아니면 스크래핑으로
- 구독 필요하면 무료 대안을 찾고, 없으면 직접 구축
- **절대 포기하지 말 것. 대안이 없으면 직접 만들어서라도 가져와라.**

## 저장 경로
- 모든 수집 데이터: `/Volumes/soulmaten/POTAL/tlc_data/` 하위에 영역별 폴더
- 각 영역 폴더에 `README.md` 생성 (소스, 수집일, 건수, 형식 기록)
- 수집 완료 시 각 폴더에 `DONE` 파일 생성 (다른 터미널 연계용)

## 절대 규칙
1. **한 번에 하나의 다운로드/스크래핑만** — 병렬 실행 금지
2. **DB 직접 INSERT 금지** — 파일로만 저장. DB 적재는 나중에 별도로
3. **진행 상황 로깅** — 각 항목 시작/완료 시 stdout에 출력
4. **실패 시 skip하고 다음으로** — 실패한 항목은 `FAILED_항목명.txt`에 사유 기록

---

## P0 — 최우선 수집 (정확도에 직접 영향)

### P0-1: FTA Product-Specific Rules (PSR) — Rules of Origin
- **필요**: 63개 FTA별 품목별 원산지 규칙 (50,000~80,000건)
- **소스들 (전부 시도)**:
  1. WTO RTA-IS: https://rtais.wto.org — FTA별 PSR 검색
  2. UNCTAD: https://unctad.org/topic/trade-agreements/rules-of-origin
  3. 각 FTA 원문 PDF에서 Annex (PSR 부분) 추출
  4. USMCA PSR: https://ustr.gov/trade-agreements/free-trade-agreements/united-states-mexico-canada-agreement (Annex 4-B)
  5. EU FTA PSR: https://trade.ec.europa.eu/access-to-markets/en/content/rules-origin
  6. RCEP PSR: https://rcepsec.org
  7. CPTPP PSR: https://www.mfat.govt.nz/en/trade/free-trade-agreements/free-trade-agreements-in-force/cptpp/
  8. Korea FTA Portal: https://www.customs.go.kr/ftaportalkor/main.do
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/rules_of_origin/`
- **형식**: CSV (fta_name, hs_code, origin_criterion, description, threshold_pct)
- **최소 목표**: USMCA + EU-UK TCA + RCEP + CPTPP + KORUS 5개 FTA라도 확보

### P0-2: Commerce Country Chart — Export Controls
- **필요**: 240개국 × 16 Reasons for Control 매트릭스
- **소스**: BIS EAR Part 738, Supplement 1
  - https://www.bis.doc.gov/index.php/regulations/export-administration-regulations-ear
  - https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-738/supplement-No.-1-to-part-738
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/export_controls/`
- **형식**: CSV (country_code, country_name, reason_NS1, reason_NS2, reason_MT, reason_NP1, reason_NP2, reason_CB1, reason_CB2, reason_CB3, reason_CW, reason_CC1, reason_CC2, reason_CC3, reason_RS1, reason_RS2, reason_AT1, reason_AT2)

### P0-3: BIS CCL ECCN 전체 목록 + 기술 파라미터
- **필요**: ~2,000 ECCN 항목 (카테고리 0~9, 그룹 A~E)
- **소스**:
  - https://www.bis.doc.gov/index.php/regulations/commerce-control-list-ccl
  - eCFR Title 15 Part 774: https://www.ecfr.gov/current/title-15/subtitle-B/chapter-VII/subchapter-C/part-774
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/export_controls/`
- **형식**: CSV (eccn, description, reasons_for_control, license_requirements, license_exceptions, technical_parameters)

### P0-4: Section 301 Tariff Lines — Duty Rate
- **필요**: US Section 301 대중국 추가관세 대상 HS 10자리 목록 (List 1~4C, ~10,000 lines)
- **소스**:
  - USTR: https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions
  - Federal Register 최종 공고
  - USITC HTS General Notes
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/duty_rate/`
- **형식**: CSV (hts_code, list_number, additional_duty_pct, effective_date, exclusion_flag)

### P0-5: Section 232 Steel/Aluminum Tariff Lines
- **필요**: US Section 232 대상 HS 코드 + 국가별 면제/쿼타
- **소스**:
  - Commerce Dept: https://www.commerce.gov/issues/trade-enforcement/section-232
  - CBP 232 page
  - Federal Register
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/duty_rate/`
- **형식**: CSV (hts_code, country, duty_pct, quota_flag, exclusion_flag, effective_date)

### P0-6: AD/CVD Scope Text
- **필요**: ~10,000 AD/CVD 케이스별 Scope 설명문
- **소스**:
  - ITC EDIS: https://edis.usitc.gov
  - Commerce AD/CVD: https://www.trade.gov/antidumping-and-countervailing-duty-cases
  - Federal Register final determinations
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/ad_cvd/`
- **형식**: JSON (case_id, scope_text, product_description, hs_codes, countries, effective_date)

### P0-7: Customs Official Exchange Rates — Currency
- **필요**: 각국 관세청이 사용하는 공식 환율 소스 매핑
- **소스**:
  - ECB: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html (XML/CSV)
  - US CBP: https://www.cbp.gov/trade/basic-import-export/conversion-rates (매분기)
  - UK HMRC: https://www.gov.uk/government/collections/exchange-rates-for-customs-and-vat
  - Japan Customs: https://www.customs.go.jp/tetsuzuki/kawase/index.htm (매주)
  - Korea KCS: https://www.customs.go.kr (매주)
  - Australia ABF: https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/exchange-rates
  - Canada CBSA: https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/rates-taux-eng.html
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/currency/`
- **형식**: JSON (country_code, rate_source, api_url, update_frequency, format)

---

## P1 — 중요 수집 (기능 완성도에 영향)

### P1-1: EU 27개국 품목별 VAT 경감세율
- **소스**:
  - EU TARIC: https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp
  - European Commission VAT rates: https://ec.europa.eu/taxation_customs/tedb/taxSearch.html
  - 각 회원국 세무청
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/vat_gst/`
- **형식**: CSV (country_code, hs_code_pattern, standard_rate, reduced_rate, super_reduced_rate, zero_rate, category)

### P1-2: 비EU 주요국 품목별 VAT/GST 경감세율
- **대상**: UK, Canada, Australia, Japan, Korea, India, Brazil, Mexico, Turkey, South Africa, Thailand, Malaysia, Indonesia, Saudi Arabia
- **소스**: 각국 세무청 웹사이트
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/vat_gst/`

### P1-3: Brazil IPI 품목별 세율 (TIPI 테이블)
- **소스**: Receita Federal TIPI: http://www.planalto.gov.br/ccivil_03/decreto/d8950.htm 또는 최신 TIPI
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/`
- **형식**: CSV (ncm_code, description, ipi_rate_pct)

### P1-4: India Cess/AIDC 품목별 세율
- **소스**: CBIC: https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-act/formatted-htmls/cs-tarrif.html
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/`

### P1-5: Customs Fees 240개국 상세
- **현재**: customs_fees 테이블 240건 존재하지만 코드에서 하드코딩 사용
- **필요**: 테이블 내용 확인 + 빠진 국가 보완 + 코드와 연동 매핑
- **소스**: 각국 관세청 + WCO + World Bank Doing Business
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/customs_fees/`

### P1-6: De Minimis FOB vs CIF 국가별 기준
- **필요**: 240개국별 de minimis 기준이 FOB인지 CIF인지
- **소스**: 각국 관세법 원문, WCO resources
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/de_minimis/`
- **형식**: CSV (country_code, threshold_amount, currency, valuation_basis_fob_or_cif, applies_to_duty, applies_to_tax, exclusions)

### P1-7: US Reciprocal Tariffs (2025~)
- **필요**: 2025년 시행 상호관세 대상국 + 세율 + HS 코드
- **소스**: Federal Register, USTR announcements
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/duty_rate/`

### P1-8: IEPS Mexico 품목별 세율
- **소스**: Mexico SAT: https://www.sat.gob.mx
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/`

### P1-9: China Consumption Tax 품목별 세율
- **소스**: China MOF/SAT
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/`

### P1-10: Incoterms 11개 전체 규칙
- **현재**: 5/11만 구현 (EXW, FOB, CIF, DDP, DAP)
- **필요**: FCA, CPT, CIP, DAT/DPU, FAS, CFR 추가
- **소스**: ICC Incoterms 2020 규칙 (공식 출판물은 유료, 요약은 무료)
- **저장**: `/Volumes/soulmaten/POTAL/tlc_data/insurance_shipping/`

---

## P2 — 보완 수집 (엣지 케이스)

### P2-1: GSP Eligible Products (US/EU/UK/JP/AU/CA)
- 각국 GSP 수혜국 목록 + 대상 품목
- US GSP: https://ustr.gov/issue-areas/trade-development/preference-programs/generalized-system-preference-gsp
- EU GSP: https://trade.ec.europa.eu/access-to-markets/en/content/generalised-scheme-preferences-gsp

### P2-2: Sanctions — SSI/NS-MBS/CAPTA 분리
- OFAC Sectoral Sanctions 별도 리스트
- https://www.treasury.gov/resource-center/sanctions/SDN-List/Pages/ssi_list.aspx

### P2-3: USML (US Munitions List)
- ITAR Part 121: https://www.ecfr.gov/current/title-22/chapter-I/subchapter-M/part-121

### P2-4: License Exception Eligibility Rules
- EAR Part 740 각 exception별 조건

### P2-5: Shipping Zone Matrices (주요 캐리어)
- FedEx/UPS/DHL 공개 zone 차트
- USPS International zone chart

### P2-6: Country Valuation Method (FOB vs CIF)
- 240개국별 관세 과세표준이 FOB인지 CIF인지
- WCO 자료 또는 각국 관세법

### P2-7: US State Sales Tax Exemptions
- 식품/의약품/의류 면세 주 목록
- 소스: 각 주 Department of Revenue

---

## 실행 순서

1. 먼저 `/Volumes/soulmaten/POTAL/tlc_data/` 폴더 구조 생성
2. P0-1부터 순서대로 진행
3. 각 항목:
   - 소스 URL 접근 시도
   - 다운로드/API/스크래핑으로 데이터 확보
   - CSV/JSON으로 정리하여 저장
   - README.md에 소스/건수/날짜 기록
   - DONE 파일 생성
   - 실패 시 FAILED 파일 생성 + 사유 기록 + 다음 항목으로
4. 전체 완료 시 `/Volumes/soulmaten/POTAL/tlc_data/COLLECTION_SUMMARY.md` 생성

## 수집 팁
- Federal Register는 API 있음: https://www.federalregister.gov/developers/documentation/api/v1
- eCFR는 XML 제공: https://www.ecfr.gov/developers/documentation/api/v1
- WTO API: https://apiportal.wto.org/
- EU TARIC은 공개 API 있음
- 없으면 curl + grep/sed/awk 로 텍스트 추출
- PDF는 pdftotext 또는 python pdfplumber로 추출
- 하나의 소스에서 실패하면 대안 소스 시도. **포기 금지.**

## 비용
- 전부 무료 공개 데이터
- WCO HS Nomenclature/Explanatory Notes만 유료 (~$2,000/년) → 나중에 구독 고려, 지금은 무료 소스로 최대한 확보
