# Area 5: AD/CVD & Trade Remedies — Deep Review
# Section 301/232/IEEPA + Anti-Dumping + Countervailing Duties + Safeguards

## 목표
AD/CVD/세이프가드 + US 추가관세(Section 301/232) 코드 전체 심층 리뷰 + 5회 자체 검수

## ⚠️ 절대 규칙
1. **Area 5만 한다. 끝나면 멈춰라. Area 6으로 넘어가지 마라.**
2. **5회 자체 검수 전부 디테일하게 실행** — "PASS" 한 줄로 끝내지 마라. 각 검수마다 개별 테스트 결과 전부 표시
3. **rapidly 금지** — 하나씩 천천히 정확하게
4. **발견한 버그는 즉시 수정** — 수정 전/후 코드 명시
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## Phase 1: 코드 읽기 (전체 파악)

아래 파일들을 **전부** 읽는다:

```bash
# 1. trade-remedy-lookup.ts — AD/CVD/SG 메인 엔진 (449줄)
#    핵심: lookupTradeRemedies(), resolveFirmDuty(), searchFirmByTrgm()
#    firm-specific matching: exact → fuzzy → all_others → country_wide
cat app/lib/cost-engine/trade-remedy-lookup.ts

# 2. remedy-calculator.ts — F017-F020 S+ Grade (109줄)
#    핵심: calculateRemedyDuty(), sunset tracking, alerts
cat app/lib/trade/remedy-calculator.ts

# 3. section301-lookup.ts — US 추가관세 (174줄)
#    핵심: checkSection301() [CN→US, List 1-4A], checkSection232() [steel/aluminum 25%]
cat app/lib/cost-engine/section301-lookup.ts

# 4. GlobalCostEngine.ts — TLC 계산에서 trade remedy가 어디서 합산되는지
#    특히: lookupTradeRemedies 호출 위치, section301/232 합산 위치
cat app/lib/cost-engine/GlobalCostEngine.ts

# 5. API Routes — 4개 엔드포인트
cat app/api/v1/trade-remedies/calculate/route.ts
cat app/api/v1/trade-remedies/ad/route.ts
cat app/api/v1/trade-remedies/cvd/route.ts
cat app/api/v1/trade-remedies/safeguard/route.ts

# 6. Admin Sync Cron — 데이터 정합성 모니터링
cat app/api/v1/admin/trade-remedy-sync/route.ts

# 7. DB 마이그레이션 — 테이블 구조 + FK + 인덱스
cat supabase/migrations/017_fix_trade_remedy_fk.sql
cat supabase/migrations/022_search_firm_trgm.sql

# 8. DB 테이블 현황 — 행 수 + 스키마 확인
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables WHERE tablename IN ('"'"'trade_remedy_cases'"'"', '"'"'trade_remedy_products'"'"', '"'"'trade_remedy_duties'"'"', '"'"'safeguard_exemptions'"'"') ORDER BY tablename;"}'

# 9. DB 스키마 — 각 테이블 컬럼 구조
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '"'"'trade_remedy_cases'"'"' ORDER BY ordinal_position;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '"'"'trade_remedy_duties'"'"' ORDER BY ordinal_position;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '"'"'trade_remedy_products'"'"' ORDER BY ordinal_position;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '"'"'safeguard_exemptions'"'"' ORDER BY ordinal_position;"}'

# 10. DB 샘플 데이터 — 실제 데이터 패턴 확인 (각 테이블 5건씩)
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT id, case_id, case_type, title, imposing_country, affected_country, status, measure_type FROM trade_remedy_cases LIMIT 5;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT case_id, hs_code, hs_digits FROM trade_remedy_products LIMIT 5;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT case_id, firm_name, target_country, duty_rate, duty_type, measure_type FROM trade_remedy_duties LIMIT 5;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT case_id, exempt_country FROM safeguard_exemptions LIMIT 5;"}'

# 11. DB 통계 — case_type 분포, imposing_country 분포, status 분포
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT case_type, count(*) FROM trade_remedy_cases GROUP BY case_type ORDER BY count(*) DESC;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT imposing_country, count(*) FROM trade_remedy_cases GROUP BY imposing_country ORDER BY count(*) DESC LIMIT 10;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT status, count(*) FROM trade_remedy_cases GROUP BY status ORDER BY count(*) DESC;"}'
```

---

## Phase 2: 10개 분석 영역 (하나씩 순서대로)

### 분석 1: trade-remedy-lookup.ts — HS 코드 매칭 로직 정확성
**검증 항목:**
- `hs_code.eq.${hs6},hs_code.like.${hs4}%` — 6자리 exact + 4자리 prefix 매칭이 맞는지
- exactHs6CaseIds vs prefixCaseIds 우선순위: 6자리 exact 있으면 prefix 무시 → 이게 올바른 동작인지 (같은 제품이 6자리/4자리 모두 존재할 수 있음)
- hs_digits 컬럼이 DB에 있는데 코드에서 사용하지 않는 문제 확인
- DB의 hs_code 형식 확인 (점 포함? 6자리만? 가변 길이?) → 코드의 replace('.','')와 일치하는지
- `limit(100)` products, `limit(500)` duties — 충분한지 (대규모 케이스에서 잘림 가능성)

### 분석 2: trade-remedy-lookup.ts — Firm-specific 매칭 로직 정확성
**검증 항목:**
- normalizeFirmName(): 접미사 제거 목록 (CO, LTD, LLC 등) — 누락된 접미사 있는지 (GmbH는 있는데 KG, OHG 등은?)
- isAllOthersEntry(): "ALL OTHERS" 변형 전부 커버하는지 — TTBD 데이터에서 실제 사용되는 변형과 대조
- firmMatchScore(): token overlap 방식이 충분한지 — 예: "Samsung Electronics Co" vs "Samsung" → 점수?
- resolveFirmDuty() 우선순위: exact → fuzzy(≥0.7) → all_others → country_wide → highest — 이 순서가 법적으로 올바른지
- pg_trgm searchFirmByTrgm(): min_similarity 0.3 → 너무 낮지 않은지 (false positive 위험)
- `parseFloat(d.duty_rate)` — duty_rate가 DB에서 text? numeric? 타입 확인

### 분석 3: trade-remedy-lookup.ts — 국가 매칭 + 상태 필터링
**검증 항목:**
- `imposing_country` = destination, `affected_country` = origin 매핑이 맞는지
- status 필터: `['active', 'in_force', 'preliminary']` — DB에 실제 어떤 status 값들이 있는지 확인
- 'preliminary' 상태 포함이 올바른지 — preliminary는 잠정 관세, 확정 전 상태. 포함해야 하는지?
- EU 회원국 처리: dest=DE인데 imposing_country=EU인 케이스는 매칭되는지?
- 대소문자: `dest.toUpperCase()` 처리 후 DB 값과 비교 — DB에 소문자/혼합 있는지?

### 분석 4: trade-remedy-lookup.ts — Safeguard 면제 로직
**검증 항목:**
- safeguard_exemptions 테이블 구조: case_id + exempt_country만 있는지?
- exempt_country = origin으로 조회 — 올바른지?
- SG 타입 판별: `c.case_type === 'SG' || c.case_type === 'safeguard'` — DB에 실제 값 확인
- exempted SG case → measures에서 완전히 제외 (push 안 함) — 올바른지? (면제 = 0%인지 vs 면제 = 제외인지)
- 부분 면제 (partial exemption) 가능성 — 코드에서 처리되는지?

### 분석 5: section301-lookup.ts — US Section 301 (중국 관세) 정확성
**검증 항목:**
- **List 1 (25%)**: Ch.84, 85, 88, 90 — 현행 기준 맞는지 (2018 July 적용, 변경 여부)
- **List 2 (25%)**: Ch.28, 29, 38, 39, 72, 73 — 현행 기준 맞는지 (2018 Aug 적용)
- **List 3 (25%)**: Ch.94, 61, 62, 63, 64, 42, 03, 04, 07, 08, 16, 20, 21 — 현행 기준 맞는지 (2018 Sep 적용)
- **List 4A (7.5%)**: Ch.95, 65, 66, 67, 96, 43, 46, 57, 58, 59, 60, 68, 69, 70 — 현행 기준 맞는지 (Phase One deal 7.5%)
- **List 4B (폐지)**: 코드에 없는데, List 4B가 적용/폐지 상태 확인
- **⚠️ 2025년 IEEPA 추가관세**: 2025년 Executive Order로 중국에 대해 추가 관세가 부과됐는지 확인 — 코드에 IEEPA 로직이 없음
- chapter vs heading 매칭: `hsPatterns.includes(chapter) || hsPatterns.includes(heading)` — heading 레벨 예외 처리가 필요한 리스트 있는지
- 중국 이외 국가에서 Section 301 적용 대상 있는지 (EU 항공기, 프랑스 DST 등)

### 분석 6: section301-lookup.ts — US Section 232 (철강/알루미늄) 정확성
**검증 항목:**
- **철강 25%**: Ch.72-73 → 맞는지. Ch.72 = 철강, Ch.73 = 철강 제품
- **알루미늄 25%**: Ch.76 → 맞는지 (2025년 3월 EO로 10%→25% 인상)
- **면제국 전부 취소**: `SECTION_232_EXEMPT_COUNTRIES = new Set([])` — 빈 Set 맞는지 (2025 March 12 EO 확인)
- **derivative products**: Ch.72-73, 76 외에 Section 232 적용 받는 파생 제품 있는지 (nails, bolts 등 Ch.73 내 포함?)
- **Section 232 + Section 301 중첩**: CN 원산지 철강 제품 → 301 List 2 (25%) + 232 (25%) = 50% 맞는지? 코드에서 합산 확인
- **quotas**: Section 232에 관세 대신 쿼터(quota) 적용 국가 있었는지 (모두 취소 확인)

### 분석 7: remedy-calculator.ts — S+ Grade 계산 로직
**검증 항목:**
- trade-remedy-lookup.ts와 remedy-calculator.ts 간 **중복/충돌**: 둘 다 DB 조회하고 duty 계산하는 구조 — 어느 것이 실제 TLC에 사용되는지?
- `calculateRemedyDuty()` vs `lookupTradeRemedies()` — 호출 경로 확인 (GlobalCostEngine에서 어느 것을 호출?)
- case_type 판별: `caseType.includes('anti-dumping')` — DB case_type 값이 'AD'인지 'anti-dumping'인지 확인
- duty_rate 계산: `value * rate / 100` — rate가 백분율(25)인지 소수(0.25)인지 DB 확인
- sunset 알림: 6개월 이내 sunset → alert — 날짜 비교 로직 맞는지
- manufacturer 파라미터: firm-specific 매칭 없음 (remedy-calculator.ts는 그냥 첫 번째 duty 사용) → **잠재 부정확**

### 분석 8: GlobalCostEngine.ts에서 AD/CVD 합산 방식
**검증 항목:**
- lookupTradeRemedies() 호출 위치와 인자
- section301/232 호출 위치와 인자
- AD/CVD duty가 TLC의 어디에 합산되는지 (duty에 더하는지? 별도 항목인지?)
- section301 + section232 + AD/CVD 3중 합산 시나리오 (CN→US 철강): 코드에서 올바르게 처리되는지
- de minimis 적용 시 AD/CVD도 면제되는지? (법적으로 AD/CVD는 de minimis 무관)
- USD 환산: AD/CVD rate가 ad valorem(%)일 때와 specific duty($X/kg)일 때 처리 차이

### 분석 9: API 4개 엔드포인트 정확성
**검증 항목:**
- `/trade-remedies/calculate` — 전체 계산 엔드포인트: 필수 파라미터 검증, 에러 핸들링
- `/trade-remedies/ad` — AD만 필터: remedy_type 필터링이 올바른지
- `/trade-remedies/cvd` — CVD만 필터: 위와 동일
- `/trade-remedies/safeguard` — SG만 필터: 면제 로직 포함 확인
- API 응답 형식이 일관적인지 (error/success 구조)
- rate limiting 적용되는지
- 인증 필요 여부 (API key? 공개?)

### 분석 10: DB 데이터 정합성
**검증 항목:**
- trade_remedy_cases ↔ trade_remedy_products: FK 관계 확인 (case_id)
- trade_remedy_cases ↔ trade_remedy_duties: FK 관계 확인 (case_id)
- orphan records: products/duties에 있는데 cases에 없는 case_id 확인
- HS code 형식 일관성: trade_remedy_products의 hs_code가 6자리인지 가변인지
- duty_rate 타입과 값 범위: 음수? 0? 1000+? 이상치 확인
- imposing_country/affected_country가 ISO 3166-1 alpha-2 형식인지
- 데이터 출처(TTBD) 기준 업데이트 주기: trade-remedy-sync Cron이 데이터를 실제 업데이트하는지 vs 모니터링만 하는지

---

## Phase 3: 테스트 케이스 30건

### TC-01~05: US Section 301 (중국 관세) 5건
```
TC-01: CN→US, HS 8471.30 (laptops, Ch.84) → Section 301 List 1, +25%
TC-02: CN→US, HS 6109.10 (cotton t-shirts, Ch.61) → Section 301 List 3, +25%
TC-03: CN→US, HS 9503.00 (toys, Ch.95) → Section 301 List 4A, +7.5%
TC-04: CN→US, HS 3304.99 (cosmetics, Ch.33) → Section 301 적용 안 됨 (어떤 List에도 없음)
TC-05: DE→US, HS 8471.30 (laptops) → Section 301 적용 안 됨 (CN origin만 적용)
```

### TC-06~09: US Section 232 (철강/알루미늄) 4건
```
TC-06: KR→US, HS 7208.51 (hot-rolled steel, Ch.72) → Section 232 Steel +25%
TC-07: CN→US, HS 7606.11 (aluminum plates, Ch.76) → Section 232 Aluminum +25%
TC-08: CN→US, HS 7208.51 (steel, Ch.72) → 301 List 2 (25%) + 232 Steel (25%) = +50% 합산 확인
TC-09: JP→US, HS 9403.10 (metal furniture, Ch.94) → Section 232 적용 안 됨 (Ch.94는 철강 아님)
```

### TC-10~14: AD/CVD 매칭 5건 (실제 DB 데이터 기반)
```
TC-10: DB에서 imposing_country=US, case_type=AD인 실제 케이스 1건 찾아서 → lookupTradeRemedies()로 조회 → 결과 확인
TC-11: DB에서 imposing_country=EU, case_type=CVD인 실제 케이스 1건 → 조회 → 결과 확인
TC-12: 존재하지 않는 HS code + origin 조합 → hasRemedies = false 확인
TC-13: firm-specific: DB에서 firm_name이 있는 duty 1건 → firmName 넣고 조회 → matchType = exact 확인
TC-14: firm-specific: DB에 없는 firm name → matchType = all_others 확인
```

### TC-15~18: Safeguard 4건
```
TC-15: DB에서 case_type=SG (또는 safeguard)인 실제 케이스 1건 → 조회 → SG measure 반환 확인
TC-16: SG 케이스가 있고 exempt_country에 origin이 포함 → SG 면제 확인 (measures에서 제외)
TC-17: SG 케이스가 있고 exempt_country에 origin 미포함 → SG 적용 확인
TC-18: imposing_country에 SG 케이스가 없는 국가 → 빈 결과 확인
```

### TC-19~22: remedy-calculator.ts 4건
```
TC-19: US, CN origin, HS 7208.51, $10000 → AD duties 배열에 최소 1건 + amount 계산 확인
TC-20: 존재하지 않는 조합 → totalAdditionalDuty = 0
TC-21: sunset_date가 6개월 이내인 케이스 → alerts에 sunset_review 포함 확인
TC-22: sunset_date가 1년 이상 미래 → alerts에 sunset_review 없음 확인
```

### TC-23~26: Edge Cases 4건
```
TC-23: HS code "0000.00" (invalid) → 에러 없이 빈 결과 반환
TC-24: duty_rate = 0 인 케이스 → measures에서 제외 (rate <= 0 continue)
TC-25: 동일 HS code에 AD + CVD 동시 적용 → 두 measure 모두 반환 + totalRemedyRate 합산
TC-26: measures가 10개 이상인 극단 케이스 → limit(500) duties가 충분한지
```

### TC-27~30: DB 정합성 4건
```
TC-27: DB orphan check — trade_remedy_products에 있는 case_id가 trade_remedy_cases에 전부 존재하는지
TC-28: DB orphan check — trade_remedy_duties에 있는 case_id가 trade_remedy_cases에 전부 존재하는지
TC-29: DB duty_rate 이상치 — duty_rate > 500% 또는 duty_rate < 0 있는지 확인
TC-30: DB HS code 형식 — trade_remedy_products의 hs_code가 점(.)없이 순수 숫자인지, 길이 분포 확인
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

### 검수 2: Section 301/232 개별 검증 (10건)
각 테스트에서 함수를 직접 호출하여 결과 확인:
1. CN→US Ch.84 → List 1, 25% ✓
2. CN→US Ch.29 → List 2, 25% ✓
3. CN→US Ch.61 → List 3, 25% ✓
4. CN→US Ch.95 → List 4A, 7.5% ✓
5. CN→US Ch.33 → null (미적용) ✓
6. DE→US Ch.84 → null (CN만 적용) ✓
7. KR→US Ch.72 → 232 Steel 25% ✓
8. JP→US Ch.76 → 232 Aluminum 25% ✓
9. CN→US Ch.72 → 301(25%) + 232(25%) = 50% ✓
10. US→US (domestic) → null 전부 ✓

### 검수 3: AD/CVD DB 매칭 정확성 (5건)
DB에서 실제 활성 케이스 5건 골라서:
- case_id → trade_remedy_products에서 HS code 확인
- 해당 HS code + origin/dest로 lookupTradeRemedies() 호출
- 반환된 measures 중 해당 case_id가 포함되는지 확인
- duty rate가 DB 값과 일치하는지 확인 (rate/100 변환 포함)

### 검수 4: Firm-specific 매칭 + 에지 케이스 (5건)
1. exact firm match: DB에서 실제 firm_name 가져와서 동일 이름으로 조회 → matchType = exact
2. fuzzy firm match: firm_name에 " Co., Ltd." 추가해서 조회 → matchType = fuzzy, score ≥ 0.7
3. all_others fallback: 존재하지 않는 firm name → matchType = all_others
4. country_wide: firm_name 없이 + all_others도 없는 케이스 → matchType = country_wide
5. safeguard exemption: exempt_country에 해당 origin 포함 → 해당 SG case 제외 확인

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 55/55 PASS, 0 FAIL

---

## Phase 6: 결과 파일 생성

`AREA5_AD_CVD_TRADE_REMEDIES_RESULT.md` 생성:
```markdown
# Area 5: AD/CVD & Trade Remedies — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- [파일 목록 + 각 파일 핵심 내용 요약]

## Phase 2: 10개 영역 분석 결과
### 분석 1: HS 코드 매칭 로직
- [결과]
### 분석 2: Firm-specific 매칭
- [결과]
...

## Phase 3: 테스트 30건 결과
| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| TC-01 | CN→US Ch.84 Section 301 | List 1, 25% | ? | ? |
...

## 버그 발견
- [N건: 상세]

## 수정
- [수정 파일, 수정 전/후]

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ? errors |
| 2 | Section 301/232 | ?/10 |
| 3 | AD/CVD DB 매칭 | ?/5 |
| 4 | Firm+에지 케이스 | ?/5 |
| 5 | Regression | ?/55 |

## INFO items (non-blocking)
- [참고 사항]

## 수정 파일
- [목록]

## 생성 파일
- AREA5_AD_CVD_TRADE_REMEDIES_RESULT.md
- Work log 시트
```

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가 (YYMMDDHHMM 형식)

---

## ⚠️ Area 5 끝나면 멈춰라. Area 6으로 넘어가지 마라. "Area 5 Complete. 대기 중." 선언 후 대기.
