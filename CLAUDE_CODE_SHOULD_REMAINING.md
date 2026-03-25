# SHOULD 나머지 기능 — 프로덕션 강화 (종합)

> ⚠️ 아래 나열된 기능들만 작업합니다. 각 기능별 CRITICAL 사항 포함.

---

## F052 Tax Payment Automation
### 파일: `app/api/v1/tax/payment/route.ts`
### CRITICAL 2개
**C1**: 결제 프로세서 연동 없음. 세금 금액만 계산하고 실제 납부 연동 없음.
```typescript
response.paymentGuide = {
  manual: { method: 'Direct payment to tax authority', urls: TAX_AUTHORITY_URLS[country] },
  automated: { available: false, note: 'Automated tax payment coming soon. Currently manual payment required.' }
};
```
**C2**: 납부 이력 추적 없음. → tax_payment_log 테이블에 기록
```typescript
await supabase.from('tax_payment_log').insert({ seller_id: sellerId, country, amount, paid_at, reference });
```

---

## F066 Dangerous Goods Handling
### 파일: `app/api/v1/shipping/dangerous-goods/route.ts` 또는 관련 route
### CRITICAL 2개
**C1**: UN 번호 매핑 불완전. HS 코드→UN 번호 자동 매핑 필요.
```typescript
const HS_TO_UN: Record<string, { unNumber: string, class: string, packingGroup: string }> = {
  '360100': { unNumber: 'UN0336', class: '1.4', packingGroup: 'II' }, // 화약
  '280469': { unNumber: 'UN2984', class: '5.1', packingGroup: 'III' }, // 과산화수소
  '271019': { unNumber: 'UN1202', class: '3', packingGroup: 'III' }, // 디젤
};
```
**C2**: 캐리어별 위험물 접수 조건 미표시.
```typescript
const DG_CARRIER_RULES: Record<string, DgRule> = {
  dhl: { acceptsClass: ['3','8','9'], maxWeight: 30, requiresDgForm: true },
  fedex: { acceptsClass: ['3','8','9'], maxWeight: 50, requiresDgForm: true },
  usps: { acceptsClass: [], note: 'USPS does not accept dangerous goods internationally' },
};
```

---

## F067 Cross-Border Returns Processing
### 파일: `app/api/v1/returns/` 또는 관련 route
### CRITICAL 2개
**C1**: 반품 시 관세 환급(drawback) 계산 없음.
```typescript
response.dutyDrawback = {
  eligible: true,
  originalDutyPaid: originalImport.duties_total,
  refundableAmount: originalImport.duties_total * 0.99, // 99% drawback
  filingDeadline: '3 years from import date (US)',
  form: 'CBP Form 7551'
};
```
**C2**: 반품 통관 서류 자동 생성 안 됨.

---

## F070 Customs Duty Drawback Calculator
### 파일: `app/api/v1/customs/drawback/route.ts` 또는 관련 route
### CRITICAL 1개
**C1**: drawback 유형(unused merchandise, manufacturing, rejected) 구분 없음.
```typescript
const DRAWBACK_TYPES = {
  unused: { rate: 99, description: 'Imported and exported without use' },
  manufacturing: { rate: 99, description: 'Imported, used in manufacturing, product exported' },
  rejected: { rate: 99, description: 'Returned due to defect/non-conformance' },
};
```

---

## F074/F075 Additional Tax Features
### CRITICAL 1개
**C1**: 세금 캘린더 — 국가별 세금 신고 기한 캘린더 API. 현재 데이터 불완전.
```typescript
// GET /tax/calendar?country=US&year=2026
response.deadlines = [
  { date: '2026-04-15', event: 'Federal Income Tax', form: '1040' },
  { date: '2026-04-30', event: 'Q1 VAT Return (EU)', form: 'OSS' },
];
```

---

## F091 API Usage Dashboard
### 파일: `app/api/v1/admin/usage/route.ts` 또는 관련 route
### CRITICAL 2개
**C1**: 사용량 데이터가 api_usage_logs에서 집계되지 않음.
```typescript
const { data } = await supabase.from('api_usage_logs')
  .select('endpoint, count(*)')
  .eq('seller_id', sellerId)
  .gte('created_at', monthStart)
  .group('endpoint');
```
**C2**: 일별/시간별 트렌드 차트 데이터 없음.
```typescript
response.dailyUsage = await supabase.rpc('get_daily_usage', { p_seller_id: sellerId, p_days: 30 });
```

---

## F094 Rate Limiting Dashboard
### CRITICAL 1개
**C1**: 현재 rate limit 상태(남은 요청 수, 리셋 시간) API 미제공.
```typescript
response.rateLimitStatus = {
  plan: currentPlan,
  monthlyLimit: planLimits[currentPlan],
  used: currentUsage,
  remaining: planLimits[currentPlan] - currentUsage,
  resetAt: nextMonthStart,
  burstLimit: { perSecond: 10, perMinute: 100 }
};
```

---

## F096 Multi-Region API Deployment
### CRITICAL 1개
**C1**: 단일 Vercel 리전(US East). 아시아/유럽 고객 레이턴시 높음.
```typescript
// Vercel Edge Config 또는 vercel.json에 리전 설정
response.regions = {
  current: 'iad1', // US East
  available: ['iad1', 'sfo1', 'lhr1', 'hnd1', 'sin1'],
  note: 'Edge functions auto-route to nearest region. API routes on US East.',
  optimization: 'Use Edge Runtime for latency-sensitive endpoints'
};
```

---

## F098-F102 Advanced Analytics Features
### CRITICAL 2개 (통합)
**C1**: 대시보드 위젯 데이터 포맷이 프론트엔드 호환 아님.
```typescript
// Recharts 호환 포맷으로 통일
response.chartData = {
  type: 'line', // 'line' | 'bar' | 'pie' | 'area'
  data: dataPoints.map(d => ({ x: d.date, y: d.value, label: d.label })),
  xAxis: { type: 'date', format: 'MMM DD' },
  yAxis: { type: 'number', prefix: '$' }
};
```
**C2**: 내보내기(CSV/PDF) 일관성 없음. 일부 엔드포인트만 지원.
→ 모든 analytics 엔드포인트에 format=csv|json 파라미터 추가

---

## F106 Compliance Calendar
### CRITICAL 1개
**C1**: 규정 변경 일정 자동 업데이트 안 됨. 수동 하드코딩.
```typescript
response.upcomingChanges = [
  { date: '2026-07-01', country: 'EU', change: 'CBAM Phase 2 - Full implementation', impact: 'high' },
  { date: '2026-07-01', country: 'EU', change: 'OSS €3 flat-rate change', impact: 'medium' },
];
response.dataSource = 'Manual curation. Subscribe to regulatory alerts for updates.';
```

---

## F113/F114 Advanced Platform Features
### CRITICAL 1개 (통합)
**C1**: 셀러 온보딩 가이드가 정적. 셀러 상태에 따른 동적 체크리스트 필요.
```typescript
async function getOnboardingChecklist(sellerId: string) {
  const hasApiKey = await checkApiKey(sellerId);
  const hasFirstCall = await checkFirstApiCall(sellerId);
  const hasIntegration = await checkIntegration(sellerId);
  return [
    { step: 'Create API Key', completed: hasApiKey, url: '/dashboard/api-keys' },
    { step: 'Make First API Call', completed: hasFirstCall, url: '/docs/quickstart' },
    { step: 'Connect Store', completed: hasIntegration, url: '/dashboard/integrations' },
  ];
}
```

---

## F117-F129 Additional i18n/Regional Features
### CRITICAL 1개 (통합)
**C1**: 지역별 세금 규칙 하드코딩. 데이터베이스화 필요.
→ 이미 vat_gst_rates, de_minimis_thresholds, customs_fees에 240개국 데이터 있음.
→ special_taxes만 DB 마이그레이션 필요
```typescript
// special_taxes 테이블로 이전
// 현재: app/lib/tax/special-taxes.ts에 하드코딩
// 목표: supabase special_taxes 테이블에서 조회
```

---

## 수정 파일: 각 기능별 해당 route.ts
## 테스트 12개 (종합)
```
1. F052: 납부 가이드 → tax authority URL
2. F066: 리튬배터리 HS → UN3481 매핑
3. F066: USPS → 위험물 불가
4. F067: 반품 drawback → 99% 환급
5. F070: drawback 유형 → 3종 구분
6. F091: API 사용량 → endpoint별 집계
7. F094: rate limit 상태 → remaining 정확
8. F098: 차트 데이터 → Recharts 포맷
9. F106: 규정 변경 캘린더 → upcoming 포함
10. F113: 온보딩 체크리스트 → 동적 상태
11. F117: 지역 세금 → DB 조회
12. F074: 세금 캘린더 → 기한 목록
```

## 결과
```
=== SHOULD 나머지 기능 — 강화 완료 ===
- 대상 기능: ~15개 | CRITICAL: 각 1-2개 | 테스트: 12개 | 빌드: PASS/FAIL
```
