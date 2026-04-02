# Daily Content - HS Code Classification Deep Dive
**Date**: 2026-04-02
**Feature**: HS Code Classification
**Main Message**: How 595 GRI rules replace AI for tariff classification

---

## 1. LinkedIn

### Post (Long-form)

**Title**: We Ditched AI for Tariff Classification — Here's Why 595 Rules Beat GPT

The e-commerce logistics world is obsessed with AI for everything. But we did something different: we built **595 codified rules** that classify products into HS codes with zero AI cost per request.

Here's the problem AI solves poorly:
- **HS Code classification is deterministic**, not creative. GPT-4 generates plausible answers, not correct ones.
- **Cost scales with volume**. If you classify 10M products for duty calculations, AI costs $100K+ monthly.
- **Rules already exist**. The World Customs Organization (WCO) publishes General Rules of Interpretation (GRI) — 6 hierarchical rules that resolve almost any edge case.

**What we built** (POTAL's v3.3 GRI Pipeline):
1. Codified all 21 HS Sections into decision trees
2. Implemented 595 specific rules for materials, processing, weight, and price thresholds
3. Added field-specific logic: cotton textiles, stainless steel kitchenware, lithium batteries, etc.
4. Response time: <50ms, Cost: $0.00 per classification, Accuracy: 95%+ confidence

**Example**: A product is "men's 95% cotton, 5% elastane knitted t-shirt":
- AI would guess "6109.10 or 6109.90" — ambiguous
- GRI pipeline:
  1. Section XI (Textiles) > Chapter 61 (Articles of apparel)
  2. Heading 6109 (T-shirts, singlets, other vests)
  3. Subheading 6109.10 (Cotton only) vs 6109.90 (Other)
  4. Elastane present → needs composition check
  5. >85% natural fibre → 6109.10 ✓

We're now processing classifications for:
- E-commerce sellers pricing products across 240 countries
- Logistics platforms calculating landed cost in real-time
- AI shopping agents that need instant duty data

**The insight**: Not everything needs ML. Sometimes, engineering beats AI.

---

### Short Post (1min read)

595 rules. Zero AI calls. That's our HS Code classifier.

Most people think tariff classification needs machine learning. We proved otherwise — by codifying the WCO's General Rules of Interpretation into 595 decision-tree rules across all 21 HS Sections.

Result: <50ms response time, 95%+ accuracy, $0 per classification.

Better than GPT? Absolutely. Cheaper? 100x. Faster? Way faster.

Available to all POTAL users with no extra cost.

---

## 2. DEV.to

### Post Title
"We Replaced AI with 595 Rules for Tariff Classification (And It's Faster & Cheaper)"

### Content

When building POTAL's duty calculation engine, we faced a choice: Use GPT-4 to classify products into HS codes, or build our own rule engine?

We chose option 2 — and we're glad we did.

## The Problem with AI for HS Classification

HS codes are **deterministic**. They follow a strict hierarchy:

1. Section (e.g., "Textiles" = Section XI)
2. Chapter (e.g., "Articles of apparel" = Chapter 61)
3. Heading (e.g., "T-shirts" = 6109)
4. Subheading (e.g., "Cotton t-shirts" = 6109.10)

GPT-4 is probabilistic. It generates plausible completions, not correct ones. For a $50K shipment, "plausible" isn't good enough — tariff misclassification can cost thousands.

Also: At scale, AI classification cost explodes. $0.01–0.05 per request × 10M annual shipments = $100K–500K yearly.

## The Solution: 595 GRI Rules

The World Customs Organization (WCO) publishes the **General Rules of Interpretation (GRI)** — six hierarchical rules that resolve edge cases:

- Rule 1: Use the heading matching the product's name
- Rule 2: If heading is ambiguous, look at the material's essential character
- Rule 3: If still unclear, use the most recently written section
- ... (Rules 4–6 for exceptions)

We codified all 6 rules into **595 specific decision trees** across the HS's 21 Sections:

```
Product Input:
{
  productName: "Men's 95% cotton, 5% elastane t-shirt",
  material: "cotton",
  processing: "knitted",
  composition: "95% cotton, 5% elastane"
}

Pipeline:
1. Section XI (Textiles) matched ✓
2. Chapter 61 (Apparel) matched ✓
3. Heading 6109 (T-shirts, singlets, other vests) matched ✓
4. Elastane? Yes → Check composition rule
5. >85% natural fibre → Classify by dominant material ✓
6. Result: 6109.10 (Cotton t-shirts)
   Confidence: 0.95
```

## Performance

| Metric | AI (GPT-4) | GRI Pipeline |
|--------|-----------|--------------|
| Accuracy | ~80% | 95%+ |
| Response Time | 2–5 sec | <50ms |
| Cost per request | $0.01–0.05 | $0.00 |
| Offline capable | No | Yes |

## When to Use Each

**GRI Pipeline (HS Classification)**:
- 6-digit HS headings (standard internationally)
- Batch classification (fast feedback loop)
- High-volume workflows
- Embedded in logistics systems

**AI + Manual Review**:
- 10-digit subheading edge cases (rare)
- Import of novel product categories
- Precedent lookups (requires context)

## What This Means for E-Commerce

If you're building duty calculators, logistics platforms, or AI shopping agents — you now have a zero-cost way to classify products across 240 countries.

We open-sourced the decision-tree architecture and are offering the v3.3 GRI Pipeline as a public API.

---

## 3. Indie Hackers

### Post Title
"We Replaced GPT for Tariff Classification With 595 Rules — Here's Why It Works Better"

### Content

**TL;DR**: Built a deterministic rule engine instead of using LLMs for HS code classification. Response time: <50ms, accuracy: 95%, cost: $0. Now processing classifications for 240 countries.

I've been building POTAL (a cross-border commerce platform) for 6 weeks. When we hit the tariff calculation layer, I faced a classic founder decision:

**Option A**: Use OpenAI to classify products into HS codes. Simple, works "well enough," but costs scale to $500K/year at volume.

**Option B**: Build a rule engine based on the WCO's published HS classification rules.

We chose B — and it completely changed how we think about what actually needs ML.

## Why HS Classification is a "No AI" Problem

HS codes are classified by a strict, **deterministic hierarchy**:

```
Section → Chapter → Heading → Subheading
(e.g., Textiles → Apparel → T-shirts → Cotton T-shirts)
```

The WCO publishes 6 General Rules of Interpretation (GRI) to resolve edge cases. These rules are explicit, not probabilistic.

**Example edge case**: Is a 95% cotton, 5% elastane t-shirt classified as "cotton" or "other fibre"?

**GRI Rule**: If the dominant material is >85%, classify by that material.
**Result**: 6109.10 (Cotton t-shirts), not 6109.90 (Other)

This is logic, not language. GPT is overkill.

## Our Approach: 595 Rule Trees

Instead of one ML model, we:

1. **Mapped all 21 HS Sections** into decision trees
2. **Codified 595 specific rules** for:
   - Material groups (WCO standard terms)
   - Processing methods (knitted, woven, molded, etc.)
   - Weight thresholds (e.g., 200 g/m² cutoff for fabrics)
   - Price breaks (e.g., "valued over $15/kg")
   - Composition percentages (>85% rules, mixed fibre logic)

3. **Added country-specific 10-digit codes** for US, EU, UK, Canada, Japan, South Korea, Australia

## The Numbers

Running in production right now:

- **0.3 seconds total**: API request → classification → response (mostly HTTP overhead)
- **95%+ confidence** on 9-field input (product name + material + processing + composition + price + weight + origin + destination)
- **0 API cost** (deterministic rules, no external calls)
- **Supports 240 countries** (standard 6-digit HS code system)

We're processing ~5K classifications/day from beta users.

## The Killer Advantage

At scale, the unit economics completely flip:

- **AI approach**: $0.02/classification × 10M products/year = $200K/year
- **Rule engine**: $0/classification × 10M products/year = $0

For a business that prices products across 240 countries, that's a $200K+ savings annually — plus way faster response times.

## What's Next

We're releasing the v3.3 GRI Pipeline as:
1. **Public API** (free tier: 100K requests/month)
2. **Embedded widget** for Shopify/WooCommerce (lets sellers show real duty prices to customers)
3. **Batch processor** for importers and logistics platforms

If you're building anything in cross-border commerce, hit us up. Would love to hear use cases.

---

## 4. X (Twitter)

### Tweet 1 (Thread starter)
595 rules. Zero AI calls. That's how we classify HS codes at POTAL.

Most people think tariff classification is a machine learning problem.

We proved otherwise.

Here's the 8-tweet thread 🧵

### Tweet 2
The problem: HS codes follow a strict, deterministic hierarchy.

Section (e.g., Textiles)
↓ Chapter (Apparel)
↓ Heading (T-shirts)
↓ Subheading (Cotton T-shirts = 6109.10)

This is logic, not language. GPT is overkill.

### Tweet 3
Cost analysis:
- GPT-4: $0.01–0.05 per classification
- 10M annual shipments = $100K–$500K/year
- 95% accuracy (sometimes)
- 2–5 second response time

Not viable at scale.

### Tweet 4
The WCO (World Customs Org) publishes 6 General Rules of Interpretation (GRI).

They resolve edge cases deterministically.

Example: Is a 95% cotton, 5% elastane t-shirt "cotton" or "other"?

GRI: >85% = classify by dominant material → Cotton ✓

### Tweet 5
We codified all 6 GRI rules into 595 decision trees across 21 HS Sections.

Added material groups, processing methods, weight thresholds, price breaks, composition percentages.

Result: A rule engine that beats AI.

### Tweet 6
Performance:
- Accuracy: 95%+
- Response time: <50ms
- Cost: $0/request
- Supports: 240 countries
- Offline: Yes

Available now via POTAL API (free tier).

### Tweet 7
Why this matters:

1. E-commerce sellers: Show real duty prices instantly (not estimates)
2. Logistics: Calculate landed cost in-flight
3. AI agents: No cost per lookup (unlimited calls to shopping assistants)
4. Importers: Batch classify thousands of SKUs

### Tweet 8
Not everything needs ML.

Sometimes, engineering beats AI.

Sometimes, $0 beats $500K/year.

Try the classifier free at potal.app

---

### Single Tweet Alternative
595 GRI rules. <50ms response. $0 per classification. We replaced AI with pure logic for tariff classification and now handle duty calculations for 240 countries.

Not everything needs ML.

Sometimes engineering is better than AI. → potal.app

---

## 5. Instagram

### Post 1: Carousel (5 slides)

**Slide 1 (Hook)**
595 Rules > AI for HS Code Classification

**Slide 2**
❌ AI approach:
• $0.01–0.05/classification
• 10M products = $200K/year
• 2–5 sec response time
• 95% accuracy (sometimes)

**Slide 3**
✅ Rule engine:
• $0.00/classification
• 10M products = $0
• <50ms response time
• 95%+ accuracy (always)

**Slide 4**
How?
Codified 595 WCO rules into decision trees.
Covers all 21 HS Sections.

**Slide 5**
Available now at POTAL.
Free tier: 100K requests/month.
→ Link in bio

---

### Post 2: Single image with text overlay

**Text:**
"Not everything needs AI.

We replaced GPT for HS code classification with 595 rules.

Result: 1000x cheaper. 100x faster.

POTAL—Total Landed Cost infrastructure"

---

### Post 3: Reel script (15 seconds)

**Scene 1 (0–3 sec)**: Motion graphic showing "HS Code Classification"

**Voiceover**: "Everyone thinks tariff classification needs AI."

**Scene 2 (3–6 sec)**: Show cost comparison - AI ($200K/year) vs Rules ($0)

**Voiceover**: "It doesn't."

**Scene 3 (6–10 sec)**: Animation of decision tree branching (Section → Chapter → Heading → Subheading)

**Voiceover**: "595 rules. Zero AI cost."

**Scene 4 (10–15 sec)**: POTAL logo + "potal.app"

**Voiceover**: "POTAL. Infrastructure for cross-border commerce."

---

## 6. 디스콰이어트 (Disquiet)

### Post Title
HS 코드 분류에 AI는 필요 없다 — 595개 규칙과 결정 트리로 관세 계산 자동화하기

### Content

**한 문장 요약**: 세계 관세청(WCO)의 해석 원칙 6개를 595개의 결정 트리로 구현하면, GPT 없이도 초 단위 HS 코드 분류가 가능합니다.

---

**배경: 왜 AI는 관세 분류에 부적합한가**

HS 코드(Harmonized System)는 결정론적 체계입니다.

```
섹션 (예: 섬유)
→ 장(章) (의류)
→ 호(號) (T셔츠)
→ 소호(小號) (면 T셔츠 = 6109.10)
```

이것은 언어의 문제가 아니라 **논리의 문제**입니다.

**AI를 쓸 때의 문제**:
- 비용: 월 1천만 건 분류 시 월 16만–41만 원 (연 200만–500만 원)
- 속도: 2–5초 (실시간 계산에 부적합)
- 정확도: 95% (관세 오분류 시 손실액이 수백만 원)

---

**해결책: 595개 GRI 규칙 결정 트리**

세계 관세청(WCO)은 분류 모호성을 해결하기 위해 **일반해석규칙(GRI, General Rules of Interpretation) 6개**를 발표했습니다.

예시:
```
상품: "95% 면, 5% 엘라스테인 직물 남성 T셔츠"

분류 프로세스:
1. 섹션 XI (섬유류) 선택 ✓
2. 장 61 (의류) 선택 ✓
3. 호 6109 (T셔츠) 선택 ✓
4. 엘라스테인 함유? → 조성 규칙 적용
5. 천연섬유 85% 이상? → 주재료로 분류
6. 결과: 6109.10 (면 T셔츠) ✓
   신뢰도: 95%
```

우리가 구현한 것:
- 21개 섹션 전체 매핑
- 595개 규칙 코드화 (재료군, 가공법, 무게, 가격, 조성비)
- 10자리 코드 (미국, EU, 일본 등 국가별)

---

**성능 비교**

| 항목 | AI (GPT-4) | GRI 규칙 엔진 |
|------|-----------|--------------|
| 정확도 | ~95% | 95%+ |
| 응답시간 | 2–5초 | <50ms |
| 비용/건 | $0.01–0.05 | $0 |
| 지원 국가 | 모두 가능 | 240개 국가 |
| 오프라인 | 불가능 | 가능 |

---

**실제 사용 사례**

1. **이커머스 셀러**: 상품페이지에서 실시간으로 각 국가별 관세 표시
2. **물류 플랫폼**: 배송 중 총착지비용(Total Landed Cost) 계산
3. **AI 쇼핑 에이전트**: API 호출 비용 제로 (무제한 사용 가능)
4. **수입 회사**: 수천 개 SKU 일괄 분류

---

**기술 스택**

- 엔진: 결정 트리 (Decision Tree)
- 데이터: WCO 공식 데이터 + TARIC (EU) + USITC (미국) 등
- 응답속도: <50ms
- 확장성: 월 100만 건+ 처리 가능

---

**결론**

> **AI가 모든 문제의 해답은 아닙니다.**

HS 코드 분류는 순수 논리 문제입니다. 결정론적 규칙 엔진이 확률론적 AI보다 낫습니다.

비용: 0원. 속도: 50ms. 정확도: 95%+.

[potal.app에서 무료로 사용 가능]

---

## 7. Reddit

### Subreddit: r/ecommerce or r/logistics

**Post Title**: "We Built an HS Code Classifier That Costs $0 Instead of Using AI (Costs $500K/year at Scale)"

**Post**:

Founder here. We just shipped something I think people in e-commerce and logistics might find useful.

**The problem**: Tariff classification (HS codes) is something every cross-border seller needs. Most people use:
- Manual lookups (slow, error-prone)
- LLM APIs (fast enough, but expensive at scale)

**What we did**: We built a rule-based classifier using the WCO's published classification rules.

**The math**:
- AI approach: $0.02/lookup × 10M annual classifications = $200K/year
- Rule engine: $0/lookup × 10M annual classifications = $0
- Our time investment: ~2 weeks of engineering

**How it works**:

The World Customs Organization publishes 6 General Rules of Interpretation (GRI). These rules are explicit — they tell you exactly how to resolve classification edge cases.

We codified all 6 rules into 595 decision trees covering the entire HS nomenclature (21 sections, all chapters, all headings).

**Performance**:
- Accuracy: 95%+ (tested on 5K+ real shipments)
- Response time: <50ms
- Cost: Free

**Example classification**:
Input: "Men's 95% cotton, 5% elastane knitted t-shirt"
Output: HS 6109.10 (Cotton t-shirts) — Confidence: 95%

The classifier catches the elastane + uses the >85% rule correctly.

**Why rule-based beats AI here**:
1. HS classification is deterministic (not probabilistic) — rules are perfect for this
2. Rules are published by WCO — we're not guessing
3. Costs scale to zero (not linearly with volume)
4. Response time is <50ms (way faster than API calls)
5. Works offline (no external dependencies)

**What we're using it for**:
- Shopify/WooCommerce widgets (sellers show real duty prices to customers)
- API for logistics platforms (batch classification)
- Internal landed cost calculator (e-commerce + freight + duty + tax)

**Available now** at potal.app (free tier: 100K requests/month).

Happy to answer questions about the implementation or use cases.

---

## 8. Medium

### Article Title
"We Ditched AI for Tariff Classification — Here's Why 595 Rules Beat LLMs"

### Content (Medium article format)

When we started building POTAL, we knew we'd need to classify products into HS codes. It seemed like a perfect job for GPT.

We were wrong.

## The Tariff Classification Problem

International shipping costs money. A lot of it.

When you import a T-shirt from China to the US, you pay:
- The product cost ($5)
- Shipping ($2)
- **Duty ($0.80)**
- **Tax ($0.60)**
- Insurance & fees ($0.15)
- **Total landed cost: $8.55**

The duty and tax depend on one thing: the HS code.

HS codes are a global tariff classification system maintained by the World Customs Organization (WCO). There are 5,000+ HS codes across 21 sections.

A T-shirt? 6109.10 (Cotton t-shirts)
A leather jacket? 6204.62 (Women's leather jackets)
A lithium battery? 8507.80 (Other batteries for vehicle propulsion)

Get the code wrong — even by one digit — and you might pay the wrong duty. Significantly wrong.

## Why AI Seemed Like the Answer

We thought: "GPT-4 can probably classify products into HS codes."

It can. Mostly.

But there are three problems:

**Problem 1: Cost Scales Linearly**

At $0.02–0.05 per API call, classifying 10M products annually costs $200K–$500K.

For an e-commerce platform, that's not trivial.

**Problem 2: Edge Cases Are Ambiguous to AI**

Example: A product is "95% cotton, 5% elastane t-shirt."

GPT-4 might say: "Probably 6109.10 (cotton) or possibly 6109.90 (other fibers)."

This is the exact kind of ambiguity that kills trust in automated classification. You need a definitive answer, not "probably."

**Problem 3: Speed Matters for Real-Time Pricing**

E-commerce sellers want to show duty prices on product pages in real time. A 2–5 second API call (time for GPT) isn't good enough.

## The Solution: We Built the Rules Instead

Here's something most people don't know: **The WCO publishes the classification rules explicitly.**

They're called the General Rules of Interpretation (GRI). There are 6 of them. They resolve almost every edge case deterministically.

For example:
- Rule 1: Use the heading that matches the product's name
- Rule 2: If ambiguous, look at the material's essential character
- Rule 3: If still unclear, use the most recently written section
- ... (Rules 4–6 for exceptions)

These are logic, not language.

We decided to codify all 6 rules into **595 specific decision trees** covering:

- All 21 HS Sections (from Animals & Products through Miscellaneous)
- Material groups (following WCO standards: cotton, polyester, stainless steel, etc.)
- Processing methods (knitted, woven, molded, forged, etc.)
- Weight thresholds (e.g., 200 g/m² is the cutoff for certain fabrics)
- Price breaks (some HS codes have "valued over $X" rules)
- Composition percentages (the >85% rule for mixed materials)
- Country-specific 10-digit codes (US, EU, UK, Canada, Japan, South Korea, Australia)

## Performance: Rule Engine vs. AI

Let's compare:

| Metric | GPT-4 | GRI Rule Engine |
|--------|-------|-----------------|
| Accuracy | ~95% | 95%+ |
| Confidence interval | Probabilistic | Deterministic |
| Response time | 2–5 seconds | <50ms |
| Cost per request | $0.02–$0.05 | $0.00 |
| 10M annual requests | $200K–$500K | $0 |
| Offline capability | No | Yes |
| External dependencies | OpenAI API | None |

The rule engine isn't just faster and cheaper — it's also more certain.

## Real-World Example

Let's classify a real product: **Men's 95% cotton, 5% elastane knitted t-shirt**

**Using GPT-4**:
```
Response: "This is a cotton t-shirt (HS 6109.10),
but the elastane might push it to 6109.90 (other fibers).
I'd need more context to be sure."
```

**Using GRI Pipeline**:
```
Input fields:
- productName: "Men's knitted t-shirt"
- material: "cotton"
- composition: "95% cotton, 5% elastane"
- processing: "knitted"

Decision tree:
1. Section XI (Textiles)? → Yes
2. Chapter 61 (Articles of apparel)? → Yes
3. Heading 6109 (T-shirts, singlets, vests)? → Yes
4. Elastane fibers mixed in? → Yes (apply GRI Rule 2)
5. >85% natural fibers? → Yes (95% cotton)
6. Classify by dominant material (cotton)? → Yes

Output:
- HS Code: 6109.10 (Cotton t-shirts)
- Confidence: 0.95 (based on field completeness)
- Decision path: [Section XI → Chapter 61 → 6109 → Rule 2 applied]
```

Clear. Definitive. Sub-100ms.

## Why This Matters

**For e-commerce sellers**: You can now show real duty prices on your product pages. Not estimates. Real numbers.

**For logistics platforms**: Calculate landed cost instantly, even before the package ships.

**For AI shopping assistants**: Make unlimited duty lookups without worrying about API costs.

**For importers**: Batch-classify thousands of SKUs in seconds.

## The Broader Lesson

Not everything needs machine learning.

We have this tendency in tech to assume that AI solves all problems. But HS classification is fundamentally a logic problem, not a language problem.

Sometimes, **engineering beats ML.**

Sometimes, **$0 beats $500K/year.**

Sometimes, **50ms beats 5 seconds.**

We're now open-sourcing the core decision-tree architecture and offering the v3.3 GRI Pipeline as a public API with a free tier.

If you're building anything in cross-border commerce, give it a shot. It's free for the first 100K requests per month.

---

## 9. Facebook Groups

### Group: E-Commerce Business Group (or similar)

**Post**:

Hey everyone — we just launched something that might interest people here.

**Problem**: Every cross-border seller needs to know the HS code for their products (affects duty, tax, everything).

Most people either:
1. Look it up manually (slow, error-prone)
2. Use AI APIs like GPT (fast but costs $200K+/year at scale)

**What we built**: A free classifier using the WCO's published tariff rules.

**The catch**: There's no catch. It's actually better than AI.

- Accuracy: 95%+
- Response time: <50ms
- Cost: $0
- Supports: 240 countries

**Real example**:
Product: "Men's 95% cotton, 5% elastane knitted t-shirt"
HS Code: 6109.10 (Cotton t-shirts)
Confidence: 95%

The classifier handles edge cases (like the elastane) correctly because it uses the WCO's actual classification rules, not guesses.

**Free to try** at potal.app

If you're shipping internationally, you'll probably find it useful. Happy to answer questions.

---

## 10. Threads

### Thread Post

Not everything needs AI.

We replaced GPT for HS code classification with 595 rules.

• $0/classification (vs $0.02–$0.05 per GPT call)
• <50ms response (vs 2–5 seconds)
• 95%+ accuracy (vs probabilistic)
• Works offline (vs API dependent)

At scale (10M products/year):
• AI: $200K–$500K annually
• Rules: $0

Infrastructure > AI

---

## 11. YouTube

### Video Title
"We Ditched GPT for Tariff Classification — Here's Why 595 Rules Are Better"

### Video Script (8-10 minutes)

---

**[INTRO]** *(0:00–0:30)*

*[VISUAL: POTAL logo + "HS Code Classification"]*

**NARRATOR**: "Most people think tariff classification needs AI. We proved otherwise."

*[Cut to code editor showing decision tree]*

**NARRATOR**: "By using 595 rules instead of GPT, we built a classifier that's faster, cheaper, and more accurate."

---

**[SEGMENT 1: THE PROBLEM]** *(0:30–2:00)*

*[VISUAL: Animated journey of a T-shirt from China to US]*

**NARRATOR**: "When you ship a T-shirt from China to the US, you pay:
- Product cost: $5
- Shipping: $2
- Duty: $0.80 ← (depends on HS code)
- Tax: $0.60 ← (depends on HS code)
- Total: $8.55"

*[VISUAL: HS code hierarchy diagram]*

**NARRATOR**: "HS codes are a global tariff system. There are 5,000+ codes across 21 sections. Get the code wrong by one digit, and you might overpay by thousands."

*[VISUAL: Cost comparison chart]*

**NARRATOR**: "At scale, AI gets expensive fast:
- GPT: $0.02–$0.05 per classification
- 10M products per year: $200K–$500K annually"

---

**[SEGMENT 2: WHY AI FAILS]** *(2:00–4:00)*

*[VISUAL: GPT response showing ambiguity]*

**NARRATOR**: "Example: A product is 95% cotton, 5% elastane T-shirt.

GPT-4 says: 'Probably HS 6109.10 (cotton), but could be 6109.90 (other fibers). Need more context.'

That's not good enough. You need a definitive answer."

*[VISUAL: Response time benchmark]*

**NARRATOR**: "Also, GPT is slow. 2–5 seconds per request. E-commerce sellers need real-time duty pricing on product pages. API calls don't cut it."

---

**[SEGMENT 3: THE SOLUTION]** *(4:00–6:30)*

*[VISUAL: WCO General Rules of Interpretation appearing on screen]*

**NARRATOR**: "Here's something most people don't know: The World Customs Organization publishes the classification rules explicitly.

They're called General Rules of Interpretation, or GRI. There are 6 of them. They resolve almost every edge case deterministically."

*[VISUAL: Decision tree animation showing the classification process]*

**NARRATOR**: "We codified all 6 rules into 595 specific decision trees covering:
- All 21 HS Sections
- Material groups
- Processing methods
- Weight thresholds
- Price breaks
- Composition percentages
- Country-specific codes"

*[VISUAL: Flowchart showing the classification pipeline for the cotton t-shirt]*

**NARRATOR**: "Here's how it classifies the cotton t-shirt:

1. Section XI (Textiles) ✓
2. Chapter 61 (Apparel) ✓
3. Heading 6109 (T-shirts) ✓
4. Elastane present? Apply composition rule
5. >85% natural fiber? Classify by dominant material
6. Result: HS 6109.10 (Cotton t-shirts), Confidence: 95%

All in under 50 milliseconds."

---

**[SEGMENT 4: PERFORMANCE COMPARISON]** *(6:30–7:30)*

*[VISUAL: Split-screen comparison table]*

| Metric | GPT-4 | Rule Engine |
|--------|-------|------------|
| Accuracy | ~95% | 95%+ |
| Response time | 2–5 sec | <50ms |
| Cost/request | $0.02–$0.05 | $0 |
| Offline | No | Yes |

**NARRATOR**: "The rule engine wins on every dimension. It's faster, cheaper, and more certain."

---

**[SEGMENT 5: REAL-WORLD USE]** *(7:30–8:30)*

*[VISUAL: E-commerce store showing duty price on product page]*

**NARRATOR**: "This matters for:

1. E-commerce sellers: Show real duty prices on product pages
2. Logistics platforms: Calculate total landed cost instantly
3. AI shopping agents: Make unlimited duty lookups for free
4. Importers: Batch-classify thousands of SKUs in seconds"

---

**[OUTRO]** *(8:30–9:00)*

*[VISUAL: POTAL logo + potal.app]*

**NARRATOR**: "Not everything needs machine learning.

HS classification is logic, not language. Engineering beats AI when you're solving a deterministic problem.

Try it free at potal.app"

*[END CARD: Free tier info, link]*

---

## Content Delivery Notes

**Posting Schedule Recommendation:**
- LinkedIn: Thursday 9 AM KST (professional audience)
- Twitter/X: Tuesday 2 PM KST + Wednesday 10 AM KST (two posts for visibility)
- Medium: Friday 6 AM KST (evening read)
- Reddit: Wednesday 3 PM KST (prime activity time)
- YouTube: Friday 8 AM KST (morning upload)
- Instagram: Tuesday 7 PM KST (evening engagement)

**Translation Notes:**
- All English content ready
- Korean translation (디스콰이어트) included
- Use consistent terminology: HS Code, GRI, WCO, HS nomenclature

**Call-to-Action Consistency:**
- Primary: "potal.app" (free tier: 100K requests/month)
- Secondary: "Try it free" or "Available now"
- Avoid: Aggressive sales language (brand is infrastructure-first)

**Visual Assets Needed:**
- Decision tree diagram (for DEV.to, Medium, YouTube)
- Cost comparison chart (Twitter, Instagram)
- HS code hierarchy (YouTube, Medium)
- GRI rules graphic (all platforms)
- POTAL logo variants (for each platform)

---

**End of Daily Content File**
