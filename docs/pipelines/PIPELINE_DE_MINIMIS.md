# PIPELINE: De Minimis Threshold Determination
> Technical design document for the POTAL de minimis exemption pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (6 Steps)

A customs specialist determines de minimis exemption eligibility in this order:

1. Destination country de minimis threshold lookup
2. Valuation basis determination (FOB vs CIF vs statistical value)
3. Duty de minimis vs VAT de minimis separation
4. Product-type exception check (alcohol/tobacco/perfume excluded)
5. Recent policy change awareness (US $800->$0, AU vendor collection)
6. Final determination (duty exempt / VAT exempt / both / neither)

---

## 2. Step-by-Step Analysis

### Step 1: Destination Country De Minimis Threshold Lookup
- **Practitioner action**: Look up the destination country's official de minimis threshold. This is the declared value below which customs duty (and sometimes VAT) is waived. Threshold is denominated in the local currency; must convert to the transaction currency for comparison.
- **Current code**: `GlobalCostEngine.ts:556` reads `profile.deMinimisUsd` from the country profile. Profile loaded via `getCountryProfileFromDb()` at line 309 (async) or `getCountryProfile()` at line 1156 (sync). Hardcoded values in `country-data.ts:43-onward` (COUNTRY_DATA object, 220+ countries). DB-backed version in `db/country-data-db.ts:34-44` reads from Supabase `de_minimis_thresholds` (240 rows) via `tariff-cache.ts`.
- **Method**: DB_LOOKUP (primary) / CODE (hardcoded fallback)
- **Data source**: `de_minimis_thresholds` table (240 rows), `country-data.ts` COUNTRY_DATA (220+ hardcoded profiles)
- **GAP**:
  - The `deMinimisUsd` field stores a single USD-equivalent value per country. This is a static snapshot -- exchange rate fluctuations can make the USD equivalent stale. A practitioner would convert using the day's exchange rate against the local-currency threshold (`deMinimis` field in local currency).
  - The code at line 556 (`const dutyThresholdUsd = profile.deMinimisUsd`) uses the pre-converted USD value rather than dynamically converting `profile.deMinimis` in `profile.deMinimsCurrency` using the live exchange rate engine (`convertCurrency()`). Since POTAL already has a live exchange rate system, this is a missed opportunity for accuracy.
  - Some countries have multiple thresholds depending on entry channel (e.g., postal vs express courier vs formal entry). The current model stores only one threshold per country.

---

### Step 2: Valuation Basis Determination (FOB vs CIF vs Statistical Value)
- **Practitioner action**: Determine which value to compare against the de minimis threshold. Different countries use different valuation bases:
  - **FOB-based**: US, Australia, Canada -- threshold applies to the goods value only (excluding freight/insurance).
  - **CIF-based**: EU, UK, most of Asia -- threshold applies to goods + shipping + insurance.
  - **Statistical/transaction value**: Some countries use invoice value or transaction value.
- **Current code**: `GlobalCostEngine.ts:341` calculates `declaredValue = productPrice + shippingCost`. This CIF-like value is used for ALL countries at lines 561-562: `declaredValue <= dutyThresholdUsd`.
- **Method**: CODE
- **Data source**: None (hardcoded as CIF for all countries)
- **GAP**:
  - **Valuation basis is not country-specific.** The code always uses `productPrice + shippingCost` (CIF) for the de minimis comparison. For FOB-based countries (US, AU, CA), the comparison should use `productPrice` only (excluding shipping).
  - Example: A $780 product with $50 shipping to the US. Declared value = $830 (CIF) which exceeds $800. But the US de minimis is FOB-based, so the correct comparison is $780 < $800 = exempt. Current code would incorrectly deny the exemption.
  - The `CountryTaxProfile` interface has no `deMinimisValuationBasis` field. This field is **NEEDED** in both the DB table and the TypeScript interface.
  - Insurance is not included in `declaredValue` even for CIF-based countries (insurance is calculated separately at lines 894-903, after de minimis check). For true CIF comparison, insurance should be included.

---

### Step 3: Duty De Minimis vs VAT De Minimis Separation
- **Practitioner action**: Many countries have DIFFERENT thresholds for duty exemption vs tax exemption. Key examples:
  - **EU**: Duty exempt <=EUR 150, but VAT always applies (collected via IOSS for <=EUR 150, at border for >EUR 150).
  - **UK**: Duty exempt <=GBP 135, but VAT always applies (seller-collected <=GBP 135, import VAT >GBP 135).
  - **US**: $800 de minimis covers BOTH duty and tax (Section 321).
  - **AU**: No de minimis for GST since Jul 2018 (GST applies to all imports). Duty de minimis AUD 1,000.
  - **Canada**: CAD 20 duty de minimis, CAD 20 tax de minimis (both low).
  - **Norway**: No VAT de minimis since Apr 2020 (VOEC scheme, VAT on all imports).
  - **Switzerland**: No duty de minimis for most goods; VAT exempt if tax amount < CHF 5.
- **Current code**: `GlobalCostEngine.ts:552-563`:
  ```
  const dutyThresholdUsd = profile.deMinimisUsd;
  const taxAlwaysAppliesCountries = new Set([...EU_IOSS_COUNTRIES, 'GB', 'AU', 'NZ', 'NO', 'CH']);
  const taxThresholdUsd = taxAlwaysAppliesCountries.has(profile.code) ? 0 : profile.deMinimisUsd;
  const dutyExempt = !isDomestic && declaredValue > 0 && declaredValue <= dutyThresholdUsd && dutyThresholdUsd > 0;
  const taxExempt = !isDomestic && declaredValue > 0 && declaredValue <= taxThresholdUsd && taxThresholdUsd > 0;
  ```
- **Method**: CODE (hardcoded set of "tax always applies" countries)
- **Data source**: Hardcoded `taxAlwaysAppliesCountries` Set (EU 27 + GB, AU, NZ, NO, CH = 32 countries)
- **GAP**:
  - The duty/tax separation is implemented but uses a binary approach: either `taxThreshold = 0` (tax always applies) or `taxThreshold = dutyThreshold` (same threshold for both). In reality, some countries have a non-zero tax threshold that differs from the duty threshold.
  - The `de_minimis_thresholds` DB table and `CountryTaxProfile` interface store only ONE threshold (`deMinimis` / `deMinimisUsd`). **NEEDED**: separate `dutyDeMinimis` and `taxDeMinimis` fields.
  - The `taxAlwaysAppliesCountries` set is hardcoded rather than DB-driven. Adding a country requires a code change. Should be a boolean column `tax_de_minimis_zero` or a separate `tax_de_minimis` numeric column in the DB.
  - Switzerland's rule is amount-based (VAT exempt if calculated VAT < CHF 5), not threshold-based. This edge case is not modeled.
  - The `taxExempt` boolean is computed at line 562 but only partially used downstream -- the VAT calculation branches (lines 571-748) check `deMinimisApplied` (which equals `dutyExempt`) for Brazil/India/China/Mexico special tax, but do NOT check `taxExempt` for standard VAT countries. The `taxExempt` flag is returned in the response but not used to zero out VAT.

---

### Step 4: Product-Type Exception Check
- **Practitioner action**: Even below the de minimis threshold, certain product types are EXCLUDED from exemption in most countries:
  - **Alcohol**: Excise duties apply regardless of value (US, EU, AU, CA, etc.)
  - **Tobacco**: Always dutiable (virtually all countries)
  - **Perfume/cosmetics**: Excluded in some countries (CA)
  - **Textiles/apparel**: US excluded certain CN textiles from $800 exemption (executive orders)
  - **Goods subject to AD/CVD**: US CBP excludes from Section 321 if AD/CVD order applies
  - **Restricted/controlled items**: Firearms, pharmaceuticals, food -- always require formal entry regardless of value
- **Current code**: MISSING. The de minimis check at `GlobalCostEngine.ts:561` applies uniformly to all products: `declaredValue <= dutyThresholdUsd`. There is no HS code or product category check to exclude specific product types.
- **Method**: MISSING
- **Data source**: NEEDED -- `de_minimis_exclusions` table mapping country_code + hs_chapter (or hs_heading) to exclusion reason. Alternatively, a flag in the existing product classification result.
- **GAP**:
  - **This is a significant accuracy gap.** A $50 bottle of whiskey shipped to the US should NOT get de minimis exemption (alcohol is excluded from Section 321). Currently, POTAL would exempt it.
  - The trade remedy lookup (`lookupTradeRemedies`) is called AFTER the de minimis check. If a product has an AD/CVD order, the US excludes it from Section 321, but the current code exempts duty first (line 567) and only adds trade remedy duties afterward (lines 519-532). The de minimis exemption should not apply when AD/CVD is active.
  - HS chapter data IS available at this point (from `hsResult`), so implementing exclusion checks is feasible without additional API calls.
  - Minimum viable implementation: hardcode HS chapters 22 (beverages/alcohol), 24 (tobacco), 93 (arms) as excluded from de minimis for all countries, then refine per-country.

---

### Step 5: Recent Policy Change Awareness
- **Practitioner action**: De minimis thresholds change frequently due to policy shifts. A practitioner must be aware of recent changes:
  - **US**: $800 de minimis effectively eliminated for China-origin goods (Aug 2025 executive order). Previously $800 for all origins. As of 2026, Section 321 entries from CN require full duty payment.
  - **AU**: AUD 1,000 de minimis for duty remains, but GST 10% applies to ALL imported goods since Jul 2018 (vendor collection model for marketplaces/sellers).
  - **EU**: EUR 22 VAT de minimis abolished Jul 2021. EUR 150 duty de minimis remains. IOSS introduced for VAT collection on <=EUR 150.
  - **NO**: NOK 350 VAT exemption abolished Apr 2020. VOEC (VAT On E-Commerce) scheme requires foreign sellers to register and collect.
  - **UK**: GBP 15 VAT de minimis abolished Jan 2021. GBP 135 duty de minimis remains.
  - **CH**: CHF 62 de minimis expected to be lowered (under review).
- **Current code**: US de minimis is hardcoded as `$0` in `country-data.ts:48` (`deMinimisUsd: 0`). The code comment says "eliminated for CN Aug 2025." The AU, EU, UK, NO special handling is implemented via `taxAlwaysAppliesCountries` set and specific VAT branches (lines 674-731). China-origin detection for US at `CostEngine.ts:34` (`CHINA_IMPORT_DUTY_RATE = 0.20`).
- **Method**: CODE (hardcoded values, manually updated)
- **Data source**: `country-data.ts` hardcoded profiles, `de_minimis_thresholds` DB table
- **GAP**:
  - The US de minimis is set to $0 for ALL origins, not just China. The actual US policy is: Section 321 ($800) still applies for non-China origins. A $500 product from Vietnam should be duty-free under Section 321, but the current code (`deMinimisUsd: 0`) would charge duty.
  - **NEEDED**: Origin-specific de minimis rules. The `de_minimis_thresholds` table and `CountryTaxProfile` should support origin-country overrides (e.g., US de minimis = $800 general, $0 for CN).
  - No automated monitoring of de minimis policy changes. The data update relies on manual code/DB updates. The Vercel Cron + Make.com change detection pipeline (designed in CW12) could be extended to monitor de minimis changes from government gazette pages.
  - The AU vendor collection model (`GST (LVG seller-collected)` at line 725) is implemented but does not distinguish between marketplace (where the marketplace collects GST) and direct seller (where the seller must register for GST). The `isCBEC` pattern from China could be adapted for AU.

---

### Step 6: Final Determination
- **Practitioner action**: Combine all factors to produce one of four outcomes:
  - **Both exempt**: Value below both duty and tax thresholds, product not excluded. No duty, no VAT/GST.
  - **Duty exempt only**: Value below duty threshold but above tax threshold (or tax always applies). No duty, but VAT/GST charged.
  - **Tax exempt only**: Rare. Some countries exempt tax but not duty for certain value bands.
  - **Neither exempt**: Value above both thresholds, or product excluded from de minimis.
- **Current code**: `GlobalCostEngine.ts:561-568`:
  ```
  const dutyExempt = !isDomestic && declaredValue > 0 && declaredValue <= dutyThresholdUsd && dutyThresholdUsd > 0;
  const taxExempt = !isDomestic && declaredValue > 0 && declaredValue <= taxThresholdUsd && taxThresholdUsd > 0;
  const deMinimisApplied = dutyExempt;
  ...
  if (!isDomestic && !deMinimisApplied) {
    importDuty = declaredValue * dutyRate;
  }
  ```
  Result fields: `deMinimisApplied` (boolean), `dutyExempt` (boolean), `taxExempt` (boolean), `dutyThresholdUsd` (number), `taxThresholdUsd` (number) -- all returned in the `GlobalLandedCost` response at lines 1078-1082.
- **Method**: CODE
- **Data source**: Computed from Steps 1-5
- **GAP**:
  - The `taxExempt` flag is computed but **not used** to zero out VAT. The VAT calculation branches (lines 571-748) never check `taxExempt`. They check `deMinimisApplied` (which is `dutyExempt`) for the special-tax countries (BR/IN/CN/MX), and for EU/UK/AU they have custom threshold logic. But for the ~180 "generic" countries that fall through to `else` at line 747 (`vat = (declaredValue + importDuty) * profile.vatRate`), `taxExempt` is never checked. If a generic country has `taxThresholdUsd > 0` and the value is below it, VAT would still be charged.
  - The breakdown note shows "De minimis exempt" only for duty (line 767). There is no breakdown note for tax exemption status.
  - The response correctly returns both `dutyExempt` and `taxExempt` booleans, so API consumers can handle it, but the engine's own VAT calculation does not honor `taxExempt` consistently.
  - The EU IOSS branch (lines 691-714) has its own de minimis logic (`EU_IOSS_THRESHOLD_USD = 165`) that is separate from the main de minimis check. This is correct for EU, but it means the EU de minimis is hardcoded in two places: `country-data.ts` (`deMinimisUsd: 160`) and `GlobalCostEngine.ts:695` (`165`). These values should be consistent (the slight difference is due to exchange rate approximation, but it could cause edge-case mismatches).

---

## 3. Data Inventory

| Data Point | Source | Table/File | Row Count | Status |
|---|---|---|---|---|
| De minimis thresholds (local currency) | WTO, national customs | `de_minimis_thresholds` | 240 | COMPLETE |
| De minimis thresholds (USD equivalent) | Derived | `country-data.ts` / DB | 240 | COMPLETE (static) |
| Tax-always-applies countries | Manual curation | `GlobalCostEngine.ts:558` | 32 (hardcoded) | PARTIAL |
| De minimis exclusions (product types) | National customs regs | MISSING | 0 | NEEDED |
| Origin-specific de minimis overrides | Policy research | MISSING | 0 | NEEDED |
| Valuation basis per country (FOB/CIF) | WCO, national customs | MISSING | 0 | NEEDED |
| Live exchange rates | Exchange rate API | `exchange-rate/` module | N/A | COMPLETE |

---

## 4. GAP Summary

| # | Gap | Severity | Impact | Fix Complexity |
|---|---|---|---|---|
| G1 | Valuation basis always CIF (should be FOB for US/AU/CA) | HIGH | Incorrect exemption/denial for borderline values | MEDIUM -- add `valuation_basis` column to DB, branch logic |
| G2 | No product-type exclusions (alcohol/tobacco always exempted) | HIGH | False exemptions for excise goods | MEDIUM -- HS chapter exclusion list per country |
| G3 | US de minimis $0 for ALL origins (should be $800 for non-CN) | HIGH | Overcharges non-China imports to US | LOW -- origin-aware threshold in country profile |
| G4 | `taxExempt` flag computed but not used in VAT calculation | MEDIUM | VAT charged on tax-exempt shipments for generic countries | LOW -- add `if (taxExempt) vat = 0` guard |
| G5 | Static USD conversion (not live exchange rate) | MEDIUM | Threshold accuracy drifts with FX rates | LOW -- use `convertCurrency()` for live conversion |
| G6 | Single threshold per country (no duty/tax split in DB) | MEDIUM | Cannot model countries with different duty vs tax thresholds | MEDIUM -- add `tax_de_minimis` column to DB |
| G7 | AD/CVD products not excluded from de minimis | MEDIUM | US Section 321 excludes AD/CVD goods; currently not checked | LOW -- check trade remedy result before applying exemption |
| G8 | EU IOSS threshold hardcoded in two places (160 vs 165) | LOW | Edge-case mismatch between IOSS and de minimis check | LOW -- single source of truth |

---

## 5. Implementation Plan

### Phase 1: Critical Fixes (HIGH severity)
1. **G3 -- Origin-aware US de minimis**: Add `origin` parameter to de minimis check. US: `deMinimisUsd = originCountry === 'CN' ? 0 : 800`. Update `country-data.ts` and DB.
2. **G1 -- Valuation basis**: Add `valuation_basis` enum (`FOB` | `CIF` | `TRANSACTION`) to `de_minimis_thresholds` table and `CountryTaxProfile`. Update comparison at line 561 to use `productPrice` (FOB) or `declaredValue` (CIF) based on the field.
3. **G2 -- Product exclusions**: Create `de_minimis_exclusions` table (country_code, hs_chapter, reason). After de minimis check, look up exclusions. If product's HS chapter is excluded, set `dutyExempt = false`. Seed with universal exclusions: chapters 22, 24, 93.

### Phase 2: Correctness Improvements (MEDIUM severity)
4. **G4 -- Honor taxExempt**: Add `if (taxExempt) { vat = 0; effectiveVatLabel += ' (tax de minimis exempt)'; }` after the VAT calculation block.
5. **G7 -- AD/CVD exclusion**: Move trade remedy lookup BEFORE de minimis check, or add post-check: `if (tradeRemedyResult?.hasRemedies && profile.code === 'US') { dutyExempt = false; deMinimisApplied = false; }`.
6. **G5 -- Live FX conversion**: Replace `profile.deMinimisUsd` with runtime conversion: `const thresholdUsd = await convertCurrency(profile.deMinimis, profile.deMinimsCurrency, 'USD')`.
7. **G6 -- Separate tax de minimis in DB**: Add `tax_de_minimis` and `tax_de_minimis_currency` columns to `de_minimis_thresholds`. Migrate `taxAlwaysAppliesCountries` set to `tax_de_minimis = 0` rows in DB.

### Phase 3: Polish
8. **G8 -- Single threshold source**: Use `profile.deMinimisUsd` for EU IOSS threshold instead of hardcoded `165`.
9. **Breakdown notes**: Add tax exemption status to the breakdown output (e.g., "VAT exempt (de minimis)" or "VAT applies (no tax de minimis)").
10. **Monitoring**: Add de minimis threshold changes to the Vercel Cron change-detection pipeline (government gazette pages).

---

## 6. Architecture Diagram

```
Input: { productPrice, shippingCost, destinationCountry, originCountry, hsCode }
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 1: Threshold Lookup      │
                    │  DB: de_minimis_thresholds     │
                    │  -> dutyThreshold, taxThreshold│
                    │  (origin-aware for US)         │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 2: Valuation Basis       │
                    │  FOB countries: productPrice   │
                    │  CIF countries: price+shipping │
                    │  + insurance (if applicable)   │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 3: Duty vs Tax Split     │
                    │  dutyExempt = value <= dutyThr │
                    │  taxExempt  = value <= taxThr  │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 4: Product Exclusions    │
                    │  DB: de_minimis_exclusions     │
                    │  HS chapter in exclusion list? │
                    │  AD/CVD active? -> no exemption│
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 5: Policy Override       │
                    │  US CN-origin: force $0        │
                    │  AU LVG: GST always applies    │
                    │  EU IOSS: duty exempt <=€150   │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 6: Final Determination   │
                    │  -> dutyExempt (bool)          │
                    │  -> taxExempt (bool)           │
                    │  -> deMinimisApplied (bool)    │
                    │  -> exemptionNote (string)     │
                    └───────────────────────────────┘
```
