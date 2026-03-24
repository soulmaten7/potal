# F013 불량 상품 설명 감지 (Bad Description Detection) — 단독 검수

## ⚠️ 절대 규칙
1. **F013만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 체크리스트를 반드시 수행한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F013 파일 목록 (3개 파일)
1. `app/api/v1/classify/validate-description/route.ts` (43줄) — standalone API endpoint
2. `app/lib/cost-engine/ai-classifier/description-validator.ts` (189줄) — 핵심 로직
3. `app/lib/cost-engine/gri-classifier/field-validator.ts` (465줄) — Layer 2 필드 검증 (description 부분)

---

## 📊 사전 분석 결과

코드를 분석한 결과, F013은 **다른 기능보다 상태가 좋다.** 하지만 아래 항목을 반드시 직접 확인해야 한다.

---

## 🔍 Step 1: 전수 읽기 + 확인

위 3개 파일을 **전부** 읽고, 아래 체크리스트를 **직접 확인**한다:

### 체크리스트 (각 항목 O/X로 판정):
1. [ ] `validate-description/route.ts`에 try-catch 2중 래핑 있는가? (JSON parse + validation logic)
2. [ ] 빈 문자열 입력 시 400 에러 반환하는가?
3. [ ] 5000자 초과 입력 시 400 에러 반환하는가?
4. [ ] `description-validator.ts`에 any 타입 0개인가?
5. [ ] qualityScore 계산이 0~100 범위 내인가? (음수 나올 수 있는지 확인)
6. [ ] `validateProductDescription`이 `/api/v1/classify/route.ts` 메인 분류 파이프라인에서도 호출되는가?
7. [ ] `description-validator.ts`의 vague terms 목록에 실제 통관에서 문제되는 단어가 포함되어 있는가?
8. [ ] 테스트가 3개 이상 존재하는가?
9. [ ] withApiAuth 래핑 되어 있는가? (인증 필수)

---

## 🔧 Step 2: 발견된 문제 수정

### 확인 후 수정이 필요한 가능성 있는 항목:

1. **qualityScore 음수 방지**: score 계산에서 에러가 많으면 0 이하로 갈 수 있음
   - `Math.max(0, Math.min(100, score))` 클램핑이 있는지 확인
   - 없으면 추가

2. **숫자만 입력 (예: "12345")**: 현재 테스트에 있지만 validator에서 실제로 잡는지 확인
   - `description-validator.ts`에 `/^\d+$/` 체크가 있는지 확인
   - 없으면 issue type `'numeric_only'` 추가

3. **특수문자만 입력 (예: "!!@@##")**: 검증하는지 확인
   - 없으면 "alphabetic characters < 3" 체크 추가

4. **XSS/injection 방지**: description에 `<script>` 같은 태그가 들어올 경우
   - 응답에서 description을 그대로 반환하는데, sanitize 하는지 확인
   - 없으면 HTML 태그 strip 추가

5. **테스트 보강**: 현재 3개 → 최소 8개로
   - `__tests__/f013-description-validator.test.ts` 생성:
     1. 빈 문자열 → is_valid: false
     2. 2글자 → is_valid: false (too_short)
     3. "gift" → vague 감지
     4. "no commercial value" → prohibited 감지
     5. "12345" → 숫자만 감지
     6. "Cotton T-Shirt, short sleeve" → is_valid: true, score 높음
     7. 5001자 입력 → API 400 에러
     8. HTML 태그 포함 → sanitized

---

## ✅ Step 3: 5단계 검수

### 검수 1: TypeScript 컴파일
```bash
npx tsc --noEmit app/api/v1/classify/validate-description/route.ts 2>&1 | head -20
npx tsc --noEmit app/lib/cost-engine/ai-classifier/description-validator.ts 2>&1 | head -20
```
→ 에러 0개

### 검수 2: any 타입 검사
```bash
grep -n ": any" app/api/v1/classify/validate-description/route.ts
grep -n ": any" app/lib/cost-engine/ai-classifier/description-validator.ts
```
→ 0개

### 검수 3: 에러 핸들링 검사
```bash
grep -n "try\|catch\|throw" app/api/v1/classify/validate-description/route.ts
grep -n "try\|catch\|throw" app/lib/cost-engine/ai-classifier/description-validator.ts
```
→ route.ts에 try-catch 2개 이상

### 검수 4: 테스트 실행
```bash
npx jest __tests__/f013-description-validator.test.ts --verbose 2>&1
```
→ 8개 테스트 ALL PASS

### 검수 5: 빌드
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공

---

## 📊 Step 4: 결과 보고

```
=== F013 불량 상품 설명 감지 — 검수 결과 ===

[체크리스트 결과]
1. try-catch 2중: O/X
2. 빈 문자열 400: O/X
3. 5000자 400: O/X
4. any 타입 0개: O/X
5. qualityScore 범위: O/X
6. 메인 파이프라인 연동: O/X
7. vague terms 적절: O/X
8. 테스트 3개+: O/X
9. withApiAuth: O/X

[수정 내용]
- 파일명: 변경 내용

[5단계 검수]
1. TypeScript: ✅/❌
2. any 타입: ✅/❌
3. 에러 핸들링: ✅/❌
4. 테스트: ✅/❌ (N/8 PASS)
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
