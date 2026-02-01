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

### A. Dynamic Brand Filter (Cost: $0)
- **Logic:** `extractBrandsFromProducts`
- **Rule:** Analyze `brand` or `title` from the *currently loaded* API results. Extract top 10 frequent brands.
- **Constraint:** Do NOT use LLM/GPT for inference.

### B. Zipper Ranking Algorithm (Interleave)
- **Scope:** Applied within each Tab (Domestic / Global).
- **Rule:** Interleave Top 1 items from each platform, then Top 2, and so on.

### C. Pagination (Infinite Scroll)
- **Trigger:** User clicks "👇 Show More Results".
- **Action:** Fetch API Page N+1 -> Append to list.
