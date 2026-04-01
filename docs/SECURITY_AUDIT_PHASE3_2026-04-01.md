# POTAL 보안 감사 Phase 3 — 외부 접근 가능 경로 전수 점검
> 작성: 2026-04-01 KST | 방법: 소스코드 직접 읽기 + 실제 코드 검증

---

## 요약

| 등급 | 건수 |
|------|------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 4 |
| INFO | 3 |
| PASS | 6 |

Phase 1(RLS)과 Phase 2(소스코드)에서 CRITICAL 취약점을 수정한 덕분에 Phase 3에서는 CRITICAL 없음.
주요 발견: 인증 없는 AI API 엔드포인트(비용 남용), API 키 전문 노출, rate limiting 부재.

---

## 1. 전체 라우트 맵

### 페이지 라우트 (48개)

**인증 필요 페이지 (6개):**
| 경로 | 인증 방식 | 비인증 시 동작 |
|------|---------|-------------|
| `/account` | Supabase session | 게스트 상태 표시 |
| `/settings` | Supabase session | 로그인 모달 |
| `/profile` | Supabase session | 로그인 모달 |
| `/dashboard` | Supabase session | 클라이언트 체크 |
| `/auth/complete-profile` | Supabase session | 빈 폼 렌더링 |
| `/community/new` | Supabase session | 리다이렉트 |

**공개 페이지 (42개):** 홈, about, features, pricing, partners, legal, blog, search, auth, FAQ, help, developers, community(목록/상세), widget demo, tariff 등

**관리 페이지 (2개):**
| 경로 | 인증 방식 | 문제 |
|------|---------|------|
| `/admin/division-status` | URL hash (`#secret`) | H-4 참조 |
| `/admin/intelligence` | URL hash (`#secret`) | H-4 참조 |

### API 라우트 (100+개)

**인증 방식별 분류:**
- `withApiAuth` (API 키 필수): ~85개 — 정상
- `CRON_SECRET` (Bearer 헤더): ~24개 — Phase 2에서 수정 완료
- `Supabase session`: ~10개 — 정상
- `POTAL_ADMIN_KEY`: 2개 (tariffs, cache) — H-5 참조
- **인증 없음: 8개** — 아래 상세

---

## 2. 발견 사항

### HIGH

---

#### H-4: 인증 없는 AI API 엔드포인트 (비용 남용 위험)

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `app/api/intent/route.ts:14`, `app/api/ai-suggestions/route.ts`, `app/api/generate-filters/route.ts`, `app/api/search/analyze/route.ts` |
| 문제 | POST 요청에 인증 없음. OpenAI API 호출이 포함된 엔드포인트가 완전 공개 |
| 검증 | 각 파일 읽기 — `withApiAuth` 래퍼 없음, API key/session 체크 없음 |
| 영향 | 외부에서 무제한 요청 → OpenAI API 비용 폭증. `/api/search/analyze`는 Vision API 호출 (가장 비쌈) |
| 비고 | **B2C 코드** (CLAUDE.md 절대규칙 #1: B2C 코드 수정 금지). 수정 시 은태님 승인 필요 |
| 수정 | IP rate limiting 추가 또는 API key 요구. `/api/search/analyze`는 IP당 5/min 있지만 나머지 3개는 없음 |

**실제 코드 (`app/api/intent/route.ts:14`):**
```typescript
export async function POST(request: NextRequest) {
  // ← 인증 체크 없음
  const body = await request.json();
  const { query } = body as { query?: string };
```

---

#### H-5: 등록/OAuth 응답에 API 키 전문(fullKey) 노출

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `app/api/v1/sellers/register/route.ts:172-179`, `app/api/v1/sellers/complete-oauth-profile/route.ts:126-129` |
| 문제 | 가입 성공 응답에 publishable key + secret key 전체 문자열이 JSON으로 반환됨 |
| 검증 | 코드 직접 확인 — `fullKey: publishableKey.fullKey`, `fullKey: secretKey.fullKey` |
| 영향 | HTTP 응답이 프록시/CDN/모니터링 로그에 기록되면 secret key 유출. 설계상 "한 번만 보여주기" 의도이지만, JSON 응답이 네트워크 경로에서 로깅될 수 있음 |
| 수정 | secret key는 해시된 형태만 DB에 저장하고 전문은 생성 시점에만 표시하되, **TLS 외 전송 경로 로깅 주의 문서화** 필요. 또는 별도 "키 확인" 페이지에서만 표시 |

**실제 코드 (`register/route.ts:172-179`):**
```typescript
keys: {
  publishable: { fullKey: publishableKey.fullKey, prefix: publishableKey.prefix },
  secret: { fullKey: secretKey.fullKey, prefix: secretKey.prefix,
    note: 'Keep this secret! Use for server-side API calls' },
}
```

---

#### H-6: 등록 API rate limiting 없음

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `app/api/v1/sellers/register/route.ts:28` |
| 문제 | POST /api/v1/sellers/register는 공개 엔드포인트(인증 불필요)인데 rate limiting이 없음 |
| 검증 | 코드 읽기 — `withApiAuth` 없음, rate limit 로직 없음 |
| 영향 | 대량 가입 스팸, 이메일 열거(에러 메시지 구분), Supabase auth 요금 증가 |
| 수정 | IP 기반 rate limiting 추가 (예: 5/min per IP) |

---

### MEDIUM

---

#### M-5: admin 페이지 URL hash 인증

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/admin/division-status/page.tsx:85`, `app/admin/intelligence/page.tsx:91` |
| 문제 | 인증이 URL fragment (`#secret`)로 이루어짐. 브라우저 히스토리에 노출 |
| 검증 | `window.location.hash.slice(1)` → `setAuthenticated(true)` |
| 수정 | Supabase session 기반 관리자 인증으로 교체 |

**실제 코드:**
```typescript
const hash = window.location.hash.slice(1);
if (hash) {
  setSecret(hash);
  setAuthenticated(true);
  fetchData(hash);
}
```

---

#### M-6: admin/tariffs, admin/cache — POTAL_ADMIN_KEY 단순 비교

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/api/v1/admin/tariffs/route.ts:44`, `app/api/v1/admin/cache/route.ts:21` |
| 문제 | `token !== adminKey` 단순 문자열 비교. timing-safe 비교 아님. 단일 키로 전체 관세 데이터 수정 가능 |
| 검증 | 코드 직접 확인 |
| 수정 | `crypto.timingSafeEqual()` 사용 + withApiAuth admin role 통합 |

---

#### M-7: community posts SELECT * 반환

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/api/v1/community/posts/route.ts:48` |
| 문제 | `.select('*')` 로 모든 컬럼 반환. user_id 등 내부 데이터가 클라이언트에 노출 |
| 검증 | 코드 직접 확인 |
| 수정 | 필요한 컬럼만 명시적으로 선택 |

---

#### M-8: middleware에서 보호 페이지 인증 미강제

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `middleware.ts` |
| 문제 | `/dashboard`, `/account`, `/settings` 등 보호 페이지에 대한 서버 사이드 인증 리다이렉트 없음. 클라이언트 측 체크만 존재 |
| 검증 | middleware.ts 전체 읽기 — 페이지 수준 인증 로직 없음 |
| 영향 | 인증되지 않은 사용자가 잠시 보호 페이지 컴포넌트를 볼 수 있음 (데이터는 API 레벨에서 보호됨) |
| 수정 | middleware에서 `/dashboard`, `/settings` 등 접근 시 세션 확인 → 리다이렉트 |

---

#### M-9: 비밀번호 재설정 rate limiting 없음

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/auth/forgot-password/page.tsx` |
| 문제 | `supabase.auth.resetPasswordForEmail()` 호출에 클라이언트 측 rate limiting 없음 |
| 검증 | 코드 읽기 — rate limit 로직 없음 |
| 영향 | 임의 이메일에 대해 무제한 리셋 이메일 발송 가능 (Supabase 백엔드 제한에 의존) |
| 수정 | 클라이언트 쿨다운 + 서버 IP rate limit 추가 |

---

### LOW

---

#### L-3: 이메일 열거 가능 (회원가입)

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `app/auth/signup/page.tsx:102-124` |
| 문제 | "An account with this email already exists" 에러 메시지로 가입 여부 확인 가능 |
| 수정 | 통일된 에러 메시지 사용 |

---

#### L-4: complete-profile 미인증 시 빈 폼 표시

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `app/auth/complete-profile/page.tsx` |
| 문제 | 세션 없는 사용자도 폼 UI를 볼 수 있음. 제출 시 API에서 거부되지만 UX 혼란 |
| 수정 | 세션 없으면 로그인 페이지로 리다이렉트 |

---

#### L-5: 하드코딩된 admin 이메일 목록

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `app/api/v1/community/posts/route.ts:28` |
| 문제 | `ADMIN_EMAILS = ['soulmaten7@gmail.com', 'contact@potal.app']` 하드코딩 |
| 수정 | 환경변수 또는 DB 기반 admin role 사용 |

---

#### L-6: Shopify API key 하드코딩 fallback

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `app/api/shopify/session/route.ts` |
| 문제 | `process.env.SHOPIFY_API_KEY \|\| '2fa34ed65342ffb7fac08dd916f470b8'` 하드코딩 fallback |
| 수정 | fallback 제거, 환경변수 필수화 |

---

### INFO

---

#### I-4: SERVICE_ROLE_KEY fallback 패턴 (136개 파일)

| 항목 | 내용 |
|------|------|
| 심각도 | INFO |
| 파일 | `app/lib/` 하위 136개 파일 |
| 패턴 | `process.env.SUPABASE_SERVICE_ROLE_KEY \|\| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 상태 | 모두 서버 사이드 코드이므로 SERVICE_ROLE_KEY가 클라이언트에 노출되지는 않음. 그러나 읽기 전용 작업에서도 SERVICE_ROLE_KEY를 사용하면 RLS를 우회하는 과도한 권한 |
| 권장 | 읽기 전용 작업은 ANON_KEY 사용으로 변경 (대규모 리팩토링 필요, 점진적 진행) |

---

#### I-5: B2C 엔드포인트 (수정 금지 영역)

| 항목 | 내용 |
|------|------|
| 심각도 | INFO |
| 파일 | `app/api/intent/`, `app/api/ai-suggestions/`, `app/api/search/`, `app/api/autocomplete/`, `app/api/signals/`, `app/api/generate-filters/` |
| 상태 | CLAUDE.md 절대규칙 #1에 의해 수정 금지 영역. H-4에서 보고된 인증 부재 문제가 이 코드에 해당 |
| 권장 | CEO 승인 후 rate limiting 또는 인증 추가 |

---

#### I-6: Webhook 서명 검증 (정상)

| 항목 | 내용 |
|------|------|
| 심각도 | INFO (PASS) |
| 파일 | `app/api/billing/webhook/route.ts`, `app/api/shopify/webhooks/route.ts` |
| 상태 | Paddle: `crypto.timingSafeEqual()` + 5분 replay 방지. Shopify: HMAC-SHA256 + timing-safe. 정상 |

---

## 3. PASS (정상 확인)

| 항목 | 파일 | 확인 내용 |
|------|------|---------|
| Paddle webhook 서명 | `app/api/billing/webhook/route.ts` | timingSafeEqual + replay prevention |
| Shopify webhook 서명 | `app/api/shopify/webhooks/route.ts` | HMAC-SHA256 + timing-safe |
| Shopify OAuth CSRF | `app/api/shopify/auth/route.ts` | httpOnly secure nonce cookie |
| Webhook URL SSRF 방지 | `app/api/v1/webhooks/route.ts` | private IP 차단, HTTPS 필수 |
| public/ 폴더 | `public/` | 민감 파일 없음 (이미지, manifest.json, sw.js만) |
| NEXT_PUBLIC_ 키 | 전체 | 민감 키 노출 없음 (anon key, client token만) |

---

## 4. 수정 우선순위

### 즉시 수정 (HIGH)

| ID | 수정 내용 | 예상 작업량 |
|----|---------|-----------|
| H-6 | `/api/v1/sellers/register` IP rate limiting 추가 | 20줄 |
| H-5 | 키 전문 노출 — 로그 주의 문서화 + 향후 별도 키 확인 페이지 | 설계 결정 필요 |
| H-4 | B2C AI 엔드포인트 rate limiting (CEO 승인 필요) | B2C 코드 영역 |

### 이번 주 수정 (MEDIUM)

| ID | 수정 내용 |
|----|---------|
| M-5 | admin 페이지 hash 인증 → Supabase session 인증 |
| M-6 | admin/tariffs, cache → timingSafeEqual 적용 |
| M-7 | community posts SELECT 컬럼 명시 |
| M-8 | middleware 보호 페이지 리다이렉트 |
| M-9 | 비밀번호 재설정 rate limit |

### 백로그 (LOW)

| ID | 수정 내용 |
|----|---------|
| L-3 | 이메일 열거 — 통일 에러 메시지 |
| L-4 | complete-profile 세션 리다이렉트 |
| L-5 | admin 이메일 하드코딩 → 환경변수 |
| L-6 | Shopify API key fallback 제거 |

---

## 5. Phase 1~3 전체 진행 현황

| Phase | 범위 | CRITICAL 수정 | HIGH 수정 | 상태 |
|-------|------|-------------|----------|------|
| Phase 1 | DB RLS | 90/90 테이블 RLS ON | — | ✅ 완료 |
| Phase 2 | 소스코드 | 2개 (서비스키 하드코딩, SQL injection) | 3개 (CORS, query param, PostgREST) | ✅ 완료 |
| Phase 3 | 외부 접근 경로 | 0개 | 3개 (AI API 미인증, 키 노출, rate limit) | ✅ 보고 완료 |

**총 수정 완료**: CRITICAL 2, HIGH 5 (Phase 2)
**추가 수정 필요**: HIGH 3, MEDIUM 5, LOW 4 (Phase 3)
