# CLAUDE_CODE_SPRINT1_6FEATURES_UPGRADE.md
# Sprint 1 나머지 6개 기능 — 프로덕션 수준 업그레이드
# 터미널 2에서 실행 (터미널 1은 은태님+Cowork 작업용)
# 생성: 2026-03-24 KST

---

## 작업 원칙
1. **1개 기능씩 순서대로** — 절대 병렬 진행 금지
2. **5회 검수** — 구현 → 1차검수(코드리뷰) → 2차검수(타입체크) → 3차검수(엣지케이스) → 4차검수(보안) → 5차검수(통합빌드)
3. **npm run build 매 기능 완료 후 필수**
4. **기존 동작하는 코드 깨뜨리지 않기** — regression 테스트
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 기능 1: F006 — Confidence Score (신뢰도 점수)
### 현재 상태: 70% (하드코딩된 mock 데이터)
### 파일: app/lib/classification/confidence-calibration.ts (86줄), app/api/v1/classify/confidence/route.ts (37줄)

### GAP 목록:
- ❌ matchScore 하드코딩 0.92 → 실제 분류 파이프라인 결과에서 가져와야 함
- ❌ feedbackAgreement 0.85 가정 → DB에서 실제 피드백 일치율 조회해야 함
- ❌ dataAge 5일 하드코딩 → last_updated_at에서 실제 계산해야 함
- ❌ hs10Available 문자열 길이 기반 → gov_tariff_schedules 실제 조회해야 함
- ❌ Platt 계수 임의값 → 벤치마크 데이터 기반 보정 필요
- ❌ 신뢰도 점수 DB 저장 없음 → 감사 추적용 저장 필요

### 작업 지시:
```
1. confidence-calibration.ts 전체 코드를 읽어라
2. 하드코딩된 값 5개를 실제 데이터 소스로 교체:
   - matchScore: 분류 파이프라인 결과의 실제 매칭 점수 사용. 캐시 히트면 1.0, 키워드 매칭이면 매칭 비율, LLM이면 LLM 반환 confidence
   - feedbackAgreement: classification_feedback 테이블에서 해당 HS6의 agree/disagree 비율 조회. 데이터 없으면 0.85 기본값 유지
   - dataAge: product_hs_mappings의 updated_at과 현재 시간 차이 계산 (일수)
   - hs10Available: gov_tariff_schedules에서 해당 HS6 + origin_country로 실제 10자리 존재 여부 조회
   - Platt 계수: 현재 값 유지하되, 주석으로 "TODO: 벤치마크 1000건 후 재보정" 명시
3. 신뢰도 결과를 classification_audit 테이블에 저장하는 로직 추가
4. API 응답에 data_sources 필드 추가 (각 점수가 어디서 왔는지 출처 표시)
```

### 5회 검수:
```
검수 1 (코드리뷰): 하드코딩 값이 0개인지 확인. 모든 값이 실제 데이터 소스를 참조하는지
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - DB에 데이터 없는 HS Code로 호출 → 기본값 fallback 동작 확인
  - 잘못된 HS Code 입력 → 에러 핸들링
  - classification_feedback 테이블 비어있을 때 → 0.85 기본값
검수 4 (보안): Supabase RLS 정책 확인, API 키 인증 필요한지 확인
검수 5 (통합): npm run build + 기존 /api/v1/classify 엔드포인트 정상 동작 확인
```

---

## 기능 2: F012 — HS Code Validation (HS 코드 검증)
### 현재 상태: 85% (HS_DATABASE 스텁, 국가 제한)
### 파일: app/lib/cost-engine/hs-code/hs-validator.ts (223줄), app/api/v1/validate/route.ts (152줄), app/api/v1/validate/hs-code/route.ts (32줄)

### GAP 목록:
- ❌ HS_DATABASE 스텁 — './hs-database' 파일이 실제로 없음
- ❌ 교차국가 검증 없음 — US HTS vs EU CN vs UK 비교 불가
- ❌ 폐지 코드 자동 마이그레이션 경로 없음
- ❌ 7개국만 국가별 검증 가능 (나머지 233국 결과 없음)

### 작업 지시:
```
1. hs-validator.ts 전체 코드를 읽어라
2. HS_DATABASE 참조를 실제 데이터로 교체:
   - gov_tariff_schedules 테이블에서 HS6→HS10 매핑 조회
   - 없는 HS6는 WCO 97 Chapter의 heading-descriptions.ts 기준으로 존재 여부 확인
   - HS_DATABASE import를 제거하고 인라인 로직 또는 실제 DB 조회로 대체
3. 교차국가 검증 추가:
   - 입력 HS6 + country → gov_tariff_schedules에서 해당 국가 HS10 존재 확인
   - 7개국(US/EU/UK/KR/JP/AU/CA)은 정확한 10자리 검증
   - 나머지 233국은 6자리 유효성만 검증 (WCO 기준) + "이 국가는 6자리까지만 검증 가능" 메시지
4. HS 2017→2022 마이그레이션 경로:
   - 폐지 코드 감지 시 → 대체 코드 제안 (hs_correlation 테이블 또는 하드코딩 주요 변경)
```

### 5회 검수:
```
검수 1 (코드리뷰): HS_DATABASE import 완전 제거 확인. 모든 검증 경로가 실데이터 참조
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - "999999" (존재하지 않는 코드) → 적절한 에러
  - "8471300000" (US 10자리) + country=US → 유효
  - "8471300000" + country=KR → 한국 10자리 형식으로 재검증
  - "847130" (6자리) + country=NG (나이지리아) → 6자리 유효 + 국가 제한 메시지
검수 4 (보안): SQL 인젝션 방지, 입력값 sanitization
검수 5 (통합): npm run build + /api/v1/validate 정상 동작 + 기존 분류 API 영향 없음
```

---

## 기능 3: F046 — Webhook System (웹훅 시스템)
### 현재 상태: 50% (Shopify/Paddle OK, BigCommerce 스텁, 재시도 없음)
### 파일: app/api/shopify/webhooks/route.ts (100줄), app/api/billing/webhook/route.ts (222줄), plugins/bigcommerce/src/webhook.ts (72줄)

### GAP 목록:
- ❌ BigCommerce 웹훅 미완성 (서명 검증 없음, 이벤트 타입 처리 없음)
- ❌ 재시도 메커니즘 없음 (실패 시 유실)
- ❌ 멱등성 없음 (중복 이벤트 이중 처리 가능)
- ❌ 웹훅 이벤트 로그 없음

### 작업 지시:
```
1. 세 개 웹훅 파일 모두 읽어라
2. BigCommerce 웹훅 완성:
   - HMAC-SHA256 서명 검증 추가 (BigCommerce는 X-Webhook-Signature 헤더)
   - 이벤트 타입 라우팅: store/order/created, store/product/updated 등
   - Shopify 웹훅과 동일 패턴 적용
3. 멱등성 추가 (모든 웹훅 공통):
   - 이벤트 ID 기반 중복 감지 (webhook_event_log 테이블에 event_id unique)
   - 이미 처리된 event_id면 200 OK 반환하되 로직 실행 안 함
4. 웹훅 이벤트 로그:
   - webhook_event_log 테이블 필요 (event_id, source, topic, payload_hash, status, processed_at, error_message)
   - 성공/실패 모두 기록
5. 재시도는 구현하지 않음 — 웹훅은 발신측(Shopify/Paddle/BigCommerce)이 재시도 책임
   - 대신 실패 시 health_check_logs에 기록하여 Morning Brief에서 감지
```

### 5회 검수:
```
검수 1 (코드리뷰): BigCommerce 서명 검증이 Shopify와 동일 수준인지. 멱등성 로직 정확성
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - 같은 event_id로 2번 호출 → 첫번째만 처리, 두번째 200 OK (중복 무시)
  - 잘못된 서명 → 401 Unauthorized (세 플랫폼 모두)
  - payload 없이 호출 → 400 Bad Request
검수 4 (보안): 서명 검증에 timing-safe comparison 사용 확인 (crypto.timingSafeEqual)
검수 5 (통합): npm run build + Shopify/Paddle 기존 웹훅 동작 깨지지 않음 확인
```

---

## 기능 4: F052 — API Authentication (API 인증)
### 현재 상태: 80% (키 관리 + rate limit OK, 회전/스코핑 없음)
### 파일: app/lib/api-auth/middleware.ts (186줄), app/lib/api-auth/keys.ts (221줄), app/api/v1/sellers/keys/route.ts (142줄), app/api/v1/sellers/keys/revoke/route.ts (72줄)

### GAP 목록:
- ❌ 키 자동 만료 없음 (키가 영원히 유효)
- ❌ IP 화이트리스트 없음
- ❌ 키 스코핑 없음 (모든 키가 모든 엔드포인트 접근)
- ⚠️ Rate limiter가 인메모리 (서버 인스턴스 간 미공유)

### 작업 지시:
```
1. keys.ts와 middleware.ts 전체 코드를 읽어라
2. 키 만료 추가:
   - api_keys 테이블에 expires_at 컬럼 (nullable — null이면 영구)
   - 키 생성 시 expires_in 옵션 (7d, 30d, 90d, 365d, never)
   - lookupApiKey에서 expires_at 체크 → 만료 시 401 + "API key expired" 메시지
   - 만료 7일 전 경고 헤더: X-API-Key-Expires-In: 7d
3. 키 스코핑 (기본만):
   - api_keys 테이블에 scopes 컬럼 (text[], 기본값 ['*'])
   - 스코프 종류: 'calculate', 'classify', 'validate', 'screen', 'admin'
   - middleware에서 요청 경로 → 스코프 매칭
   - 키 생성 시 scopes 옵션 (기본 ['*'] = 전체 접근)
4. IP 화이트리스트는 구현하지 않음 — Enterprise 고객 생긴 후 추가
5. Rate limiter 인메모리 유지 — Vercel serverless에서 Redis 없이 최선의 방법
   - 대신 주석으로 "TODO: Redis 도입 시 교체" 명시
```

### 5회 검수:
```
검수 1 (코드리뷰): expires_at 체크가 모든 인증 경로에 포함되는지. 스코프 매칭 로직 정확성
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - 만료된 키로 호출 → 401 "API key expired"
  - scopes=['classify']인 키로 /calculate 호출 → 403 Forbidden
  - scopes=['*']인 키 → 모든 엔드포인트 정상
  - expires_at=null인 키 → 영구 유효
검수 4 (보안): 만료 체크가 bypasable하지 않은지. 스코프 체크가 미들웨어에서 강제되는지
검수 5 (통합): npm run build + 기존 API 키 동작 깨지지 않음 (기존 키는 scopes=['*'], expires_at=null로 처리)
```

---

## 기능 5: F093 — Webhook Security (웹훅 보안)
### 현재 상태: 85% (HMAC 검증 OK, timestamp 검증 없음)
### 파일: app/api/billing/webhook/route.ts (Paddle), app/api/shopify/webhooks/route.ts (Shopify)

### GAP 목록:
- ❌ Paddle timestamp 신선도 검증 없음 (replay attack 가능)
- ❌ 웹훅 이벤트 실패/성공 로그 없음 (F046에서 해결)
- ❌ BigCommerce 서명 없음 (F046에서 해결)
- ⚠️ 웹훅 rate limiting 없음

### 작업 지시:
```
1. billing/webhook/route.ts의 verifyPaddleSignature 함수를 읽어라
2. Paddle timestamp 신선도 검증 추가:
   - ts 추출 후 현재 시간과 비교
   - 5분(300초) 이상 차이나면 거부 → 401 "Webhook timestamp too old"
   - 이유: replay attack 방지
3. Shopify 웹훅에도 동일 적용:
   - x-shopify-hmac-sha256 검증 후, Shopify 웹훅은 X-Shopify-Api-Version 헤더의 timestamp는 없지만
   - Shopify는 자체적으로 5초 내 재시도하므로 timestamp 검증 불필요 → 스킵
4. 웹훅 rate limiting:
   - 같은 IP에서 분당 100회 초과 시 429 Too Many Requests
   - 인메모리 카운터 (간단한 Map + setInterval 정리)
5. F046에서 이미 처리되는 항목 (이벤트 로그, BigCommerce)은 중복 작업하지 않음
```

### 5회 검수:
```
검수 1 (코드리뷰): timestamp 검증 로직이 정확한지. 300초 기준 적절한지
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - 6분 전 timestamp의 Paddle 웹훅 → 거부
  - 현재 timestamp의 Paddle 웹훅 → 통과
  - timestamp 없는 웹훅 → 거부
  - 분당 101번째 같은 IP → 429
검수 4 (보안): timing-safe comparison 여전히 사용 중 확인. replay window 300초가 적절한지 (Paddle 공식 문서 확인)
검수 5 (통합): npm run build + Paddle 웹훅 기존 동작 정상 + Shopify 웹훅 영향 없음
```

---

## 기능 6: F125 — API Key Security (API 키 보안)
### 현재 상태: 60% (Revocation OK, 회전/스코핑 없음)
### 파일: app/lib/api-auth/keys.ts, app/api/v1/sellers/keys/route.ts, app/api/v1/sellers/keys/revoke/route.ts

### GAP 목록:
- ❌ 자동 키 회전 없음
- ❌ 스코핑 없음 (F052에서 해결)
- ❌ 사용량 알림 없음
- ❌ 키 버전 관리 없음
- ⚠️ 오래된 키 경고 없음

### 작업 지시:
```
1. keys.ts와 sellers/keys/route.ts 전체 코드를 읽어라
2. F052에서 이미 구현된 항목 확인:
   - expires_at (키 만료) → F052에서 완료
   - scopes (키 스코핑) → F052에서 완료
3. 키 회전 API 추가:
   - POST /api/v1/sellers/keys/rotate — 기존 키 비활성화 + 새 키 생성 (atomic)
   - 기존 키는 즉시 비활성화가 아닌 grace_period (기본 24시간) 후 비활성화
   - 응답: { newKey: "sk_live_...", oldKeyExpiresAt: "2026-03-25T..." }
   - 이유: 고객이 새 키로 교체할 시간 확보
4. 키 사용량 알림 (기본):
   - api_keys 테이블에 daily_usage_count, last_alert_at 컬럼
   - 일일 사용량이 할당량 80% 초과 시 → health_check_logs에 경고 기록
   - 실제 이메일 알림은 구현하지 않음 (Morning Brief에서 감지)
5. 오래된 키 경고:
   - 키 생성 후 90일 이상 → API 응답 헤더에 X-API-Key-Age-Warning: "Key is 90+ days old, consider rotating"
```

### 5회 검수:
```
검수 1 (코드리뷰): 키 회전이 atomic인지 (새 키 생성 실패 시 기존 키 유지). grace period 로직 정확성
검수 2 (타입체크): npm run build — TypeScript 에러 0개
검수 3 (엣지케이스):
  - 회전 후 grace period 내 기존 키 사용 → 정상 동작
  - grace period 만료 후 기존 키 → 401
  - 90일 된 키로 호출 → X-API-Key-Age-Warning 헤더 존재
  - 새 키로 호출 → 경고 없음
검수 4 (보안): 키 회전 시 기존 키 해시가 DB에서 완전 비활성화되는지. grace period 조작 불가한지
검수 5 (통합): npm run build + 기존 키 관리 동작 깨지지 않음 + F052 스코핑과 충돌 없음
```

---

## 최종 통합 검수

```
모든 6개 기능 완료 후:

1. npm run build — 전체 빌드 성공 확인
2. 기존 12 TLC API 정상 동작 확인:
   - /api/v1/calculate (Landed Cost)
   - /api/v1/classify (HS Code)
   - /api/v1/screen (Sanctions)
3. 새로 추가/수정된 엔드포인트 전체 테스트:
   - /api/v1/classify/confidence
   - /api/v1/validate
   - /api/v1/sellers/keys (생성/조회/회전/삭제)
4. DB 마이그레이션 필요 시:
   - webhook_event_log 테이블 생성
   - api_keys 테이블에 expires_at, scopes, daily_usage_count, last_alert_at 컬럼 추가
5. 엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx에 전체 결과 기록

git add -A && git commit -m "upgrade: Sprint 1 remaining 6 features to production level — F006 confidence score, F012 HS validation, F046 webhook system, F052 API auth, F093 webhook security, F125 API key security

- F006: Replace hardcoded mock data with real DB sources
- F012: Fix HS_DATABASE stub, add cross-country validation
- F046: Complete BigCommerce webhooks, add idempotency + event logging
- F052: Add key expiration + endpoint scoping
- F093: Add Paddle timestamp freshness check + rate limiting
- F125: Add key rotation API + usage warnings

5-round verification per feature, npm run build passing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" && git push
```
