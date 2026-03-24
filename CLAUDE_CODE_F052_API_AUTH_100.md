# F052 API Auth & Rate Limiting — 80% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F052)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고 현재 상태를 정리해라:

```bash
cat app/lib/api-auth/middleware.ts       # 225줄 — 메인 인증 래퍼
cat app/lib/api-auth/keys.ts             # 250줄 — 키 생성/해싱/조회
cat app/lib/api-auth/rate-limiter.ts     # 90줄 — 인메모리 슬라이딩 윈도우
cat app/lib/api-auth/plan-checker.ts     # 149줄 — 월간 할당량
cat app/lib/api-auth/usage-logger.ts     # 46줄 — 사용량 기록
cat app/lib/api-auth/response.ts         # 74줄 — 에러/성공 응답
cat app/lib/api-auth/fraud-prevention.ts # 182줄 — 사기 방지 (미사용!)
cat app/lib/api-auth/index.ts            # 13줄 — 공개 API
```

분석할 것:
- 인증 플로우 전체 (key 추출 → 검증 → scope → rate limit → plan limit → 실행 → 로그)
- fraud-prevention.ts가 middleware에 연동되어 있는지 (❌ 안 되어 있음)
- scope 매핑이 몇 개 경로만 커버하는지 (5개만)
- rate-limiter가 인메모리 전용인지 (✅ 맞음)
- IP 관련 기능이 있는지 (❌ 없음)

---

## 2단계: GAP 목록 확정

| # | GAP | 현재 상태 | 목표 |
|----|-----|----------|------|
| 1 | Fraud Detection 미연동 | 182줄 코드 존재하지만 middleware에서 안 부름 | middleware에 통합, IP 추출 + 이상 탐지 |
| 2 | Scope 시스템 부족 | 5개 경로만 매핑 (calculate/classify/validate/screen/admin) | 18개 논리 도메인 전부 매핑 |
| 3 | IP Allowlist/Blocklist 없음 | 구현 0% | 셀러별 IP 제한 테이블 + middleware 체크 |
| 4 | Rate Limit 인메모리 전용 | 서버 재시작 시 리셋 | DB 백업 fallback (usage_logs 기반 카운트) |
| 5 | API Key 관리 엔드포인트 부족 | 키 생성/조회만 가능 | 목록/상세/수정/해제 + 사용 통계 API |
| 6 | 감사 로깅 없음 | 키 생성/해제 이력 없음 | api_key_audit_logs 테이블 + 자동 기록 |

---

## 3단계: GAP별 수정

**GAP 1: Fraud Detection middleware 연동 (P0)**
- `app/lib/api-auth/middleware.ts` 수정
- rate limit 체크 이후, plan limit 체크 이전에 fraud check 삽입
- IP 추출: `req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'`
- User-Agent 추출: `req.headers.get('user-agent') || ''`
- fraud-prevention.ts의 `checkRequest()` 호출 → risk score ≥ 0.8이면 429 FRAUD_DETECTED 응답
- 기존 fraud-prevention.ts 코드 변경 최소화 (이미 잘 구현됨, 연결만 하면 됨)

**GAP 2: Scope 시스템 확장 (P0)**
- `app/lib/api-auth/middleware.ts` 수정 — 하드코딩 5개 if-else → 매핑 테이블
- 18개 scope 정의:
```typescript
const SCOPE_ROUTE_MAP: Record<string, string[]> = {
  calculate: ['/calculate', '/cost', '/compare'],
  classify: ['/classify'],
  validate: ['/validate'],
  screen: ['/screen', '/sanctions'],
  admin: ['/sellers', '/admin'],
  roo: ['/roo'],
  tax: ['/tax', '/vat', '/ioss'],
  shipping: ['/shipping', '/incoterms'],
  compliance: ['/export-controls', '/restrictions', '/compliance'],
  intelligence: ['/intelligence', '/trade-data'],
  customs: ['/customs', '/documents'],
  invoicing: ['/invoicing', '/e-invoice'],
  marketplace: ['/marketplace'],
  erp: ['/erp', '/integrations'],
  accounting: ['/accounting', '/drawback'],
  orders: ['/orders', '/fulfillment', '/returns'],
  webhook: ['/webhooks'],
  partner: ['/partner', '/referral']
};
```
- scope 매칭 로직: API key의 scopes 배열에 '*' 있으면 전체 허용, 아니면 요청 경로와 매핑된 scope가 scopes에 포함되어야 함
- 매칭 안 되는 경로는 기본 허용 (새 엔드포인트 추가 시 즉시 동작)

**GAP 3: IP Allowlist/Blocklist (P0)**
- DB 마이그레이션 생성 (supabase/migrations/041_api_key_ip_rules.sql):
```sql
CREATE TABLE IF NOT EXISTS api_key_ip_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allow', 'block')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ip_rules_key ON api_key_ip_rules(api_key_id);
CREATE INDEX idx_ip_rules_ip ON api_key_ip_rules(ip_address);
```
- `app/lib/api-auth/ip-rules.ts` 신규 생성:
  - `checkIpRules(apiKeyId, clientIp)` → allow/block/none 반환
  - allowlist가 있으면: IP가 목록에 있어야 통과 (화이트리스트 모드)
  - blocklist만 있으면: IP가 목록에 없으면 통과 (블랙리스트 모드)
  - 둘 다 없으면: 통과 (기본)
- middleware.ts에 IP 체크 추가 (key 검증 직후, rate limit 전)
- 403 IP_BLOCKED 에러 응답 추가

**GAP 4: Rate Limit DB fallback (P1)**
- `app/lib/api-auth/rate-limiter.ts` 수정
- 기존 인메모리 로직 유지 (빠른 1차 체크)
- 서버 시작 시 인메모리 비어있으면 → usage_logs에서 최근 60초 카운트 조회 (DB fallback)
- 로직: `checkRateLimit()` → 인메모리 결과 반환. 인메모리 카운트가 0이고 첫 요청이면 → usage_logs에서 `created_at > NOW() - INTERVAL '60 seconds' AND api_key_id = ?` 카운트
- 이렇게 하면 서버 재시작 직후에도 정확한 rate limit 유지
- 성능: DB 쿼리는 인메모리 miss 시에만 (서버 시작 후 첫 요청만), 이후는 인메모리

**GAP 5: API Key 관리 엔드포인트 확장 (P1)**
- `app/api/v1/keys/route.ts` 수정/확장 (GET: 목록)
- `app/api/v1/keys/[id]/route.ts` 신규 (GET: 상세 + PUT: 수정 + DELETE: 해제)
- `app/api/v1/keys/[id]/usage/route.ts` 신규 (GET: 사용 통계)
- GET /api/v1/keys → 셀러의 전체 API 키 목록 (prefix만 노출, hash 비노출)
- GET /api/v1/keys/[id] → 키 상세 (scopes, rate_limit, expires_at, last_used_at, 생성일)
- PUT /api/v1/keys/[id] → name, scopes, rate_limit_per_minute 수정 가능
- DELETE /api/v1/keys/[id] → soft delete (revoked_at 설정)
- GET /api/v1/keys/[id]/usage → 최근 30일 일별 사용량, 상위 엔드포인트, 평균 응답 시간
- 인증: 기존 API key 기반 (admin scope 필요)

**GAP 6: 감사 로깅 (P2)**
- `app/lib/api-auth/audit-logger.ts` 신규 생성
- 이벤트 타입: key_created, key_revoked, key_updated, scope_changed, ip_rule_added, ip_rule_removed
- `logAuditEvent(sellerId, eventType, details)` → health_check_logs 테이블 활용 (기존 테이블, 새 테이블 불필요)
  - check_type = 'api_key_audit'
  - details = JSON (event_type, key_id, changes, ip_address, user_agent)
- keys.ts의 createApiKey, revokeApiKey에 audit 로그 추가
- 새 엔드포인트에서 키 수정/삭제 시에도 audit 로그

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트 (최소 15개)
```
# Fraud Detection 연동
1. 정상 요청 → fraud check 통과 확인
2. 동일 IP에서 25회/10초 burst → 429 FRAUD_DETECTED
3. User-Agent 없는 요청 → risk 점수 증가 확인

# Scope 시스템
4. scopes=['calculate'] 키로 /calculate → 200
5. scopes=['calculate'] 키로 /classify → 403 INSUFFICIENT_SCOPE
6. scopes=['*'] 키로 모든 경로 → 200
7. 매핑 안 된 경로 → 기본 허용 (200)

# IP Rules
8. allowlist에 등록된 IP → 200
9. allowlist에 없는 IP → 403 IP_BLOCKED
10. blocklist에 등록된 IP → 403 IP_BLOCKED
11. 규칙 없는 키 → 200

# Rate Limit DB fallback
12. 인메모리 비어있을 때 → DB에서 최근 60초 카운트 조회 확인
13. 인메모리 있을 때 → DB 미조회 확인

# Key 관리 API
14. GET /api/v1/keys → 키 목록 (hash 미노출)
15. DELETE /api/v1/keys/[id] → revoked_at 설정 확인
```

### 검수 2: API 응답 검증
```
- 모든 새 엔드포인트 200/201/204 정상 응답
- 인증 없이 호출 → 401
- 잘못된 scope → 403 INSUFFICIENT_SCOPE
- IP 차단 → 403 IP_BLOCKED
- Fraud 탐지 → 429 FRAUD_DETECTED
```

### 검수 3: 엣지 케이스
```
- scopes 빈 배열 → 모든 경로 차단 (wildcard 없으면)
- IP allowlist + blocklist 동시 존재 → allowlist 우선
- IPv6 주소 처리
- rate-limiter DB fallback 쿼리 실패 시 → 인메모리만 사용 (fail-open)
- 존재하지 않는 key ID → 404
- 다른 셀러의 key 접근 → 403
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개
- console.log 0개
- 하드코딩된 시크릿/매직넘버 0개
- fraud-prevention.ts가 middleware에서 실제 호출되는지
- 모든 IP 관련 코드에서 x-forwarded-for 파싱 일관성
- SCOPE_ROUTE_MAP이 기존 5개 경로 포함하는지 (regression 방지)

---

## 5단계: 완료 조건

아래 전부 충족해야 F052 = 100%:
- [ ] Fraud Detection이 middleware에 연동 (IP+UA 추출 + risk score 체크)
- [ ] Scope 시스템 18개 도메인 매핑 (기존 5개 포함)
- [ ] IP Allowlist/Blocklist 테이블 + middleware 체크
- [ ] Rate Limit DB fallback (인메모리 miss 시 usage_logs 조회)
- [ ] API Key 관리 CRUD (목록/상세/수정/해제/사용통계)
- [ ] 감사 로깅 (key_created/revoked/updated 이벤트)
- [ ] 단위 테스트 15개 PASS
- [ ] 엣지 케이스 테스트 PASS
- [ ] npm run build 통과
- [ ] TODO 주석 0개, console.log 0개
- [ ] 엑셀 로그 기록 완료

---

## 6단계: 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
F052 API Auth & Rate Limiting: 80% → 100% production upgrade

- Fraud detection 연동 (IP+UA fingerprint, burst/flood/enumeration 탐지)
- Scope 시스템 확장 5→18 도메인 (SCOPE_ROUTE_MAP 매핑 테이블)
- IP allowlist/blocklist (api_key_ip_rules 테이블 + middleware 체크)
- Rate limit DB fallback (인메모리 miss 시 usage_logs 카운트)
- API Key 관리 CRUD (/api/v1/keys CRUD + 사용 통계)
- 감사 로깅 (key_created/revoked/updated → health_check_logs)
- 단위 테스트 15개 + 엣지 케이스 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 보고하고, 다음 기능(F093) 명령어를 기다려라. 절대 다음 기능을 스스로 시작하지 마라.**
