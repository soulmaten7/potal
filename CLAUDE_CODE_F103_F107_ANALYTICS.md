# F103/F107 Shipping Analytics + Trade Data Intelligence — 프로덕션 강화

> ⚠️ 이 2개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/reports/shipping-analytics/route.ts` — F103
- `app/api/v1/intelligence/trade-data/route.ts` — F107

---

## F103 Shipping Analytics — CRITICAL 3개

### C1: 실제 배송 데이터 없음 — 모의 데이터
통계가 하드코딩. 실제 verification_logs 기반 집계 아님.
**수정**: DB 기반 실제 집계
```typescript
const { data: shipments } = await supabase.from('verification_logs')
  .select('destination_country, hs_code, declared_value, created_at, carrier, transit_days')
  .eq('seller_id', sellerId)
  .gte('created_at', periodStart).lte('created_at', periodEnd);

const analytics = {
  totalShipments: shipments.length,
  totalValue: shipments.reduce((s, r) => s + (r.declared_value || 0), 0),
  avgTransitDays: avg(shipments.map(s => s.transit_days).filter(Boolean)),
  topDestinations: groupAndCount(shipments, 'destination_country').slice(0, 10),
  topHsCodes: groupAndCount(shipments, 'hs_code').slice(0, 10),
};
```

### C2: 차트/그래프 데이터 포맷 없음
숫자만 반환. 프론트엔드 차트 라이브러리에 맞는 데이터 구조 없음.
**수정**: Recharts 호환 데이터 포맷
```typescript
response.charts = {
  monthlyVolume: last6Months.map(m => ({ month: m.label, shipments: m.count, value: m.totalValue })),
  destinationPie: topDestinations.map(d => ({ name: d.country, value: d.count })),
  transitTimeTrend: transitByMonth.map(m => ({ month: m.label, avgDays: m.avgDays })),
};
```

### C3: CSV/XLSX 내보내기 없음
**수정**: export 포맷 추가
```typescript
const format = searchParams.get('format') || 'json';
if (format === 'csv') {
  const csv = shipments.map(s => `${s.destination_country},${s.hs_code},${s.declared_value},${s.created_at}`).join('\n');
  return new Response(`country,hs_code,value,date\n${csv}`, { headers: { 'Content-Type': 'text/csv' } });
}
```

---

## F107 Trade Data Intelligence — CRITICAL 3개

### C1: 무역 통계 데이터 소스 미명시
UN Comtrade 데이터라고 하지만 실제 API 호출 없음.
**수정**: 데이터 소스 명시 + DB 활용
```typescript
response.dataSource = {
  tariffRates: 'WITS/WTO (macmap_ntlc_rates, 1M+ rows)',
  tradeAgreements: 'MacMap (macmap_trade_agreements, 1,319 rows)',
  tradeRemedies: 'TTBD (trade_remedy_cases, 10,999 rows)',
  note: 'Data updated via Vercel Cron. Last update: ' + lastUpdateDate
};
// 실제 DB 데이터 활용
const { data: tariffData } = await supabase.from('macmap_ntlc_rates')
  .select('reporter_code, tariff_avg').eq('hs_code', hsCode).limit(20);
```

### C2: 시장 기회 분석 없음
데이터만 나열. "이 상품은 X국에 수출하면 관세가 0%"라는 인사이트 없음.
**수정**: 기회 분석 추가
```typescript
// HS 코드 기반 최저 관세국 추천
const { data: bestRates } = await supabase.from('macmap_ntlc_rates')
  .select('reporter_code, tariff_avg')
  .eq('hs_code', hsCode).order('tariff_avg', { ascending: true }).limit(10);

response.opportunities = bestRates?.map(r => ({
  country: r.reporter_code,
  mfnRate: r.tariff_avg,
  ftaRate: await getFtaRate(originCountry, r.reporter_code, hsCode),
  saving: r.tariff_avg - (ftaRate || r.tariff_avg),
  recommendation: ftaRate === 0 ? 'Zero duty via FTA!' : `${r.tariff_avg}% MFN rate`
}));
```

### C3: 반덤핑/상계관세 경고 미포함
10,999건 무역구제 데이터 활용 안 함.
**수정**: 무역구제 위험 경고
```typescript
const { data: remedies } = await supabase.from('trade_remedy_cases')
  .select('case_type, duty_rate, status')
  .eq('hs_code_prefix', hsCode.substring(0, 4))
  .eq('imposing_country', destinationCountry)
  .eq('status', 'active');

if (remedies?.length > 0) {
  response.tradeRemedyWarning = {
    activeCases: remedies.length,
    types: remedies.map(r => r.case_type), // AD, CVD, SG
    additionalDuty: Math.max(...remedies.map(r => r.duty_rate || 0)),
    action: 'Additional anti-dumping/countervailing duties may apply. Verify before shipping.'
  };
}
```

## 테스트 8개
```
1. F103: 셀러 배송 통계 → DB 기반 집계
2. F103: 차트 데이터 → monthlyVolume 배열
3. F103: CSV 내보내기 → text/csv
4. F107: HS 코드 → 최저 관세국 10개
5. F107: FTA 기회 → saving > 0
6. F107: 반덤핑 경고 → tradeRemedyWarning
7. F107: dataSource → 테이블명 + 행수
8. F103: 빈 기간 → 빈 결과 (에러 아님)
```
