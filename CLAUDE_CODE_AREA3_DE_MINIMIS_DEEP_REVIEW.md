# Area 3: De Minimis — Deep Review (5회 자체검수 필수)
# 2026-03-23 KST
# Terminal 1 전용 — Area 3만 한다. 끝나면 멈춰라.

## ⚠️ 절대 규칙
1. **v3 파이프라인 코드(steps/v3/) 수정 금지**
2. **npm run build 통과 필수**
3. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
4. **5회 자체검수 각각 실제 실행 + 결과 전문 기록** — "PASS" 한 줄 요약 금지
5. **검수 FAIL 시 수정 후 해당 검수 재실행**
6. **Area 3만 한다. 끝나면 Area 4로 넘어가지 마라.**

---

## Phase 1: 코드 전체 읽기 (READ ONLY)

### 1-1. De Minimis 핵심 파일
```
cat app/lib/cost-engine/country-data.ts
```
→ 각 국가의 deMinimis, deMinimsCurrency, deMinimisUsd, deMinimisExceptions 확인

### 1-2. De Minimis 계산 로직
```
cat app/lib/cost-engine/GlobalCostEngine.ts
```
→ de minimis 판단 로직 (임계값 비교, 면세 처리) 위치 찾기

```
cat app/lib/cost-engine/CostEngine.ts
```
→ CostEngine에서 de minimis 처리 방식

### 1-3. DB 테이블 확인
```sql
PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='de_minimis_thresholds' ORDER BY ordinal_position;
"

PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT COUNT(*) FROM de_minimis_thresholds;
"

PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT country_code, duty_threshold_usd, tax_threshold_usd FROM de_minimis_thresholds WHERE country_code IN ('US','GB','DE','AU','CA','JP','KR','CN','IN','MX','SG','AE','BR','FR','NL') ORDER BY country_code;
"
```

### 1-4. De Minimis 관련 API
```
grep -rl "deMinimis\|de_minimis\|deminimis" app/api/ --include="*.ts" | head -10
# 찾은 파일 전부 읽기
```

### 1-5. IOSS와 De Minimis 연계
```
cat app/lib/cost-engine/ioss-oss.ts
```
→ EU IOSS €150 연계, UK £135 연계

Phase 1 완료 후: 읽은 파일 목록과 줄 수 기록.

---

## Phase 2: 분석 체크리스트 (10개 영역)

### 2-1. 주요 20개국 De Minimis 값 검증
country-data.ts에서 추출한 값과 실제 기준 비교:

| # | Country | Code | 코드 내 deMinimis | 코드 내 Currency | 코드 내 USD | 실제 기준 | 일치? |
|---|---------|------|-----------------|----------------|-----------|---------|-------|
| 1 | US | US | ? | USD | ? | $800 (일반), $0 (CN/HK, IEEPA Aug 2025) | |
| 2 | UK | GB | ? | GBP | ? | £135 (VAT threshold) | |
| 3 | EU (DE) | DE | ? | EUR | ? | €150 (duty), €0 (VAT, 2021.7~ 폐지) | |
| 4 | Canada | CA | ? | CAD | ? | C$20 | |
| 5 | Australia | AU | ? | AUD | ? | A$1,000 | |
| 6 | Japan | JP | ? | JPY | ? | ¥10,000 (~$67) | |
| 7 | South Korea | KR | ? | USD | ? | $150 (US FTA $200) | |
| 8 | China | CN | ? | CNY | ? | ¥50 (~$7) | |
| 9 | India | IN | ? | INR | ? | ₹0 (없음, 모든 수입 과세) | |
| 10 | Mexico | MX | ? | USD | ? | $50 | |
| 11 | Singapore | SG | ? | SGD | ? | S$400 | |
| 12 | UAE | AE | ? | AED | ? | AED 1,000 (~$272) | |
| 13 | Brazil | BR | ? | USD | ? | $50 | |
| 14 | France | FR | ? | EUR | ? | €150 (duty), €0 (VAT) | |
| 15 | Netherlands | NL | ? | EUR | ? | €150 (duty), €0 (VAT) | |
| 16 | Switzerland | CH | ? | CHF | ? | CHF 5 (tax) | |
| 17 | Norway | NO | ? | NOK | ? | NOK 350 (~$33) (2024~ 폐지 가능) | |
| 18 | New Zealand | NZ | ? | NZD | ? | NZ$1,000 | |
| 19 | Thailand | TH | ? | THB | ? | THB 1,500 (~$43) | |
| 20 | Israel | IL | ? | USD | ? | $75 (개인), $500 (상업) | |

### 2-2. US De Minimis 예외 검증 (CRITICAL)
- [ ] 일반: $800
- [ ] CN origin: $0 (IEEPA Aug 2025)
- [ ] HK origin: $0 (IEEPA Aug 2025)
- [ ] deMinimisExceptions: { CN: 0, HK: 0 } 코드에 있는지?
- [ ] 코드 로직: origin_country가 CN/HK일 때 $0 적용하는지?
- [ ] DB(de_minimis_thresholds)의 US 값과 country-data.ts 값이 일치하는지?

### 2-3. EU De Minimis 검증 (27개국)
- [ ] EU 27개국 전부 duty de minimis €150인지?
- [ ] VAT de minimis €0인지? (2021.7.1 IOSS 시행 후 폐지)
- [ ] IOSS €150 이하 → 관세 면제 + VAT 수입국 세율 적용
- [ ] IOSS €150 초과 → 일반 수입 (관세 + VAT 모두 부과)
- [ ] EU 회원국별 별도 de minimis가 있는 국가?

### 2-4. Duty vs Tax De Minimis 구분
- [ ] duty_threshold_usd (관세 면제 기준)와 tax_threshold_usd (VAT/GST 면제 기준)가 분리되어 있는지?
- [ ] 관세 면제지만 VAT는 부과하는 국가 처리 (EU 전체, AU, NZ 등)
- [ ] 둘 다 면제하는 국가 처리 (US $800 이하 등)

### 2-5. 통화 변환 정확성
- [ ] deMinimisUsd 값이 현재 환율 기준으로 합리적인지?
- [ ] 코드에서 USD 변환 시 exchange-rate-service.ts를 사용하는지, 하드코딩인지?
- [ ] 환율 변동 시 de minimis 판단이 달라질 수 있는 엣지 케이스?

### 2-6. DB vs 코드 일관성
- [ ] de_minimis_thresholds 테이블의 값과 country-data.ts의 값이 일치하는지?
- [ ] 어느 쪽이 우선인지? (코드 fallback vs DB 우선)
- [ ] 불일치 국가 목록 작성

### 2-7. 240개국 커버리지
- [ ] country-data.ts에 몇 개국 있는지?
- [ ] de_minimis_thresholds에 몇 개국 있는지?
- [ ] 누락 국가가 있으면 목록 작성
- [ ] de minimis가 $0인 국가 (= 면세 없음) 목록

### 2-8. De Minimis 적용 로직 검사
GlobalCostEngine.ts에서:
- [ ] 상품 가격 < de minimis → duty=0 처리되는지?
- [ ] 상품 가격 = de minimis (경계값) → 면세? 과세?
- [ ] 상품 가격 > de minimis → 정상 과세?
- [ ] 복수 상품 합산 vs 개별 판단?

### 2-9. 특수 케이스
- [ ] 선물(gift) vs 상업용(commercial) 별도 de minimis가 있는 국가? (예: Israel $75 vs $500)
- [ ] 특정 품목 제외 (예: US tobacco/alcohol은 $800 이하여도 de minimis 미적용)
- [ ] 임시수입, 반송 등 특수 상황

### 2-10. API 응답에 De Minimis 정보 포함 여부
- [ ] TLC 계산 응답에 deMinimisApplied: true/false 필드 있는지?
- [ ] 면세 사유 표시 (예: "Below US $800 de minimis threshold")
- [ ] deMinimisThreshold 값 응답에 포함?

Phase 2 완료 후: 10개 영역 각각 PASS/FAIL 판정 + 근거 기록.

---

## Phase 3: 버그 수정

Phase 2에서 FAIL된 항목만 수정.
- 수정 전/후 코드를 엑셀에 기록
- npm run build 확인

---

## Phase 4: 5회 자체 검수

### 검수 1: npm run build
```bash
npm run build
```
결과 마지막 10줄 기록.

### 검수 2: De Minimis 15건 계산 테스트
실제 코드 실행 또는 API 호출로 검증.

| # | Dest | Origin | 가격(USD) | 예상 De Minimis 적용 | 예상 Duty | 실제 출력 | PASS? |
|---|------|--------|----------|-------------------|----------|---------|-------|
| 1 | US | DE | $500 | ✅ 면세 ($800) | $0 | ? | |
| 2 | US | CN | $500 | ❌ 과세 ($0 for CN) | >$0 | ? | |
| 3 | US | CN | $0.01 | ❌ 과세 ($0 for CN) | >$0 | ? | |
| 4 | US | JP | $900 | ❌ 과세 (>$800) | >$0 | ? | |
| 5 | GB | CN | $100 | ✅ 면세 (£135≈$170) | $0 | ? | |
| 6 | GB | CN | $200 | ❌ 과세 (>£135) | >$0 | ? | |
| 7 | DE | CN | $100 | ✅ 면세 (€150) | $0 | ? | |
| 8 | DE | CN | $200 | ❌ 과세 (>€150) | >$0 | ? | |
| 9 | AU | CN | $500 | ✅ 면세 (A$1000≈$650) | $0 | ? | |
| 10 | AU | CN | $800 | ❌ 과세 (>A$1000) | >$0 | ? | |
| 11 | CA | CN | $10 | ✅ 면세 (C$20) | $0 | ? | |
| 12 | CA | CN | $50 | ❌ 과세 (>C$20) | >$0 | ? | |
| 13 | JP | CN | $50 | ✅ 면세 (¥10000≈$67) | $0 | ? | |
| 14 | SG | CN | $200 | ✅ 면세 (S$400≈$300) | $0 | ? | |
| 15 | IN | CN | $5 | ❌ 과세 (₹0, 면세 없음) | >$0 | ? | |

### 검수 3: US CN/HK 예외 집중 테스트 (5건)

| # | Dest | Origin | 가격 | 예상 | PASS? |
|---|------|--------|------|------|-------|
| 1 | US | CN | $1 | 과세 (CN $0) | |
| 2 | US | HK | $1 | 과세 (HK $0) | |
| 3 | US | DE | $1 | 면세 ($800) | |
| 4 | US | JP | $799 | 면세 ($800) | |
| 5 | US | JP | $801 | 과세 (>$800) | |

### 검수 4: Edge Cases 7건

| # | 케이스 | 예상 | 실제 | PASS? |
|---|--------|------|------|-------|
| 1 | price=0 | 면세 (0 < any threshold) | ? | |
| 2 | price=-1 | 에러 or 0 | ? | |
| 3 | dest="" | 에러 | ? | |
| 4 | dest="XX" 미존재 | 에러 or 기본값 | ? | |
| 5 | price=$800 exactly (US, non-CN) | 면세? 과세? (경계값) | ? | |
| 6 | EU country + IOSS registered | €150 이하 면세(duty) + VAT 적용 | ? | |
| 7 | 240번째 국가 (가장 마지막) | 정상 처리 | ? | |

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
55/55 PASS 확인. 실행 출력 기록.

---

## Phase 5: 결과 파일 생성

### AREA3_DE_MINIMIS_REDO_RESULT.md (아래 형식 필수)
```markdown
# Area 3: De Minimis — Deep Review Result
# [날짜] KST

## Phase 1: 읽은 파일
- [파일 목록 + 줄 수]

## Phase 2: 분석 결과 (10개 영역)
### 2-1: 20국 De Minimis 값: [N]/20 PASS
[테이블]
### 2-2: US CN/HK 예외: PASS/FAIL
[상세]
### 2-3: EU 27국: PASS/FAIL
### 2-4: Duty vs Tax 구분: PASS/FAIL
### 2-5: 통화 변환: PASS/FAIL
### 2-6: DB vs 코드 일관성: PASS/FAIL
### 2-7: 240국 커버리지: PASS/FAIL
### 2-8: 적용 로직: PASS/FAIL
### 2-9: 특수 케이스: PASS/FAIL
### 2-10: API 응답: PASS/FAIL

## Phase 3: 수정 사항
[수정 내용 or "없음"]

## Phase 4: 5회 검수
### 검수 1: npm run build — [결과]
### 검수 2: 15건 테스트 — [N]/15 PASS
### 검수 3: US CN/HK 5건 — [N]/5 PASS
### 검수 4: Edge Cases 7건 — [N]/7 PASS
### 검수 5: Regression — [N]/55 PASS

## 최종
- 총 버그: [N]건
- 수정: [N]건
- 잔여: [N]건
```

### POTAL_Claude_Code_Work_Log.xlsx 시트 추가

---

## 완료 조건
- [ ] Phase 1~5 전부 완료
- [ ] npm run build ✅
- [ ] De Minimis 15건 + US 5건 + Edge 7건 = 27건 전부 PASS
- [ ] Regression 55/55
- [ ] 결과 파일 + 엑셀 로그

## ⚠️ Area 3 끝나면 멈춰라. Area 4로 넘어가지 마라. "Area 3 Complete" 선언 후 대기.
