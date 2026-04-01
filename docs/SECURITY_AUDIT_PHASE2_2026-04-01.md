# POTAL Security Audit Phase 2 — Verified Findings
> 날짜: 2026-04-01
> 방법: 실제 코드 읽기 + 검증 기반. 추측 없음.
> 범위: API 인증, 환경변수, Supabase 클라이언트, CORS, 파일업로드, SQL/XSS

---

## 발견 사항 요약

| 심각도 | 건수 |
|--------|------|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 2 |
| INFO | 3 |

---

## CRITICAL

### C-1. Supabase SERVICE_ROLE_KEY가 Git 커밋된 소스코드에 하드코딩

| 항목 | 내용 |
|------|------|
| 심각도 | CRITICAL |
| 파일 | `scripts/regression_test.ts:7`, `scripts/bench_amazon_300.ts:8`, `scripts/bench_v7_layer1.ts:8`, `scripts/bench_9field_complete.ts:7`, `scripts/bench_final_7country.ts:10`, `scripts/bench_hscodecomp_layer2.ts:10`, `scripts/duty_rate_verification.ts:15`, `scripts/vat_verification.ts:8`, `scripts/bench_us_hs10_verify.ts:9` (총 9개 파일) |
| 문제 | Supabase service_role JWT가 평문으로 하드코딩: `eyJhbGciOiJIUzI1NiIs...CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04` |
| 검증 | `scripts/` 폴더가 `.gitignore`에 포함되지 않음. `git log`에서 커밋 이력 확인됨 (커밋 `701572b`, `1073de9` 등). 이 JWT는 role=service_role 클레임을 가진 실제 키. |
| 영향 | 레포지토리 접근 가능한 누구나 이 키로 Supabase의 모든 테이블 읽기/쓰기/삭제 가능 (RLS 우회) |
| 수정 | 1) 9개 파일에서 하드코딩 제거 → `process.env.SUPABASE_SERVICE_ROLE_KEY` 사용 2) Supabase Dashboard에서 service_role JWT 재발급(rotate) 3) `scripts/*.ts`를 `.gitignore`에 추가 |

**실제 코드 (`scripts/regression_test.ts:7`):**
```typescript
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

### C-2. Raw SQL 인젝션 경로 — vector-search.ts

| 항목 | 내용 |
|------|------|
| 심각도 | CRITICAL |
| 파일 | `app/lib/cost-engine/ai-classifier/vector-search.ts:139-149` |
| 문제 | 사용자가 직접 제어하지 않지만, `embedding` 배열과 `cfg.minSimilarity`, `cfg.topK` 값이 SQL 문자열에 직접 보간됨. `exec_sql` RPC 함수로 raw SQL 실행. |
| 검증 | 코드 직접 확인. `embeddingStr`이 SQL 문자열 내에 `'${embeddingStr}'`로 삽입됨. |
| 영향 | 현재 `embedding`은 OpenAI API에서 생성되므로 즉시 악용은 어려움. 하지만 `cfg.minSimilarity`나 `cfg.topK`가 외부 입력에서 오거나, `exec_sql` RPC가 존재한다면 SQL 인젝션 가능. |
| 수정 | Supabase RPC 함수에 파라미터화된 쿼리 사용. 또는 `searchByVectorDirect()` 함수를 삭제하고 기존 RPC 방식(`match_hs_vectors`)만 사용. |

**실제 코드 (`vector-search.ts:139-140`):**
```typescript
const embeddingStr = `[${embedding.join(',')}]`;
const query = `SELECT product_name, hs_code, ... WHERE 1 - (embedding <=> '${embeddingStr}'::vector) >= ${cfg.minSimilarity} ... LIMIT ${cfg.topK}`;
```

---

## HIGH

### H-1. Wildcard CORS (`*`) on 전체 /api/v1/* 엔드포인트

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `middleware.ts:25,35` |
| 문제 | 모든 `/api/v1/*` 엔드포인트에 `Access-Control-Allow-Origin: *` 설정. 악의적 웹사이트에서 사용자의 브라우저를 통해 인증된 API 호출 가능. |
| 검증 | `middleware.ts` 직접 읽기. 라인 25: OPTIONS 응답에 `*`, 라인 35: 모든 요청에 `*` 설정. |
| 영향 | POTAL API는 Header 기반 인증(X-API-Key)이므로 쿠키 기반 CSRF는 해당 없음. 하지만 API 키가 클라이언트에 노출된 경우 cross-origin 호출이 가능해짐. 현재는 B2B API의 의도된 설계이지만, `/api/v1/sellers/me` 같은 세션 기반 엔드포인트도 wildcard CORS의 영향을 받음. |
| 수정 | 세션 기반 엔드포인트(`/api/v1/sellers/me`, `/api/v1/team/*`)는 CORS origin을 `potal.app`으로 제한. API 키 기반 엔드포인트는 `*` 유지 가능. |

**실제 코드 (`middleware.ts:35`):**
```typescript
apiResponse.headers.set("Access-Control-Allow-Origin", "*");
```

---

### H-2. Admin 엔드포인트 15개에서 URL 쿼리 파라미터로 시크릿 전송

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `app/api/v1/admin/refund/route.ts:25`, `admin/sdn-sync/route.ts:28`, `admin/billing-overage/route.ts:28`, `admin/health-check/route.ts:25`, `admin/update-tariffs/route.ts:28` 등 총 15개 |
| 문제 | `req.nextUrl.searchParams.get('secret')` 으로 CRON_SECRET을 URL 쿼리에서 받음. URL은 서버 로그, CDN 로그, Vercel 로그에 기록됨. |
| 검증 | Grep으로 15개 파일 확인. 모두 동일 패턴: `const secret = req.nextUrl.searchParams.get('secret'); return secret === CRON_SECRET;` |
| 영향 | Vercel/CDN 로그에 CRON_SECRET이 평문으로 기록됨. 로그 접근 가능한 사람이면 모든 admin 엔드포인트 호출 가능. |
| 수정 | 쿼리 파라미터 인증 제거. Authorization 헤더만 사용. Vercel Cron은 헤더 방식 지원. |

**실제 코드 (`admin/refund/route.ts:25-26`):**
```typescript
const secret = req.nextUrl.searchParams.get('secret');
return secret === CRON_SECRET;
```

---

### H-3. Community 검색 필터 인젝션

| 항목 | 내용 |
|------|------|
| 심각도 | HIGH |
| 파일 | `app/api/v1/community/posts/route.ts:55` |
| 문제 | URL 파라미터 `q`가 이스케이프 없이 Supabase `.or()` 필터 문자열에 직접 보간됨. PostgREST 필터 구문에서 콤마(`,`), 마침표(`.`), 퍼센트(`%`)가 특수 의미를 가짐. |
| 검증 | 코드 직접 확인. `?q=test%,content.ilike.*` 같은 페이로드로 필터 로직 조작 가능. |
| 영향 | 커뮤니티 포스트 테이블의 다른 컬럼 값 노출 가능. RLS가 public read를 허용하므로 데이터 자체는 공개이지만, 필터 조작으로 의도하지 않은 쿼리 실행 가능. |
| 수정 | `search` 파라미터에서 PostgREST 특수문자(`,`, `.`, `(`, `)`, `%`) 이스케이프 또는 제거. |

**실제 코드 (`community/posts/route.ts:55`):**
```typescript
if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
```

---

## MEDIUM

### M-1. SERVICE_ROLE 키 fallback 패턴 — 8개+ API 라우트

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/api/v1/community/posts/route.ts:10-14`, `app/api/v1/community/posts/[id]/route.ts:11-16`, `app/api/v1/community/comments/[id]/route.ts:9-14`, `app/api/v1/community/posts/[id]/upvote/route.ts:9-14`, `app/api/v1/duty-rates/schedule/route.ts:7`, `app/api/cron/enterprise-lead-match/route.ts:11-14`, `app/tariff/[country]/[hs]/page.tsx:8` 등 |
| 문제 | `SUPABASE_SERVICE_ROLE_KEY \|\| NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback 패턴. 공개 데이터 조회에 service_role 권한 사용. 최소 권한 원칙 위반. |
| 검증 | 여러 파일에서 동일 패턴 확인. |
| 영향 | 즉시 위험은 아님 (서버 사이드). 하지만 service_role이 불필요하게 광범위하게 사용되어, C-1의 키 유출 시 피해 범위 증가. |
| 수정 | 공개 데이터 조회는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 사용. service_role은 auth.admin 작업에만 한정. |

---

### M-2. Admin 엔드포인트 단순 문자열 비교 (타이밍 공격)

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/api/v1/admin/tariffs/route.ts:40`, `app/api/v1/admin/refund/route.ts:22` |
| 문제 | `token !== adminKey` 및 `secret === CRON_SECRET` — JavaScript `===`는 첫 불일치 문자에서 즉시 반환. 타이밍 사이드 채널 공격으로 시크릿 추론 가능. |
| 검증 | 코드에서 `crypto.timingSafeEqual` 미사용 확인. |
| 영향 | 네트워크 지터 때문에 실제 공격 난이도는 높지만, 보안 모범 사례 위반. |
| 수정 | `crypto.timingSafeEqual(Buffer.from(token), Buffer.from(adminKey))` 사용. |

---

### M-3. CSP에 unsafe-inline, unsafe-eval 포함

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `middleware.ts:11` |
| 문제 | `script-src 'unsafe-inline' 'unsafe-eval'` — XSS 방어 효과 감소. |
| 검증 | middleware.ts에서 CSP 헤더 직접 확인. |
| 영향 | XSS 취약점이 있을 경우 CSP가 실행을 차단하지 못함. 현재 XSS 취약점은 발견되지 않았으므로 즉시 위험은 아님. |
| 수정 | nonce 기반 CSP로 전환. Next.js의 `nonce` 지원 활용. |

---

### M-4. /api/contact 엔드포인트 — rate limiting 없음

| 항목 | 내용 |
|------|------|
| 심각도 | MEDIUM |
| 파일 | `app/api/contact/route.ts` |
| 문제 | 인증 없고 rate limiting 없는 POST 엔드포인트. 스팸 문의 대량 전송 가능. |
| 검증 | 코드에 rate limit 구현 없음 확인. |
| 영향 | 문의 스팸, Supabase write 남용. |
| 수정 | IP 기반 rate limiting (예: 5 req/min/IP) 추가. |

---

## LOW

### L-1. Billing transaction ID를 클라이언트에 반환

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `app/api/billing/checkout/route.ts` |
| 문제 | Paddle transactionId를 API 응답에 포함. |
| 검증 | 코드 확인. |
| 영향 | Paddle 트랜잭션 ID 자체로는 악용 어려움. |
| 수정 | 필요 없으면 checkout URL만 반환. |

---

### L-2. next.config.ts 이미지 remote pattern 과도

| 항목 | 내용 |
|------|------|
| 심각도 | LOW |
| 파일 | `portal/next.config.ts:19` (하위 폴더, 메인 아님) |
| 문제 | `hostname: '**'` — 모든 도메인에서 이미지 로드 허용. |
| 검증 | 파일 직접 확인. |
| 영향 | SSRF 위험은 낮지만 모범 사례 위반. |
| 수정 | 필요한 도메인만 명시. |

---

## INFO (참고)

### I-1. 파일 업로드 보안 — 정상

| 항목 | 내용 |
|------|------|
| 파일 | `app/api/v1/classify/csv/route.ts`, `app/api/v1/classify/image/route.ts`, `app/api/v1/calculate/csv/route.ts` |
| 상태 | 5MB 크기 제한, 파일 타입 검증(magic byte), 확장자 화이트리스트, 행 수 제한 모두 정상. Supabase Storage 미사용 (메모리 처리만). |

### I-2. dangerouslySetInnerHTML — 안전

| 항목 | 내용 |
|------|------|
| 파일 | `app/faq/layout.tsx:108`, `app/tariff/[country]/[hs]/page.tsx:85`, `app/blog/[slug]/page.tsx:85`, `app/layout.tsx:120,166` |
| 상태 | 모두 `JSON.stringify()`된 서버 제어 데이터(SEO 구조화 데이터)에만 사용. 사용자 입력 없음. |

### I-3. 동적 라우트 파라미터 — 안전

| 항목 | 내용 |
|------|------|
| 파일 | `app/tariff/[country]/[hs]/page.tsx`, `app/legal/[slug]/page.tsx`, `app/community/[id]/page.tsx` |
| 상태 | URL 파라미터가 Supabase 파라미터화 쿼리(`.eq()`)로 전달. HS 코드는 `replace(/[^0-9]/g, '')` 정규식 검증. SQL 인젝션 위험 없음. |

---

## 수정 우선순위

| 순위 | 항목 | 예상 시간 |
|------|------|----------|
| 1 | **C-1**: scripts/ 하드코딩 키 제거 + service_role 키 로테이션 | - |
| 2 | **C-2**: vector-search.ts raw SQL 제거 | - |
| 3 | **H-1**: middleware.ts CORS 분리 (세션 엔드포인트 제한) | - |
| 4 | **H-2**: admin 15개 쿼리 파라미터 인증 제거 | - |
| 5 | **H-3**: community search 이스케이프 | - |
| 6 | **M-1~M-4**: fallback 패턴, timing-safe, CSP, rate limit | - |
