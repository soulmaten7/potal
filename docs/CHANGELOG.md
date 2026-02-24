# POTAL Development Changelog

## [2026-02-24] Serper Google Shopping 17개 Provider 추가 + 상품 링크 문제 대응

### 🛒 Serper Google Shopping Provider 확장
- **SerperShoppingProvider 베이스 클래스** 생성 — 17개 provider가 상속하는 공통 추상 클래스
- **16개 신규 Provider 추가**: Best Buy, Home Depot, Lowe's, Nordstrom, IKEA, Wayfair, Newegg, Sephora, Etsy, Mercari, iHerb, Shein, ASOS, Farfetch, YesStyle, MyTheresa
- **기존 Temu Provider** SerperShoppingProvider 기반으로 리팩토링
- Coordinator.ts에 22개 provider 등록 (RapidAPI 5개 + Serper 17개)

### 🔗 상품 링크(URL) 문제 대응 시도
Serper Shopping API가 Google 리다이렉트 URL을 반환하는 근본 문제에 대해 아래 해결책 시도:
1. **2단계 Web Search** (site: 검색으로 실제 URL 찾기) — 부분 성공, 해석률 낮음
2. **RequestThrottler** (5/sec + early release) — rate limit 해결
3. **429 자동 재시도** (1회, 500ms) — 재시도 로직
4. **시간 예산 (10s deadline)** — timeout 방지
5. **directUrlLimit=2 + products=limit** — fallback URL 제거, 상품 수 제한
6. **5분 in-memory 캐시** — 크레딧 절약
7. **카테고리 기반 사전 필터링** — 쿼리 분류 → 관련 provider만 호출

### ❌ 근본 문제 미해결 & 전략 전환 결정
- **Serper 2단계 방식의 한계 인정**: URL 해석률 낮고, 크레딧 과다 소모
- **Temu는 한 번도 제대로 작동한 적 없음** — 가장 처음 추가하려던 provider
- **전략 전환**: Serper 의존 탈피, 각 쇼핑몰별 직접 API (RapidAPI/자체 API) 방식으로 전환
- **다음 단계**: RapidAPI Temu Shopping API 테스트 후 Serper→RapidAPI 전환 시작

### ❌ Temu API 시도 — 전부 실패 (다시 시도하지 말 것)
- **Apify Actor** (`amit123/temu-products-scraper`) — 유일하게 잠깐 동작 후 403 차단 (2026-02-18~)
- **RapidAPI Temu Shopping API** — 호출 자체 안 됨
- **Apify Temu Listings Scraper** — 호출 안 됨
- **Scrapeless** (scraper.temu, webunlocker) — 호출 안 됨
- **Serper organic search** (`site:temu.com`) — 가격 데이터 미포함
- **Serper Shopping** (`query + "temu"`) — URL이 Google 리다이렉트
- **Google &btnI 리다이렉트** — 서버사이드 302 안 됨
- directUrlLimit 5개 이상 — 65 web searches → timeout

---

## [2026-02-23] MVP Final Audit + Live QA Bug Fixes + Phase 1 Learning System

### 🔍 MVP 최종 검수 (2라운드)
- **TypeScript 컴파일**: 0 에러 확인
- **Dead Code 삭제**: amazonApi.ts, MockProvider.ts, debug/route.ts, mockData.ts, page.tsx.bak, SESSION-CONTEXT.md (6개 파일)
- **Console.log 전량 제거**: 13개 파일에서 41개 제거
- **불필요한 `as any` 캐스트 제거**: search/page.tsx
- **QueryAgent.ts 빈 if블록 제거**
- **.gitignore 중복 엔트리 정리**

### 🛡️ Security Hardening
- **Auth Callback**: Open Redirect 방어 강화 (URL 인코딩 우회 + 백슬래시 방어)
- **AI API**: 프롬프트 인젝션 방어 (따옴표 변형 제거, injection 키워드 제거)
- **Error Boundary**: app/error.tsx 앱 전체 크래시 방어 추가

### 🧪 AI Quality Test
- 90개 테스트 케이스 작성 (6개 테스트 스위트)
- isQuestionQuery, analyzeQueryDeterministic, shouldUseAIAnalysis, IntentRouter fallback, FraudFilter, parseOutput
- **100% (90/90) 통과**
- 수정: `which X is best` 패턴, 'buds' 카테고리, comparison 우선순위, `X or Y` 패턴

### 🧠 Phase 1 학습 시스템 구현
- `SearchLogger.ts` — fire-and-forget 비동기 로깅 (검색 블로킹 없음)
- `search_logs` 테이블 (18 컬럼) + `search_signals` 테이블 (7 컬럼) — Supabase
- RLS 활성화 + anon insert 정책
- `signals/route.ts` — 클라이언트 시그널 수집 API
- Coordinator.ts + search/page.tsx에 로깅 연동

### 🐛 Live QA 버그 수정 (3건)
1. **로딩 텍스트 색상**: 데스크톱(#f1f2f8 밝은 배경)에서 텍스트 안 보임 → 반응형 색상 처리 (데스크톱 진한색, 모바일 흰색)
2. **필터 체크박스 겹침**: 긴 텍스트가 체크박스와 겹침 → `min-w-0` + `truncate` + 간격/폰트 축소
3. **가격 오타 인식**: "100dollors", "50bucks", "200dollers" 등 → 자동 정규화 ($100, $50, $200)
   - QueryAgent: priceNormalized + standalonePrice + cleanQuery에서 통화 오타 제거
   - Intent Router: PRICE_PATTERN + fallback 가격 추출에 오타 패턴 추가

### 📄 문서
- `POTAL_AI_EVOLUTION_ROADMAP.docx` — AI 자가 학습 로드맵 (Phase 1-6)
- POST_MVP_CHECKLIST 전면 업데이트
- .cursorrules AI 파이프라인 매핑 추가

---

## [2026-02-04] POTAL 2.0 Home Page Finalization & Strategy Shift

### ⏱️ Timeline & Action Log (1-min granularity)
- **19:50** | **UI/UX Hotfix**: 검색 버튼 컬러 수정. 기존 `#C5A028`(Muddy Gold) 폐기하고 `#F59E0B`(Vivid Amber) + `drop-shadow-md` 적용. 텍스트는 `text-white` 유지하되 `font-extrabold`로 가독성 강화.
- **20:05** | **Content Overhaul**: 가치 제안(Value Props) 텍스트 전면 교체. "Global Comparison", "Total Landed Cost" 개념 명확화.
- **20:10** | **Button Logic**: 검색 버튼 'Always On' 결정. 입력값(`!query`) 여부와 관계없이 시각적으로 항상 활성화 상태 유지 (사용자 유도).
- **20:25** | **Feature Integ**: Shipping Guide FAQ 섹션에 실제 배송 데이터(Amazon Prime, Ali Choice 등)를 2단 그리드(`grid-cols-2`)로 통합. 텍스트 컬러는 `#02122c`(Navy)로 통일하여 이질감 제거.
- **20:30** | **Branding Pivot**: 서비스 주체 변경. "AI"라는 단어를 "POTAL" 또는 "POTAL Agent"로 교체하여 서비스 자체를 의인화/브랜딩화. (Slogan: "POTAL Verified. No Hidden Costs.")
- **20:55** | **UX Decision**: Zipcode 입력 방식 변경. '주소 검색/자동완성' 기능 폐기(MVP 단계 리스크 제거)하고, '정직한 숫자 5자리 입력' 방식으로 회귀.
- **21:05** | **UI Polish**: Market Scope 드롭다운 디자인 변경. 컬러 이모지 제거하고 'Lucide Monochrome Icons' 적용. "Only" 텍스트 삭제로 미니멀리즘 구현.
- **21:15** | **No Fake Policy**: 검색어 추천 기능(Related Suggestions)의 가짜 데이터 로직 전면 삭제. '최근 검색어(Recent Searches)'만 `localStorage` 기반으로 리얼 구현 결정.
- **21:40** | **Privacy Logic**: 검색 기록 저장소 분리. 로그인(`potal_user_recents`)과 비로그인(`potal_guest_recents`) 키값 분리하여 프라이버시 보호 로직 추가.
- **22:00** | **Phase 2 Plan**: 검색 결과 페이지(`/search`) 뼈대 및 Sticky Header 설계 시작.
- **22:20** | **Dev Strategy**: **"PC First"** 원칙 확정. 모바일 반응형(Responsive) 작업을 병행하지 않고, PC 버전(1200px 기준)을 기능적으로 완벽히 끝낸 후 모바일 CSS를 일괄 작업하기로 합의.

### 🧬 Technical Specs (Code & Logic)
- **Color System**:
  - Primary Action (Search Button): `bg-[#F59E0B]` (Tailwind Amber-500).
  - Text Body: `text-[#02122c]` (Deep Navy) & `text-slate-600`.
- **Search Logic**:
  - **Recent History**: Uses `localStorage`.
    - Key (Guest): `potal_guest_recents`
    - Key (User): `potal_user_recents`
  - **Routing**: `router.push("/search?q=...&zip=...&market=...")` via query params.
- **UI Components**:
  - **Market Dropdown**: Custom `div` based dropdown (removed `<select>`). Icons: `Globe`, `Flag`, `Plane` (Slate-500).
  - **Zip Input**: `input[type="text"]`, `maxLength={5}`, numeric only. No auto-complete.
- **Shipping Data (Hardcoded for MVP)**:
  - **Domestic**: Amazon (Prime 2-day), Walmart (W+), Target, Best Buy, iHerb(Expedited).
  - **Global**: AliExpress (Choice 5-7d), Temu (Std 7-15d).

### 🧠 Philosophy & Principles
- **No Fake Data**: MVP라도 '그럴싸한 가짜'는 허용하지 않는다. 기능이 적더라도 100% 리얼 데이터/로직만 보여준다.
- **POTAL is the Agent**: "AI가 했다"고 하지 않고 "POTAL이 검증했다"고 표현하여 브랜드 신뢰도를 높인다.
- **PC First**: 완성도 높은 로직 검증을 위해 PC 버전을 우선 완성하고, 모바일 UX는 후순위로 미룬다. (동시 작업 시 효율 저하 방지).

**⚠️ Development Principle:** All functional updates (Logic, UI features) must be applied to **BOTH PC and Mobile** environments simultaneously. *(One Logic, Multi-Device).*

---

### 📋 UX Consistency & Header Policy
- **Universal Copywriting:** PC와 모바일 간의 문구 일관성(Consistency)을 100% 유지함. 플랫폼에 따라 텍스트를 임의로 축약하거나 변경하지 않음.
- **State-Based Branding:** 로그인 상태에 따라 홈 화면의 메시지를 명확히 분리함.
  - **Logged-in:** `✨ Personalized Picks for You` (관심사 기반)
  - **Guest:** `🔥 Global Trending Picks` (트렌드 기반)
- **Zero Hallucination:** 게스트에게 'Personalized' 문구를 노출하는 오류를 수정하여 서비스 신뢰성 확보.
- **Implementation:** 단일 소스 `homeHeaderText`를 사용하여 모바일 헤더·PC 컬럼 부제에 동일 문구 출력. 상단 레이아웃 수직 압축(로고–검색 간격 축소, 검색–문구–리스트 여백 최소화)으로 포털 대시보드 완성.

---

## [2026-02-04] The "Skyscanner" Pivot (POTAL 2.0)

### 🚨 Strategic Pivot: From Marketplace to Search Engine
- **Context:** 기존 홈 화면의 '추천 상품(Trending)' 나열 방식은 사용자의 검색 목적을 방해하고, 단순 쇼핑몰(Marketplace)로 오인하게 만듦.
- **Decision:** **"Change Everything."** (이건희 회장 인용). 마누라와 자식(핵심 데이터) 빼고 다 바꾼다.
- **New Philosophy:**
  1.  **Zero Noise:** 홈 화면에서 모든 추천 상품 삭제. 오직 '검색창'과 '설정'만 남긴다. (Google/Skyscanner Style)
  2.  **Context-Aware:** [검색어] + [도착지(Zipcode)] + [필터] 3요소만 받는다.
  3.  **Agent Detail:** 클릭 시 바로 이동하지 않고, '가격 변동', '배송 시뮬레이션'을 보여주는 상세 리포트 페이지를 거친다.

### 🛠️ Planned Spec (v2.0 Blueprint)
1.  **Home:**
    - Search Box Only.
    - Destination Input (Shipping Calculation Key).
    - Scope Selector (All / Domestic / Global).
2.  **Mobile Nav:** [Search] - [Wishlist] - [Profile] (Simple 3-Tab). No 'Categories'.
3.  **Search Result:**
    - Sticky Filter Bar (Filter, Sort, Scope).
    - Sort Tabs: Recommended / Fastest / Cheapest.
4.  **Product Detail:**
    - Internal Agent Page before external link.
    - "Export Wishlist" feature added.

---

## [2026-02-03] (Previous) MVP v1.0 Stabilization
### 1. ⚡️ Performance & UX Fixes
- **AI Timeout:** `gpt-4o-mini` 호출 시 2초(2000ms) 타임아웃 적용. 초과 시 원본 반환하여 무한 로딩 방지.
- **Input Sync:** `useRef`를 도입하여 타이핑 중 URL 동기화로 인한 입력 끊김(Input Lock) 현상 해결.
- **Stale Data:** 검색 실행 시 `setList([])`를 선행하여 이전 검색 결과(잔상)가 남는 버그 수정.
- **Visual Distinction:** 모바일 리스트에서 International 상품에 오렌지색 테두리(`border-l-amber-400`) 적용.

---

## [2026-02-02] PC/Mobile Login Path Unification & Sign-In Page Layout
### 🔗 PC Header Login Path
- **Unified Entry:** PC 헤더의 "Sign In" 버튼을 `signInWithOAuth` 직접 호출에서 **`/auth/signin` 링크**로 변경함.
- **Result:** PC에서도 모바일과 동일하게 이메일+구글+X 버튼이 있는 로그인 페이지로 이동하며, 이메일(매직 링크) 로그인 가능.

### 🖥️ Sign-In Page Responsive Layout
- **PC:** `max-w-md mx-auto` + 카드 형태(`md:bg-white md:rounded-2xl md:shadow-sm md:border md:p-8`)로 화면 중앙에 정리.
- **X (닫기) 버튼:** 헤더 왼쪽 상단에 고정, PC/모바일 모두 동일하게 노출.

### 📝 Development Principle Documented
- CHANGELOG 상단에 **"One Logic, Multi-Device"** 원칙을 굵게 추가함.

## [2026-02-02] Mobile Home: Real-Time Comparison Portal (Home-Integrated Zipper)
### 🚀 Features & Fixes
- **Home-Integrated Zipper:** On mobile home (`isHomeMode === true`), Domestic and Global are no longer separate sections. `displayedDomestic` and `displayedInternational` are **interleaved 1:1** into a single list so the 2-column grid shows [left: Amazon/Walmart (Fast), right: AliExpress/Temu (Cheap)] side-by-side for direct comparison.
- **Unified Header:** Home screen uses a single compact line: **"Personalized Picks for You"** (no "Domestic (Fast)" / "Global (Cheap)" section titles). Vertical spacing between search bar and product list reduced for a tighter dashboard feel.
- **Home Entry:** `resetToHome` (hard reload to `/`) ensures the integrated curation view loads immediately with `isHomeMode === true`.

### 📐 UX
- **Goal:** User opens the app and sees a "US vs Global" best-products comparison dashboard in 2 columns without scrolling past section headers.

---

## [2026-02-01] Major UI/UX Overhaul & Logic Stabilization
### 🚀 Features & Fixes
- **Mall Classification:** Moved **eBay** and **iHerb** to **Domestic** (Corrected categorization error).
- **Zipper Ranking:** Implemented 'Interleave' sorting (Amazon #1 -> Walmart #1...) within tabs.
- **Delivery Badges:** Standardized 8 major malls (Amazon=Blue, Ali=Orange, etc.) & removed cluttered tooltips.
- **Pagi items limit" bug. Re-implemented "Show More" button.

### ❌ Rejected / Zombie Ideas (Do Not Resurrect)
- **LLM-based Brand Filter:** Attempted to use AI to infer brands (e.g., AirPods -> Apple) but rejected due to **cost & hallucination**. Switched to **Data-Driven** (API response analysis).
- **4-Column Grid (PC):** Attempted `grid-cols-4` but rejected. Images were too s- **4-Column Grid (PC):** Attempted `grid-cols-4` but rejected. Images were too s- **4-Column Grid (PC):** Attemptedixes
- **Search Logic:** Refactored to `SearchProvider` pattern.
- **Mobile UX:** Changed 'X' button in search bar to Mobile Only (`md:hidden`).
- **Saved Page:** Fixed freezing issue by removing modal overlay and using full page structure.
- **Header:** Changed to `fixed top-0 z-[9999]` to fix touch issues on mobile.

### ❌ Rejected / Zombie Ideas
- **Voice Search:** Rejected for MVP phase.
- **LLM for Search Briefing:** Rejected due to cost/latency. Switched to **Rule-Based** Logic.

---

## [2026-01-30] UI Framework & AI Brain Transplant (Phase 1)
### 🚀 Features & Fixes
- **Layout:** Expanded main container to `max-w-[1800px]` for Amazon-like density.
- **Vertical Grid:** Switched from Horizontalt to Vertical Grid cards.
- **Smart Filters:** Implemented Context-Aware filters (e.g., Gaming Chair -> shows material/features).
- **Security:** Separated LocalStorage keys for User vs Guest search history.

### ❌ Rejected / Zombie Ideas
- **Horizontal List View:** Rejected. "Hard to compare". Switched to **Vertical Grid**.
- **Number Badges:** Removed ranking numbers (1, 2, 3...) as they looked "cheap/flyer-like".

---

## [2026-01-29] Login, Wishlist & Business Model
### 🚀 Features & Fixes
- **Wishlist:** Implemented `localStorage` based wishlist (no login required initially).
- **Monetization:** Implemented "5 Frearches" limit for guests.
- **Design:** Switched from "Coupang Blue" to **"Obsidian & Light"** theme (Deep Indigo/Slate).
- **Discovery:** Added "Zero Query Search" (Recommendations appear before typing).

### ❌ Rejected / Zombie Ideas
- **Heart Icon:** Rejected as "childish". Switched to **Bookmark** icon.
- **Coupang Blue Color:** Rejected. "Not tech enough".

---

## [2026-01-28] Backend Overhaul & Mobile Pivot
### 🚀 Features & Fixes
- **Parallel Fetcher:** Built backend engine to call Amazon/Walmart/Temu APIs simultaneously.
- **Filter Engine:** Implemented Price Slider & Site Checkbox logic.
- **Emergency Mock:** Created fallback data generator for when API keys hit limits.

### ❌ Rejected / Zombie Ideas
- **Mobile First Development:** Attempted to port PC view to Mobile btopped**. Decided to perfect PC view first ("Comparison needs screen space").

---

## [2026-01-27] The "White Screen" Crisis & Rebirth
### 🚀 Features & Fixes
- **Pivot:** Abandoned initial codebase due to unresolvable errors. Re-initialized project with `create-next-app`.
- **First Success:** Successfully displayed "Lego" search results splitting Amazon (US) and Temu (Global).
- **Layout:** Established 60(Domestic) : 40(Global) split layout.

---

## [2026-01-26] Affiliate Strategy & API Keys
### 🚀 Features & Fixes
- **AliExpress:** Obtained App Key (525832).
- **Stra:** Decided to start MVP with Amazon & AliExpress only.
- **Partnerships:** Applied for CJ Affiliate (iHerb, Wayfair) & Awin (Shein).

---

## [2026-01-25] Project Kickoff & Approvals
### 🚀 Features & Fixes
- Milestones:** Awin Approved (19:23), CJ Affiliate Active (21:02), iHerb Applied (21:57).
- **Targeting:** Shifted from Costco (Rejected) to **iHerb** as primary nutrient supplier.
- **Concept:** Defined POTAL as "Decision Tool" (Domestic vs Global Comparison).
