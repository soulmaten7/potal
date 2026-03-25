# F063/F064/F065 Return Labels + Insurance + Address Verification — 프로덕션 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/shipping/labels/route.ts` — (F063 반품 라벨 포함)
- `app/api/v1/shipping/address-validation/route.ts` — (F065)
- 배송 관련 route 파일들

---

## F063 Return Label Management — CRITICAL 2개

### C1: 반품 사유 추적 없음
반품 라벨만 생성. 사유(불량/사이즈/변심) 미수집 → 분석 불가.
**수정**: returnReason 필수 파라미터
```typescript
const RETURN_REASONS = ['defective', 'wrong_item', 'size_exchange', 'changed_mind', 'damaged', 'other'];
if (!RETURN_REASONS.includes(returnReason)) {
  return apiError(ApiErrorCode.BAD_REQUEST, `Invalid return reason. Valid: ${RETURN_REASONS.join(', ')}`);
}
```

### C2: 국제 반품 시 통관 처리 없음
해외 반품 시 원산지국 수입 관세 처리/면세 신청 안내 없음.
**수정**: 국제 반품 통관 안내
```typescript
if (international) {
  response.returnCustoms = {
    dutyRefundEligible: true,
    process: 'File duty drawback claim with customs authority',
    requiredDocs: ['Original import declaration', 'Proof of return shipment', 'Commercial invoice'],
    timeLimit: '3 years from original import (US)', // 국가별 상이
  };
}
```

---

## F064 Shipping Insurance — CRITICAL 2개

### C1: 보험료 계산이 고정 비율
모든 품목 동일 비율(1.5%). 고가/취약 품목은 더 높아야 함.
**수정**: 품목 카테고리별 보험료율
```typescript
const INSURANCE_RATES: Record<string, number> = {
  electronics: 2.5, fragile: 3.0, jewelry: 4.0,
  documents: 0.5, clothing: 1.0, DEFAULT: 1.5
};
const rate = INSURANCE_RATES[category] || INSURANCE_RATES.DEFAULT;
const premium = declaredValue * (rate / 100);
```

### C2: 클레임 프로세스 없음
보험 가입만 가능. 분실/파손 시 클레임 절차 안내 없음.
**수정**: 클레임 가이드 + 상태 추적
```typescript
response.claimProcess = {
  steps: ['Report damage within 21 days', 'Submit photos + documentation', 'Carrier investigation (5-10 days)', 'Settlement'],
  requiredEvidence: ['Photos of damage', 'Original packaging photo', 'Shipping label', 'Invoice/receipt'],
  contactUrl: carrier === 'dhl' ? 'https://www.dhl.com/claims' : '...'
};
```

---

## F065 Address Verification — CRITICAL 3개

### C1: 주소 검증이 형식 체크만
필드 존재 여부만 확인. 실제 주소 유효성(존재하는 주소인지) 미검증.
**수정**: 기본 규칙 기반 검증 강화
```typescript
// ZIP-State 매칭 (US)
const ZIP_STATE_RANGES: Record<string, [number, number][]> = {
  CA: [[90000, 96199]], NY: [[10000, 14999]], TX: [[73300, 73399], [75000, 79999], [88500, 88599]],
  // ... 50개 주
};
if (country === 'US' && zipCode && state) {
  const zip = parseInt(zipCode);
  const ranges = ZIP_STATE_RANGES[state];
  if (ranges && !ranges.some(([min, max]) => zip >= min && zip <= max)) {
    response.warnings.push({ field: 'zip', message: `ZIP ${zipCode} does not match state ${state}` });
  }
}
```

### C2: 국제 주소 포맷 미검증
각국 주소 포맷 다름. 일본: 〒, 한국: 5자리 우편번호, 영국: 포스트코드.
**수정**: 국가별 우편번호 형식 검증
```typescript
const POSTAL_FORMATS: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/, CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
  UK: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, JP: /^\d{3}-?\d{4}$/,
  KR: /^\d{5}$/, DE: /^\d{5}$/, AU: /^\d{4}$/,
};
```

### C3: 추천 주소(suggestion) 없음
잘못된 주소 입력 시 대안 제안 없음.
**수정**: 기본 수정 제안
```typescript
// 흔한 약어 정규화
const ADDRESS_CORRECTIONS: Record<string, string> = {
  'st': 'Street', 'ave': 'Avenue', 'blvd': 'Boulevard', 'rd': 'Road',
  'dr': 'Drive', 'ln': 'Lane', 'ct': 'Court', 'apt': 'Apartment',
};
response.suggestions = normalizeAddress(address, ADDRESS_CORRECTIONS);
```

## 테스트 10개 (3개 기능 통합)
```
1. F063: 반품 라벨 + returnReason → 기록됨
2. F063: 국제 반품 → dutyRefundEligible 안내
3. F064: 전자제품 보험료 → 2.5% 적용
4. F064: 보험 클레임 가이드 → steps 포함
5. F065: US ZIP-State 불일치 → warning
6. F065: UK 포스트코드 형식 오류 → validation error
7. F065: JP 우편번호 → 형식 검증 pass
8. F065: 약어 정규화 → "st" → "Street"
9. F063: returnReason 누락 → 400
10. F064: declaredValue 0 → 보험료 0 + warning
```
