# POTAL Session Context
> 마지막 업데이트: 2026-03-06 (세션 25 완료 — Cost Engine 대규모 업그레이드: 181개국, 97 HS챕터, 63 FTA, 7개 정부 관세 API, India/Brazil 세금 계산, Section 301 업데이트)

---

## ⏰ 세션 업데이트 지침 (모든 Claude 세션 필독)

**이 파일은 POTAL 프로젝트의 핵심 맥락 파일입니다.**

- **30분마다** Claude가 "session-context.md 업데이트할까요?" 제안
- 섹션 구조 그대로 유지, 새 내용은 해당 섹션에 추가
- **⚠️ session-context.md에 없는 숫자/진행률을 임의로 만들지 말 것** (예: "70% 완료" 같은 근거 없는 수치 금지)
- **⚠️ 완료(✅)와 대기 중(⏳)을 명확히 구분할 것**

### 🔥 실행 지침 (세션 15~)
- **한 번에 하나의 작업만 실행**. 멀티태스킹 금지.
- 각 작업에 **최대한 많은 생각과 정확성**을 기해서 디테일하게 실행.
- 은태님이 빠르게 확인/답변 → Claude가 다음 작업 즉시 실행. 이 루프가 가장 빠름.
- 24시간 내 Phase 2 → 4 → 5 완료 목표. Phase 3(Shopify)은 모든 기능 완비 후 마지막에 제출.

---

## 0. POTAL 개요

### ⚠️ 중대 전략 변경 (2026-03-03)

**POTAL은 B2C 가격비교 서비스에서 B2B Total Landed Cost 인프라 플랫폼으로 피벗했습니다.**

- 상세 전략 문서: `POTAL-B2B-Strategy-Roadmap.docx`
- **현재 집중: B2B Phase 2** (Phase 0~1 완료, LLM 커스텀 앱 등록 단계)

### 서비스 정의 (B2B)

**POTAL은 크로스보더 커머스의 Total Landed Cost 계산 인프라.** 이커머스 셀러에게 위젯을, AI 쇼핑 에이전트에게 API를 제공하여 "진짜 최종 비용"을 계산해주는 서비스.

**One-line Pitch**: "POTAL is to cross-border commerce what Stripe is to payments — invisible infrastructure that powers every international transaction."

**비전 2 Layers** (세션 11 수정 — Layer 3 삭제):
- Layer 1: 셀러 위젯 (B2B SaaS) — Shopify/WooCommerce 셀러가 상품 페이지에 설치. 월 $29~99 구독
- Layer 2: AI 에이전트 API — 각 LLM 플랫폼 자체 앱(Custom GPT 등)으로 진입 + API 호출 과금
- ~~Layer 3: B2C 비교 플랫폼~~ → **삭제** (ACP 등 AI 커머스 프로토콜이 B2C 역할을 대체. POTAL은 인프라에 집중, 소비자 접점은 AI 플랫폼에 위임)

### 핵심 전략 결정 (세션 11 수정)

1. **B2B-only, 인프라 전문**: POTAL = 크로스보더 관세 계산 인프라. B2C 비교 플랫폼은 만들지 않음
2. **B2C UI = 데모/쇼룸** (폐기 아님)
3. **월 정액 SaaS**: $29~99/month (Zonos와 차별화)
4. **API-first 아키텍처**: 하나의 API가 모든 채널 서빙
5. **각 LLM 자체 앱으로 진입**: Custom GPT, Gemini Extension, Copilot Plugin 등 각 플랫폼 앱스토어에 등록 → 사용 데이터 축적 → 셀러 영업 근거로 활용
6. **HS Code 자체 구축**: 공개 데이터(WCO/ITC/TARIC) + GPT-4o-mini
7. **Shopify App Store = 주력 셀러 채널**: 앱스토어가 마케팅 대행
8. **LLM 앱 데이터 = 셀러 영업 무기**: AI 플랫폼 사용량 데이터를 셀러에게 보여주며 위젯 설치 유도

### WHY — 피벗 이유

**B2C 구조적 한계**: 쇼핑몰 API 의존(정확도 문제), 어필리에이트 수수료(통제권 없음), AI API 비용($0.01~0.05/검색), 트래픽 의존

**B2B가 모든 약점을 뒤집음**: 셀러가 가격 직접 제공(정확도 해결), SaaS 구독(예측 가능 수익), 위젯=DB조회+사칙연산(AI 불필요, 비용 1/100), Shopify 앱스토어+AI플랫폼이 배포 채널

**촉발 계기**: Citrini "2028 GIC" 보고서, ChatGPT Instant Checkout(9억 주간 유저), US De Minimis $800 폐지(Aug 2025), EU €150 면세 폐지(Jul 2026)

### Founder & 환경
- **장은태 (Euntae Jang)** — Founder & CEO, 코딩 경험 없음 → Claude AI + 바이브코딩으로 1달 만에 구축
- 이메일: soulmaten7@gmail.com / contact@potal.app
- 프로젝트 경로 (Mac): `~/portal/`
- DB: Supabase / 배포: Vercel (https://potal.app)
- Git push: HTTPS 인증 실패 → Mac 터미널에서 직접 push
- **⚠️ 빌드 규칙**: `npm run build` 확인 후 push 필수

### 비즈니스 모델

**Layer 1: 셀러 위젯 SaaS** — Free $0/500 calls, Starter $9/5K, Growth $29/25K, Enterprise custom
**Layer 2: AI 에이전트 API** — 각 LLM 커스텀 앱 + 직접 API 호출 과금

### Data Flywheel (세션 11 수정)
LLM 커스텀 앱 등록 → 사용 데이터 축적 → 데이터 기반 셀러 영업 → 셀러 위젯 설치 → 상품 가격+HS Code 제공 → POTAL 데이터 축적 → AI API 정확도 향상 → 더 많은 사용자 → **데이터 해자(moat)**

### Roadmap (2026-03-03 확정)

```
Phase 0: B2C 코드 백업 + CostEngine 모듈화 + Supabase B2B 스키마 ← ✅ 완료 (하루 이내)
Phase 1: 핵심 API + 셀러 인증 + i18n + 프로덕션 배포 ← ✅ 완료 (하루 이내)
Phase 2: 각 LLM 커스텀 앱 등록 ← ✅ 핵심 3개 완료 (GPT + Claude MCP + Gemini Gem)
  - 나머지 3개: Copilot(비즈니스계정필요), Meta AI(지역제한), Grok(스토어없음) → 파일 준비 후 대기
Phase 4: Stripe 결제 + 셀러 대시보드 ← ✅ 완료 (Billing UI, 대시보드, Stripe Test mode 연동)
Phase 5: HS Code 고도화 + 세율 + FTA ← ✅ 완료 (443+ HS코드, 97 HS챕터×29개국 관세율, 63개 FTA, 181개국)
Phase 5.5: AI 분류 + DB 캐싱 ← ✅ 완료 (GPT-4o-mini AI 분류, DB 캐시 플라이휠 E2E 검증)
Phase 6: 외부 관세 API + 환율 + 요금제 ← ✅ 완료
  - 6-1: USITC API (미국, 무료) ✅
  - 6-2: UK Trade Tariff API (영국, 무료) ✅
  - 6-3: EU TARIC API (유럽, 무료) ✅
  - 6-3b: Canada CBSA Provider (캐나다) ✅
  - 6-3c: Australia ABF Provider (호주) ✅
  - 6-3d: Japan Customs Provider (일본) ✅
  - 6-3e: Korea KCS Provider (한국) ✅
  - 6-4: AI 프롬프트 10자리 변경 ✅
  - 6-5: 실시간 환율 API ✅
  - 6-6: 요금제 변경 (Free 500 / Starter $9 / Growth $29 / Enterprise) ✅
Phase 3: Shopify App ← ✅ 앱스토어 리스팅 작성 완료, 심사 제출 대기 (임베디드 확인 대기)
  - OAuth 인증 플로우 ✅
  - GDPR 필수 웹훅 ✅
  - Theme App Extension 3개 블록 ✅ (상품위젯, 장바구니배너, 앱임베드)
  - shopify_stores 테이블 마이그레이션 ✅ (Supabase 실행 완료)
  - Shopify Partner Dashboard 앱 등록 ✅ (Client ID: 2fa34ed65342ffb7fac08dd916f470b8)
  - Vercel 환경변수 설정 ✅ (SHOPIFY_API_KEY, SHOPIFY_API_SECRET)
  - v1.0.0 릴리스 완료 ✅
  - 개발 스토어 생성 (potal-test-store.myshopify.com) ✅
  - 앱 설치 테스트 ✅ (OAuth callback managed install flow 대응, 토큰 DB 저장 확인)
  - Theme Extension 배포 ✅ (potal-3 버전 릴리스, presets 제거 + locales 추가)
  - Shopify CLI 설치 + config link ✅
  - App Store 등록 $19 결제 ✅ (공개 배포 등록 완료)
  - 앱 리스팅 작성 ✅ (앱 설명, 스크린샷 3장, Feature media, 카테고리, Free 플랜, Support/Privacy)
  - 예비 단계 8/9 완료 ✅ (임베디드 앱 확인만 대기 — 2시간 내 자동 확인)
  - ⏳ 남은 작업: 임베디드 앱 확인 통과 → "검토를 위해 제출" 클릭 (심사 7~14일)
세션 23: layout.tsx B2C Context 정리 + Footer/sw.js/MobileBottomNav 확인 → B2C→B2B 전환 최종 완료
세션 22: B2C→B2B 전환 마무리 + 코드 정리 + SEO/법적 문서 전환
  - 가격 불일치 수정 ✅ (랜딩페이지/pricing/sellers-me/sellers-usage 4파일 동기화)
  - 코드 정리 ✅ (console.log 6개 제거, unused imports 제거, let→const, unused catch vars)
  - B2C→B2B 페이지 전환 12개+ ✅ (about/terms/help/opengraph/blog/partners/contact/auth/join)
  - B2C 페이지 redirect ✅ (search/search-info/wishlist/tax-info → 홈으로 리다이렉트)
  - Privacy Policy 페이지 확인 ✅ (https://www.potal.app/privacy 정상)
  - 위젯/API 프로덕션 검증 ✅ (widget.js HTTP 200 + CORS, calculate API 401 정상, countries API 정상)
  - SEO B2B 전환 ✅ (sitemap.ts: /search 제거→developers/pricing/blog 추가, robots.ts: B2B disallow)
  - layout.tsx JSON-LD ✅ (B2C SearchAction 제거)
  - manifest.json ✅ ("AI Shopping Comparison" → "Total Landed Cost API", shortcuts B2B 전환)
  - legal/[slug] ✅ (terms/privacy/cookie/privacy-settings 전체 B2B 재작성, potal.com→potal.app)
```

**⚠️ Phase 3을 마지막으로 변경한 이유**: Shopify App Store = 셀러가 들어오는 문. 셀러가 왔을 때 결제(Phase 4), 정확한 관세 계산(Phase 5), LLM 사용 데이터(Phase 2)가 모두 준비되어 있어야 이탈 없음. 심사 7~14일 소요되므로 모든 기능 완비 후 제출.

### 경쟁 환경
- **Zonos** ($15M revenue, $69M raised) — 주문당 $2 + 관세 10%. Enterprise 이동 중 = SMB 공백
- **Easyship** — 배송 중심, 위젯 약함 / **Dutify** — Shopify 전용, 소규모
- **Enterprise**: Global-e (Nasdaq), Avalara — 대형 브랜드 전용
- **POTAL 포지셔닝**: 월 정액 + SMB 크로스보더 셀러 + AI 에이전트 인프라 = 빈 의자

### AI 쇼핑 에이전트 6파전 (Phase 2 실행 계획)

| # | 플랫폼 | 프로토콜 | POTAL 진입 방법 | Phase 2 상태 |
|---|--------|---------|----------------|-------------|
| 2-01 | ChatGPT (OpenAI) | ACP / GPT Actions | Custom GPT — GPT Store 등록, 9개 언어 conversation starters | ✅ 완료 |
| 2-02 | Claude (Anthropic) | MCP | MCP 서버 구축, TypeScript, 2개 Tool, Claude Desktop 연결 확인 | ✅ 완료 |
| 2-03 | Gemini (Google) | Gems | Gem 생성, 지침 + 40개국 CSV 데이터 업로드 | ✅ 완료 |
| 2-04 | Copilot (Microsoft) | Plugin | ⏸ Microsoft 365 Business 계정 필요 (Personal 불가) | ⏸ 대기 |
| 2-05 | Meta AI | AI Studio | ⏸ 지역 제한 (VPN+거주지 변경 실패). **매 세션 재확인** | ⏸ 대기 |
| 2-06 | Grok (xAI) | — | ❌ 커스텀 앱 스토어 없음. API만 존재 | ⏸ 대기 |

---

## 1. 🧠 은태님 가치관 & 대화 스타일

### 의사결정 패턴
- **"프랑크푸르트 선언"**: 데이터 부족하면 전면 재조사, 근본적으로 다시 하는 걸 선호
- **정확성 최우선**: 추정치보다 실제 데이터, 출처 명시 요구
- **근본 문제 우선**: "어필리에이트고 나발이고 일단 api가 있어야" — 핵심 인프라 먼저
- **사실 기반**: 아직 없는 숫자나 과장 표현 싫어함
- **빠른 실행 선호**: 느린 방법보다 빠른 방법 선택
- **수익화 관점**: 단순 도구가 아닌 수익 자산으로의 발전 가능성 항상 고려
- **자동화 = 시간 확보**: 1인 창업자로서 자동화의 가치는 제품 개발에 집중할 시간 확보

### 작업 지시 스타일
- **"답변만 해줘"**: 실행 전에 의견/확인만 먼저 요청. 바로 실행 금지
- **"진행하지말고"**: 추가 질문 있을 때. 작업 시작 금지
- **순서 합의 후 진행**: 큰 작업 전에 이해도 확인 후 진행
- **한국어 선호**: 대화는 한국어, 외부 발송물은 영문+한글 번역 함께

### 중요하게 생각하는 것
- 데이터 근거 (% 숫자 + 출처 필수)
- 중복 제거, 실용성
- 비용 대비 가치
- 같은 실수 반복 ❌

---

## 2. ✅ 해야 할 행동 (TODO)

### ✅ B2B Phase 0 (완료 — 2026-03-04 세션 11)

| # | 항목 | 상태 |
|---|------|------|
| 1 | B2C 코드를 `potal-b2c-snapshot`으로 백업 | ✅ git branch 생성 완료 (⚠️ Mac에서 `git push origin potal-b2c-snapshot` 필요) |
| 2 | CostEngine.ts를 독립 모듈로 분리 | ✅ `app/lib/cost-engine/` 새 모듈 생성, B2C 호환 래퍼 유지 |
| 3 | Supabase B2B 테이블 스키마 설계 | ✅ `supabase/migrations/003_b2b_schema.sql` 생성 (⚠️ Supabase SQL Editor에서 실행 필요) |

### ✅ B2B Phase 1 (완료 — 핵심 API + 셀러 인증 + UI)

| # | 항목 | 상태 |
|---|------|------|
| 1-01~05 | API 키 시스템 (생성/검증/미들웨어/rate-limiter/plan-checker) | ✅ 완료 |
| 1-06 | `/api/v1/calculate` 단건 TLC 계산 (글로벌 58개국) | ✅ 완료 |
| 1-07 | `/api/v1/calculate/batch` 배치 계산 (최대 100건) | ✅ 완료 |
| 1-08 | `/api/v1/sellers/keys` API 키 관리 (CRUD) | ✅ 완료 |
| 1-09 | OpenAPI 3.0 스펙 (`/api/v1/docs`) | ✅ 완료 |
| 1-10 | 표준 응답 헬퍼 (apiSuccess/apiError) | ✅ 완료 |
| 1-11 | 글로벌 관세 데이터 모듈 (58개국 VAT/GST/Duty) | ✅ 완료 |
| 1-12 | GlobalCostEngine (다국가 TLC 계산) | ✅ 완료 |
| 1-13 | `/api/v1/countries` 지원국가 목록 API | ✅ 완료 |
| 1-14 | `/api/v1/sellers/usage` 사용량 조회 API | ✅ 완료 |
| 1-15 | 테스트 파일 작성 | ✅ 완료 |
| 1-16 | 세션 기반 키 생성/폐기 API (`/api/v1/sellers/keys/create`, `/revoke`) | ✅ 완료 |
| 1-17 | 셀러 인증 시스템 — Supabase Auth (이메일+비밀번호, Google OAuth) | ✅ 완료 |
| 1-18 | 로그인/회원가입 분리 페이지 (`/auth/login`, `/auth/signup`) | ✅ 완료 |
| 1-19 | 비밀번호 강도 검증 (8자+, 영문+숫자, 확인 필드, 실시간 UI) | ✅ 완료 |
| 1-20 | Google OAuth 연동 (Continue with Google 버튼) | ✅ 완료 |
| 1-21 | Header에 Sign In/Sign Up 버튼 + 로그인 시 아바타/드롭다운 | ✅ 완료 |
| 1-22 | i18n 다국어 시스템 — 6개 언어 (EN, KO, JA, ZH, ES, DE), 125개 키 | ✅ 완료 |
| 1-23 | Footer, MobileBottomNav 다국어 적용 | ✅ 완료 |
| 1-24 | TLC 위젯 임베드 시스템 | ✅ 완료 |
| 1-25 | Developer 문서 페이지 | ✅ 완료 |
| 1-26 | 프로덕션 배포 (Vercel — potal-x1vl.vercel.app) | ✅ 완료 |
| 1-27 | Google OAuth redirect URL 설정 (Supabase URL Configuration) | ✅ 완료 — Site URL + Redirect URLs 프로덕션 URL로 변경 |

### 🟡 B2B Phase 2 (진행 중 — LLM 커스텀 앱 등록)

> **목표**: 쇼핑 시장의 모든 주요 LLM 플랫폼에 POTAL TLC 커스텀 앱을 등록하여 사용 데이터 축적 시작

| # | 플랫폼 | 앱 형태 | 상태 |
|---|--------|---------|------|
| 2-01 | **OpenAI (ChatGPT)** | Custom GPT — GPT Store 등록 완료. 9개 언어 conversation starters | ✅ 완료 |
| 2-02 | **Anthropic (Claude)** | MCP 서버 구축 완료 — `mcp-server/`, TypeScript, 2개 Tool, API 호출 테스트 통과, Claude Desktop 연결 확인 | ✅ 완료 |
| 2-03 | **Google (Gemini)** | Gem 생성 완료 — 지침 + country-duty-reference.csv 업로드 | ✅ 완료 |
| 2-04 | **Microsoft (Copilot)** | ⏸ 파일 준비됨. Microsoft 365 Business 계정 필요 (Personal로는 불가). Developer Program 무료 가입 옵션 있음 | ⏸ 대기 |
| 2-05 | **Meta AI** | ⏸ `meta-ai/` 파일 준비됨. AI Studio 지역 제한으로 접속 불가 (VPN+거주지 변경도 실패). **⚠️ 매 세션마다 재확인 필요 — 지역 제한 풀리면 즉시 등록** | ⏸ 대기 |
| 2-06 | **xAI (Grok)** | ❌ 커스텀 앱 스토어 자체 없음. API만 존재. 스토어 출시 시 즉시 진입 | ⏸ 대기 |

**Phase 2 전략**: 각 LLM 플랫폼의 쇼핑 에이전트 시장을 장악. 사용자가 "이 상품 일본에 보내면 관세 얼마야?" 같은 질문을 하면 POTAL API를 호출하여 즉시 답변. 사용 데이터 축적 → 셀러 영업 근거로 활용.

### 🔴 즉시 — RapidAPI 구독 전체 취소

| # | 항목 | 상세 |
|---|------|------|
| 1 | RapidAPI 유료 구독 전부 취소 | Amazon(PRO $25/mo), Walmart, eBay, AliExpress 등 모든 유료 플랜 해지. B2B 전환으로 당장 불필요. 나중에 B2C 데모/쇼룸 필요 시 그때 재구독 |
| 2 | RapidAPI 환불 (#130604) | 신원 확인 후 환불 진행 중 |

### 🟠 필수 — ITIN 발급 (Stripe Live mode 활성화 필수)

| # | 항목 | 상세 |
|---|------|------|
| 1 | **IRS ITIN 신청** | SSN 없는 외국인용 미국 세금번호. Stripe Live mode 결제 수금에 필수 |
| 2 | 준비물 | Form W-7 + Form 1040-NR (세금 신고서) + 여권 사본 (공증 필요) |
| 3 | 여권 공증 | 주한 미국대사관 또는 IRS Acceptance Agent (한국 내 공인기관)에서 공증 |
| 4 | 제출처 | IRS (우편): Austin, TX 73301-0215 |
| 5 | 소요기간 | 7~11주 |
| 6 | 비용 | 무료 (IRS 수수료 없음. 공증비만 발생) |
| 7 | 신청 자격 | 미국 비거주자로서 미국 소득 발생 시 가능 (Stripe SaaS 판매 = 미국 소득) |
| 8 | 현재 상태 | ⏳ 미착수. Stripe 가입 완료 (SSN 임시값 입력). Test mode로 개발 진행 중. ITIN 확보 후 Live mode 전환 예정 |
| 9 | 대안 검토 | ITIN 발급 어려울 경우 **Paddle** (MoR 모델, ITIN 불필요) 또는 **Lemon Squeezy**로 전환 검토. 제주도 거주라 서울 방문 없이 ITIN 대행 세무사 알아보기 (50~100만원) |

### 🟡 다음 세션 — Shopify 심사 + 사이트 품질 개선

| # | 항목 | 상세 |
|---|------|------|
| 1 | Shopify 임베디드 확인 + 심사 제출 | Partner Dashboard에서 확인 → "검토를 위해 제출" 클릭 |
| 2 | ~~.cursorrules B2B 전환~~ | ✅ 세션 22에서 완료 |
| 3 | ~~Footer 컴포넌트 B2B 전환 점검~~ | ✅ 세션 23에서 확인 완료 — 이미 B2B |
| 4 | ~~sw.js (Service Worker) 점검~~ | ✅ 세션 23에서 확인 완료 — B2C 잔여 없음 |
| 5 | B2C 백엔드 코드 정리 (낮은 우선순위) | lib/search/, lib/agent/, components/search/ — 빌드에 영향 없으나 불필요한 코드 |
| 6 | ~~WishlistContext/UserPreferenceContext 정리~~ | ✅ 세션 23에서 layout.tsx에서 Provider 제거 완료 |
| 7 | ~~data.ts B2C 데이터 정리~~ | ✅ 세션 23 확인 — page.b2c-backup.tsx에서만 사용. B2C 보존 원칙에 따라 유지 |

### 🟢 장기

| # | 항목 |
|---|------|
| 1 | Product Hunt 런치 |
| 2 | 투자자 피치 원페이저 PDF (숫자 생긴 후) |
| 3 | 글로벌 확장 (US 시장 장악 후) |

---

## 3. 🚫 하지 말아야 할 행동 (DON'T)

| 규칙 | 사유 |
|------|------|
| session-context.md에 없는 숫자/진행률 만들기 ❌ | "70% 완료" 같은 근거 없는 수치 금지 |
| 완료(✅)와 대기(⏳) 혼동 ❌ | 대기 항목에 ✅ 사용 금지 |
| B2C 작업을 지금 진행 ❌ | B2B Phase 0에 집중. B2C는 보존만 |
| 소비자 기능 확장 ❌ | B2B에 집중 |
| 반응 검증 전 광고 집행 ❌ | 무료 채널 먼저 |
| 과장 표현 ❌ | 근거 없는 숫자 사용 금지 |
| 로컬 빌드 확인 없이 push ❌ | `npm run build` 필수 |
| 앱 비밀번호 파일에 하드코딩 ❌ | 사용 후 삭제 |

---

## 4. 🔄 진행 중인 내용 (IN PROGRESS)

### 현재 스프린트 — B2C→B2B 전환 거의 완료, Shopify 심사 제출 대기
- Phase 0~1 완료 (세션 11~14)
- Phase 2 핵심 3개 완료 (GPT + Claude MCP + Gemini Gem)
- Phase 4 Stripe Billing ✅ 완료 (세션 15~16)
- Phase 5 HS Code/관세/FTA ✅ 완료 (세션 16)
- Phase 5.5 AI 분류 + DB 캐싱 ✅ 완료 (세션 17)
- Phase 6 외부 관세 API + 환율 + 요금제 ✅ 완료 (세션 18)
- Phase 3 Shopify 앱 전체 ✅ 완료 (세션 18~21)
  - Partner Dashboard 앱 등록, API Key/Secret → Vercel, Supabase migration 실행
  - 개발 스토어 (potal-test-store.myshopify.com) 생성 + 앱 설치 테스트 성공 ✅
  - Shopify managed install flow 대응 완료 (host→shop 추출, Buffer/atob 이중 폴백)
  - Supabase shopify_stores에 토큰 저장 확인 ✅
- **E2E 검증 (세션 20)**: 외부 관세 API + 환율 API + 코드 품질 리뷰 + 빌드 검증 완료 ✅
  - USITC API 버그 수정: URL `/api/search?query=` → `/reststop/search?keyword=` (critical fix)
  - UK Trade Tariff API 정상 확인: MFN 16.00% 파싱 성공 (measure_type 103)
  - EU TARIC API 정상 확인: CET 16.90% 파싱 성공 (XI endpoint)
  - ExchangeRate-API 정상: 166 currencies, KRW=1464.35
  - Fawaz CDN 정상: 342 currencies, KRW=1479.91
  - 전체 코드 리뷰 완료 (tariff-api-client, duty-rates-db, tariff-cache, ai-classifier, GlobalCostEngine)
  - `npm run build` 통과 확인 ✅
- **Shopify App Store 제출 (세션 21)**:
  - USITC 버그 수정 + Theme Extension 수정 → Git push 2회 (981a692, 794461f)
  - Shopify CLI 설치 (sudo npm install -g @shopify/cli) + config link (POTAL 연결)
  - Theme Extension 배포: potal-3 버전 릴리스 (presets 제거, locales/en.default.json 추가)
  - App Store 등록 $19 결제 완료 (Mastercard 8359, 개인, 제주 주소)
  - 앱 리스팅 전체 작성: App name(POTAL), Category(Shipping rates/Customer-based), Introduction, Details, Features 3개, Free 플랜, Support(contact@potal.app), Privacy policy, Subtitle, Search terms 5개, SEO tags, Screenshots 3장 + Feature media 1장 업로드
  - 예비 단계 8/9 ✅ 완료 (임베디드 앱 확인만 자동 대기 중 — 최대 2시간)
  - Privacy Policy 페이지 ✅ 확인 완료 (https://www.potal.app/privacy 정상 동작)
- **세션 22 완료 (Round 1)**: 가격 불일치 수정 (4파일), 코드 정리 (8파일), B2C→B2B 페이지 전환 (12+파일), 위젯/API 프로덕션 검증
- **세션 22 완료 (Round 2)**: SEO B2B 전환 (sitemap/robots), manifest.json B2B 전환, legal/[slug] B2B 재작성, tax-info redirect, layout.tsx JSON-LD 정리
- **세션 23**: layout.tsx에서 WishlistProvider/UserPreferenceProvider 제거, Footer/sw.js/MobileBottomNav B2B 확인 완료
- **B2C→B2B 전환 상태**: 사용자 노출 페이지 + layout 전체 완료. 잔여: B2C 백엔드 코드만 (lib/search/, lib/agent/, components/search/ — 보존)
- **세션 24**: Swagger UI 인터랙티브 API 문서 + Product Hunt 런치 플랜 + HS Code DB 확장 + URL 수정
  - `/developers/docs` 전면 재구축: 6개 엔드포인트 인터랙티브 문서 (Try it, cURL/JS/Python 예제)
  - Product Hunt 런치 플랜 문서 생성 (`PRODUCT_HUNT_LAUNCH_PLAN.md`)
  - HS Code DB 확장: 409 → 443개 (+34개, 이커머스 핵심 카테고리)
  - OpenAPI URL 수정: potal.io → potal.app, widget URL vercel → potal.app
  - npm run build 통과 ✅
- **세션 25**: Cost Engine 대규모 업그레이드 (경쟁사 수준으로 끌어올리기)
  - 4개 신규 관세 API Provider 추가 (Canada CBSA, Australia ABF, Japan Customs, Korea KCS) → 총 7개 정부 API
  - country-data.ts: 137 → 181개국 확장 (Oceania, Americas, Africa, Europe, Middle East, Asia 전역)
  - duty-rates.ts: 56 → 97 HS 챕터 (전체 HS 챕터 커버, 29개국×97챕터 = 2,813개 관세율 데이터)
  - fta.ts: 27 → 63 FTA 협정 (글로벌 주요 무역 협정 포괄)
  - India 세금 계산 추가: BCD + SWS(10%) + IGST(5-28%) 캐스케이딩 (Brazil 패턴 따라 구현)
  - Section 301 tariffs 2025/2026 업데이트 (List 1-4A + 2024 USTR 확장: EVs, 배터리, 태양전지, 의료기기)
  - 8개국 processing fees 추가 (US MPF, AU IPC, NZ Biosecurity, CA CBSA, JP/KR customs, IN landing charges, CH statistical fee)
  - Batch calculation Promise.allSettled 병렬화
  - 전체 frontend/docs/i18n country count 139→181 업데이트 (50+파일)
  - npm run build ⏳ (검증 예정)
- **다음**: Shopify 임베디드 확인 → "검토를 위해 제출" 클릭 → 심사 7~14일
- **블로커**: Stripe Live mode에 ITIN 필요 (개발은 Test mode로 진행 가능)

### 경쟁사 가격/기능 분석 완료 (세션 17)
- ✅ `POTAL-Target-Analysis.xlsx` 생성 — 4시트 (타겟 세그먼트, 매출 시뮬레이션, 경쟁사 절감, 핵심 인사이트)
- POTAL API 단가: $0.00098~0.0098/건 (경쟁사 대비 30~75x 저렴)
- 기능 수준: Zonos 대비 ~40-45% (API 경쟁력 있음, 데이터 커버리지 격차)
- 핵심 격차: 6자리 vs 10자리 HS Code, 실시간 환율 없음, Shopify 앱 없음, 체크아웃 없음
- 요금제 변경안: Free 500건 / Starter $9 (5K) / Growth $29 (25K) / Enterprise custom

### 외부 관세 API 연동 계획 (무료 정부 API)
- **USITC** (미국): JSON 다운로드 + REST API, 10자리 HS Code + 정확한 관세율
- **UK Trade Tariff** (영국): 무료, 인증 불요, JSON REST API
- **EU TARIC** (유럽): 무료 데이터, REST API 옵션
- DB 캐싱 플라이휠 적용 → 같은 HS+국가 재요청 시 API 호출 없이 DB 리턴

### 경쟁사 기술 분석 완료 (세션 14)
- ✅ `POTAL_vs_Competitors_Analysis.md` 생성 — Zonos/Avalara/Global-e/Easyship/Dutify 상세 비교
- POTAL 강점: 가격(10배 저렴), AI 에이전트 시장 선점(경쟁사 전무)
- POTAL 약점: HS Code 분류(1/1000 커버리지), 관세율 정밀도(±7% vs ±1%), 반덤핑관세 누락
- 전략 결론: 65% 정확도로도 LLM 시장 선점이 우선. 정확도는 Phase 5에서 개선

---

## 5. ✅ 완료된 내용 (DONE)

### B2B 전환
- ✅ B2B 피벗 전략 대화 + 결정 (세션 10+, 2026-03-03)
- ✅ `POTAL-B2B-Strategy-Roadmap.docx` 생성 (11섹션)
- ✅ Phase 0 완료 (세션 11, 2026-03-04):
  - `potal-b2c-snapshot` 브랜치 생성
  - `app/lib/cost-engine/` 독립 모듈 생성 (CostEngine.ts + types.ts + adapters.ts + index.ts)
  - `supabase/migrations/003_b2b_schema.sql` 생성 (5 테이블 + 1 뷰)
- ✅ Phase 1 완료 (세션 12~14, 2026-03-04):
  - API 키 시스템 + 5개 엔드포인트 + 글로벌 엔진 58개국
  - 셀러 인증 (Supabase Auth — 이메일/비밀번호 + Google OAuth)
  - 로그인/회원가입 분리 페이지 + 비밀번호 강도 검증
  - i18n 다국어 시스템 (6개 언어 × 125키)
  - TLC 위젯 + Developer 문서 + 프로덕션 배포
  - Google OAuth redirect URL 프로덕션 설정 (Supabase URL Configuration)
- ✅ 경쟁사 기술 분석 (세션 14, 2026-03-04):
  - POTAL 코드베이스 전수 분석 (5,500줄 코어 코드)
  - Zonos/Avalara/Global-e/Easyship/Dutify 6개 경쟁사 상세 비교
  - `POTAL_vs_Competitors_Analysis.md` 생성
  - 기술 분석 문서 4종 생성 (TECHNICAL_SUMMARY, TECHNICAL_INVENTORY, PRODUCTION_READINESS, QUICK_REFERENCE)
- ✅ Phase 4 Stripe Billing 통합 (세션 15~16, 2026-03-04~05):
  - Stripe 계정 가입 (Wise USD 계정 연결, 2FA 설정)
  - Stripe Test mode API 키 + Webhook 설정
  - Product 생성: POTAL Growth $49/month (price_1T7HrA3ooeFvbQgmh2LPSw1I)
  - Billing 백엔드: checkout/webhook/portal API 라우트, stripe singleton, subscription lifecycle
  - Dashboard Billing 탭 UI: 3개 플랜 카드, 업그레이드/관리 버튼, FAQ
  - Vercel 빌드 에러 3건 수정: mcp-server tsconfig exclude, useSearchParams Suspense boundary (서버/클라이언트 컴포넌트 분리), sellers API 컬럼명 수정
  - Supabase sellers 레코드 생성 (soulmaten7@gmail.com / starter / active)
  - 대시보드 더블 헤더 수정 (Header/Footer에 /dashboard 경로 체크 추가)
  - Supabase migration 004_stripe_billing.sql 실행 (current_period_end, updated_at 컬럼 추가)

- ✅ 세션 24 API 문서 + PH 런치 + HS Code 확장 (2026-03-06):
  - `/developers/docs` Swagger UI 스타일 재구축 (6개 엔드포인트, 인터랙티브 Try it, cURL/JS/Python 코드 예제)
  - `PRODUCT_HUNT_LAUNCH_PLAN.md` 생성 (Tagline/Description/First Comment/체크리스트/타이밍/성공지표)
  - HS Code DB 확장: 409 → 443개 (+34개 이커머스 핵심: 노트북, 태블릿, 드론, 스마트홈, 폰케이스, 펫, 베이비, 보충제, 커피머신, 공기청정기, 전동공구, 스킨케어, 메이크업, 웨어러블)
  - OpenAPI URL 수정 (potal.io → potal.app), widget URL 수정 (vercel → potal.app)
  - npm run build 통과 ✅

- ✅ 세션 23 B2C 잔여 코드 정리 + layout 최종 완료 (2026-03-06):
  - layout.tsx에서 WishlistProvider, UserPreferenceProvider 제거 (B2C Context 의존성 완전 제거)
  - Footer.tsx B2B 확인 완료 (수정 불필요 — 이미 B2B)
  - sw.js B2C 캐시 경로 확인 완료 (수정 불필요 — 깨끗함)
  - MobileBottomNav B2B 확인 완료 (Home/Developers/Dashboard/Pricing)
  - data.ts B2C 데이터 보존 확인 (page.b2c-backup.tsx에서만 사용 — B2C 보존 원칙)
  - session-context.md "다음 세션" TODO 7개 중 5개 ✅ 완료 처리
  - npm run build 통과 확인

- ✅ 세션 22 B2C→B2B 사이트 전환 (2026-03-05~06):
  - 가격 불일치 수정: 랜딩페이지/pricing/sellers-me/sellers-usage 4파일 동기화 (Free 500, Growth $29/25K)
  - 코드 정리: console.log 6개 제거, unused imports 8파일, let→const, unused catch vars
  - B2C→B2B 페이지 전환 20+파일: about, terms, help, opengraph-image, blog(3포스트+page+[slug]), partners, contact, auth/join
  - B2C 페이지 redirect: search, search/info, wishlist, tax-info → 홈
  - SEO B2B 전환: sitemap.ts (B2B 페이지 추가), robots.ts (B2B disallow), layout.tsx (SearchAction JSON-LD 제거)
  - manifest.json B2B 전환: "AI Shopping Comparison" → "Total Landed Cost API"
  - legal/[slug] B2B 재작성: terms/privacy/cookie/privacy-settings 전체, email potal.com→potal.app
  - 위젯/API 프로덕션 검증: widget.js HTTP 200 + CORS, calculate API 401, countries API 정상

### B2C 기간 완료 작업 (참조용)
- ✅ iOS Build 3 재제출 (세션 6) — 거절 4가지 수정
- ✅ SEO 블로그 5개 글 배포 (세션 7)
- ✅ 코드베이스 리팩토링 + searchIntelligence + BestBuyProvider
- ✅ Make.com 12개 시나리오 전체 완료 (세션 8+9)
- ✅ Slack "POTAL HQ" 워크스페이스 구축
- ✅ `POTAL_Operations_Structure.xlsx` + `POTAL_Agent_Dashboard.html` 생성
- ✅ 파트너십 이메일 29곳 발송 + 바운스 처리
- ✅ 피치덱 v4 완성 (11 슬라이드)
- ✅ 김범수/QPV 리서치 + LinkedIn 메시지 발송
- ✅ Master Partnership Tracker v5 + 트래픽 시트
- ✅ `POTAL_API_Strategy_Analysis.xlsx` v2 (현실 검증)
- ✅ 홍보 채널 실행 (LinkedIn, X, Facebook, Reddit)

---

## 6. 📦 B2C 보존 항목 (지금 진행 ❌ — 나중에 필요 시 재개)

> **아래 항목들은 B2C 시절 진행하던 것들입니다. B2B 전환으로 모두 중단했으며, 향후 B2C 재개(Layer 3) 또는 데모/쇼룸 필요 시 꺼내 쓸 수 있도록 보존합니다.**

### 외부 서비스 (응답 오면 받아두기만)

| 서비스 | 마지막 상태 | 비고 |
|--------|-----------|------|
| Apple App Store | Build 3 재제출 완료 (2026-03-02), 심사 대기 | 통과하면 좋고, 안 해도 B2B에 영향 없음 |
| Google Play Console | 새 계정 한국 주소 등록, 본인 인증 대기 | 인증되면 놔두기 |
| 파트너십 이메일 29곳 | 전체 발송 완료, 응답 대기 | 응답 오면 기록만 |
| 김범수 대표 LinkedIn | 피치덱+메시지 발송 완료 | 응답 오면 대응 (투자 관련이라 B2B에도 유효) |
| Impact.com | 주소 변경 서류 제출 필요 | 급하지 않음, 나중에 해도 됨 |

### RapidAPI 구독 (전체 취소 예정)

| API | 플랜 | 조치 |
|-----|------|------|
| Amazon (OpenWeb Ninja) | PRO $25/mo | 구독 취소 |
| Walmart (realtime-walmart-data) | 유료 | 구독 취소 |
| eBay (real-time-ebay-data) | PRO | 구독 취소 |
| AliExpress (aliexpress-data) | 유료 | 구독 취소 |
| Target (target-com-shopping-api) | 유료 (404 에러 상태) | 구독 취소 |

> 나중에 B2C 데모/쇼룸 필요 시 그때 재구독하면 됨

### B2C 마케팅 (중단)

| 항목 | 마지막 상태 |
|------|-----------|
| Facebook 그룹 홍보 | 14개 그룹 가입, 셀러/스캐머 중심으로 판단 → Frugal Living으로 전환 필요했으나 B2B 전환으로 중단 |
| Affiliate 네트워크 8곳 수동 신청 | 미착수 (Nike, Sephora 등) — B2B 전환으로 불필요 |
| Reddit r/SideProject | 스팸 필터, 모더레이터 승인 대기 |
| SEO 블로그 | 5개 글 배포 완료, 추가 글 계획 있었으나 중단 |

### B2C API 전환 전략 (중단 — 참조용)

| 항목 | 상태 |
|------|------|
| 공식 API 5개 전환 계획 | eBay, Etsy, Best Buy, AliExpress, Kroger — 미착수, B2B 전환으로 중단 |
| 네트워크 경유 (CJ, Rakuten, Impact, Awin) | 가입 미착수, B2B 전환으로 중단 |
| `POTAL_API_Strategy_Analysis.xlsx` | v2 완성됨, Layer 3 (B2C 재개) 시 참조 |

### B2C 앱/배포

| 항목 | 상태 |
|------|------|
| iOS 앱 | Build 3 심사 대기 중. Capacitor, appId: `com.potal.app`, URL Scheme: `potal://` |
| Android 앱 | Google Play Console 본인 인증 대기 |
| 웹사이트 | https://potal.app — Vercel 배포 중, 유지 (데모/쇼룸) |

---

## 7. ⛔ DO NOT PROCEED

| 항목 | 사유 |
|------|------|
| B2C 관련 신규 작업 | B2B Phase 0에 집중 |
| 소비자 기능 확장 | B2B에 집중 |
| 반응 검증 전 광고 집행 | 무료 채널 먼저 |
| 전통적 팀 빌딩 | AI 시대 = 1-2명 최소 채용 |

---

## 8. 📋 참조 데이터

### 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `app/lib/cost-engine/` | Total Landed Cost 계산 **(B2B 독립 모듈, 181개국 지원)** |
| `app/lib/cost-engine/GlobalCostEngine.ts` | 글로벌 다국가 TLC 계산 엔진 (181개국, India/Brazil 특수 세금) |
| `app/lib/cost-engine/country-data.ts` | 181개국 VAT/GST/관세/de minimis 데이터 |
| `app/lib/api-auth/` | API 인증 시스템 (키 생성/검증/미들웨어/rate-limit) |
| `app/api/v1/calculate/route.ts` | 단건 TLC 계산 API |
| `app/api/v1/calculate/batch/route.ts` | 배치 TLC 계산 API (최대 100건) |
| `app/api/v1/sellers/keys/route.ts` | API 키 관리 (CRUD) |
| `app/api/v1/sellers/usage/route.ts` | 사용량 조회 API |
| `app/api/v1/countries/route.ts` | 지원국가 목록 API |
| `app/api/v1/docs/route.ts` | OpenAPI 3.0 스펙 서빙 |
| `app/api/v1/sellers/keys/create/route.ts` | 세션 기반 API 키 생성 |
| `app/api/v1/sellers/keys/revoke/route.ts` | 세션 기반 API 키 폐기 |
| `app/auth/login/page.tsx` | 로그인 페이지 (이메일 + Google OAuth) |
| `app/auth/signup/page.tsx` | 회원가입 페이지 (Google OAuth + 비밀번호 검증) |
| `app/auth/callback/route.ts` | OAuth 콜백 핸들러 |
| `app/context/I18nProvider.tsx` | i18n React Context Provider |
| `app/i18n/translations/` | 6개 언어 번역 파일 (en, ko, ja, zh, es, de) |
| `app/lib/cost-engine/ai-classifier/claude-classifier.ts` | AI 분류 서비스 (GPT-4o-mini, Claude 지원) |
| `app/lib/cost-engine/ai-classifier/ai-classifier-wrapper.ts` | AI 분류 오케스트레이터 (DB캐시→키워드→AI→폴백) |
| `app/lib/cost-engine/ai-classifier/index.ts` | AI 분류 모듈 exports |
| `app/lib/cost-engine/exchange-rate/exchange-rate-service.ts` | 실시간 환율 서비스 (무료 API 이중 폴백) |
| `app/lib/cost-engine/tariff-api/usitc-provider.ts` | USITC 미국 관세율 API |
| `app/lib/cost-engine/tariff-api/uk-tariff-provider.ts` | UK Trade Tariff 영국 관세율 API |
| `app/lib/cost-engine/tariff-api/eu-taric-provider.ts` | EU TARIC 유럽 관세율 API |
| `app/lib/cost-engine/tariff-api/canada-cbsa-provider.ts` | Canada CBSA 캐나다 관세율 |
| `app/lib/cost-engine/tariff-api/australia-abf-provider.ts` | Australia ABF 호주 관세율 |
| `app/lib/cost-engine/tariff-api/japan-customs-provider.ts` | Japan Customs 일본 관세율 |
| `app/lib/cost-engine/tariff-api/korea-kcs-provider.ts` | Korea KCS 한국 관세율 |
| `app/lib/shopify/shopify-auth.ts` | Shopify OAuth + HMAC + 토큰 관리 |
| `app/api/shopify/auth/route.ts` | Shopify 앱 설치 (OAuth 시작) |
| `app/api/shopify/callback/route.ts` | Shopify OAuth 콜백 |
| `app/api/shopify/webhooks/route.ts` | Shopify 필수 웹훅 (GDPR) |
| `extensions/potal-widget/` | Shopify Theme App Extension (3개 블록) |
| `shopify.app.toml` | Shopify 앱 설정 파일 |
| `__tests__/api/cost-engine.test.ts` | CostEngine 유닛 테스트 |
| `app/lib/search/CostEngine.ts` | B2C 호환 래퍼 (cost-engine 모듈 re-export) |
| `app/lib/search/SearchService.ts` | B2C 검색 파이프라인 |
| `app/lib/search/providers/` | B2C 쇼핑몰 API Provider들 |
| `app/lib/native-auth.ts` | 네이티브 OAuth (iOS) |
| `app/api/delete-account/route.ts` | 계정 삭제 API |
| `app/dashboard/page.tsx` | 대시보드 서버 컴포넌트 (Suspense 래퍼) |
| `app/dashboard/DashboardContent.tsx` | 대시보드 클라이언트 컴포넌트 (Overview/API Keys/Widget/Usage/Billing 탭) |
| `app/api/billing/checkout/route.ts` | Stripe Checkout 세션 생성 API |
| `app/api/billing/webhook/route.ts` | Stripe Webhook 핸들러 (6개 이벤트) |
| `app/api/billing/portal/route.ts` | Stripe Customer Portal API |
| `app/lib/billing/stripe.ts` | Stripe 싱글톤 + PLAN_CONFIG |
| `app/lib/billing/subscription.ts` | 구독 라이프사이클 관리 |
| `app/blog/` | SEO 블로그 (3개 B2B 글 — TLC 가이드, HS Code 분류, De Minimis) |

### Supabase B2B 테이블 (003_b2b_schema.sql — SQL Editor 실행 필요)
plans, sellers, api_keys, widget_configs, usage_logs + seller_monthly_usage VIEW

### 프로덕션 환경 & 인증 정보

| 항목 | 값 |
|------|-----|
| 프로덕션 URL | https://www.potal.app (⚠️ potal.vercel.app는 405 에러) |
| 도메인 | https://potal.app / https://www.potal.app |
| 테스트 셀러 user_id | a58e58c7-e071-4350-ae0f-539e14afbdc1 |
| 테스트 API 키 | (대시보드에서 확인 — sk_live_*** 형식) |
| Shopify Client ID | 2fa34ed65342ffb7fac08dd916f470b8 |
| Shopify Partner Dashboard | https://dev.shopify.com/dashboard/208854133/apps |
| Stripe (Test) | sk_test_... / whsec_... (.env.local 참조) |
| API 엔드포인트 | https://www.potal.app/api/v1/calculate |
| Supabase URL | https://zyurflkhiregundhisky.supabase.co |

### ⚠️ Vercel 환경변수 주의사항
- **Project Settings + All Settings 둘 다 설정 필수** — 하나만 하면 오류 발생 가능
- OPENAI_API_KEY, AI_CLASSIFIER_ENABLED 등 AI 관련 변수도 양쪽에 설정 확인

### ⚠️ 현재 블로커
- **ITIN 미발급**: Stripe Live mode 결제 수금 불가. Test mode로 개발 진행 중. (섹션 2 TODO 참조)
- Google OAuth redirect 설정 완료 (2026-03-04)

---

## 9. 📁 파일 인덱스

### B2B 핵심
| 파일 | 역할 |
|------|------|
| `POTAL-B2B-Strategy-Roadmap.docx` | B2B 피벗 전략 전체 문서 |
| `session-context.md` | 이 파일 (프로젝트 맥락) |
| `POTAL_vs_Competitors_Analysis.md` | 경쟁사 기술 비교 분석 (Zonos/Avalara/Global-e/Easyship/Dutify) |
| `PRODUCT_HUNT_LAUNCH_PLAN.md` | Product Hunt 런치 준비 문서 (Tagline/체크리스트/타이밍/성공지표) |

### B2C 보존 문서
| 파일 | 역할 |
|------|------|
| `POTAL_API_Strategy_Analysis.xlsx` | API 전환 전략 (6시트, Layer 3 시 참조) |
| `POTAL_Operations_Structure.xlsx` | AI Agent 운영 구조 (9시트) |
| `POTAL_Agent_Dashboard.html` | 비주얼 조직도 |
| `POTAL_Pitch_Deck.pptx` | 피치덱 v4 (투자용이라 B2B에도 유효) |
| `POTAL_Master_Partnership_Tracker.xlsx` | v5 트래커 + 트래픽 시트 |
| `POTAL_Partnership_Proposal_FINAL.pdf` | US 제안서 |
| `POTAL_Global_Partnership_Proposal_FINAL.pdf` | Global 제안서 |

### 작업 스크립트 (⚠️ 삭제 금지)
create_master_tracker_v5.py, add_traffic_sheet_v3.py, create_proposal_pdf_v3.py, create_proposal_pdf_global.py, NotoSansKR.ttf

---

## 10. 📝 작업 로그 (날짜별 요약)

| 날짜 | 세션 | 핵심 내용 |
|------|------|----------|
| 03-06 | 25 | **Cost Engine 대규모 업그레이드**: 4개 신규 관세 API Provider (Canada CBSA, Australia ABF, Japan Customs, Korea KCS) 추가 → 총 7개 정부 API. country-data.ts 137→181개국 확장. HS 챕터 56→97개(전체 커버). FTA 27→63개 협정. India 세금 계산 (BCD+SWS+IGST 캐스케이딩). Section 301 tariffs 2025/2026 업데이트. 8개국 processing fees 추가 (US MPF, AU IPC, NZ Biosecurity, CA CBSA, JP/KR customs, IN landing charges, CH statistical fee). Batch calculation Promise.allSettled 병렬화. 전체 frontend/docs/i18n country count 139→181 업데이트 (50+파일) |
| 03-06 | 24 | **API 문서 + PH 런치 + HS Code 확장**: Swagger UI 스타일 인터랙티브 API 문서 (`/developers/docs` 재구축, 6개 엔드포인트, Try it, cURL/JS/Python), Product Hunt 런치 플랜 문서, HS Code DB 409→443개 (+34개 이커머스 핵심), OpenAPI/widget URL 수정 (potal.io→potal.app) |
| 03-06 | 23 | **B2C 잔여 코드 정리 + layout 최종 완료**: layout.tsx에서 WishlistProvider/UserPreferenceProvider 제거, Footer/sw.js/MobileBottomNav B2B 확인 완료, data.ts B2C 보존 결정. B2C→B2B 전환 사실상 최종 완료 (잔여: lib/search/ 등 B2C 백엔드만 보존) |
| 03-05~06 | 22 | **B2C→B2B 사이트 전환 완료 + 코드 정리**: 가격 불일치 수정 4파일 (Free 500/Growth $29 25K), 코드 정리 8파일 (console.log/imports/let/catch), B2C→B2B 페이지 전환 20+파일 (about/terms/help/opengraph/blog/partners/contact/auth/join), B2C redirect 4개 (search/wishlist/tax-info→/), SEO B2B (sitemap/robots/JSON-LD), manifest.json B2B, legal/[slug] B2B 재작성, 위젯/API 프로덕션 검증 완료 |
| 03-05 | 21 | **Shopify App Store 심사 제출 준비 완료**: Theme Extension 배포 (potal-3, presets 제거+locales 추가), Shopify CLI 설치+config link, App Store $19 결제, 앱 리스팅 전체 작성 (설명/스크린샷3장/Feature media/카테고리/Free플랜/Support/Privacy), 예비 단계 8/9 완료 (임베디드 확인 대기) |
| 03-05 | 20 | **E2E 검증 + USITC 버그 수정**: 외부 관세 API 3개(USITC/UK/EU) 직접 curl 테스트, USITC API URL 버그 수정 (`/api/search?query=` → `/reststop/search?keyword=`), indent 타입 수정 (string→Number() 변환), UK/EU MFN 파싱 정상 확인, 환율 API 2개 모두 정상, 전체 코드 리뷰 (10+ 파일), npm run build 통과 |
| 03-05 | 19 | **Shopify 환경설정 완료**: Partner Dashboard 앱 등록 (POTAL v1.0.0 릴리스), Client ID/Secret → Vercel 환경변수, Supabase shopify_stores 테이블 생성, Redeploy 완료, 개발 스토어 앱 설치 성공, OAuth managed install flow 대응 |
| 03-05 | 18 | **Phase 6 + Shopify 코드 완료**: USITC/UK/EU 3개 정부 관세 API 프로바이더 추가, AI 10자리 HS Code 변경, 실시간 환율 API (ExchangeRate-API + Fawaz CDN), 요금제 변경 (Free 500/Starter $9/Growth $29), Shopify 앱 (OAuth + GDPR 웹훅 + Theme Extension 3블록) |
| 03-05 | 17+ | **AI 분류 E2E 완료 + 외부 API 연동 시작**: API키 FK 버그 수정 (user.id→seller.id), 키워드 partial match 버그 수정 ("air"→"chair" false positive), DB 캐시 unique index 수정, AI 분류 E2E 성공 (640411 Sports footwear, confidence 0.95), 캐시 플라이휠 검증 (1차 ai→2차 cache). 경쟁사 가격/기능 분석 (POTAL ~40-45% of Zonos, 30-75x cheaper per call). POTAL-Target-Analysis.xlsx 4시트 생성. 요금제 변경안 도출 (Free 500/Starter $9/Growth $29). 외부 관세 API 조사 완료 (USITC/UK/EU 무료) |
| 03-05 | 16+ | **Phase 4 완료 + Phase 5 완료**: Phase 4 — Vercel 빌드 에러 3건 수정, sellers 레코드 생성, 더블 헤더 수정, Billing 업그레이드 Stripe Checkout E2E 테스트 성공. Phase 5 — HS Code DB 62→370+ (6자리), 관세율 8→21개국/19→44챕터, FTA 12→27개 협정, 빌드 성공 확인 |
| 03-05 | 16 | **Phase 4 대시보드 완료**: Vercel 빌드 에러 3건 수정 (mcp-server exclude, useSearchParams Suspense 분리, sellers API 컬럼명), Supabase sellers 레코드 생성, 더블 헤더 수정 (Header/Footer에 /dashboard 경로 체크), 대시보드 Overview/Billing 정상 작동 확인 |
| 03-04 | 15+ | **Phase 2 핵심 완료 + Phase 4 Stripe 통합**: Stripe 계정 가입 (Wise USD, 2FA), Test API 키/Webhook/Product 설정, Billing 백엔드 (checkout/webhook/portal/stripe/subscription), Dashboard Billing UI (3 플랜 카드), Supabase migration 004 실행, Vercel 환경변수 설정 |
| 03-04 | 15 | **Phase 2 핵심 완료**: Custom GPT 언어 수정 (9개 언어 conversation starters, 글로벌 크로스보더 시장 데이터 기반 언어 우선순위), Claude MCP 서버 구축+빌드+테스트+Claude Desktop 연결 확인, Gemini Gem 생성 (지침+40개국 CSV), Meta AI Studio 시도(지역제한 실패→파일 준비), Copilot(비즈니스계정 필요→대기), Grok(스토어 없음→대기). Phase 4 진입 준비 |
| 03-04 | 14 | **Phase 2 진입**: Google OAuth 블로커 해결, LLM 커스텀 앱 계획 확정 (6개 플랫폼), 경쟁사 기술 분석 (Zonos/Avalara/Global-e/Easyship/Dutify), 로드맵 순서 변경 (Phase 3→마지막), 24시간 스프린트 시작 |
| 03-04 | 13 | **셀러 인증 완료**: 로그인/회원가입 분리, Google OAuth, 비밀번호 검증, i18n 6개 언어(EN/KO/JA/ZH/ES/DE) |
| 03-04 | 12 | **Phase 1 API 구축**: 인증시스템(1-01~05), API 엔드포인트 5개(1-06~14), 글로벌 엔진 58개국, OpenAPI 스펙, 테스트 파일 |
| 03-04 | 11 | **Phase 0 완료**: B2C 백업 브랜치, CostEngine 모듈화, Supabase B2B 스키마 |
| 03-03 | 10+ | **B2B 피벗 결정**, 전략 문서 생성, AI 4파전 분석, 경쟁사 조사 |
| 03-02 | 9 | Make.com 12/12, 근본 문제 식별, API 전환 전략, Facebook 재검토 |
| 03-02 | 8 | Make.com #1~8, Slack 구축, Revenue Tracker |
| 03-02 | 7 | 운영 구조 설계, 코드 분석, SEO 블로그, Google Play 등록 |
| 03-02 | 6 | App Store 거절 수정, Build 3 재제출 |
| 03-01 | 5 | Gmail 스캔, 바운스 처리 |
| 03-01 | 4 | 파트너십 이메일 29곳 발송 |
| 03-01 | 3 | PDF 제안서 US+Global 완성 |
| 03-01 | 2 | 트래픽 시트 v3 + 데이터 검수 |
| 03-01 | 1 | Master Tracker v5, 수익화 논의 |
| 02-28 | — | 피치덱 v4, 김범수 리서치 |
| 02-26 | — | 코드 리팩토링, 홍보 채널 |

---

## 부록: 시장 데이터

- 크로스보더 이커머스: $1.2T (2025), $9T+ (2033)
- 장바구니 이탈 70%, 48%가 예상 못한 추가 비용
- AI 에이전트 이커머스: $190B~$385B by 2030
- US De Minimis $800 폐지: 2025-08-29 / EU €150 면세 폐지: 2026-07-01
