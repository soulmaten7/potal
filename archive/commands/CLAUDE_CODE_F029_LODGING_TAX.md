# F029 Lodging/Hospitality Tax — 프로덕션 강화

> ⚠️ 이 기능(F029)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/special-taxes/route.ts` — 특수세금 API (Lodging 포함)
- `app/lib/tax/special-taxes.ts` — 특수세금 계산 로직

## 현재 상태: 55% (정률세/정액세 혼동, 지역별 세금 누락)

## CRITICAL 5개

### C1: 정률세(%)와 정액세($) 혼동 (special-taxes.ts)
NYC 호텔세: 5.875% + $3.50/night + $1.50 UNIT FEE. 현재 퍼센트만 적용.
**수정**: 세금 유형별 계산
```typescript
interface LodgingTax {
  type: 'percentage' | 'flat_per_night' | 'flat_per_stay' | 'combined';
  percentageRate?: number;
  flatAmount?: number;
  flatPer?: 'night' | 'stay' | 'room';
}

function calculateLodgingTax(
  nightlyRate: number, nights: number, rooms: number,
  taxes: LodgingTax[]
): number {
  return taxes.reduce((total, tax) => {
    switch (tax.type) {
      case 'percentage': return total + (nightlyRate * nights * rooms * (tax.percentageRate! / 100));
      case 'flat_per_night': return total + (tax.flatAmount! * nights * rooms);
      case 'flat_per_stay': return total + tax.flatAmount!;
      case 'combined':
        return total + (nightlyRate * nights * rooms * (tax.percentageRate! / 100))
          + (tax.flatAmount! * nights * rooms);
      default: return total;
    }
  }, 0);
}
```

### C2: 도시/카운티 레벨 세금 없음
대부분 도시에 추가 관광세/호텔세 존재. 예: LA 12% (state) + 1.5% (TMD) + 1% (Tourism).
**수정**: ZIP/City 레벨 세율 조회
```typescript
const LODGING_TAX_OVERRIDES: Record<string, LodgingTax[]> = {
  'NYC': [
    { type: 'percentage', percentageRate: 5.875, name: 'NYC Hotel Tax' },
    { type: 'flat_per_night', flatAmount: 3.50, name: 'NYC Unit Fee' },
    { type: 'flat_per_night', flatAmount: 1.50, name: 'Javits Center Fee' },
    // + NY state 4% + MCTD 0.375%
  ],
  'LA': [
    { type: 'percentage', percentageRate: 12, name: 'LA TOT' },
    { type: 'percentage', percentageRate: 1.5, name: 'TMD Assessment' },
    { type: 'percentage', percentageRate: 1, name: 'Tourism Marketing District' },
  ],
};
```

### C3: OTA(온라인여행사) 세금 처리 없음
Booking.com, Airbnb 등은 자체 세금 징수. 이중 과세 방지 필요.
**수정**: platform 파라미터 추가
```typescript
const PLATFORM_TAX_COLLECTORS = ['airbnb', 'booking.com', 'vrbo', 'expedia'];
if (platform && PLATFORM_TAX_COLLECTORS.includes(platform.toLowerCase())) {
  return {
    platformCollected: true,
    note: `${platform} collects and remits lodging taxes in most jurisdictions.`,
    exceptions: getPlatformExceptions(platform, state),
    action: 'Verify with platform whether taxes are collected for this specific jurisdiction.'
  };
}
```

### C4: 단기 vs 장기 체류 구분 없음
대부분 주: 30일+ 체류 = 장기 임대 = 숙박세 면제. 현재 체류 기간 무관하게 과세.
**수정**: nights 기반 면제 체크
```typescript
const LONG_STAY_EXEMPTION_DAYS: Record<string, number> = {
  DEFAULT: 30, NY: 90, FL: 183, TX: 30, CA: 30,
};
const exemptionDays = LONG_STAY_EXEMPTION_DAYS[state] || LONG_STAY_EXEMPTION_DAYS.DEFAULT;
if (nights >= exemptionDays) {
  return { taxAmount: 0, reason: `Stay of ${nights} nights exceeds ${exemptionDays}-day exemption threshold in ${state}` };
}
```

### C5: 국제 숙박세 미지원
일본: 숙박세 ¥100~200/night (도쿄), 이탈리아: €1~7/night (도시별), 프랑스: Tourist Tax.
**수정**: 국제 주요 도시 숙박세 추가
```typescript
const INTERNATIONAL_LODGING: Record<string, LodgingTax[]> = {
  'JP_TOKYO': [{ type: 'flat_per_night', flatAmount: 200, currency: 'JPY', name: 'Tokyo Accommodation Tax' }],
  'IT_ROME': [{ type: 'flat_per_night', flatAmount: 7, currency: 'EUR', name: 'City Tax' }],
  'FR_PARIS': [{ type: 'flat_per_night', flatAmount: 4.30, currency: 'EUR', name: 'Taxe de Séjour' }],
  'ES_BARCELONA': [{ type: 'flat_per_night', flatAmount: 4, currency: 'EUR', name: 'Tourist Tax' }],
};
```

## 수정 파일: 2개 (special-taxes.ts, special-taxes/route.ts)
## 테스트 8개
```
1. NYC 호텔 $200 × 3 nights → percentage + flat fees 합산
2. LA 호텔 → TOT + TMD + Tourism 합산
3. 30일+ 체류 → 면제
4. Airbnb platform → platformCollected + exceptions
5. 도쿄 숙박 ¥15,000 → ¥200/night 숙박세
6. 파리 호텔 → €4.30/night Tourist Tax
7. 주 레벨만 있는 지역 → state_level_only warning
8. nights/rooms 파라미터 누락 → 400 에러
```

## 결과
```
=== F029 Lodging Tax — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 5개 | 테스트: 8개 | 빌드: PASS/FAIL
```
