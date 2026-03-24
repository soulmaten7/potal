# F015 가격 분기 규칙 (Price Break Engine) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F015만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 CRITICAL 버그가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F015 파일 목록 (6개 파일, 562줄)
1. `app/lib/classification/price-break-engine.ts` (139줄) — 메인 엔진
2. `app/lib/cost-engine/hs-code/price-break-rules.ts` (186줄) — 캐싱 + 상세 룩업
3. `app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts` (81줄) — GRI Step 10
4. `app/lib/cost-engine/gri-classifier/steps/v3/step6-price-break.ts` (96줄) — GRI v3 Step 6
5. `app/api/v1/price-breaks/check/route.ts` (18줄) — API
6. `app/api/v1/price-breaks/optimize/route.ts` (18줄) — API

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 6개 파일을 **전부** 읽고, 아래 알려진 문제를 **직접 확인**한다. 확인 결과를 출력한다.

---

## 🔧 Step 2: 알려진 CRITICAL 버그 2개 수정

### CRITICAL 1: 테이블명 불일치 (price-break-engine.ts)
- **위치**: `app/lib/classification/price-break-engine.ts` 44번째 줄 부근
- **현재**: `.from('price_break_rules')`
- **실제 DB 테이블명**: `hs_price_break_rules`
- **영향**: 런타임 에러 "relation price_break_rules does not exist" → 가격 분기가 아예 작동 안 함
- **수정**: `.from('price_break_rules')` → `.from('hs_price_break_rules')` (이 파일에서 모든 occurrence)

### CRITICAL 2: 컬럼명 불일치 (step10-price-break.ts)
- **위치**: `app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts` 41번째 줄 부근
- **현재**: `.in('hs_code', hs6List)`
- **실제 DB 컬럼명**: `parent_hs_code`
- **영향**: 가격 분기 필터링이 절대 매치되지 않음 → 가격에 따른 HS코드 변경이 작동 안 함
- **수정**:
  - `.in('hs_code', ...)` → `.in('parent_hs_code', ...)`
  - `.find((r) => r.hs_code === hs6)` → `.find((r) => r.parent_hs_code === hs6)`

---

## 🔧 Step 3: MEDIUM 문제 3개 수정

### MEDIUM 1: 타입 캐스팅 안전성 (price-break-rules.ts)
- **위치**: 159~172줄 부근
- **현재**: `row.duty_rate_under as number` — DB에서 null 반환 시 NaN 발생
- **수정**: null guard 추가. 예: `Number(row.duty_rate_under ?? 0)`

### MEDIUM 2: API price 검증 (check/route.ts, optimize/route.ts)
- **현재**: `price <= 0` 거부 — price=0인 상품(무료 샘플)이 유효한 케이스
- **수정**: `price < 0` 거부로 변경 (0 허용), 또는 price를 optional로

### MEDIUM 3: HS코드 형식 검증 없음
- **현재**: hsCode에 아무 문자열이나 들어올 수 있음
- **수정**: API 엔드포인트에 `/^\d{6,10}$/` regex 검증 추가

---

## 🔧 Step 4: 테스트 보강

현재 테스트 6개(sprint2 3개 + s-grade 3개)가 있지만 실제 DB 쿼리 테스트가 없다.

`__tests__/f015-price-break-engine.test.ts` 생성:
1. evaluatePriceBreaks — 유효한 HS코드 + price → 결과 반환 또는 null
2. evaluatePriceBreaks — 잘못된 HS코드 → null 반환 (에러 아님)
3. evaluatePriceBreaks — price 0 → 정상 처리
4. evaluatePriceBreaks — 빈 문자열 → null 반환
5. getOptimizationSuggestions — 유효한 입력 → 결과 반환
6. API check — 필수 필드 누락 → 400
7. API check — HS코드 형식 오류 → 400
8. step10 applyPriceBreak — candidates + price → 필터링 결과
9. v3 step6 applyPriceBreakV3 — country + price → 결과
10. price-break-rules applyPriceBreakRule — 캐시 동작 확인

---

## ✅ Step 5: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/lib/classification/price-break-engine.ts 2>&1 | head -20
npx tsc --noEmit app/lib/cost-engine/hs-code/price-break-rules.ts 2>&1 | head -20
npx tsc --noEmit app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts 2>&1 | head -20
```
→ 에러 0개여야 통과

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/lib/classification/price-break-engine.ts
grep -n ": any" app/lib/cost-engine/hs-code/price-break-rules.ts
grep -n ": any" app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts
```
→ 타입으로 사용된 any 0개

### 검수 3: 테이블명/컬럼명 확인
```bash
grep -rn "from('price_break_rules')" app/lib/
grep -rn "hs_code" app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts
```
→ `price_break_rules` 0건 (전부 `hs_price_break_rules`로 변경됨), step10에서 `hs_code` 컬럼 참조 0건

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f015-price-break-engine.test.ts --verbose 2>&1
```
→ 10개 테스트 ALL PASS

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공

---

## 📊 Step 6: 결과 보고

```
=== F015 가격 분기 규칙 — 검수 결과 ===

[수정 전 문제]
1. CRITICAL: 테이블명 불일치 — price_break_rules vs hs_price_break_rules
2. CRITICAL: 컬럼명 불일치 — hs_code vs parent_hs_code
3. MEDIUM: 타입 캐스팅 null guard 없음
4. MEDIUM: price=0 거부
5. MEDIUM: HS코드 형식 검증 없음

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)

[5단계 검수]
1. TypeScript 컴파일: ✅/❌
2. any 타입: ✅/❌
3. 테이블명/컬럼명: ✅/❌
4. 테스트: ✅/❌ (N/10 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
