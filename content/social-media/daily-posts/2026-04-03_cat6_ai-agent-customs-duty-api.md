# Daily Content: 2026-04-03
## Topic: Your AI Agent Can Calculate Customs Duties — POTAL MCP + GPT Actions
## Category: 6 — Developer

---

## LinkedIn
**해시태그**: #CrossBorderCommerce #APIFirst #TotalLandedCost #BuildInPublic #StartupFounder
**첫 댓글용 링크**: potal.app
**게시 시간 권장**: 화~수 오후 1~3시 GMT

ChatGPT, Claude, and Gemini can now calculate customs duties.

Not in theory. Right now.

I built POTAL — a Total Landed Cost API that covers 240 countries, 140 features, and costs $0. Forever Free.

But here's the part most people miss: POTAL isn't just an API for your checkout page. It's an API for AI agents.

Claude can call POTAL through MCP (Model Context Protocol). One command:

npx -y potal-mcp-server

That's it. Claude can now classify HS codes, calculate duties, check trade restrictions, and return a total landed cost — inside a conversation.

ChatGPT does the same through GPT Actions. The Custom GPT is live on the GPT Store.

Gemini works through a Gem with uploaded trade data.

Why this matters:

AI shopping agents are coming. ChatGPT already has Instant Checkout with 900M weekly users. When an AI agent helps someone buy a $50 jacket from Korea to ship to Germany, someone needs to calculate the duty, VAT, and shipping cost in real time. That's the infrastructure layer.

Avalara charges $1,500+/month for 31 features. Zonos charges $2/order + 10% of GMV. POTAL does it for $0 with 140 features.

The next wave of commerce won't have checkout pages. It will have AI agents. And those agents need a customs API.

potal.app

### 한글 번역

ChatGPT, Claude, Gemini가 관세를 계산할 수 있다.

이론이 아니라, 지금 당장 가능하다.

POTAL은 240개국, 140개 기능을 갖춘 Total Landed Cost API다. 가격은 $0. 영원히 무료.

그런데 대부분이 놓치는 부분이 있다. POTAL은 결제 페이지용 API만이 아니다. AI 에이전트용 API이기도 하다.

Claude는 MCP(Model Context Protocol)를 통해 POTAL을 호출할 수 있다. 명령어 하나면 된다:

npx -y potal-mcp-server

이것으로 Claude가 HS Code 분류, 관세 계산, 무역 규정 확인, Total Landed Cost 계산을 대화 안에서 할 수 있다.

ChatGPT는 GPT Actions로 동일하게 작동한다. GPT Store에 이미 등록되어 있다.

Gemini는 무역 데이터가 업로드된 Gem으로 작동한다.

왜 중요한가:

AI 쇼핑 에이전트가 오고 있다. ChatGPT는 이미 Instant Checkout을 갖고 있고 주간 활성 사용자가 9억 명이다. AI가 한국에서 독일로 $50 재킷을 구매할 때, 누군가는 관세, VAT, 배송비를 실시간으로 계산해야 한다. 그게 인프라 레이어다.

Avalara는 31개 기능에 월 $1,500+. Zonos는 주문당 $2 + GMV의 10%. POTAL은 140개 기능에 $0.

다음 세대의 커머스에는 결제 페이지가 없다. AI 에이전트가 있다. 그 에이전트에게 관세 API가 필요하다.

potal.app

---

## DEV.to
**Front matter**:
```yaml
---
title: "Your AI Agent Can Calculate Customs Duties — Here's the API"
description: "How to connect ChatGPT, Claude, and Gemini to a free customs duty API using MCP and GPT Actions. 240 countries, 140 features, $0."
tags: api, webdev, javascript, tutorial
cover_image: https://potal.app/og-image.png
---
```

# Your AI Agent Can Calculate Customs Duties — Here's the API

Cross-border commerce has a hidden problem. When someone buys a product internationally, the price they see isn't the price they pay. Customs duties, VAT, sales tax, shipping fees, and regulatory charges all add up. A $24.99 t-shirt from Korea to the US can actually cost $38.34 after everything is calculated.

This is the "Total Landed Cost" problem. And until now, solving it required expensive enterprise software.

I built [POTAL](https://potal.app) — a Total Landed Cost API that covers 240 countries with 140 features. It's Forever Free. $0/month.

But here's the developer angle I want to talk about: **AI agents can use this API directly.**

## Claude MCP Integration

Claude supports [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) — a standard for connecting AI models to external tools. POTAL has an MCP server on npm.

Setup:

```bash
npx -y potal-mcp-server
```

Once connected, Claude can call these functions inside a conversation:

- `classify_product` — Returns an HS code with a confidence score
- `calculate_landed_cost` — Full breakdown: duty, tax, shipping, total
- `check_restrictions` — Trade sanctions and import restrictions
- `screen_denied_party` — Checks against denied party lists
- `lookup_fta` — Free Trade Agreement eligibility
- `compare_countries` — Side-by-side duty comparison

The MCP server is registered on the official MCP registry: [potal-mcp-server@1.3.1](https://www.npmjs.com/package/potal-mcp-server).

## ChatGPT via GPT Actions

For ChatGPT, POTAL uses GPT Actions with an OpenAPI spec. The Custom GPT is live on the GPT Store. Users can ask questions like:

> "How much would it cost to ship a cotton t-shirt from Korea to Germany, including all duties and taxes?"

And the GPT calls POTAL's API to return a real calculation — not a hallucinated estimate.

## Gemini Gem

For Gemini, POTAL works through a Gem with uploaded CSV trade data covering duty rates and country rules.

## REST API — Direct Integration

If you're building your own agent or checkout widget, the REST API is straightforward:

```bash
curl -X POST https://potal.app/api/v1/calculate-landed-cost \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Men'\''s cotton t-shirt",
    "material": "cotton",
    "price": 24.99,
    "origin": "KR",
    "destinationCountry": "US",
    "shippingPrice": 8.50
  }'
```

Response includes: HS code, duty rate, duty amount, VAT/sales tax, MPF (Merchandise Processing Fee), FTA eligibility, and total landed cost.

SDKs are available on [npm (potal-sdk)](https://www.npmjs.com/package/potal-sdk) and [PyPI (potal)](https://pypi.org/project/potal/).

## Why This Matters for AI Commerce

AI shopping agents are becoming real. ChatGPT has Instant Checkout with 900M weekly users. When an AI agent processes a cross-border purchase, it needs to calculate the real cost in real time. That requires:

1. HS code classification (which duty rate applies?)
2. Duty calculation (how much?)
3. Tax calculation (VAT, GST, sales tax by country)
4. Restriction checks (is this product even allowed?)
5. FTA lookup (can the duty be reduced?)

This is 5 API calls or 1 POTAL call that handles all of it.

Competitors charge $1,500+/month (Avalara) or $2/order + 10% GMV (Zonos) for fewer features. POTAL provides 140 features at $0.

## Get Started

1. Sign up at [potal.app](https://potal.app) — free, takes 30 seconds
2. Get your API key from the dashboard
3. Pick your integration: MCP, GPT Actions, REST API, or SDK

The next generation of commerce runs through AI agents. Those agents need customs infrastructure.

Try it: [potal.app](https://potal.app)

### 한글 번역

# AI 에이전트가 관세를 계산할 수 있다 — API 연동 가이드

크로스보더 커머스에는 숨겨진 문제가 있다. 해외에서 물건을 살 때, 보이는 가격이 실제 지불하는 가격이 아니다. 관세, VAT, 판매세, 배송비, 규정 관련 수수료가 모두 합쳐진다. 한국에서 미국으로 보내는 $24.99 티셔츠가 실제로는 $38.34가 될 수 있다.

이것이 "Total Landed Cost" 문제다. 그리고 지금까지 이걸 풀려면 비싼 엔터프라이즈 소프트웨어가 필요했다.

[POTAL](https://potal.app)을 만들었다. 240개국, 140개 기능의 Total Landed Cost API. 가격은 $0. 영원히 무료.

여기서 개발자에게 중요한 포인트: **AI 에이전트가 이 API를 직접 사용할 수 있다.**

## Claude MCP 연동

Claude는 MCP(Model Context Protocol)를 지원한다. AI 모델과 외부 도구를 연결하는 표준이다. POTAL은 npm에 MCP 서버가 있다.

설정:

```bash
npx -y potal-mcp-server
```

연결하면 Claude가 대화 안에서 이 함수들을 호출할 수 있다:

- `classify_product` — HS Code + 신뢰도 점수 반환
- `calculate_landed_cost` — 관세, 세금, 배송비, 합계 상세 분석
- `check_restrictions` — 무역 제재 및 수입 규정 확인
- `screen_denied_party` — 거래 금지 대상 확인
- `lookup_fta` — FTA(자유무역협정) 적용 여부
- `compare_countries` — 국가 간 관세 비교

MCP 서버는 공식 레지스트리에 등록되어 있다: [potal-mcp-server@1.3.1](https://www.npmjs.com/package/potal-mcp-server).

## ChatGPT — GPT Actions

ChatGPT에서는 OpenAPI spec 기반 GPT Actions로 연동된다. GPT Store에 이미 등록되어 있다.

> "면 티셔츠를 한국에서 독일로 보내면, 관세와 세금 포함해서 얼마인가요?"

이런 질문에 GPT가 POTAL API를 호출해서 실제 계산 결과를 돌려준다. 환각이 아닌 실데이터다.

## Gemini Gem

Gemini는 관세율과 국가 규정이 담긴 CSV 데이터가 업로드된 Gem으로 작동한다.

## REST API — 직접 연동

자체 에이전트나 결제 위젯을 만든다면, REST API를 직접 사용하면 된다:

```bash
curl -X POST https://potal.app/api/v1/calculate-landed-cost \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Men'\''s cotton t-shirt",
    "material": "cotton",
    "price": 24.99,
    "origin": "KR",
    "destinationCountry": "US",
    "shippingPrice": 8.50
  }'
```

응답에 포함되는 항목: HS Code, 관세율, 관세액, VAT/판매세, MPF(상품처리수수료), FTA 적용 여부, Total Landed Cost.

SDK: [npm (potal-sdk)](https://www.npmjs.com/package/potal-sdk), [PyPI (potal)](https://pypi.org/project/potal/).

## AI 커머스에서 왜 중요한가

AI 쇼핑 에이전트가 현실이 되고 있다. ChatGPT는 주간 9억 사용자와 Instant Checkout을 갖고 있다. AI 에이전트가 해외 구매를 처리할 때, 실시간으로 실제 비용을 계산해야 한다:

1. HS Code 분류 (어떤 관세율이 적용되는가?)
2. 관세 계산 (얼마인가?)
3. 세금 계산 (국가별 VAT, GST, 판매세)
4. 규정 확인 (이 상품 수입이 가능한가?)
5. FTA 조회 (관세를 줄일 수 있는가?)

이건 API 5번 호출이거나, POTAL 1번 호출이다.

경쟁사는 더 적은 기능에 월 $1,500+ (Avalara) 또는 주문당 $2 + GMV 10% (Zonos)를 청구한다. POTAL은 140개 기능을 $0에 제공한다.

## 시작하기

1. [potal.app](https://potal.app) 가입 — 무료, 30초
2. Dashboard에서 API 키 발급
3. 연동 방식 선택: MCP, GPT Actions, REST API, 또는 SDK

다음 세대의 커머스는 AI 에이전트를 통해 돌아간다. 그 에이전트에게 관세 인프라가 필요하다.

potal.app

---

## Medium
**태그**: Cross Border Commerce, API Development, SaaS, Developer Tools, International Trade
**게시 시간 권장**: 화~수 오전 10시~오후 1시

# The Infrastructure Layer AI Shopping Agents Need — and No One Is Building

There's a question that very few people in AI commerce are asking: when an AI agent buys something across borders, who calculates the customs duty?

Think about it. ChatGPT now has Instant Checkout. 900 million people use it weekly. Agents are starting to process purchases on behalf of users. But international commerce has a layer of complexity that domestic transactions don't: every cross-border shipment involves customs duties, import taxes, trade regulations, and fees that vary by product, country of origin, and destination.

A $24.99 cotton t-shirt shipped from Korea to the US doesn't cost $24.99. After the HS code is classified, the duty rate applied, sales tax added, and the Merchandise Processing Fee factored in, the real cost is $38.34. That's a 53% increase over the sticker price.

For human-driven e-commerce, this problem is partially solved by enterprise tools. Avalara offers cross-border calculation for $1,500+/month with about 31 features. Zonos charges $2 per order plus roughly 10% of GMV. These tools were built for checkout pages — for the flow where a human clicks "Buy" and a backend system processes the order.

But AI agents don't use checkout pages. They call APIs. And they need that customs calculation to happen in real time, inside a conversation or an automated workflow, not through a dashboard built for human operators.

This is why I built POTAL.

## An API Built for Agents

POTAL is a Total Landed Cost API. 240 countries. 140 features. $0 forever.

The architecture is API-first by design. Every calculation — HS code classification, duty rates, VAT, trade restrictions, FTA eligibility, denied party screening — is available through a single REST endpoint. But more importantly, POTAL connects directly to AI platforms:

**Claude** uses POTAL through MCP (Model Context Protocol). A developer adds one line — `npx -y potal-mcp-server` — and Claude can classify products, calculate landed costs, and check trade restrictions inside any conversation. The server is published on npm as potal-mcp-server.

**ChatGPT** uses POTAL through GPT Actions. The Custom GPT is live on the GPT Store. Ask it how much it costs to ship a product from one country to another, and it returns a real calculation — not a hallucinated number.

**Gemini** uses POTAL through a Gem with uploaded trade data.

Each platform accesses the same underlying API. The data is the same. The accuracy is the same. Only the interface changes.

## The Compounding Problem

Here's what makes this infrastructure critical: the regulatory environment is getting stricter, not looser.

The US abolished its $800 de minimis threshold in August 2025. Every package entering the US now incurs customs duties regardless of value. The EU is doing the same with its €150 threshold in July 2026.

This means the volume of customs calculations is about to increase by orders of magnitude. Previously, low-value shipments were exempt. Now every single package needs an HS code, a duty rate, and a tax calculation.

For AI agents processing thousands of cross-border transactions, this isn't optional. Without accurate landed cost data, the agent either quotes the wrong price (losing customer trust) or absorbs unexpected costs (destroying margins).

## The Cost Gap

The economics of existing solutions don't work for AI-scale commerce.

At Avalara's pricing ($1,500+/month for 31 features), an AI agent processing high volumes of exploratory queries — users asking "how much would it cost to ship X to Y?" without necessarily buying — becomes prohibitively expensive.

Zonos' per-transaction model ($2/order + ~10% GMV) creates unpredictable costs that scale linearly with volume.

POTAL offers 140 features at $0 with a soft cap of 100,000 calculations per month. The economics are designed for the query patterns of AI agents: high volume, exploratory, and cost-sensitive.

## What Comes Next

The shift from checkout-page commerce to agent-driven commerce is not a distant prediction. It's happening now. The infrastructure that powers it needs to be API-native, AI-compatible, and affordable at scale.

POTAL is that infrastructure for customs and trade compliance.

potal.app

### 한글 번역

# AI 쇼핑 에이전트에게 필요한 인프라 레이어 — 아무도 만들지 않는 것

AI 커머스에서 거의 아무도 묻지 않는 질문이 있다: AI 에이전트가 해외에서 물건을 살 때, 관세는 누가 계산하는가?

생각해보자. ChatGPT는 이제 Instant Checkout이 있다. 주간 9억 명이 사용한다. 에이전트가 사용자를 대신해서 구매를 처리하기 시작했다. 그런데 해외 거래에는 국내 거래에 없는 복잡한 레이어가 있다. 모든 크로스보더 배송에는 관세, 수입세, 무역 규정, 수수료가 따르고, 이는 상품, 원산지, 목적지에 따라 전부 다르다.

한국에서 미국으로 보내는 $24.99 면 티셔츠는 $24.99가 아니다. HS Code 분류, 관세율 적용, 판매세, 상품처리수수료(MPF)를 합치면 실제 비용은 $38.34다. 표시가의 53% 증가.

사람이 주도하는 이커머스에서는 이 문제가 엔터프라이즈 도구로 부분적으로 해결된다. Avalara는 약 31개 기능의 크로스보더 계산에 월 $1,500+를 받는다. Zonos는 주문당 $2 + GMV의 약 10%를 청구한다. 이 도구들은 결제 페이지를 위해 만들어졌다. 사람이 "구매"를 클릭하고 백엔드 시스템이 주문을 처리하는 흐름.

하지만 AI 에이전트는 결제 페이지를 사용하지 않는다. API를 호출한다. 관세 계산이 대화 안에서, 또는 자동화된 워크플로우 안에서, 실시간으로 일어나야 한다. 사람을 위한 대시보드가 아니라.

이것이 POTAL을 만든 이유다.

## 에이전트를 위한 API

POTAL은 Total Landed Cost API다. 240개국. 140개 기능. $0 영원히.

아키텍처가 설계부터 API-first다. 모든 계산 — HS Code 분류, 관세율, VAT, 무역 규정, FTA 적용 여부, 거래금지대상 심사 — 이 하나의 REST 엔드포인트로 가능하다. 더 중요한 건, POTAL이 AI 플랫폼에 직접 연결된다는 것:

**Claude**는 MCP(Model Context Protocol)로 POTAL을 사용한다. `npx -y potal-mcp-server` 한 줄이면 Claude가 대화 안에서 상품 분류, Landed Cost 계산, 무역 규정 확인을 할 수 있다.

**ChatGPT**는 GPT Actions로 사용한다. GPT Store에 등록되어 있다. 상품 배송 비용을 물어보면 환각이 아닌 실제 계산 결과를 돌려준다.

**Gemini**는 무역 데이터가 업로드된 Gem으로 작동한다.

각 플랫폼이 같은 기반 API에 접근한다. 데이터가 같고, 정확도가 같다. 인터페이스만 다르다.

## 복합적으로 커지는 문제

이 인프라가 중요한 이유: 규제 환경이 느슨해지는 게 아니라 더 엄격해지고 있다.

미국은 2025년 8월에 $800 de minimis 기준을 폐지했다. 미국에 들어오는 모든 소포에 가액과 관계없이 관세가 부과된다. EU도 2026년 7월에 €150 기준을 폐지한다.

관세 계산의 양이 자릿수 단위로 증가한다는 뜻이다. 이전에는 저가 배송이 면제됐다. 이제 모든 소포에 HS Code, 관세율, 세금 계산이 필요하다.

수천 건의 크로스보더 거래를 처리하는 AI 에이전트에게 이건 선택이 아니다. 정확한 Landed Cost 데이터 없이는 에이전트가 잘못된 가격을 안내하거나(고객 신뢰 상실) 예상 못한 비용을 떠안게 된다(마진 파괴).

## 비용 격차

기존 솔루션의 경제성은 AI 규모의 커머스에 맞지 않는다.

Avalara 가격(31개 기능에 월 $1,500+)으로 AI 에이전트가 대량의 탐색적 쿼리를 처리하면 — 사용자가 실제 구매 없이 "X를 Y로 보내면 얼마야?"를 묻는 경우 — 비용이 감당 불가능하다.

Zonos의 건당 과금 모델(주문당 $2 + GMV 약 10%)은 볼륨에 비례해서 선형적으로 증가하는 예측 불가능한 비용을 만든다.

POTAL은 140개 기능을 $0에 제공하고 월 100,000건 소프트 캡이 있다. AI 에이전트의 쿼리 패턴 — 대량, 탐색적, 비용 민감 — 에 맞게 설계된 경제성이다.

## 다음은 무엇인가

결제 페이지 커머스에서 에이전트 주도 커머스로의 전환은 먼 미래가 아니다. 지금 일어나고 있다. 이를 움직이는 인프라는 API 네이티브이고, AI 호환이며, 대규모에서 저렴해야 한다.

POTAL이 관세와 무역 컴플라이언스를 위한 그 인프라다.

potal.app

---

## Visual Suggestions

### LinkedIn
- **비교 차트**: "AI Commerce Infrastructure Stack" — Payment (Stripe) / Shipping (ShipEngine) / Customs (POTAL) / AI Agent (ChatGPT+Claude+Gemini)를 인프라 레이어 다이어그램으로
- **코드 스니펫 이미지**: `npx -y potal-mcp-server` 한 줄 명령어를 터미널 스타일 이미지로

### DEV.to
- **커버 이미지**: POTAL API 호출 흐름 다이어그램 (AI Agent → POTAL API → HS Code + Duty + Tax → Response)
- **코드 블록**: 이미 본문에 포함. 추가로 응답 JSON 예시 스크린샷

### Medium
- **헤더 이미지**: "AI Agent + Customs API" 컨셉 — 미니멀한 다이어그램
- **인포그래픽**: 비용 비교 (Avalara $1,500 vs Zonos $2/order vs POTAL $0) 수평 바 차트
