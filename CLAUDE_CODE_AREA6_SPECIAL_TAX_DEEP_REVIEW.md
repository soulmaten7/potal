# Area 6: Special Tax (12개국 특수세금) — Deep Review
# Brazil IPI + India IGST/SWS + China CBEC/Consumption Tax + Mexico IEPS + Processing Fees

## 목표
12개국 특수세금 코드 전체 심층 리뷰 + 5회 자체 검수. CW18 5차에서 46건 수정 중 이 영역에서 금액 영향 TOP 5 중 4건 발견됨 — 수정이 제대로 반영됐는지 재확인 포함.

## ⚠️ 절대 규칙
1. **Area 6만 한다. 끝나면 멈춰라. Area 7로 넘어가지 마라.**
2. **5회 자체 검수 전부 디테일하게 실행** — "PASS" 한 줄로 끝내지 마라. 각 검수마다 개별 테스트 결과 전부 표시
3. **rapidly 금지** — 하나씩 천천히 정확하게
4. **발견한 버그는 즉시 수정** — 수정 전/후 코드 명시
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## Phase 1: 코드 읽기 (전체 파악)

아래 파일들을 **전부** 읽는다:

```bash
# 1. CostEngine.ts — 12개국 특수세금 메인 계산 엔진
#    핵심: calculateBrazilImportTaxes(), calculateIndiaImportTaxes(), calculateChinaCBECTaxes(), calculateMexicoImportTaxes()
#    + getBrazilIpiRate(), getIndiaIgstRate(), getChinaConsumptionTaxRate(), getMexicoIepsRate()
#    + BRAZIL_IPI_BY_CHAPTER, INDIA_IGST_RATES, CHINA_CONSUMPTION_TAX, MEXICO_IEPS_RATES
#    + US MPF/HMF, AU IPC, NZ MPI, CA CBSA, JP customs, KR KCS, IN landing charges, BR statistical, TH customs, ID DTA, SG TradeNet
cat app/lib/cost-engine/CostEngine.ts

# 2. GlobalCostEngine.ts — TLC에서 특수세금 합산 위치 + Processing Fee 계산
#    핵심: calculateGlobalLandedCost() 내 Brazil/India/China/Mexico 분기
#    + Processing Fee switch/case 12개국
cat app/lib/cost-engine/GlobalCostEngine.ts

# 3. country-data.ts — US de minimis (CN $0 vs 비중국 $800) + 국가별 세금 설정
#    핵심: CW18 5차에서 수정된 US de minimis 로직 확인
cat app/lib/cost-engine/country-data.ts

# 4. eu-vat-rates.ts — EU 27국 경감세율 (CW18 5차에서 12→27국 확장)
#    핵심: 15개국 경감세율 추가 확인
cat app/lib/cost-engine/eu-vat-rates.ts

# 5. breakdown.ts — 세금 항목별 breakdown 출력
cat app/lib/cost-engine/breakdown.ts

# 6. API Routes — 특수세금 관련 엔드포인트
cat app/api/v1/tax/special/route.ts
cat app/api/v1/tax/us-sales-tax/route.ts
cat app/api/v1/ioss/route.ts
cat app/api/v1/ioss/check/route.ts
cat app/api/v1/ioss/compare/route.ts
cat app/api/v1/calculate/breakdown/route.ts

# 7. spot-checker.ts — 자동 검증에서 특수세금 케이스 확인
cat app/lib/monitoring/spot-checker.ts

# 8. DB 테이블 현황 — vat_gst_rates, customs_fees 확인
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT count(*) as cnt FROM vat_gst_rates;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT count(*) as cnt FROM customs_fees;"}'

# 9. DB 샘플 — vat_gst_rates에서 12개국 특수세금 국가 확인
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT country_code, vat_rate, reduced_rate, special_tax_type, special_tax_rate FROM vat_gst_rates WHERE country_code IN ('"'"'BR'"'"', '"'"'IN'"'"', '"'"'CN'"'"', '"'"'MX'"'"', '"'"'US'"'"', '"'"'AU'"'"', '"'"'NZ'"'"', '"'"'CA'"'"', '"'"'JP'"'"', '"'"'KR'"'"', '"'"'TH'"'"', '"'"'SG'"'"') ORDER BY country_code;"}'
```

---

## Phase 2: 12개 분석 영역 (하나씩 순서대로)

### 분석 1: Brazil 캐스케이딩 세금 (IPI + PIS/COFINS + ICMS "por dentro")
**검증 항목:**
- `BRAZIL_IPI_BY_CHAPTER` — 95 chapter별 세율이 TIPI(Receita Federal) 기준 맞는지
- CW18 5차 수정: "일괄 10% → 95-chapter별 세율" — 실제 코드에 반영됐는지
- 의류 Ch.61/62 = 0% (IPI 면세), 차량 Ch.87 = 25%, 담배 Ch.24 = 300% — 맞는지
- `getBrazilIpiRate()` fallback `?? 0.10` — 미등록 chapter에 10% 기본값이 적절한지
- ICMS "por dentro" 수식: `base = total / (1 - icmsRate)` — 수학적으로 맞는지 검증
- PIS/COFINS 고정값 9.25% (`0.0925`) — 현행 법적 기준 확인
- 상파울루 ICMS 18%, 미나스 제라이스 18%, 리우 20% 등 주별 세율이 코드에 있는지
- `cepToState()` — CEP(우편번호) → 주 매핑이 정확한지

### 분석 2: India 세금 (BCD + SWS + IGST + Cess)
**검증 항목:**
- `INDIA_IGST_RATES` — Chapter별 IGST 세율이 CBIC GST Rate Schedule 기준 맞는지
- CW18 5차 수정: "Ch.71 금/보석 IGST 28%→3%" — 실제 코드에 반영됐는지 ($10,000 금 바 = $2,500 차이)
- SWS(Social Welfare Surcharge) 10% of BCD — 현행 기준 맞는지
- IGST base = CIF + BCD + SWS — 수식 맞는지 (IGST는 BCD+SWS 포함 금액에 부과)
- Landing charges 1% of CIF — Processing Fee에 포함되는지
- Cess (Health Cess, Agriculture Cess 등) — 코드에서 처리되는지? 누락된 cess 항목 있는지
- `getIndiaIgstRate()` fallback `?? 0.18` — 미등록 chapter에 18% 기본값이 적절한지

### 분석 3: China 세금 (CBEC + Consumption Tax + VAT)
**검증 항목:**
- CBEC(Cross-Border E-Commerce) 면세 기준: RMB 5,000/건, RMB 26,000/년
- CBEC 세율: VAT*0.7 + ConsumptionTax*0.7 = 실질 9.1% (일반 상품)
- `CHINA_CONSUMPTION_TAX` — 소비세 대상 품목 + 세율이 국무원 消费税暂行条例 기준 맞는지
- 화장품 Ch.33 = 15%, 주류 Ch.22 = 20%, 귀금속 Ch.71 = 10%, 담배 = 50% — 확인
- 가격 기준 면세: 단건 RMB 5,000 초과 시 CBEC 아닌 일반 수입 → full duty + VAT 13%
- `getChinaConsumptionTaxRate()` 에서 chapter 2자리 매칭 → heading 4자리 필요한 품목 있는지

### 분석 4: Mexico 세금 (IVA + IEPS)
**검증 항목:**
- `MEXICO_IEPS_RATES` — heading별 IEPS 세율이 Ley del IEPS / SAT 기준 맞는지
- CW18 5차 수정: "주류 HS 2208 IEPS 26.5%→53%" — 실제 코드에 반영됐는지 (위스키 수입 2배 차이)
- IVA 16% — 현행 기준 맞는지 (국경지대 8% 아닌지?)
- IVA base = CIF + duty + IEPS — IVA가 IEPS 포함 금액에 부과되는지 (캐스케이딩)
- 담배 heading별 세율 차이: 2402(시가) vs 2403(가공담배) 세율 구분 있는지
- `getMexicoIepsRate()` — h4(heading) 먼저 매칭 → ch(chapter) fallback → 0 — 우선순위 맞는지

### 분석 5: US Processing Fees (MPF + HMF)
**검증 항목:**
- MPF(Merchandise Processing Fee): 0.3464% of value, min $31.67, max $614.35 (formal entry) — 현행 기준
- MPF informal entry: $2.69-$12.09 범위 — 현행 기준
- HMF(Harbor Maintenance Fee): 0.125% of value — 현행 기준
- CW18 5차 수정: "CN-only → 전체 원산지" — US MPF가 모든 원산지에 적용되는지 확인
- de minimis 적용 시 MPF 면제 여부 — $800 이하이면 MPF도 면제되는지?
- formal vs informal entry 구분 기준: $2,500 — 코드에서 어떻게 분기하는지

### 분석 6: US de minimis (CN $0 vs 비중국 $800)
**검증 항목:**
- CW18 5차 수정: "모든 origin $0 → CN $0 유지, 비중국 $800" — 실제 코드 확인
- country-data.ts에서 US de minimis 로직: origin이 CN이면 $0, 나머지는 $800
- IEEPA Executive Order (2025): 중국/홍콩 de minimis $0 — HK도 포함되는지?
- T86 Entry Type: de minimis $800 이하 간이 통관 — 코드에서 entry type 구분 있는지
- de minimis 이하일 때 duty=0 + MPF=0 + HMF=0 전부 면제되는지

### 분석 7: 12개국 Processing Fee 정확성
**검증 항목 (GlobalCostEngine.ts switch/case):**
- US: MPF 0.3464% (formal) / $2.69-$12.09 (informal) + HMF 0.125%
- AU: IPC AUD 88 (~$56) — 현행 기준
- NZ: MPI Biosecurity Levy NZD 28.56 (~$17) — 현행 기준
- CA: CBSA handling fee — 얼마? 고정? 비율?
- JP: Customs processing fee — 얼마?
- KR: KCS clearance fee — 얼마?
- IN: Landing charges 1% of CIF — 맞는지
- BR: Statistical fee (AFRMM 8% of CIF for sea freight) — 코드에 있는지?
- TH: Customs clearance est. — 얼마?
- ID: DTA 0.8% customs processing — 현행 기준
- SG: TradeNet permit fee — 얼마?
- EU/UK: 별도 processing fee 없음 — 맞는지

### 분석 8: EU 27국 경감세율 (eu-vat-rates.ts)
**검증 항목:**
- CW18 5차 수정: "12국→27국 경감세율 완성" (15개국 추가)
- EU 27개 회원국 전부 있는지: AT/BE/BG/HR/CY/CZ/DK/EE/FI/FR/DE/GR/HU/IE/IT/LV/LT/LU/MT/NL/PL/PT/RO/SK/SI/ES/SE
- 각 국가별 standard rate + reduced rate가 EU Commission 공식 데이터와 일치하는지
- 초경감세율(super-reduced rate): FR 2.1%, ES 4%, IT 4%, LU 3% 등 — 포함되는지?
- 주요 국가 검증: DE 19%(standard)/7%(reduced), FR 20%/5.5%, IT 22%/10%, ES 21%/10%

### 분석 9: IOSS (Import One-Stop Shop) 엔드포인트
**검증 항목:**
- IOSS 적용 조건: EU + 가격 ≤ EUR 150 — 코드에서 정확한 기준 확인
- IOSS 등록: non-EU seller가 EU 판매 시 VAT를 판매 시점에 수집 → 수입 시 VAT 면제
- `/api/v1/ioss/check` — IOSS 대상 여부 판단
- `/api/v1/ioss/compare` — IOSS vs non-IOSS 비용 비교
- EUR 150 기준: 관세가치(customs value)인지 판매가격(selling price)인지
- GBP 135 (UK equivalent) — UK도 IOSS와 유사한 시스템이 있는지

### 분석 10: GlobalCostEngine에서 특수세금 합산 방식
**검증 항목:**
- Brazil: IPI + PIS/COFINS + ICMS가 별도 항목으로 breakdown에 표시되는지
- India: SWS + IGST가 별도 항목인지
- China: CBEC 모드 vs 일반 수입 모드 분기가 올바른지
- Mexico: IVA + IEPS가 별도 항목인지
- Processing Fee가 TLC total에 합산되는지
- effectiveVatLabel: BR='IPI+PIS+ICMS', IN='IGST+SWS', CN='CBEC' or 'VAT+CT', MX='IVA+IEPS' — 정확한지
- `calculateGlobalLandedCost()`와 `calculateLandedCostSync()` 두 함수의 특수세금 로직이 동기화되어 있는지

### 분석 11: US Sales Tax (State/County/City)
**검증 항목:**
- `STATE_TAX_RATES` — 50개 주 + DC 세율이 있는지
- 주별 세율 정확성: CA ~7.25%, TX ~6.25%, NY ~4%, FL ~6% 등
- 주 + county + city 합산 로직이 있는지 vs 주 세율만 있는지
- `zipcodeToState()` — ZIP code → 주 매핑 정확성
- Sales tax는 import duty와 별도 (landed cost에 포함? 별도 항목?)
- Use tax: 일부 주에서 수입품에 use tax 부과 — 코드에 있는지

### 분석 12: Canada Provincial Tax (GST + PST/HST/QST)
**검증 항목:**
- `CANADA_PROVINCE_TAX_RATES` — 13개 주/준주 세율
- GST 5% (연방) + PST/HST/QST (주별) — 올바른 합산
- HST 주: ON 13%, NS/NB/NL/PE 15% — 맞는지
- QST: QC 9.975% (GST 별도) — 맞는지
- `postalCodeToProvince()` — 우편번호 첫 글자 매핑 (A=NL, B=NS, ...) — 정확한지
- BC PST 7%, SK PST 6%, MB PST 7% — 맞는지

---

## Phase 3: 테스트 케이스 36건

### TC-01~06: Brazil 캐스케이딩 세금 6건
```
TC-01: BR, HS 6109.10 (cotton t-shirt, Ch.61), $50, duty 35% → IPI 0%(의류 면세), PIS 9.25%, ICMS por dentro 계산
TC-02: BR, HS 8703.23 (passenger car, Ch.87), $30,000, duty 35% → IPI 25%, 총 세금률 확인
TC-03: BR, HS 2402.20 (cigarettes, Ch.24), $100, duty 20% → IPI 300%, 캐스케이딩 확인
TC-04: BR, HS 3304.99 (cosmetics, Ch.33), $200, duty 18% → IPI rate 확인
TC-05: BR, HS 9999.99 (미등록 chapter), $100 → IPI fallback 10% 확인
TC-06: BR, CEP 01310-100 (상파울루) → ICMS 18% 확인
```

### TC-07~11: India 세금 5건
```
TC-07: IN, HS 7108.13 (gold bar, Ch.71), $10,000, BCD 12.5% → IGST 3%(수정 확인), SWS 10%*BCD
TC-08: IN, HS 8471.30 (laptop, Ch.84), $1,000, BCD 0% → IGST 18%, SWS = 0
TC-09: IN, HS 6109.10 (t-shirt, Ch.61), $50, BCD 20% → IGST 12%(의류), SWS 10%*BCD
TC-10: IN, HS 2208.30 (whisky, Ch.22), $100, BCD 150% → IGST 28%(주류), SWS 확인
TC-11: IN, HS 9999.99 (미등록), $100 → IGST fallback 18% 확인
```

### TC-12~16: China 세금 5건
```
TC-12: CN, CBEC mode, HS 3304.99 (cosmetics), $30 → CBEC 면세 기준 내, VAT*0.7 + CT*0.7 = 9.1%
TC-13: CN, CBEC mode, HS 7113.19 (gold jewelry), $200 → CT 10% * 0.7 + VAT 13% * 0.7 계산
TC-14: CN, regular import, HS 2208.30 (whisky), $100, duty 65% → full VAT 13% + CT 20%
TC-15: CN, CBEC mode, $6,000 (초과) → CBEC 아닌 일반 수입으로 전환 확인
TC-16: CN, HS 2402.20 (cigarettes), $50 → CT 50% 확인
```

### TC-17~21: Mexico 세금 5건
```
TC-17: MX, HS 2208.30 (whisky), $100, duty 20% → IEPS 53%(수정 확인), IVA base = CIF+duty+IEPS
TC-18: MX, HS 2402.20 (cigarettes), $50, duty 67% → IEPS rate 확인 (heading별)
TC-19: MX, HS 2203.00 (beer), $50, duty 20% → IEPS 26.5% 확인
TC-20: MX, HS 6109.10 (t-shirt), $50, duty 35% → IEPS 0% (비과세), IVA 16% only
TC-21: MX, HS 9999.99 (미등록), $100 → IEPS 0% fallback 확인
```

### TC-22~26: US Processing Fee + de minimis 5건
```
TC-22: US, CN origin, $50 → de minimis $0 (CN), MPF 면제? duty 면제?
TC-23: US, DE origin, $50 → de minimis $800 → duty/MPF 면제
TC-24: US, CN origin, $1,000, formal entry → MPF 0.3464% ($3.46, min $31.67 적용)
TC-25: US, JP origin, $500, informal entry → MPF $2.69-$12.09 범위 확인
TC-26: US, HK origin, $50 → de minimis $0 (HK = CN 동일 취급?) 확인
```

### TC-27~30: EU VAT + IOSS 4건
```
TC-27: DE (EU), HS 6109.10, $50, duty 12% → VAT 19% (standard) 확인
TC-28: FR (EU), food item, $50 → reduced VAT 5.5% 확인
TC-29: EU IOSS, $100 product → IOSS 대상 (€150 이하), VAT at destination
TC-30: EU IOSS, $200 product → IOSS 비대상 (€150 초과), import VAT 부과
```

### TC-31~36: Edge Cases + Processing Fee 6건
```
TC-31: AU, $900 AUD → de minimis $1000 AUD, GST 10% 면제? Processing Fee?
TC-32: CA, postal K1A 0A6 (Ontario) → HST 13% 확인
TC-33: JP, $100, duty 5% → consumption tax 10% 확인, Processing Fee 금액
TC-34: KR, $100, duty 8% → VAT 10% 확인, KCS fee 금액
TC-35: SG, $300 → de minimis SGD 400 ($300), GST 9% 적용 여부
TC-36: TH, $200, duty 30% → VAT 7% 확인, Processing Fee 금액
```

---

## Phase 4: 수정 (발견된 버그가 있을 경우만)

발견된 각 이슈에 대해:
1. 이슈 설명 (뭐가 잘못됐는지)
2. 영향 범위 (어떤 국가, 어떤 금액)
3. 수정 전 코드
4. 수정 후 코드
5. 수정 근거 (법적 기준 출처)

---

## Phase 5: 자체 검수 5회

### 검수 1: Build
```bash
npm run build
```
- Compiled X.Xs, 0 errors → PASS

### 검수 2: Brazil/India/China/Mexico 캐스케이딩 계산 수학 검증 (8건)
각 나라별 2건씩 — 수기 계산과 코드 결과 비교:
1. BR: $100, duty 35%, IPI 0% → PIS 9.25% of ($100+35) = $12.49 → ICMS base = (100+35+0+12.49)/(1-0.18) = $179.87 → ICMS = 179.87*0.18 = $32.38 → total tax = 0+12.49+32.38 = $44.87
2. BR: $1000, duty 20%, IPI 25% → 수기 계산 vs 코드
3. IN: $10,000 gold, BCD 12.5% = $1,250, SWS = $125, IGST base = $11,375, IGST 3% = $341.25 → total = $466.25
4. IN: $100 laptop, BCD 0%, SWS 0, IGST 18% = $18 → total = $18
5. CN CBEC: $100 cosmetics, CT 15% → base = 100/(1-0.15*0.7) = $111.73 → VAT = 111.73*0.091 = $10.17 → CT = 111.73*0.105 = $11.73
6. CN regular: $100 + duty 65% → base = 165/(1-0) = $165 → VAT 13% = $21.45
7. MX: $100, duty 20%, IEPS 53% → base = $120, IEPS = $63.60 → IVA = (120+63.60)*0.16 = $29.38
8. MX: $100, duty 20%, IEPS 0% → IVA = 120*0.16 = $19.20

### 검수 3: CW18 5차 수정 6건 재확인 (코드 라인 번호 명시)
1. India Ch.71 IGST: INDIA_IGST_RATES['71'] = 0.03 (was 0.28) — 정확한 라인 번호
2. Mexico HS 2208 IEPS: MEXICO_IEPS_RATES['2208'] = 0.53 (was 0.265) — 정확한 라인 번호
3. EU VAT 27국: eu-vat-rates.ts에 27개 EU 회원국 전부 존재 확인 — 목록 나열
4. US MPF 전체 원산지: country-data.ts/GlobalCostEngine.ts에서 MPF가 origin 무관하게 적용 — 코드 확인
5. US de minimis CN $0: country-data.ts에서 origin=CN → $0, 나머지 $800 — 코드 확인
6. Brazil IPI chapter별: BRAZIL_IPI_BY_CHAPTER에 최소 15개 chapter 있는지 확인

### 검수 4: 12개국 Processing Fee 전수 확인 (12건)
GlobalCostEngine.ts switch/case에서 각 국가:
1. US → MPF 금액 + 계산식
2. AU → IPC 금액
3. NZ → MPI 금액
4. CA → CBSA 금액
5. JP → customs 금액
6. KR → KCS 금액
7. IN → landing charges 금액
8. BR → statistical fee 금액
9. TH → customs 금액
10. ID → DTA 금액
11. SG → TradeNet 금액
12. EU/UK → $0 (별도 fee 없음)

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 55/55 PASS, 0 FAIL

---

## Phase 6: 결과 파일 생성

`AREA6_SPECIAL_TAX_RESULT.md` 생성:
```markdown
# Area 6: Special Tax (12개국 특수세금) — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- [파일 목록 + 각 파일 핵심 내용 요약]

## Phase 2: 12개 영역 분석 결과
### 분석 1: Brazil 캐스케이딩
- [결과]
### 분석 2: India IGST/SWS
- [결과]
...

## Phase 3: 테스트 36건 결과
| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| TC-01 | BR t-shirt IPI | 0% | ? | ? |
...

## 버그 발견
- [N건: 상세]

## 수정
- [수정 파일, 수정 전/후]

## CW18 5차 수정 재확인
| 항목 | 예상 | 실제 | 확인 |
|------|------|------|------|
| India Ch.71 IGST | 0.03 | ? | ? |
| Mexico 2208 IEPS | 0.53 | ? | ? |
| EU VAT 27국 | 27국 | ? | ? |
| US MPF 전체 원산지 | 전체 | ? | ? |
| US de minimis CN | $0 | ? | ? |
| Brazil IPI chapter별 | 15+ | ? | ? |

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ? errors |
| 2 | 캐스케이딩 수학 검증 | ?/8 |
| 3 | CW18 5차 수정 재확인 | ?/6 |
| 4 | 12국 Processing Fee | ?/12 |
| 5 | Regression | ?/55 |

## INFO items (non-blocking)
- [참고 사항]

## 수정 파일
- [목록]

## 생성 파일
- AREA6_SPECIAL_TAX_RESULT.md
- Work log 시트
```

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가 (YYMMDDHHMM 형식)

---

## ⚠️ Area 6 끝나면 멈춰라. Area 7로 넘어가지 마라. "Area 6 Complete. 대기 중." 선언 후 대기.
