# F046 Webhook System — 85% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F046)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고 현재 상태를 정리해라:

```bash
cat app/lib/monitoring/webhook-event-log.ts          # 69줄 — 이벤트 로깅 + 멱등성
cat app/api/billing/webhook/route.ts                  # 238줄 — Paddle webhook handler
cat app/api/shopify/webhooks/route.ts                 # 107줄 — Shopify GDPR webhooks
cat plugins/bigcommerce/src/webhook.ts                # 121줄 — BigCommerce webhook
cat app/lib/shopify/shopify-auth.ts                   # 328줄 — Shopify HMAC 검증
cat app/lib/cost-engine/hs-code/types.ts              # 타입 정의 참조
```

분석할 것:
- 인바운드 webhook (Paddle/Shopify/BigCommerce) 현재 동작 상태
- 아웃바운드 webhook 전송 로직 존재 여부
- /api/v1/webhooks CRUD 엔드포인트 존재 여부
- 재시도(retry) 메커니즘 존재 여부
- 배달 추적(delivery tracking) 존재 여부
- webhook-event-log.ts의 logWebhookEvent / checkIdempotency 사용처

---

## 2단계: GAP 목록 확정

| # | GAP | 현재 상태 | 목표 |
|----|-----|----------|------|
| 1 | 아웃바운드 webhook 전송 로직 없음 | webhookUrl 저장만, 실제 전송 코드 0줄 | 이벤트 발생 시 등록된 URL로 POST 전송 |
| 2 | /api/v1/webhooks CRUD 엔드포인트 없음 | 엔드포인트 0개 | GET/POST/PUT/DELETE 4개 엔드포인트 |
| 3 | 재시도 메커니즘 없음 | 실패 시 무시 | 지수 백오프 재시도 (최대 5회, 1s→2s→4s→8s→16s) |
| 4 | 배달 추적/히스토리 없음 | 로그 없음 | webhook_deliveries 테이블에 전송 기록 저장 |
| 5 | 인바운드 webhook 서명 검증 불일치 | Paddle raw body, Shopify HMAC, BigCommerce 각각 다른 패턴 | 공통 검증 유틸리티 + 일관된 에러 응답 |
| 6 | webhook-event-log.ts 미사용 | logWebhookEvent/checkIdempotency 정의만 있고 import 안 됨 | 실제 webhook handler에서 사용 |

---

## 3단계: GAP별 수정

**GAP 1: 아웃바운드 webhook 전송 (P0)**
- `app/lib/webhooks/webhook-sender.ts` 신규 생성
- 핵심 함수: `sendWebhookEvent(sellerId, eventType, payload)`
  - seller의 등록된 webhookUrl 조회
  - HMAC-SHA256 서명 생성 (X-Webhook-Signature 헤더)
  - POST 요청 전송 (timeout 10초)
  - 성공/실패 결과 webhook_deliveries에 기록
  - 실패 시 재시도 큐에 추가
- 지원 이벤트 타입:
  - `calculation.completed` — TLC 계산 완료
  - `classification.completed` — HS 분류 완료
  - `subscription.updated` — 구독 변경
  - `usage.threshold` — 사용량 임계치 도달 (80%, 100%)
- 페이로드 구조:
```typescript
{
  id: string,           // 고유 이벤트 ID (UUID)
  type: string,         // 이벤트 타입
  created_at: string,   // ISO 8601
  data: object,         // 이벤트별 데이터
  seller_id: string
}
```

**GAP 2: /api/v1/webhooks CRUD (P0)**
- `app/api/v1/webhooks/route.ts` 신규 생성
  - GET: 셀러의 등록된 webhook 목록 조회
  - POST: 새 webhook URL 등록 (URL + 이벤트 타입 배열 + secret 자동 생성)
- `app/api/v1/webhooks/[id]/route.ts` 신규 생성
  - GET: 특정 webhook 상세 조회
  - PUT: webhook URL 또는 이벤트 타입 수정
  - DELETE: webhook 삭제
- 인증: X-API-Key 기반 (기존 패턴 따름)
- 응답 스키마:
```typescript
{
  id: string,
  url: string,
  events: string[],
  secret: string,      // HMAC 서명용 시크릿 (생성 시 1회만 표시)
  active: boolean,
  created_at: string,
  updated_at: string
}
```

**GAP 3: 재시도 메커니즘 (P0)**
- `app/lib/webhooks/webhook-retry.ts` 신규 생성
- 지수 백오프: 1초 → 2초 → 4초 → 8초 → 16초 (최대 5회)
- 재시도 조건: HTTP 5xx 또는 타임아웃 (4xx는 재시도 안 함)
- 5회 실패 시 webhook status를 'failed'로 마킹 + 셀러에게 이메일 알림 (선택)
- 구현 방식: 인메모리 큐 (Vercel serverless 환경이라 별도 큐 서비스 불필요, 즉시 재시도)
- 재시도 간 결과 모두 webhook_deliveries에 기록

**GAP 4: 배달 추적 (P1)**
- `webhook_deliveries` 테이블 생성 (마이그레이션 SQL):
```sql
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','retrying')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
```
- `/api/v1/webhooks/[id]/deliveries` GET 엔드포인트 추가 — 배달 히스토리 조회 (최근 100건)

**GAP 5: 인바운드 서명 검증 통일 (P1)**
- `app/lib/webhooks/webhook-verify.ts` 신규 생성
- 공통 함수:
  - `verifyPaddleSignature(rawBody, signature, secret)` — ts-verify 사용
  - `verifyShopifyHmac(rawBody, hmac, secret)` — HMAC-SHA256
  - `verifyBigCommerceSignature(rawBody, signature, secret)` — HMAC-SHA256
- 기존 각 handler에서 인라인 검증 → 공통 유틸리티 호출로 교체
- 검증 실패 시 일관된 응답: `{ error: "Invalid signature", status: 401 }`

**GAP 6: webhook-event-log.ts 실제 연동 (P2)**
- 기존 `logWebhookEvent()` + `checkIdempotency()`를 실제 handler에 import
- Paddle webhook handler: 이벤트 수신 시 idempotency 체크 → 중복 무시
- Shopify webhook handler: 동일
- 아웃바운드 전송 시에도 logWebhookEvent() 호출

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트 (최소 15개)
```
# CRUD 테스트
1. POST /api/v1/webhooks {url, events} → 201 + webhook 객체 + secret
2. GET /api/v1/webhooks → 등록된 webhook 목록
3. GET /api/v1/webhooks/[id] → 특정 webhook 상세
4. PUT /api/v1/webhooks/[id] {url} → 업데이트 확인
5. DELETE /api/v1/webhooks/[id] → 204, 이후 GET 시 404

# 아웃바운드 전송 테스트
6. sendWebhookEvent() 호출 → 등록된 URL로 POST 전송 확인
7. HMAC-SHA256 서명 검증 — 수신 측에서 서명 일치 확인
8. 페이로드 구조 검증 — id, type, created_at, data 필드 존재

# 재시도 테스트
9. 5xx 응답 시 재시도 트리거 확인
10. 4xx 응답 시 재시도 안 함 확인
11. 5회 실패 후 status='failed' 마킹 확인
12. 지수 백오프 간격 확인 (1s, 2s, 4s, 8s, 16s)

# 배달 추적 테스트
13. 전송 후 webhook_deliveries에 기록 확인
14. GET /api/v1/webhooks/[id]/deliveries → 배달 히스토리

# 서명 검증 테스트
15. 잘못된 서명으로 인바운드 webhook → 401 응답
```

### 검수 2: API 응답 검증
```
- POST /api/v1/webhooks → webhook 생성 + secret 반환
- GET /api/v1/webhooks → 목록 (secret 마스킹)
- PUT /api/v1/webhooks/[id] → 업데이트
- DELETE /api/v1/webhooks/[id] → 삭제
- GET /api/v1/webhooks/[id]/deliveries → 배달 히스토리
- 인증 없이 호출 → 401
```

### 검수 3: 엣지 케이스
```
- URL이 빈 문자열 → 400 에러
- URL이 http:// (HTTPS 아님) → 경고 또는 거부
- events 배열이 빈 배열 → 400 에러
- events에 지원하지 않는 타입 → 400 에러
- 존재하지 않는 webhook ID → 404
- 다른 셀러의 webhook 접근 시도 → 403
- webhook URL이 localhost → 거부
- 동일 URL 중복 등록 → 409 또는 허용 (정책 결정)
- 페이로드가 1MB 초과 → 적절한 처리
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개 확인
- 하드코딩된 매직넘버 0개 확인 (상수명 필수)
- console.log 0개 확인
- HMAC secret이 코드에 하드코딩되지 않았는지 확인
- 모든 엔드포인트에 인증 체크 있는지 확인
- webhook-event-log.ts가 실제 사용되는지 확인

---

## 5단계: 완료 조건

아래 전부 충족해야 F046 = 100%:
- [ ] 아웃바운드 webhook 전송 로직 구현 (sendWebhookEvent)
- [ ] /api/v1/webhooks CRUD 4개 엔드포인트 동작
- [ ] /api/v1/webhooks/[id]/deliveries 배달 히스토리 조회
- [ ] 지수 백오프 재시도 (최대 5회) 구현
- [ ] webhook_deliveries 테이블 생성 + 기록 동작
- [ ] HMAC-SHA256 서명 생성/검증 통일
- [ ] webhook-event-log.ts 실제 연동
- [ ] 인바운드 서명 검증 공통 유틸리티
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
F046 Webhook System: 85% → 100% production upgrade

- 아웃바운드 webhook 전송 로직 구현 (HMAC-SHA256 서명)
- /api/v1/webhooks CRUD 엔드포인트 (GET/POST/PUT/DELETE)
- 지수 백오프 재시도 (최대 5회, 1s→2s→4s→8s→16s)
- webhook_deliveries 테이블 + 배달 히스토리 API
- 인바운드 서명 검증 공통 유틸리티
- webhook-event-log.ts 실제 연동
- 단위 테스트 15개 + 엣지 케이스 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 보고하고, 다음 기능(F052) 명령어를 기다려라. 절대 다음 기능을 스스로 시작하지 마라.**
