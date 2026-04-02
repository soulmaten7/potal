# F069/F047/F048 Customs Clearance + FTZ + Bonded Warehouse — 프로덕션 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/customs/declaration/route.ts` — F069
- `app/api/v1/compliance/ftz/route.ts` — F047/F048

---

## F069 Customs Clearance Service — CRITICAL 3개

### C1: 통관 비용 추정값 없음
통관 절차 안내만. 수수료(customs broker fee, exam fee) 추정 없음.
**수정**: 비용 추정 추가
```typescript
response.estimatedCosts = {
  brokerFee: { min: 150, max: 400, currency: 'USD', note: 'Customs broker fee varies by complexity' },
  mpf: Math.max(Math.min(declaredValue * 0.003464, 575.35), 31.67), // US MPF
  hmf: declaredValue > 0 ? declaredValue * 0.00125 : 0, // US HMF (ocean only)
  examFee: { possible: true, range: '$200-$1,000', note: 'Only if selected for CBP exam' },
  totalEstimate: { min: estimateMin, max: estimateMax }
};
```

### C2: 필요 서류 체크리스트 동적 생성 안 됨
모든 국가 동일 서류 목록. 국가/상품별 추가 서류(위생증명, 원산지증명 등) 누락.
**수정**: 국가+HS 기반 동적 서류
```typescript
const EXTRA_DOCS: Record<string, (hs: string) => string[]> = {
  US: (hs) => hs.startsWith('02') ? ['USDA Import Permit', 'Phytosanitary Certificate'] :
    hs.startsWith('30') ? ['FDA Prior Notice'] : [],
  EU: (hs) => hs.startsWith('02') ? ['Health Certificate', 'TRACES Certificate'] : [],
  KR: (hs) => hs.startsWith('21') ? ['식품 수입신고'] : [],
};
```

### C3: 통관 소요시간 예측 없음
**수정**: 국가별 평균 통관 시간 제공
```typescript
const CLEARANCE_TIMES: Record<string, { normal: string, delayed: string }> = {
  US: { normal: '1-3 business days', delayed: '5-15 business days (if exam)' },
  EU: { normal: '1-2 business days', delayed: '3-7 business days' },
  CN: { normal: '3-5 business days', delayed: '7-30 business days' },
};
```

---

## F047 Foreign Trade Zone (FTZ) — CRITICAL 2개

### C1: FTZ 혜택 계산 없음
FTZ 목록만 제공. 관세 절감액, 재수출 면세 등 구체적 혜택 미계산.
**수정**: FTZ vs 직접 수입 비교
```typescript
response.ftzBenefit = {
  directImportDuty: dutyRate * declaredValue / 100,
  ftzDutyDeferral: true, // FTZ에서 보관 중 관세 유예
  reexportDutySaving: dutyRate * declaredValue / 100, // 재수출 시 관세 0
  invertedTariffSaving: Math.max(0, (componentDutyRate - finishedGoodDutyRate) * declaredValue / 100),
  weeklyEstimateSaving: estimateFtzSaving(annualVolume, dutyRate)
};
```

### C2: 미국 FTZ 데이터만
293개 미국 FTZ만. EU 자유무역지대, 두바이 JAFZA 등 미포함.
**수정**: 국제 FTZ 데이터 추가
```typescript
const INTERNATIONAL_FTZ = {
  AE: [{ name: 'JAFZA', city: 'Dubai', benefits: ['0% corporate tax', '0% import/export duty'] }],
  SG: [{ name: 'Jurong Free Trade Zone', benefits: ['GST exemption on re-exports'] }],
  CN: [{ name: 'Shanghai FTZ', benefits: ['Simplified customs', 'Tax incentives'] }],
};
```

---

## F048 Bonded Warehouse — CRITICAL 2개

### C1: 보세창고 비용 정보 없음
보세창고 위치만 제공. 보관료, 관세 유예 기간, 조건 없음.
**수정**: 비용 + 조건 추가
```typescript
response.bondedWarehouseInfo = {
  maxStoragePeriod: country === 'US' ? '5 years' : country === 'EU' ? 'Unlimited' : '3 years',
  dutyDeferral: true,
  estimatedStorageCost: '$0.50-$2.00/sqft/month',
  conditions: ['Goods under customs supervision', 'Bond required', 'Regular inventory reporting']
};
```

### C2: 보세→국내반입 절차 없음
보세창고에서 꺼낼 때 관세 납부 프로세스 안내 없음.
**수정**: 반출 절차 추가
```typescript
response.withdrawalProcess = {
  steps: ['File withdrawal entry with customs', 'Pay applicable duties/taxes', 'Receive release'],
  dutyPayableAt: 'Time of withdrawal (not import)',
  partialWithdrawal: true // 일부만 반출 가능
};
```

## 테스트 10개 (3개 기능 통합)
```
1. F069: US 통관 비용 → MPF + HMF 계산
2. F069: 식품 HS + US → USDA/FDA 서류 추가
3. F069: 통관 시간 → 국가별 예측
4. F047: FTZ vs 직접수입 → 절감액 비교
5. F047: 재수출 → 관세 0 절감
6. F047: 두바이 FTZ → JAFZA 정보
7. F048: 보세창고 보관 기간 → 국가별 상이
8. F048: 반출 절차 → steps 포함
9. F069: 잘못된 국가 → 기본 서류 목록
10. F047: invertedTariff → 부품>완제품 세율 차이 계산
```
