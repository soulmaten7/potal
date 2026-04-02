# F049 ICS2 준수 (ICS2 Compliance + Broker Data Export) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F049만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 문제가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F049 파일 목록 (4개 파일, 499줄)
1. `app/lib/trade/broker-data-export.ts` (108줄) — 핵심 라이브러리 (validate, ABI/CSV/XML export)
2. `app/api/v1/compliance/ics2/route.ts` (279줄) — ICS2 검증 API (21개 검증 항목)
3. `app/api/v1/broker/export/route.ts` (56줄) — 브로커 데이터 내보내기 API
4. `app/api/v1/calculate/route.ts` (356줄) — ICS2 연동 부분 (222~234줄 부근)

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 4개 파일을 **전부** 읽고, 아래 알려진 문제를 **직접 확인**한다.

---

## 🔧 Step 2: 알려진 문제 4개 수정

### 문제 1 (HIGH): broker/export/route.ts에서 validateBrokerData() 호출 누락
- **위치**: `app/api/v1/broker/export/route.ts` 51줄 부근
- **현재**: `generatePreFilingChecklist(data)`를 호출하기 전에 `validateBrokerData(data)`를 호출하지 않음
- **또한**: `exportABI/CSV/XML` 함수들도 validation 없이 바로 호출됨
- **영향**: 잘못된 데이터가 그대로 export 파일에 들어갈 수 있음
- **수정**:
  ```typescript
  const errors = validateBrokerData(data);
  if (errors.length > 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Validation failed: ${errors.join(', ')}`);
  }
  ```
  export 함수 호출 전에 위 검증을 추가한다.

### 문제 2 (MEDIUM): 테스트 assertion 오류
- **위치**: `app/lib/tests/s-grade-verification.test.ts` 583줄 부근
- **현재**: `assert(result.includes('ISA'))` — 'ISA' 문자열을 찾음
- **실제**: `exportABI()` 함수는 'SE' 헤더로 시작함 (ISA가 아님)
- **영향**: 테스트가 실패하거나 잘못된 assertion
- **수정**: `assert(result.includes('SE|'))` 또는 실제 ABI 출력 형식에 맞게 수정

### 문제 3 (MEDIUM): ICS2 API 응답 HTTP 상태코드
- **위치**: `app/api/v1/compliance/ics2/route.ts`
- **현재**: non_compliant여도 항상 200 OK 반환
- **수정**: compliant=true → 200, compliant=false + errors 있음 → 422 Unprocessable Entity
  ```typescript
  const statusCode = result.compliant ? 200 : 422;
  return NextResponse.json(result, { status: statusCode });
  ```

### 문제 4 (MEDIUM): 전용 테스트 보강
- **현재**: sprint3-compliance.test.ts에 F049 테스트 2개만 있음
- **수정**: `__tests__/f049-ics2-compliance.test.ts` 생성:
  1. validateICS2 — 완전한 유효 데이터 → compliant: true
  2. validateICS2 — shipper name 누락 → error 반환
  3. validateICS2 — HS code 5자리 (6자리 미만) → error 반환
  4. validateICS2 — weight 음수 → error 반환
  5. validateICS2 — description 2글자 → warning 반환
  6. validateICS2 — EORI 형식 틀림 → warning 반환
  7. validateICS2 — transport mode 'bike' (유효하지 않음) → error 반환
  8. validateBrokerData — importer 누락 → errors 배열 반환
  9. validateBrokerData — items 빈 배열 → error 반환
  10. exportABI — 유효 데이터 → string 반환 (SE| 포함)
  11. exportCSV — 유효 데이터 → CSV 형식 string 반환
  12. exportXML — 유효 데이터 → XML 형식 + & 이스케이핑 확인
  13. API POST /compliance/ics2 — 유효 데이터 → 200
  14. API POST /compliance/ics2 — 필수 필드 누락 → 422
  15. API POST /broker/export — format=csv → text/csv Content-Type

---

## ✅ Step 3: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/lib/trade/broker-data-export.ts 2>&1 | head -20
npx tsc --noEmit app/api/v1/compliance/ics2/route.ts 2>&1 | head -20
npx tsc --noEmit app/api/v1/broker/export/route.ts 2>&1 | head -20
```
→ 에러 0개

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/lib/trade/broker-data-export.ts
grep -n ": any" app/api/v1/compliance/ics2/route.ts
grep -n ": any" app/api/v1/broker/export/route.ts
```
→ 0개

### 검수 3: 검증 체인 확인
```bash
grep -n "validateBrokerData" app/api/v1/broker/export/route.ts
```
→ validateBrokerData 호출이 export 함수 전에 존재해야 함

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f049-ics2-compliance.test.ts --verbose 2>&1
```
→ 15개 테스트 ALL PASS

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공

---

## 📊 Step 4: 결과 보고

```
=== F049 ICS2 준수 — 검수 결과 ===

[수정 전 문제]
1. HIGH: broker/export에서 validateBrokerData() 호출 누락
2. MEDIUM: 테스트 assertion 오류 (ISA vs SE)
3. MEDIUM: non_compliant에도 200 OK 반환
4. MEDIUM: 전용 테스트 2개뿐

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)

[5단계 검수]
1. TypeScript 컴파일: ✅/❌
2. any 타입: ✅/❌
3. 검증 체인: ✅/❌
4. 테스트: ✅/❌ (N/15 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
