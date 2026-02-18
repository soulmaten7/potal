# POTAL — AI Shopping Comparison Agent: Session Context

> 이 파일은 새 AI 세션이 프로젝트의 현재 상태를 완벽히 이해할 수 있도록 작성된 컨텍스트 문서입니다.
> 새 세션 시작 시: "POTAL 프로젝트 작업을 이어서 하려고 해. /Users/maegbug/portal 에 있는 SESSION-CONTEXT.md 파일을 먼저 읽고 시작해줘." 라고 말하면 됩니다.
> **마지막 업데이트: 2026-02-18**

---

## 1. 프로젝트 개요

POTAL은 AI 기반 글로벌 쇼핑 비교 에이전트로, 여러 리테일러(Amazon, Walmart, BestBuy, eBay, Target, AliExpress, Temu 등)에서 상품을 동시에 검색하고 비교해주는 웹 서비스입니다.

- **프로젝트 경로**: `/Users/maegbug/portal` (Mac 로컬)
- **기술 스택**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **배포**: Vercel Pro (`potal.app`)
- **AI**: OpenAI GPT-4o / GPT-4o-mini (검색 분석, 스마트 필터, 관련성 판단)
- **인증**: Supabase Auth
- **상품 API**: RapidAPI (Amazon/Walmart/BestBuy/eBay/Target/AliExpress) + Apify (Temu)

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
│   │   │   │   ├── TemuProvider.ts     # ✅ 작동 (Apify Actor)
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

## 4. 미커밋 변경사항 (2026-02-18 기준)

아래 6개 파일이 수정되었으나 아직 커밋/푸시되지 않았음:

| 파일 | 변경 내용 |
|------|----------|
| `app/lib/ai/prompts/smart-filter.ts` | AI Smart Suggestion v4.0: gpt-4o-mini→gpt-4o, 데이터 강화(price+site), few-shot 예시(MacBook/iPhone), 온도 0.15, 토큰 1000, 타임아웃 8초 |
| `app/lib/ai/types.ts` | `SmartFilterInput`에 `products?: Array<{title, price?, site?}>` 필드 추가 |
| `app/api/ai-suggestions/route.ts` | products 데이터 수신/전달, 모듈 버전 `smart-filter@4.0.0` |
| `app/search/page.tsx` | 프론트엔드 `interleaveBySite()` 함수 추가 (Global 상품도 사이트별 교차 배치), AI suggestions에 products 데이터 전달 |
| `components/search/FilterSidebar.tsx` | Select All/Clear 오른쪽 정렬 (`flex` → `flex justify-end`) |
| `app/lib/agent/AnalysisAgent.ts` | `shouldRunProductAnalysis()` → `return false` (6초 타임아웃 해결) |

**커밋 명령어** (로컬 터미널에서):
```bash
cd ~/portal
git add app/api/ai-suggestions/route.ts app/lib/agent/AnalysisAgent.ts app/lib/ai/prompts/smart-filter.ts app/lib/ai/types.ts app/search/page.tsx components/search/FilterSidebar.tsx
git commit -m "feat: AI Smart Filter v4.0 + interleaving fix + AnalysisAgent disable

- Upgrade AI Smart Suggestion: gpt-4o-mini → gpt-4o with enriched data (price+site)
- Add frontend interleaving for Global products (round-robin by site)
- Fix Select All/Clear right alignment in FilterSidebar
- Disable AnalysisAgent (saves ~6s timeout per search), ProductJudge handles filtering"
git push origin main
```

**로컬 테스트 후 확인할 포인트**:
- "macbook air" 검색 → AI Smart Suggestion에 Chip/RAM/Storage 축이 나오는지
- Global 탭 → 상품이 사이트별로 섞여 나오는지 (AliExpress, Temu 교차)
- RETAILERS 섹션 → Select All/Clear가 오른쪽 정렬인지
- 검색 속도가 이전보다 ~6초 빨라졌는지 (AnalysisAgent 비활성화 효과)

---

## 5. Shein API 교체 작업 (다음 할 일)

기존 Shein API(RapidAPI)가 서버 다운되어 환불 처리됨. 새 API 후보:

| API 이름 | 호스트 | 무료 | 특징 |
|---------|--------|------|------|
| **Unofficial SHEIN** (apidojo) | `unofficial-shein` | 무료 티어 있음 | 가장 많이 사용됨, 문서 충실 |
| **Otapi Shein** | `otapi-shein` | 500건/월 무료 | 이미지 검색 지원 |
| **Shein Scraper API** | `asyncsolutions` | 확인 필요 | 실시간 추출 |

**교체 작업 순서**:
1. RapidAPI에서 새 API 구독
2. `.env.local`에 `RAPIDAPI_HOST_SHEIN` 업데이트
3. `app/lib/search/providers/SheinProvider.ts` 수정 (엔드포인트 + 응답 파싱)
4. `app/lib/agent/Coordinator.ts`에서 SheinProvider import/호출 주석 해제
5. 테스트 후 커밋/푸시

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
| Temu | Apify `amit123~temu-products-scraper` | ✅ 정상 | 자체 30초 타임아웃, ~$1.18/1K상품 |

### 비활성화 (2개)
| 리테일러 | 이유 | 해결책 |
|---------|------|--------|
| Shein | RapidAPI 서버 다운 → 환불 완료 | 새 API 구독 필요 (위 섹션 참고) |
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
- [ ] **Shein API 교체** — 새 API 구독 + SheinProvider 수정 + 활성화
- [ ] **로컬 테스트 (npm run dev)** — 위 변경사항 확인
- [ ] **커밋 & 푸시** — Vercel 자동 배포
- [ ] 모바일 반응형 디자인 — PC 버전 우선, 이후 모바일
- [ ] SEO 기본 (meta tags, sitemap, robots.txt, Open Graph)
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

### 환경 변수
- 모든 API 키는 `.env.local`에 저장 (절대 커밋하지 않음)
- `.env.example`에 템플릿 제공
- RapidAPI 호스트는 환경 변수로 관리 (Provider 교체 용이)

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
4. **Temu Apify**: 월 $5 무료 크레딧, 1000개 상품당 ~$1.18. 트래픽 늘면 비용 관리 필요.
5. **Shein API 환불**: RapidAPI에서 환불 처리 완료. 새 API 구독 전 테스트 필수.
