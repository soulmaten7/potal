# F033 IOSS/OSS Compliance — 프로덕션 강화

> ⚠️ 이 기능(F033)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **구현됨 (CRITICAL 3개 + MISSING 2개)**

## 현재 파일
- `app/api/v1/ioss/route.ts` — IOSS 계산 엔드포인트
- `app/api/v1/ioss/check/route.ts` — IOSS 적격성 체크
- `app/lib/cost-engine/ioss-oss.ts` — IOSS/OSS 계산 로직
- `app/api/v1/verify/route.ts` — 사전검증 (IOSS 통합)

## CRITICAL 버그 3개

### C1: 환율 하드코딩 (ioss/check/route.ts:27-30 & verify/route.ts:207)
**현재 코드 (ioss/check):**
```typescript
let valueEur = declaredValue;
if (currency === 'USD') valueEur = declaredValue * 0.92;
else if (currency === 'GBP') valueEur = declaredValue * 1.17;
```
**현재 코드 (verify):**
```typescript
const declaredValueEur = price * 0.92;
```
**문제**: 환율이 하드코딩됨. 실제 환율 변동에 따라 €150 기준 오판단 발생.
**수정**: 기존 환율 API 사용
```typescript
import { getExchangeRate } from '@/lib/cost-engine/exchange-rate';

const rate = await getExchangeRate(currency, 'EUR');
const valueEur = declaredValue * rate;
```
**⚠️ 두 파일 모두 수정 필요** (ioss/check + verify)

### C2: IOSS 번호 유효성 검증 없음 (ioss-oss.ts:103)
**현재 코드:**
```typescript
sellerRegistered: !!iossNumber,  // 문자열이면 무조건 true
```
**문제**: 아무 문자열이나 IOSS 번호로 통과 → 가짜 번호로 관세 면제 판단
**수정**:
```typescript
// IOSS 번호 형식 검증: IM + 2자리 국가코드 + 10자리 숫자
function validateIossNumber(iossNumber: string): boolean {
  const IOSS_REGEX = /^IM[A-Z]{2}\d{10}$/;
  return IOSS_REGEX.test(iossNumber);
}

// 사용:
const isValid = iossNumber ? validateIossNumber(iossNumber) : false;
return {
  sellerRegistered: isValid,
  iossNumberValid: isValid,
  ...(iossNumber && !isValid ? { warning: 'Invalid IOSS number format. Expected: IM + country code + 10 digits (e.g., IMDE1234567890)' } : {})
};
```

### C3: VAT 금액 계산 100배 오류 (ioss/check/route.ts:43)
**현재 코드:**
```typescript
const vatAmount = Math.round(declaredValue * vatRate) / 100;
// $100 × 0.20 = 20 → Math.round(20) / 100 = 0.20 ← 100배 작음!
```
**수정**:
```typescript
const vatAmount = Math.round(declaredValue * vatRate * 100) / 100;
// $100 × 0.20 = 20.00 → Math.round(2000) / 100 = 20.00 ✅
```

## MISSING 기능 2개

### M1: OSS 임계값 기본값 문제 (ioss-oss.ts:221-224)
**현재 코드:**
```typescript
const thresholdExceeded = annualCrossBorderSalesEur !== undefined
  ? annualCrossBorderSalesEur > OSS_THRESHOLD_EUR
  : true; // Default: assume exceeded
```
**문제**: 소규모 셀러가 annualCrossBorderSalesEur를 안 보내면 항상 OSS 의무 발생으로 판단
**수정**:
```typescript
const thresholdExceeded = annualCrossBorderSalesEur !== undefined
  ? annualCrossBorderSalesEur > OSS_THRESHOLD_EUR
  : undefined; // 모름 → 응답에 warning 추가

// 응답에:
if (thresholdExceeded === undefined) {
  warnings.push('Annual cross-border sales not provided. Provide annualCrossBorderSalesEur for accurate OSS determination. OSS applies if >€10,000/year.');
}
```

### M2: 2026년 7월 EU 규정 변경 미반영
**현재**: €150 이하 면세 기준만 적용
**수정**: 2026-07-01 이후 규정 추가
```typescript
const EU_CHANGES_DATE = new Date('2026-07-01');
const isPostJuly2026 = new Date() >= EU_CHANGES_DATE;

if (isPostJuly2026) {
  // €150 면세 폐지 → 모든 수입에 €3 flat-rate 관세 적용
  result.flatRateDuty = 3.00; // EUR
  result.dutyWaived = false;  // 더 이상 면세 아님
  result.note = 'EU eliminated €150 duty exemption as of July 1, 2026. €3 flat-rate customs duty applies to all low-value consignments.';
}
```

## 수정할 파일 목록
1. `app/api/v1/ioss/check/route.ts` — C1(환율), C3(VAT 계산)
2. `app/lib/cost-engine/ioss-oss.ts` — C2(IOSS 검증), M1(OSS 기본값), M2(2026 규정)
3. `app/api/v1/verify/route.ts` — C1(환율 하드코딩)

## 테스트 (10개)
```
1. IOSS 적격성: €140 상품 (IOSS 가능) → iossApplicable: true
2. IOSS 적격성: €160 상품 (IOSS 불가) → iossApplicable: false
3. 환율: USD $162 → EUR 환산 후 €150 기준 정확 판단
4. VAT 계산: €100 × 20% = €20.00 (0.20이 아님)
5. IOSS 번호 검증: "IMDE1234567890" → valid
6. IOSS 번호 검증: "abc123" → invalid + warning
7. IOSS 번호 검증: null → sellerRegistered: false
8. OSS 임계값: annualSales=€5000 → thresholdExceeded: false
9. OSS 임계값: annualSales 미제공 → warning 메시지 포함
10. EU 2026 규정: 7월 1일 이후 → flatRateDuty: 3.00 포함
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 10개 PASS
3. 하드코딩 환율 0건 확인: grep -r "0.92" --include="*.ts" (이 파일들에서)
4. VAT 계산 정확성 검증 (수동 계산 대조)
5. 기존 /calculate 엔드포인트 IOSS 로직 영향 없음
```

## 결과
```
=== F033 IOSS/OSS Compliance — 강화 완료 ===
- 수정 파일: 3개
- CRITICAL 수정: 3개
- MISSING 추가: 2개
- 테스트: 10개
- 빌드: PASS/FAIL
```
