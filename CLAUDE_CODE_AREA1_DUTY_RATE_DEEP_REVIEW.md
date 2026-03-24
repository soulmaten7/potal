# Area 1: Duty Rate — Deep Review & Fix Command
# Claude Code Terminal 2 전용 — 자체 5회 검수 후 완료
# 2026-03-23 KST

## 목표
Area 1 (Duty Rate) 관련 **모든 코드**를 읽고, 버그/갭/엣지케이스를 찾고, 수정하고, 5번 자체 검수한다.

## 절대 규칙
1. **v3 파이프라인 코드 수정 금지** — 기존 로직 변경 금지, 추가만 가능
2. **npm run build 통과 필수** — 매 수정 후 빌드 확인
3. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
4. **regression 테스트** — 기존 55/55 PASS 유지 확인

---

## Phase 1: 코드 전체 읽기 (READ ONLY — 수정 금지)

### 1-1. Duty Rate 핵심 파일 (전부 읽어야 함)
```
cat app/lib/cost-engine/macmap-lookup.ts
cat app/lib/cost-engine/gri-classifier/steps/v3/duty-rate-lookup.ts
cat app/lib/cost-engine/db/duty-rates-db.ts
cat app/lib/cost-engine/hs-code/duty-rates.ts
cat app/lib/cost-engine/section301-lookup.ts
cat app/lib/cost-engine/trade-remedy-lookup.ts
cat app/lib/cost-engine/fta.ts
```

### 1-2. Duty Rate 사용처 파일 (어디서 호출하는지)
```
cat app/lib/cost-engine/GlobalCostEngine.ts
cat app/lib/cost-engine/CostEngine.ts
cat app/lib/cost-engine/breakdown.ts
```

### 1-3. API 엔드포인트 (고객이 호출하는 곳)
```
cat app/api/v1/calculate/route.ts
cat app/api/v1/calculate/breakdown/route.ts
cat app/api/v1/calculate/compare/route.ts
cat app/api/v1/tariff/route.ts
```

### 1-4. DB 관련 (캐시, 스키마)
```
cat app/lib/cost-engine/db/tariff-cache.ts
```

### 1-5. 타입 정의
```
cat app/lib/cost-engine/types.ts
cat app/lib/cost-engine/hs-code/types.ts
```

---

## Phase 2: 분석 체크리스트 (각 항목 PASS/FAIL 판정)

### 2-1. 세율 단위 일관성 검사
- [ ] macmap-lookup.ts: avDuty = 0.12 (비율) or 12.0 (퍼센트)?
- [ ] duty-rate-lookup.ts: duty_rate_pct = 비율 or 퍼센트?
- [ ] GlobalCostEngine.ts: 어떤 단위로 받아서 계산하는가?
- [ ] CostEngine.ts: 어떤 단위로 받아서 계산하는가?
- [ ] **단위 변환 버그 있는지**: 0.12를 12%로 사용하는 곳 vs 0.12를 0.12%로 사용하는 곳
- [ ] **결론**: 전체 체인에서 단위가 일관되는가?

### 2-2. EU 매핑 일관성 검사
- [ ] macmap-lookup.ts: EU_MEMBERS 27개국 확인
- [ ] duty-rate-lookup.ts: EU_MEMBERS 27개국 확인
- [ ] duty-rates-db.ts: EU_COUNTRIES 27개국 확인
- [ ] **3개 파일의 EU 멤버 목록이 동일한지 비교**
- [ ] DK(덴마크) 포함 확인 (EU 멤버이지만 유로존 아님)

### 2-3. 조회 체인 정확성 검사
macmap-lookup.ts 4단계 체인:
- [ ] Stage 1 AGR: reporter=destination, partner=origin → 맞는지?
- [ ] Stage 2 MIN: reporter=destination, partner=origin → 맞는지?
- [ ] Stage 3 NTLC: destination_country=destination (partner 없음) → 맞는지?
- [ ] Stage 4 fallback: null 반환 → caller가 hardcoded 사용 → 맞는지?
- [ ] **AGR과 MIN에서 reporter/partner 파라미터가 macmap DB 스키마와 일치하는지 확인**
  - macmap_agr_rates: reporter_iso2 = 수입국, partner_iso2 = 수출국
  - macmap_min_rates: reporter_iso2 = 수입국, partner_iso2 = 수출국
  - macmap_ntlc_rates: destination_country = 수입국 (partner 없음, MFN이니까)

### 2-4. HS Code 매칭 로직 검사
- [ ] getHsPrefixes(): exact → 8자리 → 6자리 fallback 정확한지?
- [ ] hs6 필터: `.eq('hs6', prefix.substring(0, 6))` — DB에 hs6 컬럼이 실제로 있는지?
- [ ] exact match: `rows.find(r => r.product_code === prefix)` — product_code 컬럼이 실제 존재하는지?
- [ ] limit(10): 10개면 충분한지? 일부 HS6에 10개 이상 서브헤딩 있을 수 있음

### 2-5. 에러 핸들링 검사
- [ ] Supabase 연결 실패 시 null 반환 → GlobalCostEngine에서 어떻게 처리?
- [ ] try-catch 빠진 곳 있는지?
- [ ] parseFloat(null), parseFloat(undefined) 처리?
- [ ] 빈 문자열 hsCode("") 들어올 때?
- [ ] 국가코드 소문자("us") 들어올 때?

### 2-6. Rate 이상값 검사
- [ ] 음수 세율 처리 (av_duty < 0)?
- [ ] 세율 0 처리 (면세 상품)?
- [ ] 세율 > 100% 처리 (일부 농산물)?
- [ ] nav_duty (비종가세, "2.5 EUR/kg" 등) 처리 방식?
- [ ] nav_duty만 있고 av_duty가 null인 경우?

### 2-7. 성능 검사
- [ ] lookupAllDutyRates: 3개 DB 쿼리 병렬 → Promise.all 사용 ✅
- [ ] 불필요한 DB 호출 있는지? (같은 쿼리 2번 등)
- [ ] precomputed_landed_costs 캐시 활용되는지?

### 2-8. 데이터 커버리지 검사
DB에서 확인 (psql 또는 Management API):
```sql
-- 1. macmap_ntlc_rates 국가 수
SELECT COUNT(DISTINCT destination_country) FROM macmap_ntlc_rates;

-- 2. macmap_min_rates 국가 수
SELECT COUNT(DISTINCT reporter_iso2) FROM macmap_min_rates LIMIT 1;

-- 3. macmap_agr_rates 국가 수
SELECT COUNT(DISTINCT reporter_iso2) FROM macmap_agr_rates LIMIT 1;

-- 4. 세율이 NULL인 행 수
SELECT COUNT(*) FROM macmap_ntlc_rates WHERE mfn_rate IS NULL;

-- 5. hs6 컬럼 존재 확인
SELECT column_name FROM information_schema.columns WHERE table_name='macmap_ntlc_rates';
SELECT column_name FROM information_schema.columns WHERE table_name='macmap_min_rates';
SELECT column_name FROM information_schema.columns WHERE table_name='macmap_agr_rates';

-- 6. 7개국 gov_tariff_schedules와 macmap 세율 비교 (샘플)
-- US: HS 610910 (cotton t-shirts) 예상 16.5%
SELECT mfn_rate FROM macmap_ntlc_rates WHERE destination_country='US' AND hs6='610910';
-- EU: HS 610910 예상 12%
SELECT mfn_rate FROM macmap_ntlc_rates WHERE destination_country='EU' AND hs6='610910';
-- JP: HS 610910 예상 10.9%
SELECT mfn_rate FROM macmap_ntlc_rates WHERE destination_country='JP' AND hs6='610910';

-- 7. Section 301 대상 HS 코드 수 확인
-- (section301-lookup.ts에서 하드코딩된 목록과 DB 비교)

-- 8. AD/CVD 케이스 수
SELECT COUNT(*) FROM trade_remedy_cases;
SELECT COUNT(*) FROM trade_remedy_duties;
```

### 2-9. 중복/충돌 검사
- [ ] macmap-lookup.ts와 duty-rate-lookup.ts가 **같은 기능을 다르게 구현**하고 있는지?
- [ ] 어떤 코드 경로에서 어떤 파일이 호출되는지 추적
  - API /calculate → GlobalCostEngine → ???
  - API /tariff → ???
  - v3 pipeline Step 7 → duty-rate-lookup.ts → ???
- [ ] **두 개의 다른 세율이 반환될 수 있는 경로가 있는지?**

### 2-10. Section 301/232/IEEPA 검사
- [ ] section301-lookup.ts에 정의된 세율이 최신인지?
  - US Section 301 China: 현재 세율 확인 (25%, 일부 7.5%)
  - US Section 232 Steel/Aluminum: 25% 맞는지?
  - IEEPA: 최근 추가된 관세 반영됐는지?
- [ ] CN 외 다른 나라에 대한 301 적용 없는지 확인
- [ ] 면제 품목 처리 (exclusion list)

---

## Phase 3: 버그 수정

Phase 2에서 FAIL 판정된 항목만 수정한다.

수정 원칙:
1. 기존 함수 시그니처 변경 금지 (하위 호환)
2. 새 기능은 새 함수로 추가
3. 주석으로 수정 사유 기록
4. 수정 전 코드 + 수정 후 코드 엑셀에 기록

---

## Phase 4: 5회 자체 검수

### 검수 1: npm run build
```bash
npm run build
```
→ 0 errors 확인

### 검수 2: 세율 정확도 검증 (10건)
아래 10건에 대해 macmap-lookup.ts의 lookupMacMapDutyRate() 호출 결과와 알려진 세율 비교:

| # | HS Code | Destination | Origin | 예상 세율 | 비교 |
|---|---------|-------------|--------|-----------|------|
| 1 | 610910 | US | CN | 16.5% MFN | |
| 2 | 610910 | EU | CN | 12.0% MFN | |
| 3 | 610910 | JP | CN | 10.9% MFN | |
| 4 | 610910 | KR | CN | 13.0% MFN | |
| 5 | 610910 | US | VN | 16.5% MFN (no FTA) | |
| 6 | 610910 | US | MX | 16.5% MFN or 0% USMCA | |
| 7 | 870323 | US | DE | 2.5% MFN | |
| 8 | 870323 | US | JP | 2.5% MFN | |
| 9 | 220830 | US | GB | varies | |
| 10 | 950300 | US | CN | varies | |

테스트 코드:
```typescript
// test-duty-rates.ts (임시 파일, 테스트 후 삭제)
import { lookupMacMapDutyRate } from './app/lib/cost-engine/macmap-lookup';

const tests = [
  { hs: '610910', dest: 'US', origin: 'CN', expected: 0.165 },
  { hs: '610910', dest: 'DE', origin: 'CN', expected: 0.12 },  // DE→EU 매핑
  { hs: '610910', dest: 'JP', origin: 'CN', expected: 0.109 },
  { hs: '610910', dest: 'KR', origin: 'CN', expected: 0.13 },
  { hs: '610910', dest: 'US', origin: 'VN', expected: 0.165 },
  { hs: '610910', dest: 'US', origin: 'MX', expected: null },  // USMCA 0% possible
  { hs: '870323', dest: 'US', origin: 'DE', expected: 0.025 },
  { hs: '870323', dest: 'US', origin: 'JP', expected: 0.025 },
  { hs: '220830', dest: 'US', origin: 'GB', expected: null },  // 확인 필요
  { hs: '950300', dest: 'US', origin: 'CN', expected: null },  // 확인 필요
];
```

### 검수 3: 엣지 케이스 검증 (5건)
| # | 케이스 | 예상 동작 |
|---|--------|----------|
| 1 | HS="" dest="US" origin="CN" | null 반환, 에러 없음 |
| 2 | HS="610910" dest="" origin="CN" | null 반환, 에러 없음 |
| 3 | HS="610910" dest="XX" origin="CN" | null (존재하지 않는 국가) |
| 4 | HS="610910" dest="us" origin="cn" | 정상 동작 (소문자) |
| 5 | HS="6109.10" dest="US" origin="CN" | 정상 동작 (점 포함) |

### 검수 4: Section 301 + AD/CVD 통합 검증
- US에 CN 수출 시: MFN + Section 301 25% 추가 적용되는지?
- section301-lookup.ts 반환값이 GlobalCostEngine에서 합산되는지?
- AD/CVD 케이스가 있는 HS 코드에서 추가 관세 적용되는지?

### 검수 5: 코드 경로 완전성 검증
API 호출부터 최종 세율 반환까지 전체 경로 추적:
```
POST /api/v1/calculate
  → GlobalCostEngine.calculate()
    → [Duty Rate 조회: 어떤 함수?]
      → [macmap-lookup.ts or duty-rates-db.ts or duty-rate-lookup.ts?]
        → [DB 조회]
    → [Section 301 추가?]
    → [AD/CVD 추가?]
    → [결과 합산]
  → Response
```

이 경로에서:
- 어떤 파일의 어떤 함수가 호출되는지 정확히 기록
- 중복 호출이 있는지 확인
- 누락된 계산이 있는지 확인

---

## Phase 5: 엑셀 로그 마감

POTAL_Claude_Code_Work_Log.xlsx에 시트 추가:
- 시트명: 현재 시각 YYMMDDHHMM
- 모든 발견, 수정, 검증 결과 기록
- 마지막 행: === 작업 종료 === | 총 소요시간 | 빌드 결과 | 테스트 PASS 수 | 수정 파일 수

---

## Phase 6: 결과 요약 파일 생성

`AREA1_DUTY_RATE_REVIEW_RESULT.md` 생성:
```markdown
# Area 1: Duty Rate — Deep Review Result
# [날짜] KST

## 검사 항목: [N]개
## PASS: [N]개
## FAIL→FIXED: [N]개
## 잔여 이슈: [N]개

## 발견된 버그
1. [설명] — 수정 완료 / 미수정 (사유)

## 세율 정확도 검증
- 10/10 PASS or N/10 FAIL (상세)

## 코드 경로 맵
[전체 호출 그래프]

## 커버리지 갭
- 국가 수: macmap [N]개국 / 전체 240개국
- 누락 국가 목록: [...]
- nav_duty 처리 현황: [...]

## npm run build: ✅ or ❌
## 기존 regression 55/55: ✅ or ❌
```

---

## 완료 조건
- [ ] Phase 1~6 전부 완료
- [ ] npm run build ✅
- [ ] 세율 10건 테스트 전부 PASS
- [ ] 엣지 케이스 5건 전부 PASS
- [ ] 기존 regression 55/55 유지
- [ ] 엑셀 로그 완료
- [ ] 결과 파일 생성

이 모든 조건이 충족되면 "Area 1 Complete" 선언 후 **Area 2 (VAT/GST) 명령어 파일 읽기로 진행**.
