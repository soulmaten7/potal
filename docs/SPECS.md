# POTAL Technical Specifications (SPECS.md)

## 1. Mall Classification (Target: US Market)

### 🇺🇸 Domestic Malls (13+)
*Shipped from US Warehouses / Fast Delivery*
- **Marketplaces:** Amazon, Walmart, eBay (US Sellers), Target
- **Category Killers:** Best Buy (Tech), Home Depot (DIY), Lowe's (DIY), Wayfair (Furniture), Sephora (Beauty), Chewy (Pet), Newegg (PC), iHerb (Nutrients)
- **Retail:** Costco, Macy's, Kohl's

### 🌏 Global Malls (5+)
*Cross-border / Low Cost / Slow Delivery*
- **Platforms:** AliExpress, Temu, Shein, DHgate, YesStyle

## 2. Delivery Badge System (Standardization)

| Mall | Trigger Keyword | Label | Color (Tailwind) |
| :--- | :--- | :--- | :--- |
| **Amazon** | `is_prime: true` | 🚀 2-Day | `text-[#146eb4] font-bold` |
| **AliExpress** | `is_choice: true` | ⚡ 5-7 Days | `text-[#FF6600] font-bold` |
| **Temu** | `shipping: 'Free'` | 📦 Standard | `text-[#FB7701] font-bold` |
| **Walmart** | `is_wplus: true` | 🚀 2-Day | `text-[#0071DC] font-bold` |
| **eBay** | `Fast` / `Expedited` | 🏅 Expedited | `text-[#e53238] font-bold` |
| **Best Buy** | `Pickup` | 🏪 Store Pickup | `text-[#FFF200] bg-black` |
| **Target** | `RedCard` | 🚀 2-Day | `text-[#CC0000] font-bold` |
| **iHerb** | `Global Air` | ✈️ 3-5 Days | `text-[#458500] font-bold` |

## 3. Core Logic Specifications

### A. AI Smart Filters (Real Data Only) — 지난 논의 반영
- **원칙:** LLM/GPT 미사용. 검색 결과로 **현재 로드된 상품 데이터**만 사용하여 필터 옵션 생성. (비용·환각 방지)
- **로직:** `extractFilterOptionsFromProducts(products)` — 검색 API 응답 후 한 번만 실행, DB/API 추가 호출 없음.
- **Specs / Condition / Model·Series:** `FILTER_KEYWORD_CANDIDATES`에 정의된 키워드 중 **상품 Title에 실제로 등장한 것만** 필터에 노출.
- **Brands:** `extractBrandsFromProducts` — 상품 `brand` 또는 title 첫 단어 기준 상위 10개, **블랙리스트**(Search, Generic, Brand, N/A 등) 제외.
- **Constraint:** `generate-filters` API 호출 없음. 프론트에서 메모리 내 상품만 분석.

### B. Zipper Ranking Algorithm (Interleave)
- **Scope:** Applied within each Tab (Domestic / Global).
- **Rule:** Interleave Top 1 items from each platform, then Top 2, and so on.

### D. Mobile Home: Home-Integrated Zipper (Comparison Portal)
- **Scope:** Mobile only, when `isHomeMode === true` and tab is `all`.
- **Rule:** Do **not** split Domestic vs Global into separate sections. Build one list by **interleaving** `displayedDomestic[i]` and `displayedInternational[i]` (1:1). Result: 2-column grid shows [left: domestic, right: international] per row so users compare "US Fast" vs "Global Cheap" at a glance.
- **Header:** Single line **"Personalized Picks for You"**; hide "Domestic (Fast)" / "Global (Cheap)" titles on home.
- **Stability:** `resetToHome` → `window.location.href = '/'` (hard reload) so integrated curation view loads with `isHomeMode === true`.

### C. Pagination (Infinite Scroll)
- **Trigger:** User clicks "👇 Show More Results".
- **Action:** Fetch API Page N+1 -> Append to list.
