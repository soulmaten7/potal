# Reddit r/ecommerce Post Draft
# 2026-03-24 KST

---

## 전략: "문제 공유 + 해결 과정" 포맷
- 노골적 홍보 ❌ → 문제를 공유하고, 해결책을 만든 스토리 ✅
- "우리 제품 써라" ❌ → "이런 걸 만들었는데 피드백 달라" ✅
- 링크 스팸 ❌ → 글 안에 가치 있는 정보 + 마지막에 링크 1개 ✅

---

## 포스트 초안 (영어)

**Title:** I built a free API that calculates landed costs for 240 countries — here's what I learned about cross-border tariffs

**Body:**

Hey r/ecommerce,

I've been working on a cross-border commerce project for the past few months and wanted to share some findings that might help other sellers dealing with international duties and taxes.

**The problem I kept running into:**

Every time I tried to calculate the total landed cost for shipping products internationally, the numbers were all over the place. Different calculators gave different results. Most "free" tools only covered a handful of countries. And the accurate ones (Avalara, Zonos, Global-e) start at $1,500+/month — way out of reach for small sellers.

**What surprised me during research:**

- There are 113M+ tariff rate records across 240 countries. Most calculators only use a fraction of this data.
- The US just killed the $800 de minimis exemption for Chinese-origin goods. If you're sourcing from China, every single shipment now has duties.
- HS Code classification (the 6-10 digit code that determines your duty rate) is where most errors happen. Getting the wrong code can mean 0% duty vs 25% duty on the same product.
- 63 Free Trade Agreements exist globally. Most sellers don't check if their products qualify for reduced rates.
- Anti-dumping duties can add 20-300% on top of regular duties for specific products from specific countries.

**What I ended up building:**

I built an open API called POTAL that calculates total landed costs — duties, VAT/GST, customs fees, FTA optimization, sanctions screening — for 240 countries.

Some key specs:
- 240 countries/territories, 113M+ tariff records
- 9-field HS Code classification (product name + material + category + 6 more fields → 100% accuracy when all fields provided)
- 63 FTA agreements with automatic preferential rate detection
- Anti-dumping/countervailing duty checks (119,706 cases)
- Free tier: 200 API calls/month, no credit card

It's designed for developers/sellers who want to show accurate duty estimates at checkout or in their product pages.

**Honest limitations:**
- It's a new product, so I'm still looking for early adopters to stress-test it
- The 100% HS accuracy requires all 9 input fields — with just a product name, accuracy drops significantly
- Currently API-only (Shopify app is pending review)

If anyone here deals with cross-border shipping and wants to try it out or give feedback, I'd really appreciate it. Happy to answer any questions about tariff calculations or HS codes.

Website: https://www.potal.app
API docs: https://www.potal.app/developers
MCP server (for AI agents): npx potal-mcp-server

---

## 포스팅 전 체크리스트

- [ ] r/ecommerce 규칙 직접 확인 (사이드바)
- [ ] Reddit 계정 karma 확인 (낮으면 먼저 다른 글에 댓글 참여)
- [ ] 포스트 시간: 미국 시간 화~목 오전 9-11시 EST (한국 시간 화~목 밤 11시~새벽 1시)
- [ ] 포스트 후 댓글에 적극 답변 (최소 24시간)

---

## 대안 서브레딧 (같은 글 약간 변형해서)

1. **r/ecommerce** (주력) — 이커머스 셀러 커뮤니티
2. **r/shopify** — Shopify 셀러 (앱 승인 후)
3. **r/FulfillmentByAmazon** — FBA 셀러 (관세 관련)
4. **r/dropshipping** — 드랍쉬핑 셀러 (중국→미국 관세 이슈)
5. **r/SaaS** — SaaS 빌더 커뮤니티 ("Show r/SaaS" 형식)
6. **r/smallbusiness** — 소규모 사업자

---

## 댓글 대응 템플릿

**"How is this different from Zonos/Avalara?"**
> Good question. Main differences: (1) We use 113M+ tariff records vs their subset, (2) Our 9-field classification system achieves 100% HS accuracy when complete data is provided — most competitors use AI-only which tops out around 44-89%, (3) Free tier with 200 calls/month vs $1,500+/month starting price. Trade-off: we're newer and still building out some features.

**"Is the data reliable?"**
> All tariff data comes from official government sources — USITC, EU TARIC, UK Trade Tariff, plus WTO/MacMap databases. We have 22 automated cron jobs that check for updates daily. That said, tariff regulations change frequently, so we always recommend verifying critical shipments.

**"Can I use this for my Shopify store?"**
> Shopify app is currently pending App Store review. In the meantime, you can integrate via our REST API or JavaScript widget. Happy to help with setup.

**"What about accuracy? How do I know the numbers are right?"**
> We ran an internal benchmark with 50 real Amazon products — 100% accuracy across all 9 classification levels when complete product data was provided. With incomplete data (just product name), accuracy drops to ~6-42% depending on the level. The key is providing material + category + product name at minimum.
