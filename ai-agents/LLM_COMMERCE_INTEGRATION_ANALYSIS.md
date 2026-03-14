# LLM별 커머스 통합 방식 & POTAL 진입 전략 심층 분석
# 작성: 2026-03-15 KST
# 분석 기반: 공식 발표, 기술 문서, 뉴스 기사 (2026년 3월 기준)

---

## 핵심 발견: UCP(Universal Commerce Protocol)에 MCP가 내장

2026년 1월, Google + Shopify + Walmart + Target이 **Universal Commerce Protocol (UCP)**을 공동 발표했다.
이것은 "AI 에이전트가 쇼핑을 대행하는" 시대의 표준 프로토콜이다.

**UCP 아키텍처에 빌트인된 프로토콜:**
- **MCP (Model Context Protocol)** — Anthropic이 만든 도구 연결 프로토콜
- **A2A (Agent2Agent)** — Google이 만든 에이전트 간 통신 프로토콜
- **AP2 (Agent Payments Protocol)** — 에이전트 결제 프로토콜

**UCP의 현재 기능:**
- ✅ Checkout (장바구니, 결제)
- ✅ Identity Linking (사용자 인증)
- ✅ Order Management (주문 관리)
- ✅ Tax calculation (세금 계산)
- ✅ Multi-currency pricing (다통화)
- ❌ **Cross-border import duties = 없음**
- ❌ **HS Code classification = 없음**
- ❌ **Customs fees = 없음**
- ❌ **FTA detection = 없음**
- ❌ **Sanctions screening = 없음**

UCP 문서에서 "tax calculation"은 **국내 세금(sales tax, VAT)**만 의미한다.
크로스보더 관세(import duty)는 UCP 스펙에 포함되어 있지 않다.
머천트가 별도 서비스(Avalara, TaxJar 등)를 연동해야 한다고 명시.

**→ POTAL이 MCP 서버로 UCP 생태계에 플러그인되면,
   "크로스보더 관세 계산"이라는 빠진 퍼즐 조각을 채울 수 있다.**

---

## UCP 참여 기업 (20+ 글로벌 파트너)

| 역할 | 기업 |
|------|------|
| 공동 개발 | Google, Shopify |
| 리테일러 | Walmart, Target, Best Buy, The Home Depot, Macy's, Flipkart, Zalando, Wayfair, Etsy |
| 결제 | Stripe, Visa, Mastercard, American Express, Adyen, PayPal |
| 기술 | Google Cloud |

**이 모든 기업이 크로스보더 거래 시 POTAL이 필요한 잠재 고객이다.**

---

## 플랫폼별 상세 분석

### 1. Google (Gemini Shopping + UCP)

**현재 구조:**
- Gemini Enterprise for CX → Shopping Agent (NRF 2026 발표)
- Google Shopping → Gemini 통합 (Bloomberg 2026-02 보도)
- UCP = 모든 AI 에이전트 쇼핑의 표준 프로토콜

**외부 도구 연결 방식:**
- UCP는 MCP를 빌트인 지원 → **POTAL MCP 서버가 직접 연결 가능**
- 머천트가 `/.well-known/ucp` 매니페스트에 기능 선언
- AI 에이전트가 매니페스트를 읽고 사용 가능한 도구 자동 검색
- Tax calculation은 "checkout" 프리미티브의 일부로 포함
- **하지만 cross-border duty는 UCP 스펙에 없음**

**POTAL 진입 전략:**
1. POTAL MCP 서버를 npm에 publish
2. MCP 공식 레지스트리(registry.modelcontextprotocol.io)에 등록
3. UCP 호환 MCP 서버로 포지셔닝 → "UCP + POTAL = 크로스보더 완성"
4. Google Cloud Marketplace에 등재
5. UCP GitHub(github.com/Universal-Commerce-Protocol/ucp)에 "cross-border duty" 기능 제안 PR

**긴급도:** ⭐⭐⭐⭐⭐ (UCP 초기 단계, 지금 들어가면 표준에 포함 가능)

---

### 2. OpenAI (ChatGPT Shopping)

**현재 구조:**
- Instant Checkout (Stripe 기반, Etsy/Shopify 파트너)
- Commission-based 모델 (판매 수수료)
- 현재 US-only, 2026년 내 국제 확장 계획
- PayPal → Agentic Commerce Protocol 채택 (ChatGPT 내 결제)

**외부 도구 연결 방식:**
- **GPT Actions** (OpenAPI 스펙 기반) — POTAL 이미 구축 완료 ✅
- ChatGPT Plugins (deprecated → Actions으로 전환)
- OpenAI은 UCP에 공식 참여하지 않았으나, 독자적 커머스 확장 중
- 국제 확장 시 landed cost 계산이 필수 → 현재 솔루션 없음

**POTAL 진입 전략:**
1. Custom GPT (POTAL) 이미 라이브 ✅ — instructions 업데이트 필요
2. OpenAI partnerships에 "국제 확장 시 관세 API" 제안
3. ChatGPT Marketplace에서 POTAL GPT 노출도 높이기
4. "ChatGPT Shopping goes global → needs POTAL" 포지셔닝

**긴급도:** ⭐⭐⭐⭐⭐ (국제 확장 임박, 관세 솔루션 0개)

---

### 3. Anthropic (Claude + MCP)

**현재 구조:**
- MCP(Model Context Protocol) = AI 도구 연결 표준
- Claude Desktop + Claude Code에서 MCP 서버 직접 사용
- UCP에 MCP가 빌트인 → MCP 생태계 급성장
- 쇼핑 기능은 아직 미런칭, 하지만 MCP 생태계가 커머스를 지원

**외부 도구 연결 방식:**
- **MCP 서버** — POTAL 이미 9개 도구로 구축 완료 ✅
- MCP 공식 레지스트리: registry.modelcontextprotocol.io
- npm 패키지로 배포 → `npx @potal/mcp-server`로 설치
- Claude Desktop claude_desktop_config.json에 등록

**POTAL 진입 전략:**
1. `@potal/mcp-server` npm publish (⚠️ 현재 미배포)
2. MCP 공식 레지스트리에 등록 신청
3. PulseMCP(pulsemcp.com/servers) 디렉토리에 등재
4. Anthropic MCP 파트너 페이지(anthropic.com/partners/mcp) 등재 신청

**긴급도:** ⭐⭐⭐⭐⭐ (MCP가 UCP에 내장 → MCP 등록 = UCP 생태계 진입)

---

### 4. Perplexity AI (Buy with Pro)

**현재 구조:**
- Buy with Pro (PayPal 파트너, 원클릭 구매)
- Merchant Program (Google Merchant Center 유사)
- Shopify API 통합 (상품 데이터 연동)
- Agent API (LLM 앱 개발용, 도구 통합 지원)
- 현재 US-only

**외부 도구 연결 방식:**
- **Merchant Program**: 상품 카탈로그 제출 → Perplexity 검색에 노출
- **Agent API**: 외부 도구를 "configurable tools"로 연결 가능
- **Shopify API**: 상품 정보 자동 연동
- 크로스보더 기능 없음 → 국제 확장 시 관세 필요

**POTAL 진입 전략:**
1. Perplexity Agent API에 POTAL을 "tool"로 등록
2. Merchant Program 가입 (POTAL은 "서비스"지만, 관계 구축)
3. "Buy with Pro goes international → POTAL adds duty transparency" 제안
4. Perplexity DevRel에 직접 접촉

**긴급도:** ⭐⭐⭐⭐ (US-only, 국제 확장 시점 미정이지만 필수 방향)

---

### 5. Shopify (UCP 공동 개발사)

**현재 구조:**
- UCP 공동 개발 (Google과 함께)
- "Agentic Commerce Platform" — 모든 AI 대화에 머천트 연결
- Managed Markets (DDP 지원, 하지만 전체 셀러 대상 아님)
- Shopify API → Perplexity, ChatGPT 등에 상품 데이터 공급

**외부 도구 연결 방식:**
- **UCP 네이티브** — UCP 생태계의 핵심 인프라
- **Shopify App Store** — 써드파티 앱 마켓플레이스
- **Theme App Extension** — POTAL 이미 구축 완료 ✅
- Managed Markets는 일부 셀러만 → 나머지 셀러에게 관세 계산 갭 존재

**POTAL 진입 전략:**
1. Shopify App Store 정식 등재 (Theme App Extension 활용)
2. UCP 생태계 내 "cross-border duty calculation" 도구로 포지셔닝
3. Managed Markets 미지원 셀러를 타겟 → "무료 관세 계산 앱"

**긴급도:** ⭐⭐⭐⭐⭐ (UCP + App Store = 이중 진입)

---

### 6. Grok / xAI

**현재 구조:**
- Grok Business / Enterprise (기업용)
- X(Twitter) 통합, 실시간 검색
- 쇼핑/커머스 기능 **없음**
- 비디오 생성, 콘텐츠 제작 초점

**외부 도구 연결 방식:**
- xAI API (기본 LLM API, Function Calling 지원)
- 커머스 전용 프로토콜 없음
- UCP 참여하지 않음

**POTAL 진입 전략:**
- 현재 긴급하지 않음. Grok이 커머스 진출 시 재평가
- xAI API Function Calling으로 기술적 통합은 가능

**긴급도:** ⭐⭐ (커머스 무관)

---

### 7. Apple Intelligence / Siri

**현재 구조:**
- Apple Intelligence (온디바이스 AI)
- App Intents / SiriKit으로 앱 연동
- Apple Pay 글로벌 인프라 보유
- 쇼핑 에이전트 기능은 미런칭

**외부 도구 연결 방식:**
- App Intents Framework (iOS/macOS 앱 필요)
- UCP 참여하지 않음 (독자 생태계)

**POTAL 진입 전략:**
- iOS 앱 개발 시 App Intents 통합
- 현재 우선순위 낮음

**긴급도:** ⭐⭐

---

## 통합 방식 비교표

| 플랫폼 | 연결 방식 | POTAL 구축 상태 | 관세 기능 유무 | 긴급도 |
|--------|----------|---------------|--------------|-------|
| Google (UCP/Gemini) | MCP (UCP 내장) | MCP 서버 ✅, npm 미배포 | ❌ 없음 | ⭐⭐⭐⭐⭐ |
| OpenAI (ChatGPT) | GPT Actions (OpenAPI) | ✅ 라이브 | ❌ 없음 | ⭐⭐⭐⭐⭐ |
| Anthropic (Claude) | MCP 서버 | ✅ 구축, npm 미배포 | ❌ 없음 | ⭐⭐⭐⭐⭐ |
| Shopify (UCP) | UCP + App Store | TEA ✅ 구축 | 부분 (Managed Markets) | ⭐⭐⭐⭐⭐ |
| Perplexity | Agent API + Merchant | ❌ 미구축 | ❌ 없음 | ⭐⭐⭐⭐ |
| PayPal | Agentic Commerce Protocol | ❌ 미구축 | ❌ 없음 | ⭐⭐⭐ |
| Meta (WhatsApp/IG) | Meta AI Studio | 지침 ✅ | ❌ 없음 | ⭐⭐⭐ |
| Grok / xAI | xAI API (Function Calling) | ❌ 미구축 | ❌ 없음 | ⭐⭐ |
| Apple | App Intents | ❌ 미구축 | ❌ 없음 | ⭐⭐ |

---

## 즉시 실행 항목 (긴급)

### 1. MCP npm publish (최우선)
```bash
cd mcp-server
npm publish --access public
```
- 이유: MCP가 UCP에 내장 → npm 배포 = Google/Anthropic/Shopify 생태계 즉시 진입
- POTAL MCP가 MCP 레지스트리에 등록되면, UCP 호환 AI 에이전트가 자동으로 발견

### 2. MCP 공식 레지스트리 등록
- URL: https://registry.modelcontextprotocol.io
- 등록 방법: GitHub에서 PR 제출
- 필요 정보: 패키지명, 도구 목록, 설명, npm URL

### 3. Custom GPT instructions 업데이트
- 새 파일: ai-agents/custom-gpt/gpt-instructions.md
- ChatGPT 편집 화면에서 복사-붙여넣기 필요

### 4. UCP GitHub에 Cross-border 기능 제안
- URL: https://github.com/Universal-Commerce-Protocol/ucp
- Issue 또는 PR: "Add cross-border duty/tax calculation to checkout primitive"
- POTAL MCP 서버를 참조 구현으로 제시

### 5. Shopify App Store 제출
- Theme App Extension 이미 구축됨
- App Store 등재 = 41K+ 크로스보더 셀러 즉시 노출

---

## 전략적 결론

**모든 길은 MCP로 통한다.**

Google UCP(MCP 내장) + Anthropic MCP + Shopify UCP(MCP 지원) =
MCP 서버 하나를 잘 만들면 3개 생태계에 동시 진입.

POTAL MCP 서버는 이미 9개 도구로 구축 완료.
**npm publish + 레지스트리 등록만 하면 즉시 작동.**

OpenAI는 독자 경로(GPT Actions)지만 이미 라이브.
Perplexity는 Agent API로 연결 가능하지만 아직 US-only.

**POTAL의 최우선 액션:**
1. npm publish (30초)
2. MCP 레지스트리 등록 (1일)
3. UCP GitHub Issue (1시간)
4. Custom GPT 업데이트 (5분)
5. Shopify App Store 제출 (1주)

이 5개를 하면, Google + Anthropic + OpenAI + Shopify 생태계에 POTAL이 존재하게 된다.
콜드메일은 그 다음이다 — "이미 당신 생태계에 있습니다"가 "써보시겠어요?"보다 강하다.

---

## 참고 소스
- UCP 공식: https://ucp.dev
- UCP GitHub: https://github.com/Universal-Commerce-Protocol/ucp
- UCP 구현 가이드: https://developers.google.com/merchant/ucp
- Google Gemini CX: https://cloud.google.com/products/gemini-enterprise-for-customer-experience
- MCP 레지스트리: https://registry.modelcontextprotocol.io
- MCP 파트너: https://www.anthropic.com/partners/mcp
- PulseMCP: https://www.pulsemcp.com/servers
- OpenAI Commerce: https://www.digitalcommerce360.com/2026/02/16/openai-expands-agentic-commerce-push/
- Perplexity Shopping: https://www.perplexity.ai/hub/blog/shop-like-a-pro
- Shopify Agentic: https://www.shopify.com/news/ai-commerce-at-scale
