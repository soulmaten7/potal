# Reddit 3개 서브레딧 포스트
# 2026-03-24 KST
# r/SideProject + r/alphaandbetausers + r/SaaS

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. r/SideProject
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Title:** I built an API that calculates import duties and taxes for 240 countries (free tier: 200 calls/month)

**Body:**

Hey everyone,

I've been building POTAL — an API that calculates the total landed cost (duties, taxes, fees) when shipping products across borders.

**Why I built it:**

I noticed that accurate tariff calculation tools either cost $1,500+/month (Avalara, Zonos) or only cover a few countries. Small ecommerce sellers who ship internationally were basically guessing at customs costs.

**What it does:**

You send product details (name, material, category, origin, destination) → it returns the exact duty rate, VAT/GST, customs fees, and total landed cost.

**Some numbers:**

- 240 countries, 113M+ tariff rate records
- 9-field HS Code classification → 100% accuracy when all fields provided
- 63 Free Trade Agreements with auto preferential rate detection
- 119,706 anti-dumping/countervailing duty cases
- Sanctions screening against 21,301 entries
- 22 automated cron jobs updating data daily from government sources

**Tech stack:** Next.js 14, Supabase (PostgreSQL), Vercel, TypeScript

**Free tier:** 200 API calls/month, no credit card needed

**What I'm looking for:** Early adopters and feedback. Especially from anyone dealing with cross-border ecommerce.

→ https://www.potal.app
→ API docs: https://www.potal.app/developers
→ MCP server (for AI agents): npx potal-mcp-server

Happy to answer any questions!

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. r/alphaandbetausers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Title:** [Beta] POTAL — Landed cost calculation API for 240 countries (looking for testers)

**Body:**

**What is it?**

POTAL is an API that calculates the total cost of importing products internationally — import duties, VAT/GST, customs fees, FTA savings, and more. It covers 240 countries with 113M+ tariff records.

**Who is it for?**

- Ecommerce developers building cross-border checkout
- Sellers who ship internationally and need accurate duty estimates
- AI agent developers who need tariff data (we have an MCP server)

**What I need help testing:**

1. **API accuracy** — Try calculating landed costs for your actual products and see if the numbers make sense
2. **HS Code classification** — Send your product details (name + material + category) and check if it returns the correct HS Code
3. **Edge cases** — Unusual products, rare country combinations, high-value items
4. **Developer experience** — Is the API easy to integrate? Are the docs clear?

**How to test:**

1. Sign up at https://www.potal.app (free, no credit card)
2. Get your API key from the dashboard
3. Try the API: `curl https://www.potal.app/api/v1/calculate -H "X-API-Key: YOUR_KEY" -d '{"productName":"cotton t-shirt","originCountry":"CN","destinationCountry":"US","declaredValue":25}'`

**Free tier:** 200 calls/month

**Feedback channel:** Reply here, or email contact@potal.app

Thanks in advance!

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. r/SaaS — "Show r/SaaS"
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Title:** Show r/SaaS: I built a B2B landed cost API — 240 countries, $0.01/call, free tier included

**Body:**

Hey r/SaaS,

Launching my side project POTAL — a B2B API for calculating import duties, taxes, and total landed costs for cross-border ecommerce.

**The market problem:**

Cross-border ecommerce is $6T+ but calculating the actual cost of importing a product is still broken. Sellers either overpay duties (wrong HS Code), miss FTA savings, or get hit with unexpected customs fees. The existing solutions (Avalara, Zonos, Global-e) charge $1,500+/month and mostly target enterprise.

**What POTAL does differently:**

| | POTAL | Avalara | Zonos |
|---|---|---|---|
| Countries | 240 | 190+ | 200+ |
| Tariff records | 113M+ | Undisclosed | Undisclosed |
| HS accuracy (9-field) | 100% | ~80% | ~44% |
| Starting price | Free (200/mo) | $1,500+/mo | $2/order |
| MCP server | Yes | No | No |

**Business model:**

- Free: 200 calls/month
- Basic: $20/month (2,000 calls)
- Pro: $80/month (10,000 calls)
- Enterprise: $300/month (50,000 calls)

All plans include the same features — only volume differs ("Grow with you" model, like Stripe).

**Current traction:**

- Honest answer: 0 paying customers yet
- Shopify app pending review (19 days and counting...)
- MCP server published on npm + official MCP registry
- 3 custom LLM integrations (ChatGPT, Gemini, Meta AI)

**Tech:** Next.js 14, Supabase, Vercel, TypeScript. Solo founder.

**What I'd love feedback on:**

- Pricing — does the free→$20→$80→$300 ladder make sense?
- Positioning — should I lead with "cheaper than Avalara" or "more accurate than everyone"?
- Distribution — beyond Shopify App Store, where should I focus?

→ https://www.potal.app
→ API: https://www.potal.app/developers

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 포스팅 순서 & 타이밍
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**추천 순서:**
1. r/SideProject — 가장 관대, 먼저 올려서 반응 확인
2. r/alphaandbetausers — 테스터 모집, 실제 피드백 수집
3. r/SaaS — 가장 까다로움, 1-2에서 피드백 반영 후 올리기

**타이밍:**
- 미국 시간 화~목 오전 9-11시 EST = 한국 밤 11시~새벽 1시
- 3개를 같은 날 올리지 말고 **하루 간격**으로 (스팸 방지)
- Day 1: r/SideProject
- Day 2: r/alphaandbetausers
- Day 3: r/SaaS

**포스트 후 필수:**
- 댓글에 24시간 내 답변 (반응 없으면 알고리즘에서 밀림)
- 비판적 댓글에도 정중하게 답변
- "0 customers" 솔직하게 인정 — Reddit은 솔직함을 좋아함
