# POTAL — AI Shopping Comparison Agent: Session Context

> 이 파일은 새 AI 세션이 프로젝트의 현재 상태를 완벽히 이해할 수 있도록 작성된 컨텍스트 문서입니다.
> 새 세션 시작 시: "POTAL 프로젝트 작업을 이어서 하려고 해. /Users/maegbug/portal 에 있는 SESSION-CONTEXT.md 파일을 먼저 읽고 시작해줘." 라고 말하면 됩니다.
> **마지막 업데이트: 2026-02-22 (17차 — PWA 설정 완료: manifest, 서비스워커, 앱 아이콘, App Store/Play Store 대비)**

---

## 1. 프로젝트 개요

POTAL은 AI 기반 글로벌 쇼핑 비교 에이전트로, 여러 리테일러(Amazon, Walmart, BestBuy, eBay, Target, AliExpress, Temu 등)에서 상품을 동시에 검색하고 비교해주는 웹 서비스입니다.

- **프로젝트 경로**: `/Users/maegbug/portal` (Mac 로컬)
- **기술 스택**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **⚠️ Next.js 16 주의**: `params`가 Promise로 바뀜 → 동적 라우트에서 `use(params)` 사용 필요
- **⚠️ Tailwind CSS 캐싱 이슈**: 일부 클래스가 적용 안 됨 → **인라인 스타일(`style={{}}`)을 우선 사용** (특히 시각적 핵심 요소)
- **배포**: Vercel Pro (`potal.app`)
- **AI**: OpenAI GPT-4o / GPT-4o-mini (검색 분석, 스마트 필터, 관련성 판단)
- **인증**: Supabase Auth
- **상품 API**: RapidAPI — MVP 활성 5개 (Amazon/Walmart/eBay/Target/AliExpress)
- **❌ BestBuy 비활성화**: bestbuy-usa.p.rapidapi.com — RapidAPI Playground에서도 500 에러 (2026-02-22 확인). 코드 준비 완료, 서버 복구 시 주석 해제.
- **❌ Shein 비활성화**: shein-business-api.p.rapidapi.com — RapidAPI Playground에서도 500 "gateway error" (2026-02-22 확인). 3번째 API 제공자도 불안정. 코드 준비 완료, 서버 복구 시 주석 해제.
- **❌ Temu 비활성화**: Actor `amit123/temu-products-scraper` — 2026-02-18부터 Temu 서버 403 차단. Phase 2에서 대안 검토.
- **❌ Costco 제외**: 오프라인 중심 리테일러, Deals API만 제공. MVP 범위에서 제외.

---

## 2. 프로젝트 구조 (핵심 파일)

```
portal/
├── app/
│   ├── page.tsx                          # 🔥 메인 홈 (모바일/PC 분리 레이아웃)
│   ├── profile/
│   │   └── page.tsx                      # 🆕 프로필 페이지 (2x2 그리드 + 슬라이드 서브페이지 + Zipcode)
│   ├── search/
│   │   └── page.tsx                      # 🔥 검색 결과 페이지 (상태관리: query, sort, market, providerStatus)
│   ├── wishlist/
│   │   └── page.tsx                      # 🔥 위시리스트 (WishlistMobileCard + PC ProductCard + Clear 바텀시트)
│   ├── context/
│   │   └── WishlistContext.tsx            # 🔥 위시리스트 Context (localStorage 'potal_wishlist')
│   ├── components/
│   │   ├── ProductCard.tsx               # 🔥 PC 상품 카드 (공유/하트 아이콘 포함)
│   │   ├── BottomNav.tsx                 # 검색 결과용 바텀 네비
│   │   └── search/                       # ❌ 안 쓰는 백업 파일들 (수정하지 마라!)
│   ├── api/
│   │   ├── search/route.ts               # 검색 API 엔드포인트 → Coordinator 호출
│   │   ├── search/debug/route.ts         # Provider 개별 테스트 진단 API
│   │   └── ai-suggestions/route.ts       # AI Smart Suggestion API (v4.0)
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── Coordinator.ts            # 🎯 핵심: 파이프라인 오케스트레이션 + providerStatus 추적
│   │   │   ├── QueryAgent.ts             # 검색어 분석 + 플랫폼별 쿼리 생성
│   │   │   └── AnalysisAgent.ts          # 비활성화 (shouldRunProductAnalysis = false)
│   │   ├── search/
│   │   │   ├── types.ts                  # 🔥 Product, SearchResult 타입 (providerStatus 포함)
│   │   │   ├── providers/
│   │   │   │   ├── AmazonProvider.ts     # ✅ 작동 — tag=soulmaten7-20
│   │   │   │   ├── WalmartProvider.ts    # ✅ 작동 — affiliateId= (미설정)
│   │   │   │   ├── BestBuyProvider.ts    # ✅ 재활성화 — bestbuy-usa.p.rapidapi.com (PRO)
│   │   │   │   ├── EbayProvider.ts       # ✅ 작동 — campid=5339138476
│   │   │   │   ├── TargetProvider.ts     # ✅ 작동 — target13.p.rapidapi.com
│   │   │   │   ├── AliExpressProvider.ts # ✅ 작동 — aff_id=
│   │   │   │   ├── TemuProvider.ts       # ❌ 비활성화 (Temu 403 차단, Phase 2)
│   │   │   │   ├── SheinProvider.ts      # ✅ 재활성화 — shein-business-api.p.rapidapi.com (PRO $10/mo)
│   │   │   │   └── CostcoProvider.ts     # ❌ 비활성화 (오프라인 중심, MVP 제외)
│   │   │   ├── utils/
│   │   │   │   └── zipCodeDatabase.ts   # 🆕 ZIP 코드 검증 DB (41K ZIP→City,State, 세율 매핑)
│   │   │   ├── FraudFilter.ts            # 규칙 기반 사기 상품 필터
│   │   │   ├── CostEngine.ts             # Total Landed Cost 계산
│   │   │   └── ScoringEngine.ts          # Best/Cheapest/Fastest 점수 + membershipBadge 생성
│   │   ├── retailerConfig.ts             # 🎯 어필리에이트 설정 + matchShippingProgram() + getRetailerConfig()
│   │   └── ai/
│   │       ├── prompts/
│   │       │   ├── smart-filter.ts       # AI Smart Suggestion v4.0 (gpt-4o)
│   │       │   ├── intent-router.ts      # 검색 의도 분류
│   │       │   └── product-judge.ts      # 상품 관련성 판단 (ProductJudge)
│   │       └── types.ts                  # AI 관련 타입 정의
│   └── types/
│       └── product.ts                    # Product 타입 정의
├── components/
│   ├── home/
│   │   ├── HeroVisuals.tsx               # 데스크톱 슬로건+Feature Cards
│   │   └── SearchWidget.tsx              # 🔥 대폭 리팩토링 — 모바일/데스크톱 분리 레이아웃
│   ├── layout/
│   │   ├── Header.tsx                    # 모바일 nav 아이콘 hidden (바텀탭 대체)
│   │   ├── MobileBottomNav.tsx           # 🔥 글라스모피즘 pill 바텀 네비 (Search/Wishlist/Profile)
│   │   └── Footer.tsx                    # 데스크톱만 표시 (hidden md:block)
│   ├── search/
│   │   ├── StickyHeader.tsx              # 🔥 검색 스티키 헤더 (market 탭, 정렬)
│   │   └── ResultsGrid.tsx              # ⚠️ 실제 사용 파일! MobileCompactCard + Then By + Partial Failure
│   ├── icons.tsx                         # 🔥 Share, Heart, HeartFilled, Shield, ChevronLeft, Plus 등
│   └── ui/                              # 공통 UI 컴포넌트
├── .env.local                            # 실제 API 키 (절대 수정하지 마세요)
├── .cursorrules                          # AI 행동 지침 + 절대 규칙
└── SESSION-CONTEXT.md                    # 이 파일
```

> **⚠️ 매우 중요**: `app/components/search/` 폴더의 파일들은 안 쓰는 백업 파일. `components/search/ResultsGrid.tsx`가 **실제** 사용 파일이다. 절대 혼동하지 마라!

---

## 3. 아키텍처: 검색 파이프라인

```
사용자 쿼리
    ↓
[IntentRouter] — 의도 분류 (PRODUCT_SPECIFIC/CATEGORY/QUESTION/PRICE_HUNT/COMPARISON)
    ↓
[QueryAgent] — 플랫폼별 검색어 생성
    ↓
[ProviderAPIs] — 7개 리테일러 병렬 검색 (각 12초 타임아웃)
    ↓
[FraudFilter] — 규칙 기반 사기 상품 제거
    ↓
[ProductJudge] — AI 관련성 필터링 (AnalysisAgent 대신 사용 중)
    ↓
[CostEngine] — Total Landed Cost 계산
    ↓
[ScoringEngine] — Best/Cheapest/Fastest 점수
    ↓
[Interleaving] — 사이트별 교차 배치 (backend + frontend 이중 적용)
    ↓
결과 반환
```

**AnalysisAgent 비활성화 이유**:
- gpt-4o-mini가 20개 상품 + JSON mode + 1500 토큰을 5초 안에 못 처리
- 매 검색마다 6초 타임아웃 발생 → 기본값 반환 → 시간만 낭비
- ProductJudge가 대신 관련성 필터링 수행 (더 빠르고 안정적)
- `app/lib/agent/AnalysisAgent.ts`의 `shouldRunProductAnalysis()`가 `return false`로 설정됨

---

## 4. 어필리에이트 링크 생성 구조

### 중앙 설정: `app/lib/retailerConfig.ts`
각 리테일러별 `affiliateParamKey`와 `affiliateEnvKey`가 정의됨.

### Provider별 어필리에이트 태그 자동 삽입
어필리에이트 태그는 **Provider 레벨**에서 API 응답 매핑 시 자동 삽입됨. 프론트엔드에서 별도 처리 불필요.

| Provider | 함수 | 파라미터 | env 변수 | 현재 값 |
|----------|------|----------|----------|---------|
| Amazon | `appendAffiliateTag()` | `tag=` | `AMAZON_AFFILIATE_TAG` | `soulmaten7-20` ✅ |
| eBay | `buildEbayLink()` | `campid=` + `toolid=10001` | `EBAY_CAMPAIGN_ID` | `5339138476` ✅ |
| AliExpress | `appendAliAffiliate()` | `aff_id=` | `ALIEXPRESS_AFFILIATE_ID` / `ALIEXPRESS_APP_KEY` | 설정됨 ✅ |
| Temu | `appendTemuAffiliate()` | `aff_code=` | `TEMU_AFFILIATE_CODE` | `alb130077` (API 비활성화) |
| Walmart | `appendWalmartAffiliate()` | `affiliateId=` | `WALMART_AFFILIATE_ID` | ⏳ 미설정 — Impact 승인 후 |
| Target | `appendTargetAffiliate()` | `afid=` | `TARGET_AFFILIATE_ID` | ⏳ 미설정 — Impact 승인 후 |
| BestBuy | `appendBestBuyAffiliate()` | `irclickid=` | `BESTBUY_AFFILIATE_ID` | ❌ API 비활성화 |

### 링크 흐름
```
Provider에서 상품 검색 → 각 Provider의 append*Affiliate() 함수가 URL에 태그 자동 삽입
    → product.link에 저장 → ProductCard의 handleViewDeal()이 window.open(product.link)
    → 사용자가 리테일러 사이트로 이동 → 어필리에이트 클릭 트래킹
```

**.env에 ID만 넣으면** 해당 리테일러의 어필리에이트 링크가 자동으로 작동함.

---

## 5. 비즈니스 정보

### 사업자 정보
- **사업체명**: POTAL OFFICIAL
- **대표자명**: EUNTAE JANG (장은태)
- **이메일 (개인)**: soulmaten7@gmail.com
- **이메일 (사업)**: contact@potal.app
- **웹사이트**: https://www.potal.app/
- **전화 (미국)**: +1 (760) 279-7437 (Talkatone 앱)
- **전화 (한국)**: +82 10-8019-8457

### US 사업 주소 (Anytime Mailbox) — ✅ 2026-02-20 활성화 완료!
- **주소**: 2803 Philadelphia Pike, Suite B #1126, Claymont, DE 19703, United States
- **상태**: ✅ **활성화 완료** (2026-02-20 승인 메일 수신)
- **서비스**: Global Express Partners
- **USPS Form 1583**: Proof 앱으로 공증 완료 (Albert Johnson, VA)
- **용도**: 어필리에이트 프로그램 가입, 사업 서신 수령, 세금 서류용

### 플랫폼 계정 정보

#### Supabase
- **Organization**: soulmaten7's Org
- **Project Name**: potal
- **Project URL**: https://zyurflkhiregundhisky.supabase.co
- **Publishable API Key**: sb_publishable_9SvOrlirIrkqtO5-gMMgNg_nsU3x06C
- **Secret Key**: sb_secret_***REDACTED*** (see .env.local)

#### Google OAuth
- **Client ID**: 275221567460-voh5vhu6usjmls9796ue52vaqutg1r6t.apps.googleusercontent.com

#### OpenAI Platform
- **API Key Name**: potal maun

#### Google Analytics
- **Measurement ID**: G-NQMDNW7CXP

### 어필리에이트 채널 로그인 이메일
| 플랫폼 | 이메일 |
|--------|--------|
| **Impact.com** | contact@potal.app |
| **CJ Affiliate** | soulmaten7@gmail.com |
| **Rakuten** | soulmaten7@gmail.com |
| **Wise** | soulmaten7@gmail.com |
| **Amazon Associates** | soulmaten7@gmail.com |

### PayPal (Temu 출금 전용)
- **이메일**: soulmaten7@gmail.com
- **국가**: 한국 (은행 연결 불가, 카드 출금만 가능)
- **출금 방법**: 카카오뱅크 체크카드 (Visa/Mastercard 확인 필요)
- **용도**: Temu 어필리에이트 출금 ($20 이상 시)
- **참고**: Temu는 PayPal 또는 Temu 크레딧만 출금 가능 (Wise 불가)

### Temu Affiliate 주의사항
- **거주지 리스크**: Policy에 "US legal resident" 자격 요건 있음 — 현재 승인된 상태이므로 그대로 진행
- **커미션**: New App User 최초 10건, New Web User 1건만
- **최소 출금**: $20 (현재 잔액 $2)
- **30일 검증 기간**: 커미션 확정까지 30일 대기
- **Affiliate code 확인 필요**: .env에 `alb130077` vs 대시보드 `alb450063` — 어떤 게 활성 코드인지 확인 필요

### Wise USD 계좌 (어필리에이트 수수료 수령용)
- **이름**: EUNTAE JANG
- **계좌번호**: 145229234931719
- **라우팅번호**: 084009519
- **은행명** (어필리에이트 등록 시): Community Federal Savings Bank
- **Swift/BIC**: TRWIUS35XXX
- **계좌 유형**: Checking (Deposit)

---

## 6. 어필리에이트/수익화 현황

### 어필리에이트 플랫폼 현황 (2026-02-22 기준)

| 플랫폼 | 상태 | 은행 | 다음 단계 |
|--------|------|------|----------|
| **Amazon Associates** | ✅ 활성 | Wise EFT 등록 완료 | 주소 Delaware 업데이트 완료 (19703-2506), 프로필 POTAL 업데이트 완료 |
| **Impact.com** | ⚠️ 주소 변경 심사 중 | Wise EFT (무료) 등록 완료 | Corporate/Billing Address → DE 주소로 변경 요청 접수 (티켓 #782618). 1-3영업일 승인 대기 |
| **CJ Affiliate** | ✅ 가입완료 | Wise 등록 완료 ($50 최소) | US 주소 등록 완료 (Suite B No 1126), W-8BEN 제출, 프로필 작성 완료. Shein Apply 대기 (메인터넌스 확인) |
| **Rakuten** | ⚠️ 계정 재활성화 완료, 프로필 완료 대기 | 카카오뱅크 (한국 원화) | 계정 재활성화 완료 (compliance팀 승인 2026-02-22). W-8BEN 이슈 해결: 한국 주소 유지 + W-8BEN 제출. 은행=카카오뱅크 (Rakuten은 한국 주소 설정 시 한국 은행만 등록 가능, Wise USD 불가). Publisher Profile 58% → "Complete company details" 미완료 표시 → 내부팀 확인 중 (Madhu Chatterjee, 이메일 답변 대기). 광고주 Apply는 Company details 완료 후 가능. |
| **eBay Partner Network** | ✅ 활성 | — | campid=5339138476 적용 중 |
| **AliExpress Portals** | ✅ 활성 | — | aff_id 적용 중 |
| **Walmart (Impact)** | ⏳ 가입 대기 | — | Impact 주소 승인 후 Apply |
| **Target (Impact)** | ⏳ 가입 대기 | — | Impact 주소 승인 후 Apply |
| **BestBuy (Impact/CJ)** | ⏳ 가입 대기 | — | Impact/CJ에서 Apply |
| **Shein (CJ)** | ⏳ 가입 대기 | — | CJ에서 SHEIN(Advertiser ID: 6293473) Apply |
| **Temu 직접** | ✅ 승인완료 | PayPal (soulmaten7@gmail.com) | 대시보드 접근 가능. 코드: alb450063, frl67712, alc155113. 최소출금 $20 (현재 $2) |

### Impact.com 계정 설정 (2026-02-20 완료)
- **Account ID**: 6999751
- **Organization Type**: Individual/Sole Proprietor
- **Currency**: USD
- **Timezone**: → **(GMT -05:00) Eastern Time** 으로 변경 필요
- **Corporate Address**: Delaware 주소로 변경 요청 접수 (심사 중)
- **Billing Address**: Delaware 주소로 변경 요청 접수 (심사 중)
- **Bank**: Wise EFT — Beneficiary: EUNTAE JANG, Account: 145229234931719, Routing: 084009519
- **Autopay**: Threshold $50 이상 권장 (기본 $10)
- **Contacts**: Technical/Commercial/Security 모두 EUNTAE JANG

---

## 7. 모바일 UX 오버홀 (2026-02-20~21 — 스카이스캐너 스타일)

### 디자인 원칙
- **Skyscanner 모바일 UX** 를 주요 레퍼런스로 사용
- 전체 페이지 배경: **네이비(`#02122c`)** 통일
- 바텀 네비: **글라스모피즘** (frosted glass pill bar)
- Tailwind 캐싱 문제 → **인라인 스타일(`style={{}}`)** 우선 사용
- 오렌지(`#F59E0B`) 포인트 컬러

### 유저 피드백 패턴 (중요!)
- 수정 전이 나을 때 바로 "수정전이 더 괜찮네" → 즉시 리버트
- 이모지 아이콘 배경 박스 싫어함 → 이모지만 사용
- 오렌지 포인트 좋아하지만 흐리면 안됨 → 진하게 (`/60` 삭제, `font-bold`)
- 콜라보레이션 방식: 유저가 방향 제시 → 구현 → 유저 피드백 → 조정

### 변경된 파일 & 핵심 변경 내용

#### 🔥 `components/layout/MobileBottomNav.tsx` — 글라스모피즘 재작성
- 모바일 하단 고정 네비게이션 바 (3탭: Search / Wishlist / Profile)
- **전체 인라인 스타일로 재작성** (Tailwind 캐싱 문제 해결)
- 글라스모피즘:
  ```
  background: rgba(255,255,255,0.12)
  backdropFilter: blur(40px) saturate(180%)
  WebkitBackdropFilter: blur(40px) saturate(180%)  // Safari 대응
  boxShadow: 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)
  border: 1px solid rgba(255,255,255,0.18)
  ```
- Pill 형태: `bottom: 16px`, `borderRadius: 9999px`
- Active 탭: 오렌지(`#F59E0B`) + pill 배경 `rgba(255,255,255,0.15)`
- Inactive 탭: 흰색(`#ffffff`), `fontWeight: 900`

#### 🔥 `app/profile/page.tsx` — Skyscanner 스타일 2x2 그리드 + 슬라이드 서브페이지
- **메인 뷰**: 타이틀 "Profile" → 로그인/유저 배너 → 2x2 카드 타일 그리드
  - Account(#F59E0B), Settings(#60a5fa), Help(#34d399), Legal(#a78bfa)
- **슬라이드 애니메이션**: 메인 `translateX(-30%)` + opacity 0, 서브 `translateX(100%)` → `translateX(0)`
  - `requestAnimationFrame(() => setSlideIn(true))` 트리거
  - `closeSubPage`: `setSlideIn(false)` → 300ms 후 `setActivePage(null)`
- **Account 서브페이지** (Zipcode 기능 연동):
  - 유저 정보 카드 (아바타 + 이메일/Guest)
  - **Primary Zipcode** (읽기 전용): `localStorage('potal_zipcode')` 연동, 실제 값 표시
    - "Not set" 일 때 "Add a location below to set" 안내
    - Set Primary 시 녹색 "Saved!" 피드백
  - **Add New Location**: 버튼 → 인풋 펼침 (5자리 숫자만), Add/Cancel 50:50 배치
    - `potal_zipcode_list` localStorage에 저장, Primary 없으면 자동 설정
  - **Saved Locations**: 리스트 (카운트), "Set Primary" / X 삭제, Active 오렌지 뱃지
    - 비어있으면 "No saved locations yet" dashed 카드
  - **Log out** (빨간) / **Log in or sign up** (오렌지)
- **Settings 서브페이지**: Language & Currency (USD 활성 / KRW Soon), Notifications Soon
- **Help 서브페이지**: Help Centre → `/help`, Affiliate → `/partners`, About → `/about`, 이메일
- **Legal 서브페이지**: Terms/Privacy/Cookie/Privacy Settings → `/legal/[slug]`

#### 🔥 전체 페이지 배경 네이비 통일 (바텀 네비 가시성)
- `app/page.tsx` — body/wrapper `bg-slate-50` 제거, 검색결과 뷰에만 적용
- `app/wishlist/page.tsx` — `backgroundColor: '#02122c'` + 다크 테마 empty state (더블 서클 + 오렌지 하트)
- `app/help/page.tsx` — 화이트→네이비, 검색창/FAQ 아코디언/컨택트폼 다크 테마
- `app/partners/page.tsx` — 화이트→네이비, 파트너 박스 모바일 2열 그리드
- `app/about/page.tsx` — 화이트→네이비, 메트릭 2x2, 밸류 카드 다크
- `app/legal/[slug]/page.tsx` — 화이트→네이비, 콘텐츠 카드 다크 + **Next.js 16 params 수정**

#### 🔥 `app/legal/[slug]/page.tsx` — Next.js 16 params Promise 수정
- **문제**: Next.js 16에서 `params`가 Promise → `params.slug` 직접 접근 시 undefined → 404
- **해결**: `"use client"` + `import { use } from 'react'` + `const { slug } = use(params)`
- `params` 타입: `{ params: Promise<{ slug: string }> }`

#### 🔥 `components/search/ResultsGrid.tsx` — 검색 결과 모바일 리디자인 (2026-02-21~22)
- **MobileCompactCard**: 2열 그리드 상품 카드 완전 재디자인
  - 이미지 컨테이너: `paddingBottom: '125%'` + `height: 0` + `position: absolute` img (고정 비율)
  - 이미지 우측상단: 공유 아이콘(3-node 네트워크) + 하트 아이콘 (반투명 원형 배경)
  - 가격 영역 3줄 구조: 뱃지+배송+배송일 / Est.Tax / Total 가격
  - 4단계 뱃지 우선순위: membershipBadge → shippingProg → is_prime → appliedMembership
- **Then By 세컨더리 정렬**: 결과 카운트 줄 우측에 Best/Fastest(또는 Cheapest) 버튼
  - 선택된 버튼: 흰 배경(`#ffffff`) + 다크 텍스트(`#02122c`) — 메인 정렬 탭과 동일 스타일
- **Partial Failure 배너**: 리테일러별 성공/실패 추적 (amber 경고 배너)
- **No Results 화면**: 쿼리 제안 + 실패 리테일러 정보 + 돌아가기 버튼
- **providerStatus prop** 추가 (Coordinator → page.tsx → ResultsGrid)

#### 🔥 `app/wishlist/page.tsx` — 위시리스트 모바일 카드 통일 (2026-02-22)
- **WishlistMobileCard**: 검색결과 MobileCompactCard와 동일한 스타일 구현
  - 2열 그리드 (`grid-cols-2 gap-1.5`)
  - 동일한 이미지 컨테이너, 가격 3줄 구조, 멤버십 뱃지 시스템
  - 하트 아이콘 빨간색 (이미 저장됨), 클릭 시 위시리스트에서 제거
- **Clear 확인**: 브라우저 `confirm()` 대신 바텀시트 UI (z-[10002], 오버레이+블러, Cancel/Clear All)
- PC: 기존 `ProductCard` 유지 (`hidden md:block`)

#### 🔥 `app/components/ProductCard.tsx` — PC 카드 공유/하트 아이콘
- 이미지 우측상단에 공유+하트 아이콘 추가 (반투명 원형 배경)
- `handleShare`: navigator.share API / clipboard 폴백
- 데스크톱(`hidden md:flex`)과 모바일(`md:hidden`) 카드 모두 적용

#### 🔥 `components/icons.tsx` — Share 아이콘 추가
- Skyscanner 스타일 3-node 네트워크 공유 아이콘 (3 circles + connecting lines)

#### 🔥 `app/lib/agent/Coordinator.ts` — 리테일러별 상태 추적
- `_lastProviderStatus` 필드 추가
- `Promise.allSettled`로 per-retailer success/failure/timeout 추적
- `providerStatus`를 metadata에 포함하여 프론트엔드에 전달

#### 🔥 `app/lib/search/types.ts` — providerStatus 타입 추가
- `SearchResult.metadata`에 `providerStatus?: Record<string, { status: 'ok' | 'error' | 'timeout'; count: number }>` 추가

#### 🔥 `app/search/page.tsx` — providerStatus 상태 관리
- `providerStatus` state 추가, API 응답에서 추출, ResultsGrid에 prop 전달

#### `components/home/SearchWidget.tsx` — Recent Searches 갭 수정
- 드롭다운을 검색 필드 `px-3` 밖으로 이동, 카드 하단에 직접 붙임
- `marginTop: '-16px'`, `paddingTop: '16px'`, 상단 radius 0

#### `app/page.tsx` — 프로모 카드 오렌지 포인트
- "Learn more →" / "3 easy steps →": `text-[#F59E0B] font-bold`
- 이모지 배경 박스 제거 (유저 피드백)

#### `components/home/HeroVisuals.tsx` — 원본 유지
- 모바일: 슬로건 "Domestic Speed. Global Prices. One Search."
- 데스크톱: 기존 슬로건 + 3개 Feature Cards

#### `app/layout.tsx` — Footer hidden + MobileBottomNav
- body에서 `bg-slate-50` 제거
- Footer: `hidden md:block`, MobileBottomNav 추가

#### `app/globals.css` — 정리
- `.hero-pattern` 제거, `.safe-area-bottom` 추가

#### `components/icons.tsx` — 아이콘 추가
- `Shield`, `ChevronLeft`, `Plus` 아이콘 추가

#### `components/layout/Header.tsx`
- 모바일 nav 아이콘 → `hidden md:flex` (바텀탭 대체)

### localStorage 키
| 키 | 용도 | 스코프 |
|---|---|---|
| `potal_wishlist` | 위시리스트 상품 배열 (JSON) | 전체 — WishlistContext.tsx에서 관리 |
| `potal_zipcode` | Primary/Active zipcode | 전체 |
| `potal_zipcode_list` | 저장된 위치 리스트 (JSON 배열) | 전체 |
| `potal_user_zips` | 최근 검색 zip (최대 3개) | 로그인 유저 |
| `potal_guest_zips` | 최근 검색 zip (최대 3개) | 게스트 (24시간 만료) |
| `potal_guest_expiry` | 게스트 데이터 만료 시간 | 게스트 |
| `user_currency` | 통화 설정 (USD/KRW) | 전체 |

---

## 8. 최근 커밋 이력

### 커밋 1: `3b95b2c` (2026-02-18)
```
feat: AI Smart Filter v4.0 + interleaving fix + AnalysisAgent disable
```

### 커밋 2: `a1925fd` (2026-02-19)
```
fix: TemuProvider Apify 복원
```

### 커밋 3: `693f17d` (2026-02-19)
```
fix: 모바일 반응형 2차 — StickyHeader, ResultsGrid, AiSmartSuggestionBox
```

### 커밋 4: `e5761de` (2026-02-22) — ✅ push 완료, Vercel 배포됨
```
feat: 모바일 UX 대규모 오버홀 — Skyscanner 스타일 다크 테마 통일
```
26개 파일 변경, +3881/-1344줄. 이 커밋에 포함된 모든 변경사항:

| 파일 | 변경 내용 |
|------|----------|
| `components/layout/MobileBottomNav.tsx` | 🔥 글라스모피즘 인라인 스타일 전체 재작성 |
| `app/profile/page.tsx` | 🔥 Skyscanner 스타일 2x2 그리드 + 슬라이드 서브페이지 + Zipcode 기능 연동 |
| `app/wishlist/page.tsx` | 🔥 모바일 카드 리디자인 (WishlistMobileCard) + 바텀시트 Clear 확인 + 멤버십 뱃지 |
| `app/help/page.tsx` | 🔥 네이비 다크 테마 전환 (검색/FAQ/컨택트폼) |
| `app/partners/page.tsx` | 🔥 네이비 다크 테마 + 모바일 2열 그리드 |
| `app/about/page.tsx` | 🔥 네이비 다크 테마 (메트릭 2x2, 밸류 카드) |
| `app/legal/[slug]/page.tsx` | 🔥 네이비 다크 테마 + Next.js 16 params Promise 수정 (404 해결) |
| `components/home/SearchWidget.tsx` | 🔥 대폭 리팩토링 + Recent Searches 갭 수정 |
| `components/home/HeroVisuals.tsx` | 원본으로 리버트 유지 |
| `app/page.tsx` | 🔥 모바일 홈 전체 재구조 + 프로모 카드 오렌지 텍스트 |
| `app/layout.tsx` | Footer hidden, MobileBottomNav 추가, body bg-slate-50 제거 |
| `app/globals.css` | hero-pattern 제거, safe-area-bottom 추가 |
| `components/icons.tsx` | 🔥 Shield, ChevronLeft, Plus, Share 아이콘 추가 |
| `components/layout/Header.tsx` | 모바일 nav 아이콘 hidden (바텀탭 대체) |
| `components/search/ResultsGrid.tsx` | 🔥 MobileCompactCard 리디자인 + Then By 정렬 + 공유/하트 아이콘 + Partial Failure 배너 + No Results 화면 |
| `app/components/ProductCard.tsx` | 🔥 PC 카드 이미지 우측상단 공유/하트 아이콘 추가 |
| `app/search/page.tsx` | 🔥 providerStatus 상태 관리 추가 |
| `app/lib/agent/Coordinator.ts` | 🔥 BestBuy/Temu 비활성화 + providerStatus per-retailer 추적 |
| `app/lib/search/types.ts` | 🔥 providerStatus 타입 추가 |
| `app/lib/search/providers/TargetProvider.ts` | MicroAPI → target13 복원 |
| `app/lib/search/providers/TemuProvider.ts` | build 버전 고정 (v1.0.32), 비활성화 |
| `app/api/search/debug/route.ts` | 🆕 Provider 개별 테스트 진단 API |
| `SESSION-CONTEXT.md` | 9차 업데이트 |
| `.cursorrules` | 🔥 검색카드 구조, z-index 규칙, No confirm() 규칙, 파일 매핑 추가 |

---

## 9. 리테일러 API 현황

### 작동 중 (5개)
| 리테일러 | API 소스 | 상태 | 비고 |
|---------|----------|------|------|
| Amazon | RapidAPI `real-time-amazon-data` | ✅ 정상 | country=US 고정 |
| Walmart | RapidAPI `realtime-walmart-data` | ✅ 정상 | |
| eBay | RapidAPI `real-time-ebay-data` | ✅ 정상 | .com TLD 고정, 간헐적 CAPTCHA |
| Target | RapidAPI `target13` | ✅ 정상 | **target13.p.rapidapi.com** PRO $9/mo, store_id=3207 |
| AliExpress | RapidAPI `aliexpress-data` | ✅ 정상 | country_code 변경 가능 |

### 비활성화 (4개)
| 리테일러 | 이유 | 해결책 |
|---------|------|--------|
| BestBuy | Pinto Studio API 서버 무응답 (Shein과 동일 업체) | RapidAPI 환불 → Impact/CJ에서 BestBuy 프로그램 가입 후 공식 API |
| Temu | Apify Actor 403 차단 (2026-02-18~). 모든 빌드 실패 | Temu Individual Affiliate 신청 중 (승인 대기 2-5일) |
| Shein | RapidAPI API 전부 죽음 (보안 강화) | CJ Affiliate API로 연동 예정 |
| Costco | Deals API만 제공 (전체 검색 불가) | 기술적 한계, 시장점유율 1.5%로 우선순위 낮음 |

---

## 10. MVP 체크리스트

### 코드/기능 (완료)
- [x] AI Smart Suggestion v4.0 (gpt-4o + 데이터 강화)
- [x] Global 상품 인터리빙
- [x] AnalysisAgent 비활성화 (ProductJudge 대체)
- [x] SEO 기본 (meta tags, sitemap, robots.ts, Open Graph, JSON-LD)
- [x] 모바일 반응형 1차 + 2차 완료
- [x] TemuProvider Apify 복원 (코드 유지, 비활성화)
- [x] TargetProvider target13 복원
- [x] BestBuy/Temu 비활성화
- [x] 모바일 홈 터치 수정
- [x] Debug API (/api/search/debug)
- [x] 모바일 UX 오버홀 — 스카이스캐너 스타일 (바텀탭, 프로필, SearchWidget 리팩토링)
- [x] 전체 페이지 네이비 다크 테마 통일 (Home/Wishlist/Profile/Help/Partners/About/Legal)
- [x] 바텀 네비 글라스모피즘 (인라인 스타일 재작성)
- [x] Profile Zipcode 기능 연동 (PC버전 localStorage 동기화)
- [x] Legal 동적 라우트 404 수정 (Next.js 16 params Promise)
- [x] 아이콘 추가 (Shield, ChevronLeft, Plus, Share)
- [x] Recent Searches 드롭다운 갭 수정
- [x] 프로모 카드 오렌지 포인트 텍스트
- [x] **검색 결과 모바일 리디자인** — MobileCompactCard 2열 그리드, 이미지 고정비율, 가격 3줄 구조
- [x] **Then By 세컨더리 정렬** — 모바일 결과 카운트 줄 우측에 추가
- [x] **공유 + 하트 아이콘** — 모바일/PC 상품 카드 이미지 우측상단 (Skyscanner 스타일 공유 아이콘)
- [x] **Partial Failure 핸들링** — Coordinator providerStatus 추적 + 프론트엔드 배너 (Skyscanner 패턴)
- [x] **No Results 화면** — 쿼리 제안, 실패 리테일러 정보, 돌아가기 버튼
- [x] **위시리스트 모바일 카드 통일** — WishlistMobileCard (검색결과와 동일 스타일)
- [x] **위시리스트 멤버십 뱃지** — 4단계 우선순위 뱃지 시스템 (검색결과와 동일)
- [x] **위시리스트 Clear 바텀시트** — confirm() 제거, 모바일 친화적 바텀시트 확인 UI
- [x] **모바일 카드 텍스트/아이콘 크기 업** — 모바일 표준 적용 (셀러 9px, 상품명 12px, Total 18px, 아이콘 16px+36px터치영역)
- [x] **Partial Failure 배너 간소화** — 리테일러 이름 제거, "Some retailers didn't respond" 간결 메시지 (모바일+PC)
- [x] **"AI Smart Suggestion" → "POTAL Filter" 리브랜딩** — 사용자 노출 텍스트 전체 변경 (AiSmartSuggestionBox, search/page, API route)
- [x] **카메라 아이콘 → + 버튼** — ChatGPT/Claude AI 스타일 + 버튼 (SearchWidget 모바일28px/PC30px, StickyHeader 모바일24px/PC32px). 비활성=흰배경+테두리, 활성=오렌지
- [x] **공유/하트 아이콘 경량화** — 원형 배경 제거, drop-shadow만 적용, 가로 배치, gap 2px (모바일+위시리스트)
- [x] **Partial Failure 배너 완전 제거** — 사용자 신뢰도 저하 방지. 부분 실패 시 UI 알림 없이 결과만 표시 (모바일+PC)
- [x] **모바일 의문문 검색 플로우 개선** — 의문문 검색 시 POTAL Filter 시트 자동 오픈 (PC와 동일하게 카테고리 후보를 즉시 표시)
- [x] **스플래시 스크린** — Amazon 스타일. sessionStorage 기반으로 브라우저 탭 닫고 다시 열 때만 POTAL 로고 표시 (1.5초 fade in/out). 모바일만
- [x] **모바일 홈 슬로건 제거** — HeroVisuals 모바일 슬로건 제거, 검색바 placeholder "POTAL Search"로 변경. 세로 공간 절약
- [x] **검색바 Amazon 스타일 리디자인** — 돋보기(왼쪽, 진한색) + input + 카메라(오른쪽, 진한색). ZIP 입력은 별도 줄 유지. 홈(SearchWidget) + 검색결과(StickyHeader) 양쪽 적용
- [x] **카메라 OS 기본 picker** — Take Photo/Upload Photo 자체 메뉴 제거. `<input accept="image/*">` 하나로 OS가 카메라/사진첩 선택지 표시. cameraInputRef 제거

### 코드/기능 (남은 작업)
- [ ] **Temu 재연동** — Individual Affiliate 승인 후 새 API 방법 조사
- [ ] **Shein 연동** — CJ Affiliate API
- [ ] **BestBuy 공식 API 전환** — developer.bestbuy.com 신청
- [ ] **BestBuy RapidAPI 환불** — support@rapidapi.com에 환불 이메일
- [ ] **어필리에이트 .env 설정** — Walmart/Target ID 받으면 .env에 추가 (코드 변경 불필요)
- [ ] 모바일 UI 추가 수정 (유저 피드백 반영)
- [ ] **공유/하트 아이콘 터치 영역 확대** — 현재 아이콘 16px + 패딩 4px = 약 24px. Apple HIG 기준 44px 권장. 시각적 크기 유지하면서 투명 터치 히트 영역만 확대 검토

### 어필리에이트/비즈니스 (완료)
- [x] 영문 주민등록 초본 발급
- [x] Anytime Mailbox USPS Form 1583 공증 (Proof 앱)
- [x] **US 주소 활성화** (2026-02-20)
- [x] Impact.com 계정 설정 (은행, 주소 변경 요청, Contacts)
- [x] Impact.com Bank → Wise EFT 등록

### 어필리에이트/비즈니스 (남은 작업)
- [x] Amazon Associates 주소 Delaware + Wise 은행 + 프로필 업데이트 완료
- [x] CJ Affiliate US 주소 + W-8BEN + 프로필 완료
- [x] Temu Individual Affiliate 승인 완료 (PayPal 출금, $20 최소)
- [ ] Impact.com 주소 변경 승인 대기 (티켓 #782618, 1-3영업일)
- [ ] Impact.com Timezone → Eastern Time 변경
- [x] Rakuten 계정 재활성화 완료 (compliance팀 승인 2026-02-22)
- [x] Rakuten W-8BEN 이슈 해결 → 한국 주소 유지 + W-8BEN + 카카오뱅크 등록
- [ ] Rakuten "Complete company details" 미완료 표시 → 내부팀 확인 중 (Madhu, 이메일 대기)
- [ ] Rakuten 광고주 Apply → Company details 완료 후 진행
- [ ] **Walmart 어필리에이트** — Impact에서 Apply
- [ ] **Target 어필리에이트** — Impact에서 Apply
- [ ] **BestBuy 어필리에이트** — Impact/CJ에서 Apply
- [ ] **Shein 어필리에이트** — CJ에서 Apply (Advertiser ID: 6293473)
- [ ] 승인 후 각 ID를 `.env.local` + Vercel env에 추가

---

## 11. 환경 변수 (.env.local) — ⚠️ 새 세션 필독

> **절대 .env.local을 임의로 수정하지 마세요!** 아래가 2026-02-22 기준 **실제 파일 내용 그대로**입니다.
> ⚠️ .env.local은 git에 커밋되지 않으므로, Vercel env와 수동 동기화 필요.

### 실제 .env.local 전체 내용 (2026-02-22 검증 완료)

```
# 1. RapidAPI Master Key (모든 Provider 공유)
RAPIDAPI_KEY=***REDACTED*** (see .env.local — 862297c953msh... 로 시작)

# 2. Provider별 RapidAPI Host — DOMESTIC
RAPIDAPI_HOST_AMAZON=real-time-amazon-data.p.rapidapi.com
RAPIDAPI_HOST_WALMART=realtime-walmart-data.p.rapidapi.com
RAPIDAPI_HOST_BESTBUY=bestbuy-usa.p.rapidapi.com          # ❌ API 죽음 (Coordinator에서 비활성화)
RAPIDAPI_HOST_EBAY=real-time-ebay-data.p.rapidapi.com
RAPIDAPI_HOST_TARGET=target13.p.rapidapi.com               # ⚠️ 2026-02-22 수정! 이전에 target-com-shopping-api였음

# 2b. Provider별 RapidAPI Host — GLOBAL
RAPIDAPI_HOST_ALIEXPRESS=aliexpress-data.p.rapidapi.com
# Shein/Costco 비활성화 (주석처리 상태)

# 3. Apify (Temu 전용 — 현재 Coordinator에서 비활성화)
APIFY_API_TOKEN=***REDACTED*** (see .env.local — apify_api_3gWV... 로 시작)

# 4. OpenAI
OPENAI_API_KEY=***REDACTED*** (see .env.local — sk-proj-iZcl... 로 시작)

# 5. Supabase (인증)
NEXT_PUBLIC_SUPABASE_URL=https://zyurflkhiregundhisky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9SvOrlirIrkqtO5-gMMgNg_nsU3x06C

# 6. 어필리에이트 코드 (활성)
AMAZON_AFFILIATE_TAG=soulmaten7-20
TEMU_AFFILIATE_CODE=alb130077
EBAY_CAMPAIGN_ID=5339138476
ALIEXPRESS_APP_KEY=525832
ALIEXPRESS_APP_SECRET=***REDACTED*** (see .env.local — GeX4dx... 로 시작)
CJ_PERSONAL_TOKEN=***REDACTED*** (see .env.local — AgcIDk... 로 시작)
CJ_PROPERTY_ID=101640448

# 7. Analytics
NEXT_PUBLIC_GA_ID=G-NQMDNW7CXP

# 미설정 (승인 후 추가 예정)
# WALMART_AFFILIATE_ID=       # Impact 승인 후
# TARGET_AFFILIATE_ID=        # Impact 승인 후
# BESTBUY_AFFILIATE_ID=       # Impact/CJ 승인 후
# SHEIN_AFFILIATE_ID=         # CJ 승인 후
```

### ⚠️ 발견된 문제 및 수정 이력
| 날짜 | 문제 | 수정 |
|------|------|------|
| 2026-02-22 | `RAPIDAPI_HOST_TARGET`이 `target-com-shopping-api.p.rapidapi.com`으로 잘못 설정되어 있었음 | `target13.p.rapidapi.com`으로 수정 완료. TargetProvider.ts 코드는 fallback으로 target13을 사용하지만 env가 우선 적용되므로 env도 반드시 맞춰야 함 |

---

## 12. API 변경 이력

| 날짜 | 변경 | 상세 |
|------|------|------|
| 2026-02 초 | **Temu: Apify 선택** | RapidAPI vs Apify 비교 후 Apify 선택. Actor: `amit123/temu-products-scraper`. |
| 2026-02 초 | **Target: 호스트 변경** | `target13.p.rapidapi.com` → `target-com-shopping-api.p.rapidapi.com` |
| 2026-02-18 | **Shein: API 전멸 확인** | RapidAPI의 모든 Shein API 전부 중단/삭제. CJ Affiliate API로 대체 예정. |
| 2026-02-18 | ⚠️ **TemuProvider 잘못된 교체** | 다른 세션이 TemuProvider를 Apify→RapidAPI로 변경. 되돌림 필요. |
| 2026-02-19 | **TemuProvider Apify 복원** | 커밋 `a1925fd` |
| 2026-02-19 | **Target: target13으로 복원** | MicroAPI 잘못 변경 → target13.p.rapidapi.com PRO $9/mo 복원 |
| 2026-02-19 | **BestBuy/Temu 비활성화** | Coordinator에서 주석처리 |
| 2026-02-19 | **Debug API 생성** | `/api/search/debug` Provider 개별 테스트 |
| 2026-02-20 | **US 주소 활성화** | Anytime Mailbox 승인 완료. DE 19703 주소 사용 가능 |
| 2026-02-20 | **Impact.com 설정** | 은행(Wise EFT), 주소 변경 요청(티켓 #782618), Contacts 설정 |
| 2026-02-20 | **모바일 UX 오버홀** | 스카이스캐너 스타일 — 바텀탭, 프로필 페이지, SearchWidget 대폭 리팩토링, 바로가기 카드, FAQ 스타일 변경 |
| 2026-02-21 | **전체 다크 테마 통일** | 모든 페이지 배경 네이비(#02122c)로 통일 — Home, Wishlist, Profile, Help, Partners, About, Legal |
| 2026-02-21 | **바텀 네비 글라스모피즘** | MobileBottomNav 인라인 스타일 재작성 — frosted glass pill bar, blur(40px), saturate(180%) |
| 2026-02-21 | **Profile Zipcode 연동** | Account 서브페이지에 PC버전 Zipcode 기능 완전 연동 (Primary/Add/Saved/Delete) |
| 2026-02-21 | **Legal 404 수정** | Next.js 16 params Promise 이슈 → `use(params)` 적용으로 해결 |
| 2026-02-21~22 | **검색 결과 모바일 리디자인** | MobileCompactCard 2열 그리드 + 이미지 고정비율 + 가격 3줄 구조 + Then By 정렬 |
| 2026-02-22 | **공유/하트 아이콘** | Skyscanner 스타일 3-node 공유 아이콘 + 하트 아이콘, 이미지 우측상단 (모바일+PC) |
| 2026-02-22 | **Partial Failure 핸들링** | Coordinator providerStatus + Promise.allSettled, 프론트엔드 amber 배너 |
| 2026-02-22 | **위시리스트 모바일 통일** | WishlistMobileCard 생성 + 멤버십 뱃지 + Clear 바텀시트 (confirm() 제거) |
| 2026-02-22 | **Rakuten 계정 재활성화** | compliance팀 승인 → 계정 복구. W-8BEN 이슈 해결: 한국 주소 유지 + W-8BEN + 카카오뱅크. Publisher Profile "Complete company details" 미완료 → 내부팀 확인 중 |
| 2026-02-22 | **모바일 카드 크기 업** | 텍스트/아이콘 모바일 표준 적용 — 셀러 7→9px, 상품명 10→12px, Total 15→18px, 아이콘 12→16px+36px터치, 검색+위시리스트 동일 |
| 2026-02-22 | **Partial Failure 배너 간소화** | 리테일러 이름+에러타입 제거 → "Some retailers didn't respond. Try again for full results." 간결 메시지 (모바일+PC) |
| 2026-02-22 | **POTAL Filter 리브랜딩** | "AI Smart Suggestion" → "POTAL Filter"로 사용자 노출 텍스트 전체 변경. 내부 코드명(AiSmartSuggestionBox)은 유지 |
| 2026-02-22 | **카메라→+ 버튼** | SearchWidget(홈) + StickyHeader(검색) 양쪽, 모바일/PC 4군데 모두 변경. 흰 배경+테두리(비활성), 오렌지(활성) |
| 2026-02-22 | **공유/하트 아이콘 경량화** | 원형 배경 제거 → drop-shadow만, 가로 배치 gap 2px. ResultsGrid + wishlist 동일 적용 |
| 2026-02-22 | **Partial Failure 배너 완전 제거** | 사용자 신뢰도 저하 방지. hasPartialFailure 로직은 유지하되 UI 렌더링만 제거 (모바일+PC) |
| 2026-02-22 | **모바일 의문문 플로우 개선** | 의문문 검색 시 POTAL Filter 시트 자동 오픈 (useEffect). PC와 동일하게 카테고리 후보 즉시 표시 |
| 2026-02-22 | **스플래시 스크린** | Amazon 스타일. sessionStorage 기반, 모바일 전용. POTAL 로고 1.5초 fade in/out |
| 2026-02-22 | **모바일 홈 슬로건 제거** | HeroVisuals 모바일 슬로건 제거 → 검색바 "POTAL Search" placeholder로 대체 |
| 2026-02-22 | **검색바 Amazon 스타일** | 돋보기(왼쪽)+카메라(오른쪽) 레이아웃. +버튼/자체 메뉴 제거. SearchWidget+StickyHeader 양쪽 적용 |
| 2026-02-22 | **카메라 OS 기본 picker** | cameraInputRef 제거. 단일 input으로 OS 카메라/사진첩 선택지 자동 표시 |

---

## 13. 새 세션 시작 시 사용할 프롬프트

```
POTAL 프로젝트 작업을 이어서 하려고 해.
프로젝트 경로: /Users/maegbug/portal

먼저 SESSION-CONTEXT.md 파일을 읽어줘. 거기에 프로젝트의 모든 현황과 다음 할 일이 정리되어 있어.

참고:
- components/search/ResultsGrid.tsx가 실제 사용 파일이고, app/components/search/ 쪽은 안 쓰는 백업 파일이야.
- 나는 코딩 초보자지만 AI agent를 만들고 있어.

오늘 할 작업: [여기에 오늘 할 작업 적기]
```

---

## 14. 콘텐츠 오버홀 + 리테일러 확장 + ZIP 검증 (2026-02-22 — 13차)

### 홈페이지 콘텐츠 오버홀
- **메인 슬로건**: "Compare Every Store on Earth." + "Domestic vs Global — One Search."
- **4개 Feature Cards** (모바일+PC 동일): Every Store One Search, Just Ask, Photo Search, True Final Price
- **모바일 프로모 카드**: 2개→4개 (2x2 그리드)
- **모바일 FAQ**: 3개→5개 (질문형 검색 + 사진 검색 추가)
- **데스크톱 FAQ**: 6개→8개 (동일 항목 추가)
- **About 바텀시트**: 새 4개 feature에 맞춤 업데이트 (🌍💬📷💰)
- **How It Works Step 2**: "POTAL AI" 브랜딩 강화

### 리테일러 상태 (MVP 활성 5개)
- **현재 활성**: Domestic 3개 (Amazon, Walmart, eBay, Target) + Global 1개 (AliExpress) = **총 5개**
- **BestBuy 코드 준비 완료 but 비활성**: `bestbuy-usa.p.rapidapi.com` — RapidAPI Playground에서도 500 에러 (2026-02-22). Provider 코드 완성, 서버 복구 시 Coordinator 주석 해제만 하면 됨.
- **Shein 코드 준비 완료 but 비활성**: `shein-business-api.p.rapidapi.com` — RapidAPI Playground에서도 500 "gateway error" (2026-02-22). 3번째 API 제공자. Provider 코드 완성, 서버 복구 시 Coordinator 주석 해제만 하면 됨.
- **Temu 비활성**: 403 차단 (2026-02-18~). Phase 2.
- **Costco 제외**: 오프라인 중심, MVP 범위 밖.

### ZIP 코드 검증 시스템
- **새 파일**: `app/lib/utils/zipCodeDatabase.ts` (596줄)
  - 3-digit prefix → State 매핑 (전체 ZIP 커버리지)
  - 상위 200개 ZIP → City 매핑 (인구 기준)
  - 52개 주/준주 세율 데이터
  - 함수: `lookupZip()`, `validateZip()`, `getStateFromZip()`, `getTaxRateFromZip()`
- **SearchWidget.tsx**: ZIP 입력 시 실시간으로 "Beverly Hills, CA" 표시 (모바일+PC)
- **StickyHeader.tsx**: ZIP 옆에 State 코드 표시 (모바일), City+State (PC)
- **Profile/page.tsx**: ZIP 추가 시 유효성 검증 + 실시간 City/State 피드백
  - 잘못된 ZIP → "Invalid ZIP code" 빨간 에러
  - 유효한 ZIP → "📍 Beverly Hills, California" 초록 확인
  - 저장된 ZIP 목록에 City, State 표시

### .env.local 변경
- `RAPIDAPI_HOST_SHEIN=shein-business-api.p.rapidapi.com` (주석 해제 + 호스트 변경)

### 변경된 파일 요약
- `app/lib/search/providers/SheinProvider.ts` — 호스트+엔드포인트 교체
- `app/lib/agent/Coordinator.ts` — BestBuy+Shein import 해제, provider 배열 추가
- `app/lib/utils/zipCodeDatabase.ts` — 🆕 ZIP 검증 DB
- `components/home/SearchWidget.tsx` — ZIP 실시간 검증 UI
- `components/search/StickyHeader.tsx` — ZIP 실시간 검증 UI
- `app/profile/page.tsx` — ZIP 추가 시 유효성 검증
- `components/home/HeroVisuals.tsx` — 슬로건+Feature Cards 변경
- `app/page.tsx` — 프로모카드, FAQ, About 시트, How It Works 전체 업데이트
- `.env.local` — Shein 호스트 변경

---

## 15. BestBuy/Shein API 서버 다운 → 비활성화 (2026-02-22, 14차)

### 문제 발견
- **BestBuy USA** (`bestbuy-usa.p.rapidapi.com`): RapidAPI Playground에서 Product Search 테스트 → 500 Server Error, `error: "something went wrong"`
- **Shein Business API** (`shein-business-api.p.rapidapi.com`): RapidAPI Playground에서 search_v0.1.php 테스트 → 500 "Oops, an error in the gateway has occurred"
- 두 API 모두 Playground에서조차 안 되므로 우리 코드 문제가 아닌 **API 제공자 서버 다운**

### 조치
- Coordinator.ts에서 BestBuy + Shein import/인스턴스/호출 모두 주석 처리
- 불필요한 API 호출 + 타임아웃 지연 방지
- Provider 코드(BestBuyProvider.ts, SheinProvider.ts)는 그대로 보존 — 서버 복구 시 주석만 해제하면 즉시 활성화 가능

### MVP 최종 Provider 구성
- **Domestic**: Amazon, Walmart, eBay, Target (4개)
- **Global**: AliExpress (1개)
- **총 5개 활성 Provider**

### 변경 파일
- `app/lib/agent/Coordinator.ts` — BestBuy/Shein 비활성화 (import + 인스턴스 + 호출 주석 처리)

---

## 16. MVP 런칭 준비 — GA4 + 디버그 정리 + 로딩 텍스트 (2026-02-22, 15차)

### GA4 이벤트 트래킹 구현
- **`app/utils/analytics.ts`** — 전면 재작성. 기존 `trackAffiliateClick`만 있던 것을 12개 이벤트 함수로 확장:
  - `trackSearch` — 검색 실행 시 (query, market, zipcode)
  - `trackSearchResults` — 결과 로드 시 (result_count, response_time_ms, provider_success/fail)
  - `trackAffiliateClick` — 상품 클릭 → 쇼핑몰 이동
  - `trackProductView` — 상품 카드 상세 보기
  - `trackSortChange` — Best/Cheapest/Fastest 정렬 변경
  - `trackFilterApply` / `trackFilterClear` — POTAL Filter 적용/해제
  - `trackWishlistAdd` / `trackWishlistRemove` — 위시리스트 추가/제거
  - `trackQuestionQuery` — 질문형 쿼리 감지
  - `trackSuggestedCategoryClick` — 추천 카테고리 클릭
  - `trackMarketSwitch` — All/Domestic/Global 전환
  - `trackShare` — 상품 공유 (native/clipboard)

### GA4 통합 위치
- `app/search/page.tsx` — trackSearch, trackSearchResults, trackQuestionQuery, trackSortChange, trackFilterApply/Clear
- `app/components/ProductCard.tsx` — trackAffiliateClick (handleViewDeal), trackShare (handleShare)
- `app/context/WishlistContext.tsx` — trackWishlistAdd, trackWishlistRemove

### Provider 디버그 로그 정리
- `BestBuyProvider.ts` — 진단용 console.log 전부 제거 (console.warn/error는 유지)
- `TargetProvider.ts` — host 출력 로그 제거
- `AliExpressProvider.ts` — products 카운트 로그 제거
- `AliExpressShippingService.ts` — 배송 디버그 로그 제거

### 로딩 화면 텍스트 업데이트
- `ResultsGrid.tsx` — "7 retailers" → "retailers", 리테일러 목록을 현재 활성 5개로 수정

### 변경 파일
- `app/utils/analytics.ts` — 12개 GA4 이벤트 함수
- `app/search/page.tsx` — GA4 통합
- `app/components/ProductCard.tsx` — GA4 통합
- `app/context/WishlistContext.tsx` — GA4 통합
- `app/lib/search/providers/BestBuyProvider.ts` — 디버그 로그 제거
- `app/lib/search/providers/TargetProvider.ts` — 디버그 로그 제거
- `app/lib/search/providers/AliExpressProvider.ts` — 디버그 로그 제거
- `app/lib/search/providers/AliExpressShippingService.ts` — 디버그 로그 제거
- `components/search/ResultsGrid.tsx` — 로딩 텍스트 수정

---

## 17. 환경변수 전수 감사 + AliExpress Affiliate ID + Supabase 마이그레이션 (2026-02-22, 16차)

### AliExpress Affiliate ID 추가
- AliExpress Portals(portals.aliexpress.com)에서 Tracking ID `potal` 확인
- `.env.local`에 `ALIEXPRESS_AFFILIATE_ID=potal` 추가 (2026-02-22)
- Vercel env에도 동일하게 추가 완료
- 이전: `ALIEXPRESS_APP_KEY=525832`가 fallback으로 사용됨 → 이후: `aff_id=potal`로 정확한 트래킹

### 환경변수 전수 감사 결과
- **.env.local ↔ 코드 참조** 전수 비교 완료
- **활성 Provider 변수**: 전부 정상 (RAPIDAPI_KEY, HOST_AMAZON/WALMART/EBAY/TARGET/ALIEXPRESS, OPENAI_API_KEY, Supabase, GA4)
- **비활성 Provider 변수**: HOST_BESTBUY, HOST_SHEIN, APIFY_API_TOKEN — 보관 (복구 대비)
- **미사용 변수 (보관)**: ALIEXPRESS_APP_SECRET, CJ_PERSONAL_TOKEN, CJ_PROPERTY_ID — Phase 2 연동 대비
- **누락 → 해결**: `ALIEXPRESS_AFFILIATE_ID=potal` 추가
- **Vercel 전용 확인**: `RAPIDAPI_HOST_TARGET=target13.p.rapidapi.com` ✅, `NEXT_PUBLIC_GA_ID` ✅, `RAPIDAPI_HOST_SHEIN` ✅
- **불필요**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — fallback용이라 없어도 됨

### Supabase 프로덕션 마이그레이션
- SQL Editor에서 `contact_messages` 테이블 생성 완료 (RLS + INSERT 정책 포함)
- `profiles` 테이블은 기존 작동 중 (트리거 + RLS 정상)

### .env.local 변경
- `ALIEXPRESS_AFFILIATE_ID=potal` 추가
- 마지막 업데이트 날짜: 2026-02-19 → 2026-02-22
- CJ 변수들에 "현재 미사용" 주석 추가

---

## 18. PWA 설정 — App Store / Play Store 대비 (2026-02-22, 17차)

### 생성된 파일
- **`public/manifest.json`** — PWA 매니페스트 (앱 이름, 아이콘, 테마, shortcuts, categories)
- **`public/sw.js`** — 서비스워커 (Network First 전략, 오프라인 캐시, API 호출 제외)
- **`public/icon-192x192.png`** — PWA 아이콘 (192x192)
- **`public/icon-512x512.png`** — PWA 아이콘 (512x512)
- **`public/apple-touch-icon.png`** — iOS 홈화면 아이콘 (180x180)
- **`public/favicon-32x32.png`** — 파비콘 32px
- **`public/favicon-16x16.png`** — 파비콘 16px
- **`public/favicon.ico`** — 멀티사이즈 파비콘

### 수정된 파일
- **`app/layout.tsx`** — manifest 연결, apple-web-app 메타, 파비콘 링크, theme-color, SW 등록 스크립트

### 앱 아이콘 디자인
- 네이비(#02122c) 배경 + 흰색 P + 오렌지(#F59E0B) O (화살표 포함)
- POTAL 브랜드 아이덴티티와 일치

### App Store / Play Store 등록 방법
- **Play Store (TWA)**: PWABuilder.com에서 TWA 패키지 생성 → Play Console 업로드. 비용: $25 (1회)
- **App Store**: PWABuilder로 iOS 패키지 생성 → Xcode 빌드 → App Store Connect 업로드. 비용: $99/년
- PWA 설정이 완료되어 있으므로 PWABuilder에서 바로 패키지 생성 가능

---

## 19. 주의사항

1. **git index.lock**: 가끔 `.git/index.lock` 파일이 남아있을 수 있음. `rm .git/index.lock`으로 해결.
2. **Vercel 배포**: `main` 브랜치에 푸시하면 자동 배포. 도메인: `potal.app`
3. **API 비용**: OpenAI 사용량 주의. gpt-4o는 gpt-4o-mini보다 ~20배 비싸므로 Smart Suggestion만 gpt-4o 사용.
4. **⚠️ Temu 비활성화 (Phase 2)**: 2026-02-18부터 Temu 서버 403 차단. Apify Actor 교체 또는 공식 API 출시 시 복구.
4b. **❌ Shein/BestBuy 비활성화**: 둘 다 RapidAPI Playground에서도 500 에러 (2026-02-22). 코드는 준비 완료. 서버 복구 시 Coordinator.ts에서 주석 해제 + Vercel env에 `RAPIDAPI_HOST_SHEIN=shein-business-api.p.rapidapi.com` 추가.
5. **⚠️ Target 호스트는 target13**: `target13.p.rapidapi.com` PRO $9/mo 구독 중. `.env.local`과 `Vercel env` 양쪽 다 `target13.p.rapidapi.com`인지 확인 필수! (2026-02-22에 .env.local이 잘못된 값이었던 것을 수정함)
6. **⚠️ .env.local 수정 금지**: 새 세션에서 임의로 수정하지 마세요. 현재 상태가 정확합니다.
6b. **⚠️ Vercel env 동기화 필수**: .env.local을 수정했으면 Vercel Dashboard > Settings > Environment Variables에서도 동일하게 변경해야 프로덕션에 반영됨. 특히 `RAPIDAPI_HOST_TARGET=target13.p.rapidapi.com` 확인!
7. **⚠️ US 주소 활성화 완료**: 2803 Philadelphia Pike, Suite B #1126, Claymont, DE 19703. 어필리에이트 가입에 사용.
8. **⚠️ Impact.com 주소 심사 중**: 티켓 #782618. 승인 전까지 Walmart/Target Apply 보류.
9. **모바일/데스크톱 분리**: 모든 모바일 변경은 `md:hidden` / `hidden md:block` 패턴 사용. 데스크톱은 완전히 영향 없음.
10. **⚠️ 인라인 스타일 우선**: Tailwind CSS 클래스가 캐싱으로 안 먹힐 수 있음 → 시각적 핵심 요소는 반드시 `style={{}}` 사용
11. **⚠️ Next.js 16 동적 라우트**: `params`가 Promise. `use(params)` 또는 `await params` 필요. 기존 `params.slug` 직접 접근은 undefined 발생
12. **⚠️ 전체 배경 네이비 통일**: 모든 페이지가 `#02122c` 배경. 새 페이지 만들 때도 네이비 배경 + 다크 테마 유지 필요
13. **⚠️ 유저 디자인 피드백**: 변경 후 유저가 "수정전이 더 괜찮네" 하면 즉시 리버트. 이모지 배경 박스 싫어함, 오렌지는 진하게.
14. **⚠️ No browser confirm()/alert()**: 모바일에서 브라우저 기본 다이얼로그 사용 금지. 바텀시트 또는 커스텀 모달 사용.
15. **⚠️ 상품 카드 이미지**: `paddingBottom: '125%'` + `height: 0` 인라인 스타일 방식. `aspectRatio` CSS 사용 금지.
16. **⚠️ z-index 계층**: BottomNav z-[9999], 풀스크린 시트 z-[10001], 바텀시트 확인 z-[10002], StickyHeader z-[2000].
