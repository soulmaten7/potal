# F050 Type 86 Declaration — 프로덕션 강화

> ⚠️ 이 기능(F050)만 작업합니다.

## 현재 파일
- `app/api/v1/type86/prepare/route.ts` — ACE 파일링 생성
- `app/api/v1/compliance/type86/route.ts` — Section 321 적격성 체크

## CRITICAL 7개 (가장 많음 — 두 엔드포인트 충돌)

### C1: 두 엔드포인트 로직 충돌 (MAJOR)
/type86/prepare: CN 원산지 → eligible=false (SECTION321_BLOCKED_ORIGINS)
/compliance/type86: CN 원산지 → eligible=true + WARNING만
**$500 중국 제품**: 하나는 거부, 다른 하나는 승인.
**수정**: 하나로 통합. 현행법 기준 CN은 Section 321 불가.
```typescript
// /compliance/type86 수정:
const BLOCKED_ORIGINS = ['CN', 'HK', 'RU', 'BY']; // 중국+홍콩+러시아+벨라루스
if (BLOCKED_ORIGINS.includes(origin)) {
  return { eligible: false, reason: `Section 321/Type 86 not available for goods originating from ${origin}. Formal entry required.` };
}
// /type86/prepare는 /compliance/type86의 결과를 호출해서 사용
```

### C2: Section 321 임계값 불일치
prepare: TYPE86_THRESHOLD = 800 (상수)
compliance: DE_MINIMIS_THRESHOLD_USD = 800 (다른 이름)
**수정**: 공통 상수 사용
```typescript
// app/lib/constants.ts에:
export const SECTION_321_THRESHOLD_USD = 800;
```

### C3: CN 차단이 HS 코드별로 세분화 안 됨 (prepare:32-39)
모든 CN 상품 차단. 하지만 AD/CVD 없는 일부 HS 코드는 Section 321 가능.
**수정**: trade_remedy_products 테이블 조회
```typescript
const { data: adCases } = await supabase.from('trade_remedy_products')
  .select('id').eq('country_code', origin).like('hs_code', `${hsCode.substring(0,4)}%`).limit(1);
if (adCases?.length > 0) {
  return { eligible: false, reason: `HS ${hsCode} from ${origin} subject to AD/CVD. Formal entry required.` };
}
// AD/CVD 없는 CN 상품은 value ≤ $800이면 Type 86 가능할 수 있음
```

### C4: consignee 주소 미필수 (compliance:164)
CBP는 Type 86에 완전한 주소 필요 (19 CFR 143.1). 현재 name만 필수.
**수정**: 주소 필수 + 검증
```typescript
if (!consignee.address || consignee.address.length < 10) {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Complete consignee address required for Type 86 filing (min 10 characters)');
}
if (!consignee.city || !consignee.state || !consignee.zip) {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Consignee city, state, and zip code required');
}
```

### C5: 관세/수수료 금액이 0으로 고정 (prepare:71-73)
```json
"duty_amount": 0, "tax_amount": 0, "mpf_amount": 0
```
과세 대상 상품도 0으로 표시. CBP가 거부하거나 추후 청구.
**수정**: 실제 관세 계산 호출
```typescript
const dutyResult = await lookupDutyRate(hsCode, origin, 'US');
const dutyAmount = declaredValue * (dutyResult.rate / 100);
const mpfAmount = Math.max(Math.min(declaredValue * 0.003464, 575.35), 31.67); // MPF 범위
```

### C6: 동일 consignee 일일 누적 미체크 (compliance:125-129)
CBP: Section 321은 1인당 하루 1건. 같은 사람 이름으로 2건 → 합산 $800 초과 시 거부.
**수정**: 당일 이전 파일링 조회
```typescript
// verification_logs에서 오늘 같은 consignee 조회
const today = new Date().toISOString().split('T')[0];
const { count } = await supabase.from('verification_logs')
  .select('*', { count: 'exact', head: true })
  .eq('consignee_name', consignee.name)
  .gte('created_at', today + 'T00:00:00Z');
if (count && count > 0) {
  return { eligible: false, warning: 'Section 321 limited to one shipment per person per day. Previous filing detected today.' };
}
```

### C7: EXCLUDED_CATEGORIES 부정확 (compliance:32-39)
챕터 전체 차단 (Ch.04 전부). 실제로는 특정 HS6만 AD/CVD 대상.
**수정**: C3과 동일 — trade_remedy_products에서 정확한 HS 코드 확인

## 수정 파일: 2개 + constants.ts
## 테스트 10개
```
1. US $500 상품 (CN 원산) → eligible: false
2. US $500 상품 (JP 원산) → eligible: true + ACE JSON
3. US $900 상품 (JP 원산) → eligible: false ($800 초과)
4. CN AD/CVD 없는 HS → 별도 로직 확인
5. consignee 주소 누락 → 400 에러
6. 관세 금액 > 0 (과세 품목) → duty_amount 정확
7. 같은 consignee 같은 날 2건 → 경고/차단
8. SECTION_321_THRESHOLD_USD 상수 공유 확인
9. /type86/prepare → /compliance/type86 호출하여 결과 일관
10. RU 원산 → eligible: false
```

## 결과
```
=== F050 Type 86 Declaration — 강화 완료 ===
- 수정 파일: 3개 | CRITICAL 7개 | 테스트: 10개 | 빌드: PASS/FAIL
```
