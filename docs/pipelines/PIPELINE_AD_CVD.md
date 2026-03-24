# PIPELINE: Anti-Dumping / Countervailing Duty (AD/CVD)

**Last updated:** 2026-03-18 KST
**Status:** GAP analysis complete, implementation plan drafted

---

## Overview

This document maps the full 8-step practitioner process for AD/CVD determination
against POTAL's current implementation, identifies gaps, and provides an
implementation plan to reach customs-broker-grade accuracy.

Two separate code paths currently handle trade remedies:
- **Path A (v2, primary):** `app/lib/cost-engine/trade-remedy-lookup.ts` — called from `GlobalCostEngine.ts` at line 523. Has firm-specific matching, hierarchical HS, safeguard exemption checking.
- **Path B (S+ grade):** `app/lib/trade/remedy-calculator.ts` — called from the 4 API routes under `app/api/v1/trade-remedies/`. Simpler, includes sunset alerting.

These two paths are **not connected to each other** and use **different column names** for the same tables (Path A: `affected_country`, Path B: `exporting_country`). This is a critical inconsistency.

---

## Step-by-Step Practitioner Process vs. Current Code

### Step 1: HS Code + Origin Confirmed

```
- Practitioner action: Confirm the product's HS code (10-digit) and country of
  origin before any AD/CVD lookup. Origin must be the country of manufacture,
  not the country of export (these can differ — e.g., Chinese product transshipped
  through Vietnam).
- Current code:
    Path A: trade-remedy-lookup.ts:160-163 (takes hsCode + originCountry as params)
    Path B: remedy-calculator.ts:31-32 (takes hsCode + origin as params)
    GlobalCostEngine.ts:523 (passes hsResult.hsCode + originCountry)
- Method: CODE (pre-step — relies on caller)
- Data source: Input parameters from caller
- GAP:
  1. No validation that HS code is confirmed/classified before lookup.
     The caller can pass any string, including "9999" (unknown). Path A's
     caller in GlobalCostEngine.ts:522 does check `hsResult.hsCode !== '9999'`
     but Path B (API routes) does not.
  2. No transshipment/origin validation. A practitioner checks whether the
     declared origin is the TRUE origin of manufacture (critical for AD/CVD
     circumvention cases — e.g., US AD order on China, product ships via
     Vietnam). Current code trusts the origin parameter blindly.
  3. Both paths use HS6 only. A practitioner uses HS10 because AD/CVD scope
     can be defined at 8- or 10-digit level (e.g., certain types of steel,
     not all steel under the same HS6).
```

### Step 2: Active AD/CVD Case Lookup (HS Code + Origin -> Active Orders)

```
- Practitioner action: Search all active AD/CVD orders where (a) the imposing
  country matches the destination, (b) the affected country matches the origin,
  and (c) the product's HS code falls within the order's scope.
- Current code:
    Path A: trade-remedy-lookup.ts:168-211
      - Queries trade_remedy_products for HS6/HS4 prefix matches (line 168-196)
      - Queries trade_remedy_cases filtered by imposing_country, affected_country,
        status IN ('active', 'in_force', 'preliminary') (line 198-204)
    Path B: remedy-calculator.ts:42-47
      - Queries trade_remedy_cases by imposing_country + exporting_country (line 45-46)
      - Then checks HS match per case via trade_remedy_products (line 53-58)
- Method: DB_LOOKUP
- Data source: trade_remedy_cases (10,999 rows), trade_remedy_products (55,259 rows)
- GAP:
  1. COLUMN NAME MISMATCH: Path A uses `affected_country`, Path B uses
     `exporting_country`. One of these will silently return 0 results if
     the actual DB column name differs. This must be verified and unified.
  2. Path A does product lookup FIRST (efficient — filters early), then
     case lookup. Path B does case lookup FIRST (gets all cases for a
     country pair, then checks HS per case — N+1 query pattern, slow).
  3. HS matching is HS6/HS4 prefix only. AD/CVD orders can be defined at
     HS8/HS10 level. A practitioner checks the exact tariff subheading.
  4. Status filtering: Path A checks 'active', 'in_force', 'preliminary'.
     Path B has NO status filter — returns ALL cases including expired/revoked.
  5. No check for "suspended" status (some orders are temporarily suspended
     pending review but technically still on the books).
  6. TTBD data (36 countries AD + 19 countries CVD) covers multi-country
     but is not guaranteed to have all active US orders. US-specific sources
     (USITC AD/CVD orders) would be more authoritative for US destination.
```

### Step 3: Scope Determination (Is THIS Product Within the Order's Scope?)

```
- Practitioner action: Read the actual scope language of the AD/CVD order to
  determine if the specific product falls within it. This is the HARDEST step.
  Scope language is in natural English, often with complex inclusions/exclusions.
  Example: "Carbon steel butt-weld pipe fittings... having an inside diameter of
  less than 14 inches... excluding stainless steel fittings."
  Practitioners check ITC scope rulings (EDIS database) for precedent.
- Current code: MISSING
    Both paths rely entirely on HS code prefix matching as a proxy for scope.
    No scope text is stored, parsed, or evaluated.
- Method: NEEDED — AI_CALL (scope text parsing) + DB_LOOKUP (scope ruling cache)
- Data source: NEEDED:
  1. Scope text per AD/CVD order (from Federal Register final determination
     notices or ITC EDIS). Not in current DB.
  2. ITC EDIS scope ruling database (ITC Electronic Document Information
     System — https://edis.usitc.gov). Contains individual scope rulings
     where ITC determined whether a specific product is in/out of scope.
  3. CBP CROSS rulings (already partially collected: 220,114 rulings in
     Phase 1 regulation data, stored on external drive).
- GAP:
  1. This is the BIGGEST gap. HS code matching is a rough proxy. A product
     can match an HS6 prefix but be explicitly excluded from the order's
     scope, or conversely, an order can cover products under multiple HS
     codes that don't share a prefix.
  2. No scope_text column in trade_remedy_cases.
  3. No scope_rulings table.
  4. No AI-based scope text analysis.
  5. ITC EDIS access: The EDIS system has a web interface but no public
     bulk API. Documents can be downloaded individually. For bulk access,
     FOIA request or web scraping would be needed.
  6. CBP CROSS rulings (220K already collected) could provide supplementary
     scope precedent if indexed and searchable.
```

### Step 4: Producer/Exporter-Specific Rate Lookup

```
- Practitioner action: Once an order is confirmed to apply, look up the specific
  duty rate. AD/CVD orders assign different rates to different firms:
  (a) Individually investigated firms get firm-specific rates
  (b) "All Others" rate for cooperating firms not individually investigated
  (c) Adverse facts available (AFA) rate for non-cooperating firms (highest)
  (d) Country-wide rate (PRC-wide, Vietnam-wide) for NME countries
  Priority: firm-specific > all others > country-wide > AFA (for compliance,
  the conservative approach is to use the HIGHEST applicable rate if uncertain).
- Current code:
    Path A: trade-remedy-lookup.ts:234-413 (resolveFirmDuty function)
      - Firm matching: exact normalized name > fuzzy (score >= 0.7) >
        pg_trgm server-side search > "All Others" > country-wide highest (lines 320-413)
      - normalizeFirmName() strips suffixes like LTD, INC, CORP (line 76-83)
      - isAllOthersEntry() checks many variations (line 89-107)
      - firmMatchScore() uses token overlap (line 113-136)
      - pg_trgm fallback via search_firm_trgm() RPC (line 421-449, migration 022)
    Path B: remedy-calculator.ts:63-70
      - Takes first duty entry only: `duties?.[0]` (line 70)
      - No firm-specific logic at all. Ignores manufacturer param (line 79).
- Method: DB_LOOKUP + CODE (fuzzy matching)
- Data source: trade_remedy_duties (37,513 rows), search_firm_trgm RPC
- GAP:
  1. Path B is completely broken for firm-specific matching — always uses
     the first row returned, which is arbitrary.
  2. Path A's fuzzy matching is reasonable but doesn't distinguish between
     AFA (adverse facts available) rates and "All Others" rates. AFA rates
     are typically the HIGHEST and should only apply to non-cooperating firms.
     Using AFA rate for a cooperating firm would overcharge the importer.
  3. No duty_category field to distinguish: 'firm_specific', 'all_others',
     'afa', 'country_wide', 'de_minimis'. TTBD data may not include this
     categorization.
  4. NME (Non-Market Economy) entity rate handling: for China/Vietnam,
     there's a "PRC-wide entity rate" that applies to all exporters who
     didn't demonstrate independence from the state. This is distinct from
     "All Others". Not modeled.
  5. No date filtering on duty rates. A single case can have multiple
     administrative review results with different rates over time.
     The practitioner uses the MOST RECENT final determination rate.
     Current code has no effective_date filter on trade_remedy_duties.
```

### Step 5: Safeguard Check (Quantity-Based, TRQ)

```
- Practitioner action: Check if a safeguard measure applies. Safeguards are
  different from AD/CVD — they are country-agnostic (apply to all origins)
  but often have:
  (a) Country exclusions (developing countries below de minimis import share)
  (b) Tariff-Rate Quotas (TRQ): lower rate up to quota, higher rate above
  (c) Quantity triggers: measure only activates above a threshold
  Example: US Section 201 steel safeguard had TRQ with in-quota/out-of-quota rates.
- Current code:
    Path A: trade-remedy-lookup.ts:213-232
      - Checks safeguard_exemptions table for origin country exemptions
      - Exempted SG cases are skipped (line 250)
    Path B: remedy-calculator.ts:97-98
      - Simple boolean: `{ applicable: true, rate }` — no exemption check
- Method: DB_LOOKUP
- Data source: safeguard_exemptions (15,935 rows)
- GAP:
  1. No TRQ (Tariff-Rate Quota) logic. Safeguards often have in-quota and
     out-of-quota rates. The in-quota rate requires knowing the remaining
     quota allocation, which changes daily. This requires:
     - USITC TRQ Dashboard (https://dataweb.usitc.gov/tariff/database) for
       US TRQs
     - EU SIGL system (Surveillance Import Licensing) for EU TRQs
     - Neither is currently integrated.
  2. No quantity-based trigger. Some safeguards activate only above a
     volume threshold. Current code applies the rate regardless of quantity.
  3. Safeguard rate structure: current code stores a single rate. Real
     safeguards can have stepped rates (Year 1: 25%, Year 2: 20%, Year 3: 15%)
     with automatic phase-down. No temporal rate logic.
  4. Section 201 (US) vs EU/other safeguards have different exclusion
     mechanisms. Current code treats all the same.
  5. No provisional safeguard handling (200-day temporary measures during
     investigation).
```

### Step 6: Sunset Review Status (Expiring/Renewed?)

```
- Practitioner action: Check if the AD/CVD order is due for a 5-year sunset
  review. If yes:
  (a) Is the review initiated? (order continues during review)
  (b) Was the order revoked as a result of the review? (duties refundable)
  (c) Was the order continued? (duties remain for another 5 years)
  Also check for changed circumstances reviews, scope inquiries, and
  administrative reviews (annual rate recalculations).
- Current code:
    Path B: remedy-calculator.ts:82-94
      - Checks if sunset_date is within 6 months, generates alert
      - Alert only — does not affect the rate calculation
    Path A: MISSING — no sunset logic at all
- Method: DB_LOOKUP + DATA_MONITORING
- Data source:
  - trade_remedy_cases.sunset_date (IF this column exists in DB)
  - Federal Register monitor (app/api/v1/cron/federal-register-monitor/route.ts)
    already monitors USITC/CBP/USTR publications daily
- GAP:
  1. No sunset_date column verified in the actual DB schema. The code
     references c.sunset_date but TTBD source data may not include this.
  2. Alert-only, no action. A practitioner needs to know: "Is this order
     under active sunset review?" to advise clients. If revoked, the duties
     no longer apply. Currently no revocation handling.
  3. No administrative review tracking. Annual admin reviews recalculate
     firm-specific rates. The latest admin review rate should supersede
     the original investigation rate. Not modeled.
  4. No changed circumstances review tracking.
  5. Federal Register monitor (cron) exists and monitors for AD/CVD
     documents, but findings are email-only — not fed back into the
     trade_remedy_cases table to update status/sunset dates.
```

### Step 7: Final AD/CVD Rate Determination

```
- Practitioner action: Combine all findings:
  (a) Sum of applicable AD rate + CVD rate (they are cumulative)
  (b) Add safeguard rate if applicable
  (c) These are ADDITIONAL to the normal MFN/column 1 duty rate
  (d) Check for double-counting: if a CVD offsets a portion of the AD duty
      (Commerce Dept. sometimes adjusts to avoid double remedies)
  (e) Apply the correct rate type: ad valorem, specific ($/unit), or
      combination (min/max of ad valorem vs specific)
- Current code:
    Path A: trade-remedy-lookup.ts:288
      - Sums all measure dutyRates: `measures.reduce((sum, m) => sum + m.dutyRate, 0)`
      - Returns totalRemedyRate as decimal (e.g., 0.25 for 25%)
    Path B: remedy-calculator.ts:102-106
      - Sums AD + CVD + SG amounts separately, calculates combinedEffectiveRate
    GlobalCostEngine.ts:526-528
      - Adds tradeRemedyRate to dutyRate: `dutyRate += tradeRemedyRate`
- Method: CODE
- Data source: Computed from previous steps
- GAP:
  1. No double-remedy offset. When both AD and CVD apply to the same
     product from the same country, Commerce may adjust the CVD rate to
     avoid double-counting the same subsidy in both calculations. This is
     legally required but not modeled.
  2. Only ad valorem rates supported. Specific duties (e.g., "$1.50/kg")
     require knowing the product weight/quantity. trade_remedy_duties has
     a measure_type field but the code doesn't branch on it:
     - AVD: ad valorem (percentage of value) — handled
     - SD: specific duty (per unit/weight) — NOT handled
     - PU: price undertaking (minimum price) — NOT handled
     - CMB: combination — NOT handled
  3. No minimum/maximum rate logic. Some orders have "the GREATER of X%
     or $Y/unit" or "the LESSER of X% or $Y/unit".
  4. Path A converts rate from percentage to decimal (line 276: rate/100).
     Path B keeps as percentage. The two paths are inconsistent.
```

### Step 8: Cash Deposit Calculation

```
- Practitioner action: Calculate the cash deposit (estimated duty) that must
  be posted at time of entry. For AD/CVD:
  (a) Cash deposit rate = most recent final determination or admin review rate
  (b) Deposit amount = value * rate (for ad valorem) or quantity * rate (specific)
  (c) After entry, CBP liquidates (finalizes) the duty — may be higher or lower
      than the deposit, resulting in a refund or additional payment
  (d) Interest accrues on underpayments/overpayments
  (e) Bonding requirements: importer must post a bond covering potential duties
- Current code: MISSING
    Neither path calculates a cash deposit separately from the duty amount.
    Path B (remedy-calculator.ts:71) calculates `amount = value * rate / 100`
    which is effectively the deposit amount, but:
    - It's not labeled as a cash deposit
    - No distinction between estimated deposit and final liquidated duty
    - No bond calculation
    - No interest calculation
- Method: CODE
- Data source: Computed from rate + value + quantity
- GAP:
  1. No explicit cash deposit vs. final duty distinction. In practice,
     AD/CVD duties are initially estimated (cash deposit at entry) and
     later finalized (liquidation, often 1-3 years later). The rates can
     differ significantly.
  2. No bond amount calculation. Importers need to know bond requirements
     (typically 10% of total duties + taxes + fees for continuous bonds).
  3. No liquidation status tracking. Once a case undergoes admin review,
     entries from the review period may be liquidated at a different rate.
  4. No interest calculation on under/overpayments.
  5. For API consumers (e-commerce platforms), the cash deposit amount is
     what matters at checkout time. This should be clearly labeled in the
     API response.
```

---

## Current Code Coverage Summary

| Step | Description | Path A (trade-remedy-lookup.ts) | Path B (remedy-calculator.ts) |
|------|-------------|-------------------------------|-------------------------------|
| 1 | HS + Origin confirmed | Partial (trusts input) | Partial (no validation) |
| 2 | Active case lookup | Good (HS6/4 + country + status) | Weak (no status filter, N+1 queries) |
| 3 | Scope determination | MISSING | MISSING |
| 4 | Firm-specific rate | Good (fuzzy + pg_trgm) | MISSING (uses first row) |
| 5 | Safeguard check | Partial (exemptions only) | Minimal (boolean only) |
| 6 | Sunset review | MISSING | Partial (alert only) |
| 7 | Final rate determination | Partial (sum, ad valorem only) | Partial (sum, ad valorem only) |
| 8 | Cash deposit | MISSING | MISSING |

**Overall coverage: ~35% of practitioner process**

---

## GAP Analysis — Priority Ranking

### P0: Critical (incorrect results possible)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G1 | Two disconnected code paths with column name mismatch (`affected_country` vs `exporting_country`) | API routes may return 0 results while GlobalCostEngine returns correct results, or vice versa | S — verify DB column name, unify paths |
| G2 | Path B uses `duties?.[0]` — arbitrary rate selection | API routes `/trade-remedies/ad`, `/cvd`, `/calculate` return wrong rates for any case with multiple firm-specific duties | S — replace with resolveFirmDuty logic |
| G3 | Path B has no status filter | Returns expired/revoked cases as if active | S — add `.in('status', [...])` |
| G4 | No scope determination | HS prefix match is a rough proxy; products can be in-scope at a different HS or out-of-scope at the matching HS | L — requires scope text data + AI |

### P1: Important (reduced accuracy)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G5 | Only ad valorem rates handled | Specific duties ($X/kg) and combination rates silently ignored or miscalculated | M — need quantity/weight input |
| G6 | No AFA vs All Others distinction | Conservative fallback may use AFA rate for cooperating firms (overcharge) or All Others for non-cooperating (undercharge) | M — need duty_category field |
| G7 | No double-remedy offset for overlapping AD + CVD | May overstate combined duty | M — need Commerce Dept. offset data |
| G8 | No admin review rate versioning | Uses original investigation rate even when more recent admin review rate exists | M — need temporal rate data |
| G9 | No TRQ logic for safeguards | Flat rate applied regardless of quota status | L — need live quota data feeds |
| G10 | HS matching limited to HS6/HS4 | Misses HS8/HS10-level scope definitions | M — extend matching to use gov_tariff_schedules |

### P2: Enhancement (professional-grade features)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| G11 | No cash deposit labeling in API response | E-commerce integrators don't know what to tell the buyer at checkout | S — response field rename/add |
| G12 | No sunset review feed-back loop (FR monitor -> DB update) | Sunset dates/status not automatically updated | M — extend federal-register-monitor cron |
| G13 | No bond calculation | Enterprise importers need bond estimates | S — formula: 10% of total duties+fees |
| G14 | No scope ruling cache (ITC EDIS) | Can't provide precedent-based scope answers | L — data acquisition + RAG |
| G15 | No NME entity rate modeling | PRC-wide/Vietnam-wide entity rates not distinguished from All Others | M — add entity_rate_type to duties |

---

## Data Inventory

### Currently Available

| Table | Rows | Source | Contains |
|-------|------|--------|----------|
| trade_remedy_cases | 10,999 | TTBD (36 countries AD, 19 countries CVD) | case_id, case_type, title, imposing_country, affected_country, status, measure_type, effective_date, sunset_date(?) |
| trade_remedy_products | 55,259 | TTBD | case_id, hs_code, hs_digits |
| trade_remedy_duties | 37,513 | TTBD | case_id, firm_name, target_country, duty_rate, duty_type, measure_type, margin |
| safeguard_exemptions | 15,935 | WTO SG | case_id, exempt_country |

### Needed Data

| Data | Source | Accessibility | Priority |
|------|--------|--------------|----------|
| Scope text per AD/CVD order | Federal Register final determinations | Public, free API (federalregister.gov/api/v1) — search by document_number | P0 |
| ITC scope rulings (EDIS) | https://edis.usitc.gov | Public web, no bulk API. Individual document download. FOIA for bulk. | P1 |
| CBP CROSS rulings (scope-related) | Already collected: 220,114 rulings on ext. drive | Available — needs indexing + filtering for scope rulings | P1 |
| Admin review rates (temporal) | Federal Register + USITC AD/CVD database | USITC DataWeb has current deposit rates. FR has historical. | P1 |
| Sunset review schedule | Federal Register + ITC sunset calendar | ITC publishes sunset schedule: https://www.usitc.gov/trade_remedy/sunset_reviews.htm | P1 |
| TRQ quota fill status (US) | USITC DataWeb: https://dataweb.usitc.gov/tariff/database | Public, queryable. No real-time API; updated periodically. | P2 |
| TRQ quota fill status (EU) | EU SIGL: https://webgate.ec.europa.eu/sigl2/ | Public web, no API. Complex. | P2 |
| Duty category (AFA/AllOthers/firm) | Derived from TTBD firm_name + Federal Register | TTBD partial; FR text mining for AFA designation | P1 |
| NME entity rate flags | Commerce Dept. determinations | Federal Register text parsing | P2 |

---

## AI Decision Points

| Step | AI Usage | Model | When |
|------|----------|-------|------|
| Step 3: Scope determination | Parse scope language + product description to determine in-scope/out-of-scope | Opus (legal text analysis) | When HS match found but scope text available — confirm before applying duty |
| Step 3: Scope ruling search | RAG over CBP CROSS rulings + ITC EDIS rulings to find precedent | Sonnet + vector search | When scope determination is ambiguous |
| Step 4: Firm name resolution | Already implemented: normalizeFirmName + pg_trgm | Code + DB (no LLM) | Every lookup with firmName param |
| Step 6: Federal Register parsing | Extract sunset dates, rate changes, revocations from FR documents | Sonnet | Cron job: parse FR monitor results into structured data |

**Cost note:** Scope determination (Step 3) is the only step that genuinely benefits from LLM reasoning. All other steps should be CODE or DB_LOOKUP. The flywheel applies: once a scope determination is made for a product+order combination, cache it. Subsequent lookups for the same combination cost $0.

---

## Implementation Plan

### Phase 1: Unify and Fix (P0 gaps, ~2 hours)

**Goal:** Eliminate incorrect results from the current codebase.

1. **Verify DB column names** — Query trade_remedy_cases to confirm whether the column is `affected_country` or `exporting_country`. Fix the wrong path.

2. **Unify code paths** — Make `remedy-calculator.ts` (Path B) call `lookupTradeRemedies()` (Path A) internally instead of duplicating logic. Path A is superior in every way (firm matching, status filter, hierarchical HS, safeguard exemptions).

3. **Add status filter to Path B** — Until unified, at minimum add `.in('status', ['active', 'in_force', 'preliminary'])`.

4. **Fix rate unit inconsistency** — Path A returns decimal (0.25), Path B returns percentage (25). Standardize to decimal throughout, convert at API response layer.

5. **Add HS validation gate** — Reject HS code "9999" or empty in API routes, matching GlobalCostEngine behavior.

### Phase 2: Rate Accuracy (P1 gaps, ~1 day)

**Goal:** Correct rate selection for all rate types.

1. **Extend trade_remedy_duties schema:**
   ```sql
   ALTER TABLE trade_remedy_duties ADD COLUMN IF NOT EXISTS duty_category TEXT;
   -- Values: 'firm_specific', 'all_others', 'afa', 'country_wide', 'de_minimis'
   ALTER TABLE trade_remedy_duties ADD COLUMN IF NOT EXISTS effective_date DATE;
   ALTER TABLE trade_remedy_duties ADD COLUMN IF NOT EXISTS review_period TEXT;
   -- e.g., 'POR 2024-2025' (period of review)
   ```

2. **Classify existing duty entries** — Parse firm_name to auto-classify:
   - `isAllOthersEntry()` -> 'all_others'
   - null firm_name -> 'country_wide'
   - known AFA patterns -> 'afa'
   - everything else -> 'firm_specific'

3. **Add specific duty support** — Extend `resolveFirmDuty` to handle:
   - `measure_type = 'SD'`: return rate as $/unit, require quantity input
   - `measure_type = 'CMB'`: return both ad valorem and specific, let caller compute max/min
   - Add `quantity` and `weight` to API input params.

4. **Admin review rate versioning** — When multiple duty entries exist for the same case+firm, use the one with the most recent `effective_date`.

5. **Double-remedy offset** — Add `double_remedy_offset` column to trade_remedy_cases. When both AD and CVD apply from the same origin, subtract offset from CVD rate.

### Phase 3: Scope Determination (P0/P1, ~1 week)

**Goal:** Move from HS-prefix-only matching to actual scope analysis.

1. **Add scope_text to trade_remedy_cases:**
   ```sql
   ALTER TABLE trade_remedy_cases ADD COLUMN IF NOT EXISTS scope_text TEXT;
   ALTER TABLE trade_remedy_cases ADD COLUMN IF NOT EXISTS scope_source_url TEXT;
   ```

2. **Populate scope text from Federal Register:**
   - Use FR API to fetch final determination documents for each active case
   - Extract "SCOPE OF THE ORDER" section (typically a clearly delineated section)
   - Store in scope_text column

3. **Scope determination function:**
   ```
   Input: product_description, hs_code, case scope_text
   Output: { in_scope: boolean, confidence: number, reasoning: string }
   ```
   - First pass: keyword/pattern matching (handles 70%+ of clear-cut cases)
   - Second pass: LLM analysis for ambiguous cases (Opus for legal text)
   - Cache result in new `scope_determinations` table

4. **Index CBP CROSS rulings** — Filter the 220K collected rulings for AD/CVD scope content, vectorize, enable RAG search for precedent.

### Phase 4: Monitoring and Automation (P2, ~3 days)

**Goal:** Keep data current automatically.

1. **Extend federal-register-monitor cron** to:
   - Parse AD/CVD-specific documents (sunset initiation, final results, admin review results)
   - Auto-update trade_remedy_cases status and sunset_date
   - Auto-insert new duty rates from admin review final results

2. **Add sunset review calendar** — Scrape ITC sunset schedule, store next review dates.

3. **TRQ monitoring** (future) — Periodic check of USITC DataWeb for quota fill percentages.

### Phase 5: Cash Deposit and Professional Features (P2, ~1 day)

**Goal:** Enterprise-grade output.

1. **Rename/restructure API response:**
   ```json
   {
     "cash_deposit": {
       "ad_deposit_rate": 0.2541,
       "ad_deposit_amount": 254.10,
       "cvd_deposit_rate": 0.0312,
       "cvd_deposit_amount": 31.20,
       "total_deposit": 285.30,
       "rate_basis": "2025 admin review final",
       "rate_type": "firm_specific",
       "matched_firm": "Hyundai Steel Co., Ltd.",
       "match_confidence": 0.95
     },
     "safeguard": { ... },
     "alerts": [
       { "type": "sunset_review", "message": "...", "date": "2026-09-01" }
     ],
     "bond_estimate": {
       "single_entry_bond": 285.30,
       "continuous_bond_annual": 50000
     },
     "scope_determination": {
       "in_scope": true,
       "confidence": 0.92,
       "method": "keyword_match",
       "cached": true
     }
   }
   ```

2. **Bond calculation:** Single entry bond = estimated duties. Continuous bond = greater of $50K or 10% of total duties paid in prior year.

---

## File Reference

| File | Path | Role |
|------|------|------|
| Trade Remedy Lookup v2 | `app/lib/cost-engine/trade-remedy-lookup.ts` | Primary lookup (firm-specific, called by GlobalCostEngine) |
| Remedy Calculator (S+) | `app/lib/trade/remedy-calculator.ts` | Simplified calculator (called by API routes) |
| API: Calculate | `app/api/v1/trade-remedies/calculate/route.ts` | Combined AD+CVD+SG endpoint |
| API: AD | `app/api/v1/trade-remedies/ad/route.ts` | AD-specific endpoint |
| API: CVD | `app/api/v1/trade-remedies/cvd/route.ts` | CVD-specific endpoint |
| API: Safeguard | `app/api/v1/trade-remedies/safeguard/route.ts` | Safeguard-specific endpoint |
| GlobalCostEngine | `app/lib/cost-engine/GlobalCostEngine.ts:518-528` | Integration point |
| Federal Register Monitor | `app/api/v1/cron/federal-register-monitor/route.ts` | Daily FR document scanner |
| pg_trgm function | `supabase/migrations/022_search_firm_trgm.sql` | Fuzzy firm name search |
| FK fix | `supabase/migrations/017_fix_trade_remedy_fk.sql` | Foreign key constraints |
| S-Grade Tests | `app/lib/tests/s-grade-verification.test.ts:336-339` | Minimal test (F019 only) |

---

## Key Risks

1. **Scope determination accuracy** — This is the step where even experienced practitioners disagree. LLM-based scope analysis will have an irreducible error rate on edge cases. Mitigation: confidence scores + human review flag for low-confidence determinations.

2. **Data staleness** — TTBD data may not reflect the most recent admin review rates. Federal Register monitoring helps but parsing FR documents into structured rate data is non-trivial.

3. **Multi-country complexity** — US AD/CVD system is the most well-documented but POTAL serves 240 countries. EU, India, China, Turkey, and others have their own AD/CVD systems with different procedural structures. Current TTBD data covers 36 countries for AD and 19 for CVD, but depth varies significantly.

4. **Two code paths** — Until unified, any fix must be applied to both paths or risk inconsistency. Phase 1 unification is the highest-priority technical task.
