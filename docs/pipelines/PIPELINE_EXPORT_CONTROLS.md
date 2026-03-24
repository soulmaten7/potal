# PIPELINE: Export Controls
> Technical design document for the POTAL export controls pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (7 Steps)

An export compliance officer determines whether an export requires a license in this order:

1. ECCN classification (Commerce Control List lookup, EAR99 vs specific ECCN)
2. Destination country check (Commerce Country Chart -- ECCN x country matrix)
3. End-user screening (Entity List, Denied Persons List, Military End User)
4. End-use check (nuclear/missile/chemical/biological weapons, catch-all)
5. License exception applicability (LVS, GBS, TSR, APR, TMP, etc.)
6. Final determination (NLR vs License Required)
7. License application (if needed)

---

## 2. Step-by-Step Analysis

### Step 1: ECCN Classification (Commerce Control List Lookup)
- **Practitioner action**: Classify the item against the Commerce Control List (CCL) in EAR Part 774, Supplement 1. Determine if the item has a specific ECCN (e.g., 3A001) or falls under EAR99 (commercial items not elsewhere specified). Real ECCN determination considers technical parameters (clock speed, encryption strength, wavelength, accuracy) against specific CCL entry thresholds.
- **Current code**: Three overlapping implementations:
  1. `app/lib/compliance/export-controls.ts:33-59` (`classifyECCN`) -- Simple HS chapter (2-digit) to ECCN group mapping. 9 HS chapters mapped. Returns `EAR99` for anything not mapped.
  2. `app/api/v1/compliance/export-controls/route.ts:69-99` (`suggestEccnFromProduct`) -- HS chapter mapping + keyword-based detection (semiconductor, laser, encryption, drone, nuclear). Falls back to EAR99.
  3. `app/api/v1/classify/eccn/route.ts:33-59` -- More granular HS-to-ECCN mapping with specific ECCN numbers (e.g., `2B001`, `3A001`, `5A002`) and per-entry control reasons and license exceptions.
- **Method**: CODE (hardcoded mapping) + KEYWORD_MATCH
- **Data source**: Hardcoded `HS_TO_ECCN_MAP` in three files (9 HS chapters -> ECCN groups). No external CCL database. No technical parameter thresholds.
- **GAP**:
  - **Critical**: HS-to-ECCN mapping is fundamentally wrong as a primary classification method. ECCN classification is based on technical parameters, not HS codes. An HS 85 item could be EAR99 (a flashlight) or 3A001 (a military-grade semiconductor). The current 2-digit chapter mapping cannot distinguish.
  - **Critical**: Only 9 of 97 HS chapters are mapped. The remaining 88 chapters all return EAR99, which is often incorrect (e.g., HS 39 specialty polymers can be 1C008, HS 71 special alloys can be 1C002).
  - **Critical**: No actual CCL entry parameter matching. Real ECCN determination requires checking technical specifications against specific thresholds in each CCL entry (e.g., 3A001.a.1 requires "peak saturated power output >50 mW" for certain lasers). The current code has no threshold logic.
  - `classifyECCN()` in `export-controls.ts:56` uses `Math.random()` to filter license exceptions -- this is placeholder logic shipping in production.
  - Three separate HS-to-ECCN maps exist with inconsistent data (e.g., HS 87 maps to `0A` in one file, `0A606` in another). No single source of truth.
  - No ITAR jurisdiction determination. Items on the US Munitions List (USML) are controlled by ITAR (State Dept), not EAR (Commerce). The `classify/eccn` route flags ITAR keywords but there is no formal USML classification.
  - No `export_control_chart` DB table exists (referenced in `compliance/export-controls/route.ts:59` but never created in migrations). The `lookupExportControlChart()` function always returns empty results.
  - Schedule B derivation in `classify/eccn/route.ts:79-85` is a naive zero-padding of HS codes, not a real Census Bureau Schedule B lookup.

---

### Step 2: Destination Country Check (Commerce Country Chart)
- **Practitioner action**: Cross-reference the ECCN's "Reason for Control" columns against the destination country's entries in the Commerce Country Chart (EAR Part 738, Supplement 1). An "X" at the intersection means a license is required for that reason. Check all applicable country groups (A, B, D, E).
- **Current code**:
  1. `app/lib/compliance/export-controls.ts:30-31` -- Two hardcoded sets: `CONTROLLED_DESTINATIONS` (CU, IR, KP, SY, RU, BY) and `TIER_B_COUNTRIES` (CN, VE, MM, IQ, LB, LY, SO, SD, YE).
  2. `app/api/v1/compliance/export-controls/route.ts:104-110` -- Four country groups: `COUNTRY_GROUP_E1` (embargoed), `COUNTRY_GROUP_E2` (Cuba), `COUNTRY_GROUP_D1` (19 countries national security), `COUNTRY_GROUP_D5` (arms embargo).
  3. `app/api/v1/compliance/export-controls/route.ts:55-67` (`lookupExportControlChart`) -- Attempts DB lookup in `export_control_chart` table.
- **Method**: CODE (hardcoded country sets) + DB_LOOKUP (broken -- table missing)
- **Data source**: Hardcoded country group sets. `export_control_chart` table referenced but does not exist.
- **GAP**:
  - **Critical**: The Commerce Country Chart is not implemented. The real chart is a matrix of ~240 countries x 16+ "Reason for Control" columns (NS1, NS2, NP1, NP2, MT, CB1, CB2, CB3, CC1, CC2, CC3, RS1, RS2, FC1, AT1, AT2). An item with ECCN 3A001 controlled for NS and AT requires a license to any country with an "X" in the NS column and AT column. The current code uses flat country sets instead.
  - Country Group A (favorable treatment countries like NATO allies, Australia, Japan) is not implemented. These countries are eligible for most license exceptions and have minimal restrictions. Currently treated the same as unlisted countries.
  - Country Group B is not implemented (most of the world between A and D/E).
  - `lookupExportControlChart()` queries `export_control_chart` table that does not exist in any migration file. It silently returns empty results, so the entire chart-based determination never fires.
  - The `checkLicenseRequirement()` function in `export-controls.ts:62-88` has a simplistic 4-way branch (embargoed -> EAR99 -> Tier B -> default) that does not reflect the actual ECCN x country x reason matrix.
  - No de minimis rule for foreign-made items containing US-origin controlled content (EAR Part 734.4 -- 10% or 25% threshold depending on destination).

---

### Step 3: End-User Screening (Entity List, Denied Persons List, MEU)
- **Practitioner action**: Screen all transaction parties (buyer, consignee, intermediate consignee, end-user) against: BIS Entity List, BIS Denied Persons List (DPL), BIS Unverified List (UVL), BIS Military End User List (MEU), State Dept ITAR debarred, and cross-reference with OFAC SDN.
- **Current code**:
  1. `app/api/v1/compliance/export-controls/route.ts:258-266` -- Only emits a warning saying "end-user should be screened" and refers to `/api/v1/screen`. No actual screening performed inline.
  2. `app/lib/cost-engine/screening/db-screen.ts:52-58` (`ALL_LISTS`) -- Defines 16 list types including `BIS_ENTITY`, `BIS_DPL`, `BIS_UVL`, `BIS_MEU`.
  3. `app/lib/cost-engine/screening/db-screen.ts:72-250` (`screenPartyDb`) -- Full screening engine with exact match, alias match, and pg_trgm fuzzy match against `sanctions_entries` DB table.
  4. `app/lib/compliance/fuzzy-screening.ts:73-117` (`fuzzyMatch`) -- Separate implementation searching `sanctions_sdn` and `denied_parties` tables with Levenshtein + Soundex + token matching.
- **Method**: DB_LOOKUP (live) + FUZZY_MATCH (Levenshtein, Soundex, pg_trgm)
- **Data source**: `sanctions_entries` (21,301 rows), `sanctions_aliases` (22,328 rows). In-memory fallback: 24 hardcoded entries in `screen.ts`.
- **GAP**:
  - End-user screening is not integrated into the export controls pipeline. The `/compliance/export-controls` route merely suggests running a separate screen, so a caller could skip it.
  - Two completely separate screening implementations exist (`fuzzy-screening.ts` queries `sanctions_sdn`/`denied_parties` tables; `db-screen.ts` queries `sanctions_entries`/`sanctions_aliases`). They search different tables and produce different result types.
  - The BIS Entity List has specific license requirements per entity (e.g., "License required for items subject to EAR. License review policy: presumption of denial"). These per-entity license conditions are not captured.
  - No address-based matching. The `sanctions_addresses` table (24,176 rows) is loaded but never queried in either screening implementation.
  - No ID-based matching. The `sanctions_ids` table (8,000 rows) is loaded but never queried.
  - No "all parties" screening. The export controls route accepts a single `endUser` string but a real export transaction has buyer, consignee, intermediate consignee, forwarding agent, and end-user -- all must be screened.

---

### Step 4: End-Use Check (Proliferation / Catch-All)
- **Practitioner action**: Determine if the item will be used for prohibited end-uses: nuclear weapons (10 CFR 810), missile delivery systems (EAR Part 744.3), chemical/biological weapons (EAR Part 744.4), or conventional military (EAR Part 744.17 military end-use/end-user for D:1/D:5 countries). Apply the "catch-all" (EAR Part 744.6) if the exporter "knows or has reason to know."
- **Current code**:
  1. `app/lib/compliance/export-controls.ts:82-85` -- Regex check for `/military|weapon|defense/i` in the `endUse` string. Returns license required if matched.
  2. `app/api/v1/compliance/export-controls/route.ts:142-149` (`SENSITIVE_END_USES`) -- 6 regex patterns for nuclear, missile, chemical/biological, military, surveillance, and encryption.
- **Method**: KEYWORD_MATCH (regex)
- **Data source**: Hardcoded regex patterns (6 patterns in the route, 1 pattern in the library).
- **GAP**:
  - **Critical**: End-use check is limited to keyword matching on a free-text field. A real compliance check requires structured end-use certification from the buyer, not self-declared text.
  - No "catch-all" / "informed" provision implementation. EAR Part 744.6 states that if the exporter knows the item will be used for WMD, they must apply for a license even if the item is EAR99. The current code only checks if the caller voluntarily provides end-use text containing weapon keywords.
  - No military end-use/end-user (MEU) rule for Country Group D:1/D:5. EAR Part 744.21 requires a license for any item (including EAR99) to a military end-user or for military end-use in these countries.
  - No nuclear end-use check (10 CFR 810 / NRC). The nuclear regex catches the word "nuclear" but does not trigger the correct regulatory authority (DOE, not BIS).
  - No structured end-use categories. Real compliance uses structured WMD proliferation risk categories, not free-text regex.

---

### Step 5: License Exception Applicability (LVS, GBS, TSR, etc.)
- **Practitioner action**: If a license is required, determine if any of the ~20 license exceptions in EAR Part 740 apply. Each exception has specific conditions: item value limits (LVS), country eligibility, prior consignee history (GBS), technology/software restrictions (TSR), temporary exports (TMP), servicing/repair (RPL), government end-use (GOV), etc.
- **Current code**:
  1. `app/lib/compliance/export-controls.ts:56` -- `['LVS', 'GBS', 'TSR'].filter(() => Math.random() > 0.3)` -- Randomly selects exceptions. This is placeholder code.
  2. `app/api/v1/compliance/export-controls/route.ts:310-317` -- Collects license exceptions from `export_control_chart` DB query results. Since the table does not exist, this always returns empty.
  3. `app/api/v1/classify/eccn/route.ts:37-41` -- Hardcoded `licenseExceptions` per ECCN mapping entry (e.g., 2B001 -> `['LVS', 'GBS']`).
  4. `app/api/v1/compliance/export-license/route.ts:49-133` (`determineLicenseRequirements`) -- Determines license type (OFAC, BIS, DDTC, EU) based on origin + destination + HS chapter. No exception evaluation.
- **Method**: CODE (hardcoded, partially random)
- **Data source**: None (hardcoded lists, empty DB).
- **GAP**:
  - **Critical**: `Math.random()` is used to select license exceptions in the `classifyECCN` function. This is a random number generator in a compliance-critical path.
  - No license exception evaluation logic exists. Each exception has complex eligibility rules:
    - **LVS** (Low Value Shipment): Value thresholds differ by ECCN group ($1,500 for most, $3,000 for some, $5,000 for others). No value threshold checking.
    - **GBS** (Shipments to Country Group B): Requires item to be non-NS controlled and destination in Group B. Country Group B not defined.
    - **TSR** (Technology/Software under Restriction): Requires written assurance from consignee. No document verification.
    - **TMP** (Temporary Exports): Requires items to be returned within 1 or 4 years. No temporal tracking.
    - **APR** (Additional Permissive Reexports): Complex multi-condition exception for reexports. Not implemented.
    - **STA** (Strategic Trade Authorization): Tier 1 and Tier 2 country eligibility. Not implemented.
    - **ENC** (Encryption): Self-classification and semi-annual reporting. Not implemented.
  - No Encryption Items (EI) exception evaluation, which is the most commonly used exception for software/tech products.
  - The `export-license` route identifies whether a license is needed but never evaluates whether an exception removes the requirement.

---

### Step 6: Final Determination (NLR vs License Required)
- **Practitioner action**: Synthesize all preceding steps into a final determination: No License Required (NLR), License Exception (specify which), or License Required (must file with BIS). Document the determination with an Automated Export System (AES) filing reference.
- **Current code**:
  1. `app/lib/compliance/export-controls.ts:62-88` (`checkLicenseRequirement`) -- Returns `{ required: boolean, exceptionAvailable: boolean, exceptionType?: string, reason: string }`. Logic: embargoed = required + no exception; EAR99 = NLR; Tier B = required + LVS available; military end-use = required + no exception; default = NLR.
  2. `app/api/v1/compliance/export-controls/route.ts:330-336` -- Aggregates all `issues[]` and derives status as `blocked | license_required | clear`.
  3. `app/api/v1/compliance/export-license/route.ts:155` -- Returns `licenseRequired: boolean` and list of `requirements[]`.
- **Method**: CODE (aggregation)
- **Data source**: Outputs of preceding steps.
- **GAP**:
  - No formal determination record or audit trail. Real compliance requires documenting the classification, country chart check, screening results, and rationale in an exportable record.
  - The three routes (`export-controls/classify`, `compliance/export-controls`, `compliance/export-license`) each produce their own independent determination with no shared state. A caller would need to call all three and manually reconcile.
  - No AES (Automated Export System) filing guidance. US exports over $2,500 require AES filing with Census Bureau. No integration or reference.
  - No license condition tracking. When a license is granted, it comes with conditions (quantity limits, end-user restrictions, reporting). No mechanism to track these.
  - The `compliance/check` route (`app/api/v1/compliance/check/route.ts`) attempts to unify product restrictions + ECCN + license determination but still runs them as independent checks without cross-referencing results.

---

### Step 7: License Application (If Needed)
- **Practitioner action**: If a license is required and no exception applies, file a license application via BIS SNAP-R (electronic filing system). Prepare supporting documents: technical data sheets, end-use statement, end-user certificate, purchase order. Track the application through review (average 30-60 days, policy of denial for embargoed countries).
- **Current code**: `app/api/v1/compliance/export-license/route.ts:166-170` -- Returns application URLs:
  - BIS SNAP-R: `https://snapr.bis.doc.gov`
  - DDTC D-Trade: `https://dtrade.pmddtc.state.gov`
  - EU: "Contact national export control authority"
- **Method**: CODE (static URLs)
- **Data source**: None.
- **GAP**:
  - Application links are informational only. No integration with SNAP-R or D-Trade APIs (these are government systems with no public API).
  - No license application document generation (end-use statement template, technical data sheet format).
  - No application tracking or status management.
  - No license storage or retrieval for approved licenses.
  - This is an expected gap -- license application is a human-driven government process. POTAL's role should be to prepare the required information and guide the user.

---

## 3. API Endpoint Inventory

| Route | Method | Purpose | File |
|-------|--------|---------|------|
| `/api/v1/export-controls/classify` | POST | ECCN classification from HS code/product name | `app/api/v1/export-controls/classify/route.ts` |
| `/api/v1/compliance/export-controls` | POST | Full export control screening (country chart + ECCN + end-use) | `app/api/v1/compliance/export-controls/route.ts` |
| `/api/v1/compliance/export-license` | POST | License requirement determination | `app/api/v1/compliance/export-license/route.ts` |
| `/api/v1/classify/eccn` | POST | ECCN + Schedule B classification with technical specs | `app/api/v1/classify/eccn/route.ts` |
| `/api/v1/compliance/check` | POST | Unified compliance check (restrictions + ECCN + license) | `app/api/v1/compliance/check/route.ts` |
| `/api/v1/sanctions/screen` | POST | Denied party screening (shared with sanctions pipeline) | `app/api/v1/sanctions/screen/route.ts` |

---

## 4. Library File Inventory

| File | Purpose | Key Functions |
|------|---------|---------------|
| `app/lib/compliance/export-controls.ts` | Core ECCN classifier + license check | `classifyECCN()`, `checkLicenseRequirement()` |
| `app/lib/compliance/product-restrictions.ts` | Product restriction detection (dual-use, CITES, prohibited) | `checkProductRestrictions()` |
| `app/lib/compliance/fuzzy-screening.ts` | Fuzzy name matching (Levenshtein + Soundex) | `fuzzyMatch()`, `screenBatch()` |
| `app/lib/cost-engine/screening/db-screen.ts` | DB-backed sanctions screening (pg_trgm) | `screenPartyDb()`, `screenPartiesDb()` |
| `app/lib/cost-engine/screening/screen.ts` | In-memory fallback screening (24 entities) | `screenParty()`, `screenParties()` |
| `app/lib/cost-engine/screening/types.ts` | Type definitions (18 list types) | `ScreeningList`, `ScreeningMatch`, `ScreeningResult` |

---

## 5. Data Source Summary

| Source | Table / Location | Rows | Used In |
|--------|-----------------|------|---------|
| Hardcoded HS-to-ECCN | 3 separate maps in code | 9 chapters | Steps 1, 2 |
| Hardcoded country groups | E1, E2, D1, D5 sets in code | 4 groups (~30 countries) | Step 2 |
| `export_control_chart` (DB) | Referenced but does not exist | 0 | Step 2 (broken) |
| `sanctions_entries` (DB) | OFAC SDN + CSL | 21,301 | Step 3 |
| `sanctions_aliases` (DB) | Alias names | 22,328 | Step 3 |
| `sanctions_addresses` (DB) | Addresses | 24,176 | Step 3 (unused) |
| `sanctions_ids` (DB) | ID numbers | 8,000 | Step 3 (unused) |
| Hardcoded end-use patterns | 6 regex patterns | 6 | Step 4 |
| BIS SNAP-R URL | Static string | 1 | Step 7 |

---

## 6. Critical Gaps Summary

| # | Gap | Severity | Step | Impact |
|---|-----|----------|------|--------|
| G1 | ECCN classification uses HS chapter mapping instead of technical parameter thresholds | Critical | 1 | Misclassification of controlled items; false EAR99 determinations |
| G2 | Commerce Country Chart not implemented (no ECCN x country x reason matrix) | Critical | 2 | Cannot determine license requirements for specific ECCNs to specific destinations |
| G3 | `export_control_chart` DB table does not exist despite code referencing it | Critical | 2 | DB lookup always returns empty; chart-based determination never fires |
| G4 | `Math.random()` used to select license exceptions | Critical | 5 | Random compliance determinations in production |
| G5 | End-user screening not integrated into export controls flow | High | 3 | Export controls check can complete without screening transaction parties |
| G6 | No address-based or ID-based matching | High | 3 | 24,176 addresses and 8,000 IDs in DB never searched |
| G7 | No "catch-all" or "informed" provision logic | High | 4 | No WMD catch-all even when exporter has knowledge |
| G8 | No license exception evaluation logic (LVS value limits, GBS country eligibility, etc.) | High | 5 | Cannot determine if an exception removes the license requirement |
| G9 | Three overlapping implementations with inconsistent data | Medium | 1 | Maintenance burden; different results from different endpoints |
| G10 | No ENC (encryption) exception handling | Medium | 5 | Most software/tech exports rely on ENC; not available |
| G11 | No ITAR/USML jurisdiction determination | Medium | 1 | Defense articles controlled by State Dept, not Commerce |
| G12 | No de minimis rule for foreign items with US content | Medium | 2 | 10%/25% controlled content threshold not evaluated |
| G13 | No audit trail or determination record | Medium | 6 | No exportable compliance documentation |

---

## 7. Recommended Priority Fixes

1. **Create `export_control_chart` DB table and seed with BIS Commerce Country Chart data** -- This is the foundation of the entire EAR license determination. Approximately 240 countries x 16 reason columns. Data is publicly available in EAR Part 738 Supplement 1.
2. **Remove `Math.random()` from `classifyECCN()`** and replace with deterministic exception eligibility logic.
3. **Integrate end-user screening into the export controls pipeline** so that a single API call performs ECCN classification, country chart check, end-use check, and party screening.
4. **Unify the three ECCN classification implementations** into a single source of truth. Add technical parameter matching for high-risk ECCN entries (3A001 semiconductors, 5A002 encryption, 6A003 cameras).
5. **Implement LVS value threshold checking** -- the most commonly used license exception with well-defined numeric thresholds per ECCN.
6. **Add address and ID matching** to the screening pipeline to use the 24,176 addresses and 8,000 IDs already in the database.
