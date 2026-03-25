# F130/F131/F132 MoR + Fraud Prevention + Chargeback — 프로덕션 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/checkout/mor/route.ts` — F130 Merchant of Record
- `app/api/v1/checkout/fraud/route.ts` — F131/F132 사기방지+차지백

---

## F130 MoR (Merchant of Record) — CRITICAL 3개

### C1: DDP 견적 관세 미포함
MoR 견적에 관세/세금이 하드코딩 또는 미계산.
**수정**: 실제 landed cost 연동
```typescript
const landedCost = await calculateLandedCost({
  hsCode: item.hsCode, originCountry, destinationCountry,
  declaredValue: item.price * item.quantity, currency
});
response.ddpQuote = {
  itemTotal: item.price * item.quantity,
  duties: landedCost.duties?.total || 0,
  taxes: landedCost.taxes?.total || 0,
  fees: landedCost.fees?.total || 0,
  insurance: insuranceAmount,
  shipping: shippingCost,
  totalDdp: itemTotal + duties + taxes + fees + insurance + shipping,
  currency, exchangeRate: landedCost.exchangeRate
};
```

### C2: MoR 수수료 미표시
POTAL이 MoR로 작동할 때의 수수료 구조 없음.
**수정**: 수수료 명시
```typescript
response.morFee = {
  percentage: 3.5, // MoR 수수료
  flatFee: 0.50, // 건당 고정비
  totalFee: Math.round((totalDdp * 0.035 + 0.50) * 100) / 100,
  includes: ['Tax collection & remittance', 'Compliance liability', 'Customs brokerage coordination']
};
```

### C3: 환불/분쟁 시 MoR 책임 범위 없음
MoR로서의 법적 책임 범위(관세 오류, 배송 지연 등) 미정의.
**수정**: 책임 범위 명시
```typescript
response.morTerms = {
  potalResponsibility: ['Tax calculation accuracy', 'Tax remittance to authorities', 'Customs classification'],
  sellerResponsibility: ['Product quality', 'Shipping fulfillment', 'Return handling'],
  buyerProtection: ['DDP guaranteed price', 'No hidden customs charges', 'Refund for tax overpayment']
};
```

---

## F131 Fraud Prevention — CRITICAL 3개

### C1: 리스크 스코어 가중치 미조정
모든 시그널 동일 가중치. 실제로는 IP/국가 불일치가 이메일 도메인보다 중요.
**수정**: 가중치 기반 스코어링
```typescript
const FRAUD_WEIGHTS = {
  country_mismatch: 25, // IP 국가 ≠ 배송 국가
  velocity_check: 20, // 짧은 시간 내 다수 주문
  address_mismatch: 15, // 청구지 ≠ 배송지
  high_value_first_order: 15,
  disposable_email: 10,
  known_fraud_bin: 10,
  vpn_detected: 5,
};
const riskScore = Object.entries(signals)
  .filter(([_, triggered]) => triggered)
  .reduce((score, [signal]) => score + (FRAUD_WEIGHTS[signal] || 5), 0);
const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
```

### C2: 허용/차단 목록 없음
신뢰할 수 있는 반복 고객을 화이트리스트에 넣을 수 없음.
**수정**: 셀러별 허용/차단 목록
```typescript
// 허용 목록: 항상 통과
const { data: whitelist } = await supabase.from('fraud_whitelist')
  .select('email').eq('seller_id', sellerId).eq('email', buyerEmail);
if (whitelist?.length > 0) return { riskLevel: 'low', whitelisted: true };

// 차단 목록: 항상 거부
const { data: blacklist } = await supabase.from('fraud_blacklist')
  .select('email, reason').eq('seller_id', sellerId).eq('email', buyerEmail);
if (blacklist?.length > 0) return { riskLevel: 'blocked', reason: blacklist[0].reason };
```

### C3: 머신러닝 피드백 루프 없음
판정 후 실제 사기였는지 피드백 수집 안 함.
**수정**: 판정 결과 피드백 API
```typescript
// POST /checkout/fraud/feedback
// 실제 사기 여부 피드백 → 향후 모델 개선용
await supabase.from('fraud_feedback').insert({
  transaction_id: transactionId, original_score: riskScore,
  actual_fraud: wasFraud, feedback_by: sellerId,
  created_at: new Date().toISOString()
});
```

---

## F132 Chargeback Management — CRITICAL 2개

### C1: 증거 자동 수집 안 됨
차지백 발생 시 배송 증빙, 통관 서류, 서명 등 자동 수집 없음.
**수정**: 자동 증거 번들
```typescript
async function collectChargebackEvidence(transactionId: string): Promise<Evidence> {
  const [tracking, customs, audit] = await Promise.all([
    getTrackingProof(transactionId), // 배송 추적 + 서명
    getCustomsDocuments(transactionId), // 통관 서류
    getAuditTrail(transactionId), // 감사 로그
  ]);
  return {
    deliveryConfirmation: tracking?.delivered ? tracking : null,
    customsDeclaration: customs,
    transactionAudit: audit,
    ddpReceipt: await getDdpReceipt(transactionId),
    compiledAt: new Date().toISOString()
  };
}
```

### C2: 차지백 통계/트렌드 없음
셀러별 차지백 비율, 사유별 분석 없음.
**수정**: 차지백 분석
```typescript
response.chargebackAnalytics = {
  totalDisputes: disputes.length,
  wonRate: won / total * 100,
  lostRate: lost / total * 100,
  byReason: groupAndCount(disputes, 'reason'), // 'item_not_received', 'unauthorized', etc.
  trend: monthlyChargebackRate,
  alert: chargebackRate > 1 ? 'Chargeback rate exceeds 1%. Risk of payment processor penalties.' : null
};
```

## 테스트 10개
```
1. F130: DDP 견적 → duties + taxes + fees 포함
2. F130: MoR 수수료 → 3.5% + $0.50
3. F131: 고위험 시그널 → riskLevel: high
4. F131: 화이트리스트 이메일 → riskLevel: low
5. F131: 차단 이메일 → riskLevel: blocked
6. F131: 피드백 기록 → fraud_feedback 저장
7. F132: 증거 자동 수집 → 배송+통관+감사
8. F132: 차지백 비율 > 1% → alert
9. F130: 환불 시 MoR 책임 → morTerms 포함
10. F131: 가중치 스코어 → country_mismatch 25점
```
