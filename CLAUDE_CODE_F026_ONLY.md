# F026 Landed Cost 보증 — 단독 검수 및 수정 명령어

## ⚠️ 절대 규칙
1. **F026만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 현재 코드에 문제가 있으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.** 하나라도 실패하면 수정 후 재검수.
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 현재 F026 파일 목록
- `app/lib/cost-engine/landed-cost-guarantee.ts` (220줄)
- `app/api/v1/landed-cost-guarantee/route.ts` (77줄)
- `app/lib/cost-engine/GlobalCostEngine.ts` (guarantee 연동 부분)

---

## 🔍 Step 1: 현재 코드 전수 읽기 (수정 전)

아래 3개 파일을 **전체** 읽고, 각 파일에서 발견된 문제를 목록으로 정리한다:

1. `app/lib/cost-engine/landed-cost-guarantee.ts` — 전체 읽기
2. `app/api/v1/landed-cost-guarantee/route.ts` — 전체 읽기
3. `app/lib/cost-engine/GlobalCostEngine.ts` — guarantee 관련 부분만 읽기 (assessGuarantee 호출부)

**체크 항목 (각 파일마다):**
- [ ] any 타입 사용 여부 → 있으면 기록
- [ ] try-catch 누락 여부 → DB 쿼리, 외부 호출에 try-catch 없으면 기록
- [ ] 입력 검증 누락 → 필수 파라미터 검증 없으면 기록
- [ ] 하드코딩된 값 → 매직 넘버 기록
- [ ] TODO/FIXME/stub 주석 → 있으면 기록
- [ ] 타입 정의 불완전 → interface/type에 optional이 과도하면 기록

**읽고 발견한 문제 목록을 출력한다.** 수정은 아직 하지 않는다.

---

## 🔧 Step 2: 알려진 문제 5개 수정

### 문제 1: Tier 수치 불일치
`landed-cost-guarantee.ts`의 GUARANTEE_TIERS와 `route.ts`의 guaranteeByPlan 수치가 다르다.
- **해결**: 하나의 기준으로 통일한다.
  - Standard(Free/Basic): ±10% 커버리지, $500 max
  - Premium(Pro): ±5% 커버리지, $5,000 max
  - Enterprise: ±2% 커버리지, $50,000 max
- `route.ts`의 guaranteeByPlan을 삭제하고 `landed-cost-guarantee.ts`의 GUARANTEE_TIERS를 import해서 사용한다.

### 문제 2: Claim 저장소
현재 claim을 `health_check_logs` 테이블에 저장하고 있다. 이건 임시 방편이다.
- **해결**: 별도 `guarantee_claims` 테이블이 필요하지만, DB 마이그레이션은 이 명령어 범위 밖이다.
- **대신**: claim 데이터 구조를 명확하게 정의하고, 저장 함수에 TODO 주석 대신 실제 Supabase insert 로직을 작성한다. 테이블이 없으면 graceful하게 에러 핸들링한다.

### 문제 3: Claim 조회/업데이트 API 없음
submit만 있고 GET(조회), PATCH(상태 업데이트)가 없다.
- **해결**: `app/api/v1/landed-cost-guarantee/route.ts`에 GET 핸들러 추가
  - GET: claimId로 조회 또는 sellerId로 전체 목록 조회
  - 인증 필수 (withApiAuth)

### 문제 4: 입력 검증 강화
`route.ts` POST에서 필수 필드 검증이 부족하다.
- **해결**: 모든 필수 필드 검증 추가
  - originCountry: ISO2 형식 (2글자 알파벳)
  - destinationCountry: ISO2 형식
  - hsCode: 6자리 이상 숫자
  - declaredValue: 양수
  - calculatedDuty: 0 이상
  - calculatedTax: 0 이상
  - 잘못된 입력 시 400 에러 + 구체적 메시지

### 문제 5: 테스트 작성
현재 F026 전용 테스트가 0개이다.
- **해결**: `__tests__/f026-landed-cost-guarantee.test.ts` 생성
  - 테스트 최소 8개:
    1. assessGuarantee — free 플랜 → standard tier 반환
    2. assessGuarantee — pro 플랜 → premium tier 반환
    3. assessGuarantee — enterprise 플랜 → enterprise tier 반환
    4. assessGuarantee — 낮은 confidence score → eligible: false
    5. submitClaim — 유효한 claim → 성공
    6. submitClaim — coverage 초과 claim → 거절
    7. API POST — 유효한 요청 → 200 + guarantee 객체
    8. API POST — 필수 필드 누락 → 400 에러

---

## ✅ Step 3: 5단계 검수 (수정 완료 후)

수정이 끝나면 아래 5가지를 **각각** 실행하고 결과를 출력한다:

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/lib/cost-engine/landed-cost-guarantee.ts 2>&1 | head -20
npx tsc --noEmit app/api/v1/landed-cost-guarantee/route.ts 2>&1 | head -20
```
→ 에러 0개여야 통과

### 검수 2: any 타입 검사
```bash
grep -n "any" app/lib/cost-engine/landed-cost-guarantee.ts
grep -n "any" app/api/v1/landed-cost-guarantee/route.ts
```
→ 타입으로 사용된 `any`가 0개여야 통과 (문자열 "any"는 OK)

### 검수 3: 에러 핸들링 검사
```bash
grep -n "try\|catch\|throw" app/lib/cost-engine/landed-cost-guarantee.ts
grep -n "try\|catch\|throw" app/api/v1/landed-cost-guarantee/route.ts
```
→ 모든 DB 쿼리와 외부 호출에 try-catch 존재 확인

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f026-landed-cost-guarantee.test.ts --verbose 2>&1
```
→ 8개 테스트 ALL PASS여야 통과

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공이어야 통과

---

## 📊 Step 4: 결과 보고 (이 형식으로 출력)

```
=== F026 Landed Cost 보증 — 검수 결과 ===

[수정 전 문제]
1. ...
2. ...

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)
- ...

[5단계 검수]
1. TypeScript 컴파일: ✅/❌ (에러 N개)
2. any 타입: ✅/❌ (N개 발견)
3. 에러 핸들링: ✅/❌ (try-catch N개)
4. 테스트: ✅/❌ (N/8 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능(F015 등)으로 절대 넘어가지 않는다.
