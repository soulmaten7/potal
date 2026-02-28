# POTAL Session Context
> 마지막 업데이트: 2026-02-28 (김범수 QPV 리서치 + 피치덱 v4 + LinkedIn 메시지 확정 + iOS 승인 완료)

## 현재 상태 요약

POTAL은 여러 쇼핑몰에서 상품을 검색/비교하는 가격비교 서비스.
**현재 6개 쇼핑몰 연동** — Amazon, Walmart, Target, eBay, Costco, AliExpress (RapidAPI 기반 5개 + Costco).
**Founder**: 장은태 (EunTae Jang) — Founder & CEO. 코딩 경험 없이 Claude AI + 바이브코딩으로 1달 만에 구축 (매일 9시간).

**iOS 앱**: App Store 승인 완료 ✅ (Build 2, 태블릿 1440px 레이아웃 수정 포함).
**Android 앱**: Google Play Console 국가 변경 대기 중 (미국→한국). 영어로 재문의 완료. Capacitor Android 빌드는 아직 미시작.
**웹사이트**: https://potal.app (Vercel 배포)

---

## POTAL 핵심 기능 정의 (WHY · HOW · WHAT)

### WHY (왜 만들었나) — 피치덱 v4 기준 재정의

**핵심 태그라인**: "Compare Every Store on Earth." + "Domestic vs Global — One Search."

크로스보더 커머스로 국가 간 경계가 무너지면서 가격 체계가 붕괴되었다. 기존 쇼핑은 내수시장의 특정 사이트에서 sort by price로 나열하는 수준이었지만, 소비자가 진짜 필요한 건 '가장 싸거나, 가장 빠르거나, 가장 합리적인 선택'인데 — Domestic vs Global을 한번에 비교해주는 곳이 어디에도 없다.

똑같은 상품이라도 무조건 Global이 싼 것도 아니고, 비싸지만 일주일 빨리 오는 Domestic을 살 필요가 없는 사람도 있다. 이 비교를 직접 하기엔 복잡하고, 귀찮다. 결국 비교를 안 하는 게 아니라 **못 하는 것**이고, 그래서 어느 쪽이든 손해를 보고 있다.

**3가지 핵심 문제:**
1. 비교할 방법이 없다 — Domestic vs Global 실제 총비용을 나란히 비교해주는 서비스가 존재하지 않음
2. 실제 총비용을 모른다 — 배송비+관세+세금 포함 총비용을 자동 계산해서 보여주는 곳이 없어 합리적 판단 불가능
3. 대다수 소비자는 포기 — 검색에 익숙한 젊은 층 제외하면 직접 비교가 어렵고 복잡해서 아예 시도하지 않음

**이것은 블루오션이다**: 크로스보더 커머스가 가격 체계를 파괴했지만, 그 파괴된 시장에서 소비자를 도와주는 서비스는 아직 없다.

### HOW (어떻게 해결하나)

**1. 스마트 가격비교 (핵심 차별점)**
- Domestic vs Global 분류 — 국내 상품과 해외배송 상품을 나눠서 나란히 비교
- Total Landed Cost 계산 — 상품가 + 배송비 + 세금/관세/MPF 전부 포함한 실제 총비용
- 배송 예상 기간 비교 — 국내 vs 해외 배송 소요일을 나란히 확인
- Duty-Free 국가 자동 판별 — FTA 체결국 상품은 관세 면제 자동 반영
- Tax/Duty 계산 근거 투명 공개 — 세금/관세 산출 방식을 직접 확인 가능

**2. 통합 검색**
- 6개 쇼핑몰 동시 검색 — Amazon, Walmart, Target, eBay, Costco, AliExpress
- 멤버십 할인 반영 — Amazon Prime, Walmart+, Costco 회원 가격 자동 적용
- 각 쇼핑몰별 리뷰/평점 표시 — eBay는 판매자 신뢰도(피드백 %) 표시
- 상품 클릭 → 해당 쇼핑몰로 바로 이동 — 중간 단계 없이 구매 페이지 직행

**3. POTAL AI — 버티컬 AI 쇼핑 엔진** (피치덱 v4 기준)
- AI 필터링 — 검색어와 무관한 상품 자동 판별/제거 (OpenAI 기반)
- AI Smart Suggestion — 검색 결과 분석 → 브랜드, 용량, 색상 등 필터 축 자동 생성
- searchIntelligence — refineQuery, detectPriceIntent, generateQueryVariants
- 이미지 검색 + 자연어 쿼리 처리 지원
- 데이터 축적 → 개인화 진화 (자동으로, 유저 데이터가 쌓이면서)
- **핵심 원칙**: 가격 추적 알림, 히스토리 차트 등은 소비자 기능 ❌ → B2B 기능으로 분류

**4. 사용 편의성**
- PC + 모바일 반응형 + iOS 앱 — 어디서든 동일한 경험
- 음성 검색 — 타이핑 없이 말로 검색
- 위시리스트 — 상품 저장해두고 나중에 비교
- 회원가입 없이 완전 무료 — 가입 장벽 없음

### WHAT (최종 목표)

현재 MVP는 미국 기준 6개 쇼핑몰로 시작했지만, 다음 단계로 미국에서 구매 가능한 모든 쇼핑몰을 Domestic과 Global에 추가하고, 이후 전 세계 모든 국가에서 동일하게 이용 가능하도록 확장한다. 최종적으로 **어느 나라 어떤 사용자든, 전 세계 모든 쇼핑몰의 상품을 한 손에서 실제 총비용과 배송기간으로 쉽게 비교할 수 있는 글로벌 쇼핑 비교 플랫폼**을 만드는 것이 POTAL의 목표다.

---

## 2026-02-26 작업 요약

### 1. 코드베이스 종합 점검 및 리팩토링 ✅

#### 1-1. 고아 파일 삭제 (7개)
- `app/components/FilterBar.tsx` — 미사용
- `app/components/CategoryScreen.tsx` — 미사용
- `app/components/ShippingGuideModal.tsx` — 미사용
- `app/components/BottomNav.tsx` — 미사용 (components/layout/MobileBottomNav.tsx가 실제 사용)
- `app/components/SearchOverlay.tsx` — 미사용
- `app/components/EmptyState.tsx` — 미사용
- `components/auth/LoginModal.tsx` — 미사용 (app/components/LoginModal.tsx가 실제 사용)

#### 1-2. 죽은 코드 제거
- `app/page.tsx`: `activeMain`, `activeSub` state 변수 삭제
- `app/page.tsx`: `MainCategoryId` 타입 import 삭제

#### 1-3. console.log/warn 정리 (13개)
- SerperShoppingProvider.ts: console.log 6개 삭제
- EbayProvider.ts: console.log 1개 삭제
- AliExpressShippingService.ts, AliExpressProvider.ts, AIFilterService.ts, search/page.tsx: 비핵심 console.warn 6개 삭제
- 중요한 에러 추적용 console.warn은 유지 (API key 미설정, timeout, HTTP 에러 등)

#### 1-4. 컴포넌트 디렉토리 통합 (app/components/ → components/)
**이동된 파일:**
- `app/components/ProductCard.tsx` → `components/search/ProductCard.tsx`
- `app/components/DeliveryBadge.tsx` → `components/search/DeliveryBadge.tsx`
- `app/components/LoginModal.tsx` → `components/auth/LoginModal.tsx`
- `app/components/AuthForm.tsx` → `components/auth/AuthForm.tsx`
- `app/components/GoogleAnalytics.tsx` → `components/common/GoogleAnalytics.tsx`
- `app/components/search/AiSmartSuggestionBox.tsx` → `components/search/AiSmartSuggestionBox.tsx`

**업데이트된 import (7개 파일):**
- `components/search/ResultsGrid.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `app/profile/page.tsx`
- `app/search/page.tsx`
- `app/layout.tsx`
- `app/auth/signin/page.tsx`
- `app/page.tsx`
- `app/wishlist/page.tsx`

**`app/components/` 폴더 완전 삭제됨.**

#### 1-5. 대형 파일 분리
- **ResultsGrid.tsx**: 1220줄 → 955줄 — `MobileCompactCard` 추출 → `components/search/MobileCompactCard.tsx` (277줄)
- **ProductCard.tsx**: 622줄 → 546줄 — `TaxInfoPopup` 추출 → `components/search/TaxInfoPopup.tsx` (208줄)

#### 1-6. 이전 세션 UI 수정사항 (커밋에 포함)
- Duty+MPF 합쳐서 1줄로 (PC + 모바일 모든 카드 타입)
- PC (i) 아이콘 → 팝업으로 변경 (mobile은 /tax-info 페이지 이동 유지)
- 팝업 outside-click 닫기 (useRef + useEffect)
- eBay 판매자 피드백 % 표시 (0/0 리뷰 대신)
- eBay 캡차 감지 + 1초 재시도 로직
- eBay 배송기간 "5-10 Days" → "3-5 Days" (DeliveryStandard.ts 하드코딩 수정)
- Total Landed Cost 순서 변경 (라벨 위, 가격 아래)
- FAQ 2열 레이아웃 (max-w-[1440px])
- /tax-info 페이지 생성

### 2. OG 이미지 업데이트 ✅
- `public/og-image.png` 새로 생성 (1200x630, Domestic vs Global 비교 디자인)
- 기존 `og-image.svg`는 텍스트만 있던 구버전
- `app/layout.tsx` openGraph + twitter 메타 description 업데이트
- 새 description: "Compare real total cost across Amazon, Walmart, Target, eBay, Costco & AliExpress. Domestic vs Global side by side."

### 3. 홍보 채널 실행 ✅

#### Reddit r/SideProject
- 글 올림 → **스팸 필터에 걸림** (karma 1이라서)
- 모더레이터에게 승인 요청 메시지 보냄 → 대기 중
- 이미지: imgur에 POTAL 스크린샷 업로드 (https://imgur.com/a/gcfkwAJ)

#### LinkedIn
- 프로필 설정 완료 (Founder, POTAL, 한줄소개, potal.app 링크)
- 글 올림 (POTAL 소개 + 핵심 기능 + 피드백 요청)
- 해시태그: #buildinpublic #startup #ecommerce #sideproject #pricecomparison #indiehacker

#### X (Twitter)
- 일론 머스크 태그하여 글 올림
- 핵심 메시지: "테슬라 유저가 차 안에서 음성 한마디로 모든 쇼핑사이트 비교 구매"
- MVP 링크 + 1년 안에 전 세계 쇼핑몰 넣겠다는 비전

#### 김범수 대표님 (퀀텀프라임/데모데이) LinkedIn
- 200자 메시지로 1촌 신청 → ✅ **수락 완료**
- 내용: 데모데이 구독자이자 멤버십 회원, 바이브코딩으로 MVP 완성, 피드백 요청
- **김범수 대표 응답**: "사업 내용 볼수있는 웹사이트나 자료 있으면 보내주세요"
- **대응**: 피치덱 v4 + LinkedIn 메시지 작성 완료, 발송 대기 중

### 4. 외부 서비스 대응 ✅

#### Rakuten
- 담당자 Madhu에게 영어로 답장 완료
- 내용: 로그아웃+캐시삭제+시크릿모드+다른브라우저 전부 시도했으나 여전히 incomplete 상태
- 스크린샷 첨부

#### Google Play Console
- 국가 변경 요청 영어로 재작성하여 기존 티켓 #782618에 답장
- 내용: US→South Korea 변경 요청, 한국 서류만 있어서 인증 불가

#### Impact (어필리에이트 네트워크)
- 계정 활성화 확인 (POTAL OFFICIAL, ID: 6999751)
- Media Property (potal.app) Verified 상태
- **문제**: Brands Marketplace 메뉴가 안 보임 → 어드버타이저 파트너십 신청 불가
- Application Approval 티켓 제출 완료

### 5. Amazon API 디버깅 + 검색 인텔리전스 강화 ✅

#### 5-1. Amazon API 문제 발견 및 원인 분석
- **증상**: potal.app에서 특정 키워드(airpods, iphone 등) 검색 시 Amazon 결과 0건
- **원인 분석**:
  - POTAL 코드 문제 ❌ — 코드 정상
  - API 키/할당량 문제 ❌ — 8,361/10,000 남음
  - **RapidAPI (OpenWeb Ninja, real-time-amazon-data) API 자체의 간헐적 불안정** ✅
  - 같은 검색어 "airpods"가 5번 중 2번만 결과 반환 (API 서버 로드밸런서 문제)
  - 일부 키워드("earbud", "iphone")는 지속적으로 0건 반환
- **API 구독**: OpenWeb Ninja PRO 플랜 ($25/mo, 10,000 requests/mo)

#### 5-2. 검색어 단수↔복수 변형 로직 추가 (searchIntelligence.ts)
- **문제**: "airpod" → 0건, "airpods" → 15,798건 등 단수/복수에 따라 결과 차이
- **해결**: `generateQueryVariants()` 함수를 `searchIntelligence.ts`에 추가
  - Amazon만이 아니라 **모든 provider에 공통 적용**되는 검색 인텔리전스 기능으로 구현
  - 단수→복수: airpod→airpods, iphone→iphones, battery→batteries, box→boxes
  - 복수→단수: airpods→airpod, batteries→battery, watches→watch
- **적용 위치**: `SearchService.ts` Step 1b
  - 전체 provider 호출 후 결과 0건이면 → 변형 검색어로 전체 provider 재시도
  - AmazonProvider에 넣지 않고 SearchService 레벨에서 처리 (모든 provider 혜택)
- **변경 파일**:
  - `app/lib/search/searchIntelligence.ts` — `generateQueryVariants()` 함수 추가 (export)
  - `app/lib/search/SearchService.ts` — import + Step 1b 재시도 로직 추가
  - `app/lib/search/providers/AmazonProvider.ts` — 중복 로직 제거, 원래 심플한 구조로 복원

#### 5-3. 로그에서 발견된 다른 Provider 문제
- **Target**: API 엔드포인트 404 에러 (`/search`, `/product_search` 모두 없음) — 수정 필요
- **eBay**: captcha/challenge 감지 (기존 재시도 로직 있음)
- **product-judge**: 3초 타임아웃 (AI 필터 fallback 작동 중)

### 6. 타겟 시장 분석 ✅

#### 크로스보더 이커머스 시장 데이터 (2025, 피치덱 v4 기준 — 출처 검증 완료)
- 글로벌 크로스보더 이커머스: **$1.47 trillion** (2025) — Coherent Market Insights (2032년 $4.81T 전망, CAGR 18.4%)
- 미국 온라인 쇼퍼: **289M** (288.45M 반올림) — eMarketer 2025
- **59%** 전 세계 온라인 쇼퍼가 해외 사이트 구매 경험 — DHL 2025 Online Shopper Survey (24개국, 24,000명)
- **48%** 예상치 못한 비용으로 해외 구매 포기 — Baymard Institute 2024.2 (미국 성인 1,012명)
- **54%** 높은 배송비가 최대 불만
- ~~Gen Z 해외 구매 지출 YoY 21% 성장~~ → 피치덱 v4에서 Gen Z 한정 타겟 삭제

#### 1차 타겟층 (피치덱 v4 기준 재정의)
- **1차 타겟**: 가격 민감 미국 온라인 쇼퍼 (연령 무관)
- **잠재 시장**: 전체 온라인 쇼핑 인구 (Domestic vs Global 비교는 보편적 니즈, 40대 이상이 오히려 더 큰 pain point)
- **59% 전략적 가치**: 이미 해외 구매를 하는 인구 = 즉시 타겟 가능한 고객 (교육 비용 없이 바로 acquisition 가능)
- **채널 우선순위**: Facebook 쇼핑 그룹 (즉시 가능) > Reddit r/Frugal (3.5M, karma 필요) > SEO 블로그
- **접근 방식**: "가격 비교 결과"를 먼저 보여주고 자연스럽게 POTAL로 유입

### 7. Slickdeals 분석 ✅

#### Slickdeals 비즈니스 모델
- **딜 소싱**: 크라우드소싱 — 12M 유저가 직접 딜을 찾아서 올림 (API가 아님)
- **딜 등급**: 유저 투표 → Popular → Front Page → Fire
- **수익 모델**:
  - 유저가 올린 상품 링크를 어필리에이트 링크로 교체 (tag=slickdeals-XX)
  - 구매 시 1~8.5% 커미션 수취
  - 어필리에이트 네트워크: **CJ, Impact, Rakuten, Awin** (POTAL과 동일한 네트워크!)
  - 추가 수익: 스폰서 딜 (브랜드가 돈 내고 노출)
- **글 올리기**: Deal 게시(상품만 가능), 포럼 게시(활동 이력 필요), 유료 광고(비용 큼)

#### POTAL vs Slickdeals 관계
- Slickdeals = "커뮤니티 딜 큐레이션" (유저가 딜을 올림)
- POTAL = "실시간 자동 가격비교 + 총비용 계산" (자동 비교)
- 경쟁이 아닌 보완 관계이지만, 실질적으로 Slickdeals 유저를 POTAL로 끌어와야 함
- **타겟층 겹침**: 둘 다 가격 민감한 미국 온라인 쇼퍼가 타겟
- 두 종류 유저 모두 잡을 수 있음:
  - 딜 찾는 데 익숙한 유저 (Slickdeals형): "이 딜이 진짜 최저가인지 확인해봐"
  - 비교를 못 하는 일반 유저: "탭 6개 열 필요 없이 한번에 비교해"

### 8. 실유저 확보 전략 수립 ✅

#### 핵심 원칙
- **광고 집행은 아직 이르다** — 무료 채널에서 반응 검증 후 집행
- **가치를 먼저 보여주는 방식** — "POTAL 써보세요!" ❌ → "airpods 비교해봤더니 Amazon $189, AliExpress $67이더라" ✅
- **메시지는 채널별로 다르게** — 같은 POTAL이지만 타겟에 맞는 어필

#### 실행 순서 (무료 채널 우선)
1. **Reddit** — karma 쌓인 후 r/Frugal (3.5M), r/deals, r/OnlineShopping (가격 비교 결과 공유)
2. **Facebook 그룹** — "Amazon Deals & Steals", "Online Shopping Deals USA" 등 (가입 후 바로 글 가능)
3. **SEO 블로그** — "Amazon vs AliExpress price comparison" 등 검색 유입 콘텐츠
4. **반응 검증 후** — 어떤 메시지/채널이 먹히는지 데이터 확인
5. **검증된 채널에만 광고 집행** — 뭐가 먹히는지 모르고 태우면 낭비

---

## 최종 components/ 디렉토리 구조 (2026-02-26 리팩토링 후)

```
components/
├── auth/
│   ├── AuthForm.tsx (118줄)
│   ├── LoginModal.tsx (170줄)
│   └── OnboardingModal.tsx (41줄)
├── common/
│   ├── GoogleAnalytics.tsx (26줄)
│   └── LanguageModal.tsx (35줄)
├── help/
│   └── ContactForm.tsx (73줄)
├── home/
│   ├── HeroVisuals.tsx (60줄)
│   ├── SearchBar.tsx (71줄)
│   └── SearchWidget.tsx (495줄)
├── icons.tsx (202줄)
├── layout/
│   ├── Footer.tsx (257줄)
│   ├── Header.tsx (189줄)
│   └── MobileBottomNav.tsx (81줄)
├── search/
│   ├── AiSmartSuggestionBox.tsx (673줄)
│   ├── DeliveryBadge.tsx (76줄)
│   ├── FilterSidebar.tsx (229줄)
│   ├── MobileCompactCard.tsx (277줄) ← NEW
│   ├── ProductCard.tsx (546줄)
│   ├── ResultsGrid.tsx (955줄)
│   ├── StickyHeader.tsx (445줄)
│   └── TaxInfoPopup.tsx (208줄) ← NEW
└── ui/
    └── SkeletonCard.tsx (24줄)
```

---

## 검색 파이프라인 구조 (2026-02-26 업데이트)

```
유저 검색 "airpod"
  → SearchService.search("airpod")
    → Step 1: 모든 provider 동시 호출 (Domestic: Amazon, Walmart, Best Buy* / Global: eBay, AliExpress) *Best Buy는 API 키 대기
    → Step 1b: 전체 결과 0건?
      → generateQueryVariants("airpod") → ["airpod", "airpods"]
      → "airpods"로 모든 provider 다시 동시 호출
    → Step 2: FraudFilter (rule-based, $0/no-image/sponsored 제거)
    → Step 3: AI Filter (OpenAI, 무관한 상품 제거)
    → Step 4: CostEngine (Total Landed Cost 계산)
    → Step 5: ScoringEngine (Best/Fastest/Cheapest 점수)
    → 결과 반환
```

**핵심 파일:**
- `app/lib/search/searchIntelligence.ts` — refineQuery(), detectPriceIntent(), generateQueryVariants()
- `app/lib/search/SearchService.ts` — 전체 파이프라인 오케스트레이션
- `app/lib/search/providers/AmazonProvider.ts` — Amazon RapidAPI 호출
- `app/lib/search/CostEngine.ts` — Total Landed Cost 계산
- `app/lib/search/ScoringEngine.ts` — 상품 점수 산정
- `app/lib/search/FraudFilter.ts` — 사기/저품질 상품 필터
- `app/lib/search/AIFilterService.ts` — AI 기반 관련성 필터

---

## Git 상태

### 커밋 완료 + Push 완료
- `9ea57b3` — Serper 17개 provider 제거
- `9f1b716` — 음성 검색 기능 추가
- `e408f67` — iOS App Store 제출 + 태블릿 1440px 수정
- `899eb98` — 코드베이스 리팩토링 + 컴포넌트 통합 + eBay 개선 (35 files, +1059 -1696)
- `(latest)` — OG 이미지 + 메타 description 업데이트

### 미커밋 파일 (Push 필요)
- `app/lib/search/searchIntelligence.ts` — generateQueryVariants() 추가
- `app/lib/search/SearchService.ts` — Step 1b 변형 재시도 로직 + BestBuyProvider import + fetchDomestic에 Best Buy 추가
- `app/lib/search/providers/AmazonProvider.ts` — 중복 로직 제거, 원래 구조 복원
- `app/lib/search/providers/BestBuyProvider.ts` — Serper → Best Buy 공식 API로 완전 교체
- `session-context.md` (이 파일)

---

## 외부 서비스 대기 현황

| 서비스 | 상태 | 다음 단계 |
|--------|------|----------|
| App Store (Build 2) | ✅ 승인 완료 | 출시됨 |
| Google Play Console | 국가 변경 재요청 (영어, 티켓 #782618) | Google 답변 대기 → 해결되면 Android 빌드 |
| Reddit r/SideProject | 스팸 필터 걸림 → 모더레이터 승인 대기 | 승인되면 karma 올라간 후 r/Frugal, r/deals 진출 |
| Impact (어필리에이트) | **트래픽 부족으로 거절됨** → 직접 쇼핑몰 컨택 전략으로 전환 | 파트너십 이메일 발송 (26개 타겟) |
| Rakuten (Case #390705) | Madhu에게 재답장 완료 | 기술팀 해결 대기 |
| Temu Affiliate Program | 승인 대기 중 | 승인되면 API 구현 |
| RapidAPI 환불 (Request #130604) | Belchior Arkad 신원 확인 요청 | 신원 확인 후 환불 진행 |
| 김범수 대표님 LinkedIn | ✅ 1촌 수락 + 자료 요청 받음 | 피치덱 + LinkedIn 메시지 발송 예정 |

---

## 홍보 글 작성 기준 (지침)

### 📋 광고글 요청 방법 (모든 채널 공통)

사용자가 광고글을 요청할 때 아래 정보를 제공하면 즉시 작성 가능:

```
1. 채널 — 어디에 올릴 건지 (Facebook 그룹명 / Reddit 서브레딧 / LinkedIn / X 등)
2. 상품/검색어 — POTAL에서 비교한 상품 (예: "airpods", "dyson v15")
3. 스크린샷 유무 — 첨부할 건지 / 텍스트만인지
4. (선택) 특별 강조사항 — 가격 차이, 배송 기간, 특정 기능 등
```

**예시 요청:** "Facebook 월마트 그룹에 올릴 글. dyson 검색 결과로. 스크린샷 첨부할 거야."

### 📝 채널별 글 작성 규칙

#### Facebook 딜 그룹
- **톤**: 실제 비교 결과를 먼저 보여주기 — "비교해봤더니 이렇게 차이남" 식
- **구조**: 가격 비교 숫자 먼저 → 절약 금액 강조 → potal.app 언급 → 질문으로 마무리
- **이미지**: POTAL 검색 결과 스크린샷 (검색 결과 부분만 캡처, 전체 화면 ❌)
- **금지**: "POTAL 써보세요!" 식 직접 홍보 ❌, 노골적 광고 ❌
- **게시 속도**: 하루 2~3개 그룹까지, 그룹 간 30분~1시간 간격
- **동시 게시 절대 금지**: Facebook "여러 그룹에 게시" 기능 사용 ❌ (스팸 처리됨)
- **그룹별 글 내용 반드시 다르게**: 같은 글 복붙 ❌

#### Facebook 그룹 유형별 톤
| 그룹 유형 | 톤 | 예시 |
|-----------|-----|------|
| Amazon 딜 그룹 | Amazon vs 해외 가격 비교 | "Amazon $106 vs AliExpress $49" |
| 절약/쿠폰 그룹 | 절약 팁 공유 | "Money-saving tip that blew my mind" |
| Walmart/매장 그룹 | 해당 매장 가격을 다른 곳과 비교 | "Walmart $99 — but is it the cheapest?" |

#### Reddit
- **톤**: 개인 경험 기반, 피드백 요청, 겸손하게
- **금지**: 노골적 홍보 (삭제 + ban 위험)
- **제한**: karma 필요 (현재 karma 1 → 대부분 서브레딧 글 올리기 불가)
- **서브레딧별 톤 차이**:
  - r/SideProject: "만들었는데 피드백 주세요"
  - r/Frugal: "절약 팁 공유합니다"
  - r/SaaS: "수익화 조언 구합니다"
  - r/deals: 딜 공유 (POTAL 결과 기반)

#### LinkedIn
- **톤**: 프로페셔널, 빌더 스토리, 업계 인사이트
- **해시태그**: #buildinpublic #startup #ecommerce #sideproject #pricecomparison #indiehacker

#### X (Twitter)
- **제한**: 280자
- **톤**: 짧고 임팩트 있게, 비전 제시

### 공통 지침
- **영어로 작성하는 모든 콘텐츠는 항상 영어 원문 + 한글 번역을 함께 제공할 것**
- POTAL URL: https://potal.app
- 스크린샷은 검색 결과 부분만 캡처 (Domestic vs Global 비교가 보이게)
- "POTAL" 브랜드명 직접 홍보 ❌ → 가치(가격 비교 결과)를 먼저 보여주고 자연스럽게 링크 제공

### 작성 완료 현황

| 채널 | 상태 | 비고 |
|------|------|------|
| Reddit r/SideProject | ❌ 스팸 필터 삭제됨 | karma 올라간 후 재시도 |
| LinkedIn | ✅ 게시 완료 | 프로페셔널 톤 |
| X (Twitter) | ✅ 게시 완료 | 일론 머스크 태그 |
| Facebook Amazing deals clearance and codes (20만명) | ✅ 첫 글 게시 완료 | Version 1 (Amazon 딜용), AirPods 스크린샷 첨부 |
| Facebook 기타 12개 그룹 | ⏳ 가입 승인 대기 | 승인 후 하루 2~3개씩 순차 게시 |
| **Facebook 자체 그룹 (Smart Deal Finder)** | ✅ 생성 완료 | 커버 사진 + 설명 + Version 1,2,3 모두 게시 |

### POTAL 자체 Facebook 그룹 (2개)

#### 1. Smart Deal Finder — Compare Prices Before You Buy (메인)
- **공개 그룹** (검색 가능)
- **커버 사진**: POTAL 브랜딩 ("Compare Every Store on Earth. Domestic vs Global — One Search.")
- **설명**: Amazon, Walmart, Target, eBay, Costco, AliExpress 가격 비교, 세금/배송/관세 포함 실제 총비용
- **게시물**: Version 1 (Amazon 딜용), Version 2 (절약 팁용), Version 3 (Walmart 비교용) 모두 게시
- **운영 전략**: 매일 다른 상품으로 가격 비교 결과 게시 → 콘텐츠 축적 → 멤버 유입
- **게시 빈도**: 매일 1~2개

#### 2. Amazon vs AliExpress — Who's Really Cheaper? (서브)
- **공개 그룹** (검색 가능)
- **설명**: Amazon vs AliExpress 실제 총비용 비교 (관세/배송 포함) + 배송 기간 비교
- **운영 전략**: 가볍게 유지, 콘텐츠 보조 채널
- **게시 빈도**: 주 1회

### 가입 완료 Facebook 그룹 (13개)

| 그룹 | 유형 | 글 버전 |
|------|------|---------|
| Amazon Deals & Discounts | Amazon 딜 | Version 1 |
| Amazon 90% Off Deals (9.2만명) | Amazon 딜 | Version 1 |
| Amazing deals clearance and codes (20만명) | 종합 딜 | Version 1 ✅ 게시완료 |
| Super Saver Deals & Discounts | 절약 | Version 2 |
| Deals finds / Sales, Coupons, Codes & Hidden Clearances | 절약/쿠폰 | Version 2 |
| Amazing Deals & Discount Community | 종합 딜 | Version 2 |
| The Bargain Hunters | 절약 | Version 2 |
| Walmart Hidden Clearance (2개, 19만명) | Walmart | Version 3 |
| Dollar General Penny List (49만명) | 매장별 | Version 2 |
| Hobby Lobby Community (28만명) | 매장별 | Version 2 |
| Family Dollar's Couponers | 쿠폰 | Version 2 |
| Couponing for Beginners (24만명) | 쿠폰 입문 | Version 2 |
| Online Shopping group | 온라인 쇼핑 | Version 1 |

---

## TODO (우선순위 순)

### 🔴 즉시
- [ ] 김범수 대표님 LinkedIn 메시지 + 피치덱 발송 (메시지 확정됨, 발송만 하면 됨)
- [ ] 미커밋 파일 push (검색 인텔리전스 + Amazon 수정 + BestBuyProvider 추가)
- [ ] 나머지 파트너십 이메일 6곳 발송 (Wayfair, iHerb, Macy's, Nordstrom, Zappos, Home Depot)
- [ ] Facebook 미국 쇼핑/직구 그룹 공략 (karma 제한 없음, 즉시 가능)
- [ ] SEO 블로그 콘텐츠 작성 ("Amazon vs AliExpress price comparison" 등)
- [ ] Target API 404 문제 해결 (엔드포인트 변경됨, 수정 필요) — Target에 직접 이메일 발송 완료
- [ ] Best Buy API 키 발급 후 연동 테스트 (BestBuyProvider 코드 작성 완료, API 키 대기)
- [x] iOS App Store 심사 → ✅ 승인 완료
- [x] 쇼핑몰 파트너십 이메일 발송 시작 — 7곳 완료 (아래 발송 현황 참조)
- [x] 김범수/QPV 리서치 완료 → `Kim_Bumsoo_QPV_Research.md`
- [x] 피치덱 v4 완성 → `POTAL_Pitch_Deck.pptx` (11 슬라이드, 4번 피드백 반영)
- [x] 김범수 LinkedIn 메시지 초안 확정 → `LinkedIn_Message_KimBumsoo.md`

### 🟡 승인 대기 후 진행
- [ ] Android 앱 제출 (Google Play 국가 변경 해결 후 → Capacitor 빌드 → 제출)
- [ ] Best Buy Developer Portal — 이메일 발송 완료, API 키 발급 대기
- [ ] Target — 파트너십 이메일 발송 완료, 응답 대기
- [ ] Kroger — Developer Partner Request 제출 완료, 응답 대기
- [ ] Reddit r/SideProject 모더레이터 승인 대기 → 승인 후 r/Frugal, r/deals 진출
- [ ] Google Play 국가 변경 대기 (티켓 #782618)
- [ ] Reddit karma 올라가면 r/Frugal (3.5M), r/deals, r/OnlineShopping 글 올리기
- [ ] Temu Affiliate 승인 → API 구현
- [ ] Rakuten 기술팀 해결 대기

### 🟢 무료 채널 반응 검증 후 진행
- [ ] 광고 집행 (어떤 메시지/채널이 먹히는지 확인 후)
- [ ] Product Hunt 런치 페이지 (유저/피드백 데이터 있을 때 효과적)
- [ ] 투자자 피치 원페이저 PDF (보여줄 숫자가 생긴 후)
- [ ] 크라우드펀딩 (Kickstarter/Indiegogo)

### 🔵 장기
- [ ] 새로운 Temu API 주기적 확인
- [ ] Serper 기반 provider 대안 API 조사
- [ ] Push notification 등 네이티브 기능 확장
- [ ] ResultsGrid.tsx 추가 분리 (955줄 → 더 작게)
- [ ] SearchWidget.tsx 분리 (495줄)
- [ ] OpenWeb Ninja에 API 불안정 이슈 리포트 (간헐적 0건 반환)

---

## Provider 현황

### 활성 (피치덱 기준 6개 쇼핑몰)
| Provider | API | 상태 | 분류 |
|----------|-----|------|------|
| Amazon | RapidAPI (`real-time-amazon-data`, OpenWeb Ninja PRO $25/mo) | ✅ 정상 (간헐적 0건 → SearchService 재시도로 커버) | Domestic |
| Walmart | RapidAPI (`realtime-walmart-data`) | ✅ 정상 | Domestic |
| eBay | RapidAPI PRO (`real-time-ebay-data`) | ✅ 정상 (캡차 재시도 로직 추가) | Global |
| Target | RapidAPI (`target-com-shopping-api`) | ❌ 404 에러 — 엔드포인트 변경됨, 파트너십 이메일 발송 완료 | Domestic |
| AliExpress | RapidAPI (`aliexpress-data`) | ✅ 정상 | Global |
| Costco | (피치덱에 포함, 실제 구현 상태 확인 필요) | 🔄 연동 상태 확인 필요 | Domestic |

### 연동 준비 완료 (API 키 대기)
| Provider | API | 상태 |
|----------|-----|------|
| Best Buy | Best Buy 공식 Products API (무료) | 🔄 BestBuyProvider 코드 완성, API 키 대기 (Developer Portal 가입 오류 → 이메일로 요청) |

### 비활성
| Provider | 이유 |
|----------|------|
| Shein | RapidAPI 서버 다운, 환불 요청 중 |
| Temu | Serper 기반 제거됨, 어필리에이트 승인 대기 |
| HomeDepot 등 17개 | Serper 기반 제거됨 (코드 파일은 providers/ 폴더에 남아있음) |

---

## Capacitor iOS 앱 설정 상세

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.potal.app',
  appName: 'POTAL',
  webDir: 'out',
  server: {
    url: 'https://potal.app',
    cleartext: false,
    allowNavigation: ['potal.app', '*.potal.app'],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'POTAL',
    backgroundColor: '#02122c',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#02122c',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#02122c',
    },
  },
};
export default config;
```

### iOS 네이티브 파일 (Swift)

| 파일 | 역할 |
|------|------|
| `AppDelegate.swift` | 앱 생명주기 + KeyboardAccessoryFix 적용 |
| `KeyboardAccessoryFix.swift` | WKContentView method swizzling으로 키보드 accessory bar 제거 |
| `TabletViewController.swift` | CAPBridgeViewController 서브클래스. iPad에서 viewport를 1440px로 강제 잠금 (setAttribute monkey-patch) |
| `Main.storyboard` | customClass=`TabletViewController`, customModule=`App` |

---

## Apple Developer 계정 정보

- **이름**: EUNTAE JANG (장은태)
- **이메일**: contact@potal.app
- **Bundle ID**: com.potal.app
- **앱 이름**: POTAL
- **인증서**: Apple Distribution (수동 생성)
- **프로비저닝 프로필**: POTAL Distribution (수동 생성)
- **Xcode**: 전체 앱 설치 완료 (iOS 26.2 Simulator)

---

## 사용자 환경 참고

- **프로젝트 경로 (Mac)**: `~/portal/`
- **Git push**: HTTPS 인증 실패함 → 사용자가 Mac 터미널에서 직접 push
- **개발 서버**: `npm run dev` (Next.js)
- **배포**: Vercel (https://potal.app)
- **DB**: Supabase
- **사용자 이름**: 장은태 (EunTae Jang / EUNTAE JANG)
- **직함**: Founder & CEO, POTAL
- **이메일**: soulmaten7@gmail.com
- **사업 이메일**: contact@potal.app
- **코딩 경험**: 없음 → Claude AI + 바이브코딩으로 구축
- **구축 기간**: 1달 (매일 9시간)

---

## POTAL 비전 & 투자 전략

### 비전
- 전세계 모든 국가의 쇼핑사이트를 연결
- 국경이 허물어지는 시대에 모든 상품을 시간과 비용으로 비교
- 기존 쇼핑 플랫폼이 할 수 없는 일 → 모든 사람이 POTAL을 거쳐 구매

### 비즈니스 모델 (피치덱 v4 확정)
- **Phase 1 (현재)**: 어필리에이트 커미션 — 사용자가 POTAL에서 상품 클릭 → 쇼핑몰에서 구매 시 1~8.5% 커미션 (Amazon Associates, CJ, Rakuten 등)
- **Phase 2**: 스폰서 리스팅 — 쇼핑몰이 POTAL 검색 결과 상위 노출을 위해 광고비 지불 (Google Shopping 모델)
- **Phase 3 (글로벌 확장 후)**: B2B API 서비스 — 차량/스마트기기에 쇼핑 비교 API 임베드, 금융앱/카드사에 결제 전 최저가 확인 위젯 제공
- **vs Slickdeals**: Slickdeals = 딜 큐레이션 (미국 한정, 유저가 올림) | POTAL = 실시간 자동 비교 (글로벌 확장 가능, 자동화)

### Honest Challenges (피치덱 v4 — 지적 정직성)
1. **트래픽 없음** → 무료 채널(Reddit, Facebook, SEO) 우선 공략 → 반응 검증 후 광고 집행
2. **API 의존도 높음 (RapidAPI)** → 직접 쇼핑몰 파트너십으로 공식 API 전환 제안 중 + 수익금으로 유료 API 확보
3. **1인 개발 한계** → API 확보 한계 → 마케팅/트래픽으로 협상력 확보 / 비용 한계 → 투자금으로 해결
4. **수익 없음 (Pre-Revenue)** → 어필리에이트 파이프라인 구축 중 (Amazon Associates 연결 완료)

### Roadmap (피치덱 v4 — 챕터 기반)
- **Chapter 1: 미국 시장 장악** — 쇼핑몰 20개+ API 연동 확대, 무료 채널 공략, 어필리에이트 수익화, 미국 법인 설립
- **Chapter 2: 글로벌 확장** — 1~2개 국가 시범 연동, 다국어 지원, 현지 법인, 글로벌 쇼핑 데이터 축적
- **Chapter 3: 플랫폼 확장 + B2B** — POTAL AI 개인화, B2B API 런칭, 차량/스마트기기 연동, 금융앱 위젯, 글로벌 M&A Exit

### 전략
1. **실유저 확보 최우선** — 무료 채널(Reddit, Facebook, SEO) 먼저, 반응 검증 후 광고 집행
2. **어필리에이트 수익 파이프라인** — Amazon Associates(연결됨) + Walmart/Impact(대기) + Rakuten(대기) + Temu(대기)
3. **크라우드펀딩** — 소규모 투자자 모집
4. **일론 머스크 공표** — Tesla 차량 내 쇼핑 플랫폼 비전 (X에 글 올림)
5. **단계적 확장** — 미국 모든 쇼핑사이트 → 전세계 확장

### 1차 투자금 용도 (피치덱 확정)
- **35% API 확장** — 미국 내 모든 쇼핑사이트 API 연결 (최우선)
- **25% 마케팅/트래픽** — 실유저 확보
- **25% 운영** — 서버/인프라
- **15% 법인설립 + 채용** — 미국 현지 법인 + 최소 인력 (AI 시대, 1-2명)

### 피치덱 관련 파일
- `POTAL_Pitch_Deck.pptx` — 최종 피치덱 (v4, 11 슬라이드)
- `create_pitchdeck.js` — 피치덱 생성 스크립트 (pptxgenjs)
- `Kim_Bumsoo_QPV_Research.md` — 김범수/QPV 종합 리서치
- `LinkedIn_Message_KimBumsoo.md` — LinkedIn 메시지 초안 (확정)

---

## Slickdeals 경쟁/보완 분석

### Slickdeals 비즈니스 모델
- 크라우드소싱 딜 플랫폼 (12M 유저가 딜을 찾아 올림)
- 유저 투표로 딜 등급 결정 (Popular → Front Page → Fire)
- 수익: 어필리에이트 링크 교체 (1~8.5% 커미션) + 스폰서 딜
- 네트워크: CJ, Impact, Rakuten, Awin (POTAL과 동일)
- Goldman Sachs + Hearst가 2018년 인수

### POTAL과의 관계
- Slickdeals = "딜 큐레이션" (유저가 올림) / POTAL = "실시간 자동 비교" (자동)
- 타겟층 겹침: 가격 민감한 미국 온라인 쇼퍼 (25-34세 밀레니얼)
- 두 유저 모두 잡을 수 있음: 딜 찾는 고수 + 비교를 못 하는 일반인
- 채널별 메시지만 다르게: 고수에겐 "최저가 검증 도구", 일반인에겐 "한번에 비교"

### Slickdeals 직접 진출 방법
- Deal 게시: 상품 딜만 가능 (서비스 불가) ❌
- 포럼 게시: 활동 이력 필요, 노골적 홍보 삭제됨 △
- 유료 광고: 최소 집행 금액 높음, MVP 단계 부적합 ❌
- **현실적 방법**: Slickdeals 유저가 겹치는 Reddit/Facebook에서 공략

---

## 쇼핑몰 파트너십 이메일 아웃리치 지침

### 배경
- POTAL의 근본적 문제: 쇼핑몰 API 부족 → 직접 쇼핑몰에 컨택하여 API 확보
- Impact.com에서 트래픽 부족으로 거절당함 → 어필리에이트 네트워크 우회, 직접 접근 전략
- **핵심 제안**: "무료로 API 공유해주면, POTAL에서 무료 상품 노출 제공"

### 이메일 템플릿 파일
- **위치**: `POTAL_Partnership_Email_Template.md`
- **대상 리스트**: `POTAL_Partnership_Target_List.xlsx` (26개 쇼핑몰, 연락처, API 상태, 체크리스트)

### 이메일 핵심 구조
1. **자기소개** — EunTae Jang, POTAL 창업자
2. **제안 혜택 4가지**:
   - 무료 상품 노출 (비용 없이 구매 의향 쇼핑객에게 노출)
   - 직접 트래픽 유도 (상품 페이지로 바로 연결)
   - 수수료 없음 (성장 단계 동안 조건 없이 무료)
   - 글로벌 확장 시 해외 노출 (글로벌 배송 진행 시 해외 쇼핑객에게 다이렉트 노출)
3. **비전** — 전세계 1순위 가격비교 플랫폼 (배송비 포함 실제 총비용 비교), 미국 우선 → 글로벌 확장
4. **초기 파트너 혜택** — 우선 배치, Featured Store 배지, 의견 반영권, 프리미엄 우선 접근
5. **필요한 것**:
   - 상품 검색 API 접근 (상품명, 가격, 이미지, URL)
   - 기술 담당자 연결
   - 어필리에이트는 트래픽 충분해진 후 제공해도 됨 (상대 부담 낮추기)
6. **연락 방법** — 이메일 또는 채팅 선호 (영어 통화 부담 → 서면 커뮤니케이션)

### 이메일 작성 규칙
- **영문 본문 + 한국어 번역** 항상 함께 제공
- **[Company Name]** → 각 쇼핑몰 이름으로 교체
- **[Name / Partnership Team]** → 담당자 이름 또는 "Partnership Team"
- Subject Line 3가지 옵션 중 상황에 맞게 선택
- "영어가 자연스럽지 않아"는 영문에 넣지 않음 (신뢰도 유지)
- "다른곳에서 찾아볼수없는" 같은 과장 표현 대신 구체적 차별점 명시

### 발송 프로세스
1. 엑셀 리스트에서 대상 쇼핑몰 선택
2. 템플릿의 [Company Name] 교체
3. 해당 회사 Contact/Partnership 페이지에서 이메일 확인
4. 발송 후 엑셀 Email Outreach Checklist에 기록
5. 1주일 후 응답 없으면 Follow-up 이메일 발송

### 관련 파일
- `POTAL_Partnership_Email_Template.md` — 기본 템플릿 (영문 + 한국어)
- `BestBuy_Email_Ready.md` — Best Buy 맞춤 이메일 (Developer Portal 오류 언급)
- `Target_Email_Ready.md` — Target 맞춤 이메일 (기존 API 404 문제 언급)
- `All_Partnership_Emails_Ready.md` — 13개 쇼핑몰 전체 이메일 모음 (카테고리별)
- `POTAL_Partnership_Target_List.xlsx` — 27개 쇼핑몰 리스트 + Email Outreach Checklist

### 파트너십 이메일 발송 현황 (2026-02-28)

#### ✅ 발송 완료 (7곳)
| 쇼핑몰 | 방법 | 이메일/폼 |
|--------|------|----------|
| Best Buy | 이메일 | developer@bestbuy.com |
| Target | 이메일 | partners@Targetpartnerships.com |
| Newegg | 이메일 | Partnerservices@newegg.com |
| Costco | 이메일 | isinfo@costco.com |
| Sam's Club | 이메일 | partner-support@samsclub.com |
| Kroger | Developer Partner Request 폼 | developer.kroger.com/support |
| Lowe's | ⛔ 직접 컨택 불가 | 고객용 폼만 있음, HR 폼밖에 없음 |

#### ⬜ 발송 대기 (6곳)
| 쇼핑몰 | 방법 | 이메일/폼 |
|--------|------|----------|
| Macy's | CJ Affiliate 통해 가입 필요 | macys.com/campaign/affiliate.jsp |
| Nordstrom | Rakuten Affiliate 통해 가입 필요 | nordstrom.com/browse/affiliate-program |
| Zappos | CJ Affiliate 통해 가입 필요 | zappos.com/associates-program |
| Wayfair | 이메일 | supplierservicedesk@wayfair.com |
| Home Depot | Impact Radius 통해 가입 필요 | homedepot.com 기업 문의 |
| iHerb | 이메일 | affiliates@iherb.com |

#### 발견된 사항
- **Best Buy**: 무료 공개 API 존재 (Products API) → BestBuyProvider 코드 작성 완료, Developer Portal 가입 시 에러 발생 → developer@bestbuy.com으로 직접 요청
- **Best Buy API 키 정책**: Gmail 등 무료 이메일 불가, 회사 이메일(contact@potal.app) 필수
- **Kroger**: Developer Portal 가입 완료, 그러나 Products API "Insufficient privileges" → Public API 없음 → Partner Request 폼으로 요청
- **Lowe's**: Developer Portal은 IMS-Auth(인증)만 제공, 상품 API 없음. 기업 문의 폼은 HR/고객용만 있어 컨택 불가
- **Sam's Club**: 원래 엑셀 리스트에 없었음 → 추가 완료 (Walmart 자회사, 벌크 가격 비교 가치)

---

## 2026-02-28 작업 요약 (김범수/QPV 리서치 + 피치덱 제작)

### 1. 김범수 대표 / Quantum Prime Ventures 리서치 ✅

김범수 대표님이 LinkedIn 1촌 수락 후 "사업 내용 볼 수 있는 웹사이트나 자료 있으면 보내주세요"라고 응답.
종합 리서치 파일 작성 완료: `Kim_Bumsoo_QPV_Research.md`

**김범수 프로필:**
- 연세대 → 삼성 → KTB → 실리콘밸리 22년 → Translink Capital → QPV (2025.7 설립)
- QPV Inc.: 2025.7.8 캘리포니아 Stock Corporation, Sunnyvale 소재
- Quantum Ventures Korea: 119개 포트폴리오, 주요 엑싯 (Broadcom, Inphi IPO, HP, Qualcomm)
- 첫 펀드: 300억원 목표
- Demoday SV 유튜브 채널 운영

**투자 철학 (3가지 기준):**
1. 창업가의 행동력 — "말만 하는 사람 vs 실제로 만든 사람"
2. 지적 정직성 — "모르는 건 모른다고 인정하는가"
3. 사람 — "제품보다 사람에게 투자"

**투자 성향:**
- Pre-seed/Seed 집중, 60%가 1년 미만 회사
- Anti-hype: 남들이 하니까 하는 투자 ❌
- B2B/SaaS 비중 높음, 생성형 AI 최우선 관심사
- 실리콘밸리 한인 창업자 네트워크

### 2. POTAL 피치덱 v3 → v4 완성 ✅

파일: `POTAL_Pitch_Deck.pptx` (11 슬라이드)
생성 스크립트: `create_pitchdeck.js` (pptxgenjs + react-icons + sharp)

**3번의 피드백 라운드를 거쳐 확정된 핵심 변경사항 (v3):**

1. **Title**: "Compare Every Store on Earth." + "Domestic vs Global — One Search." 두 태그라인
2. **Problem**: "진짜 최저가를 아는 사람은 없다" → 크로스보더 커머스 시장 파괴 + Domestic vs Global 비교 격차 + 블루오션 내러티브로 전면 재구성
3. **Solution**: POTAL AI를 "버티컬 AI 쇼핑 엔진"으로 상세화, "현재 6개 → 전체 확장 준비 완료"
4. **Market**: Gen Z 한정 ❌ → "1차 타겟 + 잠재 전체 시장" 프레이밍, 2025 통계 ($1.47T, 289M, 59%)
5. **Traction**: iOS 승인 완료, Best Buy 제거, 파트너십 워딩 변경, 5개 항목으로 축소
6. **Why Me**: "확신에서 시작한 실행" 파운더 내러티브
7. **Business Model**: B2B 2개 예시 (차량/스마트기기, 금융앱), Slickdeals 비교, "글로벌 확장 후" 타이밍
8. **Honest Challenges**: API 듀얼트랙, 1인 한계 상세, 로컬 법인은 제거 (The Ask으로 이동)
9. **Roadmap**: 연도 기반 → 챕터 기반 (Ch1: 미국 장악, Ch2: 글로벌 확장, Ch3: 플랫폼+B2B)
10. **The Ask**: 35% API / 25% 마케팅 / 25% 운영 / 15% 법인+채용

**v4 추가 수정사항 (v3 → v4):**
1. **Market Opportunity 59% 라벨 수정**: "글로벌 쇼퍼 중 해외 구매 경험 비율" → "전 세계 온라인 쇼퍼 중 해외 사이트 구매 경험" (동어반복 문제 해결)
2. **Market Opportunity 출처 개별 명시**: 기존 "Sources: Coherent Market Insights 2025, Capital One Shopping 2025, DHL Cross-Border Survey 2025" → "$1.47T — Coherent Market Insights 2025 | 289M — eMarketer 2025 | 59% — DHL Online Shopper Survey 2025 (24,000명, 24개국)" (각 숫자별 정확한 출처 매칭)
3. **Traction 하단 문구 수정**: "모든 것을 1인이, AI로, 3개월 만에 구축했습니다." → "1인이, AI로, 매일 9시간씩, 1달 만에 구축했습니다." (사실관계 수정: 3개월→1달, 하루 9시간 투입 추가)

**확립된 핵심 원칙:**
- POTAL은 코어 기능(Domestic vs Global 비교)에 집중, 프리미엄 소비자 기능 추가 ❌
- "가격 추적 알림, 히스토리 차트"는 B2B 기능이지 소비자 기능이 아님
- AI 시대 = 최소 채용 (1-2명), 전통적 팀 빌딩 ❌
- B2B API 서비스는 글로벌 확장 후
- 투자 배분에서 API 확장이 최우선 (35%)
- 59% 통계는 "시장 크기"뿐 아니라 "이미 해외 구매를 하는 즉시 타겟 가능 인구"로서의 전략적 가치가 있음
- Market Opportunity의 모든 숫자는 개별 출처를 명확히 밝혀야 함
- 투자자에게 보내는 첫 메시지는 짧게 (자료 요청에 대한 답변, 투자 요청 ❌)
- 사업계획서는 Pre-seed 단계에서 필수 아님 — 피치덱 + 작동하는 웹사이트가 우선, 추가 자료 요청 시 준비

**2025 크로스보더 이커머스 통계 (피치덱에 사용, 출처 검증 완료):**
- $1.47T 글로벌 크로스보더 시장 — **Coherent Market Insights 2025** (2032년 $4.81T 전망, CAGR 18.4%)
- 289M 미국 온라인 쇼퍼 — **eMarketer 2025** (정확히 288.45M, 반올림)
- 59% 전 세계 온라인 쇼퍼 중 해외 사이트 구매 경험 — **DHL 2025 Online Shopper Survey** (24개국 24,000명 조사, 35%는 월 1회 이상)
- 48% 예상치 못한 비용으로 해외 구매 포기 — **Baymard Institute 2024.2** (미국 성인 1,012명 조사)
- 54% 높은 배송비가 최대 불만

**창업자 팩트 (피치덱 반영):**
- 구축 기간: **1달** (3개월 아님)
- 일일 투입 시간: **매일 9시간**
- 코딩 경험: 전혀 없음 → Claude AI + 바이브코딩으로 구축

### 3. 김범수 대표님 LinkedIn 메시지 초안 작성 ✅

파일: `LinkedIn_Message_KimBumsoo.md`

**확정된 메시지 (은태님이 직접 수정):**
```
범수님, 관심 가져주셔서 감사합니다.
저는 POTAL이라는 가격비교 서비스를 만들고 있는 장은태입니다.
웹사이트: https://potal.app
피치덱: 첨부드렸습니다.
한 줄로 요약하면, 미국 내 쇼핑몰과 해외 직구 상품을 한번에 검색해서 배송비·관세·세금까지 포함한 실제 총비용으로 비교해주는 서비스입니다.
편하실 때 피치덱 봐주시면 감사하겠습니다. 궁금하신 점 있으시면 언제든 말씀 부탁드립니다.
장은태 드림
contact@potal.app
```

**메시지 설계 원칙:**
- 긴 메시지 ❌ → 피치덱에 다 있으니 메시지는 짧게 (뭐하는 서비스인지 한 줄 + 링크 + 파일)
- 중간에 행동력/지적 정직성 어필하는 내용은 피치덱이 하는 역할 → 메시지에서 중복 불필요
- "투자해주세요" ❌ → 자료 요청에 대한 답변일 뿐
- 시장 규모 숫자 나열 ❌ → 피치덱에 있음
- 김범수 대표가 피치덱 보고 관심 생기면 자연스럽게 질문이 옴 → 그때 대화에서 보여주기

### 4. 다음 세션에서 이어서 할 일 (우선순위 순)

#### 🔴 즉시 실행 (은태님이 직접 해야 할 것)
1. **김범수 대표님 LinkedIn 메시지 발송** — 메시지 확정됨 (`LinkedIn_Message_KimBumsoo.md`), `POTAL_Pitch_Deck.pptx` 첨부해서 LinkedIn에서 발송만 하면 됨
2. **미커밋 파일 push** — Mac 터미널에서 `git add` + `git commit` + `git push` (HTTPS 인증 문제로 은태님이 직접 해야 함)
   - `app/lib/search/searchIntelligence.ts`
   - `app/lib/search/SearchService.ts`
   - `app/lib/search/providers/AmazonProvider.ts`
   - `app/lib/search/providers/BestBuyProvider.ts`

#### 🟡 Claude와 함께 할 일
3. **나머지 파트너십 이메일 6곳 작성/발송** — Wayfair(supplierservicedesk@wayfair.com), iHerb(affiliates@iherb.com)는 직접 이메일 가능. Macy's/Nordstrom/Zappos는 CJ/Rakuten 어필리에이트 경유, Home Depot는 Impact 경유
4. **Facebook 그룹 글 올리기** — 가입 승인된 12개 그룹에 순차 게시 (하루 2~3개, 그룹별 다른 내용)
5. **Android 앱 제출** — Google Play 국가 변경 해결되면 → Capacitor Android 빌드 → 제출
6. **SEO 블로그 콘텐츠 작성** — "Amazon vs AliExpress price comparison" 등 검색 유입용

#### ⏳ 대기 중 (응답 오면 대응)
- 김범수 대표 응답 → 추가 자료 요청 시 사업계획서 작성
- Best Buy API 키 발급
- Target 파트너십 응답
- Kroger Partner Request 응답
- Google Play 국가 변경 (티켓 #782618)

#### 참고 파일 위치
- 피치덱: `POTAL_Pitch_Deck.pptx` (최종 v4)
- 피치덱 생성 스크립트: `create_pitchdeck.js` (수정 시 `node create_pitchdeck.js`로 재생성)
- 김범수 리서치: `Kim_Bumsoo_QPV_Research.md`
- LinkedIn 메시지: `LinkedIn_Message_KimBumsoo.md`
- 파트너십 이메일 템플릿: `POTAL_Partnership_Email_Template.md`
- 전체 이메일 모음: `All_Partnership_Emails_Ready.md`
- 쇼핑몰 타겟 리스트: `POTAL_Partnership_Target_List.xlsx`

---

### BestBuyProvider 코드 변경사항 (2026-02-28)
- `app/lib/search/providers/BestBuyProvider.ts` — Serper 기반 → Best Buy 공식 Products API로 완전 교체
  - API endpoint: `https://api.bestbuy.com/v1/products`
  - 환경변수: `BESTBUY_API_KEY` 필요
  - 필드 매핑: name, salePrice/regularPrice, largeImage, url, customerReviewAverage/Count, manufacturer, freeShipping
  - 정렬: bestSellingRank.asc
  - 페이지당 25개 상품
- `app/lib/search/SearchService.ts` — fetchDomestic()에 Best Buy 병렬 호출 추가 (Amazon + Walmart + Best Buy)
