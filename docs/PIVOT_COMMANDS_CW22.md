# POTAL 피벗 실행 명령어 — CW22
> 각 명령어를 해당 터미널에 복사-붙여넣기하여 실행
> 명령어 실행 전 반드시 docs/PIVOT_PLAN_CW22.md 읽기

---

## ═══════════════════════════════════════
## 순서 1-A: 요금제 구조 변경 (터미널1 — Opus)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 요금제 구조 변경 (A-1 ~ A-4)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- CEO 결정: Exit(인수) 전략. 140개 기능 전부 Forever Free.
- 기존 요금제(Free $0/200건, Basic $20/2K, Pro $80/10K, Enterprise $300/50K) 전부 폐기.
- 새 구조: Forever Free (140개 기능 무제한) + Enterprise Contact Us (가격 미표시, 문의 폼만).

■ 작업 목록:

【A-1】기존 요금제 데이터 정리
1. app/pricing/page.tsx 읽기 — 현재 4단계 요금제 UI 확인
2. app/lib/api-auth/plan-checker.ts 읽기 — plan별 분기 로직 확인
3. 어떤 파일들이 Free/Basic/Pro/Enterprise plan을 참조하는지 전체 검색:
   - grep -r "Basic\|Pro\|Enterprise\|plan_id\|plan-checker\|starter\|growth" --include="*.ts" --include="*.tsx" app/ components/ | grep -v node_modules
4. 영향받는 파일 목록 정리해서 보고

【A-2】Pricing 페이지 완전 재설계
1. app/pricing/page.tsx를 완전히 새로 만들기:
   - 히어로: "Everything Free. Forever." — 140개 기능 전부 무료임을 강조
   - 단일 플랜 카드: "Forever Free" — 140 Features, 모든 API 엔드포인트, 모든 국가, 모든 통합
   - 기능 리스트: 12개 카테고리별로 주요 기능 나열 (app/features/features-data.ts에서 데이터 가져오기)
   - Enterprise Contact Us 섹션: "Need custom integration? Let's talk." + 문의 폼 (회사명, 이메일, 요구사항 텍스트)
   - FAQ 섹션: "Why is it free?", "Will it stay free?", "What about Enterprise?" 등
2. 기존 Paddle 결제 버튼, Annual 토글, 플랜 비교 테이블 전부 제거
3. i18n 번역 키 업데이트 (messages/*.json 51개 파일에서 pricing 관련 키 변경)

【A-3】Plan 관련 코드 로직 정리
1. app/lib/api-auth/plan-checker.ts:
   - 기존: plan별 API 호출 한도 체크 (Free 200건, Basic 2K 등)
   - 변경: 모든 인증된 유저에게 무제한 허용 (단, 로그인 필수). rate limit만 유지 (DDoS 방지용 월 100K건 정도)
2. API 라우트에서 plan 체크하는 부분 전부 찾아서 완화:
   - grep -r "planCheck\|checkPlan\|plan_id\|subscription_status" --include="*.ts" app/api/
3. paddle.ts (결제 관련): 당장 삭제하지 말고, Enterprise Contact Us에서 나중에 쓸 수 있으니 비활성화만
4. DashboardContent.tsx에서 "Upgrade" 버튼, plan 표시 부분 수정 → "Forever Free" 뱃지로 교체

【A-4】빌드 확인
1. npm run build — 변경 후 빌드 깨지지 않는지 확인
2. 빌드 성공하면 git add + commit (Mac 터미널에서 push)

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가 (YYMMDDHHMM 형식)
- 모든 작업 타임라인 기록 (COMMAND/RESULT/ANALYSIS/DECISION)

■ 절대 규칙:
- B2C 코드(lib/search/, lib/agent/, components/search/) 수정 금지
- console.log 남기지 않기
- 빌드 깨진 상태로 두지 않기
```

---

## ═══════════════════════════════════════
## 순서 1-B: 가입/데이터 수집 구조 변경 (터미널3 — Opus)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 가입/데이터 수집 구조 변경 (B-1 ~ B-6)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- 가입 경로 2개(B2B /auth/signup + B2C /auth/join)를 하나로 통합
- 가입 시 필수 5개 → 1달 무료 / 프로필 완성 → Forever Free
- 데이터 수집이 Exit 전략의 핵심 — 크로스보더 셀러 프로필 데이터

■ 작업 목록:

【B-1】가입 경로 통합
1. 현재 파일 확인:
   - app/auth/signup/page.tsx (B2B 셀러)
   - app/auth/join/page.tsx (B2C 소비자)
   - app/api/v1/sellers/register/route.ts (등록 API)
2. /auth/join을 /auth/signup으로 리다이렉트 처리 (기존 링크 깨지지 않게)
3. /auth/signup을 통합 가입 페이지로 재설계:
   - 이메일 (필수)
   - 비밀번호 (필수, 8자+)
   - 회사명 (필수) — 개인이면 "Individual" 선택 가능
   - 국가 (필수) — 드롭다운, 240개국 리스트 (기존 supported countries 데이터 활용)
   - 업종 (필수) — 드롭다운: E-commerce Seller / Logistics & Freight / Customs Broker / Marketplace Operator / Developer / Other
   - Google OAuth도 유지하되, OAuth 후 회사명/국가/업종 입력 모달 표시
4. UI 디자인: 깔끔한 단일 폼, "Start Free — All 140 Features Included" CTA 버튼

【B-2】DB 스키마 변경
1. 새 마이그레이션 파일 생성: supabase/migrations/055_forever_free_profile.sql
2. sellers 테이블에 컬럼 추가:
   - country TEXT NOT NULL DEFAULT ''
   - industry TEXT NOT NULL DEFAULT ''
   - company_size TEXT (1-10 / 11-50 / 51-200 / 201-1000 / 1000+)
   - monthly_shipments TEXT (0-100 / 101-1000 / 1001-10000 / 10000+)
   - primary_platform TEXT (Shopify / WooCommerce / Amazon / Magento / BigCommerce / Custom / Other)
   - main_trade_countries TEXT[] (배열 — 주요 수출입 국가 최대 5개)
   - annual_revenue_range TEXT (Under $100K / $100K-$500K / $500K-$1M / $1M-$5M / $5M+)
   - profile_completed_at TIMESTAMPTZ (프로필 완성 시점)
   - trial_type TEXT DEFAULT 'monthly' (monthly = 1달 무료 / forever = Forever Free)
   - trial_expires_at TIMESTAMPTZ (가입 후 30일)
3. RLS 정책 확인 — 본인 프로필만 수정 가능

【B-3】등록 API 수정
1. app/api/v1/sellers/register/route.ts 수정:
   - 필수 필드: email, password, companyName, country, industry
   - 가입 시 trial_expires_at = NOW() + 30일 설정
   - trial_type = 'monthly' (기본)
2. 응답에 trial_expires_at 포함

【B-4】프로필 완성 페이지 (대시보드)
1. 대시보드(components/dashboard/DashboardContent.tsx)에 프로필 완성도 위젯 추가:
   - 상단 배너: "프로필을 완성하면 Forever Free! (현재 60%)"
   - 프로그레스 바 (0~100%)
   - 미완성 필드 목록 + 각 필드 옆에 "입력하기" 버튼
2. 프로필 완성도 계산 로직:
   - 필수 5개 (가입 시 완료) = 50%
   - company_size = +10%
   - monthly_shipments = +10%
   - primary_platform = +10%
   - main_trade_countries = +10%
   - annual_revenue_range = +10%
   - 100% 달성 시 → trial_type = 'forever', profile_completed_at = NOW()
3. 프로필 업데이트 API: PUT /api/v1/sellers/profile

【B-5】프로필 미완성 시 접근 제한
1. middleware.ts 또는 API 라우트에서:
   - trial_type = 'monthly' AND trial_expires_at < NOW() AND profile_completed_at IS NULL
   - → 대시보드 접근 시 "프로필을 완성하면 계속 무료로 사용할 수 있습니다" 모달 표시
   - → API 호출 시 403 + "Complete your profile to continue using POTAL for free"
2. 프로필 완성 페이지로만 리다이렉트 (완전 차단은 아님 — 프로필 입력은 가능해야 함)

【B-6】빌드 확인
1. npm run build
2. git add + commit

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가
- 모든 작업 타임라인 기록

■ 절대 규칙:
- B2C 코드 수정 금지
- console.log 금지
- Supabase 마이그레이션은 파일만 생성 (실제 적용은 은태님 확인 후)
```

---

## ═══════════════════════════════════════
## 순서 2-C: 홈 화면 리디자인 (터미널1 — Opus)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 홈 화면 리디자인 (C-1 ~ C-4)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- Exit 전략: 방문자가 3초 안에 "경쟁사 대비 왜 POTAL인지" 파악해야 함
- 홈 화면 = 바이럴 랜딩 페이지. 여기서 승부가 갈림
- 핵심 메시지: "상위 10개 관세 솔루션의 모든 기능을 합쳐도 POTAL보다 적다. 그 회사들은 Enterprise에 연 $50,000을 받는다. POTAL은 전부 무료다."

■ 경쟁사 데이터 (정확한 수치):
archive/Competitor_Feature_Matrix.xlsx와 POTAL_Feature_Audit_2603290000.xlsx에서 데이터 가져올 것.
경쟁사 10개:
1. Avalara — 기능 44개, Enterprise 연 $50,000+
2. Zonos — 기능 38개, Enterprise 연 $48,000+
3. SimplyDuty — 기능 22개, Enterprise 연 $12,000+
4. Customs Info (Descartes) — 기능 ~30개, Enterprise 연 $25,000+
5. Tarifftel — 기능 ~20개, Enterprise 연 $15,000+
6. 3CE Technologies — 기능 ~18개, Enterprise 연 $10,000+
7. Commodities AI — 기능 ~15개, Enterprise 연 $8,000+
8. Dutycalc — 기능 ~12개, Enterprise 연 $6,000+
9. Cross-Border Commerce — 기능 ~25개, Enterprise 연 $20,000+
10. Global Trade Compliance — 기능 ~20개, Enterprise 연 $18,000+
POTAL — 기능 140개, **$0 (Forever Free)**

⚠️ 중요: 위 경쟁사 비용 수치는 반드시 archive/Competitor_Feature_Matrix.xlsx를 먼저 읽고 정확한 숫자로 교체할 것. 위 수치는 근사치임.

■ 작업 목록:

【C-1】홈 페이지 히어로 섹션 재설계
1. app/page.tsx (또는 홈 페이지 컴포넌트) 읽기
2. 히어로 변경:
   - 메인 타이틀: "140 Features. All Free. Forever."
   - 서브: "Top 10 competitors combined offer fewer features — and charge up to $50,000/year. POTAL gives you everything. For $0."
   - CTA 버튼: "Start Free Now" → /auth/signup
   - 카운터 애니메이션: 140 Features / 240 Countries / 155+ APIs / $0 Cost

【C-2】경쟁사 기능 수 비교 차트
1. 홈 페이지 히어로 바로 아래에 "Feature Comparison" 섹션 추가
2. 가로 막대 차트 (bar chart):
   - POTAL: 140개 (강조색, 맨 위)
   - Avalara: 44개
   - Zonos: 38개
   - Customs Info: ~30개
   - Cross-Border Commerce: ~25개
   - SimplyDuty: 22개
   - Tarifftel: ~20개
   - Global Trade Compliance: ~20개
   - 3CE Technologies: ~18개
   - Commodities AI: ~15개
   - Dutycalc: ~12개
3. 차트 아래 문구: "POTAL covers every feature from all 10 competitors — combined."
4. 순수 CSS/SVG 또는 가벼운 차트 라이브러리 사용 (번들 크기 최소화)

【C-3】경쟁사 비용 비교 차트
1. 기능 비교 차트 바로 아래에 "Cost Comparison" 섹션
2. 비교 테이블 또는 차트:
   | Provider | Features | Enterprise Annual Cost |
   |----------|----------|----------------------|
   | POTAL | 140 | **$0 (Forever Free)** |
   | Avalara | 44 | $50,000+/yr |
   | Zonos | 38 | $48,000+/yr |
   | ... 나머지 7개 ...
3. POTAL 행을 강조 (배경색 + "FREE" 뱃지)
4. 문구: "They charge Enterprise prices for fewer features. We give you more — for free."

【C-4】"All Free" 강조 요소
1. 네비게이션 바에 "Free" 뱃지 추가 (헤더 로고 옆)
2. 홈 페이지 전체에 걸쳐 "Free" 강조:
   - 히어로 CTA: "Start Free Now"
   - 비교 차트: POTAL 행에 "FREE" 뱃지
   - 하단 CTA: "Join thousands of sellers using POTAL for free"
3. sticky 배너 (페이지 상단): "🎉 All 140 features are now free. No credit card needed."

【C-5】빌드 확인
1. npm run build
2. 빌드 성공하면 Chrome MCP로 localhost 또는 potal.app 접속해서 시각적 확인
3. git add + commit

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가

■ 절대 규칙:
- session-context.md에 없는 경쟁사 수치를 만들지 말 것 — 반드시 archive/Competitor_Feature_Matrix.xlsx에서 확인
- B2C 코드 수정 금지
- console.log 금지
```

---

## ═══════════════════════════════════════
## 순서 3-D: Features 140개 상세 가이드 (터미널1 — Opus)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — Features 140개 상세 가이드 페이지 (D-1 ~ D-4)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- 140개 기능 각각에 대한 상세 사용 가이드 = Custom 세팅 대체 + SEO 140페이지
- Features 페이지에서 기능 카드 클릭 → 해당 기능의 상세 가이드 페이지로 이동
- 초보 셀러도 혼자 세팅할 수 있는 수준으로 작성

■ 작업 목록:

【D-1】상세 가이드 페이지 구조 설계
1. app/features/features-data.ts 읽기 — 140개 기능 데이터 확인
2. POTAL_Feature_Audit_2603290000.xlsx 읽기 — 각 기능별 API 경로, 카테고리 확인
3. 라우팅 구조 결정:
   - app/features/[slug]/page.tsx — 동적 라우트
   - 각 기능에 slug 부여 (예: "hs-code-classification", "landed-cost-calculator")
4. features-data.ts에 slug 필드 추가

【D-2】상세 가이드 페이지 템플릿
1. 각 기능 상세 페이지 구성:
   ┌─────────────────────────────────┐
   │ ← Back to Features              │
   │                                  │
   │ [아이콘] Feature Name            │
   │ [Active 뱃지] [카테고리 뱃지]     │
   │                                  │
   │ ## What it does                  │
   │ 기능 설명 (2~3문장)               │
   │                                  │
   │ ## How to use it                 │
   │ Step 1: ...                      │
   │ Step 2: ...                      │
   │ Step 3: ...                      │
   │ (스크린샷/코드 예시 포함)          │
   │                                  │
   │ ## API Reference                 │
   │ Endpoint: POST /api/v1/...       │
   │ Request body 예시 (JSON)          │
   │ Response 예시 (JSON)              │
   │ cURL 명령어                       │
   │                                  │
   │ ## Related Features              │
   │ [관련 기능 카드 3~5개]             │
   │                                  │
   │ ## Having issues?                │
   │ [Report a bug] [Ask a question]  │
   │ → /community?feature=this-slug   │
   │                                  │
   └─────────────────────────────────┘

【D-3】140개 기능별 콘텐츠 생성
1. features-data.ts의 140개 기능 각각에 대해:
   - description (상세 설명)
   - howToUse (단계별 사용법)
   - apiEndpoint (API 경로)
   - requestExample (JSON)
   - responseExample (JSON)
   - curlExample (cURL 명령어)
   - relatedFeatures (관련 기능 slug 배열)
2. 이 데이터를 features-data.ts에 확장하거나, 별도 features-guides.ts 파일로 분리
3. 한 번에 전부 만들지 말고, 카테고리별로 나눠서:
   - 1차: Core (HS Classification, Landed Cost 등 핵심 기능 ~20개)
   - 2차: Trade + Tax (~30개)
   - 3차: 나머지 (~90개)

【D-4】SEO 최적화
1. 각 페이지에 메타데이터 추가:
   - title: "How to Use [Feature Name] - Free Cross-Border Tool | POTAL"
   - description: 기능별 맞춤 메타 설명
   - og:image: 기능별 카드 이미지 (자동 생성 또는 공통 템플릿)
2. generateStaticParams()로 140개 페이지 정적 생성
3. sitemap.xml에 140개 URL 추가

【D-5】Features 페이지 연결
1. app/features/page.tsx 수정:
   - 기능 카드 클릭 시 → /features/[slug] 로 이동
   - 카드에 "View Guide →" 텍스트 추가
2. 빌드 확인 + git commit

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가

■ 참고:
- 140개 전부를 한 세션에서 완성하기는 어려움
- 1차(핵심 20개) 먼저 완성 → 나머지는 다음 세션에서 순차 추가
- 페이지 구조와 템플릿을 먼저 확실히 잡는 게 핵심
```

---

## ═══════════════════════════════════════
## 순서 3-G: 커뮤니티/서포트 페이지 (터미널3 — Opus)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 커뮤니티/서포트 페이지 (G-1 ~ G-6)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- 유저가 문제점/오류를 남기고 소통하는 페이지
- 헤더에 "Community" 링크 추가
- 140개 기능 가이드 카테고리와 연결
- 글쓰기: 제목 + 유형(버그/질문/제안) + 기능 선택(140개) + 내용 + 첨부
- Features 가이드 하단의 "Having issues?" → 여기로 연결

■ 작업 목록:

【G-1】Supabase 테이블 설계
1. 마이그레이션 파일 생성: supabase/migrations/056_community_forum.sql
2. 테이블 구조:

   community_posts:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id UUID REFERENCES auth.users(id) NOT NULL
   - title TEXT NOT NULL
   - content TEXT NOT NULL
   - post_type TEXT NOT NULL CHECK (post_type IN ('bug', 'question', 'suggestion'))
   - feature_slug TEXT (140개 기능 중 선택, nullable)
   - feature_category TEXT (12개 카테고리 중 하나)
   - attachments JSONB DEFAULT '[]' (URL 배열)
   - upvote_count INT DEFAULT 0
   - comment_count INT DEFAULT 0
   - status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed'))
   - created_at TIMESTAMPTZ DEFAULT NOW()
   - updated_at TIMESTAMPTZ DEFAULT NOW()

   community_comments:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE
   - user_id UUID REFERENCES auth.users(id) NOT NULL
   - content TEXT NOT NULL
   - is_official BOOLEAN DEFAULT FALSE (POTAL 팀 답변 표시)
   - created_at TIMESTAMPTZ DEFAULT NOW()

   community_upvotes:
   - post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE
   - user_id UUID REFERENCES auth.users(id)
   - PRIMARY KEY (post_id, user_id)

3. RLS 정책:
   - 읽기: 누구나 (로그인 불필요)
   - 쓰기: 로그인 유저만
   - 수정/삭제: 본인 글만
   - is_official: service_role만

【G-2】API 엔드포인트
1. app/api/v1/community/posts/route.ts:
   - GET: 게시글 목록 (필터: feature_slug, post_type, status / 정렬: 최신순, 인기순)
   - POST: 새 게시글 작성 (로그인 필수)
2. app/api/v1/community/posts/[id]/route.ts:
   - GET: 게시글 상세 + 댓글
   - PUT: 수정 (본인만)
   - DELETE: 삭제 (본인만)
3. app/api/v1/community/posts/[id]/comments/route.ts:
   - GET: 댓글 목록
   - POST: 댓글 작성
4. app/api/v1/community/posts/[id]/upvote/route.ts:
   - POST: 추천 토글

【G-3】커뮤니티 메인 페이지
1. app/community/page.tsx 재설계 (기존 파일 있음, 수정):
   - 상단: 카테고리 탭 (All / 12개 기능 카테고리 — features-data.ts와 동일)
   - 필터: 유형별(전체/버그/질문/제안), 상태(전체/열림/해결됨)
   - 정렬: 최신순 / 인기순 (추천수)
   - 게시글 목록: 카드 형태 — [유형 뱃지] 제목 / 기능명 / 작성자 / 시간 / 추천수 / 댓글수
   - 우측 또는 상단: "새 글 작성" 버튼
   - 검색 바

【G-4】글쓰기 페이지/모달
1. 글쓰기 폼 구성:
   - 제목 (필수, TEXT)
   - 유형 (필수, 라디오: 🐛 Bug Report / ❓ Question / 💡 Suggestion)
   - 관련 기능 (선택, 드롭다운: 140개 기능 리스트 — features-data.ts에서 가져오기)
   - 내용 (필수, TEXTAREA, 마크다운 지원이면 좋지만 일단 plain text)
   - 첨부파일 (선택, 이미지/스크린샷 업로드 — Supabase Storage 사용)
   - "제출" 버튼
2. URL 파라미터 지원: /community/new?feature=hs-code-classification
   - Features 가이드 하단 "Report a bug" 클릭 시 기능이 자동 선택됨

【G-5】헤더 네비게이션 추가
1. components/layout/Header.tsx 수정:
   - 기존: Home / Features / Pricing / Developers / Help / Blog
   - 변경: Home / Features / Community / Pricing / Developers / Help / Blog
   - "Community" 링크 추가 (데스크톱 + 모바일 메뉴 둘 다)
2. messages/*.json 51개 파일에 nav.community 키 추가

【G-6】빌드 확인
1. npm run build
2. git add + commit

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가

■ 절대 규칙:
- Supabase 마이그레이션은 파일만 생성 (실제 적용은 은태님 확인 후)
- 첨부파일 업로드는 Supabase Storage 사용 (외부 서비스 X)
```

---

## ═══════════════════════════════════════
## 순서 4-F: 문서/코드 동기화 (터미널2 — Sonnet)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 문서 동기화 (F-1 ~ F-5)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- 순서 1~3의 코드 변경이 완료된 후 문서 동기화
- CEO 확정: Exit 전략, Forever Free, Custom 없음, 가입 구조 변경

■ 작업 목록:

【F-1】session-context.md 업데이트
1. "0. POTAL 개요" 섹션의 비즈니스 모델 부분:
   - 기존 요금제(Free/Basic/Pro/Enterprise) → "⚠️ 폐기됨" 표시
   - 새 요금제 추가: "Forever Free (140개 전부 무료) + Enterprise Contact Us"
   - Exit 전략 섹션 추가: "Exit(인수) 전략 중심 — 트래픽/데이터 극대화 → 인수"
2. 가입 구조 변경 기록
3. 날짜+시간(KST) 기록 필수

【F-2】CLAUDE.md 업데이트
1. 상단 코멘트에 피벗 날짜 추가
2. 요금제 관련 기존 내용이 있으면 업데이트
3. "절대 규칙"에 추가:
   - "요금제 관련 코드 수정 시 Forever Free 구조 유지 — 유료 플랜 재도입 금지"

【F-3】docs/PROJECT_STATUS.md 업데이트
1. 요금제 섹션 전면 변경
2. 가입 구조 추가
3. Exit 전략 추가
4. 수치 업데이트: "Forever Free, 0 MRR (의도적)"

【F-4】CHANGELOG.md 업데이트
1. CW22 섹션 추가:
   - "전략 피벗: Exit 중심, Forever Free, 요금제 4단계 폐기"
   - 변경된 파일 목록
   - CEO 결정 사항

【F-5】NEXT_SESSION_START.md 업데이트
1. 현재 상태 요약 갱신
2. 다음 할 일 갱신 (순서 5 바이럴 런칭 준비)
3. CEO 결정 대기 사항 업데이트

■ 로깅:
- POTAL_Claude_Code_Work_Log.xlsx에 새 시트 추가
- POTAL_Cowork_Session_Log.xlsx에도 CW22 세션 기록
```

---

## ═══════════════════════════════════════
## 순서 5-E: 바이럴 마케팅 런칭 (모든 작업 완료 후)
## ═══════════════════════════════════════

```
POTAL 전략 피벗 — 바이럴 마케팅 런칭 준비 (E-1 ~ E-6)

먼저 docs/PIVOT_PLAN_CW22.md를 읽고 전체 피벗 맥락을 이해해.

■ 배경:
- A~G 전부 완성된 상태에서 실행
- 핵심 메시지: "상위 10개 관세 솔루션의 모든 기능을 합쳐도 POTAL보다 적다. 그 회사들은 Enterprise에 연 $50,000을 받는다. POTAL은 전부 무료다."
- 모든 채널 동시 런칭 — 하루에 터뜨리기

■ 작업 목록:

【E-1】Product Hunt 런칭 페이지
1. 타이틀: "POTAL — 140 Cross-Border Features, All Free Forever"
2. 태그라인: "Top 10 competitors combined have fewer features. They charge $50K/yr. We charge $0."
3. 설명문 작성 (500자 이내):
   - 문제: 크로스보더 셀러가 관세 계산에 연 $50,000 지불
   - 해결: POTAL이 140개 기능을 전부 무료 제공
   - 증거: 경쟁사 10개 비교 차트
   - CTA: "Start free at potal.app"
4. 스크린샷 5장: 홈 화면 비교 차트 / Features 페이지 / Dashboard / 상세 가이드 / Community
5. 첫 댓글 (Maker Comment) 초안:
   - 은태님 개인 스토리: "코딩 경험 0인 1인 창업자가 AI로 만들었다"
   - "왜 무료인가": AI 스타트업이라 원가가 $0에 가깝다, 경쟁사처럼 비쌀 이유가 없다

【E-2】Hacker News 포스트
1. 타이틀: "Show HN: I built a free alternative to Avalara/Zonos with 140 features (solo, AI-powered)"
2. 본문 (간결하게):
   - 뭘 만들었는지 (1줄)
   - 왜 무료인지 (2줄)
   - 기술 스택 (1줄)
   - 링크

【E-3】Reddit 포스트 (3개 서브레딧)
1. r/ecommerce: "I made every cross-border commerce tool free — 140 features, $0"
2. r/shopify: "Free Shopify app for landed cost calculation — 140 features included"
3. r/entrepreneur: "I quit my job to build a free alternative to $50K/yr enterprise tools — here's what happened"
4. 각 서브레딧 톤에 맞게 작성 (r/entrepreneur는 스토리텔링, r/shopify는 실용적)

【E-4】LinkedIn 포스트
1. 은태님 개인 계정에서 포스트:
   - Hook: "I just made $50,000/year worth of software free."
   - 스토리: 1인 AI 스타트업, 코딩 0에서 시작, 140개 기능 구현
   - 비교 차트 이미지 첨부
   - CTA: potal.app 링크
2. 해시태그: #CrossBorderCommerce #Ecommerce #SaaS #Startup #FreeTool

【E-5】SNS 공유용 비교 차트 이미지
1. 2장 제작:
   - 기능 수 비교: POTAL 140 vs 경쟁사 10개 (가로 막대)
   - 비용 비교: POTAL $0 vs 경쟁사 Enterprise 비용
2. 크기: 1200x628 (LinkedIn/Facebook 최적) + 1080x1080 (Instagram/Twitter)
3. POTAL 브랜드 컬러 적용

【E-6】런칭 체크리스트
1. 런칭 전 확인:
   - [ ] potal.app 홈 화면 비교 차트 정상 표시
   - [ ] /features 140개 카드 + 상세 가이드 정상
   - [ ] /community 게시판 정상 동작
   - [ ] /pricing "Everything Free" 페이지 정상
   - [ ] 가입 플로우 (5개 필수 → 프로필 완성) 정상
   - [ ] 모바일 반응형 정상
2. 런칭일: 은태님이 결정 (화요일~목요일 추천, Product Hunt 트래픽 최대)
3. 런칭 순서: Product Hunt (오전 12:01 AM PST) → HN → Reddit → LinkedIn (시간차 30분)

■ 이 작업은 코드가 아니라 콘텐츠 준비
- 초안은 Claude가 작성, 최종 수정은 은태님이
- 이미지 제작은 Canva 또는 Figma 권장
```
