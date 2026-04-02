# POTAL Development Changelog
> 마지막 업데이트: 2026-04-02 11:30 KST (CW22-O — PMF Outreach 체계 구축, Community 단순화)

## [2026-04-02 11:30 KST] CW22-O — PMF Outreach 실행 체계 구축

### 📣 커뮤니티 답변 시스템
- Gemini 프롬프트 5개 언어권 작성 (영어/독일어/일본어/한국어/인도영어)
- 25개+ 커뮤니티 매핑 (URL, 검색 키워드, 타겟, 톤 가이드)
- Community Outreach Map 작성 (`content/social-media/community-prompts/Community_Outreach_Map.md`)
- `community-prompts/` 폴더로 구조화

### 🔧 코드 수정
- Community 페이지: Feature Guides 사이드바 제거 + 설명 텍스트 간소화 (`app/community/page.tsx`, 커밋 0d25e3a)

### 📝 문서
- CLAUDE.md: 영문 콘텐츠 한글 번역 규칙 추가
- PMF Outreach 방식 전환: Playbook(직접 영어 답변) → Gemini 채팅 시스템(AI 답변+한글번역)

### 🤝 외부 대응
- Rahul Singireddy LinkedIn 후속 대화 완료 (Hydra = PH 프로젝트 자동 보안 스캔 회사)

## [2026-04-01 23:59 KST] CW22-N — 보안 감사 긴급 대응 Phase 1~3 + PMF Playbook + 폴더명 정규화

**트리거:** LinkedIn Rahul Singireddy (CEO, Hydra / Stanford / ex-Delivery Hero) 보안 제보 + Supabase 보안 경고 이메일 (3/30)

### 🔒 보안 감사 Phase 1: Supabase RLS
- **90개 테이블 전부 RLS 활성화** — 수정 전: 67개 OFF, 23개 ON → 수정 후: 90개 전부 ON
- 16개 테이블: `FOR ALL USING(true)` 위험 정책 → 셀러별 격리 정책으로 교체
- 40개+ 테이블: RLS 자체 활성화 + 적절한 정책 추가
- 35개 참조 테이블: 읽기 전용 정책 추가
- SQL: `docs/SECURITY_FIX_RLS.sql`, 보고서: `docs/SECURITY_AUDIT_2026-04-01.md`

### 🔒 보안 감사 Phase 2: 소스코드 취약점 5개
- C-1: `scripts/*.ts` SERVICE_ROLE_KEY 하드코딩 (10개 파일) → `process.env` 교체
- C-2: `vector-search.ts` raw SQL injection → RPC만 사용
- H-1: `middleware.ts` CORS `*` → `potal.app`만 허용
- H-2: admin 엔드포인트 query param secret → header 인증 (24개 파일)
- H-3: community PostgREST filter injection → sanitization 추가
- 보고서: `docs/SECURITY_AUDIT_PHASE2_2026-04-01.md`

### 🔒 보안 감사 Phase 3: 페이지/API 점검 + HIGH 3개
- H-4: B2C API 4개 (intent, ai-suggestions, generate-filters, search/analyze) → `~/Empire Business/b2c-api-backup/` 이동
- H-5: 가입 응답 API key `fullKey` → 마스킹 (앞 8자 + `***`)
- H-6: `/api/v1/sellers/register` rate limiting 추가 (IP당 분당 5회)
- MEDIUM 5개, LOW 4개, PASS 6개 확인
- 보고서: `docs/SECURITY_AUDIT_PHASE3_2026-04-01.md`

### 변경
- 🔒 **pk_live_ghTRbs... 하드코딩 키 제거** — 6개 파일에서 만료된 키 삭제 → 환경변수/플레이스홀더 교체
- 📄 **PMF Outreach Playbook 작성** — `content/social-media/POTAL_PMF_Outreach_Playbook.md` (2주 실행 가이드: LinkedIn+Reddit+Shopify Community, DM/이메일 템플릿, 반응 추적)
- 📁 **프로젝트 폴더명 portal → potal 정규화** — CLAUDE.md, session-context.md, .cursorrules, settings.local.json, scripts/*.py 등
- 📊 **Posting Guide Excel 41개 플랫폼** — 글로벌 32개 추가
- 💬 **LinkedIn Rahul Singireddy 대응** — 보안 수정 완료 + 채팅 대화 진행 중

## [2026-04-01 15:12 KST] CW22-M — 140개 Features 가이드 완성 + MCP v1.4.2 + Hook 수정

### 변경
- **Features 가이드 140개 완성** — 93개 makeGuide() 템플릿을 전부 상세 가이드로 변환 (overview, howToUse, useCases, tips, relatedFeatures). 빌드 통과
- **potal-mcp-server v1.4.2 배포** — bin 필드 경고 수정, repository.url 정규화, npm pkg fix 적용
- **Claude Code Hook 에러 수정** — 4개 hook 상대경로 → 절대경로 변환, "No such file" 에러 해결
- **Python SDK v1.1.0** — sdk/python/ README 추가
- **B2C 플랫폼 전략 문서** — docs/B2C_PLATFORM_STRATEGY.md 작성 (별도 프로젝트 구상)

## [2026-03-31 22:00 KST] CW22-L — SNS 바이럴 런칭 포스팅 + MCP API Key 재발급

### 추가
- **바이럴 포스팅 5개 플랫폼 완료** — LinkedIn(EN), X/Twitter(EN), 디스콰이어트(KR), Instagram(KR), DEV.to(EN). 140+ Features 스크린샷 11장 첨부
- **포스팅 가이드 엑셀** — `content/social-media/POTAL_Posting_Guide.xlsx` (9개 플랫폼 본문/이미지/해시태그/상태 관리 시트 3개)
- **바이럴 런칭 포스트 초안** — `content/social-media/VIRAL_LAUNCH_POST_DRAFT_v1.md` (한국어+영문)

### 수정
- **POTAL MCP API Key 재발급** — 기존 pk_live_ 만료 → sk_live_ 신규 발급, claude_desktop_config.json 복구
- **"2,000 API calls" 메시징 제거** — features/page.tsx, pricing/layout.tsx, faq/page.tsx, blog/posts.tsx, paddle.ts, support/route.ts, help/page.tsx → Forever Free 메시징으로 교체

## [2026-03-31 18:00 KST] CW22-K — 통합 모닝브리핑 아키텍처 + Scheduled Task 정리

### 변경
- **Scheduled Task 통합** — 4개 중복 Task(`morning-brief`, `chief-orchestrator-daily`, `morning-brief-v2`, `division-log-check`) → `potal-daily-health-check` 1개로 통합. 나머지 비활성화
- **6-Phase 점검 구조** — POTAL MCP(D1-D4,D7) → Chrome MCP(D5,D11) → Gmail MCP(D9,D16) → Notion MCP(D12) → 정적(D6,D8,D10,D13-D15) → 텔레그램 보고
- **morning-briefing 스킬 v2** — 기존 3-Step → 6-Phase 통합 점검으로 전면 재작성. Scheduled Task와 동일 로직
- **ORCHESTRATOR_RULES.md 재작성** — 도구별 Division 매핑, 활성/비활성 Task 목록, 통합 아키텍처 반영
- **DIVISION_STATUS.md 업데이트** — 통합 모닝브리핑 섹션 추가, 일일 운영 사이클 수정, Notion 참조 전환
- **구버전 파일 archive 이동** — POTAL_AI_Agent_Org.html(v1), v4.html, v5.html, MORNING_BRIEF_20260329.md
- **Google Drive 연동** — 19개 파일 POTAL_Google_Drive/ 통합, Notion Content Pipeline 10개 항목에 링크 연결

## [2026-03-31 15:00 KST] CW22-J — Notion 마이그레이션 + 엑셀 로깅 폐지 + 폴더 정리

### 변경
- **프로젝트 관리 Notion 이전** — 엑셀 7-8개 파일 → Notion "POTAL Command Center" 5개 DB (Task Board, Session Log, Content Pipeline, Marketplace Tracker, Finance Tracker)
- **엑셀 로깅 전면 폐지** — Work_Log.xlsx, Cowork_Session_Log.xlsx, D9~D15 Division 엑셀 더 이상 사용 안 함
- **CLAUDE.md 전면 개정** — Notion 기반 워크플로우로 재작성, 엑셀 참조 모두 제거
- **LOGGING_RULES.md 재작성** — 엑셀 규칙 → Notion 워크플로우 규칙으로 전환
- **session-context.md 업데이트** — CW22-J 완료 항목 추가, Notion 관련 맥락 반영
- **NEXT_SESSION_START.md 업데이트** — CW22-J 완료, 폴더 구조 최신화
- **폴더 정리** — portal 루트 170+ 파일 → archive/ 하위 폴더로 이동 (commands, benchmarks, audits, cold-email)
- **Notion 사용 설명서 생성** — Command Center 내 가이드 페이지

## [2026-03-31 13:10 KST] CW22-I — session-context TODO 정리

### 변경
- **TODO 섹션 전면 정리** — 완료 항목 제거/✅ 처리, 콜드이메일 캠페인 취소 (Forever Free 전환), F045~F048 marketplace 승인 시 변경으로 재분류
- **바이럴 런칭 TODO 추가** — HN/Reddit/LinkedIn 포스트, Demo 영상 촬영, 유튜브 채널, 86개 가이드 보강
- **진행 중 섹션** — 현재 스프린트 CW22로 업데이트, E(바이럴 마케팅) 상태 업데이트

## [2026-03-31 12:50 KST] CW22-H — Content 폴더 구조 + Dashboard Demo Scripts

### 추가
- **content/ 폴더 구조**: demo-scripts, social-media, thumbnails, recordings 4개 하위 디렉토리 + README.md
- **Dashboard Demo Scripts 엑셀**: `content/demo-scripts/POTAL_Dashboard_Demo_Scripts.xlsx` — Summary + 18개 대시보드 메뉴별 데모 스크립트 (Korean + English subtitles, 시간 추정)

## [2026-03-31 12:15 KST] CW22-G — Forever Free Cleanup

### 수정
- **Developers 페이지**: 429 에러 메시지 "upgrade for higher limits" → "Contact us if you need higher limits"
- **Dashboard**: Checkout 성공/취소/usage warning 3곳에서 paid plan 참조 제거

## [2026-03-31 10:00 KST] CW22-F — Features 페이지 검색 기능

### 추가
- **Features 검색박스**: `/features` 페이지에 실시간 검색 input 추가 — name, description, category, slug 검색 지원
- **검색 초기화 버튼**: X 아이콘으로 검색어 즉시 클리어
- **No results 리셋**: 결과 없을 때 Reset filters 클릭 시 검색어도 함께 초기화

## [2026-03-30 17:00 KST] CW22-E — Adobe Commerce Marketplace 설정

### 완료
- **Adobe Commerce Marketplace Profile**: Vendor Name(potal), Logo, Privacy Policy URL 저장 완료
- **Tax Forms 선택**: 비미국 거주자 + 한국-미국 조세조약 + W-8BEN 제출 선택 완료
- **W-8BEN 양식**: IRS 공식 양식 다운로드 (`W-8BEN_Form.pdf`), Adobe Commerce 이메일 제출 완료

### 대기 중
- Adobe Commerce: W-8BEN 검토 후 `potal-magento-1.0.0.zip` Extension 버전 업로드 (2~5 영업일)
- WooCommerce WordPress.org: 심사 대기 중 (1~10일)
- BigCommerce: partners@bigcommerce.com 답장 대기 (1~3 영업일)

---

## [2026-03-30 16:00 KST] CW22-D — SDK 배포 + 마켓플레이스 등록

### 완료
- **npm SDK 배포**: `potal-sdk@1.1.0` 공개 (https://www.npmjs.com/package/potal-sdk)
- **PyPI SDK 배포**: `potal@1.1.0` 공개 (https://pypi.org/project/potal/1.1.0/)
- **WooCommerce WordPress.org 제출**: slug `potal-total-landed-cost-calculator`, Automated Scan Pass ✅, Awaiting Review
- **WooCommerce 플러그인 수정**: Plugin URI 분리, Tested up to 6.9, Stable tag 1.0.0, Text Domain → potal-total-landed-cost-calculator
- **BigCommerce**: 파트너팀 직접 이메일 발송 (partners@bigcommerce.com) — 자동 가입 불가 이슈 대응
- **Marketplace_Registration_Guide.md**: WooCommerce/BigCommerce/Magento/Shopify 가이드 문서 생성

### 파일 변경
- `plugins/woocommerce/potal-landed-cost/potal-landed-cost.php` — 헤더 수정 (Plugin URI, Tested up to, Text Domain)
- `plugins/woocommerce/potal-landed-cost/readme.txt` — Tested up to 6.9, Stable tag 1.0.0
- `Marketplace_Registration_Guide.md` — 신규 생성
- `potal-landed-cost-v3.zip` — 수정된 플러그인 ZIP

### 미완료 (다음 세션)
- F045~F048 `coming_soon` 처리 (Features 페이지에서 마켓플레이스 앱 상태 변경)
- BigCommerce DevTools 앱 등록 (파트너팀 답장 후)
- Magento Adobe Commerce Marketplace 제출

---

## [2026-03-30 07:30 KST] CW22-C — HeroCalculator, Community, LinkedIn, CLAUDE.md 구조화

### 주요 변경
- **HeroCalculator 6필드 완성**: Product Name + Material + Category + Price + Origin + Destination. Material 기반 단방향 cascading (HS Code 21 Section 구조)
- **CTA 영문화**: 홈페이지 CTA 섹션 한국어 → 영어 ("Try every feature with a live demo")
- **Community 5건 수정**: 사이드바 유지, 게시글 수정, 작성자 이메일 표시, 댓글 수정/삭제, Reddit 스타일 UI
- **LinkedIn 프로필 최적화**: Headline/About/Banner 업데이트 (257M+ rows, 140 features, Forever Free)
- **CLAUDE.md 구조화**: 문서 업데이트 규칙 상세화, 3개 파일 분리 (COLD_EMAIL_RULES.md, LOGGING_RULES.md, ORCHESTRATOR_RULES.md)

### 신규 파일
- `docs/COLD_EMAIL_RULES.md` — 콜드이메일 규칙 (CLAUDE.md에서 분리)
- `docs/LOGGING_RULES.md` — 로깅 규칙 (CLAUDE.md에서 분리)
- `docs/ORCHESTRATOR_RULES.md` — Chief Orchestrator 규칙 (CLAUDE.md에서 분리)
- `app/api/v1/community/comments/[id]/route.ts` — 댓글 수정/삭제 API

### 수정 파일
- `components/home/HeroCalculator.tsx` — 6필드, MATERIAL_TO_CATEGORIES 단방향 cascading
- `app/page.tsx` — CTA 영문화
- `app/community/page.tsx` — 작성자 표시, UI 개선
- `app/community/[id]/page.tsx` — 사이드바, 게시글/댓글 수정, Reddit 스타일
- `app/api/v1/community/posts/[id]/route.ts` — author_email 조회 추가
- `CLAUDE.md` — 문서 업데이트 규칙 상세화 + 구조 개선

### Git 커밋
- `3d955aa` feat: Hero 섹션 HeroCalculator + demo bypass API + CTA 배너
- `f5dc9d4` fix: CTA section Korean text → English
- `fa824d3` feat: HeroCalculator ProductName+Material 필드 추가, CTA 영문화
- `863ad12` feat: HeroCalculator Material↔Category cascading dropdown
- `f4748ca` fix: HeroCalculator cascading → unidirectional (Material → Category only)

---

## [2026-03-29 21:00 KST] CW22-B — 가입 플로우 수정: Google OAuth + 이메일 인증

### 주요 변경
- **Google OAuth 가입 후 프로필 필수 입력**: /auth/complete-profile 신규 페이지 — 회사명/국가/업종 입력 완료 전 대시보드 접근 불가
- **이메일 가입 시 인증 링크 발송**: supabase.auth.signUp() + emailRedirectTo → Supabase 자동 인증 이메일 → 링크 클릭 후 /auth/callback에서 sellers 자동 생성
- **FreeBanner 제거**: 홈페이지 히어로("140 Features. All Free. Forever.")와 중복 → app/page.tsx에서 FreeBanner 컴포넌트 삭제
- **sellers 테이블 contact_email 수정**: email→contact_email로 3개 파일 수정 (DB 스키마 불일치 해결)
- **/auth/callback 세션 쿠키 보존**: Google OAuth 시 새 NextResponse 생성 대신 기존 response의 Location header 수정으로 쿠키 유실 방지
- **complete-profile 헤더 가림**: position:fixed fullscreen overlay로 부모 layout header 가림 (Next.js 중첩 layout 한계 우회)
- **Supabase "Confirm email" 설정 확인**: ON (이미 활성화 상태)

### 신규 파일
- `app/auth/complete-profile/page.tsx` — Google OAuth 사용자 프로필 입력 (fullscreen overlay)
- `app/api/v1/sellers/complete-oauth-profile/route.ts` — OAuth 프로필 완성 API (sellers 생성 + API 키 자동 발급)

### 수정 파일
- `app/page.tsx` — FreeBanner 컴포넌트 및 사용 코드 제거
- `app/auth/signup/page.tsx` — supabase.auth.signUp() 직접 호출 + 이메일 인증 화면 추가
- `app/auth/callback/route.ts` — 이메일/OAuth 이중 경로 처리, sellers 자동 생성, 쿠키 보존 수정
- `app/api/v1/sellers/register/route.ts` — email→contact_email 수정

### Git 커밋
- `a62f385` feat: Google OAuth complete-profile + email verification + FreeBanner removal
- `d883f0a` fix: callback session cookie preservation + complete-profile fullscreen overlay + error detail
- `9f0e5b6` fix: sellers table contact_email column name in 3 files

### 디버깅 과정 (Chrome MCP 활용)
1. Google OAuth → "Not authenticated" 에러 → 원인: 새 NextResponse 생성 시 쿠키 유실 → 수정: Location header 기법
2. 프로필 제출 → "Failed to create seller profile" → Chrome MCP JS 실행으로 상세 에러 확인 → 원인: sellers.email 컬럼 미존재 → 수정: contact_email로 변경
3. 헤더에 로그인 상태 노출 → Next.js layout 한계 → 수정: fullscreen overlay

---

## [2026-03-29 16:30 KST] CW22 — 전략 피벗: Exit 전략 + Forever Free

### 전략 변경
- **Exit(인수) 전략 확정**: 트래픽/데이터 극대화 → 인수 (CEO 결정 완료)
- 요금제 4단계(Free/Basic/Pro/Enterprise) **전면 폐기**
- 새 구조: **Forever Free** (140개 전부 무료) + Enterprise Contact Us
- Custom 세팅비 없음 — 140개 상세 가이드로 셀프서비스
- 가입 구조: 필수 5개(1달 무료) → 프로필 완성(Forever Free)
- 데이터 수집이 Exit 핵심: 크로스보더 셀러 프로필 (국가/업종/규모/플랫폼/매출)

### 코드 변경 (A+B+C+D+G 완료)
- **A: 요금제 변경**: Pricing 페이지 "Everything Free. Forever." 재설계, plan-checker 전체 무제한
- **B: 가입 통합**: /auth/join→/auth/signup 리다이렉트, 필수 5개 필드, 프로필 완성도 시스템(50%→100%), Forever Free 자동 업그레이드, trial 만료 시 API 403
- **C: 홈 화면 리디자인**: 히어로 "140 Features. All Free." + 경쟁사 기능 수/비용 비교 차트 2개 + Free 배너
- **D: Features 가이드**: 140개 상세 가이드 페이지 (/features/[slug]) 동적 라우트 + SEO sitemap
- **G: 커뮤니티 게시판**: /community — 버그/질문/제안, 140개 기능별 분류, 댓글, 추천, Header 링크, 50개 i18n

### DB 마이그레이션
- **055_forever_free_profile.sql**: sellers 컬럼 10개 (country, industry, company_size, monthly_shipments, primary_platform, main_trade_countries, annual_revenue_range, profile_completed_at, trial_type, trial_expires_at)
- **056_community_forum.sql**: community_posts + community_comments + community_upvotes + RLS + 인덱스

### Git 커밋 (CW22)
- `788c10f` feat: CW22 D-1~D-5 — 140 feature guide pages with dynamic routes + SEO
- `ffdf675` feat: CW22 home redesign — viral landing page + competitor charts + Free badge
- `e989f0e` feat: Community forum — posts, comments, upvotes, i18n (G-1~G-7)
- `33149fb` fix: remove scripts with secrets from tracking (push protection)
- `0ad950c` feat: CW22 pivot — Forever Free pricing, plan logic, signup flow, docs
- `cb7660c` feat: Forever Free pivot — unified signup, profile completion, trial system (B-1~B-6)

---

## [2026-03-29 02:20 KST] CW21-B — 140개 기능 완성 + Features 페이지 + 수익화 전략

### 주요 성과
- **142개 기능 코드 기반 정밀 감사**: IMPL 119, PARTIAL 10, STUB 8, NONE 3, WON'T 2
- **21개 미완성 기능 전부 완성** (PARTIAL→IMPL, STUB→IMPL, NONE→신규 구현)
- **Features 페이지 신규 배포**: potal.app/features — 140개 Active, 12개 카테고리 필터, 경쟁사 비교 테이블
- **MCP v1.4.0 프로덕션 검증**: classify_product 9-field, calculate_landed_cost 등 10/10 정상
- **Dashboard category 버그 수정 확인**: Chrome MCP로 실제 UI 테스트 완료
- **홈페이지 전체 점검**: 7개 페이지 전부 정상 (/, /features, /pricing, /developers, /help, /blog, /dashboard)
- **인프라 비용 분석**: 고정 ~$114/월, v3 AI호출 0, 100만건 시 ~$140/월
- **AI fallback 구조 분석**: v3→캐시→벡터→키워드(≥0.6)→AI. v3가 거의 다 처리, AI fallback 사실상 0

### 커밋
- Features 페이지 (e21b22f): 140개 기능 카드, 12개 카테고리 필터, 경쟁사 비교
- 21개 기능 완성: PARTIAL 10(수정) + STUB 8(로직) + NONE 3(신규)
- 경쟁사 테이블 수정: POTAL Active Features 119→140

### 전략 논의 (CEO 결정 대기)
- 요금제 변경 검토: 전체 무료 + Custom만 유료 + 크로스보더 광고
- 플랫폼 전환: API 도구 → 크로스보더 정보 허브 (관세뉴스 + 커뮤니티)
- 크로스보더 시장: 셀러 ~1500만, 시장규모 $1.2T, 광고 CPM $20-50

### 생성/수정 파일
- app/features/page.tsx (신규)
- app/features/features-data.ts (신규)
- components/layout/Header.tsx (Features 링크 추가)
- 51개 i18n 번역 파일 (nav.features 키)
- POTAL_Feature_Audit_2603290000.xlsx (신규)
- 21개 API route + 페이지 파일 (미완성 기능 완성)

## [2026-03-28 23:30 KST] CW21 — v3 파이프라인 21/21 Section 100% 완성

### 커밋 4개
- **7fd0142** feat: v3 pipeline 100% — all 21 Sections, S21 art, S7 redirect, word-boundary fix
- **0838827** feat: external drive data sync — codified rules +12, TRQ 372, EU seasonal 13, Ch82 knife fix
- **2b1e1ea** feat: v3 pipeline final — conflict-patterns + material_condition + runner_up heading
- **eb00fae** feat: v3 pipeline — add chapter hints for 12 missing Sections + fix 3 misroutes

### 주요 변경
- step2-2-section-notes.ts: Section switch 10/21 → **21/21** (S2-S10, S12, S14, S19, S21 추가)
- S21 Works of Art (Ch.97): 9701-9706 heading hints (painting/sculpture/stamp/antique/collectors)
- S7 Plastics: Section VII Note 2 cross-section redirect (printed plastics → Ch.49, 3918/3919 제외)
- S11 Textiles: Ch.53-59, 63 chapter hints 추가 (linen/man-made/felt/carpet/lace/made-up)
- S15 Base metals: Ch.79(zinc), 80(tin), 81(other base metals) 추가
- step0-input.ts: word-boundary matching for short material variants (pe→paper false positive fix)
- step2-1-section-candidate.ts: headgear score 0.85→0.95, art material/category mappings 추가
- codified-rules.ts: +3 rules → **595 total** (Section I Note 1&2, Section VII Note 2)
- field-validator.ts: PLATFORM_TERMS +40 keywords (hat/cap/chocolate/weapon/art/kitchenware 등)
- 외장하드 /Volumes/soulmaten/POTAL/ 14개 파일 + 97 conflict patterns 전체 대조 완료

### 테스트
- Pipeline regression: **22/22 PASS** (100%)
- Field-validator: **7/7 PASS**
- npm run build: ✅ 성공

## [2026-03-28 13:00 KST] CW20 — 147/147 기능 100% 완료 + Gmail 드래프트 251개 + Product Hunt + KrispiTech

### 주요 변경
- 17개 미완성 기능 전부 보완 (147/147 = 100%)
- 글로벌 콜드이메일 캠페인: 9개국 251개 검증, Gmail 드래프트 251개 생성
- Product Hunt B2B 리런치 완료
- KrispiTech 블로그 피처링 답장 발송
- Escalation Flow 구현 + 배포 (커밋 a63e713)
