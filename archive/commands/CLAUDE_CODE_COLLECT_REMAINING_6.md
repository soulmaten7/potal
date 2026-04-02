# Claude Code 명령어: 남은 6개 TLC 데이터 반드시 수집 완료

## 목표
이전 수집에서 "접근 어려움"으로 대기 처리된 6개 항목을 **반드시 전부 수집 완료**한다.
하나의 방법이 안 되면 대안을 시도하고, 대안도 안 되면 또 다른 대안을 찾는다.
**포기는 옵션이 아니다. 6개 전부 DONE 파일이 생길 때까지 멈추지 마라.**

## 저장 경로
`/Volumes/soulmaten/POTAL/tlc_data/` 하위 영역별 폴더 (기존과 동일)

---

## 1. FTA Product-Specific Rules (PSR) — 가장 중요, ~50,000건

**시도 순서 (하나 실패하면 다음으로):**

### 방법 1: ITC Rules of Origin Facilitator
- URL: https://findrulesoforigin.org
- 이 사이트는 ITC (International Trade Centre)가 운영하며 FTA별 PSR을 제공
- API 확인: https://findrulesoforigin.org/api/ 또는 네트워크 탭에서 API endpoint 확인
- 있으면 FTA별로 전체 PSR JSON 다운로드
- 없으면 HS Chapter별로 (01~97) 페이지 스크래핑

### 방법 2: WTO RTA-IS Database
- URL: https://rtais.wto.org/UI/PublicSearchByMemberResult.aspx
- API: https://api.wto.org/ (WTO Data Portal)
- WTO API Key: e6b00ecdb5b34e09aabe15e68ab71d1d (이미 보유)
- `GET /api/v1/rta/rules_of_origin?rta_id=XXX` 시도
- FTA ID 목록: USMCA, EU-UK TCA, RCEP, CPTPP, KORUS 등

### 방법 3: 각 FTA 공식 문서 PDF에서 추출
- **USMCA Annex 4-B**: https://ustr.gov/sites/default/files/files/agreements/FTA/USMCA/Text/04-Textiles-and-Apparel.pdf
  - 전체 PSR은 Annex 4-B (Product-Specific Rules of Origin)
  - PDF → pdftotext → 파싱하여 HS code + rule 추출
- **RCEP Annex 3A**: https://rcepsec.org/legal-text/ → Product Specific Rules
- **CPTPP Annex 4-A**: https://www.mfat.govt.nz/en/trade/free-trade-agreements/free-trade-agreements-in-force/cptpp/comprehensive-and-progressive-agreement-for-trans-pacific-partnership-text-and-resources/
- **KORUS Annex 4-A**: https://ustr.gov/trade-agreements/free-trade-agreements/korus-fta/final-text
- **EU-UK TCA ANNEX ORIG-2**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:22021A0430(01)

### 방법 4: UNCTAD MAST database
- https://trainsonline.unctad.org/
- TRAINS 데이터에 Non-Tariff Measures + Rules of Origin 포함
- API: https://trainsonline.unctad.org/api

### 방법 5: 직접 구축 (최후 수단)
- HS 2자리(97개 Chapter) × 주요 FTA 5개 = 485 조합
- 각 FTA의 일반 규칙 (General Rule)을 기본값으로 설정
  - 예: USMCA 일반규칙 = "CTH (Change in Tariff Heading) or RVC 50%"
  - RCEP 일반규칙 = "RVC 40% or CTH"
- Chapter별 특별규칙이 있는 주요 Chapter만 수동 입력:
  - Ch.01-24 (농산물), Ch.50-63 (섬유), Ch.84-85 (기계/전자), Ch.87 (차량), Ch.61-62 (의류)
- 형식: CSV (fta_name, hs_chapter, hs_heading, rule_type, rule_description, rvc_threshold)

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/rules_of_origin/`
**최소 목표**: 5대 FTA (USMCA, EU-UK TCA, RCEP, CPTPP, KORUS) PSR 확보

---

## 2. AD/CVD Scope Text — ~10,000건

**시도 순서:**

### 방법 1: Federal Register API
- API: https://www.federalregister.gov/developers/documentation/api/v1
- 검색: `GET https://www.federalregister.gov/api/v1/documents.json?conditions[term]="antidumping+duty+order"&conditions[agencies][]=international-trade-administration&per_page=1000`
- 각 문서에서 "scope" 섹션 텍스트 추출
- 최근 20년치 (2005~2025) AD/CVD final determinations

### 방법 2: Commerce Dept Enforcement & Compliance
- https://www.trade.gov/enforcement-and-compliance
- AD/CVD 케이스 목록: https://www.trade.gov/antidumping-and-countervailing-duty-cases
- 각 케이스 페이지에서 scope 텍스트 스크래핑

### 방법 3: ITC EDIS
- https://edis.usitc.gov
- 검색: "scope" + AD/CVD 케이스 번호
- 건별로 스크래핑 (느리지만 확실)

### 방법 4: CBP CROSS에서 scope 관련 rulings 필터링
- 이미 수집한 220,114건 CBP CROSS rulings에서
- `/Volumes/soulmaten/POTAL/regulations/cbp_cross/` 에서
- "scope" 또는 "antidumping" 또는 "countervailing" 키워드 포함 건 필터링
- 이건 이미 로컬에 있으니까 grep으로 즉시 추출 가능

### 방법 5: 기존 DB trade_remedy_cases 10,999건 활용
- DB에 이미 케이스가 있으니, 각 케이스의 product_description 필드를 scope 대용으로 사용
- psql로 조회: `SELECT case_id, product_description, hs_codes, countries FROM trade_remedy_cases LIMIT 10;`
- product_description이 있으면 그것이 사실상 scope text

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/ad_cvd/`

---

## 3. Brazil IPI (Imposto sobre Produtos Industrializados)

**시도 순서:**

### 방법 1: Receita Federal TIPI 테이블
- TIPI = Tabela de Incidência do IPI
- URL: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/tipi
- 또는: http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=131268
- TIPI는 NCM 코드(=HS 8자리) × IPI 세율 테이블
- PDF 또는 Excel로 제공됨 → 다운로드 후 파싱

### 방법 2: AFRFB (Brazilian Federal Revenue) Open Data
- https://dados.gov.br/ 에서 "TIPI" 또는 "IPI" 검색
- 오픈 데이터 포맷 (CSV/JSON) 제공 가능성

### 방법 3: 브라질 관세 데이터 사이트
- https://www.trademap.org (ITC TradeMap)
- https://comexstat.mdic.gov.br/ (Brazil COMEX)
- Siscomex: https://www.gov.br/siscomex/

### 방법 4: HS 2자리별 대표 IPI 세율 직접 구축
- 브라질 IPI는 HS Chapter별로 대략적 범위가 있음:
  - Ch.22 (음료): 맥주 50%, 와인 10%, 소주 60%
  - Ch.24 (담배): 300%
  - Ch.87 (차량): 7~25%
  - Ch.33 (화장품): 22%
  - Ch.84-85 (기계/전자): 0~15%
- HS 2자리(97개) × IPI 대표 세율 테이블 만들기 (공식 소스 기반)

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/brazil_ipi/`

---

## 4. India Cess (AIDC, Social Welfare, Health Cess 등)

**시도 순서:**

### 방법 1: CBIC (Central Board of Indirect Taxes & Customs)
- https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-act/formatted-htmls/cs-tarrif.html
- Indian Customs Tariff: HS 8자리별 BCD + AIDC + SWS + Health Cess 전부 포함
- PDF/HTML → 파싱

### 방법 2: Indian Customs Tariff Schedule (ITC-HS)
- https://www.cbic.gov.in/htdocs-cbec/customs/cst2022-070722/cst-2022-idx
- 또는: https://old.cbic.gov.in/htdocs-cbec/customs/cst-xxii/cst-rec (Customs Tariff 원문)

### 방법 3: ICEGATE
- https://www.icegate.gov.in/
- India의 공식 전자 통관 시스템
- Tariff 조회: https://www.icegate.gov.in/Webappl/

### 방법 4: India Trade Portal
- https://www.indiantradeportal.in/
- HS 코드별 관세율 + Cess 조회 가능

### 방법 5: 직접 구축
- India Cess 구조는 단순함:
  - Social Welfare Surcharge (SWS): BCD의 10% (대부분 품목)
  - AIDC (Agriculture Infrastructure Development Cess): 품목별 다름 (금 2.5%, 사과 35%, 팜유 17.5% 등)
  - Health Cess: 의료기기 5%
  - Education Cess: 폐지됨 (2018)
- AIDC 대상 품목 목록만 확보하면 됨 (~50개 품목)
- Budget 2021 Notification: https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-act/notifications/notfns-2021/cs-tarr2021/cs05-2021.htm

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/india_cess/`

---

## 5. Mexico IEPS (Impuesto Especial sobre Producción y Servicios)

**시도 순서:**

### 방법 1: SAT (Servicio de Administración Tributaria)
- https://www.sat.gob.mx/consulta/61888/conoce-las-tasas-del-ieps-aplicables-a-2024
- IEPS 세율표 직접 제공

### 방법 2: Mexico IEPS 법률 원문
- Ley del IEPS: https://www.diputados.gob.mx/LeyesBiblio/pdf/78.pdf
- Article 2: 품목별 세율 명시
- PDF → pdftotext → 파싱

### 방법 3: 직접 구축
- Mexico IEPS는 대상 품목이 한정적:
  - 음료 (설탕 첨가): 리터당 $1.17 MXN
  - 주류: 알코올 도수별 26.5%~53%
  - 담배: 160% + 개비당 $0.5998 MXN
  - 연료: 리터당 고정액
  - 고열량 식품 (>275kcal/100g): 8%
  - 살충제: 위험도별 6%/7%/9%
  - 도박: 30%
- 20~30개 카테고리 × 세율 테이블

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/mexico_ieps/`

---

## 6. China Consumption Tax (消费税)

**시도 순서:**

### 방법 1: China MOF/SAT 공식 세율표
- http://www.chinatax.gov.cn/ (국가세무총국)
- 消费税税率表 검색
- http://www.mof.gov.cn/ (재정부)

### 방법 2: China Customs 공식 사이트
- http://www.customs.gov.cn/
- 关税查询 (관세 조회) 기능에서 소비세 포함

### 방법 3: 영문 소스
- https://www.china-briefing.com/news/china-consumption-tax-rates/
- PwC China tax guide
- KPMG China tax guide: https://home.kpmg/cn/en/home/insights/2020/03/china-tax-alert.html

### 방법 4: 직접 구축
- 중국 소비세 대상은 15개 카테고리로 한정:
  1. 담배: 56%+0.003 RMB/개비 (갑A류) / 36%+0.003 (갑B류) / 11% (잎담배)
  2. 주류: 백주 20%+0.5 RMB/500ml / 맥주 250 RMB/톤 or 220 / 와인 10% / 기타 10%
  3. 화장품 (고급): 15%
  4. 보석/귀금속: 5~10%
  5. 폭죽: 15%
  6. 정제유: 리터당 고정액 (가솔린 1.52 RMB/L, 디젤 1.2 RMB/L)
  7. 자동차 타이어: 폐지 (2014)
  8. 오토바이: 3% (≤250cc) / 10% (>250cc)
  9. 자동차: 배기량별 1%~40%
  10. 골프용품: 10%
  11. 고급시계 (>10,000 RMB): 20%
  12. 요트: 10%
  13. 나무 일회용 젓가락: 5%
  14. 실목 마루판: 5%
  15. 전지 (배터리): 4% / 도료 (페인트): 4%
- 이 15개 카테고리 × HS 코드 매핑 테이블

**저장**: `/Volumes/soulmaten/POTAL/tlc_data/special_tax/china_consumption_tax/`

---

## 실행 규칙

1. **1번(FTA PSR)부터 순서대로 진행**
2. **각 항목에서 방법 1 시도 → 실패 시 방법 2 → ... → 최후 수단(직접 구축)까지**
3. **어떤 형태로든 데이터를 확보해라** — 완벽한 5만건이 아니어도, 주요 5개 FTA + HS 2자리 수준이라도 확보
4. **각 항목 완료 시 README.md + DONE 파일 생성**
5. **6개 전부 완료 후 COLLECTION_SUMMARY.md 업데이트**
6. **절대 포기하지 말 것**

## 소요 시간 예상
- FTA PSR: 30~60분 (방법에 따라)
- AD/CVD Scope: 20~30분
- Brazil/India/Mexico/China Special Tax: 각 10~20분
- **총 2~3시간 내 전부 완료 가능**
