# F146 Partner Account Management — 프로덕션 강화

> ⚠️ 이 기능(F146)만 작업합니다.

## 현재 파일
- `app/api/v1/partners/` — 파트너 관련 API
- DB: `partner_accounts` 테이블

## CRITICAL 3개

### C1: 파트너 가입/승인 워크플로우 없음
partner_accounts 테이블만 있고 가입 신청/심사/승인 절차 없음.
**수정**: 파트너 가입 워크플로우
```typescript
// POST /partners/apply — 파트너 신청
const application = {
  company_name: body.companyName, contact_email: body.email,
  website: body.website, business_type: body.businessType,
  monthly_volume: body.monthlyVolume, // 예상 월간 거래량
  integration_type: body.integrationType, // 'api', 'widget', 'reseller'
  status: 'pending', applied_at: new Date().toISOString()
};
await supabase.from('partner_applications').insert(application);
// 관리자 알림 (Telegram/이메일)
await notifyAdmin('New partner application', application);
```

### C2: 파트너 대시보드 데이터 없음
파트너별 API 사용량, 추천 고객 수, 수익 통계 없음.
**수정**: 파트너 통계 API
```typescript
// GET /partners/dashboard
response = {
  profile: { tier, joinedAt, status },
  usage: { apiCalls: thisMonth, referrals: totalReferrals },
  revenue: { totalEarned, pendingPayout, lastPayout },
  customers: { active: activeCustomers, churned: churnedCustomers },
  resources: { apiDocs: '/docs/api', sdks: '/docs/sdks', supportEmail: 'partners@potal.app' }
};
```

### C3: 파트너 계약/약관 관리 없음
파트너십 조건(커미션율, 의무, 해지 조건) 관리 구조 없음.
**수정**: 파트너 계약 정보
```typescript
const PARTNER_AGREEMENTS: Record<string, Agreement> = {
  technology: { commissionRate: 15, minCommitment: '12 months', termination: '30 days notice' },
  reseller: { commissionRate: 20, minCommitment: '6 months', termination: '60 days notice' },
  strategic: { commissionRate: 25, minCommitment: '24 months', termination: '90 days notice' },
};
```

## 테스트 6개
```
1. 파트너 신청 → pending 상태로 저장
2. 관리자 알림 → notifyAdmin 호출
3. 대시보드 → usage + revenue 통계
4. 미승인 파트너 → 제한된 API 접근
5. 파트너 약관 → commissionRate + 조건
6. 파트너 상태 → active/suspended/terminated
```
