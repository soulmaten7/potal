# F054 Nexus 추적 (US Tax Nexus Tracking) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F054만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 문제가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F054 파일 목록 (1개 핵심 파일 + 테스트)
1. `app/api/v1/tax/nexus/route.ts` (207줄) — GET/POST 핸들러, 50개 주 threshold
2. `__tests__/api/sprint4-tax.test.ts` (기존 테스트, nexus 관련 3개만)

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 파일을 **전부** 읽고, 아래 알려진 문제를 **직접 확인**한다.

---

## 🔧 Step 2: 알려진 문제 4개 수정

### 문제 1 (HIGH): GET 핸들러 DB 쿼리에 try-catch 없음
- **위치**: `app/api/v1/tax/nexus/route.ts` 135~139줄
- **현재**: supabase `.from('seller_nexus_tracking').select('*')` 호출이 try-catch 없이 실행됨
- **영향**: DB 연결 실패 시 unhandled exception → 500 에러
- **수정**:
  ```typescript
  try {
    const { data, error } = await supabase
      .from('seller_nexus_tracking')
      .select('*')
      .eq('seller_id', context.sellerId)
      .order('jurisdiction');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      nexusStatuses: (data || []).map(...)
    });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch nexus data');
  }
  ```

### 문제 2 (HIGH): POST 핸들러 UPSERT에 try-catch 없음
- **위치**: `app/api/v1/tax/nexus/route.ts` 179~190줄
- **현재**: `supabase.from('seller_nexus_tracking').upsert(...)` 호출이 try-catch 없음
- **영향**: UPSERT 실패 시 전체 POST 핸들러 크래시
- **수정**: UPSERT 호출을 try-catch로 감싸고, error 시 apiError 반환
  ```typescript
  try {
    const { error: upsertError } = await supabase
      .from('seller_nexus_tracking')
      .upsert({...}, { onConflict: 'seller_id,jurisdiction' });

    if (upsertError) throw upsertError;
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to save nexus status');
  }
  ```

### 문제 3 (MEDIUM): 음수 값 입력 검증 없음
- **위치**: `app/api/v1/tax/nexus/route.ts` 166~167줄
- **현재**: `annualRevenue`와 `transactionCount`가 음수여도 통과됨
- **영향**: 음수 매출/거래수로 nexus 계산하면 threshold 비교 결과 틀림
- **수정**:
  ```typescript
  const annualRevenue = typeof body.annualRevenue === 'number' && body.annualRevenue >= 0
    ? body.annualRevenue : undefined;
  const transactionCount = typeof body.transactionCount === 'number' && body.transactionCount >= 0
    ? body.transactionCount : undefined;
  ```
  또한 jurisdiction 빈 문자열 검증 추가:
  ```typescript
  if (!jurisdiction || jurisdiction.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'jurisdiction is required');
  }
  ```

### 문제 4 (MEDIUM): 전용 테스트 부족
- **현재**: sprint4-tax.test.ts에 nexus 관련 3개 테스트만 (로직 테스트, 실제 API 테스트 아님)
- **수정**: `__tests__/f054-nexus-tracking.test.ts` 생성:
  1. checkNexus — physical presence true → hasNexus: true
  2. checkNexus — revenue > $100K CA → economic nexus
  3. checkNexus — revenue < threshold → hasNexus: false
  4. checkNexus — unknown state → non-US jurisdiction 처리
  5. POST /tax/nexus — 유효한 요청 → 200
  6. POST /tax/nexus — jurisdiction 누락 → 400
  7. POST /tax/nexus — 음수 revenue → 0 이상 검증
  8. GET /tax/nexus — 정상 조회 → 200 + nexusStatuses 배열
  9. POST /tax/nexus — DB upsert 에러 시 → 500 (mock)
  10. checkNexus — transactionCount >= 200 → economic nexus (CA/TX 등)

---

## ✅ Step 3: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/api/v1/tax/nexus/route.ts 2>&1 | head -20
```
→ 에러 0개

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/api/v1/tax/nexus/route.ts
```
→ 0개

### 검수 3: try-catch 확인
```bash
grep -n "try\|catch" app/api/v1/tax/nexus/route.ts
```
→ GET 핸들러에 try-catch 1개 + POST 핸들러에 try-catch 2개 (JSON parse + UPSERT) 존재 확인

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f054-nexus-tracking.test.ts --verbose 2>&1
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
=== F054 Nexus 추적 — 검수 결과 ===

[수정 전 문제]
1. HIGH: GET 핸들러 DB 쿼리에 try-catch 없음
2. HIGH: POST 핸들러 UPSERT에 try-catch 없음
3. MEDIUM: 음수 revenue/transactionCount 검증 없음
4. MEDIUM: 전용 테스트 3개뿐 (API 통합 테스트 없음)

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
