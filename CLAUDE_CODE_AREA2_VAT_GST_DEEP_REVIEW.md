# Area 2: VAT/GST — Deep Review & Fix Command
# Claude Code Terminal 1 전용 — 자체 5회 검수 후 완료
# 2026-03-23 KST

## 목표
Area 2 (VAT/GST) 관련 **모든 코드**를 읽고, 버그/갭/엣지케이스를 찾고, 수정하고, 5번 자체 검수한다.

## 절대 규칙
1. **v3 파이프라인 코드 수정 금지**
2. **npm run build 통과 필수**
3. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
4. **regression 55/55 PASS 유지**

---

## Phase 1: 코드 전체 읽기 (READ ONLY)

### 1-1. VAT/GST 핵심 파일
```
cat app/lib/cost-engine/eu-vat-rates.ts
cat app/lib/cost-engine/country-data.ts
cat app/lib/cost-engine/ioss-oss.ts
```

### 1-2. VAT 계산 사용처
```
cat app/lib/cost-engine/GlobalCostEngine.ts
cat app/lib/cost-engine/CostEngine.ts
```

### 1-3. VAT 관련 API
```
find app/api -name "route.ts" | xargs grep -l "vat\|VAT\|ioss\|IOSS" | head -10
# 찾은 파일 전부 읽기
```

### 1-4. DB 테이블 스키마 확인
```sql
-- vat_gst_rates 테이블 구조
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vat_gst_rates' ORDER BY ordinal_position;

-- vat_gst_rates 전체 행 수
SELECT COUNT(*) FROM vat_gst_rates;

-- 샘플 5건
SELECT * FROM vat_gst_rates LIMIT 5;

-- VAT rate가 0인 국가 (면세국)
SELECT country_code, standard_rate FROM vat_gst_rates WHERE standard_rate = 0;

-- VAT rate가 NULL인 국가
SELECT country_code FROM vat_gst_rates WHERE standard_rate IS NULL;
```

---

## Phase 2: 분석 체크리스트

### 2-1. VAT 세율 정확성 검증 (20개국)
아래 20개국의 **코드 내 vatRate**와 **실제 세율**을 비교:

| # | Country | Code | 실제 Standard VAT | country-data.ts 값 | 일치? |
|---|---------|------|-------------------|-------------------|-------|
| 1 | USA | US | 0% (state-level) | | |
| 2 | UK | GB | 20% | | |
| 3 | Germany | DE | 19% | | |
| 4 | France | FR | 20% | | |
| 5 | Italy | IT | 22% | | |
| 6 | Spain | ES | 21% | | |
| 7 | Netherlands | NL | 21% | | |
| 8 | Japan | JP | 10% | | |
| 9 | South Korea | KR | 10% | | |
| 10 | Australia | AU | 10% (GST) | | |
| 11 | Canada | CA | 5% (GST) | | |
| 12 | China | CN | 13% | | |
| 13 | India | IN | 18% (GST) | | |
| 14 | Brazil | BR | varies (ICMS) | | |
| 15 | Mexico | MX | 16% (IVA) | | |
| 16 | Singapore | SG | 9% (GST) | | |
| 17 | UAE | AE | 5% | | |
| 18 | Saudi Arabia | SA | 15% | | |
| 19 | Switzerland | CH | 8.1% | | |
| 20 | Norway | NO | 25% | | |

### 2-2. EU 27개국 경감세율 완전성 검사
eu-vat-rates.ts에서:
- [ ] EU 27개국 전부 있는지? (CW18 5차에서 27국 완성했다고 기록)
- [ ] 각 국가별 경감세율이 정확한지? (EU VAT Directive 2006/112/EC 기준)
- [ ] 식품(Ch01-21) 경감세율이 맞는지?
- [ ] 의약품(Ch30) 경감세율이 맞는지?
- [ ] 서적(Ch49) 경감세율이 맞는지?
- [ ] 아동복(Ch61-62) 경감세율 적용 국가?

EU 27 멤버 체크리스트:
```
AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE
```

### 2-3. 특수 VAT 로직 검사

#### US Sales Tax
- [ ] US는 vatRate=0이고 state-level sales tax가 별도 처리되는지?
- [ ] zipcode → state → tax rate 변환 정확한지?
- [ ] 면세 주 (OR, MT, DE, NH, AK) 처리?

#### Canada GST/HST/PST
- [ ] GST 5% 기본
- [ ] HST 지역 (ON 13%, NB/NL/NS/PE 15%) 처리?
- [ ] PST 별도 (BC 7%, SK 6%, MB 7%, QC 9.975%) 처리?
- [ ] postal code → province 매핑 정확한지?

#### Brazil 복합 세금
- [ ] ICMS (17-20% 주별), PIS (1.65%), COFINS (7.6%), IPI (chapter별)
- [ ] Cascading tax (por dentro) 계산 정확한지?
- [ ] IPI는 HS chapter별 다른 세율 → CW18 5차에서 95-chapter로 수정했는지 확인

#### India GST
- [ ] IGST = CGST + SGST (interstate)
- [ ] 0%, 5%, 12%, 18%, 28% 슬래브 적용?
- [ ] Ch.71 금/보석 = 3% IGST (CW18 5차에서 수정됨) 확인?
- [ ] HS chapter별 IGST 매핑이 코드에 있는지?

#### Mexico IVA + IEPS
- [ ] IVA 16%
- [ ] IEPS: 주류(Ch2208) 53%, 담배(Ch2402) 160%, 설탕음료 등
- [ ] CW18 5차에서 IEPS 수정한 내용 반영 확인

#### China VAT (增值税)
- [ ] 13% 기본
- [ ] 9% 경감 (농산물, 운송, 건설 등)
- [ ] 6% 서비스 (금융, 보험 등 — 물품 아님)
- [ ] CBEC (Cross-Border E-Commerce) 세금: 실효 11.2% or 23.1% 확인

### 2-4. IOSS/OSS 로직 검사
- [ ] EU IOSS: €150 이하 → VAT 수입국 세율 적용, 관세 면제
- [ ] IOSS 등록 번호 처리?
- [ ] €150 초과 시 IOSS 미적용 확인?
- [ ] UK Low Value Consignment Relief (£135) 처리?

### 2-5. B2B Reverse Charge 검사
- [ ] buyerVatNumber 있으면 → VAT = 0 (Reverse Charge)
- [ ] EU 내 B2B만 적용 (B2C는 적용 안 함)?
- [ ] 응답에 reverseCharge 필드 포함?

### 2-6. De Minimis와 VAT 연계
- [ ] De minimis 적용 시 VAT도 면제되는 국가 vs VAT만 부과하는 국가 구분?
- [ ] EU: de minimis 폐지(2021.7.1) → €0부터 VAT 부과 확인
- [ ] AU: A$1,000 이하도 GST 부과 (2018.7.1~) 확인

### 2-7. 세율 단위 일관성
- [ ] country-data.ts: vatRate = decimal (0.20 = 20%) 확인
- [ ] eu-vat-rates.ts: rate = decimal (0.07 = 7%) 확인
- [ ] GlobalCostEngine에서 곱셈 시 단위 맞는지?
- [ ] 응답의 vatRate 필드 단위는?

### 2-8. CN-code 레벨 VAT (심화 — 현재 갭)
- [ ] 현재는 HS Chapter(2자리) 레벨로 경감세율 적용
- [ ] CN-code(8자리) 레벨 경감세율이 필요한 국가 확인
  - EU: CN-code별 경감세율 존재 (TARIC 기반)
  - 현재 구현: Chapter 레벨만 → 일부 상품에서 부정확 가능
- [ ] **이 갭의 영향도 평가**: 얼마나 많은 상품이 Chapter vs CN-code 세율이 다른지?

---

## Phase 3: 버그 수정

Phase 2에서 FAIL 판정된 항목만 수정.
수정 원칙: 기존 함수 시그니처 변경 금지, 새 기능은 새 함수로.

---

## Phase 4: 5회 자체 검수

### 검수 1: npm run build
```bash
npm run build
```

### 검수 2: VAT 정확도 검증 (15건)

| # | 상품 | Dest | Origin | 가격 | 예상 VAT | 검증 |
|---|------|------|--------|------|---------|------|
| 1 | T-shirt $10 | DE | CN | $10 | 7% reduced (food?) or 19% | |
| 2 | T-shirt $10 | GB | CN | $10 | 20% | |
| 3 | Food item $20 | DE | CN | $20 | 7% reduced | |
| 4 | Book $15 | FR | CN | $15 | 5.5% reduced | |
| 5 | Medicine $50 | DE | CN | $50 | 0% exempt? or 19% | |
| 6 | Electronics $200 | JP | CN | $200 | 10% | |
| 7 | Gold bar $10000 | IN | AE | $10000 | 3% IGST (Ch.71) | |
| 8 | Whiskey $100 | MX | US | $100 | IVA 16% + IEPS 53% | |
| 9 | Item $100 | AU | CN | $100 | 10% GST | |
| 10 | Item $100 | AE | CN | $100 | 5% | |
| 11 | Item $100 (B2B w/ VAT#) | DE | CN | $100 | 0% reverse charge | |
| 12 | Item $50 (IOSS) | FR | CN | $50 | 20% (IOSS, no duty) | |
| 13 | Item $500 | BR | CN | $500 | cascading ~45-50%? | |
| 14 | Item $100 | SG | CN | $100 | 9% GST | |
| 15 | Item $100 | CA | CN | $100 | 5% GST | |

### 검수 3: EU 27개국 경감세율 교차검증
- eu-vat-rates.ts에 27개국 전부 있는지 확인
- 식품(Ch02) 각국 세율이 다른지 확인 (DE 7%, FR 5.5%, IT 4%, ES 4%, etc.)
- 없는 국가 있으면 추가

### 검수 4: Edge Cases
| # | 케이스 | 예상 |
|---|--------|------|
| 1 | dest="" | 에러 or 기본값 |
| 2 | dest="XX" (미존재) | 에러 or null |
| 3 | price=0 | VAT=0 |
| 4 | price=-5 | 처리? |
| 5 | US + no zipcode | vatRate=0 |
| 6 | CA + no postal code | GST 5% |
| 7 | buyerVatNumber + non-EU | reverse charge 미적용 |

### 검수 5: Regression
```bash
# 기존 55/55 테스트 유지 확인
npm run test  # or 해당 테스트 명령어
```

---

## Phase 5: 엑셀 로그 + 결과 파일

### POTAL_Claude_Code_Work_Log.xlsx 시트 추가

### AREA2_VAT_GST_REVIEW_RESULT.md 생성
```markdown
# Area 2: VAT/GST — Deep Review Result
# [날짜] KST

## 검사 항목: [N]개
## PASS: [N]개
## FAIL→FIXED: [N]개

## VAT 세율 정확도: [N]/20 PASS (20개국)
## EU 경감세율: [N]/27 국가 완성
## 특수 로직: US/CA/BR/IN/MX/CN — 각각 PASS/FAIL

## 발견된 버그
1. [설명]

## 잔여 갭 (CN-code 레벨)
- 영향도: [평가]
- 해결 방안: [제안]

## npm run build: ✅/❌
## regression 55/55: ✅/❌
```

---

## 완료 조건
- [ ] Phase 1~5 전부 완료
- [ ] npm run build ✅
- [ ] VAT 15건 테스트 전부 PASS
- [ ] EU 27개국 경감세율 전부 확인
- [ ] Edge cases 7건 PASS
- [ ] regression 55/55 유지
- [ ] 엑셀 로그 + 결과 파일 생성

완료되면 "Area 2 Complete" 선언 후 **Area 3 (De Minimis) 명령어 파일 읽기로 진행**.

---

## Area 3 (De Minimis) 이후 순서

Area 2 끝나면 아래 순서로 계속:
1. ~~Area 1: Duty Rate~~ ✅ Complete
2. ~~Area 2: VAT/GST~~ (현재)
3. Area 3: De Minimis
4. Area 4: Special Tax
5. Area 5: Customs Fees
6. Area 6: AD/CVD
7. Area 7: Rules of Origin
8. Area 8: Currency
9. Area 9: Insurance/Shipping
10. Area 10: Export Controls
11. Area 11: Sanctions

**Area 3 명령어**: Area 2 완료 후 portal 루트에서 `CLAUDE_CODE_AREA3_DE_MINIMIS_DEEP_REVIEW.md` 파일을 찾아 실행. 없으면 직접 De Minimis 관련 코드를 전부 읽고 동일한 패턴으로 deep review 진행.

### Area 3 (De Minimis) 간략 가이드 (명령어 파일 없을 때)
```
핵심 파일: country-data.ts (deMinimis, deMinimsCurrency, deMinimisUsd, deMinimisExceptions)
핵심 파일: GlobalCostEngine.ts (de minimis 로직)
DB: de_minimis_thresholds 테이블 (240개국)

검사 항목:
1. 240개국 de minimis 값이 country-data.ts와 DB 일치하는지
2. US $800 (CN/HK $0 예외) 정확한지
3. EU €150 IOSS 연계 정확한지
4. AU A$1,000 맞는지
5. CA C$20 맞는지
6. 통화 변환 USD 기준으로 정확한지
7. deMinimisExceptions 적용 정확한지 (US: CN→$0)
```

### Area 4~11도 동일 패턴:
각 Area 코드 파일 전부 읽기 → 분석 체크리스트 → 버그 수정 → 5회 검수 → 결과 파일.
명령어 파일이 없으면 직접 코드를 찾아 읽고 동일 패턴으로 진행할 것.
