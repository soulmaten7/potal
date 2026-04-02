# F095 High-Throughput API — 프로덕션 강화

> ⚠️ 이 기능(F095)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **구현됨 (CRITICAL 버그 3개 + MISSING 2개)**

## 현재 파일
- `app/lib/api-auth/rate-limiter.ts` — 인메모리 rate limiter (슬라이딩 윈도우)
- `app/lib/api-auth/plan-checker.ts` — 플랜별 할당량 체크
- `app/lib/api-auth/middleware.ts` — API 인증 미들웨어
- `app/api/v1/calculate/batch/route.ts` — 배치 계산 (CONCURRENCY=10)
- `app/lib/webhooks/webhook-rate-limit.ts` — 웹훅 전송 rate limit

## CRITICAL 버그 3개

### C1: 인메모리 Rate Limiter → 서버 재시작 시 초기화 (rate-limiter.ts:13-19)
**현재 코드:**
```typescript
// In-memory store (resets on server restart — acceptable for MVP)
const store = new Map<string, RateLimitEntry>();
```
**문제**: Vercel 서버리스 cold start마다 rate limit 리셋. 악용 가능.
**수정**:
```typescript
// Supabase를 rate limit 스토어로 사용
// 테이블: rate_limit_entries (api_key TEXT, window_start TIMESTAMPTZ, request_count INT)
// 또는 더 가벼운 방법: X-RateLimit 헤더 기반 클라이언트 사이드 제한 + 서버 사이드 usage_logs 기반 확인
//
// 실용적 해결: usage_logs 테이블에서 최근 1분 내 요청 수를 카운트
async function checkRateLimit(apiKey: string, limit: number): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key', apiKey)
    .gte('created_at', oneMinuteAgo);
  return (count || 0) < limit;
}
```
**주의**: 이 방식은 DB 부하가 있으므로, 인메모리 캐시를 1차 방어선으로 유지하되, 5분마다 DB와 동기화하는 하이브리드 방식 권장.

### C2: Plan 할당량 체크에 잘못된 날짜 필드 사용 (plan-checker.ts:74-79)
**현재 코드:**
```typescript
const { count } = await (supabase.from('usage_logs') as any)
  .select('*', { count: 'exact', head: true })
  .eq('seller_id', sellerId)
  .gte('billed_at', monthStart)    // ← billed_at 사용 (잘못됨)
  .lte('billed_at', monthEnd);
```
**문제**: `billed_at`은 청구 시점, `created_at`이 요청 발생 시점. 월간 할당량은 요청 시점 기준이어야 함.
**수정**:
```typescript
  .gte('created_at', monthStart)    // ← created_at으로 변경
  .lte('created_at', monthEnd);
```

### C3: 배치 처리 — 타임아웃/백프레셔 없음 (calculate/batch/route.ts:124-150)
**현재 코드:**
```typescript
for (let start = 0; start < validItems.length; start += CONCURRENCY) {
  const chunk = validItems.slice(start, start + CONCURRENCY);
  const chunkResults = await Promise.allSettled(
    chunk.map(async ({ id, costInput }) => {
      const result = await calculateGlobalLandedCostAsync(costInput);
      return { id, result };
    })
  );
```
**문제**: 개별 요청 타임아웃 없음 → 하나가 행이면 청크 전체 블록
**수정**:
```typescript
const TIMEOUT_MS = 15000; // 개별 요청 15초 타임아웃
const CONCURRENCY = 5;    // 10 → 5로 축소 (DB 커넥션 보호)

chunk.map(async ({ id, costInput }) => {
  const result = await Promise.race([
    calculateGlobalLandedCostAsync(costInput),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Calculation timeout')), TIMEOUT_MS)
    )
  ]);
  return { id, result };
})
```

## MISSING 기능 2개

### M1: Burst Allowance 없음
**현재**: 엄격한 슬라이딩 윈도우 (30 req/min = 정확히 30)
**수정**: Token Bucket 알고리즘으로 버스트 허용
```typescript
// 각 플랜별 버스트 허용량
const BURST_ALLOWANCE = {
  free: 5,         // 30/min + 5 burst
  basic: 10,       // 60/min + 10 burst
  pro: 20,         // 120/min + 20 burst
  enterprise: 50,  // 300/min + 50 burst
};
```

### M2: 사용량 분석 엔드포인트 없음
**수정**: `/api/v1/sellers/usage/route.ts` 강화
```typescript
// GET /api/v1/sellers/usage?period=30d
// 응답: {
//   currentMonth: { used: 1500, limit: 2000, remaining: 500, overage: 0 },
//   dailyBreakdown: [{ date: '2026-03-25', requests: 50 }, ...],
//   byEndpoint: { '/calculate': 800, '/classify': 500, '/verify': 200 },
//   estimatedOverage: { amount: 0, cost: '$0' },
//   rateLimit: { current: 15, limit: 60, resetIn: 45 }
// }
```

## 수정할 파일 목록
1. `app/lib/api-auth/rate-limiter.ts` — 하이브리드 rate limit + burst
2. `app/lib/api-auth/plan-checker.ts` — billed_at → created_at
3. `app/api/v1/calculate/batch/route.ts` — 타임아웃 + CONCURRENCY 축소
4. `app/api/v1/sellers/usage/route.ts` — 사용량 분석 응답 강화

## 테스트 (10개)
```
1. Rate limit: Free 플랜 31번째 요청 → 429 Too Many Requests
2. Rate limit: burst 허용 — Free 플랜 35번째까지 허용 (30+5 burst)
3. Rate limit: burst 소진 후 → 429
4. Plan quota: created_at 기준 월간 카운트 정확성
5. Plan quota: 이번 달 200건 사용 (Free) → 201번째 429
6. Batch timeout: 15초 이상 걸리는 계산 → 해당 item만 에러
7. Batch concurrency: CONCURRENCY=5 확인 (10이 아닌)
8. Usage API: /sellers/usage → dailyBreakdown 포함
9. Usage API: /sellers/usage → byEndpoint 분류 정확
10. Usage API: /sellers/usage → estimatedOverage 계산
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 10개 PASS
3. plan-checker에서 billed_at 사용 0건 확인 (grep)
4. batch/route.ts에 Promise.race 타임아웃 확인
5. 기존 API 인증 플로우 영향 없음
```

## 결과
```
=== F095 High-Throughput API — 강화 완료 ===
- 수정 파일: 4개
- CRITICAL 수정: 3개
- MISSING 추가: 2개
- 테스트: 10개
- 빌드: PASS/FAIL
```
