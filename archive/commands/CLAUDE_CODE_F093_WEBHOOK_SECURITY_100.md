# F093 Webhook Security — 70% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F093)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고 현재 상태를 정리해라:

```bash
cat app/lib/webhooks/webhook-verify.ts        # 96줄 — HMAC 검증 (4개 provider)
cat app/lib/webhooks/webhook-sender.ts         # 253줄 — 아웃바운드 전송
cat app/api/v1/webhooks/route.ts               # 98줄 — webhook 등록
cat app/api/v1/webhooks/[id]/route.ts          # 107줄 — webhook 관리
cat app/api/billing/webhook/route.ts           # 239줄 — Paddle 인바운드
cat app/api/shopify/webhooks/route.ts          # 107줄 — Shopify 인바운드
cat plugins/bigcommerce/src/webhook.ts         # 122줄 — BigCommerce 인바운드
cat app/lib/monitoring/webhook-event-log.ts    # 70줄 — 멱등성 체크
cat supabase/migrations/040_webhook_system.sql # 스키마
```

이미 구현된 것:
- ✅ HMAC-SHA256 서명 (Paddle/Shopify/BigCommerce/POTAL 4개)
- ✅ timing-safe comparison (crypto.timingSafeEqual)
- ✅ Paddle 타임스탬프 검증 (5분)
- ✅ HTTPS 강제 + localhost 차단
- ✅ 10초 요청 타임아웃 + 지수 백오프 재시도
- ✅ 멱등성 체크 (health_check_logs 기반)
- ✅ whsec_ 접두사 시크릿 (crypto.randomBytes 24바이트)

---

## 2단계: GAP 목록 확정

| # | GAP | 현재 상태 | 심각도 | 목표 |
|----|-----|----------|--------|------|
| 1 | Shopify/BigCommerce/POTAL 타임스탬프 검증 없음 | Paddle만 5분 체크 | 🔴 HIGH | 4개 전부 리플레이 방어 |
| 2 | Private IP 차단 없음 | localhost만 차단, 10.x/172.16.x/192.168.x 허용 | 🟡 MEDIUM-HIGH | RFC 1918 사설 IP + 링크로컬 전체 차단 |
| 3 | 요청 페이로드 크기 제한 없음 | 무제한 | 🟡 MEDIUM | 최대 1MB 제한 |
| 4 | 멱등성 테이블 부적절 | health_check_logs 사용 (race condition 가능) | 🟡 MEDIUM | 전용 unique constraint로 원자적 중복 방지 |
| 5 | Webhook 수신 rate limit 없음 | 무제한 수신 | 🟡 MEDIUM | 셀러당 분당 100건 제한 |
| 6 | Secret 로테이션 불가 | 한 번 생성 후 변경 불가 | 🟡 MEDIUM | 새 시크릿 생성 + 기존 24시간 유예 |

---

## 3단계: GAP별 수정

**GAP 1: 모든 Provider 타임스탬프 검증 (P0)**
- `app/lib/webhooks/webhook-verify.ts` 수정
- Shopify: 요청 헤더 `X-Shopify-Webhook-Id` 존재 확인 + body 내 `created_at` 또는 커스텀 타임스탬프 체크. Shopify는 공식 타임스탬프 헤더가 없으므로 → 대안: 수신 시각 기준 5분 이내 체크 (이벤트 수신 시각 - 현재 시각)가 아닌, **멱등성 키(X-Shopify-Webhook-Id) + 이벤트 로그 시간 비교**로 리플레이 방어
- BigCommerce: payload의 `created_at` 필드 (Unix timestamp) → 5분 이내인지 체크
- POTAL 아웃바운드: 페이로드에 `timestamp` 필드 추가 (ISO 8601) + 수신 측에서 5분 이내 체크 권장 문서화. 아웃바운드 서명 시 `X-Webhook-Timestamp` 헤더 추가
- 검증 함수에 MAX_AGE_SECONDS = 300 상수 공유

**GAP 2: Private IP + 위험 도메인 차단 (P0)**
- `app/api/v1/webhooks/route.ts` 수정 — URL 검증 강화
- 차단할 IP 범위:
```typescript
function isPrivateIp(ip: string): boolean {
  // IPv4 private ranges
  if (/^10\./.test(ip)) return true;                    // 10.0.0.0/8
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true; // 172.16.0.0/12
  if (/^192\.168\./.test(ip)) return true;              // 192.168.0.0/16
  if (/^127\./.test(ip)) return true;                   // 127.0.0.0/8
  if (/^169\.254\./.test(ip)) return true;              // 169.254.0.0/16 (link-local)
  if (/^0\./.test(ip)) return true;                     // 0.0.0.0/8
  // IPv6 private
  if (/^(fc|fd)/i.test(ip)) return true;                // Unique local
  if (/^fe80/i.test(ip)) return true;                   // Link-local
  if (ip === '::1') return true;                        // Loopback
  return false;
}
```
- URL에서 hostname 추출 → DNS 해결 없이 IP 패턴 매칭 (hostname이 IP면 직접 체크)
- hostname이 도메인이면: `*.local`, `*.internal`, `*.localhost` 차단
- URL 길이 제한: 2048자 초과 거부

**GAP 3: 페이로드 크기 제한 (P0)**
- `app/lib/webhooks/webhook-sender.ts` 수정 — 아웃바운드 응답 크기 제한
  - 응답 body 읽을 때 1MB 초과 시 중단 (stream 방식 또는 Content-Length 체크)
- 인바운드 webhook handler 수정 — 수신 body 크기 제한
  - Paddle/Shopify/BigCommerce handler에서 request body 1MB 초과 시 413 Payload Too Large 응답
  - `const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024; // 1MB`
  - body를 text로 읽은 후 length 체크

**GAP 4: 멱등성 강화 (P1)**
- `app/lib/monitoring/webhook-event-log.ts` 수정
- 기존 health_check_logs 쿼리를 UPSERT 패턴으로 변경:
  - `INSERT ... ON CONFLICT DO NOTHING` → 반환값이 null이면 이미 처리된 이벤트
  - 또는: health_check_logs에 `UNIQUE(check_type, details)` 부분 인덱스 추가 (webhook_event_ 타입만)
- 마이그레이션:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_event_idempotency
ON health_check_logs(check_type, details)
WHERE check_type LIKE 'webhook_event_%';
```
- 이렇게 하면 race condition에서도 하나만 성공, 나머지는 conflict → 중복 처리 방지

**GAP 5: 인바운드 Webhook Rate Limit (P1)**
- `app/lib/webhooks/webhook-rate-limit.ts` 신규 생성
- 인메모리 Map<sellerId, { count, windowStart }>
- 셀러당 분당 100건 제한 (슬라이딩 윈도우)
- 초과 시 429 Too Many Requests 응답
- 각 인바운드 handler (Paddle, Shopify, BigCommerce) 시작부에 체크 추가
- POTAL 아웃바운드도 셀러당 분당 100건 전송 제한

**GAP 6: Secret 로테이션 (P1)**
- `app/api/v1/webhooks/[id]/rotate/route.ts` 신규 생성
- POST /api/v1/webhooks/[id]/rotate → 새 시크릿 생성
- 기존 시크릿은 `previous_secret` 컬럼에 저장, `secret_rotated_at` 타임스탬프 기록
- 24시간 유예 기간: 검증 시 새 시크릿으로 먼저 체크 → 실패하면 이전 시크릿으로 체크
- 24시간 후 `previous_secret` = NULL (정리)
- 마이그레이션:
```sql
ALTER TABLE seller_webhooks ADD COLUMN IF NOT EXISTS previous_secret TEXT;
ALTER TABLE seller_webhooks ADD COLUMN IF NOT EXISTS secret_rotated_at TIMESTAMPTZ;
```
- webhook-verify.ts의 verifyPotalSignature에 dual-secret 검증 로직 추가

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트 (최소 15개)
```
# 타임스탬프 검증
1. Paddle 정상 타임스탬프 (현재-30초) → PASS
2. Paddle 만료 타임스탬프 (현재-6분) → FAIL
3. BigCommerce created_at 정상 → PASS
4. BigCommerce created_at 만료 → FAIL
5. POTAL 아웃바운드 X-Webhook-Timestamp 포함 확인

# Private IP 차단
6. https://10.0.0.1/webhook → 400 차단
7. https://192.168.1.100/webhook → 400 차단
8. https://172.16.0.1/webhook → 400 차단
9. https://api.example.com/webhook → 200 허용
10. URL 2049자 → 400 차단

# 페이로드 크기
11. 500KB 페이로드 → 정상 처리
12. 2MB 페이로드 → 413 거부

# 멱등성
13. 동일 이벤트 ID 2회 → 2번째 무시 확인

# Rate Limit
14. 101번째 요청 → 429 응답

# Secret 로테이션
15. POST /webhooks/[id]/rotate → 새 시크릿 + 기존 시크릿 유예
```

### 검수 2: 보안 검증
```
- timing-safe comparison이 모든 검증 함수에 있는지
- 에러 메시지에 시크릿/서명 값이 노출되지 않는지
- 로그에 민감 정보(시크릿, 페이로드)가 평문으로 기록되지 않는지
- Private IP regex가 모든 RFC 1918 범위를 커버하는지
```

### 검수 3: 엣지 케이스
```
- IPv6 사설 주소 (fd00::1) → 차단
- URL이 IP 직접 입력 (https://203.0.113.1/hook) → 허용 (공인 IP)
- BigCommerce created_at가 0 또는 음수 → 거부
- Content-Length 헤더 없는 큰 요청 → body 읽으면서 크기 체크
- Secret 로테이션 직후 이전 시크릿으로 서명한 요청 → 유예 기간 내 허용
- 유예 기간 만료 후 이전 시크릿 → 거부
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개
- console.log 0개
- 시크릿이 에러 메시지/로그에 노출되는 곳 0개
- catch 블록에서 시크릿 정보 누출 없는지
- 모든 인바운드 handler에 크기 제한 + rate limit 있는지

---

## 5단계: 완료 조건

아래 전부 충족해야 F093 = 100%:
- [ ] 4개 provider 전부 리플레이 공격 방어 (타임스탬프/멱등성)
- [ ] Private IP 전체 차단 (10.x, 172.16-31.x, 192.168.x, 링크로컬, IPv6)
- [ ] 페이로드 크기 1MB 제한 (인바운드 + 아웃바운드 응답)
- [ ] 멱등성 unique index 추가 (race condition 방지)
- [ ] 인바운드 webhook rate limit (셀러당 100건/분)
- [ ] Secret 로테이션 API + dual-secret 검증 + 24시간 유예
- [ ] 단위 테스트 15개 PASS
- [ ] 보안 검증 PASS (민감정보 노출 0건)
- [ ] npm run build 통과
- [ ] 엑셀 로그 기록 완료

---

## 6단계: 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
F093 Webhook Security: 70% → 100% production upgrade

- 리플레이 공격 방어: Shopify/BigCommerce/POTAL 타임스탬프 검증 추가
- SSRF 방어: RFC 1918 사설 IP + 링크로컬 + IPv6 ULA 전체 차단
- DoS 방어: 페이로드 1MB 제한 + 셀러당 100건/분 rate limit
- 멱등성 강화: webhook_event unique index (race condition 방지)
- Secret 로테이션: POST /webhooks/[id]/rotate + 24시간 dual-secret 유예
- 단위 테스트 15개 + 보안 검증 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 보고하고, 다음 기능(F125) 명령어를 기다려라. 절대 다음 기능을 스스로 시작하지 마라.**
