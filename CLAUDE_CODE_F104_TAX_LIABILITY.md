# F104 Tax Liability Dashboard — 프로덕션 강화 (STUB → 실구현)

> ⚠️ 이 기능(F104)만 작업합니다.

## 현재 파일
- `app/api/v1/tax/liability/route.ts` — 세금 의무 대시보드 API

## 현재 상태: 25% STUB (taxOwed 하드코딩 0, 실제 집계 없음)

## CRITICAL 6개

### C1: taxOwed 하드코딩 0 (route.ts)
모든 국가에 대해 taxOwed: 0 반환. 실제 거래 데이터 기반 집계 없음.
**수정**: verification_logs에서 실제 세금 의무 집계
```typescript
async function calculateTaxLiability(sellerId: string, period: string): Promise<TaxLiability[]> {
  const { start, end } = parsePeriod(period);

  const { data: transactions } = await supabase.from('verification_logs')
    .select('destination_country, duties_total, taxes_total, declared_value, currency, created_at')
    .eq('seller_id', sellerId)
    .gte('created_at', start).lte('created_at', end);

  // 국가별 집계
  const byCountry = new Map<string, CountryLiability>();
  for (const tx of transactions || []) {
    const existing = byCountry.get(tx.destination_country) || {
      country: tx.destination_country, dutyOwed: 0, vatOwed: 0,
      totalOwed: 0, transactionCount: 0, totalValue: 0
    };
    existing.dutyOwed += tx.duties_total || 0;
    existing.vatOwed += tx.taxes_total || 0;
    existing.totalOwed += (tx.duties_total || 0) + (tx.taxes_total || 0);
    existing.transactionCount += 1;
    existing.totalValue += tx.declared_value || 0;
    byCountry.set(tx.destination_country, existing);
  }

  return Array.from(byCountry.values()).sort((a, b) => b.totalOwed - a.totalOwed);
}
```

### C2: 신고 기한(deadline) 추적 없음
각 국가별 VAT/GST 신고 기한을 모름. 놓치면 벌금.
**수정**: 국가별 신고 기한 + 알림
```typescript
const FILING_DEADLINES: Record<string, FilingDeadline> = {
  UK: { frequency: 'quarterly', daysAfterPeriod: 37, name: 'MTD VAT Return' },
  DE: { frequency: 'monthly', daysAfterPeriod: 10, name: 'Umsatzsteuervoranmeldung' },
  AU: { frequency: 'quarterly', daysAfterPeriod: 28, name: 'BAS' },
  KR: { frequency: 'quarterly', daysAfterPeriod: 25, name: '부가가치세 신고' },
  JP: { frequency: 'annual', daysAfterPeriod: 60, name: '消費税確定申告' },
};

function getUpcomingDeadlines(liabilities: TaxLiability[]): UpcomingDeadline[] {
  return liabilities
    .filter(l => l.totalOwed > 0)
    .map(l => {
      const deadline = FILING_DEADLINES[l.country];
      if (!deadline) return null;
      const dueDate = calculateDueDate(deadline);
      const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { country: l.country, dueDate, daysLeft, amount: l.totalOwed,
        urgent: daysLeft <= 7, overdue: daysLeft < 0 };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft);
}
```

### C3: VAT 등록 의무 판정 없음
매출 임계값 초과 시 해당 국가에 VAT 등록 필수. 현재 판단 없음.
**수정**: 임계값 체크 (F055 연동)
```typescript
// 각 국가별 매출이 VAT 등록 임계값에 도달했는지 체크
for (const liability of liabilities) {
  const threshold = VAT_THRESHOLDS[liability.country];
  if (threshold && liability.totalValue >= threshold.threshold) {
    liability.registrationRequired = true;
    liability.registrationNote = `Revenue ${liability.totalValue} exceeds ${threshold.currency} ${threshold.threshold} threshold. VAT registration required.`;
  } else if (threshold && liability.totalValue >= threshold.threshold * 0.8) {
    liability.registrationWarning = `Approaching VAT threshold (${Math.round(liability.totalValue / threshold.threshold * 100)}%)`;
  }
}
```

### C4: 다중 통화 미지원
모든 금액이 단일 통화. 국가별 다른 통화로 납부해야 하는 의무 표시 필요.
**수정**: 현지 통화 + 기준 통화 병행 표시
```typescript
interface CountryLiability {
  country: string;
  localCurrency: string;
  localAmount: number; // 현지 통화 금액
  baseCurrency: string; // 셀러 기준 통화
  baseAmount: number; // 환산 금액
  exchangeRate: number;
}

// 환율 적용
const exchangeRate = await getExchangeRate(localCurrency, baseCurrency);
liability.baseAmount = liability.localAmount * exchangeRate;
liability.exchangeRate = exchangeRate;
```

### C5: 트렌드/비교 데이터 없음
이전 기간 대비 증감, 월별 추이 없음. 대시보드 가치 저하.
**수정**: 전기 비교 + 트렌드
```typescript
// 전기 대비
const previousPeriod = calculatePreviousPeriod(period);
const previousLiabilities = await calculateTaxLiability(sellerId, previousPeriod);

response.trends = {
  totalOwedChange: currentTotal - previousTotal,
  totalOwedChangePercent: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : null,
  newCountries: currentCountries.filter(c => !previousCountries.includes(c)),
  monthlyTrend: await getMonthlyTrend(sellerId, 6) // 최근 6개월
};
```

### C6: CSV/PDF 리포트 없음
회계팀/세무사에게 전달할 수 있는 포맷 출력 필요.
**수정**: export 옵션
```typescript
const format = searchParams.get('format') || 'json';
if (format === 'csv') {
  const csv = generateLiabilityCsv(liabilities, deadlines);
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tax_liability_${period}.csv"` }
  });
}
```

## 수정 파일: 1개 (tax/liability/route.ts) + 신규 lib/tax/tax-liability.ts
## 테스트 10개
```
1. 분기별 세금 의무 → 국가별 totalOwed > 0
2. 빈 기간 → 빈 배열 (에러 아님)
3. 신고 기한 → daysLeft 정확 계산
4. 기한 7일 이내 → urgent: true
5. VAT 등록 임계값 초과 → registrationRequired: true
6. 다중 통화 → localAmount + baseAmount 병행
7. 전기 대비 → trends.totalOwedChangePercent 정확
8. CSV 출력 → Content-Type: text/csv
9. 국가별 정렬 → totalOwed 내림차순
10. 미인증 요청 → 401 에러
```

## 결과
```
=== F104 Tax Liability — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 6개 | 테스트: 10개 | 빌드: PASS/FAIL
```
