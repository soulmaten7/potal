# F138 Customer Success Management — 프로덕션 강화

> ⚠️ 이 기능(F138)만 작업합니다.

## 현재 파일
- `app/api/v1/admin/csm/route.ts` — CSM 관리 API

## 현재 상태: 30% (하드코딩 CSM 4명, 캘린더/메시징 없음, 고객 할당 미작동)

## CRITICAL 5개

### C1: CSM 하드코딩 (route.ts)
4명의 CSM이 코드에 하드코딩. 추가/삭제/수정 불가.
**수정**: DB 기반 CSM 관리
```typescript
// csm_profiles 테이블 생성 (migration)
// CREATE TABLE csm_profiles (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name TEXT NOT NULL, email TEXT NOT NULL,
//   specialties TEXT[], max_accounts INT DEFAULT 50,
//   current_accounts INT DEFAULT 0, status TEXT DEFAULT 'active',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );

// GET /admin/csm — CSM 목록 조회 (DB에서)
const { data: csms } = await supabase.from('csm_profiles')
  .select('*').eq('status', 'active').order('current_accounts', { ascending: true });
```

### C2: 고객 할당 로직 없음
Enterprise 고객에게 CSM 자동 할당 안 됨. 수동 할당 API도 없음.
**수정**: 자동 + 수동 할당
```typescript
// 자동 할당: 부하 분산 + 전문 분야 매칭
async function autoAssignCsm(customerId: string, customerIndustry: string): Promise<CsmAssignment> {
  const { data: csms } = await supabase.from('csm_profiles')
    .select('*').eq('status', 'active')
    .lt('current_accounts', supabase.raw('max_accounts'))
    .order('current_accounts', { ascending: true });

  // 전문 분야 매칭 우선
  const specialtyMatch = csms?.find(c => c.specialties?.includes(customerIndustry));
  const assigned = specialtyMatch || csms?.[0]; // 없으면 가장 여유 있는 CSM

  if (!assigned) return { error: 'No available CSM. All at capacity.' };

  await supabase.from('csm_assignments').insert({
    csm_id: assigned.id, customer_id: customerId,
    assigned_at: new Date().toISOString(), status: 'active'
  });
  await supabase.from('csm_profiles').update({
    current_accounts: assigned.current_accounts + 1
  }).eq('id', assigned.id);

  return { csmId: assigned.id, csmName: assigned.name, csmEmail: assigned.email };
}

// 수동 할당: POST /admin/csm/assign
```

### C3: 고객 건강도(Health Score) 없음
고객의 API 사용량, 에러율, 결제 상태 등으로 이탈 위험 판단 필요.
**수정**: 건강도 스코어 계산
```typescript
async function calculateHealthScore(customerId: string): Promise<HealthScore> {
  const [usage, errors, billing, lastLogin] = await Promise.all([
    getApiUsage(customerId, 30), // 최근 30일
    getErrorRate(customerId, 30),
    getBillingStatus(customerId),
    getLastLoginDate(customerId)
  ]);

  let score = 100;
  // API 사용량 감소 = 이탈 위험
  if (usage.trend === 'declining') score -= 20;
  if (usage.total === 0) score -= 40;
  // 에러율 높음
  if (errors.rate > 10) score -= 15;
  // 미납
  if (billing.overdue) score -= 30;
  // 장기 미접속
  const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin > 30) score -= 20;
  if (daysSinceLogin > 60) score -= 20;

  return {
    score: Math.max(0, score),
    risk: score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high',
    factors: { usage, errors, billing, daysSinceLogin: Math.round(daysSinceLogin) }
  };
}
```

### C4: 온보딩 체크리스트 없음
신규 고객 온보딩 단계 추적 불가.
**수정**: 온보딩 워크플로우
```typescript
const ONBOARDING_STEPS = [
  { id: 'api_key', label: 'API Key Generated', autoCheck: true },
  { id: 'first_call', label: 'First API Call Made', autoCheck: true },
  { id: 'integration', label: 'Integration Completed', autoCheck: false },
  { id: 'test_order', label: 'Test Order Processed', autoCheck: true },
  { id: 'go_live', label: 'Production Traffic Started', autoCheck: true },
  { id: 'billing_setup', label: 'Billing Configured', autoCheck: true },
];

async function getOnboardingProgress(customerId: string): Promise<OnboardingProgress> {
  const steps = await Promise.all(ONBOARDING_STEPS.map(async step => {
    if (step.autoCheck) {
      const completed = await checkStepAutomatically(customerId, step.id);
      return { ...step, completed };
    }
    // 수동 체크: DB에서 조회
    const { data } = await supabase.from('onboarding_checklist')
      .select('completed_at').eq('customer_id', customerId).eq('step_id', step.id).single();
    return { ...step, completed: !!data?.completed_at };
  }));

  const completedCount = steps.filter(s => s.completed).length;
  return { steps, progress: Math.round(completedCount / steps.length * 100) };
}
```

### C5: 활동 로그/노트 없음
CSM이 고객과 나눈 대화, 이슈, 메모 기록 불가.
**수정**: CSM 활동 노트
```typescript
// POST /admin/csm/notes
await supabase.from('csm_activity_notes').insert({
  csm_id: csmId, customer_id: customerId,
  note_type: type, // 'call' | 'email' | 'meeting' | 'issue' | 'note'
  content: content,
  created_at: new Date().toISOString()
});

// GET /admin/csm/notes?customer_id=xxx — 고객별 활동 이력
const { data: notes } = await supabase.from('csm_activity_notes')
  .select('*').eq('customer_id', customerId)
  .order('created_at', { ascending: false }).limit(50);
```

## 수정 파일: 1개 (admin/csm/route.ts) + 신규 lib/csm/ + migration 3개
## 테스트 10개
```
1. CSM 목록 → DB에서 active CSM 반환
2. 자동 할당 → 가장 여유 있는 CSM 할당
3. 전문 분야 매칭 → specialties 일치 CSM 우선
4. 모든 CSM 만석 → error 반환
5. 건강도 스코어 → 사용량 감소 시 score 하락
6. 건강도 → 장기 미접속 시 risk: high
7. 온보딩 체크리스트 → 자동 체크 항목 정확
8. 활동 노트 생성 → DB 저장 확인
9. 활동 이력 조회 → 최신순 정렬
10. 수동 할당 → csm_assignments에 기록
```

## 결과
```
=== F138 CSM — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
