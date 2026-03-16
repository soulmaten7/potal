# 🧠 Claude Code 3시간 스프린트 — Private Beta 최종 준비
> 2026-03-12 | 은태님: 이 파일의 명령어를 순서대로 Claude Code에 복사-붙여넣기
> 각 작업 ~10-15분. 문제 발견 시 즉시 수정 후 다음으로.
> **모든 작업 후 npm run build 확인 필수**

---

## Phase A: API 전체 E2E 검증 (약 1시간)

### A-1. Calculate API — 핵심 계산 정확도 (15분)
```
🧠 Chief Orchestrator — Calculate API 정밀 검증

POTAL의 핵심인 /api/v1/calculate 엔드포인트를 다양한 시나리오로 테스트.
실제 프로덕션 URL(https://www.potal.app)에 요청을 보내서 결과 검증.

아래 10개 케이스를 curl로 테스트하고, 각각의 결과에서 확인할 것:
- totalLandedCost가 0이 아닌지
- duty, vat, customsFees 각각 존재하는지
- hsCode가 유효한지 (4-10자리)
- 에러 없이 200 응답인지

테스트 케이스:
1. US→KR, "Cotton T-Shirt", $25, origin=CN
2. CN→US, "Laptop Computer", $999, origin=CN (de minimis $800 초과)
3. CN→US, "Phone Case", $5, origin=CN (de minimis $800 이하)
4. CN→DE, "Silk Dress", $150, origin=CN (EU VAT)
5. CN→GB, "Leather Handbag", $500, origin=CN (UK VAT)
6. CN→AU, "Running Shoes", $80, origin=CN
7. CN→JP, "Ceramic Vase", $200, origin=CN
8. CN→CA, "Wooden Furniture", $1200, origin=CN
9. VN→US, "Coffee Beans 1kg", $30, origin=VN (FTA 가능)
10. KR→US, "Cosmetic Serum", $45, origin=KR (KORUS FTA)

각 결과를 표로 정리:
| # | Route | Product | Status | TLC | Duty | VAT | HS Code | Pass/Fail |

실패한 케이스는 원인 분석 + 수정.
API 키가 필요하면 .env.local에서 확인.
```

### A-2. 7개 API 엔드포인트 전체 헬스체크 (10분)
```
🧠 Chief Orchestrator — API 엔드포인트 전체 헬스체크

프로덕션(https://www.potal.app)에서 모든 공개 API 엔드포인트 호출 테스트.
각각 최소한의 유효한 파라미터로 요청.

1. GET /api/v1/countries — 응답에 240개국 포함되는지
2. POST /api/v1/calculate — A-1에서 이미 테스트 (스킵)
3. POST /api/v1/classify — {"productName": "Cotton T-Shirt"} → hsCode 반환 확인
4. GET /api/v1/restrictions — {"hsCode": "2208", "destinationCountry": "SA"} → 주류 제한 확인
5. POST /api/v1/documents — Commercial Invoice 생성 테스트
6. GET /api/v1/alerts — 빈 배열이라도 200 응답 확인
7. POST /api/v1/agent — tool schema 반환 확인
8. POST /api/v1/drawback — 환급 계산 테스트
9. POST /api/v1/screen — 제재 스크리닝 테스트 (정상 이름)

결과표:
| # | Endpoint | Method | Status | Response OK | Notes |

401/403은 인증 필요한 엔드포인트면 정상. 500은 무조건 수정.
```

### A-3. Shopify Widget + JS Widget 테스트 (10분)
```
🧠 Chief Orchestrator — Widget 통합 테스트

1. potal-widget.js 파일 확인:
   - https://www.potal.app/potal-widget.js 접근 가능한지 (curl -I)
   - CORS 헤더 있는지 (Access-Control-Allow-Origin)
   - minified 상태인지

2. Shopify Theme Extension 파일 확인:
   - extensions/ 폴더 구조 정상인지
   - liquid 파일에서 potal-widget.js 로드 경로 확인
   - app embed block 설정 확인

3. WooCommerce/BigCommerce/Magento 플러그인:
   - 각 플러그인 폴더에 README + 설치 가이드 있는지
   - API 엔드포인트 URL이 potal.app으로 되어 있는지 (localhost 아닌지)

문제 발견 시 즉시 수정.
```

### A-4. Paddle 결제 플로우 검증 (10분)
```
🧠 Chief Orchestrator — Paddle 결제 시스템 점검

1. Paddle Live 설정 확인:
   - .env.local에서 PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_CLIENT_TOKEN 확인
   - Vercel 환경변수에도 동일한 값인지 확인 (Vercel REST API로)
   - 6개 Live Price ID가 코드에 올바르게 매핑되어 있는지:
     Basic Monthly/Annual, Pro Monthly/Annual, Enterprise Monthly/Annual

2. plan-checker.ts 로직 검증:
   - Free 플랜: 100건/월 제한 작동하는지
   - 유료 플랜: overage 허용 로직
   - X-Plan-Overage 헤더 설정

3. Webhook 엔드포인트:
   - /api/webhooks/paddle 파일 존재 + 서명 검증 로직 확인
   - subscription.created, subscription.updated, subscription.canceled 핸들러 확인

4. Overage 빌링:
   - billing-overage cron 로직 확인
   - overage.ts에서 Paddle charge API 호출 로직

5. pricing 페이지:
   - /pricing 페이지에서 4개 플랜 + Annual 토글 + 가격이 CLAUDE.md의 요금표와 일치하는지
   - Paddle checkout 버튼 onClick이 올바른 Price ID를 전달하는지

코드 레벨 검증이므로 실제 결제는 하지 않음. 불일치 발견 시 수정.
```

### A-5. 인증(Auth) + RLS 보안 점검 (10분)
```
🧠 Chief Orchestrator — 인증 & 보안 점검

1. Supabase Auth 설정:
   - 회원가입 → 이메일 인증 → 로그인 플로우 코드 확인
   - /auth/callback 라우트 정상인지
   - middleware.ts에서 보호된 라우트 목록 확인 (/dashboard, /sellers/*)

2. API 인증:
   - /api/v1/* 엔드포인트에서 API 키 인증이 필수인지 확인
   - 미인증 요청 시 401 반환하는지
   - rate-limiter 설정값 확인 (플랜별 제한)

3. Admin 엔드포인트 보안:
   - /api/v1/admin/* 엔드포인트에 CRON_SECRET 검증 있는지
   - /admin/* 페이지에 인증 가드 있는지

4. RLS (Row Level Security):
   - sellers 테이블: 자기 데이터만 접근 가능한지
   - api_usage 테이블: 자기 사용량만 조회 가능한지
   - hs_classification_cache: 공용 읽기 가능한지

5. 환경변수 노출 점검:
   - NEXT_PUBLIC_ 접두사가 아닌 시크릿이 클라이언트에 노출되지 않는지
   - .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY가 있고, 이게 서버사이드에서만 쓰이는지

문제 발견 시 즉시 수정. 특히 보안 이슈는 P0.
```

### A-6. Vercel Cron 11개 전체 수동 실행 (15분)
```
🧠 Chief Orchestrator — Cron Job 11개 전체 테스트

모든 Cron을 수동으로 한 번씩 호출해서 에러 없이 실행되는지 확인.
CRON_SECRET: 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297

순서대로 curl 실행 (각각 응답 코드 + 에러 유무 확인):

1. curl -s "https://www.potal.app/api/v1/admin/health-check" -H "x-cron-secret: 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297"
2. curl -s "https://www.potal.app/api/v1/admin/uptime-check" -H "x-cron-secret: ..."
3. curl -s "https://www.potal.app/api/v1/admin/spot-check" -H "x-cron-secret: ..."
4. curl -s "https://www.potal.app/api/v1/admin/exchange-rate-sync" -H "x-cron-secret: ..."
5. curl -s "https://www.potal.app/api/v1/admin/gov-api-health" -H "x-cron-secret: ..."
6. curl -s "https://www.potal.app/api/v1/admin/plugin-health" -H "x-cron-secret: ..."
7. curl -s "https://www.potal.app/api/v1/admin/sdn-sync" -H "x-cron-secret: ..."
8. curl -s "https://www.potal.app/api/v1/admin/update-tariffs" -H "x-cron-secret: ..."
9. curl -s "https://www.potal.app/api/v1/admin/trade-remedy-sync" -H "x-cron-secret: ..."
10. curl -s "https://www.potal.app/api/v1/admin/competitor-scan" -H "x-cron-secret: ..."
11. curl -s "https://www.potal.app/api/v1/admin/billing-overage" -H "x-cron-secret: ..."

결과표:
| # | Cron | Status | Response Time | Error | Notes |

한 번에 하나씩 실행 (동시 실행 금지 — 절대 규칙).
500 에러나 타임아웃 발생 시 해당 cron 코드 확인 + 수정.
```

---

## Phase B: 코드 품질 & 정확도 (약 1시간)

### B-1. console.log 전체 소탕 (5분)
```
🧠 Chief Orchestrator — console.log 전체 제거

프로덕션 코드에서 console.log 전부 찾아서 제거 (절대 규칙).

1. grep -r "console.log" app/ components/ --include="*.ts" --include="*.tsx" -l
2. console.warn, console.error는 유지 (에러 트래킹용)
3. console.log만 전부 제거
4. npm run build 확인

단, __tests__/ 폴더와 scripts/ 폴더는 제외.
```

### B-2. TypeScript 에러 & 미사용 코드 정리 (10분)
```
🧠 Chief Orchestrator — TypeScript 정리

1. npx tsc --noEmit 실행 → 타입 에러 전부 수정
2. 미사용 import 정리:
   grep -r "import.*from" app/ components/ --include="*.ts" --include="*.tsx" | 결과에서 사용되지 않는 import 찾아서 제거
3. any 타입 사용 최소화 — 중요한 파일(cost-engine, api 라우트)에서 any를 구체적 타입으로 교체
4. npm run build 확인
```

### B-3. 에러 핸들링 강화 (15분)
```
🧠 Chief Orchestrator — API 에러 핸들링 점검

모든 /api/v1/* 라우트 파일을 점검하여:

1. try-catch가 모든 외부 호출(Supabase, AI API, 정부 API)을 감싸고 있는지
2. catch에서 적절한 에러 응답을 반환하는지 (500 + 에러 메시지)
3. 사용자에게 내부 에러 디테일이 노출되지 않는지 (DB 에러, API 키 등)
4. timeout 처리가 있는지 (AI API 호출 시 10초 타임아웃 등)
5. Supabase 연결 실패 시 graceful degradation이 있는지

특히 확인할 파일:
- app/api/v1/calculate/route.ts
- app/api/v1/classify/route.ts
- app/api/v1/screen/route.ts
- app/api/v1/documents/route.ts
- app/api/v1/restrictions/route.ts

문제 발견 시 즉시 수정. npm run build 확인.
```

### B-4. i18n 50개 언어 빠진 키 점검 (10분)
```
🧠 Chief Orchestrator — i18n 번역 키 누락 점검

1. 기본 언어 파일(en)의 키 목록 추출
2. 나머지 49개 언어 파일과 비교하여 누락된 키 찾기
3. 특히 최근 추가된 키 (CW9-10에서 추가한 기능들) 확인:
   - tariffOptimization 관련 키
   - drawback 관련 키
   - incoterms 관련 키
   - sanctions/screening 관련 키
4. 빠진 키가 있으면 영어 기본값으로 채우기 (번역은 나중에)
5. 가격 관련 키가 신 요금제와 일치하는지:
   - Free $0/100, Basic $20/2K, Pro $80/10K, Enterprise $300/50K
   - 구 요금제 (Starter $9, Growth $29) 잔존 없는지

npm run build 확인.
```

### B-5. SEO + 메타 태그 + OG 이미지 점검 (10분)
```
🧠 Chief Orchestrator — SEO 최종 점검

1. 핵심 페이지 메타 태그 확인 (curl + head 파싱):
   - / (홈): title, description, OG tags
   - /pricing: 가격 정보 반영
   - /developers: API 문서
   - /blog: 블로그 목록

2. JSON-LD 스키마 확인:
   - SoftwareApplication 스키마 (홈)
   - FAQPage 스키마 (FAQ)
   - Organization 스키마

3. robots.txt 확인:
   - B2C 경로 차단 (/search, /wishlist 등)
   - B2B 경로 허용 (/pricing, /developers, /blog)

4. sitemap.xml 확인:
   - 모든 공개 페이지 포함
   - B2C 페이지 미포함
   - lastmod 날짜 최신

5. 404 페이지:
   - 존재하지 않는 URL 접근 시 커스텀 404 반환되는지

문제 발견 시 수정.
```

### B-6. Keyword 분류 정확도 개선 — HS4 38%→60%+ (15분)
```
🧠 Chief Orchestrator — Keyword 분류 정확도 개선

현재 keyword stage HS4 정확도가 38%로 낮음 (벤치마크 결과).
Vector+LLM 폴백이 있어서 전체 파이프라인은 90%이지만, keyword 자체도 올려야 LLM 호출 비용 절감.

정확도 저하 핵심 원인 분석:
1. HS_DATABASE 5,371개 엔트리의 keywords[] 배열이 부실한 경우 찾기
2. 가장 빈번하게 검색되는 상품 카테고리 top 20 확인 (hs_classification_cache에서)
3. 해당 카테고리의 chapter 파일에서 keywords 보강

우선 보강할 챕터:
- ch61.ts, ch62.ts (의류 — 가장 많이 검색됨)
- ch64.ts (신발)
- ch42.ts (가죽 제품)
- ch85.ts (전자기기)
- ch84.ts (기계류)
- ch71.ts (귀금속/보석)
- ch39.ts (플라스틱 제품)
- ch94.ts (가구)
- ch95.ts (완구)

각 챕터에서:
- 빈 keywords[] 배열 채우기
- 일반적인 상품명 키워드 추가 (영어)
- product-type 키워드가 반드시 PRODUCT_TYPE_KEYWORDS에도 있는지 확인

수정 후 테스트:
- scripts/test_classify_e2e.ts 또는 유사 스크립트로 50개 상품 분류 테스트
- keyword stage 정확도 측정
- npm run build 확인
```

---

## Phase C: Beta 유저 경험 점검 (약 40분)

### C-1. 가입→대시보드 전체 플로우 코드 리뷰 (10분)
```
🧠 Chief Orchestrator — 신규 유저 가입 플로우 점검

Beta 유저가 처음 들어왔을 때의 전체 경험을 코드 레벨로 확인:

1. 랜딩 페이지 (/) → "Get Started" 또는 "Sign Up" 버튼 → 어디로 연결?
2. 가입 페이지 (/auth/signup 또는 /join):
   - 이메일+비밀번호 가입 작동하는지
   - Google OAuth 설정되어 있는지
   - 이메일 인증 플로우
3. 로그인 후 리다이렉트:
   - /dashboard로 가는지
   - 첫 방문 시 온보딩/퀵스타트 가이드 있는지
4. 대시보드 (/dashboard):
   - API 키 발급 기능
   - 사용량 표시
   - 플랜 정보 + 업그레이드 버튼
5. API 문서 (/developers):
   - OpenAPI spec 링크
   - curl 예시
   - SDK 다운로드 링크

Quickstart 가이드가 없으면 만들어줘:
- 3단계: 가입 → API 키 발급 → 첫 API 호출 예시

npm run build 확인.
```

### C-2. 모바일 반응형 점검 (10분)
```
🧠 Chief Orchestrator — 모바일 반응형 코드 점검

핵심 페이지의 Tailwind CSS 반응형 클래스 확인:

1. 랜딩 페이지 (/):
   - Hero 섹션 텍스트가 모바일에서 잘리지 않는지
   - CTA 버튼이 터치 가능한 크기인지 (min 44px)
   - 이미지/비디오가 반응형인지

2. 가격 페이지 (/pricing):
   - 4개 플랜 카드가 모바일에서 세로 배치되는지 (grid → flex-col)
   - 가격 비교 테이블이 가로 스크롤 가능한지

3. 대시보드:
   - 사이드바가 모바일에서 햄버거 메뉴로 변하는지
   - 차트/그래프가 반응형인지

4. API 문서 (/developers):
   - 코드 블록이 가로 스크롤 가능한지
   - 사이드 네비게이션이 모바일에서 접히는지

레이아웃이 깨질 수 있는 부분을 찾아서 Tailwind 클래스 수정.
npm run build 확인.
```

### C-3. 법적 페이지 + 쿠키 배너 점검 (10분)
```
🧠 Chief Orchestrator — 법적 준수 최종 점검

1. 법적 페이지 4개 확인:
   - /legal/terms — Terms of Service (B2B 내용, potal.app 도메인)
   - /legal/privacy — Privacy Policy (GDPR + CCPA)
   - /legal/cookie — Cookie Policy
   - /legal/privacy-settings — 개인정보 설정

2. 각 페이지에서 확인:
   - 회사명: POTAL (일관성)
   - 이메일: contact@potal.app (통일)
   - 도메인: potal.app (potal.com 잔존 없는지)
   - 국가: Korea (일관성 — "South Korea" 혼용 없는지)
   - 날짜: 2026년 이후인지

3. 쿠키 배너:
   - 첫 방문 시 쿠키 동의 배너 표시되는지
   - Accept/Decline 버튼 작동
   - 쿠키 설정 변경 기능

4. Footer 링크:
   - Terms, Privacy, Cookie 링크가 올바른 경로로 연결되는지
   - 모든 페이지의 Footer가 동일한지

문제 발견 시 즉시 수정.
```

### C-4. 이메일 시스템 점검 (10분)
```
🧠 Chief Orchestrator — 이메일 시스템 점검

1. Resend API 설정:
   - RESEND_API_KEY가 Vercel 환경변수에 있는지
   - morning-brief-email.ts에서 from 주소가 올바른지
   - contact@potal.app 도메인 인증 상태 (Resend 대시보드에서 확인은 못하지만, 코드에서 설정 확인)

2. Welcome Email (Make.com):
   - Make.com 시나리오가 코드에서 참조되는 부분 확인
   - webhook URL 확인

3. Morning Brief Email:
   - morning-brief-email.ts가 올바르게 호출되는지
   - 이메일 템플릿 내용이 3섹션 (auto_resolved/needs_attention/all_green) 포함하는지

4. Contact Form:
   - /contact 페이지의 폼이 이메일 발송하는지
   - 수신 주소가 contact@potal.app인지

5. Paddle 관련 이메일:
   - 구독 확인, 결제 영수증 등은 Paddle이 자동 발송 (코드 확인 불필요)

에러 발견 시 수정.
```

---

## Phase D: 남은 5개 기능 + 데이터 (약 20분)

### D-1. 42/47 기능 갭 분석 (10분)
```
🧠 Chief Orchestrator — 47기능 중 미완료 5개 식별 + 실행 계획

POTAL_47_Victory_Strategy.xlsx 또는 session-context.md에서 47개 기능 목록을 확인하고,
아직 완료되지 않은 5개가 정확히 무엇인지 식별.

각 미완료 기능에 대해:
1. 기능명
2. 현재 상태 (부분 구현 / 미착수 / 스코프 아웃?)
3. Private Beta까지 필요한지 (필수 / 선택)
4. 예상 작업 시간
5. 의존성 (다른 작업 필요한지)

Beta에 필수인 것만 이번에 구현.
선택적인 것은 P2로 미루기.

결과를 표로 보고.
```

### D-2. KOR AGR 상태 확인 + DB 정합성 (10분)
```
🧠 Chief Orchestrator — 데이터 정합성 최종 확인

1. KOR AGR 상태:
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT count(*) FROM macmap_agr_rates WHERE reporter_iso2 = '\''KR'\'';"}'

2. 12개 DB 테이블 행 수 확인 (CLAUDE.md 수치와 일치하는지):
아래 쿼리를 하나씩 실행:
- SELECT count(*) FROM countries;  -- 예상: 240
- SELECT count(*) FROM vat_gst_rates;  -- 예상: 240
- SELECT count(*) FROM de_minimis_thresholds;  -- 예상: 240
- SELECT count(*) FROM customs_fees;  -- 예상: 240
- SELECT count(*) FROM macmap_trade_agreements;  -- 예상: 1,319
- SELECT count(*) FROM macmap_ntlc_rates;  -- 예상: 537,894
- SELECT count(*) FROM trade_remedy_cases;  -- 예상: 10,999
- SELECT count(*) FROM trade_remedy_products;  -- 예상: 55,259
- SELECT count(*) FROM trade_remedy_duties;  -- 예상: 37,513
- SELECT count(*) FROM safeguard_exemptions;  -- 예상: 15,935

결과가 CLAUDE.md와 다르면 보고.
```

---

## Phase E: 최종 빌드 + 문서 동기화 (10분)

### E-1. 최종 빌드 + 테스트 실행 (5분)
```
🧠 Chief Orchestrator — 최종 빌드 확인

1. npm run build 2>&1 | tail -30
   → 에러 0개 확인
   → 경고 목록 확인 (치명적이지 않으면 OK)

2. npm test (있으면 실행)
   → 통과율 확인

3. 빌드 결과 요약:
   - 전체 페이지 수
   - static/dynamic 비율
   - 빌드 시간
   - 에러/경고 수
```

### E-2. 5개 문서 동기화 (5분)
```
🧠 Chief Orchestrator — 5개 문서 동기화

이번 스프린트에서 변경된 내용을 5개 문서에 반영:

1. CLAUDE.md — 핵심 수치 업데이트 (기능 수, 테스트 수 등)
2. session-context.md — 작업 로그 추가
3. .cursorrules — 타임스탬프 + 변경사항
4. docs/CHANGELOG.md — 변경 이력
5. docs/NEXT_SESSION_START.md — P0/P1/P2 우선순위 업데이트

각 문서 헤더의 "마지막 업데이트" 타임스탬프를 현재 시간(KST)으로 변경.
교차검증: 5개 문서 간 숫자 일치 확인 (국가 수, 행 수, 기능 수, 테이블 수).
```

---

## 🎯 요약

| Phase | 작업 수 | 예상 시간 | 목적 |
|-------|---------|----------|------|
| A | 6개 | 70분 | API + 결제 + 보안 검증 |
| B | 6개 | 65분 | 코드 품질 + 정확도 |
| C | 4개 | 40분 | Beta 유저 경험 |
| D | 2개 | 20분 | 미완료 기능 + 데이터 |
| E | 2개 | 10분 | 빌드 + 문서 |
| **합계** | **20개** | **~3시간 25분** | **Private Beta 준비 완료** |

**실행 방법**: 위에서부터 순서대로 Claude Code에 복사-붙여넣기.
문제 발견 시 즉시 수정하므로 실제 시간은 더 걸릴 수 있음.
중간에 쉬어도 됨 — 각 명령어는 독립적.
