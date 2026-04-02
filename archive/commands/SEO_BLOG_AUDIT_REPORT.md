# SEO Blog Audit Report — B2C → B2B Transition
# Date: 2026-03-25 KST
# Scope: Blog 3 posts, Blog infra, SEO config, FAQ/Guide/Learn pages

---

## Step 1: Blog Post Analysis (3 Posts)

### Post 1: "Understanding Total Landed Cost: A Complete Guide for E-Commerce Sellers"
- **Slug**: `understanding-total-landed-cost`
- **B2B Fit**: Medium
- **Issues**:
  - Title targets "E-Commerce Sellers" (B2C tone) instead of "Developers" or "API Integrators"
  - Content is beginner-level explainer — no API examples, no code snippets, no integration guidance
  - "Embed our widget on your product page or integrate via REST API" — mentions API but no depth
  - No POTAL-specific numbers (240 countries mentioned, but missing 131K tariff lines, 155+ endpoints, 9-field system, etc.)
  - No competitive positioning (Avalara/Zonos not mentioned)
  - CTA: "Get Started Free" → /developers (OK, but could be stronger with API example)
- **What Works**: Core TLC concept is relevant to both B2B and B2C audiences. The 6-component breakdown is solid educational content
- **Keyword Gaps**: Missing "landed cost API", "customs duty API", "TLC calculation API", "cross-border commerce infrastructure"
- **CTA Change**: Current "Embed our widget" → Should be "Integrate via REST API in 5 minutes — see our Quick Start guide"

### Post 2: "HS Code Classification: How to Classify Products for International Trade"
- **Slug**: `hs-code-classification-guide`
- **B2B Fit**: Medium-Low
- **Issues**:
  - "Everything sellers need to know" — B2C framing
  - "Our system covers 50+ product categories" — **OUTDATED**. Current: 9-field system, 592 codified rules, 1,233 Headings, 5,621 Subheadings, 131K tariff lines
  - "AI to automatically classify your products" — misleading. POTAL's v3 pipeline uses 0-2 AI calls, mostly codified rules (the key differentiator vs competitors)
  - No mention of 100% accuracy with 9 fields, no accuracy formula, no field importance (material +45%)
  - No code examples (curl, SDK)
  - "batch API to classify your entire catalog" — mentioned but no details
  - No competitive positioning
- **What Works**: HS Code structure explanation (2/4/6/8-10 digit) is correct and useful
- **Keyword Gaps**: Missing "HS code API", "automated HS classification", "HS code lookup API", "product classification API", "GRI classification"
- **CTA Change**: Should include API request/response example showing 9-field input → HS code output

### Post 3: "De Minimis Thresholds by Country (2026): A Strategic Guide for Sellers"
- **Slug**: `de-minimis-thresholds-2026`
- **B2B Fit**: Low
- **Issues**:
  - Entirely B2C: "Strategic Pricing for Sellers", "price products below de minimis thresholds"
  - Shallow: only 6 countries listed (POTAL covers 240)
  - No API integration angle — how a developer would use /calculate endpoint with de minimis auto-detection
  - No mention of POTAL's 240-country de_minimis_thresholds database
  - US de minimis: doesn't mention CN $0 vs non-CN $800 distinction (critical regulatory update)
  - No mention of IOSS (EU €150 threshold interaction)
- **What Works**: The concept is universally relevant. De minimis is a key feature of POTAL
- **Keyword Gaps**: Missing "de minimis API", "customs threshold API", "duty-free shipping API"
- **CTA Change**: Current → Should show API response example with `de_minimis_applied: true`

### Summary Table

| Post | Title | B2B Fit | Priority Fix |
|------|-------|---------|-------------|
| 1 | Total Landed Cost | Medium | Update numbers, add API examples, retarget to developers |
| 2 | HS Code Classification | Medium-Low | Major rewrite — outdated claims ("50+ categories"), missing 9-field/100% accuracy story |
| 3 | De Minimis Thresholds | Low | Needs complete B2B reframing + expand from 6 to 240 countries + API angle |

---

## Step 2: Blog Infrastructure Analysis

### Metadata/OG/Twitter
- **Blog landing** (`app/blog/page.tsx`):
  - Title: "Cross-Border Commerce Guides for Sellers" — B2C tone
  - Keywords: `['total landed cost', 'HS code classification', 'import duties guide', 'cross-border commerce', 'e-commerce seller guide', 'international trade']` — missing B2B API keywords
  - OG image: `/og-image.png` — generic, no blog-specific image
  - Twitter card: summary_large_image — OK
  - Canonical: `https://potal.app/blog` — OK (note: uses potal.app, not www.potal.app)

- **Individual posts** (`app/blog/[slug]/page.tsx`):
  - Keywords: `[post.category, 'total landed cost', 'cross-border commerce', 'POTAL']` — only 4 keywords, same for all posts
  - OG type: `article` — correct
  - publishedTime: uses post.date string ("March 1, 2026") — should be ISO 8601 format for proper parsing
  - Missing: `article:section`, `article:tag` properties

### JSON-LD Schema
- Blog landing: `@type: Blog` — correct
- Individual posts: `@type: Article` — should be `TechArticle` for B2B developer content
- `articleBody: post.title` — **BUG**: should be the actual article body text, not the title
- Missing: `wordCount`, `keywords`, `about` properties

### Content Rendering
- **TSX hardcoded** — all 3 posts are React components in `posts.tsx`
- No MDX, no CMS, no database
- Scalability concern: adding posts requires code changes and deployment
- No RSS feed
- No comments/sharing functionality
- No tag/category filtering (categories exist in data but not filterable on landing page)
- No search functionality on blog
- No pagination (only 3 posts, not needed yet)
- No reading progress indicator
- No table of contents for long posts

### Image Handling
- No post-specific images — all use `/og-image.png`
- No next/image optimization
- No featured images in post cards

---

## Step 3: SEO Configuration Analysis

### Sitemap (`app/sitemap.ts`)
**URLs included** (17 total):
| URL | changeFrequency | priority | Assessment |
|-----|----------------|----------|------------|
| / | daily | 1.0 | OK |
| /developers | weekly | 0.9 | OK — key B2B page |
| /developers/docs | weekly | 0.9 | OK |
| /developers/quickstart | monthly | 0.8 | OK |
| /developers/playground | monthly | 0.7 | OK |
| /pricing | monthly | 0.8 | OK |
| /widget/demo | monthly | 0.7 | OK |
| /blog | weekly | 0.7 | OK |
| /blog/understanding-total-landed-cost | monthly | 0.6 | OK |
| /blog/hs-code-classification-guide | monthly | 0.6 | OK |
| /blog/de-minimis-thresholds-2026 | monthly | 0.6 | OK |
| /about | monthly | 0.6 | OK |
| /contact | monthly | 0.5 | OK |
| /help | monthly | 0.5 | OK |
| /partners | monthly | 0.5 | OK |
| /terms | monthly | 0.3 | OK |
| /privacy | monthly | 0.3 | OK |

**Missing from sitemap**:
- `/faq` — 45 Q&A items, high SEO value, not in sitemap
- `/guide` — 9-field classification guide, high B2B value, not in sitemap
- `/learn` — learning hub, not in sitemap
- `/tariff/[country]` — 240 country pages (dynamic, SSR), huge long-tail SEO potential, not in sitemap
- Individual tariff pages would generate significant organic traffic for "Japan import duty", "Australia customs tariff" etc.

**Issues**:
- `lastModified: new Date()` for all URLs — should use actual last-modified dates, otherwise Google sees everything as "just updated" on every crawl (reduces trust)
- Blog posts should have static dates matching their publish dates

### Robots.txt (`app/robots.ts`)
- Allow: `/` — all public pages indexed
- Disallow: `/api/`, `/auth/`, `/dashboard`, `/settings`, `/profile` — correct
- Sitemap reference: correct
- **OK overall** — no issues

---

## Step 4: FAQ / Guide / Learn Analysis

### FAQ Page (`app/faq/page.tsx`)
- **Total questions**: 45
- **Categories**: HS Code (10), FTA (5), VAT (5), API (5), Pricing (5), Troubleshooting (5), Compliance (5), General (5)
- **B2B relevance**: HIGH — already well-targeted
  - API-specific questions (how to get API key, endpoints, batch API, SDKs, rate limits)
  - Technical troubleshooting (401 errors, low confidence, currency conversion)
  - Accurate POTAL numbers: "~148 endpoints", "200 lookups/mo Free", "131,794 tariff lines"
  - 9-field classification system explained with accuracy formula
  - Compliance section (sanctions, AD/CVD, ICS2, Type 86, dangerous goods)
- **Issues**:
  - Title is "Knowledge Base" not "FAQ" — fine for B2B
  - No JSON-LD FAQPage schema — **critical SEO miss** (Google shows FAQ rich snippets directly in search results)
  - Wait — checking layout... The faq layout.tsx may have it. But the page.tsx itself is client-side ('use client') so any JSON-LD would need to be in layout.tsx
  - `~148 endpoints` — should be updated to `~155+` per latest CLAUDE.md
  - No link to API docs from answers
- **Verdict**: Already B2B-ready. Needs JSON-LD FAQPage schema and minor number updates.

### Guide Page (`app/guide/page.tsx`)
- **Content**: 9-field classification input guide
- **B2B relevance**: VERY HIGH — this is exactly what API integrators need
- **Strengths**:
  - All 9 fields documented with legal basis, format, validation rules, examples, common mistakes
  - Accuracy formula shown: product_name(+18%) + material(+45%) + category(+33%) + description(+4%) = 100%
  - WCO 21 Sections reference table
  - 70+ accepted weight/specification units
  - CTA links to API docs and "Get API Key"
- **Issues**:
  - Dark theme (background: #0a0a0a) — inconsistent with rest of site (white/light)
  - Not in sitemap
  - No metadata export — missing title, description, OG tags (critical SEO miss)
  - Page title just says "Classification Guide" — should be "9-Field HS Code Classification Guide | POTAL API"
  - No JSON-LD (HowTo or TechArticle schema would be valuable)
- **Verdict**: Excellent B2B content. Needs metadata, sitemap inclusion, and JSON-LD schema.

### Learn Page (`app/learn/page.tsx`)
- **Content**: Learning hub with video placeholders, guide links, certification teaser
- **B2B relevance**: Medium-High
- **Strengths**:
  - Links to Quick Start, API Reference, SDK docs, Knowledge Base
  - Video titles are developer-focused ("Getting Started with POTAL API", "Setting Up Webhooks")
  - Certification program teaser
- **Issues**:
  - "Video content coming soon" — all 5 videos are placeholders with no actual content
  - Certification "Join Waitlist" links to `/certification` — likely a dead page
  - Not in sitemap
  - Static metadata is generic
  - No actual educational content — it's a link hub
- **Verdict**: Placeholder page. Needs actual content or should be hidden until ready.

---

## Step 5: B2B SEO Strategy Recommendations

### 1. KEEP (B2B-ready, minimal changes needed)
- **FAQ page** — already has 45 well-written B2B questions. Add JSON-LD FAQPage schema, update numbers
- **Guide page** — excellent 9-field documentation. Add metadata, add to sitemap
- **Sitemap structure** — developer pages correctly prioritized (0.9)
- **Robots.txt** — properly configured

### 2. MODIFY (tone/keyword/CTA changes needed)

**Blog landing page**:
- Title: "Cross-Border Commerce Guides for Sellers" → "POTAL Blog — Landed Cost API Guides & Trade Compliance"
- Hero: "Cross-Border Commerce Made Simple" → "Build Cross-Border Commerce Infrastructure"
- Subtitle: "Expert guides for e-commerce sellers" → "API integration guides, HS classification tutorials, and trade compliance resources for developers and businesses"
- Keywords: Add "landed cost API", "HS code API", "customs duty API", "trade compliance API"
- CTA: Keep "Get Started Free" → /developers but add secondary "Read API Docs" CTA

**Post 1 (Total Landed Cost)**:
- Title: Add "API" — "Understanding Total Landed Cost: API Integration Guide"
- Add: curl example showing /calculate endpoint request/response
- Add: POTAL numbers (240 countries, 113M+ tariff records, <120ms response)
- Add: Competitor comparison section (Avalara $1,500/mo vs POTAL Free-$300)

**Post 2 (HS Code)**:
- Title: "HS Code Classification API: 9-Field System for 100% Accuracy"
- Rewrite: Remove "50+ categories" claim, replace with 9-field system, 592 rules, 131K tariff lines
- Add: Accuracy formula (material +45%, category +33%)
- Add: Code example (curl + response JSON)
- Add: "POTAL uses codified WCO rules, not AI guessing" differentiator

**Post 3 (De Minimis)**:
- Title: "De Minimis Thresholds API: 240-Country Coverage with Auto-Detection"
- Expand: 6 countries → comprehensive table or link to API
- Add: US CN $0 vs non-CN $800 update
- Add: IOSS integration
- Add: API example showing de_minimis_applied in response

**JSON-LD schemas**:
- Blog posts: `Article` → `TechArticle`
- Fix `articleBody: post.title` bug → use actual content text
- Add `datePublished` in ISO 8601 format

**Sitemap additions**:
- Add `/faq` (priority 0.7)
- Add `/guide` (priority 0.8)
- Add `/learn` (priority 0.5)
- Consider adding dynamic `/tariff/[country]` URLs for long-tail SEO

### 3. CREATE NEW (B2B-targeted blog posts)

**Top 10 recommended new posts** (ordered by SEO value):

| # | Title | Target Keyword | Type |
|---|-------|---------------|------|
| 1 | "How to Integrate POTAL Landed Cost API: Quick Start for Developers" | `landed cost API integration` | Tutorial |
| 2 | "HS Code Classification API vs Manual Classification: Why 9 Fields Beats AI Guessing" | `HS code classification API` | Comparison |
| 3 | "Building a Cross-Border Checkout with POTAL: Shopify, WooCommerce, Custom" | `cross-border checkout API` | Tutorial |
| 4 | "Understanding Customs Duty APIs: POTAL vs Avalara vs Zonos" | `customs duty API comparison` | Comparison |
| 5 | "How POTAL Achieves 100% HS Code Accuracy with Zero AI Calls" | `HS code accuracy` | Technical Deep-Dive |
| 6 | "MCP Server for Trade Compliance: How AI Agents Use POTAL" | `MCP server customs` | Technical |
| 7 | "Anti-Dumping & Countervailing Duties API: 119K+ Trade Remedy Cases" | `anti-dumping duty API` | Feature Guide |
| 8 | "Sanctions Screening API: OFAC, BIS, EU, UN in One Endpoint" | `sanctions screening API` | Feature Guide |
| 9 | "FTA Optimization API: How to Automatically Find Lower Duty Rates" | `FTA duty rate API` | Feature Guide |
| 10 | "Section 301 Tariffs on Chinese Goods: API-Driven Compliance" | `section 301 tariff API` | Topical/Compliance |

**Additional high-value posts** (next priority):
- "IOSS Compliance API for EU E-Commerce: Automatic VAT Collection"
- "DDP vs DDU Shipping: API-Powered Decision Making"
- "Building a Landed Cost Widget: JavaScript SDK Tutorial"
- "Batch HS Code Classification: Processing 5,000 Products via API"
- "Real-Time Exchange Rate API for Cross-Border Pricing"

**Content format recommendations for new posts**:
- Every post should include at least one curl/SDK code example
- Every post should include an API response JSON sample
- Link to /developers/docs, /guide, /faq in each post
- Include "Try it now" links to /developers/playground
- Add "Updated [date]" to show freshness
- Target 1,500-2,500 words for SEO depth

### 4. DELETE / DEPRECATE

- **Nothing to delete** — all 3 existing posts have salvageable content
- **Learn page videos**: Should be hidden or replaced with "Coming Soon" banner until actual videos exist. Placeholder video cards with play buttons look misleading
- **Learn certification link** (`/certification`): Verify if page exists; if not, remove or grey out

---

## Additional Technical SEO Issues

### Canonical URL inconsistency
- Sitemap uses `https://potal.app` (no www)
- Production is `https://www.potal.app`
- Blog metadata uses `https://potal.app`
- **Should be consistent** — pick one (www or non-www) and 301 redirect the other

### Blog scalability
- Posts are TSX components hardcoded in `posts.tsx`
- Adding a new post requires: write TSX component, add to array, deploy
- **Recommendation**: For 10+ posts, consider MDX files or a lightweight CMS (Notion API, Contentlayer, or even just .md files with gray-matter)
- Low priority — current system works for <10 posts

### Missing structured data
- No BreadcrumbList schema on any page
- No Organization schema on homepage
- FAQ page missing FAQPage schema (high-value for Google rich snippets)

### Open Graph image
- All pages share `/og-image.png` — no page-specific images
- Blog posts should ideally have unique OG images for social sharing differentiation

---

## Priority Action Items

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| P0 | Add `/faq`, `/guide` to sitemap | High (SEO indexing) | 5 min |
| P0 | Add JSON-LD FAQPage schema to FAQ page | High (Google rich snippets) | 15 min |
| P0 | Add metadata to Guide page (title, description, OG) | High (SEO) | 10 min |
| P0 | Fix `articleBody: post.title` bug in blog JSON-LD | Medium (schema correctness) | 5 min |
| P1 | Update blog landing page metadata for B2B keywords | Medium (SEO targeting) | 15 min |
| P1 | Rewrite Post 2 (HS Code) — outdated claims, missing 9-field story | High (credibility) | 1 hour |
| P1 | Update Post 1 (TLC) — add API examples, numbers | Medium | 30 min |
| P1 | Update Post 3 (De Minimis) — expand countries, add API angle | Medium | 30 min |
| P2 | Write new Post: "How to Integrate POTAL API: Quick Start" | High (conversion) | 2 hours |
| P2 | Write new Post: "POTAL vs Avalara vs Zonos" | High (competitive SEO) | 2 hours |
| P2 | Fix canonical URL consistency (www vs non-www) | Medium (SEO) | 15 min |
| P3 | Add BreadcrumbList schema to all pages | Low | 30 min |
| P3 | Blog infra: consider MDX migration for scalability | Low (only 3 posts now) | 4 hours |
| P3 | Create page-specific OG images for blog posts | Low | 1 hour |
