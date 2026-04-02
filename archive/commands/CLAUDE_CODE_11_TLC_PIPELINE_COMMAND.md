# Claude Code 명령어: 11개 TLC 영역 — 실무자 프로세스 기반 파이프라인 구조화 + 데이터 수집

> **핵심 원칙**: "시스템을 바꾸지 말고 사람을 대체하라"
> 각 영역에서 실무자(관세사/세무사/컴플라이언스 담당자)가 **실제로 어떤 순서로 판단하는지** 파악 → 그 순서 그대로 파이프라인 구축 → 사람 판단이 필요한 지점에만 AI 배치
>
> **이 파일의 목적**: 11개 영역 각각에 대해 (1) 실무자 프로세스 매핑 (2) 현재 코드와의 GAP 분석 (3) 필요한 데이터 목록 + 수집 방법 (4) 파이프라인 설계서 작성
>
> **실행 규칙**: 한 영역씩 순서대로 완성. 동시에 여러 영역 진행 금지. 각 영역마다 설계서 파일 생성 후 다음으로 넘어갈 것.

---

## 전체 실행 순서

각 영역별로 아래 4단계를 반복:

### A단계: 실무자 프로세스 리서치
- 해당 영역의 실무자가 **실제로 어떤 순서로 업무를 처리하는지** 웹 리서치
- 공식 규정/가이드라인 문서 찾기 (WCO, WTO, 각국 관세청, 세무당국)
- 관세사/세무사 시험 교재에서 해당 영역의 판단 프로세스 확인
- 결과를 step-by-step 순서도로 정리

### B단계: 현재 코드 GAP 분석
- 현재 POTAL 코드가 이 프로세스의 몇 %를 커버하는지 확인
- 빠진 단계, 단순화된 단계, 하드코딩된 단계 식별
- "사람 판단이 필요한데 코드로 대체된 곳" 식별

### C단계: 필요 데이터 파악 + 수집
- 각 단계에서 필요한 데이터가 우리 DB에 있는지 확인
- 없으면: 어디서 구할 수 있는지, URL, 형식, 예상 건수, 수집 방법 정리
- **수집 가능한 건 즉시 수집** (wget, curl, 스크립트)

### D단계: 파이프라인 설계서 작성
- `docs/pipelines/PIPELINE_{영역명}.md` 파일 생성
- 실무자 프로세스 → 코드 매핑 → AI 필요 지점 → 필요 데이터 → 구현 계획

---

## 영역 2: Duty Rate (관세율 결정)

### 실무자(관세사)가 관세율을 결정하는 실제 순서:

```
Step 1: HS Code 확정 (← 영역 1에서 받음)
Step 2: 원산지 확인 — 어느 나라에서 생산/선적되었는가?
Step 3: 기본 MFN 세율 조회 — 해당 HS Code의 도착지 국가 MFN 세율
Step 4: FTA 적용 가능 여부 확인 — 원산지+도착지 간 FTA가 있는가?
Step 5: FTA 원산지 규칙(RoO) 충족 여부 — PSR 확인, RVC 계산, 원산지증명서 유효한가?
Step 6: FTA 특혜세율 조회 — 충족 시 특혜세율 적용
Step 7: 반덤핑/상계관세(AD/CVD) 확인 — 해당 상품+원산지에 AD/CVD 부과 중인가?
Step 8: 세이프가드 확인 — 긴급수입제한조치 적용 중인가?
Step 9: 특별관세 확인 — US Section 301/232, EU 보복관세 등
Step 10: 관세 감면/면제 확인 — 일시수입, FTZ, 면세조건 해당하는가?
Step 11: 최종 관세율 확정 — 위 모든 조건 종합 → 최종 적용 세율
Step 12: 관세액 계산 — CIF 가치 × 최종 세율 (또는 종량세)
```

**사람 판단이 필요한 곳:**
- Step 5: RoO 충족 여부 (복잡한 상품 = AI 필요)
- Step 10: 감면 조건 해당 여부 (상황에 따라 AI 필요)

**현재 POTAL 코드 상태:**
- `macmap-lookup.ts` — Step 3,6 커버 (AGR→MIN→NTLC→MFN 4단계 폴백)
- `trade-remedy-lookup.ts` — Step 7,8 커버 (AD/CVD + 세이프가드)
- `section301-lookup.ts` — Step 9 부분 커버 (US Section 301/232)
- `roo-engine.ts` — Step 5 부분 커버 (RVC 계산)
- **GAP**: Step 10(감면/면제) 체계적 구조 없음, Step 4-5-6 순서가 실무자 프로세스와 다름

**필요 데이터:**
1. ✅ MFN 세율 — macmap_ntlc_rates 537K + WITS 1M (있음)
2. ✅ MIN 세율 — macmap_min_rates ~105M (있음)
3. ✅ AGR 세율 — macmap_agr_rates ~129M (있음)
4. ✅ AD/CVD — trade_remedy 테이블 119K건 (있음)
5. ⚠️ **FTA PSR (품목별 원산지 규칙)** — 63개 FTA의 HS Code별 원산지 규칙 상세
   - 소스: WTO RTA-IS (rtais.wto.org), 각 FTA 원문
   - 형식: HS Code × FTA × 원산지 기준 (CTH/RVC/WO)
   - 예상: 63 FTA × 평균 5,000 HS = ~315,000건
   - 수집: WTO RTA-IS API 또는 FTA 원문 PDF에서 추출
6. ⚠️ **관세 감면/면제 조건 DB** — 국가별 면세 조건 (임시수입, FTZ, GSP 등)
   - 소스: 각국 관세청 웹사이트, WCO Kyoto Convention
   - 형식: 국가 × 감면 유형 × 조건 × HS Code 범위
   - 주요국: US (HTS Chapter 98/99), EU (Customs Suspension), JP (특혜관세)
7. ⚠️ **EU/UK/기타 보복관세** — Section 301 외 국가별 추가 관세
   - 소스: EU TARIC additional duties, UK autonomous tariff quotas
   - 형식: HS Code × 원산지 × 추가세율 × 기간

**→ 설계서 생성**: `docs/pipelines/PIPELINE_DUTY_RATE.md`

---

## 영역 3: AD/CVD (반덤핑/상계관세)

### 실무자(관세사/무역변호사)가 AD/CVD를 판단하는 실제 순서:

```
Step 1: 상품의 HS Code + 원산지 확인 (← 영역 1,2에서 받음)
Step 2: 활성 AD/CVD 케이스 존재 여부 확인 — 해당 HS Code + 원산지에 현행 조치가 있는가?
Step 3: 대상 범위(scope) 확인 — 이 상품이 해당 AD/CVD order의 범위에 포함되는가?
   - 상품 설명과 AD/CVD order의 scope language 비교
   - 판례(scope ruling) 확인: 이전에 유사 상품에 대한 결정이 있었는가?
Step 4: 생산자/수출자별 세율 확인
   - 개별 심사된 기업: 기업별 세율 (예: Samsung 0%, LG 15.41%)
   - 미심사 기업(All Others): 일반 세율 적용
   - 중국 전체 적용(China-wide rate): 특별 고율 적용 경우
Step 5: 세이프가드(SG) 별도 확인 — 수량 기준 긴급수입제한
   - 관세율 할당(TRQ): 할당량 내 세율 vs 초과 시 세율
   - 면제 대상국 확인 (FTA, 개도국 등)
Step 6: 일몰 재심(Sunset Review) 상태 확인 — 조치가 곧 만료/갱신되는가?
Step 7: 최종 AD/CVD 세율 확정 — 기본관세에 추가
Step 8: 보증금(Cash Deposit) 계산 — 수입 시 예치해야 할 금액
```

**사람 판단이 필요한 곳:**
- Step 3: Scope 판단 (상품이 AD/CVD order 범위에 해당하는지 — 복잡한 경우 AI 필요)
- Step 4: 생산자 특정 (invoicing entity ≠ producer인 경우)

**현재 POTAL 코드 상태:**
- `trade-remedy-lookup.ts` — Step 2,4,5 커버 (firm-specific + safeguard)
- **GAP**: Step 3(scope 판단) 없음, Step 6(일몰 재심) 없음, Step 8(보증금) 없음

**필요 데이터:**
1. ✅ AD/CVD 케이스 — trade_remedy_cases 11K (있음)
2. ✅ 기업별 세율 — trade_remedy_duties 37.5K (있음)
3. ✅ 대상 상품 — trade_remedy_products 55K (있음)
4. ✅ 세이프가드 — safeguard_exemptions 16K (있음)
5. ⚠️ **Scope Ruling DB** — AD/CVD scope 결정문
   - US: ITC EDIS (edis.usitc.gov) scope rulings
   - EU: OLAF anti-fraud database
   - 형식: AD/CVD case × product description × in-scope/out-of-scope 결정
   - 예상: US ~5,000건, EU ~3,000건
6. ⚠️ **Sunset Review 일정** — 활성 AD/CVD 조치의 만료/재심 일정
   - US: Federal Register notices (ITA sunset reviews)
   - EU: Official Journal expiry reviews
   - 형식: case_id × expiry_date × review_status
7. ⚠️ **TRQ (관세율 할당) 상세** — 할당량 + 잔여량
   - US: USITC TRQ dashboard
   - EU: TARIC TRQ quotas (SIGL system)
   - 형식: HS Code × 원산지 × 할당량 × 사용량 × 기간

**→ 설계서 생성**: `docs/pipelines/PIPELINE_AD_CVD.md`

---

## 영역 4: VAT/GST (부가가치세)

### 실무자(세무사/관세사)가 VAT/GST를 계산하는 실제 순서:

```
Step 1: 도착지 국가의 VAT/GST 체계 확인 — 부과 방식, 세율 구조
Step 2: 상품 분류별 세율 확인
   - 표준세율(standard rate) vs 경감세율(reduced rate) vs 영세율(zero-rate) vs 면세(exempt)
   - HS Code 또는 CN Code 기준으로 세율 결정
   - 예: EU 식료품 경감세율 5-10%, 의약품 0%, 명품 표준세율 19-25%
Step 3: 과세표준(Tax Base) 계산
   - 대부분: CIF 가격 + 관세 + 기타 수입세 = 과세표준
   - 일부 국가: FOB 기준 또는 별도 산식
Step 4: De Minimis 확인 — 면세 기준금액 이하인가?
   - US: $0 (2025년 폐지)
   - EU: 회원국별 상이 (대부분 €0-5)
   - UK: £135 (VAT 면제)
   - AU: AUD 1,000
Step 5: 특별 수입 제도 확인
   - EU IOSS: €150 이하 B2C 수입 → 판매자가 단일 15% VAT 납부
   - EU OSS: 비EU 사업자 단일 VAT 등록
   - UK Low Value Consignment: £135 이하 → 판매자 VAT
   - AU Vendor Collection Model: AUD 1,000 이하 → 판매자 GST
Step 6: 국가별 특수세금 계산
   - Brazil: ICMS(주별 17-22%) + IPI(~10%) + PIS/COFINS(11.65%) — 연쇄(cascading) 계산
   - India: IGST(5-28% HS챕터별) + SWS(BCD의 10%)
   - Mexico: IEPS(주류 8-160%) + IVA(16%)
   - China CBEC: 70% 감면 (단건 $700 이하)
   - US: State sales tax(0-9.55% ZIP별)
   - Canada: HST/GST/PST(주별 5-15%)
Step 7: VAT 등록/신고 의무 확인 — 판매자가 VAT 등록/신고해야 하는가?
Step 8: 최종 VAT/GST 금액 확정
```

**사람 판단이 필요한 곳:**
- Step 2: 경감세율 해당 여부 (상품이 식료품/의약품/아동용품 등에 해당하는지)
- Step 5: 적용 가능한 특별 제도 판단

**현재 POTAL 코드 상태:**
- `GlobalCostEngine.ts` — Step 1,3,4,8 커버
- `eu-vat-rates.ts` — Step 2 부분 커버 (EU 9개국 챕터별 경감세율)
- `ioss-oss.ts` — Step 5 부분 커버 (IOSS/OSS)
- `CostEngine.ts` — Step 6 커버 (Brazil/India/Mexico/China/US/Canada)
- **GAP**: Step 2 나머지 국가 경감세율 없음 (EU 9개국 외 18개국 + EU 외 국가), Step 7(등록의무) 없음

**필요 데이터:**
1. ✅ 표준 VAT/GST — vat_gst_rates 240개국 (있음)
2. ✅ De Minimis — de_minimis_thresholds 240개국 (있음)
3. ✅ EU 경감세율 — eu-vat-rates.ts 9개국 (있음, 부분적)
4. ⚠️ **EU 27개국 전체 경감세율** — CN Code별 VAT 경감/면세 세율
   - 소스: EU TARIC (ec.europa.eu/taxation_customs), 각국 세무당국
   - 필요: 나머지 18개 EU 국가의 HS/CN Code별 경감세율 매핑
   - 형식: country × hs_code_range × vat_rate × rate_type (standard/reduced/super-reduced/zero)
   - 예상: 27국 × 평균 500 HS Code 구간 = ~13,500건
5. ⚠️ **EU 외 주요국 경감세율** — 영국, 캐나다, 호주, 일본, 한국 등
   - UK: VAT Notice 701 (zero-rated items list)
   - Canada: GST/HST exempt/zero-rated items
   - Australia: GST-free items list
   - Japan: 8% 경감세율 대상 (식료품, 정기구독)
   - Korea: VAT 면세 대상 목록
   - 형식: 국가별 경감/면세 HS Code 목록
   - 예상: 주요 10개국 × 평균 300건 = ~3,000건
6. ⚠️ **US State Sales Tax DB (정밀화)** — ZIP Code별 세율 (현재 주별만)
   - 소스: Avalara tax rate API (무료 tier) 또는 Tax Foundation data
   - 형식: ZIP code × state × county × city × combined_rate
   - 예상: ~43,000 ZIP codes
   - 현재: 51개 주 수준만 → 시/카운티까지 필요
7. ⚠️ **VAT 등록 기준금액(threshold)** — 국가별 원격판매 VAT 등록 의무 기준
   - 소스: OECD VAT/GST Guidelines, EU VAT Directive
   - 형식: 국가 × 기준금액 × 통화 × B2B/B2C 구분
   - 예상: ~100개국

**→ 설계서 생성**: `docs/pipelines/PIPELINE_VAT_GST.md`

---

## 영역 5: De Minimis (면세 기준)

### 실무자가 De Minimis를 판단하는 실제 순서:

```
Step 1: 도착지 국가의 de minimis 기준금액 확인
Step 2: 상품 가치 산정 — FOB? CIF? 관세 포함?
   - 국가별 기준이 다름: US는 FOB 기준, EU는 통계가격 기준
Step 3: 관세 de minimis vs VAT de minimis 구분
   - 일부 국가: 관세 면제 기준과 VAT 면제 기준이 다름
   - 예: EU 관세 €150, VAT €0-5 (회원국별 상이)
Step 4: 상품 유형별 예외 확인
   - 주류/담배/향수: 대부분 국가에서 de minimis 적용 제외
   - 농산물: 일부 국가에서 별도 기준
Step 5: 최근 정책 변경 확인
   - US: $800 → $0 (2025 폐지), 중국발 수입 특별 규정
   - AU: AUD 1,000 (GST vendor collection)
Step 6: 결과 판정 — 관세 면제 / VAT 면제 / 둘 다 / 해당 없음
```

**현재 POTAL 코드 상태:**
- `GlobalCostEngine.ts` — Step 1,6 커버 (DB 조회 + 면제 판정)
- **GAP**: Step 2(가치 산정 기준 국가별 차이) 미반영, Step 3(관세 vs VAT 분리) 부분적, Step 4(상품유형 예외) 없음

**필요 데이터:**
1. ✅ 기본 기준금액 — de_minimis_thresholds 240개국 (있음)
2. ⚠️ **관세 vs VAT de minimis 분리 데이터** — 국가별 관세/VAT 별도 기준
   - 소스: Global Express Association (GEA) de minimis study, WCO
   - 형식: 국가 × duty_threshold × vat_threshold × currency × valuation_basis
   - 예상: ~240건 (국가당 1건, 기존 테이블 확장)
3. ⚠️ **상품유형 예외 목록** — de minimis 적용 제외 상품
   - 소스: 각국 관세법
   - 형식: 국가 × excluded_hs_codes × excluded_categories
   - 주요: 주류(22xx), 담배(24xx), 향수(3303)

**→ 설계서 생성**: `docs/pipelines/PIPELINE_DE_MINIMIS.md`

---

## 영역 6: Special Tax (특수세금, 12개국)

### 실무자가 특수세금을 계산하는 실제 순서:

```
Step 1: 도착지 국가에 특수세금 제도가 있는지 확인
Step 2: 상품이 특수세금 대상인지 확인
   - Brazil: 모든 수입품 (IPI + ICMS + PIS/COFINS)
   - India: 모든 수입품 (IGST + SWS), HS 챕터별 세율 차등
   - Mexico: 주류/담배/당음료만 IEPS 대상
   - China CBEC: cross-border e-commerce 전용 (일반 수입은 다른 세율)
Step 3: 주/지역별 세율 확인 (해당 시)
   - Brazil ICMS: 주별 17-22%
   - US State Sales Tax: 주+카운티+시 합산
   - Canada: 주별 HST/PST
   - India: 주별 SGST (IGST와 별개)
Step 4: 연쇄 과세(Cascading) 계산 (해당 시)
   - Brazil: IPI 먼저 → (CIF+duty+IPI) 기준으로 ICMS → (전체) 기준으로 PIS/COFINS
   - 순서 중요: 세금이 세금의 과세표준에 포함
Step 5: 감면/면제 조건 확인
   - China CBEC: CNY 5,000 이하 70% 감면
   - India: 특정 HS Code 면제 (예: 일부 농산물)
Step 6: 최종 특수세금 합산
```

**현재 POTAL 코드 상태:**
- `CostEngine.ts` — Step 1~6 대부분 커버 (12개국 특수세금 계산 로직)
- **GAP**: Step 3(주/지역별) US만 51개 주, 나머지 국가는 단순화, Step 5(감면) 부분적

**필요 데이터:**
1. ✅ 12개국 기본 세율 — 코드에 하드코딩 (있음)
2. ✅ India IGST 챕터별 세율 — 하드코딩 (있음)
3. ✅ Brazil ICMS 주별 세율 — 하드코딩 (있음)
4. ⚠️ **Mexico IEPS 상세** — HS Code별 IEPS 세율 전체 목록
   - 소스: SAT (sat.gob.mx) LIEPS law
   - 형식: HS Code × IEPS rate × product_category
   - 현재: 3카테고리(주류/담배/당음료)만 → 20+ 카테고리로 확장 필요
5. ⚠️ **India Cess/추가세** — BCD 외 Cess (교육세, 사회복지세) HS 코드별
   - 소스: CBIC (cbic.gov.in) customs tariff
   - 형식: HS Code × cess_rate × cess_type
   - 예상: ~500 HS Code에 특수 Cess 적용
6. ⚠️ **Brazil IPI 세율표 전체** — TIPI (Tabela IPI) HS Code별
   - 소스: Receita Federal (gov.br)
   - 형식: NCM Code × IPI rate
   - 예상: ~10,000건 (NCM = 브라질 HS 10자리)

**→ 설계서 생성**: `docs/pipelines/PIPELINE_SPECIAL_TAX.md`

---

## 영역 7: Customs Fees (통관 수수료)

### 실무자가 통관 수수료를 산출하는 실제 순서:

```
Step 1: 통관 유형 확인 — 정식 수입(formal), 약식 수입(informal), 특급(express)
Step 2: 국가별 필수 수수료 계산
   - US MPF: 0.3464% × CIF, $2.69~$614.35 (formal), $2.69~$12.09 (informal)
   - US HMF: 0.125% × CIF (해상/철도만, 항공 제외)
   - EU: 없음 (관세에 포함)
   - JP: 통관료 ¥100 (약식), ¥2,900~¥80,000 (정식, 가격대별)
   - KR: 고정 ₩10,000~₩50,000 (수입 유형별)
   - AU: AUD 50 (정식 수입 서류비)
Step 3: 관세사/브로커 수수료 (선택사항)
   - 통상 $30~$200/건 (국가/복잡도별)
Step 4: 항구/공항 수수료 (해당 시)
   - 컨테이너 하역료, 보관료, 검역료 등
Step 5: 서류 수수료
   - 원산지증명서 발급비, 검사 수수료 등
Step 6: 합산
```

**현재 POTAL 코드 상태:**
- `CostEngine.ts` — US MPF만 하드코딩 ($5.50 고정)
- `customs_fees` 테이블 — 240개국 (있지만 단순 고정값)
- **GAP**: Step 1(통관 유형 구분) 없음, Step 2(국가별 상세 계산식) 대부분 단순화, US HMF 없음

**필요 데이터:**
1. ✅ 기본 수수료 — customs_fees 240개국 (있음, 단순화)
2. ⚠️ **국가별 상세 수수료 계산식** — 고정값이 아닌 계산 공식
   - US MPF/HMF: 공식 알려져 있음, 코드에 공식 반영 필요
   - JP/KR/AU/CA/UK: 각국 관세청 수수료 스케줄
   - 소스: 각국 관세청 웹사이트
   - 형식: 국가 × fee_type × calculation_formula × min × max × currency
   - 예상: 주요 20개국 × 평균 3종 수수료 = ~60건

**→ 설계서 생성**: `docs/pipelines/PIPELINE_CUSTOMS_FEES.md`

---

## 영역 8: Rules of Origin (원산지 규칙) ⭐ 데이터 부족

### 실무자(관세사/무역변호사)가 원산지를 판단하는 실제 순서:

```
Step 1: 적용 가능한 FTA 확인 — 원산지국+도착지국 간 FTA 목록
Step 2: FTA별 일반 원산지 규칙 확인
   - 완전생산기준(WO): 한 나라에서 전부 생산
   - 세번변경기준(CTH/CC/CTSH): HS Code가 변경되었는가?
   - 부가가치기준(RVC): 현지 부가가치 비율이 기준 이상인가?
   - 가공공정기준(SP): 특정 제조 공정을 거쳤는가?
Step 3: 품목별 원산지 규칙(PSR) 확인 — ★★★ 핵심
   - HS Code별로 FTA마다 다른 원산지 기준이 있음
   - 예: USMCA 자동차 = RVC 75%, RCEP 전자제품 = CTH 또는 RVC 40%
   - PSR은 FTA 부속서에 수천 페이지로 명시
Step 4: 직접 운송 규칙 확인 — 제3국 경유 시 원산지 유지 조건
Step 5: 누적 규칙 확인 — FTA 회원국 간 재료/가공 합산 가능 여부
Step 6: 미소기준(De Minimis) 확인 — 비원산지 재료가 소량이면 허용
Step 7: 증빙서류 확인 — 원산지증명서(C/O) 유형, 자율인증 가능 여부
Step 8: 원산지 판정
```

**사람 판단이 필요한 곳:**
- Step 3: PSR 적용 (복잡한 경우 AI 필요 — 가장 핵심)
- Step 5: 누적 규칙 계산 (다국적 공급망)

**현재 POTAL 코드 상태:**
- `roo-engine.ts` — Step 2,3 부분 커버 (기본 기준만, PSR 상세 없음)
- `fta-db.ts` — Step 1 커버 (FTA 목록)
- **GAP**: Step 3(PSR 상세) 심각 부족, Step 4,5,6,7 없음

**필요 데이터 (★ 가장 많이 부족한 영역):**
1. ✅ FTA 목록 — macmap_trade_agreements 1,319건 (있음)
2. ❌ **FTA PSR (품목별 원산지 규칙) 전체** — ★★★ 최우선 수집 대상
   - **USMCA PSR**: USMCA Annex 4-B (textiles), Annex 4-A (autos), general rules
     - 소스: ustr.gov, cbp.gov USMCA implementation
     - 형식: HS Code × rule_type × threshold × conditions
     - 예상: ~8,000건
   - **RCEP PSR**: RCEP Annex 3A (Product-Specific Rules)
     - 소스: rcepsec.org
     - 형식: 동일
     - 예상: ~5,000건
   - **CPTPP PSR**: CPTPP Annex 3-D
     - 소스: international.gc.ca
     - 예상: ~5,000건
   - **EU-UK TCA PSR**: Annex ORIG-2
     - 소스: legislation.gov.uk
     - 예상: ~3,000건
   - **KORUS PSR**: Annex 4-A
     - 소스: ustr.gov
     - 예상: ~3,000건
   - **기타 58개 FTA PSR**: 각 FTA 원문에서 추출
   - **총 예상**: ~50,000건 이상
   - **수집 방법**: WTO RTA-IS 데이터베이스에서 구조화된 데이터 가능 여부 먼저 확인 → 없으면 PDF 원문에서 GPT로 추출
3. ⚠️ **직접 운송 규칙** — FTA별 경유 허용 조건
   - 형식: FTA × transit_rule × allowed_operations
4. ⚠️ **누적 규칙** — FTA별 누적 유형 (양자/대각/완전)
   - 형식: FTA × cumulation_type × member_countries
5. ⚠️ **원산지증명서 유형** — FTA별 C/O 유형 + 자율인증 여부
   - 형식: FTA × co_type × self_certification × validity_period

**→ 설계서 생성**: `docs/pipelines/PIPELINE_RULES_OF_ORIGIN.md`

---

## 영역 9: Export Controls (수출 통제) ⭐ 데이터 부족

### 실무자(수출통제 담당자)가 판단하는 실제 순서:

```
Step 1: 상품의 ECCN (Export Control Classification Number) 확인
   - Commerce Control List (CCL) 에서 상품 분류
   - EAR99 (통제 대상 아님) vs 특정 ECCN
Step 2: 목적지 국가 확인 — Commerce Country Chart 참조
   - 각 ECCN별로 어느 나라에 수출 시 허가 필요한지 매트릭스
Step 3: 최종 사용자(End User) 확인
   - Entity List, Denied Persons List 스크리닝
   - Military End User (MEU) 확인
Step 4: 최종 용도(End Use) 확인
   - 핵/미사일/화학무기/생물무기 관련 용도인가?
   - Catch-all 조항: 민군겸용 의심 시
Step 5: 허가 예외(License Exception) 적용 가능 여부
   - LVS (Low Value Shipments), GBS, TSR, APR, TMP 등
   - 예외 조건 충족 여부 체크
Step 6: 수출 허가 필요 여부 최종 판정
   - NLR (No License Required) vs License Required
Step 7: 수출 허가 신청 (필요 시)
```

**사람 판단이 필요한 곳:**
- Step 1: ECCN 분류 (AI 필요 — HS Code → ECCN 매핑 + 기술 사양 판단)
- Step 4: 최종 용도 판단 (AI 필요 — catch-all 조항)

**현재 POTAL 코드 상태:**
- `export-controls.ts` — Step 1,2,5,6 부분 커버 (간단한 HS→ECCN 매핑)
- **GAP**: Step 1 매핑이 매우 단순 (6개 카테고리만), Step 3 Entity List 별도 없음(sanctions와 혼합), Step 4 없음

**필요 데이터:**
1. ⚠️ **BIS Commerce Control List (CCL) 전체** — ★★ 우선 수집
   - 소스: bis.doc.gov/index.php/regulations/commerce-control-list-ccl
   - 형식: ECCN × description × reasons_for_control × license_requirements
   - 예상: ~2,000 ECCN entries
   - 수집: BIS EAR supplement 다운로드 (PDF/Excel)
2. ⚠️ **Commerce Country Chart** — ECCN × 국가 × 허가 필요 여부 매트릭스
   - 소스: BIS EAR Part 738, Supplement 1
   - 형식: country × reason_for_control × license_required
   - 예상: ~240국 × 15 control reasons = ~3,600건
3. ⚠️ **License Exception 조건 상세** — 각 예외의 적용 조건
   - 소스: BIS EAR Part 740
   - 형식: exception_code × conditions × excluded_countries × excluded_ECCNs
   - 예상: ~15개 예외 × 상세 조건
4. ⚠️ **HS Code → ECCN 매핑 테이블** — 자동 분류용
   - 소스: BIS에서 직접 매핑 없음 → CBP CROSS + academic papers 참조
   - 형식: HS Code range × possible_ECCNs × confidence
   - 예상: ~5,000건
5. ⚠️ **EU Dual-Use Regulation** — EU 이중용도 품목 목록 (Annex I)
   - 소스: eur-lex.europa.eu
   - 형식: EU control list number × description × HS Code cross-reference
   - 예상: ~1,500건
6. ⚠️ **Wassenaar Arrangement** — 국제 이중용도 통제 목록
   - 소스: wassenaar.org
   - 형식: category × description × control_parameters
   - 예상: ~500건

**→ 설계서 생성**: `docs/pipelines/PIPELINE_EXPORT_CONTROLS.md`

---

## 영역 10: Sanctions (제재 스크리닝)

### 실무자(컴플라이언스 담당자)가 제재 스크리닝하는 실제 순서:

```
Step 1: 거래 당사자 정보 수집 — 수출자, 수입자, 최종사용자, 운송사, 은행
Step 2: 포괄적 제재(Comprehensive Sanctions) 확인
   - 국가 전체 제재: CU, IR, KP, SY, RU(부분) — 거래 자체 금지
Step 3: SDN (Specially Designated Nationals) 스크리닝
   - OFAC SDN List: 이름, 별명, 주소, ID 번호 대조
   - 50% Rule: SDN이 50% 이상 지분 보유 기업도 대상
Step 4: Sectoral Sanctions 확인
   - SSI (Sectoral Sanctions Identifications): 특정 산업 제재 (러시아 에너지/금융)
Step 5: 기타 제재 리스트 스크리닝
   - BIS Entity List, Denied Persons List, Unverified List
   - EU Consolidated Sanctions List
   - UN Security Council Sanctions
   - UK OFSI Sanctions
Step 6: 선박/항공기 스크리닝 (해당 시)
   - OFAC vessel/aircraft lists
   - Ship flag country check
Step 7: 거래 구조 분석 — 제재 우회(circumvention) 의심 패턴
   - 우회 적색 신호: 환적, 이상 경로, 신규 중개인 등
Step 8: 최종 판정 — Clear / Hit / Possible Match → 수동 검토
```

**사람 판단이 필요한 곳:**
- Step 3: Possible Match 판정 (유사 이름 → AI가 1차 필터, 최종은 사람)
- Step 7: 우회 패턴 감지 (AI 필요)

**현재 POTAL 코드 상태:**
- `screen.ts` / `db-screen.ts` — Step 2,3,5 커버 (OFAC SDN + BIS Entity + 퍼지 매칭)
- **GAP**: Step 4(Sectoral) 미분리, Step 6(선박/항공기) 없음, Step 7(우회 감지) 없음, 50% Rule 없음

**필요 데이터:**
1. ✅ OFAC SDN — sanctions_entries 21,301건 (있음)
2. ✅ Aliases/Addresses/IDs — 총 76K+ (있음)
3. ⚠️ **OFAC SSI List** — Sectoral Sanctions 리스트
   - 소스: ofac.treasury.gov/specially-designated-nationals-list-data-formats
   - 형식: entity × program × sector × country
   - 예상: ~1,000건
4. ⚠️ **UN Security Council Sanctions** — 유엔 제재 대상
   - 소스: scsanctions.un.org/resources/xml
   - 형식: XML → entity × alias × address
   - 예상: ~2,000건
5. ⚠️ **UK OFSI Sanctions** — 영국 제재 리스트
   - 소스: gov.uk/government/publications/financial-sanctions-consolidated-list
   - 형식: CSV/XML
   - 예상: ~3,000건
6. ⚠️ **OFAC 50% Rule 지분 데이터** — SDN 50%+ 소유 기업
   - 소스: OFAC guidance + reported entities
   - 이건 외부 데이터 구매 필요할 수 있음 (Dow Jones, Refinitiv)
7. ⚠️ **선박/항공기 리스트** — 제재 대상 vessel/aircraft
   - 소스: OFAC SDN 내 vessel/aircraft type entries
   - 현재 DB에 있을 수 있음 → 확인 필요

**→ 설계서 생성**: `docs/pipelines/PIPELINE_SANCTIONS.md`

---

## 영역 11: Currency (환율 변환)

### 실무자가 환율을 처리하는 실제 순서:

```
Step 1: 기준 통화 확인 — 인보이스 통화, 도착지 통화, 신고 통화
Step 2: 적용 환율 결정
   - 관세 신고: 관세청 고시 환율 (주/월 단위 고정)
   - VAT 신고: 세무당국 환율 (인보이스 일자 기준)
   - 실시간 시장 환율: 참고용
Step 3: 환율 출처 선택
   - US CBP: 분기별 환율 (CBP.gov)
   - EU: ECB 환율 (매일)
   - JP: 재무성 고시 환율 (주간)
   - KR: 관세청 고시 환율 (주간)
Step 4: 변환 실행
Step 5: 반올림 규칙 적용 — 국가별 반올림 규칙이 다름
```

**현재 POTAL 코드 상태:**
- `exchange-rate-service.ts` — Step 1,3,4 커버 (시장 환율 API 2개 폴백)
- **GAP**: Step 2(관세청 고시 환율 vs 시장 환율 구분) 없음, Step 5(반올림 규칙) 없음

**필요 데이터:**
1. ✅ 시장 환율 — Exchange Rate API (있음, 15분 캐시)
2. ⚠️ **관세청 고시 환율** — 공식 관세 신고용 환율
   - US CBP: quarterly rates (cbp.gov/trade/currency-exchange-rates)
   - EU ECB: daily rates (ecb.europa.eu)
   - 형식: currency × rate × effective_date × source
   - 수집: 각 관세청 API/페이지에서 정기 수집 (Cron 추가)
3. ⚠️ **국가별 반올림 규칙**
   - 형식: 국가 × rounding_rule × decimal_places
   - 예상: ~50건 (주요국)

**→ 설계서 생성**: `docs/pipelines/PIPELINE_CURRENCY.md`

---

## 영역 12: Insurance/Shipping (보험/운송)

### 실무자(물류 담당자)가 보험/운송을 산출하는 실제 순서:

```
Step 1: 운송 모드 결정 — 항공, 해상, 육상, 복합
Step 2: 운임 계산
   - 항공: 실중량 vs 용적중량 중 큰 값 × 단가
   - 해상: CBM(입방미터) 또는 TEU 기준
   - 특송(Express): 무게 구간별 요금표
Step 3: 부대비용 — 연료할증료, 보안할증료, 통화할증료, 피크시즌
Step 4: 보험료 계산
   - CIF 가치의 0.5%~3% (상품 유형, 경로, 운송 모드별)
   - 위험 경로 할증 (분쟁 지역, 해적 위험 해역)
   - 의무 보험 국가 확인 (BR, AR, EG, NG, IN)
Step 5: Incoterms 적용
   - EXW/FOB/CIF/DDP 등에 따라 비용 분담 구조 결정
   - DDP: 판매자가 관세+VAT+보험+운임 전부 부담
   - FOB: 구매자가 운임+보험+관세+VAT 부담
Step 6: CIF 가치 확정 — 관세 과세표준의 기초
```

**현재 POTAL 코드 상태:**
- `insurance-calculator.ts` — Step 4 커버 (상품유형별 보험료)
- `GlobalCostEngine.ts` — Step 5,6 부분 커버 (Incoterms 반영)
- **GAP**: Step 1,2,3(운임 상세 계산) 없음, Step 3(부대비용) 없음

**필요 데이터:**
1. ✅ 보험 요율 — 코드에 하드코딩 (있음)
2. ⚠️ **국제 운임 요율 참고 데이터** — 주요 노선별 항공/해상 요금 레인지
   - 소스: Freightos Baltic Index (FBX), World Container Index
   - 이건 실시간 데이터라 API 연동이 이상적 (무료 tier 있는지 확인 필요)
   - 대안: 주요 노선 50개 평균 운임 하드코딩
3. ⚠️ **Incoterms 2020 비용 분담 매트릭스**
   - 11개 Incoterms × 7개 비용 항목 = 77셀 매트릭스
   - 소스: ICC Incoterms 2020 공식 규칙
   - 형식: incoterm × cost_item × buyer_or_seller
   - 이건 공개된 정보이므로 하드코딩 가능

**→ 설계서 생성**: `docs/pipelines/PIPELINE_INSURANCE_SHIPPING.md`

---

## 전체 실행 명령어

```
위 내용을 읽고, 11개 영역을 순서대로 하나씩 처리해라.

각 영역마다:
1. 위에 정리된 "실무자 프로세스"를 웹 리서치로 검증하고 보완해라
   - 해당 분야의 공식 가이드라인, 교과서, 정부 문서를 확인
   - 빠진 단계가 있으면 추가
   - 각 단계에서 실무자가 참조하는 데이터/문서/규정을 구체적으로 파악

2. 현재 POTAL 코드와 비교해서 GAP을 정확히 파악해라
   - 해당 코드 파일을 직접 읽고 분석
   - "어떤 단계가 빠졌는지", "어떤 단계가 단순화되었는지" 구체적으로 기록

3. 필요한 데이터를 수집해라
   - ⚠️ 표시된 데이터를 위 소스에서 다운로드/스크래핑
   - 다운로드 가능한 건 /Volumes/soulmaten/POTAL/regulations/ 에 저장
   - API가 있으면 테스트 호출해서 데이터 구조 확인
   - 수집 불가능한 것은 이유와 대안을 기록

4. 설계서 파일을 생성해라
   - 경로: docs/pipelines/PIPELINE_{영역명}.md
   - 내용: 실무자 프로세스 → 현재 코드 매핑 → GAP → 필요 데이터 → AI 필요 지점 → 구현 계획
   - 각 단계별로 "코드", "DB 조회", "AI 호출" 중 어떤 방식인지 명시

순서: 영역 2(Duty Rate) → 3(AD/CVD) → 4(VAT/GST) → 5(De Minimis) → 6(Special Tax) → 7(Customs Fees) → 8(RoO) → 9(Export Controls) → 10(Sanctions) → 11(Currency) → 12(Insurance/Shipping)

절대 규칙:
- 한 영역 설계서 완성 후 다음 영역으로 넘어갈 것
- 데이터 수집은 사이트 과부하 주의 (1초 딜레이)
- 수집한 데이터는 DB에 넣지 말 것 (저장만, 나중에 별도 임포트)
- npm run build 깨뜨리지 말 것 (이 명령에서 코드 수정은 없음, 설계서+데이터만)
```

---

## 데이터 수집 우선순위 (부족한 것만)

### P0 (가장 시급 — RoO/Export Controls의 핵심 데이터):
1. **FTA PSR 전체** — 63개 FTA 품목별 원산지 규칙 (~50,000건)
2. **BIS CCL 전체** — 수출통제 분류 목록 (~2,000건)
3. **Commerce Country Chart** — ECCN × 국가 허가 매트릭스

### P1 (중요 — 정확도 향상):
4. EU 27개국 VAT 경감세율 전체 (~13,500건)
5. UN/UK 제재 리스트 (~5,000건)
6. Scope Ruling DB — AD/CVD 대상 범위 결정문
7. EU Dual-Use 목록 (~1,500건)

### P2 (보완):
8. Mexico IEPS / India Cess / Brazil IPI 상세 세율표
9. 국가별 통관 수수료 계산식 (주요 20국)
10. 관세청 고시 환율 API 연동 (US/EU/JP/KR)
11. De Minimis 관세/VAT 분리 + 상품유형 예외
12. Incoterms 비용 분담 매트릭스
