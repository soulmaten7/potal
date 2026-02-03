# POTAL Development Changelog

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

## [2026-02-03] Search UX Stabilization, Logic Parity & Layout Finalization

### 1. Detailed Timeline & Fixes (상세 작업 내역)

#### A. Search Logic & Fallback (검색 로직 및 폴백)
- **Issue:** 검색 결과 0건 시 'Found 4 items'라며 가짜(Fake) Amazon/Temu 카드를 생성하거나, 빈 화면이 방치됨.
- **Fix:**
  - `Smart Fallback` 도입: 결과 0건 시 자동으로 `isFallbackMode=true` 전환.
  - 백그라운드에서 `Trending` 또는 `Interest` 키워드로 재검색(API)하여 **실제 상품**을 노출.
  - UI 상단에 **Yellow Banner ("No results found... but we picked these for you")** 표시.
  - **가짜 데이터 생성 함수(`generateFallbackProducts`) 영구 삭제.**
- **Spec:** 0건이면 0건으로 두고, 별도 fallback API 호출로 실제 상품만 채움. 가짜 카드 생성 금지.

#### B. Home & Search Mode Separation (홈/검색 모드 분리)
- **Issue 1 (Input Lock):** 홈 화면에서 타이핑 시 입력값이 초기화되거나, 엔터 전 화면이 전환되는 문제.
- **Fix 1:**
  - 검색 입력의 `value`는 항상 `query` 상태만 반영 (`isHomeMode` 조건 제거).
  - `onChange`에서는 `setQuery`만 수행하고, 화면 전환(`setIsHomeMode(false)`)은 오직 **엔터/클릭 시**에만 수행.
- **Issue 2 (Initial Text):** 앱 초기 진입 시 검색창에 'Trending Tech' 글자가 박혀있는 문제.
- **Fix 2 (Silent Search Pattern):**
  - **UI와 Data의 분리:** 초기화 시 `setQuery('')`(빈값)를 유지하되, `executeSearch('Trending Tech')`와 같이 인자로 키워드를 넘겨 데이터만 로드함.
- **Spec:** 홈 진입 시 검색창은 비워두고, API만 호출. `overrideQuery` 사용 시 UI(`setQuery`) 갱신 금지.

#### C. Mobile Parity & Navigation (모바일 동기화)
- **Issue:**
  - 모바일 하단 'Home' 탭 클릭 시 URL 파라미터만 변하고 화면이 리셋되지 않음.
  - 모바일 코드에 "Global Trending Picks" 텍스트가 하드코딩되어 PC 로직과 불일치.
- **Fix:**
  - **URL Driven Reset:** `page.tsx`에서 `searchParams.get('q')`가 없을 때 강제로 `setIsHomeMode(true)` 및 `setQuery('')` 실행.
  - **One Logic:** 모바일 뷰(`md:hidden`)의 하드코딩 텍스트를 삭제하고, PC와 동일한 `getHomeSubtitle()` 함수 사용.
- **Spec:** PC와 모바일은 데이터/로직/표시 텍스트 100% 동일. 모바일 전용 하드코딩 금지.

#### D. Content Strategy (텍스트 전략)
- **Decision:** 구체적 키워드(예: "Camping")나 긴 문장("Popular items delivered fast...")은 모바일에서 잘리고 본질을 흐림.
- **Spec:**
  - **로그인 유저:** `🎯 Based on your interests` (취향 기반 비교 유도)
  - **비로그인 유저:** `🔥 Trending Now` (트렌드 비교 유도)
  - 위 문구를 PC/모바일, Domestic/Global 섹션에 **동일하게 적용**하여 '비교 플랫폼'의 정체성 강조.

#### E. Layout & Design Polish (레이아웃 최적화)
- **Shipping Guide:**
  - PC: 검색 결과 요약 박스(`SearchInsight`) 우측 하단으로 이동하여 헤더 정돈.
  - Mobile: Filter Bar의 `Global` 칩 우측에 `[📦 Guide]` 칩 추가.
- **Wide View Restoration:**
  - `max-w-screen-2xl` 제한을 해제하고 `w-full`로 복구하여, 와이드 모니터에서 아마존/쿠팡처럼 **꽉 찬 화면(Full Width)** 제공.
  - 태블릿 대응은 Container 폭 제한이 아닌, Grid의 Responsive 속성(`grid-cols-*`)으로 처리.
- **Autocomplete (자동완성):**
  - PC(인라인 검색창)와 모바일(`SearchOverlay`) 양쪽에 검색어 제안(Suggestion) 드롭다운 기능 동시 복구. (데이터 연결 이슈는 To-Do로 이월)

---

### 2. Immutable Rules (불변의 법칙 — 절대 수정 금지)
1. **Mobile Parity:** PC와 모바일은 UI 형태(Grid/List)만 다를 뿐, **데이터 로직, 표시 텍스트, 기능(자동완성 등)은 100% 동일**해야 한다. (모바일용 별도 하드코딩 절대 금지)
2. **No Fake Data:** 검색 결과가 없으면 없다고 말하고(배너), 다른 걸(추천) 보여준다. 가짜 데이터를 생성해서 채우지 않는다.
3. **Silent Init:** 홈 화면 진입 시 검색창은 비워두고(`""`), 데이터는 채운다(`API Call`).

---

### 3. Next Steps
- **Urgent:** 자동완성 Mock 데이터 연결 정상화 (PC/Mobile 공통).
- **Data Analytics:** Google Analytics 4 (GA4) 연동 작업.

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
