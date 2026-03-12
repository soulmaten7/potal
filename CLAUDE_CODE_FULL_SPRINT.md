🧠 Chief Orchestrator — Private Beta 최종 준비 자율 스프린트

은태 CEO가 외출 중. 아래 20개 작업을 A→B→C→D→E 순서대로 자율 실행.
문제 발견 시 즉시 수정하고 다음으로 넘어가. 모든 수정 후 npm run build 확인 필수.
최종적으로 전체 결과 리포트를 만들어서 보고해줘.
한 번에 하나의 작업만 (절대 규칙). console.log 금지 (절대 규칙).

---

## Phase A: API 전체 E2E 검증

### A-1. Calculate API 핵심 계산 정확도
프로덕션(https://www.potal.app) /api/v1/calculate 에 아래 10개 curl 테스트.
각각 totalLandedCost≠0, duty/vat/customsFees 존재, hsCode 유효(4-10자리), 200응답 확인.
API 키는 .env.local에서 확인하고, x-api-key 헤더로 전송.

1. US→KR, "Cotton T-Shirt", $25, origin=CN
2. CN→US, "Laptop Computer", $999, origin=CN
3. CN→US, "Phone Case", $5, origin=CN (de minimis 이하)
4. CN→DE, "Silk Dress", $150, origin=CN (EU VAT)
5. CN→GB, "Leather Handbag", $500, origin=CN
6. CN→AU, "Running Shoes", $80, origin=CN
7. CN→JP, "Ceramic Vase", $200, origin=CN
8. CN→CA, "Wooden Furniture", $1200, origin=CN
9. VN→US, "Coffee Beans 1kg", $30, origin=VN
10. KR→US, "Cosmetic Serum", $45, origin=KR

결과표 만들기. 실패 시 원인 분석 + 수정.

### A-2. 7개 API 엔드포인트 헬스체크
프로덕션에서 모든 공개 API 호출:
1. GET /api/v1/countries → 240개국 확인
2. POST /api/v1/classify → {"productName":"Cotton T-Shirt"} → hsCode 확인
3. GET /api/v1/restrictions → {"hsCode":"2208","destinationCountry":"SA"} → 주류 제한
4. POST /api/v1/documents → Commercial Invoice 생성
5. GET /api/v1/alerts → 200 응답
6. POST /api/v1/agent → tool schema 반환
7. POST /api/v1/drawback → 환급 계산
8. POST /api/v1/screen → 제재 스크리닝 (정상 이름)
500은 무조건 수정.

### A-3. Widget + 플러그인 테스트
1. curl -I https://www.potal.app/potal-widget.js → 200 + CORS 헤더 확인
2. Shopify Theme Extension liquid 파일에서 widget 로드 경로 확인
3. WooCommerce/BigCommerce/Magento 플러그인에서 API URL이 potal.app인지 (localhost 아닌지)

### A-4. Paddle 결제 시스템 점검
1. .env.local + Vercel 환경변수에서 PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_CLIENT_TOKEN 확인
2. 6개 Live Price ID가 코드에 올바르게 매핑: Basic M/A, Pro M/A, Enterprise M/A
3. plan-checker.ts: Free 100건/월 제한, 유료 overage 허용 로직
4. /api/webhooks/paddle: 서명 검증 + subscription 핸들러 확인
5. pricing 페이지: 4플랜 + Annual 토글 + 가격이 Free$0/Basic$20/Pro$80/Enterprise$300 일치

### A-5. 인증 + RLS 보안 점검
1. /auth/callback 라우트 정상 여부
2. middleware.ts 보호된 라우트 목록
3. /api/v1/* 에 API 키 인증 필수인지, 미인증 시 401
4. /api/v1/admin/* 에 CRON_SECRET 검증 있는지
5. NEXT_PUBLIC_ 아닌 시크릿이 클라이언트에 노출되지 않는지
보안 이슈는 즉시 수정.

### A-6. Vercel Cron 11개 수동 실행
CRON_SECRET: 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297
한 번에 하나씩 (동시 실행 금지):
1. health-check
2. uptime-check
3. spot-check
4. exchange-rate-sync
5. gov-api-health
6. plugin-health
7. sdn-sync
8. update-tariffs
9. trade-remedy-sync
10. competitor-scan
11. billing-overage
각각 curl로 호출, 200 응답 + 에러 없음 확인. 500/타임아웃 시 해당 코드 수정.

---

## Phase B: 코드 품질 + 정확도

### B-1. console.log 전체 소탕
grep -r "console.log" app/ components/ --include="*.ts" --include="*.tsx" -l
→ __tests__/와 scripts/ 제외하고 전부 제거. console.warn/error는 유지. npm run build.

### B-2. TypeScript 에러 + 미사용 코드 정리
npx tsc --noEmit → 타입 에러 전부 수정.
중요 파일(cost-engine, api 라우트)에서 any 타입을 구체적 타입으로 교체.
npm run build.

### B-3. 에러 핸들링 강화
모든 /api/v1/* 라우트:
- try-catch가 외부 호출(Supabase, AI API, 정부 API)을 감싸는지
- catch에서 적절한 에러 응답(500+메시지) 반환하는지
- 내부 에러 디테일(DB에러, API키) 노출 안 되는지
- AI API 호출 시 타임아웃 처리 있는지
특히: calculate, classify, screen, documents, restrictions 라우트. 문제 시 수정.

### B-4. i18n 50개 언어 키 누락 점검
1. en 기본 키 목록 추출
2. 49개 언어와 비교 → 누락 키 찾기
3. 최근 추가 키 (tariffOptimization, drawback, incoterms, sanctions) 확인
4. 가격 키가 신 요금제 일치하는지 (구 Starter $9/Growth $29 잔존 없는지)
5. 빠진 키는 영어 기본값으로 채우기
npm run build.

### B-5. SEO + 메타태그 + OG 점검
1. 핵심 페이지 메타태그: /, /pricing, /developers, /blog
2. JSON-LD: SoftwareApplication, FAQPage, Organization 스키마
3. robots.txt: B2C 차단, B2B 허용
4. sitemap.xml: 공개 페이지 포함, B2C 미포함
5. 404 페이지 커스텀 반환
문제 시 수정.

### B-6. Keyword 분류 정확도 개선 (HS4 38%→60%+)
가장 빈번한 상품 카테고리 top 20 확인 후 해당 chapter 파일 keywords 보강:
ch61(의류), ch62(의류), ch64(신발), ch42(가죽), ch85(전자), ch84(기계), ch71(귀금속), ch39(플라스틱), ch94(가구), ch95(완구)
각 챕터에서 빈 keywords[] 채우기, product-type 키워드 추가.
수정 후 50개 상품 분류 테스트 → keyword 정확도 측정. npm run build.

---

## Phase C: Beta 유저 경험 점검

### C-1. 가입→대시보드 플로우 점검
1. 랜딩(/) → Sign Up 버튼 연결 경로
2. 가입 페이지: 이메일+비밀번호, Google OAuth 설정
3. 로그인 후 /dashboard 리다이렉트
4. 대시보드: API 키 발급, 사용량 표시, 플랜 정보
5. /developers: OpenAPI spec, curl 예시
Quickstart 가이드 없으면 3단계로 만들기 (가입→API키→첫 호출).

### C-2. 모바일 반응형 점검
핵심 페이지 Tailwind 반응형 확인:
1. 랜딩: Hero 텍스트/CTA 모바일 대응
2. /pricing: 4카드 세로 배치
3. 대시보드: 사이드바 햄버거
4. /developers: 코드블록 가로 스크롤
깨지는 부분 Tailwind 클래스 수정.

### C-3. 법적 페이지 + 쿠키 배너
1. /legal/terms, /legal/privacy, /legal/cookie, /legal/privacy-settings 4개 확인
2. 회사명 POTAL, 이메일 contact@potal.app, 도메인 potal.app 일관성
3. potal.com 잔존 없는지, "South Korea" 혼용 없는지
4. 쿠키 배너 표시 + Accept/Decline 작동
5. Footer 링크 올바른 경로

### C-4. 이메일 시스템 점검
1. RESEND_API_KEY Vercel 환경변수 확인
2. morning-brief-email.ts: from 주소, 3섹션 템플릿
3. /contact 폼: 이메일 발송 + 수신 주소 확인

---

## Phase D: 남은 기능 + 데이터

### D-1. 47기능 갭 분석
47개 중 미완료 5개 정확히 식별. 각각:
기능명, 현재 상태, Beta 필수 여부, 예상 시간, 의존성.
Beta 필수인 것만 즉시 구현. 나머지 P2.

### D-2. DB 정합성 확인
KOR AGR 상태 + 12개 테이블 행 수가 CLAUDE.md와 일치하는지:
curl로 Supabase Management API 쿼리 실행.
countries=240, vat_gst_rates=240, de_minimis_thresholds=240, customs_fees=240,
macmap_trade_agreements=1319, macmap_ntlc_rates=537894,
trade_remedy_cases=10999, trade_remedy_products=55259,
trade_remedy_duties=37513, safeguard_exemptions=15935

---

## Phase E: 마무리

### E-1. 최종 빌드 + 테스트
npm run build 2>&1 | tail -30 → 에러 0 확인.
npm test 있으면 실행 → 통과율.

### E-2. 5개 문서 동기화
이번 스프린트 변경사항을 5개 문서에 반영:
CLAUDE.md, session-context.md, .cursorrules, docs/CHANGELOG.md, docs/NEXT_SESSION_START.md
각 헤더 타임스탬프 현재시간(KST). 5개 문서 간 숫자 교차검증.

---

## 최종 리포트 형식

스프린트 완료 후 아래 형식으로 전체 결과 정리:

```
🧠 3시간 스프린트 결과 리포트
━━━━━━━━━━━━━━━━━━━━━

Phase A: API 검증
- A-1 Calculate: [N]/10 pass | 수정사항: [있으면 기술]
- A-2 Endpoints: [N]/8 pass
- A-3 Widget: pass/fail
- A-4 Paddle: pass/fail
- A-5 Security: pass/fail | 보안이슈: [있으면 기술]
- A-6 Cron: [N]/11 pass

Phase B: 코드 품질
- B-1 console.log: [N]개 제거
- B-2 TypeScript: [N]개 에러 수정
- B-3 에러핸들링: [N]개 라우트 강화
- B-4 i18n: [N]개 키 추가
- B-5 SEO: pass/fail
- B-6 Keyword: [이전]% → [이후]%

Phase C: Beta UX
- C-1 가입플로우: pass/fail
- C-2 모바일: [N]개 수정
- C-3 법적: pass/fail
- C-4 이메일: pass/fail

Phase D: 기능+데이터
- D-1 미완료: [N]개 식별, [N]개 구현
- D-2 DB: [N]/12 일치

Phase E: 마무리
- E-1 빌드: pass/fail | 테스트: [N]/[N]
- E-2 문서: 5개 동기화 완료

총 수정 파일: [N]개
npm run build: ✅
Private Beta 준비도: [%]
━━━━━━━━━━━━━━━━━━━━━
```
