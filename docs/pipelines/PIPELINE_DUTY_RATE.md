# PIPELINE: Duty Rate Determination
> Technical design document for the POTAL duty rate pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (12 Steps)

A customs broker determines the applicable duty rate in this order:

1. HS Code confirmed
2. Origin country confirmed
3. MFN rate lookup
4. FTA applicability check
5. Rules of Origin (RoO) compliance check
6. Preferential rate lookup
7. AD/CVD check
8. Safeguard check
9. Special tariffs (Section 301/232, EU retaliation)
10. Duty relief/exemption check (temporary import, FTZ, GSP)
11. Final rate determination
12. Duty amount calculation (CIF x rate or specific duty)

---

## 2. Step-by-Step Analysis

### Step 1: HS Code Confirmed
- **Practitioner action**: Classify the product to an HS code at the national tariff line level (6-10 digits). Confirm with ruling if ambiguous.
- **Current code**: `app/lib/cost-engine/ai-classifier/` (3-stage pipeline: DB cache -> keyword -> LLM). HS10 resolution in `app/lib/cost-engine/hs-code/hs10-resolver.ts`. Called from `GlobalCostEngine.ts:347-358` (classifyWithOverrideAsync) and `GlobalCostEngine.ts:364-380` (resolveHs10).
- **Method**: DB_LOOKUP + AI_CALL (fallback)
- **Data source**: `product_hs_mappings` (8,389 rows), `hs_classification_vectors` (3,431 rows), `gov_tariff_schedules` (89,842 rows for HS10), `precomputed_hs10_candidates` (1,090 rows)
- **GAP**: Classification is well-implemented. Minor gap: no formal "binding ruling" or classification audit trail per-request in the main pipeline (though `/api/v1/classify/audit` endpoint exists separately). Price-break rules (`hs_price_break_rules`, 18 rows) exist but integration into the main engine path is unclear from the orchestrator code.

---

### Step 2: Origin Country Confirmed
- **Practitioner action**: Determine country of origin via documentation (Bill of Lading, Certificate of Origin, manufacturer records). Distinguish country of origin from country of export.
- **Current code**: `GlobalCostEngine.ts:78-91` (`detectOriginForGlobal`) + `GlobalCostEngine.ts:356-358` (AI-detected origin from product classifier).
- **Method**: CODE (heuristic) + AI_CALL (fallback)
- **Data source**: Input field `origin` (ISO2), platform detection (AliExpress->CN, etc.), AI classifier `countryOfOrigin` field.
- **GAP**:
  - Origin detection is simplistic: platform-name heuristic, falls back to `'US'` if unknown. A real broker would reject unknown origin rather than assume.
  - No distinction between "country of origin" vs "country of export" (matters for AD/CVD, FTA).
  - No validation that the stated origin is plausible given the product type.
  - The `origin-detection.ts` file exists but is separate from the main pipeline flow.

---

### Step 3: MFN Rate Lookup
- **Practitioner action**: Look up the MFN (Most Favored Nation) bound rate in the national tariff schedule for the confirmed HS code.
- **Current code**: `app/lib/cost-engine/macmap-lookup.ts:167-201` (`lookupNtlc` - Stage 3 NTLC = MFN). Called from `lookupAllDutyRates()` at line 335-339. Orchestrated in `GlobalCostEngine.ts:442` via `lookupAllDutyRates()`.
- **Method**: DB_LOOKUP
- **Data source**: `macmap_ntlc_rates` (537,894 rows, 186 countries MFN), `macmap_min_rates` (~105M rows), `macmap_agr_rates` (~129M rows). Fallback chain: precomputed cache (117,600) -> MacMap 3-table parallel -> gov API cache (`duty_rates_live`) -> chapter-level DB -> hardcoded.
- **GAP**:
  - MFN lookup uses HS6 prefix matching, not exact national tariff line match. For 7 countries with gov_tariff_schedules (89,842 HS10 rows), the HS10-resolved duty rate from `hs10-resolver.ts` is fetched but its integration back into the duty rate is incomplete -- `GlobalCostEngine.ts:374-376` has a comment "Will be used as additional context below" but the HS10 duty rate is not actually used to override the MacMap rate.
  - Non-ad-valorem (NAV) duty text is captured (`navDutyText` field) but not parsed into an actual rate. Compound duties (e.g., "5% + $0.30/kg") are not calculated.

---

### Step 4: FTA Applicability Check
- **Practitioner action**: Determine if an FTA exists between origin and destination. Check if the product's HS code is covered (not excluded). Identify all applicable FTAs and select the most beneficial.
- **Current code**: `app/lib/cost-engine/hs-code/fta.ts:854-896` (`findApplicableFta` - 63 hardcoded FTAs). DB-backed version: `app/lib/cost-engine/db/fta-db.ts:15-61` (`findApplicableFtaFromDb`). Also `macmap_trade_agreements` (1,319 rows) used in `macmap-lookup.ts:292-313` for agreement name resolution. Orchestrated in `GlobalCostEngine.ts:487-514`.
- **Method**: DB_LOOKUP + CODE
- **Data source**: Hardcoded `FTA_AGREEMENTS[]` (63 FTAs in `fta.ts`), `macmap_trade_agreements` (1,319 DB rows), `duty_rates_live` (gov API FTA rates).
- **GAP**:
  - FTA check is automatic and does not verify that the goods actually qualify. Finding an FTA exists != being eligible for preferential rate. Steps 4 and 5 are conflated in the current code.
  - The `preferentialMultiplier` is a blunt instrument (e.g., RCEP = 0.5 flat). Real FTA tariff schedules have product-specific rates by HS code and year (staging schedules). MacMap AGR table has this granularity but the hardcoded FTA list does not.
  - Chapter exclusion lists are incomplete (e.g., USMCA has no `excludedChapters` defined).
  - No staging schedule awareness (FTA rates phase in over years).

---

### Step 5: Rules of Origin (RoO) Compliance Check
- **Practitioner action**: Verify the product meets the FTA's Rules of Origin: tariff shift (CTH/CTSH/CC), regional value content (RVC), product-specific rules, de minimis, accumulation. Requires manufacturer supply chain data.
- **Current code**: Two implementations:
  1. `app/lib/cost-engine/hs-code/fta.ts:728-829` (`getRulesOfOrigin`) - Chapter-level RoO rules for USMCA/RCEP/CPTPP with certificate type info.
  2. `app/lib/trade/roo-engine.ts:35-108` (`evaluateRoO`) - Evaluates WO/RVC/CTH/CC/CTSH criteria given material inputs.
- **Method**: CODE (rule evaluation) -- requires buyer/seller input data
- **Data source**: Hardcoded `FTA_ROO_DEFAULTS` in `fta.ts` (USMCA, RCEP, CPTPP chapter rules). `RVC_THRESHOLDS` in `roo-engine.ts` (8 FTAs).
- **GAP**:
  - **Not called in the main pipeline.** `GlobalCostEngine.ts` never invokes `evaluateRoO()` or `getRulesOfOrigin()`. The FTA preferential rate is applied automatically without verifying RoO compliance. This is the biggest accuracy gap in the pipeline.
  - In practice, if FTA rate is applied without RoO verification, the duty could be understated. A broker would never apply a preferential rate without confirming origin compliance.
  - The RoO engine requires material/BOM data (`materials[]`) that the API does not collect by default.
  - Only 3 FTAs have chapter-specific rules (USMCA/RCEP/CPTPP). The other 60 FTAs fall back to generic CTH + RVC 40%.
  - `evaluateRoO` is a separate S+ grade library, not integrated into `calculateGlobalLandedCostAsync`.

---

### Step 6: Preferential Rate Lookup
- **Practitioner action**: If RoO is satisfied, look up the FTA preferential tariff rate for the specific HS code. This may be 0%, reduced, or excluded.
- **Current code**: `GlobalCostEngine.ts:487-514`. Two paths:
  1. `getFtaRateFromLiveDb()` (gov API cached FTA rates in `duty_rates_live`) at line 488.
  2. `applyFtaRateFromDb()` -> `fta-db.ts:66-84` (multiplier-based) at line 499.
  Also: MacMap AGR rates (`macmap_agr_rates` ~129M rows) are the most granular source, queried in Step 3 via `lookupAllDutyRates()` which already picks the lowest rate across AGR/MIN/NTLC.
- **Method**: DB_LOOKUP
- **Data source**: `macmap_agr_rates` (~129M rows, product-level FTA rates), `duty_rates_live` (gov API), hardcoded multipliers.
- **GAP**:
  - The MacMap AGR lookup (`lookupAllDutyRates`) already finds the lowest rate across all agreements and applies it at Step 3. Then Step 6 (`applyFtaRateFromDb`) may apply a second FTA discount on top, potentially double-counting the preference. The pipeline should use AGR rate OR the multiplier approach, not both sequentially.
  - Specifically: if `lookupAllDutyRates()` returns an AGR rate of 0% (best), then `applyFtaRateFromDb()` is called on `dutyRate` which is already 0%, so no harm. But if AGR returns 5% and the hardcoded multiplier is 0.0 (duty-free), the rate gets reduced to 0% without verifying RoO. The MacMap AGR data already encodes the real preferential rate, so the hardcoded multiplier can override it incorrectly.
  - FTA staging schedules (rates that decrease year-over-year) are in AGR data but not in the hardcoded FTA list.

---

### Step 7: AD/CVD Check
- **Practitioner action**: Check if anti-dumping or countervailing duties apply to the product from the specific origin country. Identify firm-specific vs "all others" rate. AD and CVD are cumulative (both can apply simultaneously).
- **Current code**: `app/lib/cost-engine/trade-remedy-lookup.ts:149-298` (`lookupTradeRemedies`). Full implementation with firm-specific matching (exact, fuzzy, pg_trgm), "All Others" fallback, HS hierarchical matching (6->4 digit). Called from `GlobalCostEngine.ts:522-532`.
- **Method**: DB_LOOKUP + CODE (firm matching)
- **Data source**: `trade_remedy_cases` (10,999 rows), `trade_remedy_products` (55,259 rows), `trade_remedy_duties` (37,513 rows). Coverage: TTBD 36 countries AD + 19 countries CVD.
- **GAP**:
  - Well-implemented. Firm-specific matching with fuzzy search and pg_trgm is production-quality.
  - Minor: `trade-remedy-lookup.ts` queries `trade_remedy_cases` filtering on `affected_country` (line 203) but `remedy-calculator.ts` queries on `exporting_country` (line 46). Column name inconsistency suggests different data schemas -- verify which is correct.
  - No "scope" checking: AD orders have specific product descriptions that may not align perfectly with HS codes. The HS-based matching could false-positive.
  - Sunset review dates are tracked in `remedy-calculator.ts:83-94` but not surfaced in the main pipeline.

---

### Step 8: Safeguard Check
- **Practitioner action**: Check if safeguard measures (global tariff surcharges on a product regardless of origin, with country-specific exemptions) apply. Verify if origin country is exempt.
- **Current code**: Handled within `trade-remedy-lookup.ts:214-232`. SG cases filtered from `trade_remedy_cases`, exemptions checked via `safeguard_exemptions` table. Called as part of `lookupTradeRemedies()`.
- **Method**: DB_LOOKUP
- **Data source**: `trade_remedy_cases` (SG type), `safeguard_exemptions` (15,935 rows), WTO SG data.
- **GAP**:
  - Safeguard exemption checking is implemented. Good coverage.
  - Minor: Safeguard tariff quotas (TRQ) are not handled. Some safeguards have a lower in-quota rate and higher over-quota rate. Current implementation uses a single rate.
  - Safeguard measures are queried alongside AD/CVD using the same origin filter. Safeguards are typically global (not origin-specific), though the exemption check handles this partially.

---

### Step 9: Special Tariffs (Section 301/232, EU Retaliation)
- **Practitioner action**: Check for executive-action tariffs that sit outside the normal tariff schedule. US: Section 301 (China lists), Section 232 (steel/aluminum), IEEPA Fentanyl tariff. EU: retaliatory tariffs on US goods. Other countries: similar unilateral measures.
- **Current code**: `app/lib/cost-engine/section301-lookup.ts:1-177`. Implements Section 301 (4 China lists by HS chapter) and Section 232 (steel ch72-73 at 25%, aluminum ch76 at 10%). Country exemptions for 232 (AU, AR, BR, KR). Called from `GlobalCostEngine.ts:537-547`.
- **Method**: CODE (hardcoded rules)
- **Data source**: Hardcoded `SECTION_301_LISTS[]` and `SECTION_232_*` constants. No DB table.
- **GAP**:
  - **Section 301 matching is at HS chapter (2-digit) level, not tariff line level.** The real Section 301 lists have specific HTSUS 8-digit lines. Chapter-level matching causes massive over-inclusion (e.g., ch85 includes everything from batteries to smartphones, but only some lines are on List 1).
  - **List 4A rate is wrong**: Code says 7.5% (`0.075`), but in 2025 List 4A was raised back to 25% for most items. The rate is outdated.
  - **Section 232 exemptions are outdated**: AU/AR/BR/KR exemptions were replaced by TRQs or removed. As of 2025-2026, Section 232 applies to all countries with no exemptions (25% steel, 25% aluminum -- aluminum was raised from 10% to 25% in Feb 2025).
  - **Missing**: US IEEPA Fentanyl tariff (+20% on all Chinese goods, stacked on top of Section 301). `CostEngine.ts:33-34` references "Reciprocal 10% + Fentanyl 10% = 20%" but this is not in the GlobalCostEngine pipeline for non-US-CostEngine paths.
  - **Missing**: US Reciprocal tariffs (April 2025+, varies by country, 10-60%).
  - **Missing**: EU retaliatory tariffs on US goods (response to 232). Only one file reference found in `CostEngine.ts`.
  - **Missing**: Other country retaliation measures (Canada, China, Mexico, India retaliatory tariffs).
  - **US-only**: No equivalent for other importing countries. EU/UK/Canada have their own special tariff programs.

---

### Step 10: Duty Relief/Exemption Check
- **Practitioner action**: Check if any duty relief programs apply: temporary import (ATA Carnet), Foreign Trade Zone (FTZ), GSP (Generalized System of Preferences), duty drawback (re-export), bonded warehouse, inward processing relief, IOSS (EU <150 EUR).
- **Current code**:
  - Temporary import: `app/lib/trade/temporary-import.ts:1-41` (7 country rules, ATA Carnet, bond calculation). Not called in main pipeline.
  - Duty drawback: `app/lib/trade/duty-drawback.ts:1-67` (US rules, 3 types, 5-year limit). Not called in main pipeline.
  - FTZ: `app/api/v1/compliance/ftz/route.ts` exists (API endpoint). Not integrated into cost calculation.
  - SEZ: `app/lib/trade/sez-database.ts` exists. Not integrated into cost calculation.
  - IOSS: `GlobalCostEngine.ts:691-714` (EU IOSS handling for <=150 EUR, duty waived).
  - De minimis: `GlobalCostEngine.ts:556-563` (duty/tax threshold split).
  - GSP: **MISSING entirely.** No GSP lookup, no eligible country list, no product coverage check.
- **Method**: CODE + DB_LOOKUP (mixed)
- **Data source**: Hardcoded country rules in `temporary-import.ts`. De minimis from `de_minimis_thresholds` (240 rows). IOSS threshold hardcoded.
- **GAP**:
  - **GSP is completely missing.** The US GSP program (and EU GSP, UK DCTS, etc.) provides duty-free treatment for developing country exports. This is a major gap -- many e-commerce products from Vietnam, Cambodia, Bangladesh, India, etc. qualify for 0% duty under GSP but the engine charges full MFN.
  - Temporary import, duty drawback, FTZ, SEZ exist as standalone libraries but are **not integrated into the main `calculateGlobalLandedCostAsync` pipeline**. They are available as separate API endpoints only.
  - Inward Processing Relief (EU/UK) is not implemented.
  - Bonded warehouse treatment is not implemented.
  - No logic to suggest to the user that relief programs may apply.

---

### Step 11: Final Rate Determination
- **Practitioner action**: Sum all applicable duty components: base rate (MFN or preferential) + AD + CVD + safeguard + special tariffs. Apply any exemptions. Determine the effective rate. Document the legal basis for each component.
- **Current code**: `GlobalCostEngine.ts:516-547`. Sequential addition:
  ```
  baseDutyRate = dutyRate (after FTA)
  + tradeRemedyRate (AD/CVD/SG from lookupTradeRemedies)
  + usAdditionalRate (Section 301/232 from lookupUSAdditionalTariffs)
  = final dutyRate
  ```
  Tariff optimization result built in `macmap-lookup.ts:321-425` (`lookupAllDutyRates`).
- **Method**: CODE
- **Data source**: Accumulated from Steps 3-10.
- **GAP**:
  - Rate stacking order is correct (base + AD/CVD + special = total).
  - The `tariffOptimization` output compares MFN/MIN/AGR rates and shows savings, which is good.
  - Missing: Legal basis citation for each rate component. A broker would reference the specific HTSUS heading, FTA article, AD order number, etc.
  - Missing: Confidence score for the composite rate. Individual scores exist for duty rate source but the compound rate (after adding remedies, special tariffs) does not recalculate overall confidence.
  - The `detailedCostBreakdown` (15 items, lines 282-283) is defined in the type but its population logic is in a section not read (likely further in the file).

---

### Step 12: Duty Amount Calculation
- **Practitioner action**: Calculate the actual duty payment. Ad valorem: CIF value x rate. Specific duty: quantity/weight x per-unit rate. Compound: ad valorem + specific. Apply rounding rules per country.
- **Current code**: `GlobalCostEngine.ts:566-569`:
  ```typescript
  importDuty = declaredValue * dutyRate;
  ```
  Where `declaredValue = productPrice + shippingCost` (line 341). Breakdown split at lines 763-764 into base duty and additional tariff amounts.
- **Method**: CODE
- **Data source**: `productPrice`, `shippingCost` from input. `dutyRate` from Step 11.
- **GAP**:
  - **Only ad valorem calculation is implemented.** The `DutyType` enum defines `'ad_valorem' | 'specific' | 'compound' | 'mixed'` (line 160) and `weight_kg`/`quantity` are accepted inputs (lines 107-109), but the calculation at line 568 is purely `declaredValue * dutyRate`. Specific duties ($X/kg) and compound duties (X% + $Y/unit) are not calculated.
  - `navDutyText` is captured from MacMap data but never parsed into a specific duty amount.
  - Customs valuation method is CIF-like (`productPrice + shippingCost`) but does not include insurance. The `insuranceRate` input exists but is not used in the duty base calculation.
  - No FOB/CIF distinction for duty base. Some countries (US) assess duty on FOB value; most others (EU, UK, AU) use CIF. The code uses `declaredValue = price + shipping` for all countries.
  - Country-specific rounding rules not implemented (e.g., Japan rounds down to nearest 1000 JPY).

---

## 3. GAP Analysis Summary

### Critical Gaps (Affect Accuracy)

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| G1 | RoO not checked before applying FTA rate | FTA rate applied without verifying origin eligibility. Duty could be understated. | P0 |
| G2 | Section 301 at chapter level, not tariff line | Massive over-inclusion. Products not on any list get charged 25%. | P0 |
| G3 | Section 301 List 4A rate outdated (7.5% -> 25%) | Undercharges duty on List 4A goods by 17.5pp. | P0 |
| G4 | Section 232 exemptions outdated, aluminum rate wrong | Undercharges aluminum (10% -> 25%). False exemptions for AU/AR/BR/KR. | P0 |
| G5 | GSP completely missing | Overcharges duty for developing country exports (could be 0% vs 5-15% MFN). | P1 |
| G6 | Specific/compound duties not calculated | Many tariff lines have per-kg or per-unit rates. Returns 0 for these. | P1 |
| G7 | HS10 duty rate not used in main pipeline | HS10 is resolved but its duty rate is discarded. Wastes the computation. | P1 |
| G8 | US Reciprocal tariffs missing | April 2025+ country-specific tariffs (10-60%) not implemented. | P0 |
| G9 | IEEPA Fentanyl tariff missing from GlobalCostEngine | +20% on China goods not applied in the async pipeline path. | P0 |
| G10 | Potential double FTA discount (AGR + multiplier) | AGR rate already includes FTA preference, then multiplier may reduce further. | P1 |

### Moderate Gaps (Affect Completeness)

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| G11 | FOB vs CIF duty base not country-specific | US should use FOB; EU/UK/AU use CIF. Off by insurance amount. | P2 |
| G12 | EU/UK/other retaliatory tariffs missing | Only US special tariffs implemented. | P2 |
| G13 | Safeguard TRQs not handled | Single rate used instead of in-quota/over-quota distinction. | P2 |
| G14 | FTA staging schedules not implemented | Rate phase-in over years ignored (uses current AGR data which is fine, but hardcoded multipliers may be wrong). | P2 |
| G15 | Temporary import/drawback/FTZ/SEZ not in main pipeline | Exist as standalone but user doesn't see potential savings. | P3 |
| G16 | No legal basis citations | Broker would cite HTSUS heading, FTA article, AD order #. | P3 |
| G17 | AD/CVD scope vs HS matching | HS-based matching may false-positive if scope is narrower than HS6. | P2 |
| G18 | Origin country of export vs origin not distinguished | AD/CVD and FTA rules treat these differently. | P2 |

---

## 4. Data Inventory

### In DB (Available)

| Table | Rows | Covers Step | Notes |
|-------|------|-------------|-------|
| macmap_ntlc_rates | 537,894 | 3 (MFN) | 186 countries, HS6-level |
| macmap_min_rates | ~105M | 3/6 (MIN) | 53 countries, product-level |
| macmap_agr_rates | ~129M | 6 (Preferential) | 53 countries, FTA product-level |
| macmap_trade_agreements | 1,319 | 4 (FTA) | Agreement metadata |
| trade_remedy_cases | 10,999 | 7/8 (AD/CVD/SG) | 36 countries AD + 19 CVD + WTO SG |
| trade_remedy_products | 55,259 | 7/8 | HS codes per case |
| trade_remedy_duties | 37,513 | 7/8 | Firm-specific rates |
| safeguard_exemptions | 15,935 | 8 | Country exemptions |
| product_hs_mappings | 8,389 | 1 (HS code) | Product name -> HS6 |
| hs_classification_vectors | 3,431 | 1 | Embedding vectors |
| gov_tariff_schedules | 89,842 | 1/3 (HS10) | 7 countries HS10 |
| precomputed_landed_costs | 117,600 | 3/6 (cache) | 490 HS6 x 240 countries |
| precomputed_hs10_candidates | 1,090 | 1 (HS10) | US/EU/GB candidates |
| de_minimis_thresholds | 240 | 10 (exemption) | All countries |
| vat_gst_rates | 240 | N/A (tax, not duty) | All countries |
| sanctions_entries | 21,301 | N/A (compliance) | OFAC SDN + CSL |
| hs_price_break_rules | 18 | 1 | "valued over/under" rules |
| divergence_map | 61,258 | 1 (HS10) | 7-country HS10 divergence |

### In Code (Hardcoded)

| Constant/File | Covers Step | Notes |
|---------------|-------------|-------|
| `FTA_AGREEMENTS[]` (63 FTAs) | 4 | fta.ts, with excluded chapters |
| `FTA_ROO_DEFAULTS` (3 FTAs) | 5 | USMCA/RCEP/CPTPP chapter rules |
| `SECTION_301_LISTS[]` | 9 | 4 China lists, chapter-level |
| `SECTION_232_*` | 9 | Steel/aluminum chapters + exemptions |
| `COUNTRY_RULES` (7 countries) | 10 | Temporary admission rules |
| `RVC_THRESHOLDS` (8 FTAs) | 5 | RoO thresholds |

### Needed (Not Yet Available)

| Data Needed | For Step | Source | Priority |
|-------------|----------|--------|----------|
| Section 301 tariff-line list (HTSUS 8-digit) | 9 | USTR published lists (PDF/CSV) | P0 |
| US Reciprocal tariff rates by country | 9 | Executive Order / CBP | P0 |
| IEEPA Fentanyl tariff parameters | 9 | Executive Order | P0 |
| GSP eligible countries + product lists | 10 | USTR GSP guidebook / USITC HTS General Notes | P1 |
| EU GSP / UK DCTS eligible country-product lists | 10 | EU Official Journal / UK gov | P1 |
| Specific duty rates parsed (per-kg, per-unit) | 12 | Parse from `navDutyText` in macmap tables | P1 |
| EU retaliatory tariff list (on US goods) | 9 | EU Official Journal | P2 |
| Canada/China/Mexico/India retaliation lists | 9 | Government gazettes | P2 |
| Inward Processing Relief rules by country | 10 | National customs authorities | P3 |
| FTA staging schedules (year-over-year rates) | 6 | FTA legal texts (already in AGR data) | P3 |

---

## 5. AI Decision Points

| Step | Method | AI Needed? | Rationale |
|------|--------|------------|-----------|
| 1. HS Code | DB_LOOKUP -> AI_CALL | Yes (fallback) | DB cache hit = $0. Unknown products need LLM classification. |
| 2. Origin | CODE -> AI_CALL | Yes (fallback) | Platform heuristic first. AI detects origin from product name/description. |
| 3. MFN rate | DB_LOOKUP | No | Pure data lookup. 186 countries in DB. |
| 4. FTA check | DB_LOOKUP | No | Membership check against known FTA list. |
| 5. RoO | CODE | No | Rule evaluation (CTH/RVC/WO). Requires input data, not AI. |
| 6. Preferential rate | DB_LOOKUP | No | AGR table has product-level FTA rates. |
| 7. AD/CVD | DB_LOOKUP + CODE | No (fuzzy match only) | Firm name fuzzy matching uses pg_trgm, not LLM. |
| 8. Safeguard | DB_LOOKUP | No | Exemption table lookup. |
| 9. Special tariffs | CODE | No | Rule-based (country + HS chapter/line). |
| 10. Duty relief | DB_LOOKUP | No | GSP eligibility is a lookup. |
| 11. Final rate | CODE | No | Arithmetic summation. |
| 12. Duty amount | CODE | No | CIF x rate (or specific). |

**Summary**: AI is only needed at Steps 1 and 2 (classification and origin detection). The entire duty rate determination (Steps 3-12) should be pure code + DB lookups with zero AI calls.

---

## 6. Implementation Plan

### Phase 1: Fix Critical Accuracy Bugs (P0)

**1a. Section 301/232 tariff-line data** (G2, G3, G4)
- Download USTR Section 301 lists (Lists 1-4A+B) as HTSUS 8-digit.
- Create DB table `us_section301_lines` with columns: hts8, list_name, rate, effective_date.
- Replace chapter-level matching with tariff-line lookup.
- Update Section 232: remove exemptions, set aluminum to 25%.
- Update List 4A rate to 25%.
- File: `section301-lookup.ts` -- rewrite to use DB.

**1b. US Reciprocal tariffs + IEEPA Fentanyl** (G8, G9)
- Create DB table `us_reciprocal_tariffs` with columns: country_iso2, rate, effective_date, status.
- Add IEEPA Fentanyl tariff: +20% on CN origin, all HS codes.
- Integrate into `GlobalCostEngine.ts` alongside Section 301/232 block.

**1c. Prevent double FTA discount** (G10)
- If `lookupAllDutyRates()` returns an AGR result, skip the secondary `applyFtaRateFromDb()` call.
- The AGR data already encodes the correct preferential rate.
- File: `GlobalCostEngine.ts:487-514` -- add condition.

### Phase 2: Add Missing Programs (P1)

**2a. GSP implementation** (G5)
- Create DB table `gsp_eligibility` with columns: program (US_GSP/EU_GSP/UK_DCTS), beneficiary_country, hs_code_prefix, status.
- Populate from USTR GSP guidebook and EU/UK sources.
- Insert GSP check between Steps 6 and 7 in pipeline. If GSP applies and rate < preferential rate, use GSP rate.
- New file: `app/lib/cost-engine/gsp-lookup.ts`.

**2b. Specific/compound duty parsing** (G6)
- Parse `navDutyText` from macmap tables into structured form: { adValorem: number, specific: { amount: number, unit: 'kg'|'unit'|'liter' } }.
- Use `weight_kg` and `quantity` inputs to calculate specific duty component.
- Add to duty calculation in `GlobalCostEngine.ts:566-569`.
- New file: `app/lib/cost-engine/nav-duty-parser.ts`.

**2c. HS10 duty rate integration** (G7)
- When `hs10Result.dutyRate` is available and `hsCodePrecision === 'HS10'`, use it as the primary duty rate instead of MacMap HS6 rate.
- File: `GlobalCostEngine.ts:364-380` -- wire the resolved rate.

### Phase 3: RoO Integration (P1-P2)

**3a. RoO warning in main pipeline** (G1)
- When FTA preferential rate is applied, add a `rooWarning` field to the response:
  `"FTA preferential rate applied. Origin compliance (RoO) not verified. Provide materials data for verification."`
- If `materials[]` input is provided, call `evaluateRoO()` and only apply FTA rate if eligible.
- File: `GlobalCostEngine.ts` -- add RoO check between FTA rate application and final rate.

### Phase 4: Country-Specific Refinements (P2)

**4a. FOB vs CIF duty base** (G11)
- Add country config: `dutyBase: 'FOB' | 'CIF'`. US/KR = FOB; EU/UK/AU/JP/most = CIF.
- Adjust `declaredValue` for duty calculation based on country.
- When CIF: include insurance estimate (default 0.5% of product value).

**4b. Other country retaliatory tariffs** (G12)
- Model as a general `special_tariffs` DB table: country_imposing, country_target, hs_prefix, rate, program_name, effective_date.
- Populate for EU/Canada/China/Mexico/India retaliation measures.
- Replace country-specific hardcoded logic with DB lookup.

**4c. Safeguard TRQs** (G13)
- Add `quota_volume` and `over_quota_rate` columns to safeguard data.
- Requires tracking import volume (future feature).

### Phase 5: Polish (P3)

- Integrate duty relief suggestion (temporary import, drawback, FTZ) into response metadata.
- Add legal basis citations to each rate component.
- Implement country-specific rounding rules.
- Surface sunset review alerts from trade remedy data.

---

## 7. File Map

| File | Pipeline Steps Covered | Status |
|------|----------------------|--------|
| `app/lib/cost-engine/GlobalCostEngine.ts` | Orchestrator (all steps) | Core file, ~900 lines |
| `app/lib/cost-engine/macmap-lookup.ts` | 3, 6 (MFN/MIN/AGR lookup) | Complete, 426 lines |
| `app/lib/cost-engine/trade-remedy-lookup.ts` | 7, 8 (AD/CVD/SG) | Complete, 450 lines |
| `app/lib/cost-engine/section301-lookup.ts` | 9 (US special tariffs) | Needs rewrite (P0) |
| `app/lib/cost-engine/hs-code/fta.ts` | 4, 5 (FTA + RoO definitions) | 63 FTAs, 3 FTA RoO rules |
| `app/lib/cost-engine/db/fta-db.ts` | 4, 6 (DB-backed FTA) | Complete, 85 lines |
| `app/lib/cost-engine/db/duty-rates-db.ts` | 3 (chapter-level fallback) | Complete, 105 lines |
| `app/lib/trade/roo-engine.ts` | 5 (RoO evaluation) | Not integrated into pipeline |
| `app/lib/trade/remedy-calculator.ts` | 7, 8 (alternative remedy calc) | Standalone, not in main pipeline |
| `app/lib/trade/duty-drawback.ts` | 10 (drawback) | Standalone API only |
| `app/lib/trade/temporary-import.ts` | 10 (temp admission) | Standalone API only |
| `app/lib/trade/sez-database.ts` | 10 (SEZ/FTZ) | Standalone |
| `app/lib/compliance/export-controls.ts` | N/A (export side) | Standalone |
| `app/lib/compliance/fuzzy-screening.ts` | N/A (sanctions) | Standalone |
| `app/lib/cost-engine/ai-classifier/` | 1 (HS classification) | Complete |
| `app/lib/cost-engine/hs-code/hs10-resolver.ts` | 1 (HS10 resolution) | Not wired to duty rate |
| `app/lib/cost-engine/origin-detection.ts` | 2 (origin) | Exists, partially used |
| `app/lib/cost-engine/CostEngine.ts` | 12 (US-specific calc) | Legacy, US-focused |
