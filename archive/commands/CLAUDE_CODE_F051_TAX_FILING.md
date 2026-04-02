# F051 Tax Filing Assistance — 프로덕션 강화 (STUB → 실구현)

> ⚠️ 이 기능(F051)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/filing/route.ts` — 세금 신고 보조 API

## 현재 상태: 30% STUB (잘못된 테이블 조회, 금액 전부 0)

## CRITICAL 7개 (사실상 재구현 필요)

### C1: 잘못된 테이블 조회 (route.ts)
`api_usage_logs`에서 세금 데이터 조회. 이 테이블은 API 사용량 로그이지 거래 데이터가 아님.
**수정**: 올바른 데이터 소스 사용
```typescript
// 셀러의 실제 거래/계산 이력에서 세금 데이터 집계
// verification_logs 또는 별도 transaction_tax_records 테이블 사용
const { data: taxRecords } = await supabase.from('verification_logs')
  .select('destination_country, hs_code, declared_value, duties_total, taxes_total, created_at')
  .eq('seller_id', sellerId)
  .gte('created_at', periodStart)
  .lte('created_at', periodEnd);
```

### C2: 세금 금액 전부 하드코딩 0
totalDutyPaid, totalVatCollected, totalGstPaid 전부 0 반환.
**수정**: 실제 집계 계산
```typescript
const summary = taxRecords.reduce((acc, r) => {
  acc.totalDutyPaid += r.duties_total || 0;
  acc.totalVatCollected += r.taxes_total || 0;
  // 국가별 분류
  if (!acc.byCountry[r.destination_country]) {
    acc.byCountry[r.destination_country] = { duty: 0, vat: 0, transactions: 0 };
  }
  acc.byCountry[r.destination_country].duty += r.duties_total || 0;
  acc.byCountry[r.destination_country].vat += r.taxes_total || 0;
  acc.byCountry[r.destination_country].transactions += 1;
  return acc;
}, { totalDutyPaid: 0, totalVatCollected: 0, byCountry: {} as Record<string, any> });
```

### C3: 신고 기간 파라미터 없음
기간 지정 없이 전체 데이터 반환. 분기별/월별/연간 신고 기간 필요.
**수정**: period 파라미터 + 자동 기간 계산
```typescript
const period = searchParams.get('period') || 'quarterly'; // monthly | quarterly | annual
const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined;
const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

const { start, end } = calculatePeriodDates(period, year, quarter, month);
```

### C4: VAT 환급(리펀드) 계산 없음
수출 기업은 매입 VAT 환급 가능. 현재 징수 금액만 표시.
**수정**: 환급 가능 금액 계산
```typescript
response.vatRefundEligible = {
  inputVat: inputVatTotal, // 매입 시 납부한 VAT
  outputVat: outputVatTotal, // 매출 시 징수한 VAT
  netPayable: outputVatTotal - inputVatTotal,
  refundable: inputVatTotal > outputVatTotal ? inputVatTotal - outputVatTotal : 0,
  note: 'VAT refund claim must be filed with the relevant tax authority.'
};
```

### C5: 국가별 신고 양식/기한 안내 없음
각 국가마다 VAT 신고 기한, 양식, 제출 방법이 다름.
**수정**: 국가별 신고 가이드
```typescript
const FILING_GUIDES: Record<string, FilingGuide> = {
  US: { filingFrequency: 'quarterly', form: 'Form 7501', deadline: '10th day of month following quarter',
    authority: 'CBP', url: 'https://www.cbp.gov' },
  EU: { filingFrequency: 'monthly/quarterly', form: 'VAT Return', deadline: 'Varies by member state',
    authority: 'National Tax Authority', note: 'OSS/IOSS for cross-border B2C' },
  UK: { filingFrequency: 'quarterly', form: 'VAT Return (MTD)', deadline: '1 month + 7 days after quarter end',
    authority: 'HMRC', url: 'https://www.gov.uk/vat-returns' },
  KR: { filingFrequency: 'quarterly', form: '부가가치세 신고서', deadline: '분기 종료 후 25일',
    authority: '국세청', url: 'https://www.nts.go.kr' },
};
```

### C6: CSV/PDF 리포트 없음
JSON만 반환. 회계사/세무사에게 전달하려면 포맷된 리포트 필요.
**수정**: export 포맷 옵션
```typescript
const format = searchParams.get('format') || 'json';
if (format === 'csv') {
  const csv = generateTaxFilingCsv(summary);
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tax_filing_${period}_${year}.csv"` }
  });
}
```

### C7: 다중 통화 미지원
모든 금액이 USD 고정. EUR, GBP, JPY 등 거래 통화로 집계해야 함.
**수정**: 통화별 집계 + 기준 통화 환산
```typescript
// 통화별 소계
const byCurrency: Record<string, number> = {};
taxRecords.forEach(r => {
  const curr = r.currency || 'USD';
  byCurrency[curr] = (byCurrency[curr] || 0) + r.taxes_total;
});
// 기준 통화로 환산
const baseCurrency = searchParams.get('currency') || 'USD';
const converted = await convertAllToBase(byCurrency, baseCurrency);
```

## 수정 파일: 1개 (tax/filing/route.ts) + 신규 lib/tax/tax-filing.ts
## 테스트 10개
```
1. 분기별 집계 → totalDutyPaid > 0 (실제 데이터)
2. 월별 집계 → 해당 월 거래만 포함
3. 국가별 분류 → byCountry.US.duty 정확
4. VAT 환급 계산 → refundable 금액 정확
5. CSV 출력 → Content-Type: text/csv
6. 거래 없는 기간 → 빈 리포트 (에러 아님)
7. 잘못된 period → 400 에러
8. 다중 통화 → EUR + GBP 별도 집계
9. 국가 신고 가이드 → filingGuide 포함
10. sellerId 없음 → 401 에러
```

## 결과
```
=== F051 Tax Filing — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 7개 | 테스트: 10개 | 빌드: PASS/FAIL
```
