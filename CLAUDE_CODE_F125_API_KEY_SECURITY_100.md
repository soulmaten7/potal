# F125 API Key Security — 85% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F125)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고 현재 상태를 정리해라:

```bash
cat app/lib/api-auth/keys.ts              # 250줄 — 키 생성/해싱/조회
cat app/lib/api-auth/middleware.ts         # 225줄+ — 인증 미들웨어
cat app/lib/api-auth/rate-limiter.ts       # 90줄 — 인메모리 rate limit
cat app/lib/api-auth/fraud-prevention.ts   # 182줄 — 사기 방지
cat app/lib/api-auth/response.ts           # 74줄 — 에러 응답
cat app/lib/api-auth/audit-logger.ts       # 감사 로깅
cat app/lib/api-auth/ip-rules.ts           # IP 규칙
cat supabase/migrations/039_api_key_security.sql
cat supabase/migrations/041_api_key_ip_rules.sql
```

이미 구현된 것:
- ✅ SHA-256 해싱 (평문 저장 안 함)
- ✅ 213비트 엔트로피 (crypto.getRandomValues)
- ✅ 키 만료 + 해제 (soft delete)
- ✅ 18개 scope + wildcard
- ✅ 키당 rate limit + 월간 할당량
- ✅ IP allowlist/blocklist
- ✅ Fraud detection (middleware 연동 완료)
- ✅ 감사 로깅 (fire-and-forget)
- ✅ 응답에 키 미노출 (prefix만)

---

## 2단계: GAP 목록 확정

| # | GAP | 현재 상태 | 심각도 | 목표 |
|----|-----|----------|--------|------|
| 1 | 타이밍 공격 취약점 | `hash === storedHash` (JS ===는 상수 시간 아님) | 🔴 CRITICAL | crypto.timingSafeEqual 사용 |
| 2 | Rate limiter 서버별 분리 | 인메모리 Map (Vercel 인스턴스별 리셋) | 🔴 CRITICAL | usage_logs 기반 DB fallback 강화 |
| 3 | Fraud detection 서버별 분리 | 인메모리 Map (동일 문제) | 🟡 HIGH | DB 기반 fraud 이벤트 기록 |
| 4 | Fraud 후 자동 키 비활성화 없음 | 차단만 하고 키 유지 | 🟡 HIGH | 5회 fraud → 자동 is_active=false |
| 5 | Sandbox 키 프로덕션 접근 가능 | test 키로 실제 API 호출 가능 | 🟡 MEDIUM | sandbox 키는 실제 DB 조회 차단 |
| 6 | 키 노후화 알림 없음 | 90일+ 키 경고는 요청 시에만 | 🟡 MEDIUM | 주간 Cron으로 만료 임박 키 이메일 |

---

## 3단계: GAP별 수정

**GAP 1: 타이밍 공격 방어 (P0 — 가장 중요)**
- `app/lib/api-auth/keys.ts` 수정
- `lookupApiKey()` 함수에서 해시 비교 부분 교체:
```typescript
// 기존 (취약):
// .eq('key_hash', hash)  ← DB 쿼리 레벨에서 비교 (이건 DB가 처리하므로 OK)

// 추가 검증 레이어 (코드 레벨):
import { timingSafeEqual } from 'crypto';

// DB에서 prefix로 조회 후, 코드에서 hash를 timing-safe 비교
const candidates = await supabase
  .from('api_keys')
  .select('*')
  .eq('key_prefix', prefix)
  .eq('is_active', true)
  .is('revoked_at', null);

for (const candidate of candidates.data || []) {
  try {
    if (timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate.key_hash, 'hex'))) {
      return candidate; // 안전한 매칭
    }
  } catch { continue; }
}
return null;
```
- 핵심: DB의 `=` 연산자도 상수 시간이 아닐 수 있으므로, prefix로 후보 조회 → 코드에서 timing-safe 비교
- hashKey() 함수는 SHA-256이라 출력 길이 고정 (64 hex chars) → timingSafeEqual 안전

**GAP 2: Rate Limiter DB fallback 강화 (P0)**
- `app/lib/api-auth/rate-limiter.ts` 수정
- 기존 인메모리 로직 유지 (빠른 1차 체크, 대부분 여기서 끝남)
- 인메모리 miss 또는 서버 시작 직후 → usage_logs에서 최근 60초 카운트:
```typescript
async function getDbRateCount(keyId: string): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', keyId)
    .gte('created_at', oneMinuteAgo);
  return count || 0;
}
```
- checkRateLimit() 수정: 인메모리 카운트가 0이고 키의 첫 요청이면 → DB 조회
- DB 쿼리 실패 시 → 인메모리만 사용 (fail-open, 가용성 우선)
- 이 방식은 Vercel 인스턴스 재시작 후 즉시 정확한 rate limit 복구

**GAP 3: Fraud Detection DB 기반 (P1)**
- `app/lib/api-auth/fraud-prevention.ts` 수정
- 기존 인메모리 로직 유지 (빠른 1차 탐지)
- fraud risk ≥ 0.5 (의심) 이상인 이벤트만 DB에 기록:
```typescript
async function logFraudEvent(keyId: string, riskScore: number, flags: string[]) {
  await supabase.from('health_check_logs').insert({
    check_type: 'fraud_detection',
    status: riskScore >= 0.8 ? 'fail' : 'warn',
    details: JSON.stringify({ key_id: keyId, risk_score: riskScore, flags }),
    response_time_ms: 0
  }).then(() => {}).catch(() => {});
}
```
- 인메모리 store를 리셋해도 DB에 이력이 남아있어 패턴 추적 가능
- health_check_logs 재활용 (새 테이블 불필요)

**GAP 4: Fraud 후 자동 키 비활성화 (P1)**
- `app/lib/api-auth/fraud-prevention.ts` 수정
- fraud risk ≥ 0.8 (차단) 시:
  1. 요청 차단 (기존)
  2. fraud_strike 카운트 증가 (인메모리 + DB 기록)
  3. 1시간 내 5회 이상 → 자동 키 비활성화:
```typescript
async function autoDisableKey(keyId: string) {
  await supabase
    .from('api_keys')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('id', keyId);
  // 감사 로그
  logKeyAuditEvent(keyId, 'auto_disabled', { reason: 'fraud_threshold_exceeded' });
}
```
- 비활성화된 키는 셀러 대시보드에서 확인 가능 (기존 UI)
- 오탐 방지: 셀러가 수동으로 키 재활성화 가능 (새 키 생성 권장)

**GAP 5: Sandbox 키 격리 (P1)**
- `app/lib/api-auth/middleware.ts` 수정
- sandbox 키 (pk_test_/sk_test_) 판별 후:
  - context.sandbox = true 설정 (기존)
  - 실제 DB 데이터 대신 mock 응답 반환하도록 표시
  - `X-Sandbox-Mode: true` 헤더 추가 (기존)
  - sandbox 키의 rate limit = 10 req/min (프로덕션보다 낮게)
  - sandbox 키의 월간 한도 = 100건 (남용 방지)
- calculate, classify 등 핵심 API에서 `context.sandbox` 체크:
  - sandbox면 실제 DB 조회 대신 샘플 데이터 반환
  - 이미 있는 sandbox 응답 로직 활용, 없으면 `{ sandbox: true, note: "This is test data" }` 추가

**GAP 6: 키 노후화 모니터링 Cron (P2)**
- `app/api/v1/cron/api-key-monitor/route.ts` 신규 생성
- 주간 실행 (Vercel Cron, 매주 월 07:00 UTC)
- 체크 항목:
  1. 90일+ 노후 키 → 셀러에게 이메일 경고
  2. 7일 내 만료 예정 키 → 만료 알림
  3. 30일+ 미사용 키 → "이 키 아직 필요한가요?" 알림
- health_check_logs에 체크 결과 기록
- vercel.json에 cron 추가

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트 (최소 15개)
```
# 타이밍 공격 방어
1. timingSafeEqual로 정상 키 매칭 → PASS
2. timingSafeEqual로 잘못된 키 → FAIL (일정한 시간)
3. 해시 길이 불일치 → graceful FAIL (exception 안 남)

# Rate Limiter DB fallback
4. 인메모리 비어있을 때 → DB에서 카운트 조회
5. 인메모리 있을 때 → DB 미조회
6. DB 쿼리 실패 → 인메모리만 사용 (fail-open)

# Fraud 자동 비활성화
7. fraud risk 0.8 × 5회 → 키 자동 비활성화
8. fraud risk 0.7 × 10회 → 키 유지 (0.8 미만)
9. 비활성화된 키로 요청 → 401 UNAUTHORIZED

# Sandbox 격리
10. pk_test_ 키로 /calculate → sandbox 응답 (실 DB 미조회)
11. pk_test_ 키 rate limit = 10 req/min
12. pk_live_ 키로 /calculate → 정상 응답

# 키 모니터링
13. 91일 된 키 → 노후 경고 대상
14. 6일 후 만료 키 → 만료 알림 대상
15. 31일 미사용 키 → 미사용 알림 대상
```

### 검수 2: 보안 검증
```
- timingSafeEqual이 keys.ts의 해시 비교에 사용되는지
- 에러 메시지에 해시/시크릿 노출 없는지
- fraud 로그에 API 키 전문 기록 안 되는지 (prefix만)
- sandbox 응답에 실제 관세 데이터 포함 안 되는지
- Cron에 CRON_SECRET 인증 있는지
```

### 검수 3: 엣지 케이스
```
- prefix 동일한 키 2개 → timingSafeEqual로 정확한 것만 매칭
- DB에 usage_logs가 비어있을 때 → rate limit 정상 동작
- fraud strike 카운트 중 서버 재시작 → DB에서 이력 조회
- sandbox 키로 webhook 등록 → 차단 또는 경고
- 만료된 키 + fraud strike → 이미 만료이므로 비활성화 불필요
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개
- console.log 0개
- 시크릿/해시가 로그에 노출되는 곳 0개
- 모든 catch 블록에서 민감 정보 미누출
- rate-limiter DB fallback이 fail-open인지 (가용성 우선)
- fraud auto-disable이 감사 로그를 남기는지

---

## 5단계: 완료 조건

아래 전부 충족해야 F125 = 100%:
- [ ] timingSafeEqual로 해시 비교 (타이밍 공격 방어)
- [ ] Rate limiter DB fallback (서버 재시작 시 정확한 카운트)
- [ ] Fraud detection DB 기록 (인메모리 + DB 이중 기록)
- [ ] 5회 fraud → 자동 키 비활성화 + 감사 로그
- [ ] Sandbox 키 격리 (실 DB 미조회 + 낮은 rate limit)
- [ ] 키 모니터링 Cron (노후/만료/미사용 알림)
- [ ] 단위 테스트 15개 PASS
- [ ] 보안 검증 PASS (민감정보 노출 0건)
- [ ] npm run build 통과
- [ ] 엑셀 로그 기록 완료

---

## 6단계: 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
F125 API Key Security: 85% → 100% production upgrade

- 타이밍 공격 방어: crypto.timingSafeEqual로 해시 비교
- Rate limiter DB fallback: usage_logs 기반 서버 재시작 복구
- Fraud detection DB 기록: health_check_logs에 의심 이벤트 저장
- 자동 키 비활성화: 1시간 내 5회 fraud → is_active=false
- Sandbox 격리: test 키 실 DB 미조회 + rate limit 10/min
- 키 모니터링 Cron: 노후(90일+)/만료(7일)/미사용(30일+) 알림
- 단위 테스트 15개 + 보안 검증 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 Sprint 1 전체 완료 보고를 해라. 6개 기능 전부 100% 달성.**
