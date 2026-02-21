# POTAL — AI Shopping Comparison Agent: Session Context

> 이 파일은 새 AI 세션이 프로젝트의 현재 상태를 완벽히 이해할 수 있도록 작성된 컨텍스트 문서입니다.
> 새 세션 시작 시: "POTAL 프로젝트 작업을 이어서 하려고 해. /Users/maegbug/portal 에 있는 SESSION-CONTEXT.md 파일을 먼저 읽고 시작해줘." 라고 말하면 됩니다.
> **마지막 업데이트: 2026-02-22 (9차 — 검색결과 모바일 리디자인 완료 + 위시리스트 모바일 카드 + 에러 핸들링 + 공유/하트 아이콘)**

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
- **상품 API**: RapidAPI (Amazon/Walmart/eBay/Target/AliExpress) — BestBuy/Temu 비활성화됨
- **⚠️ Temu Apify 차단됨**: Actor `amit123/temu-products-scraper` — 2026-02-18부터 Temu 서버 403 차단. 모든 빌드(v1.0.32~v1.0.37) 실패. Temu Individual Affiliate 신청 중 (승인 대기 2-5일).
- **⚠️ BestBuy 비활성화**: Pinto Studio API 응답 없음. RapidAPI 환불 예정.

---

## 2. 프로젝트 구조 (핵심 파일)

```
portal/
├── app/
│   ├── page.tsx                          # 🔥 메인 홈 + 검색 결과 (대규모 리팩토링됨)
│   ├── profile/
│   │   └── page.tsx                      # 🆕 프로필 페이지 (모바일 Footer 대체)
│   ├── search/
│   │   └── page.tsx                      # 메인 검색 결과 페이지 (프론트엔드 인터리빙 포함)
│   ├── api/
│   │   ├── search/route.ts               # 검색 API 엔드포인트 → Coordinator 호출
│   │   ├── search/debug/route.ts         # 🆕 Provider 개별 테스트 진단 API
│   │   └── ai-suggestions/route.ts       # AI Smart Suggestion API (v4.0)
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── Coordinator.ts            # 🎯 핵심: 전체 파이프라인 오케스트레이션
│   │   │   ├── QueryAgent.ts             # 검색어 분석 + 플랫폼별 쿼리 생성
│   │   │   └── AnalysisAgent.ts          # 상품 관련성/사기 분석 (현재 비활성화)
│   │   ├── search/
│   │   │   ├── providers/
│   │   │   │   ├── AmazonProvider.ts     # ✅ 작동 — tag=soulmaten7-20
│   │   │   │   ├── WalmartProvider.ts    # ✅ 작동 — affiliateId= (미설정)
│   │   │   │   ├── BestBuyProvider.ts    # ❌ 비활성화 (Pinto Studio API 죽음)
│   │   │   │   ├── EbayProvider.ts       # ✅ 작동 — campid=5339138476
│   │   │   │   ├── TargetProvider.ts     # ✅ 작동 — afid= (미설정)
│   │   │   │   ├── AliExpressProvider.ts # ✅ 작동 — aff_id=
│   │   │   │   ├── TemuProvider.ts       # ❌ 비활성화 (Temu 403 차단)
│   │   │   │   ├── SheinProvider.ts      # ❌ 비활성화 (API 서버 다운)
│   │   │   │   └── CostcoProvider.ts     # ❌ 비활성화 (Deals API만)
│   │   │   ├── FraudFilter.ts            # 규칙 기반 사기 상품 필터
│   │   │   ├── CostEngine.ts             # Total Landed Cost 계산
│   │   │   └── ScoringEngine.ts          # Best/Cheapest/Fastest 점수
│   │   ├── retailerConfig.ts             # 🎯 어필리에이트 중앙 설정 (각 리테일러별 paramKey, envKey)
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
│   │   ├── HeroVisuals.tsx               # 🔥 데스크톱 슬로건+Feature Cards (모바일 슬로건 제거됨)
│   │   └── SearchWidget.tsx              # 🔥 대폭 리팩토링 — 모바일/데스크톱 분리 레이아웃
│   ├── layout/
│   │   ├── Header.tsx                    # 🔥 모바일 nav 아이콘 hidden (바텀탭으로 이동)
│   │   ├── MobileBottomNav.tsx           # 🆕 모바일 바텀 네비게이션 (Search/Wishlist/Profile)
│   │   └── Footer.tsx                    # 데스크톱만 표시 (hidden md:block)
│   ├── search/
│   │   ├── StickyHeader.tsx              # 검색 결과 스티키 헤더
│   │   └── ResultsGrid.tsx              # ✅ 실제 사용하는 결과 그리드 컴포넌트
│   └── ui/                              # 공통 UI 컴포넌트
├── .env.local                            # 실제 API 키 (절대 커밋하지 마세요)
├── .env.example                          # API 키 템플릿
└── SESSION-CONTEXT.md                    # 이 파일
```

> **중요**: `app/components/search/` 폴더의 파일들은 안 쓰는 백업 파일. `components/search/ResultsGrid.tsx`가 실제 사용 파일.

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

### 어필리에이트 플랫폼 현황 (2026-02-20 기준)

| 플랫폼 | 상태 | 은행 | 다음 단계 |
|--------|------|------|----------|
| **Amazon Associates** | ✅ 활성 | Wise EFT 등록 완료 | 주소 Delaware 업데이트 완료 (19703-2506), 프로필 POTAL 업데이트 완료 |
| **Impact.com** | ⚠️ 주소 변경 심사 중 | Wise EFT (무료) 등록 완료 | Corporate/Billing Address → DE 주소로 변경 요청 접수 (티켓 #782618). 1-3영업일 승인 대기 |
| **CJ Affiliate** | ✅ 가입완료 | Wise 등록 완료 ($50 최소) | US 주소 등록 완료 (Suite B No 1126), W-8BEN 제출, 프로필 작성 완료. Shein Apply 대기 (메인터넌스 확인) |
| **Rakuten** | ⚠️ W-8BEN 이슈 | PayPal Business | US 주소로 변경 시 W-9 강제 → W-8BEN 필요 (한국 세금거주자). Dolly(서포트) 이메일 답변 대기 중 |
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

### localStorage 키 (Zipcode 관련)
| 키 | 용도 | 스코프 |
|---|---|---|
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

### 미커밋 변경사항 (2026-02-20~22)

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

### 코드/기능 (남은 작업)
- [ ] **Temu 재연동** — Individual Affiliate 승인 후 새 API 방법 조사
- [ ] **Shein 연동** — CJ Affiliate API
- [ ] **BestBuy 공식 API 전환** — developer.bestbuy.com 신청
- [ ] **BestBuy RapidAPI 환불** — support@rapidapi.com에 환불 이메일
- [ ] **어필리에이트 .env 설정** — Walmart/Target ID 받으면 .env에 추가 (코드 변경 불필요)
- [ ] 모바일 UI 추가 수정 (유저 피드백 반영)

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
- [ ] Rakuten W-8BEN + US 주소 이슈 해결 (Dolly 이메일 대기)
- [ ] **Walmart 어필리에이트** — Impact에서 Apply
- [ ] **Target 어필리에이트** — Impact에서 Apply
- [ ] **BestBuy 어필리에이트** — Impact/CJ에서 Apply
- [ ] **Shein 어필리에이트** — CJ에서 Apply (Advertiser ID: 6293473)
- [ ] 승인 후 각 ID를 `.env.local` + Vercel env에 추가

---

## 11. 환경 변수 (.env.local) — ⚠️ 새 세션 필독

> **절대 .env.local을 임의로 수정하지 마세요!** 아래 정보가 정확한 최신 상태입니다.

**.env.local 현재 사용 중인 키 목록** (2026-02-20 기준):

```
# RapidAPI (모든 Provider 공통 키)
RAPIDAPI_KEY=862297c953msh...  (하나의 키로 모든 리테일러 접근)

# Provider별 호스트 (DOMESTIC)
RAPIDAPI_HOST_AMAZON=real-time-amazon-data.p.rapidapi.com
RAPIDAPI_HOST_WALMART=realtime-walmart-data.p.rapidapi.com
RAPIDAPI_HOST_BESTBUY=bestbuy-usa.p.rapidapi.com
RAPIDAPI_HOST_EBAY=real-time-ebay-data.p.rapidapi.com
RAPIDAPI_HOST_TARGET=target13.p.rapidapi.com

# Provider별 호스트 (GLOBAL)
RAPIDAPI_HOST_ALIEXPRESS=aliexpress-data.p.rapidapi.com
# ⚠️ Temu는 RapidAPI 아님! 아래 Apify 섹션 참고

# Apify (Temu 전용 — 결제 중!)
APIFY_API_TOKEN=apify_api_3gWV...

# OpenAI, Supabase, Analytics
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://zyurflkhiregundhisky.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_GA_ID=G-NQMDNW7CXP

# 어필리에이트 (활성)
AMAZON_AFFILIATE_TAG=soulmaten7-20
TEMU_AFFILIATE_CODE=alb130077
EBAY_CAMPAIGN_ID=5339138476
ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET
CJ_PERSONAL_TOKEN / CJ_PROPERTY_ID

# 어필리에이트 (미설정 — 승인 후 추가)
# WALMART_AFFILIATE_ID=       # Impact 승인 후
# TARGET_AFFILIATE_ID=        # Impact 승인 후
# BESTBUY_AFFILIATE_ID=       # Impact/CJ 승인 후
# SHEIN_AFFILIATE_ID=         # CJ 승인 후
```

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

## 14. 주의사항

1. **git index.lock**: 가끔 `.git/index.lock` 파일이 남아있을 수 있음. `rm .git/index.lock`으로 해결.
2. **Vercel 배포**: `main` 브랜치에 푸시하면 자동 배포. 도메인: `potal.app`
3. **API 비용**: OpenAI 사용량 주의. gpt-4o는 gpt-4o-mini보다 ~20배 비싸므로 Smart Suggestion만 gpt-4o 사용.
4. **⚠️ Temu 현재 비활성화**: 2026-02-18부터 Temu 서버 403 차단. Coordinator에서 import 주석처리됨.
5. **⚠️ Target 호스트는 target13**: `target13.p.rapidapi.com` PRO $9/mo 구독 중. MicroAPI가 아닙니다!
6. **⚠️ .env.local 수정 금지**: 새 세션에서 임의로 수정하지 마세요. 현재 상태가 정확합니다.
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
