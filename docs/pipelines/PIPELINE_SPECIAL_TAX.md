# PIPELINE: Special Tax (12-Country Regimes)
> Technical design document for the POTAL special/cascading tax pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (6 Steps)

A tax specialist calculates special import taxes for countries with complex multi-layer regimes:

1. Check if destination has a special tax regime
2. Determine if product is subject to special tax (HS-based)
3. State/regional rate lookup (Brazil ICMS by state, US by state, Canada by province)
4. Cascading calculation (order-dependent: base first, then surcharges on accumulated total)
5. Relief/exemption check (China CBEC 70% reduction, India exemptions, etc.)
6. Final special tax total

---

## 2. Country Coverage

The engine has dedicated calculation logic for 12 countries/regimes:

| # | Country | Tax Components | Code Location |
|---|---------|---------------|---------------|
| 1 | **Brazil** | II + IPI + PIS/COFINS + ICMS (por dentro) | `CostEngine.ts:175-189` |
| 2 | **India** | BCD + SWS (10% of BCD) + IGST | `CostEngine.ts:239-255` |
| 3 | **China** | CBEC composite OR regular (VAT + consumption tax) | `CostEngine.ts:295-341` |
| 4 | **Mexico** | Duty + IEPS (excise) + IVA 16% | `CostEngine.ts:360-377` |
| 5 | **US** | State sales tax (50 states + DC + PR) | `CostEngine.ts:50-66`, `GlobalCostEngine.ts:617-628` |
| 6 | **Canada** | GST 5% + PST/HST/QST by province (13 provinces) | `CostEngine.ts:73-90`, `GlobalCostEngine.ts:629-643` |
| 7 | **UK** | VAT 20% (seller-collected <=GBP 135, import VAT >GBP 135) | `GlobalCostEngine.ts:674-690` |
| 8 | **EU (27)** | IOSS VAT (<=EUR 150 seller-collected) + reduced rates by HS | `GlobalCostEngine.ts:691-714` |
| 9 | **Australia** | GST 10% (LVG seller-collected <=AUD 1000, border >AUD 1000) | `GlobalCostEngine.ts:715-731` |
| 10 | **GCC (6)** | VAT at country rate (SA 15%, AE 5%, BH 10%, OM 5%, KW/QA 0%) | `GlobalCostEngine.ts:69-76, 732-743` |
| 11 | **Switzerland** | VAT 8.1% (reduced 2.6% food/books) | Handled by generic profile path |
| 12 | **Singapore** | GST 9% | Handled by generic profile path |

---

## 3. Step-by-Step Analysis

### Step 1: Check If Destination Has Special Tax Regime
- **Practitioner action**: Identify whether the destination country has a multi-component tax system that goes beyond simple "VAT on CIF+duty." Countries with cascading taxes, state-level variation, excise taxes, or composite regimes need special handling.
- **Current code**: `GlobalCostEngine.ts:617-748` -- a chain of `if/else if` blocks checking `profile.code` against specific country codes (US, CA, BR, IN, CN, MX, GB, EU set, AU, GCC set). If no match, falls through to generic VAT at lines 744-748.
- **Method**: CODE (hardcoded country-code branching)
- **Data source**: Country code from `profile.code` (string match)
- **GAP**:
  - The regime detection is a flat if/else chain, not data-driven. Adding a new country with special tax logic requires modifying the engine source code. A more extensible approach would be a `tax_regime` enum in the country profile (e.g., `'standard'` | `'cascading'` | `'state_level'` | `'composite'`) with a registry of calculator functions.
  - The GCC countries are grouped by a `GCC_VAT_COUNTRIES` object (line 69-76) which is a good pattern, but Brazil/India/China/Mexico each have inline logic rather than a unified "special tax calculator" abstraction.
  - No special handling for: Turkey (18% VAT + SCT excise), South Korea (10% VAT + individual consumption tax on luxury), Thailand (7% VAT + excise on certain goods), Indonesia (11% VAT + luxury goods tax), Japan (consumption tax 10%, reduced 8% for food). These countries use the generic path.

---

### Step 2: Determine If Product Is Subject to Special Tax (HS-Based)
- **Practitioner action**: Check whether the specific product (identified by HS code) triggers any special or excise taxes. For example: alcohol triggers IEPS in Mexico, luxury goods trigger consumption tax in China, tobacco triggers special duties everywhere.
- **Current code**:
  - **Brazil**: All imports subject to IPI/PIS/COFINS/ICMS. IPI rate is a flat `BRAZIL_IPI_DEFAULT = 0.10` (`CostEngine.ts:126`). No HS-based variation.
  - **India**: IGST rate varies by HS chapter. Lookup via `INDIA_IGST_RATES` map (`CostEngine.ts:200-218`): 5% (essential goods HS 01-12), 12% (food processing HS 15-22), 18% (standard, most manufactured), 28% (luxury/demerit: tobacco, jewelry, sports). Called via `getIndiaIgstRate()` at `CostEngine.ts:225-227`.
  - **China**: Consumption tax varies by HS chapter. Lookup via `CHINA_CONSUMPTION_TAX` map (`CostEngine.ts:282-289`): 10% beverages, 36% tobacco, 15% cosmetics, 10% jewelry, 5% vehicles, 20% luxury watches. VAT reduced rate (9%) for food/books chapters. Called at `CostEngine.ts:301-304`.
  - **Mexico**: IEPS excise varies by HS chapter. Lookup via `MEXICO_IEPS_RATES` map (`CostEngine.ts:350-354`): 26.5% alcohol, 160% tobacco, 8% sugary drinks. Called via `getMexicoIepsRate()` at `CostEngine.ts:356-358`.
  - **US**: No HS-based sales tax variation (sales tax is state-level, product-type exemptions handled by states not modeled here).
  - **Canada**: No HS-based GST/HST variation at federal level.
- **Method**: CODE (hardcoded HS chapter maps)
- **Data source**: Hardcoded `Record<string, number>` maps in `CostEngine.ts`
- **GAP**:
  - **Brazil IPI is NOT a flat 10%.** IPI rates range from 0% to over 300% depending on the product's NCM (Brazilian HS) code. The `BRAZIL_IPI_DEFAULT = 0.10` is a rough average. A practitioner would look up the IPI rate in the TIPI (Tabela de Incidencia do IPI) by NCM code. This is a significant accuracy gap for Brazil.
  - India IGST map covers ~35 HS chapters but India has 98 chapters. The fallback to 18% is reasonable but chapters like HS 31 (fertilizers, 5%), HS 50 (silk, 12%), HS 97 (art, 12%) are missing.
  - China consumption tax map has only 6 entries. Missing: fuel (HS 27, various rates), fireworks (HS 36, 15%), golf/yacht (HS 89/95, 10%), batteries (HS 85, 4%), coatings (HS 32, 4%).
  - Mexico IEPS map has only 3 entries. Missing: pesticides (HS 38, 6-9%), fossil fuels (HS 27, various specific rates), energy drinks, junk food (8%).
  - US state-level product exemptions (e.g., groceries tax-exempt in many states, clothing exempt in PA/NJ/MN) are not modeled. `STATE_TAX_RATES` applies the full combined rate to all products.
  - **NEEDED**: A `special_tax_rates` DB table mapping (country_code, hs_code_prefix, tax_type, rate) to replace hardcoded maps. This would allow DB updates without code changes.

---

### Step 3: State/Regional Rate Lookup
- **Practitioner action**: For countries with sub-national tax variation, determine the exact rate for the buyer's state/province/region using their postal code or address.
- **Current code**:
  - **US**: `zipcodeToState()` (`CostEngine.ts:381-441`) maps 3-digit ZIP prefix to state. `STATE_TAX_RATES` (`CostEngine.ts:50-66`) has combined state+local average for 50 states + DC + PR. Used at `GlobalCostEngine.ts:619-620`.
  - **Canada**: `postalCodeToProvince()` (`CostEngine.ts:96-110`) maps first letter of postal code to province. `CANADA_PROVINCE_TAX_RATES` (`CostEngine.ts:73-90`) has combined GST+PST/HST for 13 provinces/territories. Used at `GlobalCostEngine.ts:631-637`.
  - **Brazil**: `cepToState()` (`CostEngine.ts:134-169`) maps CEP prefix to state. `BRAZIL_STATE_ICMS_RATES` (`CostEngine.ts:115-123`) has ICMS import rates for 27 states. Used at `GlobalCostEngine.ts:646-647`.
  - **India**: No state-level variation implemented. IGST is federal.
  - **China**: No province-level variation (VAT is national).
  - **Mexico**: No state-level variation (IVA is national 16%).
- **Method**: CODE (postal-code-to-region mapping + rate lookup from hardcoded maps)
- **Data source**: Hardcoded `Record<string, number>` rate maps in `CostEngine.ts`
- **GAP**:
  - **US sales tax is dramatically oversimplified.** The US has ~13,000 tax jurisdictions (state + county + city + special district). `STATE_TAX_RATES` stores one combined average per state. Example: Los Angeles city = 9.5%, rural CA county = 7.25%, but `CA: 0.0875` is used for all. For e-commerce tax compliance, services like Avalara/TaxJar use address-level lookup databases. This is acceptable as an estimate but should be clearly labeled.
  - Canada GST/HST is well-modeled (province-level is sufficient; there is no sub-provincial variation for import GST).
  - Brazil ICMS is mostly correct at state level, but some states have special rates for certain product categories (e.g., SP has reduced ICMS for electronics). The current code uses a single rate per state.
  - **India**: While IGST is federal, some states levy additional Entry Tax or Octroi (now largely subsumed into GST). Maharashtra had an Octroi equivalent until 2017. This is no longer relevant post-GST implementation.
  - **Missing postal code**: If no zipcode/postal code is provided, the code falls back to national averages (US: 7%, CA: 5%, BR: 18% ICMS). The fallback is reasonable but should be documented in the API response.

---

### Step 4: Cascading Calculation
- **Practitioner action**: Apply taxes in the correct order, as each layer's base often includes the previous layers. Getting the order wrong changes the total.
- **Current code**:
  - **Brazil** (`CostEngine.ts:175-189` `calculateBrazilImportTaxes()`):
    1. IPI = (declaredValue + importDuty) x 10%
    2. PIS/COFINS = declaredValue x (2.1% + 9.65%) = 11.75%
    3. ICMS "por dentro": base = (CIF + II + IPI + PIS/COFINS) / (1 - ICMS rate), then ICMS = base x rate
    4. Total = IPI + PIS/COFINS + ICMS
  - **India** (`CostEngine.ts:239-255` `calculateIndiaImportTaxes()`):
    1. SWS = importDuty (BCD) x 10%
    2. IGST = (declaredValue + BCD + SWS) x IGST rate
    3. Total = SWS + IGST
  - **China** (`CostEngine.ts:295-341` `calculateChinaCBECTaxes()`):
    - CBEC path (<=~$700): duty exempted, taxBase adjusted for consumption tax denominator, then VAT and consumption at 70% of statutory rates
    - Regular path: taxBase = (declaredValue + duty) / (1 - consumptionRate), VAT = taxBase x rate, consumption = taxBase x rate
  - **Mexico** (`CostEngine.ts:360-377` `calculateMexicoImportTaxes()`):
    1. IEPS = (declaredValue + importDuty) x IEPS rate
    2. IVA = (declaredValue + importDuty + IEPS) x 16%
    3. Total = IEPS + IVA
  - **US/Canada**: No cascading (single-layer: sales tax / GST on declared value).
- **Method**: CODE (dedicated calculator functions per country)
- **Data source**: Hardcoded rates + input values
- **GAP**:
  - **Brazil PIS/COFINS base is incorrect.** The code at line 181 computes `pisCofins = declaredValue * (BRAZIL_PIS_IMPORT + BRAZIL_COFINS_IMPORT)`. The correct base for PIS-Import and COFINS-Import is `(CIF + II + ICMS + PIS/COFINS)` -- a circular "por dentro" calculation similar to ICMS. The current code uses only `declaredValue` (CIF), which understates PIS/COFINS. However, the practical difference is small (~1-2% of total) because the rate is already adjusted for the simplified calculation.
  - **India**: Missing Agriculture Infrastructure and Development Cess (AIDC) introduced 2021 -- 5% on gold, 2.5% on certain items. Missing Health Cess (5% on tobacco, medical devices). These are additional surcharges on top of BCD.
  - **India**: SWS rate is always 10% in the code. In reality, SWS has exemptions for certain goods (e.g., goods under India-ASEAN FTA are SWS-exempt). This needs FTA-conditional logic.
  - **China CBEC single-transaction limit**: Hardcoded as `CHINA_CBEC_SINGLE_LIMIT_USD = 700` (CNY 5,000 / 7.1). The exchange rate should use the live rate, not a fixed 7.1. Also, the annual per-person limit (CNY 26,000) cannot be enforced at the transaction level -- this is a platform-level control.
  - **Mexico DTA (Derecho de Tramite Aduanero)**: The customs processing fee is calculated separately in the MPF section (`GlobalCostEngine.ts:877-879`) but should arguably be part of the Mexico tax cascade since it affects the total duty/tax base. Currently it is added after the tax calculation, which is technically correct (DTA is a fee, not a tax base component).
  - **UK/EU/AU**: These are modeled as threshold-based VAT regimes (not cascading) which is correct. However, the UK has a 5% reduced VAT rate for certain goods (children's car seats, energy) and a 0% rate for essentials (food, children's clothing) that is not modeled in the UK-specific branch. The EU reduced rates ARE modeled via `getEuReducedVatRate()` at line 698.

---

### Step 5: Relief/Exemption Check
- **Practitioner action**: Check whether the shipment qualifies for tax relief or reduction programs:
  - **China CBEC**: 70% reduction on VAT and consumption tax for qualifying cross-border e-commerce transactions (<=CNY 5,000 per transaction, <=CNY 26,000 per year).
  - **India**: Exemptions for certain FTA imports (SWS waiver), specific HS codes (0% BCD on raw materials for manufacturing).
  - **Brazil**: Reduced IPI rates for essential goods, Manaus Free Trade Zone exemptions.
  - **Mexico**: IMMEX program (temporary import for manufacturing, duty/tax exempt).
  - **US**: No sales tax on interstate e-commerce below state nexus thresholds (Wayfair ruling).
  - **EU**: Zero-rated supplies, OSS simplification, postponed VAT accounting for B2B.
- **Current code**:
  - **China CBEC**: Fully implemented at `CostEngine.ts:306-324`. Checks `isCBEC` flag and `declaredValue <= CHINA_CBEC_SINGLE_LIMIT_USD`. Applies 70% discount factor.
  - **EU IOSS**: Implemented at `GlobalCostEngine.ts:691-714`. Duty exemption for <=EUR 150.
  - **B2B Reverse Charge**: Implemented at `GlobalCostEngine.ts:577-584`. If `buyerVatNumber` provided, VAT = 0.
  - **EU Reduced VAT**: Implemented via `getEuReducedVatRate()` at line 698 for HS-chapter-based reduced rates.
- **Method**: CODE
- **Data source**: Hardcoded thresholds and flags
- **GAP**:
  - **India exemptions**: No SWS waiver for FTA imports. No BCD exemption notifications (India issues ~500 customs exemption notifications per year specifying reduced/zero duty for specific HS codes). This is a data gap -- would need an `india_exemption_notifications` table.
  - **Brazil**: No Manaus Free Trade Zone modeling. No IPI exemption for essential goods (HS chapters 01-24 food products often have 0% IPI; the code uses flat 10%).
  - **Mexico IMMEX**: Not implemented. This is a major program for manufacturers importing raw materials for re-export. However, POTAL's B2B API consumers would need to declare IMMEX eligibility, which is a business-level attribute.
  - **US**: No state-level exemptions (e.g., food exempt from sales tax in 32 states, clothing exempt in 4 states). This is the same gap noted in Step 3.
  - **China CBEC `isCBEC` flag**: The function parameter defaults to `true` (`CostEngine.ts:299`), so all China-bound shipments under the value limit are treated as CBEC. In reality, CBEC applies only when importing via a registered CBEC platform (Tmall Global, JD Worldwide, etc.). Direct B2B imports follow the regular path. The API should expose this as an input parameter.
  - **Postponed VAT accounting** (EU B2B): When a business imports goods in the EU and is VAT-registered, they can postpone VAT payment to the VAT return rather than paying at the border. This is handled by the B2B Reverse Charge flag, which sets VAT to 0, but the mechanism is different (reverse charge = no VAT vs postponed = VAT declared on return).

---

### Step 6: Final Special Tax Total
- **Practitioner action**: Sum all special tax components and produce a detailed breakdown showing each layer. The breakdown should show: (a) each tax name, (b) its rate, (c) its calculation base, (d) the computed amount.
- **Current code**: Each country calculator returns a structured result:
  - Brazil: `{ ipi, pisCofins, icms, totalTax, effectiveRate }` (`CostEngine.ts:187-188`)
  - India: `{ sws, igst, totalTax, effectiveRate }` (`CostEngine.ts:252-254`)
  - China: `{ vat, consumptionTax, totalTax, effectiveRate, isCBEC }` (`CostEngine.ts:317-323`)
  - Mexico: `{ iva, ieps, totalTax, effectiveRate }` (`CostEngine.ts:373-376`)
  - The `totalTax` is assigned to the `vat` field in `GlobalLandedCost`, and individual components are added as breakdown items at `GlobalCostEngine.ts:783-824`.
- **Method**: CODE
- **Data source**: Computed from Steps 1-5
- **GAP**:
  - The overall `vat` field in the response holds the TOTAL special tax (not just VAT). For Brazil, `vat = ipi + pisCofins + icms`. This is semantically confusing. The `vatLabel` field compensates (e.g., "ICMS SP" for Brazil), but API consumers expecting `vat` to be actual VAT will get the wrong number.
  - The S-Grade `detailedCostBreakdown` (line 1019-1026) only splits into `vat_gst` (single field). It does not decompose Brazil's 4 components or India's 2 components. The breakdown items in the `breakdown[]` array DO show individual components (IPI, PIS/COFINS, ICMS at lines 788-790), which is good, but the structured `DetailedCostBreakdown` interface lacks country-specific fields.
  - The `effectiveRate` returned by each calculator is the total tax / declared value, which is useful for comparison but not the statutory rate. Both should be available.
  - No "what-if" comparison showing regular vs CBEC for China, or HST vs GST+PST for Canada.

---

## 4. Data Inventory

| Data Point | Source | Table/File | Row Count | Status |
|---|---|---|---|---|
| US state sales tax rates | Tax Foundation | `CostEngine.ts:50-66` | 52 (50 states + DC + PR) | COMPLETE (averages) |
| Canada province tax rates | CRA | `CostEngine.ts:73-90` | 13 provinces/territories | COMPLETE |
| Brazil state ICMS rates | CONFAZ | `CostEngine.ts:115-123` | 27 states | COMPLETE |
| Brazil IPI rates (by HS) | TIPI table | `CostEngine.ts:126` | 1 (flat 10%) | PARTIAL -- need HS-specific |
| India IGST rates (by HS chapter) | CBIC | `CostEngine.ts:200-218` | ~35 chapters | PARTIAL -- 98 chapters total |
| India SWS rate | CBIC | `CostEngine.ts:194` | 1 (flat 10%) | COMPLETE (standard) |
| China consumption tax rates | MOF | `CostEngine.ts:282-289` | 6 chapters | PARTIAL -- ~15 categories exist |
| China VAT rates | MOF | `CostEngine.ts:275-276` | 2 (13% standard, 9% reduced) | COMPLETE |
| Mexico IEPS rates | SAT | `CostEngine.ts:350-354` | 3 chapters | PARTIAL -- ~10 categories exist |
| UK VAT rate | HMRC | `GlobalCostEngine.ts:682` | 1 (20%) | PARTIAL -- no reduced rates |
| EU VAT rates (standard + reduced) | EC | `eu-vat-rates.ts` | 27 countries | COMPLETE |
| AU GST rate | ABF | `GlobalCostEngine.ts:723` | 1 (10%) | COMPLETE |
| GCC VAT rates | National tax authorities | `GlobalCostEngine.ts:69-76` | 6 countries | COMPLETE |
| US ZIP-to-state mapping | USPS | `CostEngine.ts:381-441` | ~200 prefix ranges | COMPLETE |
| Canada postal-to-province | Canada Post | `CostEngine.ts:96-110` | 18 forward sortation areas | COMPLETE |
| Brazil CEP-to-state | Correios | `CostEngine.ts:134-169` | ~70 prefix ranges | COMPLETE |

---

## 5. GAP Summary

| # | Gap | Severity | Impact | Fix Complexity |
|---|---|---|---|---|
| G1 | Brazil IPI flat 10% (should be HS-specific, 0-330%) | HIGH | Significant over/undercharge for specific products in Brazil | HIGH -- need TIPI table (~13K rows) |
| G2 | US sales tax uses state averages, not jurisdiction-level | MEDIUM | ~1-3% variance from actual for specific addresses | HIGH -- would need 13K+ jurisdiction DB or external API |
| G3 | India missing AIDC, Health Cess surcharges | MEDIUM | Understates India import cost by 2-5% for affected goods | LOW -- add 2 rate constants with HS chapter conditions |
| G4 | China consumption tax map incomplete (6 of ~15 categories) | MEDIUM | Missing excise tax on fuel, fireworks, batteries, etc. | LOW -- expand hardcoded map |
| G5 | Mexico IEPS map incomplete (3 of ~10 categories) | MEDIUM | Missing excise tax on pesticides, fossil fuels, junk food | LOW -- expand hardcoded map |
| G6 | Brazil PIS/COFINS base calculation simplified | LOW | ~1-2% understatement of PIS/COFINS for Brazil | MEDIUM -- implement circular "por dentro" calculation |
| G7 | `vat` field holds total special tax (not just VAT) | LOW | API semantic confusion | LOW -- add `specialTaxTotal` field alongside `vat` |
| G8 | China CBEC defaults to true for all imports | LOW | Regular imports incorrectly get 70% discount | LOW -- require explicit `isCBEC` input parameter |
| G9 | UK/Turkey/Korea/Thailand/Indonesia no reduced rates | LOW | Overstates VAT for reduced-rate goods | MEDIUM -- per-country HS-rate maps |
| G10 | India SWS not waived for FTA imports | LOW | Overstates cost for FTA-eligible India imports | LOW -- add FTA conditional check |

---

## 6. Implementation Plan

### Phase 1: Critical Fixes
1. **G1 -- Brazil IPI by HS**: Create `brazil_ipi_rates` table (ncm_code, rate). Source: TIPI table from Receita Federal. ~13,000 rows. Modify `calculateBrazilImportTaxes()` to accept IPI rate parameter instead of using flat 10%.
2. **G3 -- India AIDC/Health Cess**: Add constants `INDIA_AIDC_RATE` (5% for gold HS 7108/7113, 2.5% for palm oil HS 1511) and `INDIA_HEALTH_CESS` (5% for tobacco HS 24, medical devices HS 9018-9022). Apply after BCD, before IGST calculation.

### Phase 2: Expand Coverage
3. **G4 -- China consumption tax**: Expand `CHINA_CONSUMPTION_TAX` map to ~15 entries: add HS 27 (fuel, 1-56%), HS 36 (fireworks, 15%), HS 89 (yachts, 10%), HS 85 (batteries, 4%), HS 32 (coatings, 4%).
4. **G5 -- Mexico IEPS**: Expand `MEXICO_IEPS_RATES` map: add HS 38 (pesticides, 6-9%), HS 27 (fossil fuels, various), energy drinks/junk food (8%).
5. **G8 -- China CBEC input**: Change `isCBEC` default to `false`. Require API input `channel: 'cbec' | 'regular'` for China-bound shipments. Add `channel` to `GlobalCostInput` interface.
6. **G10 -- India SWS FTA waiver**: Check if origin-destination has an active FTA. If yes, set SWS = 0.

### Phase 3: Precision
7. **G2 -- US jurisdiction-level tax**: Evaluate integration with TaxJar or Avalara API for precise US sales tax. Alternatively, import Census Bureau geocoded tax rate file (~13K jurisdictions). This is a large effort and may not be cost-effective for POTAL's B2B API (which estimates customs costs, not US domestic tax compliance).
8. **G9 -- Country-specific reduced VAT rates**: Add UK reduced rates (5% energy, 0% food/children's clothing). Add Korea individual consumption tax. Add Turkey SCT.
9. **G7 -- Semantic clarity**: Add `specialTaxComponents` array to response: `[{ name: 'IPI', rate: 0.10, amount: 5.00 }, ...]` alongside the `vat` field for backward compatibility.

---

## 7. Architecture Diagram

```
Input: { destinationCountry, hsCode, productPrice, shippingCost, importDuty, zipcode }
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 1: Regime Detection      │
                    │  country_code -> tax regime     │
                    │  BR/IN/CN/MX/US/CA/GB/EU/AU/GCC│
                    │  vs generic (standard VAT)     │
                    └───────────────┬───────────────┘
                                    |
              ┌─────────┬─────────┬─┴──────┬─────────┐
              v         v         v        v         v
         ┌────────┐ ┌────────┐ ┌───────┐ ┌───────┐ ┌────────┐
         │ Brazil │ │ India  │ │ China │ │Mexico │ │US/CA   │
         │        │ │        │ │       │ │       │ │        │
         │Step 2: │ │Step 2: │ │Step 2:│ │Step 2:│ │Step 3: │
         │IPI=10% │ │IGST by │ │ConsT  │ │IEPS   │ │State/  │
         │(all)   │ │HS chap │ │by HS  │ │by HS  │ │Province│
         │        │ │        │ │       │ │       │ │rate    │
         │Step 3: │ │        │ │       │ │       │ │lookup  │
         │ICMS by │ │        │ │Step 5:│ │       │ │        │
         │state   │ │        │ │CBEC?  │ │       │ │        │
         │(CEP)   │ │        │ │70% off│ │       │ │        │
         │        │ │        │ │       │ │       │ │        │
         │Step 4: │ │Step 4: │ │Step 4:│ │Step 4:│ │Step 6: │
         │cascade:│ │cascade:│ │CBEC or│ │cascade│ │Single  │
         │II→IPI→ │ │BCD→SWS│ │regular│ │duty→  │ │rate x  │
         │PIS/COF │ │→IGST   │ │calc   │ │IEPS→  │ │base    │
         │→ICMS   │ │        │ │       │ │IVA    │ │        │
         └───┬────┘ └───┬────┘ └──┬────┘ └──┬────┘ └───┬────┘
             └─────┬─────┴────┬────┴────┬────┘          |
                   v          v         v               v
              ┌────────────────────────────────────────────┐
              │  Step 6: Final Special Tax Total            │
              │  totalTax = sum of all components           │
              │  effectiveRate = totalTax / declaredValue   │
              │  breakdown[] = individual line items        │
              └────────────────────────────────────────────┘
```
