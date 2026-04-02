# F041 원산지 국가 AI 예측 (Origin Detection) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F041만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 문제가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F041 파일 목록 (4개 파일, 643줄)
1. `app/lib/cost-engine/origin-detection.ts` (262줄) — 동기 감지 (브랜드 65개, 플랫폼 40개, 키워드 21개)
2. `app/lib/trade/origin-predictor.ts` (89줄) — 카테고리 기반 예측
3. `app/api/v1/origin/route.ts` (269줄) — 메인 API (AI + 휴리스틱 하이브리드)
4. `app/api/v1/origin/predict/route.ts` (23줄) — 경량 래퍼

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 4개 파일을 **전부** 읽고, 아래 알려진 문제를 **직접 확인**한다.

---

## 🔧 Step 2: 알려진 문제 수정

### 문제 1 (HIGH): origin-predictor.ts에 try-catch 없음
- **현재**: 89줄 전체에 try-catch가 0개. 에러 발생 시 API가 500 반환
- **수정**: `predictOrigin()` 함수 전체를 try-catch로 래핑
- catch에서 안전한 기본값 반환:
  ```typescript
  return { predictedOrigins: [], confidence: 0, needsVerification: true };
  ```

### 문제 2 (MEDIUM): 브랜드 데이터 중복 3곳
- **현재**: BRAND_ORIGINS가 3개 파일에 각각 다른 수량으로 존재
  - origin-detection.ts: 65개
  - origin-predictor.ts: 18개
  - route.ts: 27개
- **수정**: `app/lib/data/brand-origins.ts` 단일 소스 파일 생성
  - 3개 파일의 브랜드를 합쳐서 중복 제거 → 단일 Map export
  - 3개 파일 모두 이 파일에서 import
  - "1000+ brands" 주석은 실제 수량으로 수정 (예: "110+ brands")

### 문제 3 (MEDIUM): origin-detection.ts 에러 시 'unknown' 반환
- **현재**: catch에서 `{ country: 'unknown', ... }` 반환 — 'unknown'은 ISO2 코드가 아님
- **수정**: 'unknown' 대신 빈 문자열 또는 null 반환하고, 호출부에서 처리
  ```typescript
  return { country: '', confidence: 'none', score: 0, method: 'error' };
  ```

### 문제 4 (MEDIUM): 입력 검증 부족
- **현재**: `/api/v1/origin/route.ts`에서 price 검증 없음 (음수 가능), hsCode 형식 검증 없음
- **수정**:
  - price: `typeof price === 'number' && price >= 0` 검증
  - hsCode: `/^\d{4,10}$/` regex 검증 (4자리~10자리)
  - country: ISO2 형식 검증 (`/^[A-Z]{2}$/i`)

### 문제 5 (MEDIUM): 테스트 부족
- **현재**: F035 이름으로 3개 테스트만 있음 (F041 전용 0개)
- **수정**: `__tests__/f041-origin-detection.test.ts` 생성:
  1. detectOrigin — "Nike shoes" → US
  2. detectOrigin — "Xiaomi phone" → CN
  3. detectOrigin — "AliExpress product" → CN (플랫폼 감지)
  4. detectOrigin — "Made in Japan" → JP (키워드 감지)
  5. detectOrigin — 빈 문자열 → 에러 없이 기본값
  6. detectOrigin — 특수문자만 → 에러 없이 기본값
  7. predictOrigin — "cotton t-shirt" → 결과에 CN 포함
  8. predictOrigin — brand "apple" → US
  9. API POST /origin — 유효한 요청 → 200
  10. API POST /origin — productName 누락 → 400

---

## ✅ Step 3: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/lib/cost-engine/origin-detection.ts 2>&1 | head -20
npx tsc --noEmit app/lib/trade/origin-predictor.ts 2>&1 | head -20
npx tsc --noEmit app/api/v1/origin/route.ts 2>&1 | head -20
```
→ 에러 0개

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/lib/cost-engine/origin-detection.ts
grep -n ": any" app/lib/trade/origin-predictor.ts
grep -n ": any" app/api/v1/origin/route.ts
```
→ 0개

### 검수 3: try-catch 확인
```bash
grep -n "try\|catch" app/lib/trade/origin-predictor.ts
grep -n "try\|catch" app/lib/cost-engine/origin-detection.ts
grep -n "try\|catch" app/api/v1/origin/route.ts
```
→ origin-predictor.ts에 try-catch 존재 확인 (이전에 없었음)

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f041-origin-detection.test.ts --verbose 2>&1
```
→ 10개 테스트 ALL PASS

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공

---

## 📊 Step 4: 결과 보고

```
=== F041 원산지 국가 AI 예측 — 검수 결과 ===

[수정 전 문제]
1. HIGH: origin-predictor.ts에 try-catch 없음
2. MEDIUM: 브랜드 데이터 3곳 중복
3. MEDIUM: 'unknown' 비ISO2 반환
4. MEDIUM: 입력 검증 부족
5. MEDIUM: 전용 테스트 0개

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)

[5단계 검수]
1. TypeScript 컴파일: ✅/❌
2. any 타입: ✅/❌
3. try-catch: ✅/❌
4. 테스트: ✅/❌ (N/10 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
