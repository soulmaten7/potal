# POTAL — AI Shopping Comparison Agent: Session Context

> 이 파일은 새 AI 세션이 프로젝트의 현재 상태를 완벽히 이해할 수 있도록 작성된 컨텍스트 문서입니다.
> 새 세션 시작 시: "POTAL 프로젝트 작업을 이어서 하려고 해. /Users/maegbug/portal 에 있는 SESSION-CONTEXT.md 파일을 먼저 읽고 시작해줘." 라고 말하면 됩니다.
> **마지막 업데이트: 2026-02-19 (3차 — .env.local 정리 + API 변경이력 추가)**

---

## 1. 프로젝트 개요

POTAL은 AI 기반 글로벌 쇼핑 비교 에이전트로, 여러 리테일러(Amazon, Walmart, BestBuy, eBay, Target, AliExpress, Temu 등)에서 상품을 동시에 검색하고 비교해주는 웹 서비스입니다.

- **프로젝트 경로**: `/Users/maegbug/portal` (Mac 로컬)
- **기술 스택**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **배포**: Vercel Pro (`potal.app`)
- **AI**: OpenAI GPT-4o / GPT-4o-mini (검색 분석, 스마트 필터, 관련성 판단)
- **인증**: Supabase Auth
- **상품 API**: RapidAPI (Amazon/Walmart/BestBuy/eBay/Target/AliExpress) + **Apify (Temu)**
- **⚠️ Temu는 Apify를 사용합니다!** Actor: `amit123/temu-products-scraper`, 결제 중 ($5/월 무료 크레딧). RapidAPI Temu는 구독자 1명/리뷰 0개로 거부됨.

---

## 2. 프로젝트 구조 (핵심 파일)

```
portal/
├── app/
│   ├── search/
│   │   └── page.tsx                    # 메인 검색 결과 페이지 (프론트엔드 인터리빙 포함)
│   ├── api/
│   │   ├── search/route.ts             # 검색 API 엔드포인트 → Coordinator 호출
│   │   └── ai-suggestions/route.ts     # AI Smart Suggestion API (v4.0)
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── Coordinator.ts          # 🎯 핵심: 전체 파이프라인 오케스트레이션
│   │   │   ├── QueryAgent.ts           # 검색어 분석 + 플랫폼별 쿼리 생성
│   │   │   └── AnalysisAgent.ts        # 상품 관련성/사기 분석 (현재 비활성화)
│   │   ├── search/
│   │   │   ├── providers/
│   │   │   │   ├── AmazonProvider.ts   # ✅ 작동
│   │   │   │   ├── WalmartProvider.ts  # ✅ 작동
│   │   │   │   ├── BestBuyProvider.ts  # ⚠️ 작동하나 빈 결과 자주 반환
│   │   │   │   ├── EbayProvider.ts     # ✅ 작동
│   │   │   │   ├── TargetProvider.ts   # ✅ 작동
│   │   │   │   ├── AliExpressProvider.ts # ✅ 작동
│   │   │   │   ├── TemuProvider.ts     # ✅ 작동 (Apify Actor: amit123/temu-products-scraper) ⚠️ RapidAPI 아님!
│   │   │   │   ├── SheinProvider.ts    # ❌ 비활성화 (API 서버 다운 → 환불 처리됨)
│   │   │   │   └── CostcoProvider.ts   # ❌ 비활성화 (Deals API만 제공)
│   │   │   ├── FraudFilter.ts          # 규칙 기반 사기 상품 필터
│   │   │   ├── CostEngine.ts           # Total Landed Cost 계산
│   │   │   └── ScoringEngine.ts        # Best/Cheapest/Fastest 점수
│   │   └── ai/
│   │       ├── prompts/
│   │       │   ├── smart-filter.ts     # AI Smart Suggestion v4.0 (gpt-4o)
│   │       │   ├── intent-router.ts    # 검색 의도 분류
│   │       │   └── product-judge.ts    # 상품 관련성 판단 (ProductJudge)
│   │       └── types.ts                # AI 관련 타입 정의
│   └── types/
│       └── product.ts                  # Product 타입 정의
├── components/
│   └── search/
│       ├── FilterSidebar.tsx           # 필터 사이드바 (가격/리테일러/배송)
│       └── ResultsGrid.tsx             # ✅ 실제 사용하는 결과 그리드 컴포넌트
├── .env.local                          # 실제 API 키 (절대 커밋하지 마세요)
├── .env.example                        # API 키 템플릿
└── SESSION-CONTEXT.md                  # 이 파일
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

## 4. 최근 커밋 이력

### 커밋 1: `3b95b2c` (2026-02-18) — ✅ 커밋 완료, 푸시 필요
```
feat: AI Smart Filter v4.0 + interleaving fix + AnalysisAgent disable
```
- AI Smart Suggestion v4.0: gpt-4o-mini→gpt-4o, 데이터 강화(price+site), few-shot 예시
- 프론트엔드 인터리빙 + FilterSidebar 정렬 + AnalysisAgent 비활성화
- SESSION-CONTEXT.md 추가

### 미커밋 변경사항 (2026-02-18 2차)

| 파일 | 변경 내용 |
|------|----------|
| `app/lib/search/providers/SheinProvider.ts` | 새 API(unofficial-shein by apidojo) 엔드포인트로 교체. 호스트/파라미터/응답파싱 전부 수정 |
| `app/lib/agent/Coordinator.ts` | SheinProvider 주석 안내 업데이트 (구독 후 활성화 방법) |
| `.env.example` | RAPIDAPI_HOST_SHEIN 호스트 업데이트 |
| `app/layout.tsx` | SEO 강화: metadataBase, title template, canonical, OG이미지, googleBot, JSON-LD |
| `app/opengraph-image.tsx` | 동적 OG 이미지 생성 (Next.js Edge) |
| `app/robots.ts` | 동적 robots.txt (saved/wishlist/account 추가 차단) |
| `app/sitemap.ts` | /search 페이지 추가, URL을 potal.app으로 통일 |
| `public/og-image.svg` | OG 이미지 SVG (fallback) |

**커밋 명령어** (Mac 터미널):
```bash
cd ~/portal
git add app/lib/search/providers/SheinProvider.ts app/lib/agent/Coordinator.ts .env.example app/layout.tsx app/opengraph-image.tsx app/robots.ts app/sitemap.ts public/og-image.svg SESSION-CONTEXT.md
git commit -m "feat: Shein API 교체 준비 + SEO 기본 작업

- SheinProvider: unofficial-shein (apidojo) API로 엔드포인트 교체 (구독 후 활성화)
- SEO: metadataBase, canonical, JSON-LD (SearchAction), dynamic OG image, robots.ts
- sitemap: /search 페이지 추가, URL 통일"
git push origin main
```

**Mac에서 먼저 할 것**:
```bash
rm ~/portal/public/robots.txt  # app/robots.ts가 대체
git push origin main            # 이전 커밋 + 이 커밋 모두 푸시
```

---

## 5. Shein API 현황 (2026-02-18 확인)

**RapidAPI Shein API 전멸 상태**:
- Unofficial SHEIN (apidojo): RapidAPI에서 삭제됨
- Shein Business API (sheinBusiness): 500 에러 / "failed after 5 attempts"
- Shein Scraper API (AsyncSolutions): 보안 강화로 공식 중단
- 기존 Pinto Studio: 서버 다운 (환불 완료)

**대안: CJ Affiliate API로 Shein 연동**
- CJ Partners에서 SHEIN (Advertiser ID: 3773223) 발견 — 상품 1.36억 개
- CJ Product Search API를 통해 상품 검색 + 어필리에이트 수익 동시 해결 가능
- **선행 조건**: US 주소 활성화 → SHEIN Apply to Program → 승인 → CJ API 키 발급

**결론**: Shein은 보류. US 주소 활성화 후 CJ API로 연동하는 것이 최선의 경로

---

## 6. 리테일러 API 현황

### 작동 중 (7개)
| 리테일러 | API 소스 | 상태 | 비고 |
|---------|----------|------|------|
| Amazon | RapidAPI `real-time-amazon-data` | ✅ 정상 | country=US 고정 |
| Walmart | RapidAPI `realtime-walmart-data` | ✅ 정상 | |
| BestBuy | RapidAPI `bestbuy-usa` | ⚠️ 빈 결과 자주 반환 | API 데이터 품질 문제, 지역 문제 아님 |
| eBay | RapidAPI `real-time-ebay-data` | ✅ 정상 | .com TLD 고정 |
| Target | RapidAPI `target13` | ✅ 정상 | store_id 기반 |
| AliExpress | RapidAPI `aliexpress-data` | ✅ 정상 | country_code 변경 가능 |
| Temu | **Apify** `amit123/temu-products-scraper` | ✅ 정상 | 결제 중 ($5/월 무료), 45초 타임아웃, 7-15초 소요. ⚠️ RapidAPI Temu는 거부됨 (구독자1/리뷰0) |

### 비활성화 (2개)
| 리테일러 | 이유 | 해결책 |
|---------|------|--------|
| Shein | RapidAPI API 전부 죽음 (보안 강화) | US 주소 활성화 후 CJ Affiliate API로 연동 예정 |
| Costco | Deals API만 제공 (전체 검색 불가) | 기술적 한계, 시장점유율 1.5%로 우선순위 낮음 |

---

## 7. 어필리에이트/수익화 현황

### Wise USD 계좌 (결제 수단)
- **이름**: EUNTAE JANG
- **계좌번호**: 145229234931719
- **라우팅번호**: 084009519
- **은행명** (어필리에이트 등록 시): Community Federal Savings Bank
- **Swift/BIC**: TRWIUS35XXX
- **계좌 유형**: Deposit

### 어필리에이트 플랫폼 현황
| 플랫폼 | 상태 | 은행 | 다음 단계 |
|--------|------|------|----------|
| **CJ Affiliate** | ✅ 가입완료 | Wise 등록 완료 ($50 최소) | US 주소 등록 후 국가 변경 → US 광고주 검색 |
| **Rakuten** | ✅ 복구완료 | PayPal Business 전환 완료, 은행 인증 대기 중 | 마이크로디포짓 확인 (1-3일), US 주소 후 Direct Deposit |
| **Impact** | ⚠️ 승인 거부 | - | Account ID 6999751, 티켓 #781423, US 주소로 어필 |
| **Walmart 직접** | ❌ 미가입 | - | US 주소 필요 |
| **Target 직접** | ❌ 미가입 | - | US 주소 필요 |
| **BestBuy 직접** | ❌ 미가입 | - | US 주소 필요 |

### US 가상 주소 (Anytime Mailbox)
- **주소**: 2803 Philadelphia Pike, Suite B #1126, Claymont, DE 19703
- **상태**: USPS Form 1583 공증 필요
- **차단 사유**: 두 번째 영문 신분증 필요 → 정부24에서 영문 주민등록 초본 발급 필요
- **다음 단계**: 영문 초본 발급 → Anytime Mailbox 공증 미팅 → 주소 활성화

---

## 8. MVP 체크리스트

### 코드/기능 (우선순위 순)
- [x] AI Smart Suggestion v4.0 (gpt-4o + 데이터 강화) — 코드 완료, 테스트 필요
- [x] Global 상품 인터리빙 — 코드 완료, 테스트 필요
- [x] Select All/Clear 오른쪽 정렬 — 코드 완료, 테스트 필요
- [x] AnalysisAgent 타임아웃 해결 (비활성화) — 완료
- [x] BestBuy API 검토 — 현상유지 결정
- [ ] **Shein 연동** — RapidAPI 전멸 → US 주소 활성화 후 CJ Affiliate API로 연동 예정
- [ ] **커밋 & 푸시** — 2차 변경사항 커밋 후 Vercel 자동 배포
- [x] SEO 기본 (meta tags, sitemap, robots.ts, Open Graph, JSON-LD) — 완료
- [ ] 모바일 반응형 디자인 — PC 버전 우선, 이후 모바일
- [ ] 어필리에이트 링크 통합 (승인 후)

### 어필리에이트/비즈니스
- [ ] 정부24에서 영문 주민등록 초본 발급
- [ ] Anytime Mailbox USPS Form 1583 공증 완료
- [ ] US 주소 활성화
- [ ] CJ/Rakuten/Impact 국가를 US로 변경
- [ ] Walmart/Target/BestBuy 어필리에이트 직접 신청
- [ ] 승인 후 어필리에이트 링크 코드에 통합

---

## 9. 알아야 할 기술적 사항

### 인터리빙 (사이트 교차 배치)
- **Backend**: `Coordinator.ts`의 `interleaveBysite()` — 점수 정렬 후 사이트별 round-robin
- **Frontend**: `app/search/page.tsx`의 `interleaveBySite()` — 프론트엔드 재정렬 후 재적용
- **이유**: 프론트엔드에서 Best/Cheapest/Fastest 재정렬하면 백엔드 인터리빙이 파괴됨. 양쪽 모두 필요.

### AI 모듈 시스템
- 각 AI 기능은 `app/lib/ai/prompts/` 아래 독립 모듈로 관리
- `CONFIG` 객체: id, version, model, temperature, maxTokens, timeoutMs
- `buildSystemMessage()` + `buildUserMessage()` 패턴
- few-shot 예시 포함 가능
- 자동 fallback 지원 (실패 시 기본값 반환)

### 프로바이더 응답 파싱
- RapidAPI wrapper 응답 형식이 프로바이더마다 다름
- 각 Provider에 다중 fallback 파싱 로직 구현됨 (nested 구조 탐색)
- BestBuy: 7가지 응답 구조 탐색
- Target: 4단계 deep scan
- eBay: 6레벨 fallback

### 환경 변수 (.env.local) — ⚠️ 새 세션 필독

> **절대 .env.local을 임의로 수정하지 마세요!** 아래 정보가 정확한 최신 상태입니다.

**.env.local 현재 사용 중인 키 목록** (2026-02-19 기준):

```
# RapidAPI (모든 Provider 공통 키)
RAPIDAPI_KEY=862297c953msh...  (하나의 키로 모든 리테일러 접근)

# Provider별 호스트 (DOMESTIC)
RAPIDAPI_HOST_AMAZON=real-time-amazon-data.p.rapidapi.com
RAPIDAPI_HOST_WALMART=realtime-walmart-data.p.rapidapi.com
RAPIDAPI_HOST_BESTBUY=bestbuy-usa.p.rapidapi.com
RAPIDAPI_HOST_EBAY=real-time-ebay-data.p.rapidapi.com
RAPIDAPI_HOST_TARGET=target-com-shopping-api.p.rapidapi.com

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

# 어필리에이트
AMAZON_AFFILIATE_TAG=soulmaten7-20
TEMU_AFFILIATE_CODE=alb130077
EBAY_CAMPAIGN_ID=5339138476
ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET
CJ_PERSONAL_TOKEN / CJ_PROPERTY_ID
```

**사용하지 않는 키** (주석 처리됨):
- `RAPIDAPI_HOST_TEMU` — RapidAPI Temu는 거부됨 (구독자1/리뷰0). **절대 추가하지 마세요.**
- `RAPIDAPI_HOST_SHEIN` — Shein API 전멸. CJ Affiliate API로 전환 예정.
- `RAPIDAPI_HOST_COSTCO` — Deals API만 제공, 비활성화.

### API 변경 이력 (헷갈리지 않도록 기록)

| 날짜 | 변경 | 상세 |
|------|------|------|
| 2026-02 초 | **Temu: Apify 선택** | RapidAPI Temu(구독자1/리뷰0) vs Apify(검증됨/339유저/3.9점) 비교 후 **Apify 선택**. Actor: `amit123/temu-products-scraper`. 테스트 성공(40상품/7초/$0.05). **결제 중 ($5/월 무료 크레딧)**. |
| 2026-02 초 | **Target: 호스트 변경** | `target13.p.rapidapi.com` → `target-com-shopping-api.p.rapidapi.com` |
| 2026-02-18 | **Shein: API 전멸 확인** | RapidAPI의 모든 Shein API(apidojo, sheinBusiness, AsyncSolutions, Pinto) 전부 중단/삭제. CJ Affiliate API로 대체 예정. |
| 2026-02-18 | ⚠️ **다른 세션이 TemuProvider를 RapidAPI로 잘못 교체** | TemuProvider.ts 코드가 Apify→RapidAPI로 변경됨. **이는 잘못된 변경이며 Apify로 되돌려야 함.** |
| 2026-02-19 | **.env.local 복원** | APIFY_API_TOKEN 복원, RAPIDAPI_HOST_TEMU 제거. TemuProvider.ts 코드도 Apify로 복원 필요. |

### ⚠️ TemuProvider.ts 복원 필요

**현재 문제**: TemuProvider.ts 코드가 다른 세션에서 RapidAPI 방식으로 잘못 바뀜.
**해야 할 일**: Apify Actor 호출 방식으로 되돌려야 함.
**Apify 호출 방식**:
- URL: `https://api.apify.com/v2/acts/amit123~temu-products-scraper/run-sync-get-dataset-items`
- Method: POST
- Body: `{ "keyword": "검색어" }`
- Header: `Authorization: Bearer ${APIFY_API_TOKEN}`
- 타임아웃: 45초 (Actor 실행 7-15초)
- 응답: 상품 배열 직접 반환

---

## 10. 새 세션 시작 시 사용할 프롬프트

```
POTAL 프로젝트 작업을 이어서 하려고 해.
프로젝트 경로: /Users/maegbug/portal

먼저 SESSION-CONTEXT.md 파일을 읽어줘. 거기에 프로젝트의 모든 현황과 다음 할 일이 정리되어 있어.

참고:
- components/search/ResultsGrid.tsx가 실제 사용 파일이고, app/components/search/ 쪽은 안 쓰는 백업 파일이야.
- 나는 코딩 초보자지만 AI agent를 만들고 있어.

오늘 할 작업: [여기에 오늘 할 작업 적기]
```

필요에 따라 오늘 할 작업 예시:
- "미커밋 변경사항 로컬 테스트 후 커밋/푸시"
- "Shein API 새로 구독하고 SheinProvider 교체"
- "어필리에이트 링크 통합 시작"
- "모바일 반응형 디자인 작업"
- "SEO 기본 작업 (meta tags, sitemap)"

---

## 11. 주의사항

1. **git index.lock**: 가끔 `.git/index.lock` 파일이 남아있을 수 있음. `rm .git/index.lock`으로 해결.
2. **Vercel 배포**: `main` 브랜치에 푸시하면 자동 배포. 도메인: `potal.app`
3. **API 비용**: OpenAI 사용량 주의. gpt-4o는 gpt-4o-mini보다 ~20배 비싸므로 Smart Suggestion만 gpt-4o 사용, 나머지는 gpt-4o-mini.
4. **⚠️ Temu는 Apify 사용!** `APIFY_API_TOKEN`이 필수. RapidAPI Temu는 거부됨(구독자1/리뷰0). `RAPIDAPI_HOST_TEMU`를 절대 추가하지 마세요. Actor: `amit123/temu-products-scraper`.
5. **⚠️ Target 호스트 변경됨**: `target13.p.rapidapi.com`이 아니라 `target-com-shopping-api.p.rapidapi.com`입니다.
6. **⚠️ .env.local 수정 금지**: 새 세션에서 .env.local을 "정리"하거나 "최적화"하려고 건드리지 마세요. 현재 상태가 정확합니다. 수정이 필요하면 이 SESSION-CONTEXT.md의 "환경 변수" 섹션을 먼저 확인하세요.
7. **Shein API 환불 완료**: RapidAPI Shein API는 전부 죽었음. CJ Affiliate API로 대체 예정 (US 주소 필요).
