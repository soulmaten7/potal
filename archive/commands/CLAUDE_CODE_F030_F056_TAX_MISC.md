# F030/F056 Property Tax Lookup + Business License — 프로덕션 강화

> ⚠️ 이 2개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/tax/property/route.ts` — F030
- `app/api/v1/tax/business-license/route.ts` — F056

---

## F030 Property Tax Lookup — CRITICAL 2개

### C1: 세율 데이터가 주(state) 레벨만
카운티/시 레벨 세율 없음. 미국 재산세는 지역마다 2~10배 차이.
**수정**: 데이터 한계 명시 + 참조 URL
```typescript
response.precision = 'state_average';
response.warning = 'Property tax rates vary significantly by county/municipality. State average shown.';
response.lookupUrl = state === 'CA' ? 'https://www.boe.ca.gov/proptaxes/assessors.htm' :
  `https://www.${state.toLowerCase()}.gov/property-tax`; // 주별 공식 조회 URL
```

### C2: 상업용 vs 주거용 구분 없음
상업용 부동산은 세율/감면이 다름.
**수정**: propertyType 파라미터
```typescript
const PROPERTY_MULTIPLIERS: Record<string, Record<string, number>> = {
  CA: { residential: 1.0, commercial: 1.25, industrial: 1.35 },
  NY: { residential: 1.0, commercial: 4.5, industrial: 4.0 }, // NYC assessment ratio
};
const multiplier = PROPERTY_MULTIPLIERS[state]?.[propertyType] || 1.0;
```

---

## F056 Business License Management — CRITICAL 2개

### C1: 면허 요건 데이터 불완전
일부 주/산업만. 대부분 "contact local authority" 반환.
**수정**: 최소한 주요 50주 기본 면허 정보 + 참조 링크
```typescript
const STATE_LICENSE_INFO: Record<string, LicenseInfo> = {
  CA: {
    generalBusiness: { required: true, name: 'Business Tax Certificate', authority: 'City/County', fee: '$50-$500/year' },
    sellerPermit: { required: true, name: 'Seller\'s Permit', authority: 'CDTFA', fee: 'Free', url: 'https://www.cdtfa.ca.gov' },
    importLicense: { required: false, note: 'No state import license. Federal CBP import bond may be needed.' }
  },
  // ... 50개 주
};
response.disclaimer = 'License requirements vary by business type, size, and location. Verify with local authority.';
```

### C2: 면허 갱신 알림 없음
면허 만료일 추적/알림 없음.
**수정**: 만료 추적
```typescript
if (sellerId) {
  const { data: licenses } = await supabase.from('seller_licenses')
    .select('*').eq('seller_id', sellerId);
  const expiring = licenses?.filter(l => {
    const daysLeft = (new Date(l.expires_at).getTime() - Date.now()) / (1000*60*60*24);
    return daysLeft > 0 && daysLeft <= 30;
  });
  if (expiring?.length > 0) {
    response.expiringLicenses = expiring.map(l => ({
      name: l.license_name, expiresAt: l.expires_at,
      daysLeft: Math.ceil((new Date(l.expires_at).getTime() - Date.now()) / (1000*60*60*24))
    }));
  }
}
```

## 테스트 6개
```
1. F030: CA 재산세 → state_average + warning
2. F030: 상업용 → 더 높은 세율
3. F030: 참조 URL → 주별 공식 URL
4. F056: CA 면허 → Seller's Permit 필수
5. F056: 면허 만료 30일 이내 → expiringLicenses
6. F056: disclaimer 항상 포함
```
