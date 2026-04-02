# F092 Sandbox Environment — 신규 구현

> ⚠️ 이 기능(F092)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **미구현** — 샌드박스 환경 코드 0건

## 배경
개발자가 프로덕션 데이터 영향 없이 API를 테스트할 수 있는 샌드박스 환경.
Stripe, Paddle 모두 test/live 모드 분리 제공.

## 구현할 파일

### 1. `app/lib/api-auth/sandbox.ts` (신규 생성)
```typescript
export type ApiMode = 'live' | 'sandbox';

// API 키 접두사로 모드 구분
// Live: pk_live_xxxx, sk_live_xxxx
// Sandbox: pk_test_xxxx, sk_test_xxxx
export function detectApiMode(apiKey: string): ApiMode {
  if (apiKey.startsWith('pk_test_') || apiKey.startsWith('sk_test_')) return 'sandbox';
  return 'live';
}

export const SANDBOX_CONFIG = {
  // 모든 관세율을 고정값으로 반환 (테스트 가능하게)
  fixedDutyRate: 0.05,        // 5%
  fixedVatRate: 0.20,         // 20%
  fixedExchangeRate: 1.0,     // 환율 고정
  maxRequestsPerMinute: 100,  // 샌드박스는 관대하게
  // 제재 스크리닝: 항상 "clear" 반환 (테스트 안전)
  sanctionsAlwaysClear: true,
  // HS 코드 분류: 실제 분류 실행 (테스트용 데이터 저장은 안 함)
  classificationSaveToDB: false,
};

export function getSandboxResponse(endpoint: string, params: any): any {
  // 엔드포인트별 mock 응답 생성
  // /calculate → 고정 세율로 계산
  // /classify → 실제 분류하되 DB 저장 안 함
  // /sanctions → 항상 clear
  // /webhooks → 실제 전송하되 sandbox URL로만
}
```

### 2. `app/lib/api-auth/api-key-generator.ts` (수정)
현재 API 키 생성 로직에 sandbox 키 생성 추가:
```typescript
export function generateApiKeys(sellerId: string): {
  livePublishable: string;    // pk_live_xxx
  liveSecret: string;         // sk_live_xxx
  testPublishable: string;    // pk_test_xxx
  testSecret: string;         // sk_test_xxx
} {
  // 기존 키 생성 로직 + test_ 접두사 키 추가
}
```

### 3. `app/lib/api-auth/middleware.ts` (수정)
기존 인증 미들웨어에 sandbox 감지 추가:
```typescript
// 1. API 키에서 모드 감지
const mode = detectApiMode(apiKey);

// 2. 요청 헤더에 모드 표시
headers.set('X-POTAL-Mode', mode);

// 3. sandbox 모드일 때:
//    - rate limit 별도 적용 (관대하게)
//    - usage_logs에 mode='sandbox' 태깅
//    - 월간 할당량에서 제외
```

### 4. `app/api/v1/sellers/keys/route.ts` (수정)
- GET: live 키 + test 키 둘 다 반환
- POST (rotate): mode 파라미터로 live/test 키 별도 갱신
- 응답 예시:
```json
{
  "live": { "publishable": "pk_live_xxx", "secret": "sk_live_xxx" },
  "test": { "publishable": "pk_test_xxx", "secret": "sk_test_xxx" }
}
```

### 5. `supabase/migrations/046_sandbox_environment.sql` (신규)
```sql
-- API 키 테이블에 mode 컬럼 추가
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live' CHECK (mode IN ('live', 'sandbox'));

-- usage_logs에 mode 컬럼 추가
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live' CHECK (mode IN ('live', 'sandbox'));

-- sandbox 사용량은 빌링에서 제외하는 뷰
CREATE OR REPLACE VIEW billable_usage AS
SELECT * FROM usage_logs WHERE mode = 'live';
```

## 테스트 (10개)
```
1. detectApiMode('sk_live_abc') → 'live'
2. detectApiMode('sk_test_abc') → 'sandbox'
3. detectApiMode('invalid') → 'live' (기본값)
4. Sandbox /calculate: 고정 세율 5% + VAT 20% 적용 확인
5. Sandbox /classify: 분류 실행되지만 DB에 저장 안 됨
6. Sandbox /sanctions: 항상 { status: 'clear' } 반환
7. Sandbox rate limit: 100 req/min (live보다 관대)
8. Sandbox usage: usage_logs에 mode='sandbox' 태깅
9. Sandbox usage: 월간 할당량에서 제외 (Free 200건에 안 잡힘)
10. API 키 생성: live + test 키 4개 생성 확인
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 10개 PASS
3. sk_test_ 키로 /calculate 호출 → X-POTAL-Mode: sandbox 헤더 확인
4. sk_live_ 키로 동일 호출 → X-POTAL-Mode: live 헤더 확인
5. usage_logs에 mode 컬럼 확인
6. 기존 API 키 인증 영향 없음
```

## 결과
```
=== F092 Sandbox Environment — 구현 완료 ===
- 신규 파일: 2개 (sandbox.ts, migration)
- 수정 파일: 3개 (middleware, api-key-generator, sellers/keys)
- 마이그레이션: 1개
- 테스트: 10개
- 빌드: PASS/FAIL
```
