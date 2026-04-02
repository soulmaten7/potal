# Area 2: VAT/GST — Deep Review REDO (5회 자체검수 필수)
# 2026-03-23 KST
# 이전 실행이 검수 없이 rushed — 이번엔 5번 검수 각각 결과를 명시해야 함

## ⚠️ 절대 규칙
1. **v3 파이프라인 코드 수정 금지** (steps/v3/ 디렉토리)
2. **npm run build 통과 필수**
3. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
4. **5회 자체검수 각각 결과를 AREA2_RESULT.md에 명시** — "검수1: PASS" 같은 한 줄 요약 금지. 각 검수마다 실제 테스트한 내용과 결과 전체를 기록
5. **검수 1개라도 FAIL이면 수정 후 해당 검수 재실행** — 전체 5회 PASS 될 때까지 반복
6. **"rapidly" 금지** — 빠르게 넘어가지 않는다. 모든 체크를 실제로 실행한다

---

## Phase 1: 코드 전체 읽기 (READ ONLY — 수정하지 않는다)

### 1-1. VAT/GST 핵심 파일 4개 전부 읽기
```
cat app/lib/cost-engine/eu-vat-rates.ts
cat app/lib/cost-engine/country-data.ts
cat app/lib/cost-engine/GlobalCostEngine.ts
cat app/lib/cost-engine/CostEngine.ts
```

### 1-2. IOSS/OSS 파일 읽기
```
# ioss 관련 파일 찾기
grep -rl "ioss\|IOSS\|oss\|OSS" app/lib/cost-engine/ --include="*.ts"
# 찾은 파일 전부 읽기
```

### 1-3. VAT 관련 API 라우트 전부 읽기
```
grep -rl "vat\|VAT\|ioss\|IOSS\|gst\|GST" app/api/ --include="*.ts" | head -20
# 찾은 파일 전부 읽기
```

### 1-4. DB 테이블 확인 (psql 직접 연결)
```sql
PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='vat_gst_rates' ORDER BY ordinal_position;
"

PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT COUNT(*) as total FROM vat_gst_rates;
"

PGPASSWORD='potalqwepoi2@' /opt/homebrew/opt/libpq/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c "
SELECT country_code, standard_rate, reduced_rate FROM vat_gst_rates ORDER BY country_code LIMIT 20;
"
```

Phase 1 완료 후: 읽은 파일 목록과 각 파일의 줄 수를 기록한다.

---

## Phase 2: 분석 (8개 영역, 각각 상세히)

### 2-1. VAT 세율 정확성 검증 (20개국)
country-data.ts에서 아래 20개국의 vatRate 값을 추출하고, 실제 세율과 비교한다.
**각 국가마다 "코드 값 → 실제 값 → 일치/불일치" 3열로 기록한다.**

| # | Country | Code | 코드 내 vatRate | 실제 Standard Rate | 일치? |
|---|---------|------|----------------|-------------------|-------|
| 1 | US | US | ? | 0% (federal) | |
| 2 | UK | GB | ? | 20% | |
| 3 | DE | DE | ? | 19% | |
| 4 | FR | FR | ? | 20% | |
| 5 | IT | IT | ? | 22% | |
| 6 | ES | ES | ? | 21% | |
| 7 | NL | NL | ? | 21% | |
| 8 | JP | JP | ? | 10% | |
| 9 | KR | KR | ? | 10% | |
| 10 | AU | AU | ? | 10% | |
| 11 | CA | CA | ? | 5% (GST only) | |
| 12 | CN | CN | ? | 13% | |
| 13 | IN | IN | ? | 18% (standard) | |
| 14 | BR | BR | ? | 17-20% (ICMS) | |
| 15 | MX | MX | ? | 16% | |
| 16 | SG | SG | ? | 9% | |
| 17 | AE | AE | ? | 5% | |
| 18 | SA | SA | ? | 15% | |
| 19 | CH | CH | ? | 8.1% | |
| 20 | NO | NO | ? | 25% | |

### 2-2. EU 27개국 경감세율 완전성 검사
eu-vat-rates.ts를 열고 아래 27개국이 **전부** 있는지 하나씩 체크한다.
없는 국가가 있으면 명시한다.

```
AT(Austria) BE(Belgium) BG(Bulgaria) HR(Croatia) CY(Cyprus) CZ(Czechia)
DK(Denmark) EE(Estonia) FI(Finland) FR(France) DE(Germany) GR(Greece)
HU(Hungary) IE(Ireland) IT(Italy) LV(Latvia) LT(Lithuania) LU(Luxembourg)
MT(Malta) NL(Netherlands) PL(Poland) PT(Portugal) RO(Romania) SK(Slovakia)
SI(Slovenia) ES(Spain) SE(Sweden)
```

각 국가별로:
- 식품(Ch01-21) 경감세율이 있는지, 세율이 맞는지
- 의약품(Ch30) 경감세율 여부
- 서적(Ch49) 경감세율 여부
- 아동복(Ch61-62) 경감세율 여부

### 2-3. 특수 VAT 로직 — US Sales Tax
GlobalCostEngine.ts에서 US VAT 처리 로직을 찾아서:
- US는 federal VAT=0인지 확인
- state-level sales tax 처리가 있는지
- zipcode → state 변환이 있다면 정확한지
- 면세 주 (OR, MT, DE, NH, AK) 처리 확인

### 2-4. 특수 VAT 로직 — Canada GST/HST/PST
- GST 5% 기본 적용 확인
- HST 지역별: ON 13%, NB/NL/NS/PE 15%
- PST 별도: BC 7%, SK 6%, MB 7%, QC 9.975%
- postal code → province 매핑 로직 존재 여부

### 2-5. 특수 VAT 로직 — Brazil / India / Mexico / China
**Brazil:**
- ICMS (17-20% 주별), PIS (1.65%), COFINS (7.6%), IPI (chapter별)
- Cascading tax 계산이 코드에 있는지
- IPI chapter별 세율: 의류 0%, 차량 25%, 담배 300% (CW18 5차 수정)

**India:**
- IGST 슬래브: 0%, 5%, 12%, 18%, 28%
- Ch.71 금/보석 = 3% (CW18 5차 수정)
- HS chapter→IGST 매핑 코드 확인

**Mexico:**
- IVA 16%
- IEPS: 주류 53%, 맥주 26.5%, 담배 160%
- CW18 5차에서 IEPS 수정 반영 확인

**China:**
- 기본 13%, 농산물 9%
- CBEC 실효세율 계산 확인

### 2-6. IOSS/OSS 로직
- EU IOSS: €150 이하 → VAT 적용, 관세 면제
- €150 초과 시 IOSS 미적용
- UK £135 처리

### 2-7. B2B Reverse Charge
- buyerVatNumber → VAT=0 로직 존재?
- EU B2B만 적용, B2C는 미적용?

### 2-8. 세율 단위 일관성
- country-data.ts: vatRate 값이 0.20 (비율) vs 20 (퍼센트) 중 어떤 형식?
- eu-vat-rates.ts: rate 값 형식?
- GlobalCostEngine.ts에서 곱셈 시 단위 맞는지?
- 응답 JSON의 vatRate 단위?

Phase 2 완료 후: 8개 영역 각각 PASS/FAIL 판정 + 근거를 기록한다.

---

## Phase 3: 버그 수정

Phase 2에서 FAIL된 항목만 수정한다.
- 수정 전 코드와 수정 후 코드를 엑셀에 기록
- 수정 후 npm run build 확인

수정할 게 없으면 "Phase 3: 수정 사항 없음" 이라고 명시.

---

## Phase 4: 5회 자체 검수 (⚠️ 각 검수마다 실제 실행 + 결과 전문 기록)

### 검수 1: npm run build
```bash
cd /portal경로 && npm run build
```
**결과 전문을 기록한다.** "✅" 한 글자 금지. 빌드 출력 마지막 5줄 이상 포함.

### 검수 2: VAT 15건 계산 테스트
실제 코드를 실행하거나, API를 호출하거나, 함수를 직접 테스트한다.
**각 건마다 입력값 + 예상값 + 실제 출력값 + PASS/FAIL을 기록한다.**

```
테스트 방법: node -e 또는 tsx로 직접 함수 호출, 또는 curl API 호출
```

| # | Dest | 상품 | 가격 | 예상 VAT Rate | 실제 출력 | PASS? |
|---|------|------|------|-------------|----------|-------|
| 1 | DE | T-shirt | $10 | 19% | ? | |
| 2 | GB | T-shirt | $10 | 20% | ? | |
| 3 | DE | Food | $20 | 7% reduced | ? | |
| 4 | FR | Book | $15 | 5.5% reduced | ? | |
| 5 | JP | Electronics | $200 | 10% | ? | |
| 6 | IN | Gold (Ch.71) | $10000 | 3% IGST | ? | |
| 7 | MX | Whiskey | $100 | 16% IVA + 53% IEPS | ? | |
| 8 | AU | Item | $100 | 10% GST | ? | |
| 9 | AE | Item | $100 | 5% | ? | |
| 10 | SG | Item | $100 | 9% | ? | |
| 11 | CA | Item | $100 | 5% GST | ? | |
| 12 | BR | Item | $500 | cascading | ? | |
| 13 | CN | Item | $100 | 13% | ? | |
| 14 | NO | Item | $100 | 25% | ? | |
| 15 | SA | Item | $100 | 15% | ? | |

### 검수 3: EU 27개국 경감세율 교차검증
eu-vat-rates.ts에서 27개국 키를 추출하고, EU 27 목록과 대조한다.
**누락 국가가 있으면 명시. 전부 있으면 27개국 목록을 출력하여 증명한다.**

식품(Ch02) 기준 각국 경감세율 5개 이상 샘플 비교:
| Country | 코드 내 세율 | 실제 경감세율 | 일치? |
|---------|------------|------------|-------|
| DE | ? | 7% | |
| FR | ? | 5.5% | |
| IT | ? | 4% (super-reduced) or 10% | |
| ES | ? | 10% | |
| IE | ? | 0% (zero-rated) | |

### 검수 4: Edge Cases 7건
실제로 코드를 실행하여 결과 확인. 각 건마다 입출력 기록.

| # | 케이스 | 입력 | 예상 | 실제 출력 | PASS? |
|---|--------|------|------|---------|-------|
| 1 | dest="" 빈 문자열 | dest="" | 에러 or 기본값 | ? | |
| 2 | dest="XX" 미존재 국가 | dest="XX" | 에러 | ? | |
| 3 | price=0 | price=0 | VAT=0 | ? | |
| 4 | price=-5 음수 | price=-5 | 에러 or 0 | ? | |
| 5 | US + zipcode 없음 | dest="US", no zip | vatRate=0 | ? | |
| 6 | CA + postal code 없음 | dest="CA", no postal | GST 5% | ? | |
| 7 | VAT번호 + non-EU | dest="US", vatNumber | reverse charge 미적용 | ? | |

### 검수 5: Regression 55/55
```bash
# 기존 duty rate regression 테스트 실행
# 결과 55/55 PASS 확인
```
**실행 명령어 + 출력 전문 기록.** "55/55 ✅" 한 줄 요약 금지.

---

## Phase 5: 결과 파일 생성

### AREA2_VAT_GST_REDO_RESULT.md 생성 (아래 형식 필수)
```markdown
# Area 2: VAT/GST — Deep Review REDO Result
# [날짜] KST

## Phase 1: 읽은 파일
- [파일1] ([N]줄)
- [파일2] ([N]줄)
- ...

## Phase 2: 분석 결과 (8개 영역)
### 2-1. VAT 세율 20개국: [N]/20 PASS
[20개국 테이블 전체]

### 2-2. EU 27개국 경감세율: [N]/27 존재
[27개국 체크 결과]

### 2-3. US Sales Tax: PASS/FAIL
[상세]

### 2-4. Canada GST/HST/PST: PASS/FAIL
[상세]

### 2-5. BR/IN/MX/CN 특수세금: PASS/FAIL
[각국 상세]

### 2-6. IOSS/OSS: PASS/FAIL
[상세]

### 2-7. B2B Reverse Charge: PASS/FAIL
[상세]

### 2-8. 세율 단위: PASS/FAIL
[상세]

## Phase 3: 수정 사항
[수정한 내용 or "수정 사항 없음"]

## Phase 4: 5회 자체 검수
### 검수 1: npm run build
[빌드 출력 마지막 10줄]

### 검수 2: VAT 15건 테스트
[15건 테이블 + 입력/예상/실제/PASS]

### 검수 3: EU 27개국 교차검증
[27개국 목록 + 샘플 5건 비교]

### 검수 4: Edge Cases 7건
[7건 테이블 + 입출력/PASS]

### 검수 5: Regression
[실행 명령어 + 출력]

## 최종 판정
- npm run build: ✅/❌
- VAT 15건: [N]/15 PASS
- EU 27국: [N]/27 확인
- Edge cases: [N]/7 PASS
- Regression: [N]/55 PASS
- 총 버그: [N]건 (수정: [N]건, 잔여: [N]건)
```

### POTAL_Claude_Code_Work_Log.xlsx 시트 추가

---

## 완료 조건 (전부 충족해야 "Area 2 Complete")
- [ ] Phase 1: 핵심 파일 4개 + 관련 파일 전부 읽기 완료
- [ ] Phase 2: 8개 영역 전부 분석 완료 (각각 PASS/FAIL 판정)
- [ ] Phase 3: FAIL 항목 전부 수정 (없으면 skip)
- [ ] 검수 1: npm run build ✅
- [ ] 검수 2: VAT 15건 테스트 전부 PASS (FAIL 있으면 수정 후 재실행)
- [ ] 검수 3: EU 27개국 경감세율 전부 확인
- [ ] 검수 4: Edge cases 7건 PASS
- [ ] 검수 5: Regression 55/55 PASS
- [ ] AREA2_VAT_GST_REDO_RESULT.md 생성 (위 형식대로)
- [ ] 엑셀 로그 시트 추가

## ⚠️ 이 Area 끝나면 멈춰라. Area 3으로 넘어가지 마라. "Area 2 Complete" 선언 후 대기.
