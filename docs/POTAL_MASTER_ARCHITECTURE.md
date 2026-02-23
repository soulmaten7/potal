# POTAL 2.0 — Master Architecture Document
### AI Shopping Intelligence Agent
> Last Updated: 2026-02-23
> Status: MVP Complete — Production Live at potal.app

---

## 1. Identity & Core Principles

**What POTAL Is:**
A Skyscanner-style shopping decision tool — NOT a shopping site.
Users come in with a product in mind, compare across Domestic (US) and Global platforms, and decide.

**What POTAL Is NOT:**
- Not a shopping mall (no browsing/trending/recommendations)
- Not a price tracker (no alerts, no price history features)
- Not a personalized feed (no beginner/pro segmentation)

**Absolute Rules:**
- Target: US Residents (never interpret from Korean perspective)
- Transparency: 100% of API data shown. Never hide information.
- Equal Access: Every user sees the same objective results. No skill-level segmentation.
- Calculator Principle: Same input = Same output, regardless of who searches.
- "International" is banned. Always use "Global".
- No product detail page. All decisions happen on search results.
- PC First (1440px). Mobile optimization later.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT                            │
│         Text / Image / Natural Language Query             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              LLM PRE-THINK LAYER (✅ 구현 완료)            │
│  "What product is the user looking for?"                 │
│                                                          │
│  Step 1: Intent Router (intent-router.ts)                │
│    → 5가지 의도 분류: PRODUCT_SPECIFIC, PRODUCT_CATEGORY,│
│      COMPARISON, QUESTION, PRICE_HUNT                    │
│    → GPT-4o-mini + deterministic fallback                │
│                                                          │
│  Step 2: QueryAgent (deterministic, $0 비용)             │
│    → isQuestionQuery v3 (브랜드/상품명 우선 감지)        │
│    → analyzeQueryDeterministic (카테고리, 가격, 전략)    │
│    → 가격 오타 허용 (dollors/bucks → $)                  │
│    → 플랫폼별 쿼리 최적화 (AliExpress 용어 변환)        │
│                                                          │
│  Step 3: AnalysisAgent (AI, 복잡한 쿼리만)               │
│    → shouldUseAIAnalysis()가 true일 때만 호출            │
│                                                          │
│  Image query (photo upload) → Phase 2                    │
│  Model: GPT-4o-mini (~$0.001/search)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            PARALLEL SEARCH (Provider Layer) ✅             │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Amazon   │ │ Walmart  │ │ eBay     │ │AliExpress│   │
│  │ Provider │ │ Provider │ │ Provider │ │ Provider │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐                                            │
│  │ Target   │  + BestBuy/Temu/Shein (Phase 2 비활성)    │
│  │ Provider │                                            │
│  └──────────┘                                            │
│                                                          │
│  Each provider:                                          │
│  1. Calls API with optimized search terms                │
│  2. Normalizes data to unified Product schema            │
│  3. Applies platform-specific fraud rules (Stage 1)      │
│  4. Returns normalized products                          │
│                                                          │
│  Plugin Architecture: Add new providers by creating      │
│  one file that implements the Provider interface.         │
│  Interface accepts country/currency params for            │
│  future global expansion.                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│          COST CALCULATION ENGINE                          │
│                                                          │
│  For each product:                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Product Price (from API)                         │    │
│  │ + Shipping Cost (API or estimated by zip)        │    │
│  │ + Import Duty (Global: $800 de minimis rule)     │    │
│  │ + Sales Tax (by state, from zip code)            │    │
│  │ ─────────────────────────────────────            │    │
│  │ = Total Landed Cost                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Static data (daily batch): exchange rates, duty rates   │
│  Dynamic data (real-time): product price, availability   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│          INTELLIGENCE LAYER                               │
│                                                          │
│  ┌── Ranking Engine ──────────────────────────────┐     │
│  │ Best Score = (Price × W1) + (Speed × W2)       │     │
│  │            + (Seller Trust × W3)                │     │
│  │            + (Match Accuracy × W4)              │     │
│  │            + (Return Policy × W5)               │     │
│  │                                                 │     │
│  │ Default: W1=0.35, W2=0.25, W3=0.20,           │     │
│  │          W4=0.15, W5=0.05                       │     │
│  │                                                 │     │
│  │ User profile (price↔speed slider) adjusts      │     │
│  │ W1 and W2 proportionally.                       │     │
│  │                                                 │     │
│  │ Fastest: Pure delivery speed sort               │     │
│  │ Cheapest: Pure Total Landed Cost sort           │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌── AI Filter Generator ─────────────────────────┐     │
│  │ Analyzes all search results at once             │     │
│  │ Auto-generates relevant filters:                │     │
│  │   Brand: Sony | Bose | JBL | ...               │     │
│  │   Type: Over-ear | In-ear | On-ear              │     │
│  │   Color: Black | White | Silver (from variants) │     │
│  │   Category: Main Product | Accessories          │     │
│  │                                                 │     │
│  │ Model: GPT-4o-mini / Claude Haiku               │     │
│  │ Cost: ~$0.002-0.005 per search                  │     │
│  │ Timeout: 2s (fail-safe: show without filters)   │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌── Fake Detector (3-Stage) ─────────────────────┐     │
│  │                                                 │     │
│  │ STAGE 1: Instant Remove (rule-based, $0 cost)   │     │
│  │ - Price = $0 or null (variant price trick)      │     │
│  │ - No image                                      │     │
│  │ - Title < 5 chars                               │     │
│  │ - Platform-specific rules (see Section 4)       │     │
│  │                                                 │     │
│  │ STAGE 2: AI Brand Filter                        │     │
│  │ - AI extracts legitimate brands from results    │     │
│  │ - User clicks brand → knockoffs filtered out    │     │
│  │ - "Nikee", "SQNY" naturally excluded            │     │
│  │                                                 │     │
│  │ STAGE 3: Trust Signal (POTAL icon)              │     │
│  │ - Price < 30% of category average               │     │
│  │ - Seller rating < 3.0 or reviews = 0            │     │
│  │ - Brand name typo detected by AI                │     │
│  │ - Explanation via top info icon (not per-item)   │     │
│  │                                                 │     │
│  │ NOT shown as Trust Signal:                      │     │
│  │ - Review count vs rating mismatch (internal)    │     │
│  │ - Long titles / keyword stuffing (internal)     │     │
│  └─────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│          PRESENTATION LAYER                               │
│                                                          │
│  Search Results Page:                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [Best: $278·3d] [Cheapest: $189·14d] [Fastest]  │    │
│  │  ← Dynamic values from actual search results →   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌──────────────────┬──────────────────────────────┐    │
│  │ AI Filter Panel  │  🇺🇸 Domestic  |  🌏 Global    │    │
│  │ ┌─────────────┐ │  ┌──────────┐  ┌──────────┐  │    │
│  │ │ Brand       │ │  │Product   │  │Product   │  │    │
│  │ │ Type        │ │  │Card      │  │Card      │  │    │
│  │ │ Color       │ │  │w/ Total  │  │w/ Total  │  │    │
│  │ │ Price Range │ │  │Landed    │  │Landed    │  │    │
│  │ │ Category    │ │  │Cost      │  │Cost      │  │    │
│  │ └─────────────┘ │  └──────────┘  └──────────┘  │    │
│  └──────────────────┴──────────────────────────────┘    │
│                                                          │
│  Info Icons (top-level explanations):                    │
│  - ℹ️ "How Best is ranked" (scoring criteria)            │
│  - ℹ️ "Sales Tax Info" (Domestic)                        │
│  - ℹ️ "Import Tax Info" (Global, Section 321)            │
│  - ⚠️ "Trust Signal explained" (what warnings mean)      │
│                                                          │
│  NO per-item explanation text.                           │
│  NO comparison phrases ("$15 more but 2 days faster").   │
│  Data is shown accurately; user judges for themselves.   │
└─────────────────────────────────────────────────────────┘

```

---

## 3. Variant / Option Handling

**Problem:** Same product listed with options at different prices. API returns base price ($0 or misleading).

**Solution — 3-Stage:**

**Stage 1 — Price Normalization (server-side, rule-based):**
- base_price = $0 AND variant prices exist → use lowest variant price as display price
- variant price range significant → show "$8.99 ~ $25.99" format
- variant prices all identical → show single price

**Stage 2 — AI Filter Integration:**
- AI extracts common options from variants (Color, Size, Storage, etc.)
- Options appear as filter chips in AI Filter Panel
- User clicks "Black" → all products show Black variant price
- User clicks "256GB" → all products show 256GB variant price

**Stage 3 — Accessory Separation:**
- AI categorizes results: Main Product vs Accessories
- Filter: "Category: Main Product | Accessories"
- Default view can prioritize Main Product

---

## 4. Platform-Specific Fraud Rules

### Amazon
| Rule | Action |
|------|--------|
| price = $0 or null | REMOVE |
| review_count > 500 AND product_age < 30 days | TRUST SIGNAL (zombie listing) |
| "Fulfilled by Amazon" before March 2026 | Note: commingled inventory possible |
| title contains "box only", "empty box" | REMOVE |

### eBay
| Rule | Action |
|------|--------|
| title contains "box only", "photo of", "empty" | REMOVE |
| condition = "for parts or not working" | TRUST SIGNAL |
| price = $0 with option variants | Use variant price |

### AliExpress
| Rule | Action |
|------|--------|
| store_age < 90 days | TRUST SIGNAL |
| "genuine leather"/"silk"/"gold" AND price < 20% of category avg | TRUST SIGNAL |
| price = $0 with option variants | Use variant price |

### Temu
| Rule | Action |
|------|--------|
| discount > 90% (original vs current) | Show current price only, hide fake "original" |
| price = $0 | REMOVE |

### Walmart
| Rule | Action |
|------|--------|
| third-party seller AND no seller ratings | TRUST SIGNAL |
| price = $0 | REMOVE |

---

## 5. AI Model Strategy (Cost Optimization)

| Task | Model | Cost/call | When |
|------|-------|-----------|------|
| Query pre-think (search term generation) | Claude Haiku / GPT-4o-mini | ~$0.001 | Every search |
| AI Filter generation | GPT-4o-mini | ~$0.003 | Every search |
| Fake detection (Stage 2-3) | GPT-4o-mini | ~$0.002 | Every search |
| Image search (Vision) | GPT-4o / Claude Sonnet | ~$0.02 | Image uploads only |
| Best Score explanation (top icon) | GPT-4o-mini | ~$0.002 | Every search |

**Estimated monthly cost at 1,000 searches/day:** ~$150-250 for AI + API subscriptions

---

## 6. Data Collection (✅ Phase 1 구현 완료)

**SearchLogger (fire-and-forget, 검색 블로킹 없음):**

### search_logs 테이블 (18 컬럼):
- session_id, query, intent, confidence, strategy
- category, price_intent, provider_results (JSON)
- total_results, ai_analysis_used, filter_generated
- error_occurred, error_message, duration_ms
- user_agent, country, created_at

### search_signals 테이블 (7 컬럼):
- search_id (→ search_logs.id FK), signal_type, signal_data (JSON)
- product_id, provider, created_at

### Signal Types:
- click, add_to_wishlist, remove_from_wishlist
- filter_use, sort_change, show_more, dwell_time

**Purpose (NOT shown to users):**
- Phase 2: 주간 메트릭스 자동 분석
- Phase 3: 실패 패턴 자동 감지 → 규칙 자동 수정
- Phase 4+: 모델 파인튜닝용 학습 데이터
- Affiliate revenue optimization

---

## 7. User Profile (Minimal)

**Only ONE preference setting:**
- Slider: 💰 Price ↔ ⚡ Speed
- Adjusts Best Score weights W1 (price) and W2 (speed) proportionally
- Default: centered (balanced)

**NO segmentation by:**
- Shopping experience level (beginner/pro)
- Risk tolerance
- Category preferences

**Everyone sees the same objective results.** The slider only adjusts the RELATIVE weight between price and speed in Best ranking.

---

## 8. Implementation Phases

### Phase 1: Data Foundation ✅ COMPLETE
- [x] 5개 Provider 구현 (Amazon, Walmart, eBay, Target, AliExpress) + 3개 비활성 (BestBuy, Temu, Shein)
- [x] Total Landed Cost calculation engine (CostEngine)
- [x] Platform-specific fraud rules (FraudFilter — 규칙 기반)
- [x] API key security (.env.local + Vercel env)
- [x] Background data collection to Supabase (SearchLogger Phase 1)

### Phase 2: AI Brain ✅ COMPLETE
- [x] Intent Router (5가지 의도 분류 + deterministic fallback)
- [x] QueryAgent (deterministic 쿼리 분석 + 가격 오타 허용)
- [x] AnalysisAgent (GPT-4o-mini, 복잡한 쿼리만)
- [x] Product Judge (AI 품질/관련성 판단)
- [x] Best/Fastest/Cheapest scoring algorithm (ScoringEngine)
- [x] AI Filter auto-generation (Smart Filter)
- [x] Dynamic tab values (실시간 데이터 기반)

### Phase 3: UX/UI & Polish ✅ COMPLETE
- [x] 검색 결과 페이지 (모바일 2열 + PC 3열)
- [x] Product card (MobileCompactCard — Total Landed Cost 표시)
- [x] PWA 설정 (manifest.json + service worker)
- [x] 프로필 페이지 (2x2 그리드 + Zipcode)
- [x] 위시리스트 (localStorage + Supabase 동기화)
- [ ] Image search capability → Post-MVP
- [ ] User profile price↔speed slider → Post-MVP

### Phase 4: Launch ✅ COMPLETE (potal.app LIVE)
- [x] Security audit (Open Redirect 방어, 프롬프트 인젝션 방어, RLS)
- [x] GA4 event tracking (12개 이벤트)
- [x] Error Boundary (app/error.tsx)
- [x] AI Quality Test (90/90 통과)
- [x] Live QA (3건 버그 수정 완료)
- [x] Production deploy (Vercel Pro → potal.app)
- [ ] SEO + OG tags → Post-MVP
- [ ] Google Play Console / Apple Developer → 대기 중

---

## 9. Revenue Model

**Phase 1:** Affiliate revenue (Amazon Associates, eBay Partner Network, AliExpress Affiliate, etc.)
**Phase 2:** Premium features (unlimited searches, priority API calls)
**Phase 3:** B2B data licensing (cross-platform pricing intelligence)

---

## 10. Design Philosophy (Obsidian & Amber)

- Header: Dark Navy (#02122c), 120-160px height
- Accent: Amber (#F59E0B)
- Max Width: 1440px
- Grid: 3-col max on PC for product image visibility
- Ranking: Zipper interleaving for fairness within Domestic/Global
- Mobile: 2-col grid (grid-cols-2), Mobile background: #02122c (Dark Navy)
- Desktop: background #f1f2f8 (Light)
- Clean, minimal, no unnecessary decorations

---

*This document reflects all discussions between the Project Owner and Claude (2026-02-23).*
*MVP Complete. potal.app LIVE. Phase 1 Learning System deployed.*
*Any future changes should be logged with date and reasoning.*
