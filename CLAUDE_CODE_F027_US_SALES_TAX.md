# F027 US Sales Tax — 프로덕션 강화

> ⚠️ 이 기능(F027)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/us-sales-tax/route.ts` — US Sales Tax 계산 API
- `app/lib/tax/us-sales-tax.ts` — 세율 조회 로직

## 현재 상태: 70% (ZIP→세율 매핑 불완전, 세율 하드코딩)

## CRITICAL 6개

### C1: ZIP 코드 → 세율 매핑 불완전 (us-sales-tax.ts)
주(state) 레벨만. County/City/Special district 누락. 예: CA 7.25% 기본이지만 LA는 10.25%.
**수정**: ZIP→종합세율 테이블 또는 외부 API 폴백
```typescript
// ZIP 기반 종합세율 조회
async function getUsSalesTaxRate(zip: string, state: string): Promise<TaxBreakdown> {
  // 1. DB에서 ZIP 레벨 조회
  const { data: zipRate } = await supabase.from('us_sales_tax_rates')
    .select('state_rate, county_rate, city_rate, special_rate, combined_rate')
    .eq('zip_code', zip).single();
  if (zipRate) return zipRate;

  // 2. 폴백: 주 기본 세율
  const stateRate = US_STATE_RATES[state];
  return {
    state_rate: stateRate || 0,
    county_rate: 0, city_rate: 0, special_rate: 0,
    combined_rate: stateRate || 0,
    precision: 'state_level_only',
    warning: 'County/city rates not included. Actual rate may be higher.'
  };
}
```

### C2: Nexus 판정 없음
셀러가 어느 주에 nexus(과세 의무)가 있는지 확인 안 함. Nexus 없으면 세금 부과 불가.
**수정**: sellerId 기반 nexus 확인
```typescript
if (sellerId) {
  const { data: nexusStates } = await supabase.from('seller_nexus')
    .select('state_code').eq('seller_id', sellerId);
  const hasNexus = nexusStates?.some(n => n.state_code === destinationState);
  if (!hasNexus) {
    return { taxAmount: 0, reason: 'No nexus in destination state', nexusRequired: true };
  }
}
```

### C3: 면세 상품 카테고리 미처리
식료품, 의류, 의약품 등은 주별로 면세/감면. 현재 모든 상품에 동일 세율 적용.
**수정**: 상품 카테고리별 면세 규칙
```typescript
const EXEMPT_CATEGORIES: Record<string, string[]> = {
  groceries: ['PA','NJ','NY','TX','FL','OH','IL'], // 식료품 면세 주
  clothing: ['PA','NJ','NY','MN'], // 의류 면세 주
  medicine: ['ALL'], // 처방약 전주 면세
};
if (EXEMPT_CATEGORIES[productCategory]?.includes(state) ||
    EXEMPT_CATEGORIES[productCategory]?.includes('ALL')) {
  return { taxAmount: 0, reason: `${productCategory} exempt in ${state}` };
}
```

### C4: Origin-based vs Destination-based 미구분
대부분 주는 destination-based(수령지 기준). 하지만 AZ, CA, IL 등은 origin-based(발송지 기준).
**수정**: 주별 sourcing rule 적용
```typescript
const ORIGIN_BASED_STATES = ['AZ','CA','IL','MI','MO','NM','OH','PA','TN','TX','UT','VA'];
const taxState = ORIGIN_BASED_STATES.includes(sellerState) ? sellerState : destinationState;
const taxZip = ORIGIN_BASED_STATES.includes(sellerState) ? sellerZip : destinationZip;
```

### C5: 마켓플레이스 촉진자 규칙 없음
Amazon/eBay 등은 Marketplace Facilitator로서 자체 징수. 셀러가 중복 부과하면 안 됨.
**수정**: marketplace 파라미터 추가
```typescript
if (marketplace && MARKETPLACE_FACILITATOR_STATES.includes(state)) {
  return {
    taxAmount: 0,
    reason: `${marketplace} collects sales tax as marketplace facilitator in ${state}`,
    collectedBy: marketplace
  };
}
```

### C6: Economic Nexus 임계값 미체크
대부분 주: 연 매출 $100K 또는 200건 거래 → 자동 nexus. 현재 셀러 매출 추적 없음.
**수정**: 임계값 경고
```typescript
const ECONOMIC_NEXUS_THRESHOLD = { revenue: 100000, transactions: 200 }; // 대부분 주 기준
// seller_transactions에서 주별 매출 집계
// 임계값 근접 시 warning 반환
response.economicNexusWarning = `Seller approaching economic nexus threshold in ${state}. ${revenue}/${ECONOMIC_NEXUS_THRESHOLD.revenue} revenue.`;
```

## MISSING 2개
M1: 세율 자동 업데이트 — 주/카운티 세율은 1/4분기마다 변경 가능
M2: SST (Streamlined Sales Tax) 통합 — 24개 회원주 간소화 세금 지원

## 수정 파일: 2개 (us-sales-tax.ts, us-sales-tax/route.ts) + migration
## 테스트 10개
```
1. CA ZIP 90001 → combined_rate 10.25% (state+county+city)
2. OR (면세 주) → taxAmount: 0
3. 식료품 + TX → taxAmount: 0 (면세)
4. Nexus 없는 주 → taxAmount: 0 + nexusRequired
5. Origin-based AZ → 셀러 주소 기준 세율
6. Destination-based NY → 수령지 기준 세율
7. Amazon marketplace + WA → collectedBy: Amazon
8. ZIP 레벨 세율 없음 → state_level_only + warning
9. Economic nexus 임계값 근접 → warning
10. 잘못된 ZIP → 400 에러
```

## 결과
```
=== F027 US Sales Tax — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 6개 | 테스트: 10개 | 빌드: PASS/FAIL
```
