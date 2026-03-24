# PIPELINE: VAT/GST Calculation
# Last updated: 2026-03-18 KST

## Overview

VAT/GST is the largest single cost component in most cross-border transactions (often 15-27% of goods value). Unlike duty rates which require HS-code-specific DB lookups, VAT/GST is mostly formula-based with country-specific rules. The challenge is in product-specific rate determination (reduced/zero/exempt) and cascading tax calculations (Brazil, India, China, Mexico).

---

## Step 1: Destination Country VAT/GST System Identification

- **Practitioner action**: Determine the destination country's consumption tax system — VAT, GST, Sales Tax, or no consumption tax. Identify the system name (e.g., IVA in Mexico, IGST in India, HST in Canada, PDV in Croatia).
- **Current code**: `GlobalCostEngine.ts:573-575` — reads `profile.vatRate` and `profile.vatLabel` from country profile. `country-data.ts:14-38` defines `CountryTaxProfile` with `vatRate` and `vatLabel` fields. DB-backed via `getCountryProfileFromDb()` at line 309.
- **Method**: DB_LOOKUP (Supabase `vat_gst_rates` table) with CODE fallback (hardcoded `country-data.ts`)
- **Data source**: `vat_gst_rates` table (240 rows, `standard_rate`, `vat_name`, `has_vat`) + `country-data.ts` hardcoded (220+ countries)
- **GAP**: **LOW**. Coverage is good at 240 countries. The `vat_gst_rates.reduced_rates` JSONB column exists but is empty (`'[]'::jsonb`) for all 240 rows — reduced rate data is only in hardcoded `eu-vat-rates.ts`. Minor: some country-specific labels are generic (e.g., Bulgaria is "DDC" instead of "DDS" (Данък Добавена Стойност)).

---

## Step 2: Product-Specific Rate Determination

- **Practitioner action**: For the specific product (identified by HS Code), determine whether the standard VAT rate applies, or if a reduced / zero / exempt rate applies. This requires consulting the country's VAT schedule cross-referenced with product classifications.
- **Current code**:
  - **DB lookup**: `GlobalCostEngine.ts:588-613` — queries `vat_product_rates` table by `country_code` + `hs_chapter` for non-standard rates. Falls back to standard rate if no match.
  - **EU hardcoded**: `eu-vat-rates.ts:24-204` — `EU_REDUCED_VAT` object covers 13/27 EU countries (DE, FR, IT, ES, NL, BE, AT, PL, SE, PT, IE, GR + DK noted as no reduced rates). Called at `GlobalCostEngine.ts:698`.
  - **India HS-chapter rates**: `CostEngine.ts:200-218` — `INDIA_IGST_RATES` maps HS chapters to 5%/12%/18%/28% IGST tiers.
  - **China HS-chapter rates**: `CostEngine.ts:275-276` — standard 13% vs reduced 9% (food/books/agriculture). Consumption tax by chapter at `CostEngine.ts:282-289`.
  - **Mexico excise**: `CostEngine.ts:350-354` — `MEXICO_IEPS_RATES` for alcohol/tobacco/sugary drinks.
- **Method**: DB_LOOKUP (`vat_product_rates`) → CODE fallback (`eu-vat-rates.ts`, `CostEngine.ts` hardcoded maps)
- **Data source**: `vat_product_rates` table (schema exists, **0 rows seeded**) + hardcoded maps
- **GAP**: **CRITICAL — largest gap in the VAT pipeline.**
  1. **`vat_product_rates` table is empty** (0 rows). The DB lookup at `GlobalCostEngine.ts:596-604` will always return null, making the entire product-specific VAT feature a no-op for all countries.
  2. **EU reduced rates: 13/27 countries covered** in `eu-vat-rates.ts`. Missing 14 EU countries: CZ, RO, HU, BG, HR, CY, EE, FI, LT, LV, LU, MT, SK, SI. These countries all have reduced rates (e.g., HU has 5%/18% reduced, LU has 8%/14%, CY has 5%/9%).
  3. **Non-EU reduced rates entirely missing**:
     - **UK**: 0% (food, children's clothing, books) and 5% (domestic fuel, child car seats) — not in code, always uses 20% standard.
     - **Japan**: 8% reduced (food/non-alcoholic beverages) vs 10% standard — not in code.
     - **South Korea**: 0% (basic food, medical, education) vs 10% standard — not in code.
     - **Australia**: GST-free (basic food, medical, education) vs 10% standard — not in code.
     - **Canada**: Zero-rated (basic groceries, prescription drugs, medical devices) vs taxable at GST/HST — not in code.
     - **Switzerland**: 2.6% reduced (food, books, medicines, newspapers) vs 8.1% standard — not in code.
     - **Norway**: 15% (food), 12% (transport/cinema), 0% (books/newspapers/EVs) vs 25% standard — not in code.
     - **New Zealand**: 0% (financial services, residential rent) vs 15% standard — not in code.
  4. **HS chapter granularity is too coarse** for some countries. Example: EU Directive distinguishes between alcoholic beverages (standard) and water/juice (reduced) — both in HS chapter 22. India distinguishes within HS 87 (standard vehicles vs luxury vehicles). Current code uses 2-digit chapter only.

---

## Step 3: Tax Base Calculation

- **Practitioner action**: Calculate the taxable value. For most countries: CIF value + import duty + other applicable taxes = VAT base. Some countries use different bases (e.g., Brazil's ICMS "por dentro" includes itself in its own base).
- **Current code**:
  - **Standard formula** (most countries): `GlobalCostEngine.ts:747` — `(declaredValue + importDuty) * vatRate`
  - **US**: `GlobalCostEngine.ts:621` — `declaredValue * stateTaxRate` (no duty in base — correct for US sales tax)
  - **Canada**: `GlobalCostEngine.ts:633` — `(declaredValue + importDuty) * provRate` for imports; `declaredValue * provRate` for domestic
  - **Brazil**: `CostEngine.ts:182-184` — `preIcmsTotal / (1 - icmsRate)` — ICMS "por dentro" correctly computes inclusive base
  - **India**: `CostEngine.ts:248` — `declaredValue + importDuty + sws` — correct (CIF + BCD + SWS = IGST base)
  - **China CBEC**: `CostEngine.ts:311-313` — consumption tax "por dentro" formula for CBEC; `CostEngine.ts:329-330` for regular import
  - **Mexico**: `CostEngine.ts:367-369` — `(taxBase + ieps) * ivaRate` — IVA on (CIF + duty + IEPS), correct cascading
  - **UK low-value**: `GlobalCostEngine.ts:682` — `declaredValue * 0.20` (VAT on product value only, correct for seller-collected)
  - **UK high-value**: `GlobalCostEngine.ts:687` — `(declaredValue + importDuty) * 0.20` (standard import VAT)
  - **EU IOSS**: `GlobalCostEngine.ts:704` — `declaredValue * euVatRate` (under threshold, correct — no duty in base)
  - **EU standard**: `GlobalCostEngine.ts:711` — `(declaredValue + importDuty) * euVatRate`
  - **AU LVG**: `GlobalCostEngine.ts:723` — `declaredValue * 0.10` (seller-collected, no duty in base)
  - **AU standard**: `GlobalCostEngine.ts:728` — `(declaredValue + importDuty) * 0.10`
  - **GCC**: `GlobalCostEngine.ts:736` — `(declaredValue + importDuty) * gcc.rate`
- **Method**: CODE (pure formula, no external data needed)
- **Data source**: N/A (formula-based)
- **GAP**: **MEDIUM**.
  1. **Insurance not included in CIF base for VAT calculation**. `declaredValue = productPrice + shippingCost` (line 341), but insurance is calculated separately later (line 896-902) and never added to the VAT base. For countries where VAT base = CIF + duty, the insurance should be part of CIF. Duty is also calculated on `declaredValue` without insurance — same issue for duty base.
  2. **Brazil PIS/COFINS base**: `CostEngine.ts:181` uses `declaredValue * (PIS + COFINS)`, but the correct base for import PIS/COFINS is `(CIF + II + ICMS_calculated + PIS/COFINS_calculated)` — it should be a simultaneous equation. Current implementation is a simplified approximation (close enough for estimates, but not legally precise).
  3. **Processing fees not in tax base**: For some countries (e.g., India landing charges), customs processing fees should be part of the assessable value for GST calculation, but they are calculated after VAT (lines 830-891 come after VAT at 572-748).

---

## Step 4: De Minimis Check

- **Practitioner action**: Check if the goods value is below the country's de minimis threshold. Many countries have separate thresholds for duty exemption and tax exemption. Below the duty threshold = no duty; below the tax threshold = no VAT/GST.
- **Current code**:
  - **Threshold loading**: `GlobalCostEngine.ts:556-559` — `dutyThresholdUsd = profile.deMinimisUsd` from country profile. Tax threshold = 0 for EU/GB/AU/NZ/NO/CH (tax always applies), else same as duty threshold.
  - **Duty exemption**: `GlobalCostEngine.ts:561` — `dutyExempt = declaredValue <= dutyThresholdUsd && dutyThresholdUsd > 0`
  - **Tax exemption**: `GlobalCostEngine.ts:562` — `taxExempt = declaredValue <= taxThresholdUsd && taxThresholdUsd > 0`
  - **DB table**: `de_minimis_thresholds` (240 rows) — has separate `duty_threshold_usd` and `tax_threshold_usd` columns.
  - **Hardcoded fallback**: `country-data.ts` — `deMinimisUsd` (single value, no duty/tax split).
- **Method**: DB_LOOKUP (`de_minimis_thresholds`) with CODE fallback
- **Data source**: `de_minimis_thresholds` table (240 rows, verified data for major countries)
- **GAP**: **MEDIUM**.
  1. **`taxExempt` is computed but never used**. After `GlobalCostEngine.ts:562`, `taxExempt` is never referenced. The VAT calculation branches (lines 577-748) check `deMinimisApplied` (which equals `dutyExempt`) and country-specific conditions, but never check `taxExempt`. Countries where `taxThresholdUsd > 0` and `taxThresholdUsd > dutyThresholdUsd` (e.g., Mexico: duty $117 / tax $50) will not correctly exempt tax below the tax threshold.
  2. **De minimis is compared in USD**, but many countries define thresholds in local currency. The current approach uses a static USD conversion (from DB), which can drift with exchange rates. Should use real-time `convertCurrency()` for precision.
  3. **Canada CUSMA de minimis** not handled: US/Mexico origin = CAD $150 duty / CAD $40 tax; other origins = CAD $20. The `de_minimis_thresholds` notes mention this, but the code does not implement origin-based de minimis switching.

---

## Step 5: Special Import Schemes (IOSS / UK LVG / AU LVG / Norway VOEC)

- **Practitioner action**: Check if a special low-value goods scheme applies. Under these schemes, VAT is collected at point of sale by the seller/marketplace, customs duty is waived, and there is no import VAT at the border.
- **Current code**:
  - **EU IOSS**: `GlobalCostEngine.ts:691-714` — threshold ~$165 USD (EUR 150). Below: VAT at destination rate, duty waived. Above: standard import. Uses `EU_IOSS_COUNTRIES` set (27 countries). Also `ioss-oss.ts:99-169` has standalone `calculateIoss()` function with detailed IOSS/OSS logic, exposed via `/api/v1/ioss` endpoint.
  - **UK £135**: `GlobalCostEngine.ts:674-690` — threshold $170 USD (GBP 135). Below: VAT seller-collected. Above: standard import VAT.
  - **AU AUD 1000**: `GlobalCostEngine.ts:715-731` — threshold $650 USD (AUD 1000). Below: GST seller-collected. Above: GST at border.
  - **Norway VOEC**: Referenced in `country-data.ts:140` notes ("VOEC scheme") but **not implemented** in calculation logic.
  - **Switzerland**: `country-data.ts:147` notes de minimis is based on duty amount (CHF 5), not goods value — **not correctly implemented** (code treats it as goods value threshold).
- **Method**: CODE (threshold comparison + conditional logic)
- **Data source**: Hardcoded thresholds in `GlobalCostEngine.ts`
- **GAP**: **MEDIUM**.
  1. **Norway VOEC not implemented**: Norway's VOEC (VAT on E-Commerce) scheme for goods <= NOK 3,000 (~$280 USD) requires foreign sellers to register and collect VAT at point of sale (similar to IOSS). Currently falls through to generic VAT calculation.
  2. **Switzerland de minimis is wrong**: Swiss de minimis is based on the *duty amount* being < CHF 5, not the goods value. A $500 item with 0% duty qualifies; a $10 item with 10% duty ($1 duty) also qualifies. Current code compares goods value to `deMinimisUsd = 5.60`, which is incorrect.
  3. **New Zealand LVG**: Since Dec 2019, GST applies to all imported goods (no de minimis). Goods <= NZD 1,000: GST collected at point of sale by registered offshore suppliers. Not specifically handled.
  4. **IOSS threshold uses static USD conversion** ($165 hardcoded) instead of real-time EUR/USD rate. Should use `convertCurrency()`.
  5. **UK threshold** similarly hardcoded at $170 instead of live GBP/USD conversion.
  6. **`ioss-oss.ts` IOSS calculation** uses only standard VAT rates (`EU_VAT_RATES`), not HS-chapter-based reduced rates. The `GlobalCostEngine.ts` version does check `getEuReducedVatRate()` — but standalone IOSS API does not.

---

## Step 6: Country-Specific Special Taxes

- **Practitioner action**: Calculate any country-specific additional taxes on imports beyond standard VAT/GST. These include cascading taxes (Brazil), surcharges (India SWS), excise taxes (Mexico IEPS, China consumption tax), sub-national taxes (US state sales tax, Canada HST/PST), and sector-specific levies.
- **Current code**:

### 6a. Brazil Cascading Taxes
- **Code**: `CostEngine.ts:175-189` (`calculateBrazilImportTaxes`), called from `GlobalCostEngine.ts:644-651`
- **Cascade order**: II (import duty, already calculated) -> IPI 10% -> PIS/COFINS 11.75% -> ICMS "por dentro"
- **State ICMS**: `CostEngine.ts:115-123` — 27 states with rates 17-22%
- **CEP to state**: `CostEngine.ts:134-169` — 8-digit postal code mapping
- **GAP**: **LOW-MEDIUM**. IPI rate is hardcoded at 10% average (`BRAZIL_IPI_DEFAULT`), but actual IPI varies widely by product (0% to 300%+ for tobacco). Should be HS-code-specific. PIS/COFINS import rates are correct at 2.1%/9.65%. ICMS rates are accurate per state. The "por dentro" formula is correctly implemented. Missing: AFRMM (Adicional ao Frete para Renovacao da Marinha Mercante) — 8% on ocean freight for sea imports.

### 6b. India IGST + SWS
- **Code**: `CostEngine.ts:239-255` (`calculateIndiaImportTaxes`), called from `GlobalCostEngine.ts:652-659`
- **SWS**: 10% of BCD (correct)
- **IGST**: Rate by HS chapter (5%/12%/18%/28%), base = CIF + BCD + SWS (correct)
- **GAP**: **LOW-MEDIUM**. Missing: Agriculture Infrastructure and Development Cess (AIDC) — 5% on gold, 2.5% on palm oil, etc. Missing: Compensation Cess on luxury/demerit goods (additional 1-65% on top of IGST 28%, e.g., 22% on aerated water, 65% on tobacco). Missing: Anti-dumping duty (handled separately in trade remedies module, but not included in IGST base calculation).

### 6c. China CBEC
- **Code**: `CostEngine.ts:295-341` (`calculateChinaCBECTaxes`), called from `GlobalCostEngine.ts:660-666`
- **CBEC regime**: Duty exempt, VAT+consumption at 70% for <= RMB 5000 / $700 per transaction
- **Regular import**: Full duty + VAT 13% + consumption tax
- **Consumption tax by HS chapter**: 6 categories (beverages, tobacco, cosmetics, jewelry, vehicles, watches)
- **GAP**: **LOW**. Missing: Health/education supplements surtax (urban 7% / county 5% / other 1% on VAT+consumption tax — small amount). The `isCBEC` parameter defaults to `true`, which may over-apply the CBEC discount. Annual limit (RMB 26,000) is noted but not enforced. Consumption tax categories are incomplete (missing golf equipment, yachts, batteries, coatings).

### 6d. Mexico IVA + IEPS
- **Code**: `CostEngine.ts:360-377` (`calculateMexicoImportTaxes`), called from `GlobalCostEngine.ts:667-673`
- **IVA**: 16% on (CIF + duty + IEPS) — cascading correctly implemented
- **IEPS**: 3 categories (alcohol 26.5%, tobacco 160%, sugary drinks 8%)
- **GAP**: **LOW**. IEPS coverage is simplified (only 3 categories vs actual ~15 categories including fuel, pesticides, junk food 8%, energy drinks). DTA (customs processing fee) is separately calculated at line 877-879 — correct.

### 6e. US State Sales Tax
- **Code**: `CostEngine.ts:50-66` (`STATE_TAX_RATES`) — 50 states + DC + PR
- **ZIP to state**: `CostEngine.ts:381-441` (`zipcodeToState`) — 3-digit ZIP prefix mapping
- **Called from**: `GlobalCostEngine.ts:617-628`
- **GAP**: **HIGH**.
  1. **State-level only, no local/county/city taxes**: US sales tax is actually a combination of state + county + city + special district rates. The code uses "approximate combined state + local average" per state, but actual rates vary by ZIP code. Example: California ranges from 7.25% (state minimum) to 10.75% (some cities). The code uses 8.75% flat for all CA ZIPs.
  2. **No product-specific exemptions**: Many states exempt groceries, prescription drugs, clothing (e.g., PA exempts most clothing; NY exempts clothing < $110). Code applies the same rate to all products.
  3. **No nexus/economic nexus logic**: Whether sales tax even applies depends on seller nexus in the destination state. Not relevant for imports (use tax applies), but important for domestic sales.
  4. **ZIP-level solution**: Would require a tax rate database (e.g., Avalara tax content, TaxJar SmartCalcs, or Vertex). ~40,000 ZIP codes with distinct rate combinations. Current approach is an acceptable estimate for cross-border (import use tax), but not for domestic ecommerce compliance.

### 6f. Canada GST/HST/PST
- **Code**: `CostEngine.ts:73-90` (`CANADA_PROVINCE_TAX_RATES`) — 13 provinces/territories
- **Postal code to province**: `CostEngine.ts:96-110` — first-letter mapping
- **Called from**: `GlobalCostEngine.ts:629-643`
- **GAP**: **LOW**. Province-level rates are accurate. HST provinces correctly identified. QST rate (9.975%) is correct. Missing: some goods are zero-rated (basic groceries, prescription drugs) or exempt (medical devices, child care) in all provinces — no product-specific exemption logic.

### 6g. GCC Countries
- **Code**: `GlobalCostEngine.ts:69-76` — 6 GCC countries with rates
- **GAP**: **LOW**. Rates are current (SA 15%, AE 5%, BH 10%, OM 5%, KW/QA 0%). Missing: UAE/SA free zone exemptions.

---

## Step 7: VAT Registration / Filing Obligation Check

- **Practitioner action**: Determine if the seller has a VAT registration obligation in the destination country, and what filing requirements apply. This affects whether VAT is collected at point of sale (seller-registered) or at the border (buyer pays).
- **Current code**:
  - **IOSS filing**: `ioss-oss.ts:165-168` — returns `filingObligation` field ("Monthly IOSS VAT return" or "Register for IOSS").
  - **OSS filing**: `ioss-oss.ts:238-248` — returns filing obligation ("Quarterly OSS VAT return").
  - **B2B reverse charge**: `GlobalCostEngine.ts:577-584` — if `buyerVatNumber` provided, VAT = 0 with "Reverse Charge" label.
- **Method**: CODE (rule-based logic)
- **Data source**: N/A (rule-based)
- **GAP**: **MEDIUM**.
  1. **No VAT registration threshold tracking**: Many countries have registration thresholds (e.g., UK GBP 90,000/year, EU varies by country, AU AUD 75,000/year). POTAL does not track whether the seller has exceeded these thresholds.
  2. **No registration status storage**: There is no DB table or user profile field for storing a seller's VAT registration numbers per country. The `buyerVatNumber` field on `GlobalCostInput` is a per-request parameter, not persisted.
  3. **No UK OMP (Online Marketplace) rules**: Since Jan 2021, UK requires online marketplaces to collect VAT on behalf of overseas sellers for goods <= GBP 135 and all goods in warehouses in the UK. This marketplace obligation is not modeled.
  4. **No multi-country filing calendar**: No system to track filing deadlines (monthly IOSS, quarterly OSS, monthly/quarterly/annual by country).

---

## Step 8: Final VAT/GST Amount

- **Practitioner action**: Sum all applicable taxes and produce the final VAT/GST amount. Include it in the total landed cost. Format the breakdown for the customer.
- **Current code**:
  - **Total**: `GlobalCostEngine.ts:750` — `totalLandedCost = productPrice + shippingCost + importDuty + vat`
  - **Extended total**: `GlobalCostEngine.ts:928` — adds `mpf + insurance + brokerageFee`
  - **Breakdown items**: `GlobalCostEngine.ts:756-824` — country-specific breakdown entries (Brazil: IPI/PIS/COFINS/ICMS separately; India: SWS/IGST; China: CBEC or VAT+CT; Mexico: IVA+IEPS; generic: single VAT line)
  - **Detailed breakdown** (S+ grade): `GlobalCostEngine.ts:119-140` — `DetailedCostBreakdown` interface with 15 line items
  - **`buildBreakdown()`**: `breakdown.ts:18-65` — simplified breakdown builder (not used in main engine; separate utility)
  - **Response fields**: `vatRate`, `vatLabel`, `vatRateType`, `reverseCharge` on the `GlobalLandedCost` response
- **Method**: CODE (summation + formatting)
- **Data source**: N/A
- **GAP**: **LOW**.
  1. **Inconsistent total calculation**: Line 750 computes `totalLandedCost` without insurance/brokerage/MPF, but line 928 computes `totalWithMpf` including them. The response object uses `totalLandedCost` (line 750) as the main total, but the actual total including all fees is `totalWithMpf`. This means the headline "total landed cost" underreports by the amount of processing fees + insurance + brokerage.
  2. **`buildBreakdown()` in `breakdown.ts` is disconnected**: It has its own VAT calculation (`vatBase * vatRate`) that doesn't account for any country-specific rules. It's a separate code path that could produce different numbers than `GlobalCostEngine.ts`.

---

## Data Inventory

| Data Source | Table / File | Rows | Coverage | Status |
|-------------|-------------|------|----------|--------|
| Standard VAT/GST rates | `vat_gst_rates` | 240 | 240 countries | COMPLETE |
| Standard VAT/GST rates (fallback) | `country-data.ts` | 220+ | Hardcoded | COMPLETE |
| De minimis thresholds | `de_minimis_thresholds` | 240 | Duty + tax split | COMPLETE |
| Product-specific VAT rates (DB) | `vat_product_rates` | **0** | None | **EMPTY** |
| EU reduced VAT (hardcoded) | `eu-vat-rates.ts` | 13 countries | 13/27 EU | **PARTIAL** |
| India IGST rates (hardcoded) | `CostEngine.ts:200-218` | ~40 chapters | Major chapters | ADEQUATE |
| China VAT/consumption (hardcoded) | `CostEngine.ts:275-289` | ~13 chapters | Major categories | ADEQUATE |
| Mexico IEPS (hardcoded) | `CostEngine.ts:350-354` | 3 chapters | Major categories | ADEQUATE |
| Brazil ICMS by state | `CostEngine.ts:115-123` | 27 states | All states | COMPLETE |
| Canada GST/HST/PST | `CostEngine.ts:73-90` | 13 provinces | All provinces | COMPLETE |
| US state sales tax | `CostEngine.ts:50-66` | 52 | State-level avg | **ZIP-LEVEL MISSING** |
| GCC VAT rates | `GlobalCostEngine.ts:69-76` | 6 | All GCC | COMPLETE |
| IOSS/OSS rules | `ioss-oss.ts` | N/A | EU 27 | COMPLETE |

---

## AI Decision Points

VAT/GST calculation is almost entirely formula-based. AI is needed in only one place:

1. **Product classification for reduced rate determination** (Step 2): When a product's HS chapter falls in a grey area for reduced rates (e.g., is a "protein bar" food at reduced rate or confectionery at standard?), the AI classifier's output determines which VAT rate tier applies. This is already handled by the HS classification pipeline (D3) — no additional AI call needed for VAT.

No other VAT/GST steps require AI. All rules are deterministic given the HS code and destination country.

---

## GAP Summary (Priority Order)

| # | GAP | Severity | Impact | Effort |
|---|-----|----------|--------|--------|
| G1 | `vat_product_rates` table empty — product-specific VAT is a no-op | CRITICAL | All countries: reduced/zero/exempt rates never applied from DB | HIGH (seed data for 50+ countries) |
| G2 | EU reduced rates: 13/27 countries | HIGH | 14 EU countries missing reduced rates (food, books, pharma) | MEDIUM (add 14 countries to `eu-vat-rates.ts` or seed DB) |
| G3 | Non-EU reduced rates missing (UK, JP, KR, AU, CA, CH, NO, NZ) | HIGH | 8 major countries overcharge VAT on food/books/medicine | MEDIUM (add to code or DB) |
| G4 | US ZIP-level tax rates | HIGH | US domestic/import tax estimates can be off by 0-3% | HIGH (external API integration or rate DB) |
| G5 | `taxExempt` computed but never used | MEDIUM | Countries with separate tax thresholds (MX, CA) apply tax when exempt | LOW (wire up existing variable) |
| G6 | Insurance not in CIF/VAT base | MEDIUM | VAT slightly understated (~0.5-1.5% of insurance amount) | LOW (reorder calculation) |
| G7 | Switzerland de minimis wrong (duty amount vs goods value) | MEDIUM | Swiss imports incorrectly flagged as above/below threshold | LOW (code fix) |
| G8 | Norway VOEC scheme not implemented | MEDIUM | Norwegian imports missing seller-collected VAT flow | LOW (add branch) |
| G9 | `totalLandedCost` excludes MPF/insurance/brokerage | MEDIUM | Headline total understates actual cost | LOW (use `totalWithMpf`) |
| G10 | Brazil IPI hardcoded at 10% (varies 0-300%) | LOW | Brazil duty estimate inaccurate for specific products | MEDIUM (HS-based IPI lookup) |
| G11 | India missing AIDC and Compensation Cess | LOW | India tax slightly understated for specific goods | LOW (add surcharge logic) |
| G12 | IOSS threshold uses static USD ($165) | LOW | EUR/USD drift causes incorrect threshold application | LOW (use `convertCurrency()`) |

---

## Implementation Plan

### Phase 1: Critical Fixes (estimated: 2-3 hours)

1. **Seed `vat_product_rates` table** (G1):
   - Generate migration with reduced/zero/exempt rates for top 30 countries
   - Data sources: EU VAT Directive Annex III, UK VAT Act 1994 Schedule 8, Japan Consumption Tax Act, CBIC India GST rate schedule
   - Format: `country_code` + `hs_chapter` + `rate_type` + `rate`
   - Estimated rows: ~800-1,200 (30 countries x 30-40 HS chapters with non-standard rates)

2. **Complete EU reduced rates** (G2):
   - Add remaining 14 EU countries to `eu-vat-rates.ts` (or migrate all 27 into `vat_product_rates` and deprecate the hardcoded file)
   - Source: European Commission VAT rates database (ec.europa.eu/taxation_customs/tedb)

3. **Wire up `taxExempt`** (G5):
   - In `GlobalCostEngine.ts`, add check: if `taxExempt && !dutyExempt`, set `importDuty` but skip VAT
   - If `taxExempt && dutyExempt`, skip both (already works via `deMinimisApplied`)

4. **Fix Switzerland de minimis** (G7):
   - Change logic: compute `dutyAmount = declaredValue * dutyRate`, then `dutyExempt = dutyAmount < CHF_5_IN_USD`
   - Only applies to CH; other countries keep value-based threshold

### Phase 2: Non-EU Reduced Rates (estimated: 3-4 hours)

5. **Add non-EU reduced VAT rate maps** (G3):
   - UK: 0% (food HS 01-21 except confectionery/alcohol, children's clothing HS 61-62, books HS 49), 5% (child car seats HS 9401, domestic fuel HS 27)
   - Japan: 8% (food/beverages HS 01-22 except alcohol 2203-2208)
   - South Korea: 0% (unprocessed food HS 01-14, medical HS 30, education HS 49)
   - Australia: 0% (basic food HS 01-21 per GST-free schedule, medical HS 30)
   - Canada: 0% (basic groceries per Schedule VI, prescription drugs HS 3003-3004)
   - Switzerland: 2.6% (food, books, newspapers, medicines)
   - Norway: 15% food, 12% transport, 0% books/newspapers/EVs

6. **Implement Norway VOEC** (G8):
   - Add branch in `GlobalCostEngine.ts` for NO: if `declaredValue <= ~$280` (NOK 3,000), seller-collected VAT flow

### Phase 3: Accuracy Improvements (estimated: 2-3 hours)

7. **Insurance in CIF base** (G6):
   - Move insurance calculation before duty and VAT calculation
   - Add to `declaredValue` (CIF = product + shipping + insurance)
   - Recalculate downstream: duty on CIF, VAT on CIF+duty

8. **Fix `totalLandedCost`** (G9):
   - Use `totalWithMpf` as the response `totalLandedCost`
   - Or add all fees to line 750 calculation

9. **Dynamic IOSS/UK thresholds** (G12):
   - Use `convertCurrency('EUR', 'USD', 150)` for IOSS
   - Use `convertCurrency('GBP', 'USD', 135)` for UK
   - Cache conversion for 1 hour

### Phase 4: US ZIP-Level Tax (estimated: varies)

10. **US sales tax accuracy** (G4):
    - Option A: Integrate external API (TaxJar, Avalara, Vertex) — most accurate, has cost
    - Option B: Build own ZIP-level rate DB (~40K entries, update quarterly) — moderate effort
    - Option C: Keep state-level estimates with disclaimer — lowest effort, acceptable for cross-border
    - **Recommendation**: Option C for now (cross-border import use tax is state-level anyway; ZIP-level matters mainly for domestic nexus compliance, which is not POTAL's core use case)

### Phase 5: Country-Specific Refinements (ongoing)

11. **Brazil IPI by HS code** (G10): Build HS-chapter-to-IPI lookup from TIPI (Tabela de Incidencia do IPI)
12. **India Compensation Cess** (G11): Add cess rates for 28% IGST goods (luxury vehicles, aerated water, tobacco, coal)
13. **China consumption tax expansion**: Add missing categories (golf, yachts, batteries, coatings, refined oil)

---

## Architecture Decision: Hardcoded vs DB

The current system uses a hybrid approach:
- `eu-vat-rates.ts` and `CostEngine.ts` — hardcoded rate maps (fast, no DB dependency, deploy-time updates)
- `vat_product_rates` — DB table (runtime updatable, but currently empty)
- `vat_gst_rates` — DB table with `reduced_rates` JSONB (exists but unused — all `'[]'`)

**Recommendation**: Migrate all product-specific rates into `vat_product_rates` as the single source of truth. Keep hardcoded maps as fallback only. This allows:
- Runtime updates via admin API when rates change (e.g., Finland raised VAT from 24% to 25.5% in Sep 2024)
- No deploy needed for rate changes
- Consistent data path (DB_LOOKUP -> fallback) matching the duty rate pipeline

The `vat_gst_rates.reduced_rates` JSONB column should be populated with per-HS-chapter rates as an alternative to `vat_product_rates` rows — either approach works, but separate rows in `vat_product_rates` is more queryable and indexable.
