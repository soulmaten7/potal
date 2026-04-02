# F028 Telecom/Digital Tax — 프로덕션 강화

> ⚠️ 이 기능(F028)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/special-taxes/route.ts` — 특수세금 API (Telecom 포함)
- `app/lib/tax/special-taxes.ts` — 특수세금 계산 로직

## 현재 상태: 60% (세율이 평균값, 정확한 카테고리 분류 없음)

## CRITICAL 5개

### C1: 디지털 서비스 세율이 평균값 (special-taxes.ts)
인도 IGST 18%, 터키 7.5%, 호주 GST 10% 등 하드코딩. 실제로는 서비스 유형별로 다름.
**수정**: 서비스 유형별 세율 분리
```typescript
const DIGITAL_TAX_RATES: Record<string, Record<string, number>> = {
  IN: { streaming: 18, software: 18, cloud: 18, advertising: 18 }, // IGST
  TR: { streaming: 7.5, software: 18, cloud: 18, advertising: 7.5 }, // 서비스별 차등
  AU: { streaming: 10, software: 10, cloud: 10, advertising: 10 }, // GST 통일
  KR: { streaming: 10, software: 10, cloud: 10, advertising: 10 }, // 부가세 통일
  EU: { streaming: 'country_vat', software: 'country_vat', cloud: 'country_vat' }, // 각국 VAT
};
```

### C2: Telecom 특수 부과금 누락
FCC USF(Universal Service Fund) 20.1%, E911 요금, TRS 등 미국 Telecom 부과금 = 실제 세율의 30%+.
**수정**: Telecom surcharge 추가
```typescript
const US_TELECOM_SURCHARGES = {
  federal_usf: 0.201, // FCC USF 비율 (분기별 변동)
  e911: { type: 'flat', amount: 1.50 }, // 주별 상이
  trs: 0.03, // Telecommunications Relay Service
  state_usf: 0.05, // 주별 상이
};
if (serviceType === 'telecom' && country === 'US') {
  const surcharges = calculateTelecomSurcharges(state, revenue);
  response.surcharges = surcharges;
  response.totalTax += surcharges.total;
}
```

### C3: DST(Digital Services Tax) 임계값 미체크
프랑스 DST 3%는 글로벌 매출 €750M+ & 프랑스 매출 €25M+ 기업만 해당.
**수정**: 임계값 체크 + 적용 대상 명시
```typescript
const DST_THRESHOLDS: Record<string, { globalRevenue: number, localRevenue: number, rate: number }> = {
  FR: { globalRevenue: 750_000_000, localRevenue: 25_000_000, rate: 3 },
  IT: { globalRevenue: 750_000_000, localRevenue: 5_500_000, rate: 3 },
  UK: { globalRevenue: 500_000_000, localRevenue: 25_000_000, rate: 2 },
  ES: { globalRevenue: 750_000_000, localRevenue: 3_000_000, rate: 3 },
  TR: { globalRevenue: 750_000_000, localRevenue: 20_000_000, rate: 7.5 },
};
if (dst && sellerGlobalRevenue < dst.globalRevenue) {
  return { dstApplicable: false, reason: `Global revenue below DST threshold (€${dst.globalRevenue / 1e6}M)` };
}
```

### C4: B2B vs B2C 구분 없음
EU 디지털 서비스: B2B는 역과세(reverse charge), B2C만 셀러 징수. 현재 모두 B2C로 처리.
**수정**: buyer_type 파라미터 추가
```typescript
if (buyerType === 'business' && buyerVatNumber) {
  // EU B2B: Reverse charge 적용
  if (EU_COUNTRIES.includes(buyerCountry) && buyerCountry !== sellerCountry) {
    return { taxAmount: 0, mechanism: 'reverse_charge', buyerResponsible: true,
      note: 'VAT reverse charge applies. Buyer self-assesses VAT.' };
  }
}
```

### C5: Withholding Tax(원천세) 누락
인도: 해외 디지털 서비스 결제 시 2% TCS. 한국: 해외 SW 로열티 15-20% 원천세.
**수정**: 원천세 정보 추가
```typescript
const WITHHOLDING_TAX: Record<string, { rate: number, applies_to: string[] }> = {
  IN: { rate: 2, applies_to: ['foreign_digital_services'] },
  KR: { rate: 20, applies_to: ['software_royalty'] },
  BR: { rate: 15, applies_to: ['software_license', 'technical_services'] },
};
if (crossBorder && WITHHOLDING_TAX[buyerCountry]) {
  response.withholdingTax = WITHHOLDING_TAX[buyerCountry];
}
```

## 수정 파일: 2개 (special-taxes.ts, special-taxes/route.ts)
## 테스트 10개
```
1. US Telecom → base tax + USF + E911 surcharges
2. EU streaming B2C → destination country VAT
3. EU streaming B2B + VAT number → reverse_charge
4. 프랑스 DST: 대기업 → 3% / 소기업 → 면제
5. 인도 디지털 서비스 → IGST 18% + TCS 2%
6. 한국 SW 라이선스 → 원천세 20%
7. serviceType 누락 → 400 에러
8. 터키 streaming vs software → 차등 세율
9. 호주 GST on digital → 10%
10. B2B 역과세 대상 아닌 국내 거래 → 정상 과세
```

## 결과
```
=== F028 Telecom/Digital Tax — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
