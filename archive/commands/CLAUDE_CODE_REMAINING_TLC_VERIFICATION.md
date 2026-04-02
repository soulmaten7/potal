# Claude Code 명령어: 나머지 TLC 영역 전부 검증 (Area 0 + Area 2~11)

> **날짜**: 2026-03-23 KST
> **배경**: Area 1 (Duty Rate) 55/55 PASS (100%) 완료. 나머지 11개 영역 순차 진행.
> **목표**: Area 0 (Category Upgrade) → Area 2~11 전부 순서대로 진행. 각 영역 55건 PASS 100%.
> **원칙**: "시스템화 = 코드화 가능 = AI 불필요". 각 영역 실무 프로세스 역설계 → 코드 대조 → 5회 반복검증.

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번)
2. **벤치마크 절대 원칙**: 모든 테스트 케이스는 입력값 100% 완비
3. **한 번에 하나의 영역만** — 완료 후 다음으로
4. **regression 즉시 롤백** — 이전 PASS가 FAIL로 바뀌면 수정 취소
5. **npm run build 매 수정마다** — TypeScript 에러 0개
6. **Layer 1 HS Code 코드 수정 금지** (Area 0 제외)
7. **5회 반복검증 필수** — Round 1: 20건 → Round 2: 수정+20건 → Round 3: 25건 → Round 4: 45건 → Round 5: 55건

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### psql 직접 연결:
```bash
PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
```

---

## 공통 6-Phase 프로세스 (모든 영역 동일)

```
Phase 1: 실무 프로세스 역설계 — 법적 근거 + 계산 공식 + 흐름도
Phase 2: 현재 코드 대조 — 코드 읽기 + 실무 vs 코드 GAP 분석
Phase 3: GAP 수정 — HIGH 즉시 수정 + npm run build
Phase 4: 5회 반복검증 — 20건→20건→25건→45건→55건 (전부 PASS)
Phase 5: 최종 확정 — 결과표 + 알려진 한계 기록
Phase 6: 엑셀 기록 — POTAL_TLC_Verification.xlsx에 시트 추가
```

---

# ═══════════════════════════════════════════
# 영역 0: Layer 1 Category 매핑 업그레이드
# ═══════════════════════════════════════════

> **목표**: CATEGORY_TO_SECTION(임의 128개 키워드) → WCO 97 Chapter 법적 기준으로 전환
> **코드 파일**: `app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts`
> **참조 파일**: `app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts`
> **⚠️ 기존 CATEGORY_TO_SECTION은 삭제하지 않고 fallback으로 유지**

## 0-1. 현재 구조 파악

```
1. step2-1-section-candidate.ts의 CATEGORY_TO_SECTION 전체 읽기 — 128개 키워드 목록 확인
2. chapter-descriptions.ts의 CHAPTER_DESCRIPTIONS 97개 읽기
3. chapter-descriptions.ts의 CHAPTER_TO_SECTION 매핑 읽기
```

## 0-2. CHAPTER_KEYWORDS 자동 생성

```
chapter-descriptions.ts의 97개 WCO 공식 설명에서 키워드 추출:
- 세미콜론/콤마로 분리
- 불용어(and/or/of/the/thereof/articles/parts 등) 제거
- 복수형/단수형 둘 다 포함
- "jewellery"→"jewelry" 변형 추가
- 최소 3글자 이상

결과: CHAPTER_KEYWORDS: Record<number, string[]>
```

## 0-3. 코드 변경

```
step2-1-section-candidate.ts:
1. import { CHAPTER_DESCRIPTIONS, CHAPTER_TO_SECTION } from chapter-descriptions
2. buildChapterKeywords() 함수 추가 (런타임 아닌 모듈 로드 시 상수 생성)
3. matchCategoryToChapter() 함수 추가:
   - category_tokens + product_name → CHAPTER_KEYWORDS 매칭
   - 매칭 성공 → Chapter 확정 → CHAPTER_TO_SECTION → Section 확정
4. 매칭 순서: WCO CHAPTER_KEYWORDS (최우선) → CATEGORY_TO_SECTION (fallback)
5. MATERIAL_TO_SECTION은 건드리지 않음
```

## 0-4. Regression 테스트

```
Amazon 169건 (9-field 완벽):
- Before: Section 100%, Chapter 100%, HS6 100%
- After: 100% 유지 필수 → 하나라도 떨어지면 롤백

Clean 20건 (9-field 완벽):
- Before: Section 100%, Chapter 100%
- After: 100% 유지 필수

npm run build — TypeScript 에러 0개
```

## 0-5. 결과 기록

```
POTAL_TLC_Verification.xlsx에 시트 추가:
- CategoryUpgrade_Dashboard: Before vs After 비교 + 97 Chapter 키워드 수
- CategoryUpgrade_Regression: Amazon 169건 + Clean 20건 상세
```

---

# ═══════════════════════════════════════════
# 영역 2: VAT/GST (부가가치세)
# ═══════════════════════════════════════════

> **목표**: 240개국 VAT/GST 계산이 실무와 100% 일치 검증
> **코드 파일**:
>   - `app/lib/cost-engine/GlobalCostEngine.ts` — 메인 VAT 계산
>   - `app/lib/cost-engine/CostEngine.ts` — US Sales Tax, Canada HST/GST+PST
>   - `app/lib/cost-engine/eu-vat-rates.ts` — EU HS Chapter별 경감세율
>   - `app/lib/cost-engine/ioss-oss.ts` — EU IOSS/OSS
>   - `app/lib/tax/ioss-engine.ts` — IOSS 엔진
> **DB 테이블**: `vat_gst_rates` (240행), `countries` (240행)

## 실무 프로세스

```
관세사/세무사의 VAT 계산 과정:
Step 1: 도착지 국가 확인
Step 2: 해당 국가의 VAT/GST 표준세율 확인
Step 3: 상품 HS Code로 경감세율(reduced rate) 해당 여부 확인
   - EU: 식품(Ch 01-21) 경감, 의약품(Ch 30) 0%/경감, 도서(Ch 49) 경감 등
   - UK: 식품 0%, 아동복 0%, 의약품 0%
Step 4: VAT 과세표준 결정 = CIF Value + Import Duty + Customs Fees
   (일부 국가는 CIF만, 일부는 Duty 포함)
Step 5: VAT 금액 = 과세표준 × VAT율
Step 6: De Minimis 확인 — 면세 기준 이하면 VAT도 면제인지?
   (국가마다 다름: EU는 €150 이하 면세 폐지, US는 Sales Tax 별도)
Step 7: IOSS 적용 여부 (EU €150 이하 + 셀러 IOSS 등록 시 → 수입 VAT 면제)
```

## 확인할 코드 경로

```
1. GlobalCostEngine.ts — calculateLandedCost() 내 VAT 계산 부분
   - vatRate 조회 경로 (DB vs 하드코딩)
   - 과세표준 계산 (CIF + duty 포함 여부)
   - EU 경감세율 적용 로직 (eu-vat-rates.ts 호출)

2. eu-vat-rates.ts — getEuReducedVatRate()
   - 12개국 HS Chapter별 경감세율 매핑 정확성
   - 누락된 EU 국가 (27개국 중 12개국만 있음 → 15개국 누락?)

3. CostEngine.ts — US/Canada/Brazil/China/Mexico/India 특수 처리
   - US: STATE_TAX_RATES 50개 주 정확성
   - Canada: HST/GST+PST 주별 정확성
   - Brazil: ICMS + IPI + PIS/COFINS 계산
   - China: CBEC tax + 소포 기준
   - India: IGST 계산

4. ioss-oss.ts — IOSS/OSS 적용 조건
   - €150 기준 정확성
   - 27개국 VAT율 정확성
```

## 테스트 케이스 (20건 — 입력값 100% 완비)

```
일반 케이스 (10건):
TC-01: Electronics $500, CN→DE, HS:852872, Standard VAT 19%
TC-02: Food $100, US→GB, HS:190590, UK Zero-rated food 0%
TC-03: Clothing $200, CN→FR, HS:620442, Standard VAT 20%
TC-04: Books $30, US→IT, HS:490199, Reduced VAT 4% (super-reduced)
TC-05: Medicine $150, IN→DE, HS:300490, Reduced VAT 19%→7%?
TC-06: Electronics $300, CN→JP, HS:851762, Consumption Tax 10%
TC-07: Machinery $5000, DE→US, HS:848180, State Sales Tax (CA 7.25%)
TC-08: Wine $50, FR→AU, HS:220421, GST 10%
TC-09: Cosmetics $80, KR→CA, HS:330499, GST 5% or HST (province-dependent)
TC-10: Textiles $120, BD→SE, HS:520942, EU Standard VAT 25%

엣지케이스 (5건):
TC-11: EU IOSS, $100 parcel, CN→NL, HS:950300, ≤€150 + IOSS=true → import VAT 0
TC-12: EU IOSS 초과, $200 parcel, CN→NL, HS:950300, >€150 → normal VAT 21%
TC-13: Brazil ICMS+IPI, $300 electronics, CN→BR, HS:847130, ICMS 18%+IPI+PIS/COFINS
TC-14: India IGST, $1000 machinery, DE→IN, HS:848180, IGST 18%
TC-15: China CBEC, $50 cosmetics, KR→CN, HS:330499, CBEC rate

극단 케이스 (5건):
TC-16: US no federal VAT, $100 widget, CN→US(OR), HS:392690, Oregon 0% sales tax
TC-17: GCC VAT, $500 electronics, CN→AE, HS:851762, UAE VAT 5%
TC-18: Zero-rated export, $1000 machinery, US→SG, HS:848180, Singapore GST 9%
TC-19: Mexico IVA + IEPS, $50 energy drink, US→MX, HS:220210, IVA 16% + IEPS
TC-20: Canada HST province, $200 clothing, CN→CA(ON), HS:620442, HST 13%

Ground Truth:
- EU: ec.europa.eu/taxation_customs (각국 VAT율)
- UK: gov.uk/vat-rates
- US: taxfoundation.org (주별 sales tax)
- Japan: nta.go.jp (consumption tax 10%)
- India: cbic.gov.in (GST/IGST rates)
- Brazil: receita.fazenda.gov.br
```

---

# ═══════════════════════════════════════════
# 영역 3: De Minimis (면세 기준)
# ═══════════════════════════════════════════

> **목표**: 240개국 De Minimis 기준 정확성 검증
> **코드 파일**:
>   - `app/lib/cost-engine/GlobalCostEngine.ts` — de minimis 체크 로직
>   - `app/lib/cost-engine/CostEngine.ts` — US de minimis ($800→$0 변경)
>   - `app/lib/cost-engine/country-data.ts` — 국가별 de minimis 하드코딩
> **DB 테이블**: `de_minimis_thresholds` (240행), `countries` (240행)

## 실무 프로세스

```
Step 1: 도착지 국가의 de minimis 기준 확인
Step 2: 상품 가치(CIF value)가 기준 이하인지 확인
Step 3: 기준 이하 → Duty 면제? VAT도 면제? (국가마다 다름)
   - US: $800 이하 → duty+tax 면제 (BUT 2025-08 이후 CN/HK 제외)
   - EU: €150 이하 → duty 면제, VAT는 부과 (2021.07 IOSS 이후)
   - UK: £135 이하 → duty 면제, VAT는 seller 부담
   - AU: A$1,000 이하 → duty 면제 (GST는 2018 이후 부과)
   - CA: C$20 이하 → duty+tax 면제 (C$150 계획 중)
   - JP: ¥10,000 이하 → duty 면제
Step 4: 환율 변환 (USD → 현지 통화 기준)
Step 5: 면제 판정 적용
```

## 확인할 코드 경로

```
1. GlobalCostEngine.ts — de minimis 판정 위치
   - duty와 VAT에 각각 적용하는지?
   - CIF 기준인지 FOB 기준인지?

2. CostEngine.ts — US 특수 처리
   - $800 기준 코드 (2025-08 이후 CN/HK $0 변경 반영 여부)
   - CHINA_IMPORT_DUTY_RATE = 20% 적용 조건

3. country-data.ts — 240개국 de minimis 하드코딩 값
   - DB와 일치하는지?
   - 최신 변경 반영 여부 (US $800→$0 for CN)

4. de_minimis_thresholds 테이블 — 240행 값 정확성
   - 통화 + 금액 + duty_exempt + vat_exempt 필드 확인
```

## 테스트 케이스 (20건)

```
일반 (10건): 주요국 de minimis 경계값 테스트
TC-01: $790 parcel, CN→US, HS:950300 — under $800 → duty free? (2025-08 이후 확인)
TC-02: $810 parcel, CN→US, HS:950300 — over $800
TC-03: €140 parcel, CN→DE, HS:950300 — under €150 → duty free, VAT 부과
TC-04: €160 parcel, CN→DE, HS:950300 — over €150
TC-05: £130 parcel, CN→GB, HS:950300 — under £135
TC-06: A$990 parcel, CN→AU, HS:950300 — under A$1,000
TC-07: C$15 parcel, CN→CA, HS:950300 — under C$20
TC-08: ¥9,000 parcel, CN→JP, HS:950300 — under ¥10,000
TC-09: $100 parcel, CN→KR, HS:950300 — KR de minimis ($150)
TC-10: $50 parcel, US→MX, HS:950300 — MX de minimis ($50)

엣지케이스 (5건):
TC-11: US CN exclusion, $100 parcel, CN→US — 2025-08 이후 $0 de minimis
TC-12: US non-CN, $100 parcel, JP→US — 여전히 $800 de minimis
TC-13: EU IOSS vs non-IOSS, €100 parcel, CN→FR — IOSS 등록 여부에 따른 차이
TC-14: 환율 경계, $149 (=€139), CN→DE — USD→EUR 변환 후 판정
TC-15: AU GST on low-value, A$500, CN→AU — duty 면제 but GST 부과

극단 (5건):
TC-16: $0.01 parcel, CN→US — 최소값
TC-17: De minimis 없는 국가 (BR $0) — 브라질은 모든 수입에 과세
TC-18: 여러 패키지 합산 (split shipment), $400×2, CN→US — 합산 $800 초과?
TC-19: Gift exemption, $100 gift, US→CA — 선물 별도 기준
TC-20: 면세 상품 (HS Ch.30 의약품), $500, IN→GB — de minimis와 별개로 면세

Ground Truth:
- 각국 세관 공식 사이트
- WTO Trade Facilitation Agreement
- POTAL DB (de_minimis_thresholds) 교차 검증
```

---

# ═══════════════════════════════════════════
# 영역 4: Special Tax (특별소비세)
# ═══════════════════════════════════════════

> **목표**: 12개국 특수세금 정확성 검증
> **코드 파일**:
>   - `app/lib/cost-engine/GlobalCostEngine.ts` — 특수세금 계산 부분
>   - `app/lib/cost-engine/CostEngine.ts` — Brazil/China/Mexico/India 상세
> **DB**: 하드코딩 위주 (country-data.ts + CostEngine.ts 내장)

## 12개국 특수세금 목록

```
1. Brazil — ICMS(주세) + IPI(연방소비세) + PIS/COFINS(사회기여금) + AFRMM(해운세)
2. India — IGST + Basic Customs Duty + Social Welfare Surcharge + Agriculture Infra Cess
3. Mexico — IEPS(특별소비세: 주류, 담배, 에너지음료, 설탕음료) + DTA(통관세)
4. China — Consumption Tax(소비세: 화장품, 보석, 자동차, 주류) + CBEC Tax
5. Turkey — Special Consumption Tax(ÖTV: 자동차, 석유, 주류, 담배)
6. South Korea — Individual Consumption Tax(개별소비세: 보석, 고급시계, 자동차)
7. Japan — Liquor Tax + Tobacco Tax + Gasoline Tax
8. Thailand — Excise Tax(물품세: 자동차, 주류, 담배, 음료)
9. Philippines — Excise Tax(자동차, 주류, 담배, 광물)
10. Indonesia — Luxury Goods Sales Tax(PPnBM: 자동차, 전자, 보석)
11. Egypt — Table Tax(주류, 담배, 석유)
12. Nigeria — Excise Duty(주류, 담배) + CISS(1% Comprehensive Import Supervision Scheme)
```

## 테스트 케이스 (20건)

```
TC-01: Brazil electronics, $300 laptop, CN→BR, HS:847130 — ICMS+IPI+PIS/COFINS
TC-02: India machinery, $5000 CNC, DE→IN, HS:845961 — IGST 18%+BCD+SWS
TC-03: Mexico tequila, $50 bottle, MX domestic→export check, HS:220890 — IEPS 53%
TC-04: China cosmetics, $100 lipstick, FR→CN, HS:330410 — Consumption Tax 15%
TC-05: Turkey automobile, $30000 car, DE→TR, HS:870323 — ÖTV 80%+
TC-06: Korea jewelry, $2000 necklace, IT→KR, HS:711319 — 개별소비세 20%
TC-07: Japan whiskey, $100 bottle, GB→JP, HS:220830 — Liquor Tax
TC-08: Thailand car, $25000 sedan, JP→TH, HS:870322 — Excise Tax
TC-09: Philippines cigarettes, $20 carton, US→PH, HS:240220 — Excise
TC-10: Indonesia luxury watch, $5000, CH→ID, HS:910121 — PPnBM

엣지케이스 (5건):
TC-11: Brazil São Paulo vs Rio ICMS 차이, CN→BR(SP) vs CN→BR(RJ)
TC-12: China CBEC small parcel, $30 skincare, KR→CN, HS:330499
TC-13: India Cess on agricultural, $500 wheat, AU→IN, HS:100199
TC-14: Mexico sugar drink IEPS, $10 cola, US→MX, HS:220210
TC-15: Korea luxury car individual consumption tax, $80000 BMW, DE→KR, HS:870324

극단 (5건):
TC-16: 특수세금 0% (해당 없는 일반 상품), $100 t-shirt, CN→BR, HS:610910
TC-17: 다중 특수세금 합산, $200 perfume, FR→IN, HS:330300 — BCD+IGST+Cess
TC-18: 면세 특수세금 (FTA로 면제), $500 electronics, KR→IN, HS:847130 — CEPA
TC-19: CBEC vs 일반 수입, $500 vs $5000 electronics, US→CN — 세율 차이
TC-20: Egypt table tax on alcohol, $100 wine, FR→EG, HS:220421

Ground Truth:
- Brazil: receita.fazenda.gov.br (IPI/PIS/COFINS 세율표)
- India: cbic.gov.in (IGST + Cess rates)
- Mexico: sat.gob.mx (IEPS 세율)
- China: customs.gov.cn (Consumption Tax)
- 각국 세관 공식 세율표
```

---

# ═══════════════════════════════════════════
# 영역 5: Customs Fees (통관 수수료)
# ═══════════════════════════════════════════

> **목표**: 240개국 통관 수수료 정확성 검증
> **코드 파일**:
>   - `app/lib/cost-engine/CostEngine.ts` — MPF, HMF 등
>   - `app/lib/cost-engine/country-data.ts` — 국가별 customs_fees
>   - `app/lib/cost-engine/GlobalCostEngine.ts` — 수수료 적용
> **DB 테이블**: `customs_fees` (240행)

## 실무 프로세스

```
Step 1: 도착지 국가의 통관 수수료 체계 확인
Step 2: 수수료 유형 분류:
   - 종가세형: CIF의 X% (예: 인도 1% Social Welfare Surcharge)
   - 고정형: 건당 고정 금액 (예: 일본 ¥200 통관 수수료)
   - 구간형: CIF 구간별 차등 (예: US MPF $2.69~$538.40)
Step 3: 각 수수료 계산 적용
Step 4: 총 수수료 = 합산
```

## 테스트 케이스 (20건)

```
TC-01: US MPF, $500 goods, CN→US — MPF 0.3464% ($2.69 min, $538.40 max)
TC-02: US HMF, $500 ocean freight, CN→US — HMF 0.125%
TC-03: EU no customs processing fee (개인), $200, CN→DE
TC-04: UK customs clearance, £500, CN→GB — handling fee
TC-05: Japan customs clearance, ¥50000, CN→JP — ¥200 flat
TC-06: Australia import processing charge, A$1000, CN→AU — A$88 formal
TC-07: Canada CBSA processing, C$500, CN→CA — C$8 informal
TC-08: Korea customs clearance, ₩500000, CN→KR — 교육세 포함
TC-09: India customs handling, $1000, DE→IN — 1% SWS
TC-10: Brazil Siscomex fee, $300, CN→BR — R$185 fixed

엣지케이스 (5건):
TC-11: US MPF minimum, $10 parcel, CN→US — $2.69 minimum
TC-12: US MPF maximum, $200000 shipment, CN→US — $538.40 cap
TC-13: EU customs broker fee (상업), €10000, CN→DE — broker 별도
TC-14: Informal vs Formal entry, US $2500 boundary
TC-15: Multiple fees 합산, $5000, CN→IN — BCD+SWS+handling

극단 (5건):
TC-16: Free trade zone (FTZ), $1000, CN→US(FTZ) — 수수료 유예
TC-17: ATA Carnet temporary import, $5000, US→EU
TC-18: De minimis 이하인데 수수료는 있는 경우
TC-19: 항공 vs 해상 수수료 차이
TC-20: 면세 but 수수료 부과 (US ITA 면세제품 + MPF)

Ground Truth:
- US: cbp.gov (MPF/HMF rates)
- EU: taxation-customs.ec.europa.eu
- 각국 세관 공식 fee schedule
```

---

# ═══════════════════════════════════════════
# 영역 6: AD/CVD (반덤핑/상계관세)
# ═══════════════════════════════════════════

> **목표**: 119,706건 무역구제 데이터 정확성 + 적용 로직 검증
> **코드 파일**:
>   - `app/lib/cost-engine/trade-remedy-lookup.ts` — AD/CVD 조회
>   - `app/lib/cost-engine/section301-lookup.ts` — US Section 301/232
>   - `app/lib/trade/remedy-calculator.ts` — 구제 관세 계산
> **DB 테이블**: `trade_remedy_cases` (10,999), `trade_remedy_duties` (37,513), `trade_remedy_products` (55,259), `safeguard_exemptions` (15,935)

## 실무 프로세스

```
Step 1: 원산지+도착지+HS Code로 AD/CVD 해당 여부 조회
Step 2: AD 해당 → firm-specific rate or "All Others" rate
Step 3: CVD 해당 → firm-specific rate or "All Others" rate
Step 4: Safeguard 해당 → exemption 확인 (FTA/LDC 면제)
Step 5: Section 301 해당 (US만) → List별 추가 관세
Step 6: Section 232 해당 (US만) → Steel 25% / Aluminum 10%
Step 7: 총 추가 관세 = AD + CVD + Safeguard + Section 301 + Section 232
```

## 테스트 케이스 (20건)

```
TC-01: CN→US steel, HS:720917 — AD+CVD (firm: Baoshan → specific rate)
TC-02: CN→US solar panels, HS:854140 — AD+CVD (All Others rate)
TC-03: CN→US aluminum, HS:760120 — Section 232 (10%) + possible AD/CVD
TC-04: CN→US washing machines, HS:845011 — Safeguard (Samsung/LG specific)
TC-05: VN→US shrimp, HS:030617 — AD (country-wide)
TC-06: KR→US steel, HS:720917 — Section 232 exempt (KORUS)
TC-07: CN→EU steel, HS:721049 — EU Safeguard TRQ
TC-08: CN→EU solar panels, HS:854140 — EU AD (minimum import price)
TC-09: IN→US steel pipe, HS:730630 — AD+CVD
TC-10: TH→US rubber, HS:400122 — no AD/CVD (clean route)

엣지케이스 (5건):
TC-11: Firm-specific vs All Others, CN→US, specific company name match
TC-12: HS hierarchical match, 6-digit match vs 4-digit vs 2-digit fallback
TC-13: Section 301 List 4A reduced rate (7.5% vs 25%)
TC-14: Multiple remedies stack: AD + CVD + Section 301 + Section 232
TC-15: Safeguard exemption (LDC origin), BD→EU steel

극단 (5건):
TC-16: 250%+ total rate (AD 200% + CVD 50%), CN→US specific product
TC-17: Zero AD/CVD (investigation concluded, no duty imposed)
TC-18: Sunset review expired → duty no longer applicable
TC-19: Circumvention (3rd country transshipment), CN→VN→US
TC-20: Provisional vs Final duty rates

Ground Truth:
- US: usitc.gov AD/CVD database + Federal Register
- EU: trade.ec.europa.eu/tdi/ (Trade Defence Instruments)
- POTAL DB (trade_remedy_cases/duties/products) 교차 검증
```

---

# ═══════════════════════════════════════════
# 영역 7: Rules of Origin (원산지 규정)
# ═══════════════════════════════════════════

> **목표**: 63개 FTA 원산지 규정 적용 정확성 검증
> **코드 파일**:
>   - `app/lib/trade/roo-engine.ts` — RoO 평가 엔진
>   - `app/lib/cost-engine/db/fta-db.ts` — FTA 조회
>   - `app/lib/cost-engine/hs-code/fta.ts` — FTA 하드코딩 fallback
> **DB 테이블**: `macmap_trade_agreements` (1,319행)

## 실무 프로세스

```
Step 1: 원산지+도착지 간 적용 가능한 FTA 확인
Step 2: 해당 FTA의 PSR (Product Specific Rule) 확인
Step 3: 원산지 기준 충족 여부 판정:
   - WO (Wholly Obtained): 농산물/광물
   - CTH (Change in Tariff Heading): 소재→제품 heading 변경
   - RVC (Regional Value Content): 역내 부가가치 비율
   - CC (Change in Chapter): 더 큰 단위 변경
Step 4: 충족 → FTA 특혜세율 적용
Step 5: 미충족 → MFN 세율 적용
```

## 테스트 케이스 (20건)

```
TC-01: KORUS, auto parts KR→US, HS:870829 — RVC 35% threshold
TC-02: USMCA, electronics MX→US, HS:847130 — RVC 75%
TC-03: RCEP, textiles VN→JP, HS:520942 — CTH
TC-04: CPTPP, wine AU→JP, HS:220421 — WO (wholly obtained)
TC-05: EU-UK TCA, chemicals DE→GB, HS:290531 — CTH
TC-06: EU-KR FTA, auto DE→KR, HS:870323 — RVC 55%
TC-07: AANZFTA, electronics TH→AU, HS:851762 — RVC 40%
TC-08: CAFTA-DR, textiles GT→US, HS:610910 — yarn forward rule
TC-09: EFTA-KR, machinery CH→KR, HS:848180 — CTH
TC-10: Singapore-US FTA, electronics SG→US, HS:854231 — WO/RVC

엣지케이스 (5건):
TC-11: Multiple FTA available (RCEP vs CPTPP), VN→JP — 낮은 세율 자동 선택
TC-12: FTA exclusion (특정 HS 제외), sensitive agricultural
TC-13: Cumulation (재료를 FTA 역내국에서 조달), diagonal cumulation
TC-14: De minimis tolerance (10% non-originating), textile yarn
TC-15: Transitional provisions (점진적 관세 인하 스케줄)

극단 (5건):
TC-16: No FTA (CN→US), MFN만 적용
TC-17: Same country (domestic), US→US — "Domestic" 판정
TC-18: GSP/LDC preferential (FTA 아닌 일방적 특혜), BD→EU
TC-19: Withdrawal/suspension (FTA 중단), RU→EU post-sanctions
TC-20: FTA but RVC not met → MFN fallback

Ground Truth:
- 각 FTA 원문 부속서 (양허표 + PSR)
- WTO RTA-IS database (rtais.wto.org)
- POTAL DB (macmap_trade_agreements) 교차 검증
```

---

# ═══════════════════════════════════════════
# 영역 8: Currency (환율)
# ═══════════════════════════════════════════

> **목표**: 환율 변환 정확성 검증
> **코드 파일**:
>   - `app/lib/cost-engine/exchange-rate/exchange-rate-service.ts`
>   - `app/lib/cost-engine/GlobalCostEngine.ts` — 환율 적용 위치
> **외부 API**: ECB (European Central Bank)

## 실무 프로세스

```
Step 1: 계산 통화 확인 (API 입력 = USD)
Step 2: 도착지 국가 현지 통화 확인
Step 3: 환율 조회 (ECB API or 캐시)
Step 4: 세관 기준 환율 사용 (각국 세관은 자체 환율 사용하기도 함)
Step 5: 최종 금액 변환
```

## 테스트 케이스 (20건 — 환율 정확성 + 적용 위치)

```
TC-01~10: 주요 10개 통화 환율 정확성 (USD/EUR/GBP/JPY/KRW/CNY/AUD/CAD/BRL/INR)
TC-11~15: 환율 적용 위치 (duty 계산 전? 후? 최종 표시만?)
TC-16~20: 환율 캐시 (실시간 vs 일일 vs 주간), 소수점 처리, 역방향 변환

Ground Truth: ECB 공식 환율 (ecb.europa.eu)
```

---

# ═══════════════════════════════════════════
# 영역 9: Insurance/Shipping (보험/운송)
# ═══════════════════════════════════════════

> **목표**: CIF 계산 기초가 되는 보험료/운송비 정확성 검증
> **코드 파일**:
>   - `app/lib/shipping/shipping-calculator.ts`
>   - `app/lib/cost-engine/insurance-calculator.ts`
>   - `app/lib/trade/incoterms.ts` — Incoterms 해석
> **참조**: CIF = Cost + Insurance + Freight

## 테스트 케이스 (20건)

```
TC-01~05: Shipping 비용 (지역별: NA/EU/ASIA, 티어별: express/standard/economy)
TC-06~10: Insurance 비용 (상품 카테고리별: electronics 1.5%, textiles 0.8%, hazmat 3%)
TC-11~15: CIF 계산 (FOB + Insurance + Freight = CIF)
TC-16~20: Incoterms (FOB/CIF/DDP/EXW) 해석 + 비용 분배

Ground Truth: 수동 계산 (공식 × 데이터)
```

---

# ═══════════════════════════════════════════
# 영역 10: Export Controls (수출 통제)
# ═══════════════════════════════════════════

> **목표**: ECCN 분류 + 라이선스 요구 정확성 검증
> **코드 파일**:
>   - `app/lib/compliance/export-controls.ts`
> **참조**: BIS EAR (Export Administration Regulations)

## 테스트 케이스 (20건)

```
TC-01~05: ECCN 카테고리 분류 (HS→ECCN 매핑)
   - Ch 84→Category 2, Ch 85→Category 3, Ch 88→Category 9, Ch 90→Category 6
TC-06~10: 통제 대상국 (CU/IR/KP/SY/RU/BY) → license required
TC-11~15: EAR99 (통제 대상 아닌 일반 상품) 판정
TC-16~20: License exception (STA/TMP/RPL 등) 적용

Ground Truth: BIS CCL (Commerce Control List), EAR Part 774
```

---

# ═══════════════════════════════════════════
# 영역 11: Sanctions (제재 스크리닝)
# ═══════════════════════════════════════════

> **목표**: 21,301건 제재 리스트 스크리닝 정확성 검증
> **코드 파일**:
>   - `app/lib/compliance/fuzzy-screening.ts`
>   - `app/lib/cost-engine/screening/screen.ts`
>   - `app/lib/cost-engine/screening/db-screen.ts`
> **DB 테이블**: `sanctions_entries` (21,301), `sanctions_aliases` (22,328), `sanctions_addresses` (24,176), `sanctions_ids` (8,000)

## 테스트 케이스 (20건)

```
TC-01~05: 정확 매칭 (OFAC SDN 리스트에 있는 실제 이름)
TC-06~10: 퍼지 매칭 (오타/변형: "Huawei" vs "Huawey", "Kaspersky" vs "Kasperskiy")
TC-11~13: 별칭 매칭 (sanctions_aliases 활용)
TC-14~15: False positive 최소화 (일반 이름이 제재 대상과 유사한 경우)
TC-16~18: 국가 제재 (CU/IR/KP/SY/RU 전체 국가 제재)
TC-19~20: Batch screening 성능 + 정확성

Ground Truth: OFAC SDN list (ofac.treasury.gov), BIS Entity List
```

---

# ═══════════════════════════════════════════
# 전체 완료 후 최종 정리
# ═══════════════════════════════════════════

## POTAL_TLC_Verification.xlsx 최종 구조

```
기존 시트 (Duty Rate — Area 1 완료):
- DutyRate_Dashboard
- DutyRate_TestCases
- DutyRate_5Round

추가 시트 (Area 0 + Area 2~11):
- CategoryUpgrade_Dashboard + CategoryUpgrade_Regression
- VATGST_Dashboard + VATGST_TestCases + VATGST_5Round + VATGST_GapAnalysis
- DeMinimis_Dashboard + DeMinimis_TestCases + DeMinimis_5Round + DeMinimis_GapAnalysis
- SpecialTax_Dashboard + SpecialTax_TestCases + SpecialTax_5Round + SpecialTax_GapAnalysis
- CustomsFees_Dashboard + CustomsFees_TestCases + CustomsFees_5Round + CustomsFees_GapAnalysis
- ADCVD_Dashboard + ADCVD_TestCases + ADCVD_5Round + ADCVD_GapAnalysis
- RoO_Dashboard + RoO_TestCases + RoO_5Round + RoO_GapAnalysis
- Currency_Dashboard + Currency_TestCases + Currency_5Round + Currency_GapAnalysis
- InsuranceShipping_Dashboard + InsuranceShipping_TestCases + InsuranceShipping_5Round + InsuranceShipping_GapAnalysis
- ExportControls_Dashboard + ExportControls_TestCases + ExportControls_5Round + ExportControls_GapAnalysis
- Sanctions_Dashboard + Sanctions_TestCases + Sanctions_5Round + Sanctions_GapAnalysis
- TLC_SUMMARY — 12개 영역 종합 (총 테스트 건수, 총 GAP 수, 총 수정 수, 전체 정확도)
```

## 전체 영역 마감 후

```
=== POTAL TLC 전체 검증 완료 ===
| 영역 | 테스트 | PASS | GAP | 수정 | 상태 |
|------|--------|------|-----|------|------|
| 0 Category | regression | ?/? | ? | ? | |
| 1 Duty Rate | 55 | 55 | 9 | 12 | ✅ 100% |
| 2 VAT/GST | 55 | ?/55 | ? | ? | |
| 3 De Minimis | 55 | ?/55 | ? | ? | |
| 4 Special Tax | 55 | ?/55 | ? | ? | |
| 5 Customs Fees | 55 | ?/55 | ? | ? | |
| 6 AD/CVD | 55 | ?/55 | ? | ? | |
| 7 RoO | 55 | ?/55 | ? | ? | |
| 8 Currency | 55 | ?/55 | ? | ? | |
| 9 Insurance/Ship | 55 | ?/55 | ? | ? | |
| 10 Export Ctrl | 55 | ?/55 | ? | ? | |
| 11 Sanctions | 55 | ?/55 | ? | ? | |
| 총계 | 605+ | ?/605 | ? | ? | |
```
