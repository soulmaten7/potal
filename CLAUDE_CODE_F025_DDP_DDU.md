# F025 DDP/DDU Pricing Mode — 신규 구현

> ⚠️ 이 기능(F025)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **미구현** — DDP/DDU 모드 전환 로직 없음

## 배경
DDP (Delivered Duty Paid) = 판매자가 관세 선납, 고객은 최종가만 지불
DDU/DAP (Delivered Duty Unpaid) = 고객이 배송 시 관세 별도 납부
이커머스에서 DDP 전환 시 cart abandonment 20-30% 감소 (업계 데이터)

## 구현할 파일

### 1. `app/lib/cost-engine/pricing-mode.ts` (신규 생성)
```typescript
export type PricingMode = 'DDP' | 'DDU' | 'DAP';

export interface PricingModeResult {
  mode: PricingMode;
  productPrice: number;
  shippingCost: number;
  dutiesAndTaxes: number;
  totalLandedCost: number;
  customerPays: number;        // DDP: totalLandedCost, DDU: productPrice + shipping
  dutyCollectedAtCheckout: boolean;
  estimatedCustomsCharge: number; // DDU: what customer will pay at door
  currency: string;
  breakdown: {
    importDuty: number;
    vat: number;
    customsFees: number;
    otherTaxes: number;
  };
}

export function calculatePricingMode(
  mode: PricingMode,
  productPrice: number,
  shippingCost: number,
  landedCostResult: LandedCostResult, // from existing GlobalCostEngine
  currency: string
): PricingModeResult {
  // DDP: customerPays = product + shipping + ALL duties/taxes
  // DDU: customerPays = product + shipping (duties shown as estimate)
  // DAP: same as DDU but with different Incoterm label
}
```

### 2. `app/api/v1/calculate/ddp-vs-ddu/route.ts` (수정)
현재 이 엔드포인트가 존재하지만 pricing mode 전환 로직이 없음.
추가할 내용:
- `mode` 파라미터 (DDP | DDU | DAP | compare) 지원
- `compare` 모드: DDP와 DDU 결과를 나란히 비교
- checkout display 가이드 (어떤 값을 어디에 보여줄지)

### 3. `app/api/v1/checkout/route.ts` (수정)
- `pricingMode` 필드 추가
- DDP일 때: `dutyCollectedAtCheckout: true`, 최종 금액에 관세 포함
- DDU일 때: `dutyCollectedAtCheckout: false`, 예상 관세 별도 표시
- 응답에 `customerFacingPrice` 필드 추가

### 4. `components/widget/PotalWidget.tsx` 또는 `potal-widget.js` (수정)
- 위젯에 DDP/DDU 토글 옵션 추가
- DDP: "All duties & taxes included ✓" 배지 표시
- DDU: "Estimated customs charge: $XX at delivery" 경고 표시

## 테스트 (8개)
```
1. DDP 모드: $100 상품 + $20 shipping + $15 duty + $23 VAT → customerPays=$158
2. DDU 모드: 같은 상품 → customerPays=$120, estimatedCustomsCharge=$38
3. compare 모드: DDP/DDU 둘 다 반환
4. DAP 모드: DDU와 동일 결과, incoterm='DAP'
5. 관세 0%일 때 (FTA 적용): DDP/DDU 결과 동일해야 함
6. de minimis 이하: duty=0이면 DDP/DDU 차이 없음
7. 다중 통화: EUR 상품 → USD 고객 → 환율 적용 확인
8. 위젯 렌더링: mode 파라미터에 따라 올바른 UI 표시
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공 확인
2. 테스트 8개 전부 PASS
3. /api/v1/calculate/ddp-vs-ddu?mode=compare 호출 → DDP/DDU 결과 비교 반환
4. /api/v1/checkout에 pricingMode 필드 추가 확인
5. 기존 /api/v1/calculate 엔드포인트 영향 없음 확인
```

## 결과
```
=== F025 DDP/DDU Pricing Mode — 구현 완료 ===
- 신규 파일: 1개
- 수정 파일: 3개
- 테스트: 8개
- 빌드: PASS/FAIL
```
