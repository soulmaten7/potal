# PIPELINE: Insurance & Shipping (Freight, Surcharges, Incoterms, CIF)
# Last updated: 2026-03-18 KST

## Overview

Insurance and shipping costs are not just line items in a landed cost calculation — they are **inputs to the customs value** (the tax base). Under WTO Customs Valuation Agreement (Article 8), the CIF value (Cost + Insurance + Freight) is the assessable value for duty/tax in most countries worldwide (except US, Canada, Australia which use FOB/transaction value). Getting insurance and freight wrong means the duty base is wrong, which cascades into incorrect duty and tax amounts. The practitioner process requires transport mode determination, freight calculation by weight/volume, surcharge assessment, insurance by risk profile, Incoterms cost allocation, and final CIF value determination.

---

## Step 1: Transport Mode Determination (Air/Sea/Land/Express)

- **Practitioner action**: Determine the transport mode based on origin-destination pair, product characteristics (weight, dimensions, perishability, hazmat classification), value/weight ratio, and urgency. The transport mode affects: (a) which freight calculation method applies (per-kg vs CBM vs zone-based), (b) which surcharges apply, (c) insurance rates, (d) which Incoterms are valid (FAS/FOB/CFR/CIF are sea-only), and (e) transit time.
- **Current code**:
  - `insurance-calculator.ts:32` — accepts optional `shippingMode: 'air' | 'sea' | 'land'` parameter
  - `shipping-calculator.ts:101` — accepts optional `mode: 'express' | 'standard' | 'economy'` parameter (service tier, not transport mode)
  - `GlobalCostEngine.ts:103-104` — `shippingTerms` field on input, but no `transportMode` field
  - `incoterms.ts:27` — `SEA_ONLY` set for FAS/FOB/CFR/CIF validation
  - No automatic transport mode inference from origin/destination/product
- **Method**: CODE (caller-supplied or defaulted)
- **Data source**: None (no transport mode decision logic)
- **GAP**: **HIGH**.
  1. **No transport mode field in the main API input**. `GlobalCostInput` has `shippingTerms` but not `transportMode`. The shipping calculator uses `mode` (service tier: express/standard/economy), which conflates carrier service level with physical transport mode (a DHL Express shipment is still air freight).
  2. **No automatic mode inference**. A practitioner selects mode based on: value density (high-value lightweight = air), perishability (food = air), weight (>100kg = sea for cost), origin-destination (same continent = possible land/rail). None of this logic exists.
  3. **Transport modes are inconsistent across modules**. Insurance uses `'air' | 'sea' | 'land'`, shipping uses `'express' | 'standard' | 'economy'`, Incoterms uses free-text `transportMode` string. There is no shared enum or type.
  4. **Missing modes**: Rail freight (significant for EU-China via Trans-Siberian/China-Europe railway), multimodal/intermodal (container moves sea→rail→truck), and courier/express as a distinct mode.

---

## Step 2: Freight Calculation (Actual Weight vs Volumetric, CBM, Zone-Based)

- **Practitioner action**: Calculate freight cost based on the carrier's billing method:
  - **Air freight**: Billed weight = MAX(actual weight, volumetric weight). Volumetric = L x W x H / 5000 (IATA standard) or /6000 (some carriers). Rate per chargeable kg by route/zone.
  - **Ocean freight**: Billed by CBM (cubic meter) for LCL, or per container (20'/40'/40'HC) for FCL. Minimum bill of 1 CBM for LCL.
  - **Express/courier**: Zone-based pricing with weight brackets. Each carrier has its own zone matrix (DHL has 10 zones, FedEx has 8, UPS has zones by country pair).
  - **Land freight**: Per-pallet, per-truck (FTL), or per-kg (LTL). Distance-based surcharges.
- **Current code**:
  - `shipping-calculator.ts:52-57` — `calculateDimWeight()`: `L * W * H / 5000` (IATA standard, cm). Returns volumetric weight.
  - `shipping-calculator.ts:77-83` — `billedWeight = Math.max(actualWeight, dimWeight)`. Correct greater-of logic.
  - `shipping-calculator.ts:22-29` — `REGIONAL_RATES`: 7 route groups (NA-EU, NA-ASIA, EU-ASIA, NA-NA, EU-EU, ASIA-ASIA, DEFAULT). Rates per kg for express/standard/economy tiers. Example: NA-EU express = $12/kg, standard = $6/kg, economy = $3.50/kg.
  - `shipping-calculator.ts:104-117` — cost range = `base * billedWeight * fuelPct * (0.85 to 1.15)`. Returns min/max range per tier.
  - `shipping-rates.json` — 20 specific route pairs (CN-US, CN-EU, VN-US, etc.) with 5 weight brackets each (0.5kg, 2kg, 5kg, 10kg, 30kg) and air/sea rates.
  - `shipping/rates/route.ts:24-29` — `estimateRate()` for multi-carrier comparison: `baseRate + weight * perKg * serviceMultiplier`. Uses hardcoded base rates per carrier (DHL Express: $25 base + $12/kg, USPS: $15 base + $5/kg).
- **Method**: CODE (hardcoded regional rates and weight brackets)
- **Data source**: `shipping-rates.json` (20 routes, static) + `REGIONAL_RATES` in `shipping-calculator.ts` (7 route groups, static)
- **GAP**: **CRITICAL — freight estimation is the weakest part of the TLC pipeline.**
  1. **No ocean freight CBM calculation**. The code only supports weight-based billing (per-kg). Ocean LCL freight is billed per CBM (cubic meter), typically $30-80/CBM for Asia-US. The `calculateDimWeight()` function divides by 5000 (air freight standard) but never computes CBM (L * W * H / 1,000,000 in cm). No FCL container pricing exists.
  2. **Carrier rate data is entirely hardcoded and static**. Real carrier rates change weekly/monthly. The `REGIONAL_RATES` map has 7 route groups with flat per-kg rates — this produces estimates that can be 30-100% off from actual carrier quotes. The `shipping-rates.json` file has 20 routes but caps at 30kg (no data for heavier shipments).
  3. **No carrier API integration**. DHL, FedEx, UPS, and major postal services all offer rate APIs. The `shipping/rates/route.ts` endpoint simulates 9 carriers (line 12-22) with `estimateRate()` that uses a single formula for all — this is not connected to any real carrier rate feed.
  4. **No minimum charge handling**. Most carriers have a minimum charge per shipment (e.g., DHL minimum $40, FedEx minimum $45). The code multiplies rate * weight with no floor.
  5. **Region assignment is coarse**. `getRegion()` (line 42-50) assigns countries to 4 groups (NA/EU/ASIA/OTHER). AU and NZ are in ASIA. Middle East, Africa, South America, Central America all map to "OTHER" (which gets DEFAULT rates). A shipment from Brazil to Argentina would use the same rate as Nigeria to Iceland.
  6. **`shipping-rates.json` is not used by the main engine**. The `estimateShipping()` function in `shipping-calculator.ts` uses `REGIONAL_RATES`, not the more granular `shipping-rates.json`. The JSON file appears to be unused in the TLC pipeline.
  7. **No land freight calculation**. The `getRegion()` function and rate tables assume air/sea. Cross-border land freight (US-CA, US-MX, EU intra, CN-Southeast Asia) has entirely different cost structures.

---

## Step 3: Surcharges (Fuel, Security, Currency, Peak Season)

- **Practitioner action**: Add applicable surcharges to the base freight cost. Standard surcharges include:
  - **Fuel surcharge (FSC)**: Variable, published monthly by carriers. Currently 15-20% for air, 10-15% for ocean. Based on jet fuel / bunker fuel index.
  - **Security surcharge**: Post-9/11 for air freight. Typically $0.05-0.15/kg.
  - **Currency adjustment factor (CAF)**: For ocean freight, compensates for exchange rate fluctuations. Varies by trade lane.
  - **Peak season surcharge (PSS)**: Oct-Dec for Asia-US/EU. Can add $500-2000/TEU for ocean, 10-30% for air.
  - **Emergency bunker surcharge (EBS)**: For ocean, during fuel price spikes.
  - **Remote area surcharge**: For deliveries outside carrier's standard service area. $15-50 per shipment.
  - **Overweight/oversize handling**: For pieces exceeding standard dimensions or weight.
  - **Dangerous goods surcharge**: For hazmat products. $25-100+ per shipment.
  - **Residential delivery surcharge**: For non-commercial addresses. $4-8 per shipment.
- **Current code**:
  - `shipping-calculator.ts:87-99` — three surcharges implemented:
    - Fuel: 15% flat (`fuelPct = 0.15`, line 88). Applied to base cost.
    - Remote area: flat $15 for 6 countries (IS, GL, FO, FK, GU, AS) (line 91-94).
    - Overweight: flat $25 for >30kg (line 97-99).
  - No security, CAF, PSS, EBS, hazmat, or residential surcharges.
- **Method**: CODE (hardcoded flat percentages/amounts)
- **Data source**: None (no dynamic surcharge data)
- **GAP**: **HIGH**.
  1. **Fuel surcharge is static at 15%**. Actual FSC changes monthly. DHL publishes FSC indexes per region: as of early 2026, air freight FSC ranges from 14% to 28% depending on trade lane. 15% is within range but not accurate for all routes.
  2. **No peak season surcharge**. During Oct-Dec, trans-Pacific ocean freight surcharges can add $1,000-2,000/TEU. Air freight surcharges of 20-30% are common. This alone can make the freight estimate 20%+ low during Q4.
  3. **No dangerous goods surcharge**. `insurance-calculator.ts` has a `hazmat` product category (line 5) but the shipping calculator does not add a DG surcharge for hazmat products. DG handling adds $25-150+ depending on UN class.
  4. **Remote area list is minimal**. Only 6 territories listed. Major carriers have thousands of remote-area postal codes. DHL alone lists 40,000+ remote postal codes globally.
  5. **No residential delivery surcharge**. For B2C e-commerce (POTAL's primary use case), nearly all deliveries are residential. FedEx/UPS charge $4-8 extra per residential delivery.
  6. **Surcharges are not itemized in the API response**. `shipping-calculator.ts:118-119` returns `surcharges` array, but `GlobalCostEngine.ts` does not consume this — it takes `shippingPrice` as a flat input (line 339).

---

## Step 4: Insurance Calculation (Rate by Product/Route, Mandatory Countries)

- **Practitioner action**: Calculate cargo insurance based on: (a) CIF value of goods (not FOB — insurance covers the full shipment value), (b) product category risk profile, (c) origin-destination risk corridor, (d) transport mode, (e) whether the destination country mandates insurance. Standard insurance is 0.5-3% of CIF value. Institute Cargo Clauses define three coverage levels: A (all-risk), B (named perils), C (basic). Most e-commerce uses Clause A.
- **Current code**:
  - **Dedicated module**: `insurance-calculator.ts:27-61` — `calculateInsurance()`:
    - Base rates by product category (line 7-10): electronics 1.5%, textiles 0.8%, hazmat 3%, fragile 2%, general 1%, luxury 2.5%, food 1.2%
    - Sea freight surcharge: +0.3% (line 38)
    - High-risk route surcharge: +0.5% for 10 countries (NG, SO, YE, LY, SY, IQ, AF, VE, MM, CD) (line 41)
    - Value tiers (line 46-49): <$100 min 0.5%, $1K-$10K +0.1%, $10K-$50K +0.2%, >$50K +0.2%
    - Mandatory insurance countries: BR, AR, EG, NG, IN (line 17)
  - **GlobalCostEngine integration**: `GlobalCostEngine.ts:893-903` — simplified inline calculation (does NOT use the dedicated module):
    - >$5,000: 0.5%, $1,000-$5,000: 0.8%, <$1,000: 1.5%
    - Applied to `declaredValue` (product + shipping)
    - No product category, no route risk, no mandatory check
  - **Shipping rates API**: `shipping/rates/route.ts:46` — flat 1.5% of declared value for all insurance (`declaredValue * 0.015`)
- **Method**: CODE (hardcoded rate tables)
- **Data source**: None (no external insurance data)
- **GAP**: **MEDIUM**.
  1. **GlobalCostEngine does not use the dedicated insurance-calculator.ts module**. The engine has its own inline 3-tier rate (line 896-900) that ignores product category, route risk, sea freight surcharge, and mandatory insurance countries. The dedicated module at `insurance-calculator.ts` is more sophisticated but is not called by the main TLC pipeline.
  2. **Insurance base should be CIF value, not just declared value**. The formula at line 901 uses `declaredValue` (product + shipping), which is correct for CIF. However, insurance should ideally cover 110% of CIF value (industry standard: CIF + 10% "imaginary profit"), per ICC UCP 600 and Institute Cargo Clauses.
  3. **Mandatory insurance not enforced in main engine**. The `MANDATORY_INSURANCE_COUNTRIES` set in `insurance-calculator.ts` (BR, AR, EG, NG, IN) is never checked by `GlobalCostEngine.ts`. For Brazil, Argentina, Egypt, Nigeria, and India, customs authorities require proof of insurance — omitting it would be non-compliant.
  4. **No coverage level distinction**. ICC Institute Cargo Clauses A/B/C have different rates. Clause A (all-risk) is standard for e-commerce but costs 30-50% more than Clause C. The code uses a single rate without specifying coverage.
  5. **Missing product categories for insurance**. The dedicated module covers 7 categories. Missing: pharmaceuticals (temperature-controlled, high-risk), automotive parts, chemicals (non-hazmat but sensitive), artwork/antiques (very high rate), live animals/plants, bulk commodities.

---

## Step 5: Incoterms Application (Cost Allocation Between Seller and Buyer)

- **Practitioner action**: Apply the agreed Incoterm to determine which costs the seller bears and which the buyer bears. The 11 Incoterms 2020 rules define the point of risk transfer and cost allocation for: packaging, loading, export clearance, freight, insurance, import clearance, duties, and delivery. The Incoterm affects who calculates/pays the landed cost components.
- **Current code**:
  - **Dedicated module**: `incoterms.ts:1-78`:
    - All 11 Incoterms 2020 defined with cost allocation (line 13-25): EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF
    - `getCostAllocation(incoterm)`: returns `sellerPays[]`, `buyerPays[]`, `riskTransferPoint`
    - `validateIncoterm(term, transportMode)`: checks sea-only restriction for FAS/FOB/CFR/CIF
    - `recommendIncoterm(params)`: suggests best Incoterm based on experience level + transport mode
  - **GlobalCostEngine integration**: `GlobalCostEngine.ts:930-991`:
    - `shippingTerms` input: `'DDP' | 'DDU' | 'CIF' | 'FOB' | 'EXW'` (5 of 11 Incoterms)
    - DDU/CIF/FOB/EXW treated as "buyer pays duties" (line 931)
    - `incotermsBreakdown` (line 944-1000): builds seller/buyer cost split for each term
    - `buildIncotermsComparison()` (line 1648-1681): compares DDP vs DAP vs EXW total costs
  - **API endpoint**: `/api/v1/incoterms/recommend` — recommendation and allocation lookup
- **Method**: CODE (static allocation tables)
- **Data source**: None (Incoterms definitions are standards-based, no external data needed)
- **GAP**: **MEDIUM**.
  1. **Only 5 of 11 Incoterms supported in the main engine**. `GlobalCostInput.shippingTerms` accepts DDP/DDU/CIF/FOB/EXW. Missing: FCA, CPT, CIP, DAP, DPU, FAS, CFR. Note: DDU is not even an Incoterms 2020 term (it was removed in Incoterms 2010, replaced by DAP). The dedicated `incoterms.ts` module defines all 11 but the engine only uses 5.
  2. **Incoterms comparison only covers 3 terms** (DDP/DAP/EXW at line 1664-1681). This misses the most common B2B terms: FOB and CIF. CIF is the most widely used Incoterm for ocean freight globally.
  3. **Cost allocation is display-only, does not affect calculation**. The `incotermsBreakdown` shows who pays what, but the actual TLC calculation is the same regardless of Incoterm — it always computes all costs. The distinction only appears in `dduBuyerCharges` (line 932-938) which flags costs "buyer pays at delivery." Under FOB, the seller should not even calculate freight and insurance (those are buyer's responsibility).
  4. **No Incoterm impact on CIF value for duty base**. Under EXW, the customs value must include transport and insurance costs to the port of import (added by customs if not declared). Under CIF, the invoice value already includes them. The engine does not adjust the duty base based on Incoterm.
  5. **DDU is obsolete**. The code accepts 'DDU' (line 931) but this term was superseded by DAP in Incoterms 2010. While still commonly used in e-commerce parlance, the API should map DDU→DAP and note the deprecation.

---

## Step 6: CIF Value Determination (The Tax Base for Duties)

- **Practitioner action**: Determine the CIF (Cost, Insurance, Freight) value, which is the customs value / tax base for duty calculation in most countries. CIF = FOB price + freight to port of import + insurance. For countries that use transaction value (US, CA, AU), the tax base is FOB (excluding freight and insurance). The practitioner must know which valuation method each country uses.
- **Current code**:
  - `GlobalCostEngine.ts:339-341`:
    ```
    const shippingCost = input.shippingPrice ?? 0;
    ...
    const declaredValue = productPrice + shippingCost;
    ```
    This is the duty/tax base used throughout. Insurance is NOT included in `declaredValue` — it is calculated later (line 893-903).
  - **Duty calculation** at line 475-478 uses `declaredValue` (product + shipping) as the base.
  - **VAT calculation** at line 747 uses `(declaredValue + importDuty) * vatRate`.
  - **US-specific**: `CostEngine.ts` uses product price for duty base (consistent with US FOB/transaction value method).
  - **No country-specific valuation method selection** (CIF vs FOB vs transaction value).
- **Method**: CODE (product + shipping = declared value)
- **Data source**: None (no valuation method table per country)
- **GAP**: **CRITICAL**.
  1. **Insurance is excluded from the customs value**. `declaredValue = productPrice + shippingCost` (line 341). Insurance is calculated at line 901 but never added back to the duty base. For CIF-valuation countries (EU, Japan, Korea, China, India, and ~170 others), the correct customs value is `product + freight + insurance`. This systematically under-reports the customs value and produces lower duty/tax amounts than actual.
  2. **No CIF vs FOB distinction by country**. The code uses the same `declaredValue` formula for all 240 countries. Countries using CIF valuation (most of the world) should include freight + insurance in the duty base. Countries using FOB/transaction value (US, Canada, Australia) should exclude freight and insurance. This is hardcoded nowhere.
  3. **"Declared value" terminology is misleading**. In the code, `declaredValue = product + shipping`, but in customs parlance, "declared value" means the value declared to customs (which varies by country's valuation method). This naming confusion could lead to bugs.
  4. **No customs valuation adjustments**. WTO Customs Valuation Agreement Article 8 requires additions to the transaction value: assists (tooling/molds provided by buyer), royalties/license fees, subsequent resale proceeds. The code has no mechanism for these adjustments. Article 8 adjustments are common in enterprise imports (e.g., a garment factory where the buyer provides fabric = assist).
  5. **Freight for CIF countries should be "to port of import"**, not "to buyer's door." If `shippingPrice` includes last-mile delivery within the destination country, it overstates the CIF value for duty purposes (duty should only be on freight to the border/port). No mechanism to separate international freight from domestic delivery.

---

## Data Flow Diagram

```
Seller's Product Price + Weight/Dimensions + Origin/Destination
       │
       ▼
  ┌─────────────────────────┐
  │ Step 1: Transport Mode   │  air / sea / land / express / multimodal
  │ Determination            │
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 2: Freight          │  weight-based (air) / CBM (ocean LCL) /
  │ Calculation              │  container (ocean FCL) / zone (express)
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 3: Surcharges       │  fuel + security + peak + hazmat +
  │                          │  remote + residential + oversize
  └──────────┬──────────────┘
             │
             ▼  Total Freight = Base + Surcharges
  ┌─────────────────────────┐
  │ Step 4: Insurance        │  rate by product category × route risk
  │ Calculation              │  × transport mode × value tier
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 5: Incoterms        │  Who pays freight? Insurance? Duties?
  │ Application              │  DDP: seller pays all
  │                          │  FOB: buyer pays freight + insurance + duty
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 6: CIF Value        │  CIF = FOB + Freight + Insurance
  │ Determination            │  (for ~170 CIF-valuation countries)
  │                          │  FOB = product price only
  │                          │  (for US/CA/AU transaction-value countries)
  └──────────┬──────────────┘
             │
             ▼
  Customs Value (duty/tax base) → feeds into duty rate × customs value
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/shipping/shipping-calculator.ts` | Core freight estimation: dim weight, regional rates, surcharges |
| `app/lib/cost-engine/insurance-calculator.ts` | Dedicated insurance: 7 product categories, route risk, mandatory countries |
| `app/lib/trade/incoterms.ts` | All 11 Incoterms 2020: allocation, validation, recommendation |
| `app/lib/cost-engine/GlobalCostEngine.ts:893-903` | Inline insurance (3-tier, not using dedicated module) |
| `app/lib/cost-engine/GlobalCostEngine.ts:339-341` | Declared value = product + shipping (duty base) |
| `app/lib/cost-engine/GlobalCostEngine.ts:930-991` | Incoterms cost allocation breakdown |
| `app/lib/cost-engine/GlobalCostEngine.ts:1648-1681` | Incoterms comparison builder (DDP/DAP/EXW) |
| `app/lib/data/shipping-rates.json` | 20 route-specific rate tables (unused by main engine) |
| `app/api/v1/shipping/estimate/route.ts` | Shipping estimate API |
| `app/api/v1/shipping/rates/route.ts` | Multi-carrier rate comparison API (9 carriers, simulated) |
| `app/api/v1/incoterms/recommend/route.ts` | Incoterms recommendation API |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/shipping/estimate` | POST | Freight estimate by origin/destination/weight/dimensions |
| `/api/v1/shipping/rates` | POST | Multi-carrier rate comparison (9 carriers, simulated) |
| `/api/v1/shipping/labels` | POST | Shipping label PDF generation |
| `/api/v1/shipping/tracking` | POST | Shipment tracking |
| `/api/v1/shipping/address-validation` | POST | Address validation |
| `/api/v1/shipping/branded-tracking` | POST | Branded tracking page |
| `/api/v1/incoterms/recommend` | POST | Incoterms recommendation + cost allocation |
| `/api/v1/reports/shipping-analytics` | GET | Shipping analytics report |

---

## GAP Summary

| Step | Severity | Description |
|------|----------|-------------|
| 1. Transport mode | HIGH | No transport mode field in main API; no automatic inference; inconsistent mode enums across modules |
| 2. Freight calculation | CRITICAL | No ocean CBM; static hardcoded rates; no carrier API; no minimum charge; coarse region mapping; `shipping-rates.json` unused |
| 3. Surcharges | HIGH | Only 3 of 10+ standard surcharges; static 15% fuel; no peak season; no DG; no residential |
| 4. Insurance | MEDIUM | Dedicated module not used by main engine; insurance not 110% CIF; mandatory countries not enforced |
| 5. Incoterms | MEDIUM | Only 5/11 terms in engine; DDU is obsolete; allocation is display-only, doesn't affect calculation |
| 6. CIF value | CRITICAL | Insurance excluded from customs value; no CIF vs FOB country distinction; no Article 8 adjustments |

**Overall pipeline maturity**: The shipping/insurance pipeline provides **order-of-magnitude estimates** suitable for a "what will this cost roughly?" widget experience. The freight estimates are based on static regional averages (not carrier rates), insurance is a simplified percentage, and critically, the CIF value used as the duty/tax base excludes insurance and does not distinguish CIF-valuation countries from FOB-valuation countries. For customers needing **customs-declaration-grade accuracy**, the two critical gaps are: (1) freight estimation needs real carrier rate data or at minimum validated route-specific rate tables, and (2) the CIF value must include insurance and must respect per-country valuation methodology.
