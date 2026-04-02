# F147 Revenue Share / Partner Referrals — 프로덕션 강화 (STUB → 실구현)

> ⚠️ 이 기능(F147)만 작업합니다.

## 현재 파일
- `app/api/v1/partners/referrals/route.ts` — 파트너 추천/수익 공유 API
- DB: `partner_accounts`, `partner_referrals` 테이블

## 현재 상태: 20% STUB (커미션 항상 $0, 정산 시스템 없음)

## CRITICAL 6개

### C1: 커미션 계산 항상 $0 (route.ts)
commission_amount 필드가 하드코딩 0. 실제 거래 기반 계산 없음.
**수정**: 파트너 등급별 커미션 계산
```typescript
const PARTNER_TIERS: Record<string, PartnerTier> = {
  bronze: { commissionRate: 10, minReferrals: 0, payoutThreshold: 50 },
  silver: { commissionRate: 15, minReferrals: 10, payoutThreshold: 50 },
  gold: { commissionRate: 20, minReferrals: 50, payoutThreshold: 25 },
  platinum: { commissionRate: 25, minReferrals: 200, payoutThreshold: 0 },
};

async function calculateCommission(partnerId: string, referralId: string): Promise<Commission> {
  const partner = await getPartner(partnerId);
  const tier = PARTNER_TIERS[partner.tier || 'bronze'];

  // 추천 고객의 결제 내역 조회
  const { data: payments } = await supabase.from('subscription_payments')
    .select('amount, currency, paid_at')
    .eq('customer_id', referralId)
    .eq('status', 'paid');

  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const commission = totalRevenue * (tier.commissionRate / 100);

  return {
    partnerId, referralId,
    totalRevenue, commissionRate: tier.commissionRate,
    commissionAmount: Math.round(commission * 100) / 100,
    currency: 'USD', tier: partner.tier
  };
}
```

### C2: 추천 링크/코드 시스템 없음
파트너별 고유 추천 코드/링크 생성 및 추적 없음.
**수정**: 추천 코드 생성 + 추적
```typescript
// POST /partners/referral-link — 추천 링크 생성
async function generateReferralLink(partnerId: string): Promise<ReferralLink> {
  const code = `ref_${partnerId.substring(0, 8)}_${Date.now().toString(36)}`;
  await supabase.from('partner_referral_codes').insert({
    partner_id: partnerId, code,
    link: `https://www.potal.app/signup?ref=${code}`,
    created_at: new Date().toISOString()
  });
  return { code, link: `https://www.potal.app/signup?ref=${code}` };
}

// 가입 시 추천 코드 추적
// middleware.ts 또는 signup route에서:
const refCode = searchParams.get('ref');
if (refCode) {
  const { data: partner } = await supabase.from('partner_referral_codes')
    .select('partner_id').eq('code', refCode).single();
  if (partner) {
    await supabase.from('partner_referrals').insert({
      partner_id: partner.partner_id, referred_customer_id: newCustomerId,
      referral_code: refCode, status: 'signed_up',
      referred_at: new Date().toISOString()
    });
  }
}
```

### C3: 정산(Payout) 시스템 없음
커미션 누적만 하고 실제 지급 프로세스 없음.
**수정**: 정산 요청 + 처리 워크플로우
```typescript
// GET /partners/balance — 잔액 조회
async function getPartnerBalance(partnerId: string): Promise<PartnerBalance> {
  const { data: commissions } = await supabase.from('partner_commissions')
    .select('amount').eq('partner_id', partnerId).eq('status', 'approved');
  const { data: payouts } = await supabase.from('partner_payouts')
    .select('amount').eq('partner_id', partnerId).eq('status', 'completed');

  const totalEarned = commissions?.reduce((s, c) => s + c.amount, 0) || 0;
  const totalPaid = payouts?.reduce((s, p) => s + p.amount, 0) || 0;

  return { totalEarned, totalPaid, balance: totalEarned - totalPaid,
    currency: 'USD', nextPayoutDate: getNextPayoutDate() };
}

// POST /partners/payout-request — 정산 요청
async function requestPayout(partnerId: string): Promise<PayoutResult> {
  const balance = await getPartnerBalance(partnerId);
  const tier = PARTNER_TIERS[balance.tier];

  if (balance.balance < tier.payoutThreshold) {
    return { error: `Minimum payout threshold: $${tier.payoutThreshold}. Current balance: $${balance.balance}` };
  }

  await supabase.from('partner_payouts').insert({
    partner_id: partnerId, amount: balance.balance,
    status: 'pending', requested_at: new Date().toISOString(),
    payment_method: partner.payout_method // paypal, bank_transfer, etc.
  });

  return { status: 'pending', amount: balance.balance, estimatedDate: getNextPayoutDate() };
}
```

### C4: 파트너 대시보드 데이터 없음
추천 수, 전환율, 수익 추이 등 파트너에게 보여줄 데이터 없음.
**수정**: 파트너 통계 API
```typescript
// GET /partners/stats
async function getPartnerStats(partnerId: string): Promise<PartnerStats> {
  const { data: referrals } = await supabase.from('partner_referrals')
    .select('status, referred_at').eq('partner_id', partnerId);

  const signedUp = referrals?.filter(r => r.status !== 'clicked').length || 0;
  const converted = referrals?.filter(r => r.status === 'paying').length || 0;
  const commissions = await getPartnerCommissions(partnerId);

  return {
    totalReferrals: referrals?.length || 0,
    signedUp,
    converted,
    conversionRate: signedUp > 0 ? Math.round(converted / signedUp * 100) : 0,
    totalEarnings: commissions.total,
    monthlyEarnings: commissions.thisMonth,
    tier: await getPartnerTier(partnerId),
    nextTierProgress: calculateTierProgress(partnerId)
  };
}
```

### C5: 추천 상태 추적 불완전
signed_up 후 → trial → paying → churned 전환 추적 없음.
**수정**: 추천 라이프사이클 추적
```typescript
type ReferralStatus = 'clicked' | 'signed_up' | 'trial' | 'paying' | 'churned' | 'expired';

// 구독 이벤트 시 추천 상태 업데이트 (Paddle webhook에서)
async function updateReferralStatus(customerId: string, event: string) {
  const { data: referral } = await supabase.from('partner_referrals')
    .select('id, partner_id').eq('referred_customer_id', customerId).single();

  if (!referral) return;

  let newStatus: ReferralStatus;
  switch (event) {
    case 'subscription.activated': newStatus = 'paying'; break;
    case 'subscription.cancelled': newStatus = 'churned'; break;
    default: return;
  }

  await supabase.from('partner_referrals')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', referral.id);

  // paying으로 전환 시 커미션 생성
  if (newStatus === 'paying') {
    await createCommission(referral.partner_id, customerId);
  }
}
```

### C6: 파트너 등급(Tier) 자동 승급 없음
추천 수 기반 자동 승급 로직 없음.
**수정**: 자동 등급 계산
```typescript
async function recalculatePartnerTier(partnerId: string): Promise<string> {
  const { count } = await supabase.from('partner_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .eq('status', 'paying');

  const referralCount = count || 0;
  let newTier = 'bronze';
  if (referralCount >= 200) newTier = 'platinum';
  else if (referralCount >= 50) newTier = 'gold';
  else if (referralCount >= 10) newTier = 'silver';

  await supabase.from('partner_accounts')
    .update({ tier: newTier, updated_at: new Date().toISOString() })
    .eq('id', partnerId);

  return newTier;
}
```

## 수정 파일: 1개 (partners/referrals/route.ts) + 신규 lib/partners/ + migration 3개
## 테스트 12개
```
1. 커미션 계산 → bronze 10% 정확
2. 커미션 계산 → gold 20% 정확
3. 추천 코드 생성 → 고유 코드 + 링크
4. 추천 가입 추적 → partner_referrals에 기록
5. 잔액 조회 → totalEarned - totalPaid
6. 정산 요청 → 최소 금액 이상 시 pending
7. 정산 요청 → 최소 금액 미달 시 에러
8. 파트너 통계 → conversionRate 정확
9. 구독 활성화 → referral status: paying + 커미션 생성
10. 구독 취소 → referral status: churned
11. 등급 자동 승급 → 50+ referrals → gold
12. 추천 링크 미존재 코드 → 무시 (에러 없음)
```

## 결과
```
=== F147 Revenue Share — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 6개 | 테스트: 12개 | 빌드: PASS/FAIL
```
