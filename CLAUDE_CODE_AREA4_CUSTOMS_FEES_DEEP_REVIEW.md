# Area 4: Customs Fees & Processing Fees — Deep Review

## 목표
12개국 통관 수수료/처리비 코드 전체 심층 리뷰 + 5회 자체 검수

## ⚠️ 절대 규칙
1. **Area 4만 한다. 끝나면 멈춰라. Area 5로 넘어가지 마라.**
2. **5회 자체 검수 전부 디테일하게 실행** — "PASS" 한 줄로 끝내지 마라. 각 검수마다 개별 테스트 결과 전부 표시
3. **rapidly 금지** — 하나씩 천천히 정확하게
4. **발견한 버그는 즉시 수정** — 수정 전/후 코드 명시
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## Phase 1: 코드 읽기 (전체 파악)

아래 파일들을 **전부** 읽는다:

```bash
# 1. GlobalCostEngine.ts — 12개국 MPF/processing fee 로직 (lines 830~895)
cat app/lib/cost-engine/GlobalCostEngine.ts

# 2. CostEngine.ts — US-specific MPF (lines 583~606)
cat app/lib/cost-engine/CostEngine.ts

# 3. country-data.ts — 240개국 프로필 (customsFees 필드 있는지 확인)
cat app/lib/cost-engine/country-data.ts

# 4. breakdown.ts — customsFees 배열 구조
cat app/lib/cost-engine/breakdown.ts

# 5. DB customs_fees 테이블 (240행)
# Supabase Management API로 조회
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT country_code, country_name, processing_fee_type, processing_fee_rate, processing_fee_fixed, processing_fee_min, processing_fee_max, processing_fee_note FROM customs_fees WHERE processing_fee_rate > 0 OR processing_fee_fixed > 0 ORDER BY country_code;"}'

# 6. insurance-calculator.ts (있으면)
cat app/lib/cost-engine/insurance-calculator.ts 2>/dev/null || echo "NOT FOUND"

# 7. shipping-calculator.ts (있으면)
cat app/lib/cost-engine/shipping-calculator.ts 2>/dev/null || echo "NOT FOUND"
```

---

## Phase 2: 10개 분석 영역 (하나씩 순서대로)

### 분석 1: US MPF (Merchandise Processing Fee) 정확성
**검증 항목:**
- Formal entry (>$2500): 0.3464% 맞는지, min $32.71 / max $634.04 맞는지 (FY2025/2026 기준)
- Informal entry (≤$2500): flat rate 맞는지 ($2? $2.69? $6? 실제 현행 기준 확인)
- CostEngine.ts의 US MPF와 GlobalCostEngine.ts의 US MPF가 일치하는지
- $2500 경계값 처리 (exactly $2500은 formal? informal?)
- de minimis 적용 시 MPF 면제되는지 (isDutyFree=true일 때)
- Section 301/232 관세 대상 상품에도 MPF 적용되는지

**실제 기준 (CBP 19 CFR 24.23):**
- Formal entry: ad valorem 0.3464%, min $31.67 → **FY2025: $32.71 min, $634.04 max** (CPI 연동)
- Informal: **$2.22(자동), $6.66(수동), $10.21(우편)** ← 현행 3단계. 우리 코드는 어떻게?

### 분석 2: US HMF (Harbor Maintenance Fee) 정확성
**검증 항목:**
- HMF 0.125% 적용 기준 (해상 수입만? 항공도?)
- HMF 면세 조건 (FTZ, 수출, 국내)
- HMF가 GlobalCostEngine에서 어디서 계산되는지
- HMF가 총 landed cost에 포함되는지

### 분석 3: AU IPC (Import Processing Charge) 정확성
**검증 항목:**
- AUD 88 (~$56 USD) 맞는지 (현행 기준)
- AUD→USD 환율이 고정인지 실시간인지
- de minimis (AUD 1000) 이하일 때 IPC 면제되는지
- Standard entry vs Express entry 구분 있는지

### 분석 4: NZ Biosecurity Levy 정확성
**검증 항목:**
- NZD 33.32 (~$20 USD) 맞는지 (현행 MPI 기준)
- GST 적용 시 Levy 포함되는지
- de minimis (NZD 1000) 이하일 때 면제 여부

### 분석 5: CA CBSA 처리비 정확성
**검증 항목:**
- Canada는 정부 수수료 없음 확인 (CBSA는 broker에게 맡김)
- $10 handling estimate가 합리적인지
- de minimis (CAD 20) 적용 시 면제 여부

### 분석 6: JP 통관 수수료 정확성
**검증 항목:**
- ¥200 검사비 + broker ¥3000 (~$20 총) 맞는지
- 소비세 10% 기준에서 수수료 포함 여부
- de minimis (¥10,000) 이하 면제 여부

### 분석 7: KR 통관 수수료 정확성
**검증 항목:**
- KRW 10,000~30,000 (~$15) 맞는지
- 한국 관세청(KCS) 공식 기준 대조
- 목록통관(de minimis $150) 시 수수료 면제 여부

### 분석 8: IN Landing Charges 정확성
**검증 항목:**
- 1% of CIF 맞는지 (현행 인도 관세법 기준)
- Social Welfare Surcharge 10% (of BCD)는 별도 계산되는지
- IGST 기반 계산과 landing charge 순서

### 분석 9: CH/CN/MX/SG/BR 기타 5개국 수수료 정확성
**각 나라별 검증:**
- CH: CHF 15 statistical fee 맞는지
- CN: ¥200-500 customs clearance 맞는지
- MX: DTA 0.8% (min ~$36) 맞는지 (현행 SAT 기준)
- SG: SGD 2.88 permit fee 맞는지 (TradeNet)
- BR: SISCOMEX BRL 185 (~$36) 맞는지

### 분석 10: 나머지 228개국 수수료 처리
**검증 항목:**
- EU 27개국: "No separate customs processing fee" 맞는지 (EU는 정부 수수료 없음, broker만)
- UK: 동일
- 나머지 국가: processing fee 0인지 확인
- DB customs_fees 테이블 240행과 코드 12개국이 일치하는지
- DB에 있는데 코드에 없는 국가 확인
- 코드에 있는데 DB에 없는 국가 확인

---

## Phase 3: 테스트 케이스 30건

### TC-01~05: US MPF 5건
```
TC-01: US, $100 product, $10 shipping → informal entry, MPF = $2 (or current rate)
TC-02: US, $2500 product, $0 shipping → boundary: $2500 exactly = informal or formal?
TC-03: US, $5000 product, $200 shipping → formal, MPF = 0.3464% of $5200 = $18.01 → min $32.71 적용
TC-04: US, $200000 product → formal, MPF = 0.3464% of $200000 = $692.80 → max $634.04 적용
TC-05: US, $500 product, de minimis applied (CN origin $0 threshold) → MPF 계산되는지?
```

### TC-06~08: US HMF 3건
```
TC-06: US, $5000 CIF, ocean import → HMF = 0.125% = $6.25
TC-07: US, $5000 CIF, air import → HMF 적용 여부
TC-08: US, domestic → HMF = $0
```

### TC-09~12: AU 4건
```
TC-09: AU, $500 product → IPC ~$56
TC-10: AU, $50 product (< AUD 1000 de minimis) → IPC 면제?
TC-11: AU, $5000 product → IPC ~$56 (고정)
TC-12: AU, de minimis applied → IPC 면제 확인
```

### TC-13~15: NZ/CA/JP 각 1건
```
TC-13: NZ, $500 product → Biosecurity Levy ~$20
TC-14: CA, $500 product → CBSA handling ~$10
TC-15: JP, $500 product → customs fee ~$20
```

### TC-16~18: KR/IN/CH 각 1건
```
TC-16: KR, $500 product → KCS clearance ~$15
TC-17: IN, $1000 product → Landing Charges = 1% = $10
TC-18: CH, $500 product → Statistical fee ~$17
```

### TC-19~22: CN/MX/SG/BR 각 1건
```
TC-19: CN, $500 product → Customs clearance ~$30
TC-20: MX, $500 product → DTA = max(0.8% × $500, $36) = $36
TC-21: SG, $500 product → TradeNet permit ~$10
TC-22: BR, $500 product → SISCOMEX ~$36
```

### TC-23~25: EU/UK 수수료 0 확인 3건
```
TC-23: DE (Germany), $500 product → processing fee = $0
TC-24: FR (France), $500 product → processing fee = $0
TC-25: GB (UK), $500 product → processing fee = $0
```

### TC-26~28: Edge Cases 3건
```
TC-26: US, $0 product → MPF 계산 안 됨 확인
TC-27: 존재하지 않는 국가코드 → 에러 핸들링
TC-28: domestic (origin=US, dest=US) → 모든 수수료 $0
```

### TC-29~30: DB 정합성 2건
```
TC-29: DB customs_fees에서 processing_fee > 0인 국가 목록 = 코드 12개국 일치 확인
TC-30: DB customs_fees 240행 전부 존재 확인
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

### 검수 2: 12개국 Processing Fee 개별 확인 (12건)
GlobalCostEngine 호출하여 12개국 각각 processing fee 금액 확인:
- US formal, US informal, AU, NZ, CA, JP, KR, IN, CH, CN, MX, SG, BR (13건)
- 각 결과에서 processing fee / MPF 금액이 예상값과 일치하는지

### 검수 3: US MPF 경계값 (5건)
- $2499, $2500, $2501 경계 테스트
- min $32.71 트리거: $32.71 / 0.003464 = $9,443.65 이하
- max $634.04 트리거: $634.04 / 0.003464 = $183,074 이상

### 검수 4: de minimis + 수수료 조합 (5건)
- US CN→US $400 (de minimis $0 → duty applied → MPF applied?)
- US DE→US $400 (de minimis $800 → duty free → MPF 면제?)
- AU $50 (de minimis AUD 1000 → duty free → IPC 면제?)
- KR $100 (de minimis $150 → duty free → KCS 면제?)
- BR $30 (de minimis $50 → duty free → SISCOMEX 면제?)

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 55/55 PASS, 0 FAIL

---

## Phase 6: 결과 파일 생성

`AREA4_CUSTOMS_FEES_RESULT.md` 생성:
```markdown
# Area 4: Customs Fees — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- [파일 목록 + 각 파일 핵심 내용 요약]

## Phase 2: 10개 영역 분석 결과
### 분석 1: US MPF
- [결과]
### 분석 2: US HMF
- [결과]
...

## Phase 3: 테스트 30건 결과
| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| TC-01 | US $100 informal | MPF=$2 | ? | ? |
...

## 버그 발견
- [N건: 상세]

## 수정
- [수정 파일, 수정 전/후]

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ? errors |
| 2 | 12개국 개별 | ?/13 |
| 3 | US 경계값 | ?/5 |
| 4 | de minimis+수수료 | ?/5 |
| 5 | Regression | ?/55 |

## 수정 파일
- [목록]

## 생성 파일
- AREA4_CUSTOMS_FEES_RESULT.md
- Work log 시트
```

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가 (YYMMDDHHMM 형식)

---

## ⚠️ Area 4 끝나면 멈춰라. Area 5로 넘어가지 마라. "Area 4 Complete. 대기 중." 선언 후 대기.
