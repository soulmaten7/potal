# F060 Multi-Carrier Rate Comparison — 프로덕션 강화

> ⚠️ 이 기능(F060)만 작업합니다.

## 현재 파일
- `app/api/v1/shipping/rates/route.ts` — 배송 요금 비교 API

## CRITICAL 4개

### C1: 실시간 캐리어 API 연동 없음
하드코딩 요금 반환. 실제 DHL/FedEx/UPS/USPS API 호출 없음.
**수정**: 실제 API 불가 → 추정 요금 + disclaimer 명시
```typescript
response.disclaimer = 'Rates are estimates based on published rate tables. Contact carrier for exact quotes.';
response.rateSource = 'estimated'; // 'estimated' | 'live_api' | 'cached'
// 추후 캐리어 API 연동 시 'live_api'로 전환
```

### C2: 부피 무게(DIM weight) 미계산
실제 무게만 사용. 대형 경량 상품은 DIM weight가 더 높음.
**수정**: DIM weight 계산 추가
```typescript
function calculateDimWeight(length: number, width: number, height: number, unit: 'cm' | 'in'): number {
  const divisor = unit === 'cm' ? 5000 : 139; // 국제 표준
  return Math.ceil((length * width * height) / divisor);
}
const billableWeight = Math.max(actualWeight, dimWeight);
```

### C3: 통관 비용 미포함
배송료만 비교. 관세/VAT/통관수수료 포함한 총비용(DDP) 비교 없음.
**수정**: landed cost 통합
```typescript
if (includeCustoms) {
  const landedCost = await calculateLandedCost({ hsCode, originCountry, destinationCountry, declaredValue });
  rate.totalDdpCost = rate.shippingCost + landedCost.totalDuties + landedCost.totalTaxes + landedCost.totalFees;
}
```

### C4: 배송 제한 품목 체크 없음
리튬 배터리, 위험물 등 캐리어별 배송 제한 미체크.
**수정**: restricted items 경고
```typescript
const restrictions = checkShippingRestrictions(hsCode, productCategory, carriers);
if (restrictions.length > 0) {
  response.warnings = restrictions.map(r => ({
    carrier: r.carrier, restriction: r.reason,
    alternative: r.alternativeService || 'Contact carrier for special handling'
  }));
}
```

## 테스트 8개
```
1. US→UK 1kg → 4+ 캐리어 요금 비교
2. DIM weight > actual weight → DIM 기준 과금
3. DDP 포함 → totalDdpCost 반환
4. 리튬 배터리 HS → 배송 제한 경고
5. 잘못된 국가 코드 → 400
6. 무게 0 → 400
7. rateSource: estimated 표시
8. 배송일 예상 → transitDays 포함
```
