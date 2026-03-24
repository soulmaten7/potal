# PIPELINE: Sanctions Screening
> Technical design document for the POTAL sanctions screening pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (8 Steps)

A sanctions compliance officer screens a transaction in this order:

1. Transaction party information collection
2. Comprehensive sanctions check (country-level: CU, IR, KP, SY, RU)
3. SDN screening (OFAC SDN list -- name, alias, address, ID matching)
4. Sectoral sanctions (SSI -- Russia energy/finance sectors)
5. Other lists (BIS Entity List, Denied Persons, EU/UK/UN sanctions)
6. Vessel/aircraft screening
7. Circumvention pattern analysis (red flags)
8. Final determination (Clear / Hit / Possible Match)

---

## 2. Step-by-Step Analysis

### Step 1: Transaction Party Information Collection
- **Practitioner action**: Collect full identification details for all transaction parties: buyer, seller, consignee, intermediate consignee, bank/financial institution, shipping agent, end-user. For each party: legal name, aliases/DBA names, address, country, national ID/registration numbers, vessel/aircraft identifiers. Normalize all names (transliteration, abbreviation expansion, title removal).
- **Current code**:
  1. `app/lib/cost-engine/screening/types.ts:74-85` (`ScreeningInput`) -- Accepts `name` (required), `country` (optional), `address` (optional), `lists` (optional), `minScore` (optional).
  2. `app/api/v1/sanctions/screen/route.ts:28-31` -- Single screening: extracts `name` and `threshold` from body.
  3. `app/api/v1/sanctions/screen/route.ts:11-25` -- Batch screening: extracts array of `{ name, type?, country? }`.
  4. `app/lib/cost-engine/screening/db-screen.ts:83` -- Normalizes name: `input.name.trim().toUpperCase()`.
  5. `app/lib/compliance/fuzzy-screening.ts:75` -- Normalizes: `query.trim().toLowerCase()`.
- **Method**: CODE (input parsing + normalization)
- **Data source**: API request body.
- **GAP**:
  - Only a single party is screened per call (name field). No structured multi-party transaction model. A real sanctions screening screens all parties in a single transaction context (buyer AND consignee AND bank AND shipping agent).
  - No address normalization. Raw address string accepted but never used for matching (see Step 3).
  - No ID number collection or matching (passport, tax ID, registration number).
  - No transliteration support. Arabic, Chinese, Cyrillic names have multiple valid romanizations (e.g., "Gadafi"/"Qadhafi"/"Gaddafi"). The current Soundex algorithm only handles English phonetics.
  - Two implementations normalize names differently (one to uppercase, one to lowercase). No shared normalization.
  - `type` field in batch screening is collected but not used for filtering or scoring.

---

### Step 2: Comprehensive Sanctions Check (Country-Level)
- **Practitioner action**: Determine if any transaction party is located in, or the transaction involves, a comprehensively sanctioned country. OFAC maintains comprehensive sanctions against Cuba (CU), Iran (IR), North Korea (KP), Syria (SY), and the Crimea/Donetsk/Luhansk regions of Ukraine. Russia (RU) has extensive but not fully comprehensive sanctions. Each program has different scope and general license availability.
- **Current code**:
  1. `app/lib/cost-engine/screening/db-screen.ts:61-64` -- `SANCTIONED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY', 'RU'])`. If `input.country` matches, a synthetic match is added with score 0.85 and a warning message.
  2. `app/lib/cost-engine/screening/screen.ts:68` -- Same set: `SANCTIONED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY', 'RU'])`.
  3. `app/lib/compliance/fuzzy-screening.ts` -- No country-level check. Only name-based.
- **Method**: CODE (set membership check)
- **Data source**: Hardcoded 5-country set.
- **GAP**:
  - Russia is listed as comprehensively sanctioned, but OFAC's Russia program is actually sectoral/targeted (SSI, CAPTA, CMIC, specific SDN designations) rather than fully comprehensive like Cuba/Iran/KP/Syria. Including RU in the same set as CU/IR/KP/SY overstates the restriction.
  - **Crimea, Donetsk, and Luhansk regions** are comprehensively sanctioned but cannot be identified by country code alone (they share `UA` with the rest of Ukraine). No sub-national region screening.
  - No distinction between sanctions programs. Cuba has a general license framework (TSRA), Iran has specific exemptions (medical/humanitarian), North Korea is near-total. The current implementation gives the same 0.85-score warning for all five.
  - The country check produces a synthetic `OFAC_SDN` match even though country sanctions are not SDN designations. This conflates list types.
  - No secondary sanctions awareness. US secondary sanctions can apply to non-US persons transacting with sanctioned countries (e.g., Iran secondary sanctions under EO 13846). Not relevant to e-commerce but should be flagged.

---

### Step 3: SDN Screening (OFAC Specially Designated Nationals)
- **Practitioner action**: Screen all party names against the OFAC SDN list using: (a) exact name match, (b) alias/AKA matching, (c) fuzzy matching for transliteration variants and typos, (d) address matching, (e) ID number matching (passport, tax ID, vessel IMO). Score each match and classify as true positive, false positive, or possible match.
- **Current code**: Two parallel implementations:
  1. **DB-backed** (`app/lib/cost-engine/screening/db-screen.ts:72-250`):
     - Query 1 (lines 97-127): Exact/partial name match via `ilike('%name%')` on `sanctions_entries` table. Filters by `source` (list type) and `is_active`. Calculates `calculateSimpleScore()` (exact = 1.0, contains = 0.9, token overlap = 0-1).
     - Query 2 (lines 130-173): Alias match via `ilike('%name%')` on `sanctions_aliases` table with JOIN to `sanctions_entries`. Deduplicates against primary matches.
     - Query 3 (lines 177-207): Fuzzy match via `search_sanctions_fuzzy` RPC (pg_trgm `similarity()`). Only runs when no exact/alias matches found. Uses `minScore * 0.8` as DB threshold, filters to `minScore` in code.
     - Country boost (lines 111-112, 156-157, 190): +0.10 score if `input.country` matches entry country.
  2. **Fuzzy standalone** (`app/lib/compliance/fuzzy-screening.ts:73-117`):
     - Queries `sanctions_sdn` and `denied_parties` tables (different from db-screen.ts).
     - Levenshtein distance similarity, Soundex phonetic matching, token overlap matching.
     - Best of three scores compared against threshold (default 0.85).
  3. **In-memory fallback** (`app/lib/cost-engine/screening/screen.ts:137-209`):
     - 24 hardcoded high-profile entities (Huawei, Sberbank, IRGC, etc.).
     - Token-based matching + exact/contains matching.
- **Method**: DB_LOOKUP (ilike + pg_trgm) + FUZZY_MATCH (Levenshtein, Soundex, token overlap) + IN_MEMORY (fallback)
- **Data source**: `sanctions_entries` (21,301 rows), `sanctions_aliases` (22,328 rows), `sanctions_addresses` (24,176 rows -- loaded but unused), `sanctions_ids` (8,000 rows -- loaded but unused). In-memory: 24 entities in `screen.ts`.
- **GAP**:
  - **Critical**: Address matching not implemented. `sanctions_addresses` table has 24,176 rows but is never queried. Address matching is essential for distinguishing common-name entities (e.g., "Bank of China" the sanctioned branch vs the legitimate bank).
  - **Critical**: ID matching not implemented. `sanctions_ids` table has 8,000 rows (passport numbers, tax IDs, registration numbers) but is never queried. ID matching is the highest-confidence matching method.
  - Two completely separate implementations query different tables (`sanctions_entries` vs `sanctions_sdn`/`denied_parties`). These may contain different data, leading to inconsistent results depending on which code path is invoked.
  - The pg_trgm fuzzy search (`search_sanctions_fuzzy` RPC) only runs when the exact/alias queries find nothing. This means a partial name match via `ilike` that scores below threshold will prevent the fuzzy search from running, potentially missing better fuzzy matches.
  - No Jaro-Winkler distance (industry standard for name matching in sanctions screening). Levenshtein is effective for typos but poor for transliteration variants (e.g., "Muhammad"/"Mohammed"/"Mohamad").
  - No name decomposition. "ISLAMIC REVOLUTIONARY GUARD CORPS" should match "IRGC" -- the in-memory list handles this via explicit aliases, but the DB-backed search does not expand abbreviations.
  - Token matching gives equal weight to all tokens. In practice, family name tokens should weigh more than given name tokens (e.g., matching "KHAMENEI" is more important than matching "ALI").
  - Batch screening in `fuzzy-screening.ts:119-126` is sequential (`for` loop with `await`), not parallel. 50 entities screened sequentially could be slow.
  - Default threshold of 0.85 in `fuzzy-screening.ts` vs 0.80 in `db-screen.ts`. Different defaults for the same purpose.

---

### Step 4: Sectoral Sanctions (SSI)
- **Practitioner action**: Check if any party is on the OFAC Sectoral Sanctions Identifications (SSI) List. SSI restricts specific types of transactions (new debt, new equity, deep-water/Arctic/shale energy projects) rather than blocking all dealings. Key sectors: Russian energy, Russian financial institutions, Russian defense. Different "Directives" apply different restrictions.
- **Current code**:
  1. `app/lib/cost-engine/screening/types.ts:14` -- `OFAC_SSI` is defined as a `ScreeningList` type.
  2. `app/lib/cost-engine/screening/db-screen.ts:30-50` -- `LIST_TO_SOURCE` maps `OFAC_SSI` to `'OFAC_SSI'` source string. Included in `ALL_LISTS`.
  3. `app/lib/cost-engine/screening/db-screen.ts:98-127` -- SSI entries in `sanctions_entries` table are queried alongside all other sources. No differentiated treatment.
- **Method**: DB_LOOKUP (same as SDN, no special handling)
- **Data source**: `sanctions_entries` table filtered by `source = 'OFAC_SSI'`. Row count for SSI specifically: unknown (blended into 21,301 total).
- **GAP**:
  - **Critical**: SSI matches are treated identically to SDN matches. In reality, SSI restrictions are narrower -- they prohibit specific transaction types (e.g., "Directive 1: new debt > 14 days maturity for specified financial sector entities") rather than blocking all dealings. An SSI match should return the applicable Directive and its restrictions, not a generic "match/potential_match" status.
  - No Directive-level classification. OFAC SSI has 4+ Directives with different prohibitions:
    - Directive 1: New debt (financial sector)
    - Directive 2: New debt (energy sector)
    - Directive 3: New debt (defense sector)
    - Directive 4: Deep-water, Arctic, shale projects
  - No transaction type analysis. SSI requires knowing the type of transaction (debt, equity, energy service) to determine if it is prohibited. The screening only checks party names.
  - `app/lib/cost-engine/screening/screen.ts:132` (in-memory fallback) does not include `OFAC_SSI` in its `ALL_LISTS` -- fallback screening skips SSI entirely.

---

### Step 5: Other Lists (BIS Entity List, EU/UK/UN Sanctions)
- **Practitioner action**: Screen against all relevant restricted party lists beyond OFAC SDN/SSI: BIS Entity List (export restrictions), BIS Denied Persons List (full denial), BIS Unverified List (enhanced due diligence), BIS Military End User List, State Dept ITAR Debarred, State Dept Nonproliferation, EU Consolidated Financial Sanctions, UN Security Council Sanctions, UK HMT Financial Sanctions.
- **Current code**:
  1. `app/lib/cost-engine/screening/types.ts:11-30` -- 18 list types defined.
  2. `app/lib/cost-engine/screening/db-screen.ts:52-58` (`ALL_LISTS`) -- 16 lists checked by default (OFAC_CONS excluded from ALL_LISTS but mapped).
  3. `app/lib/cost-engine/screening/db-screen.ts:30-50` (`LIST_TO_SOURCE`) -- All 18 types mapped to source strings for DB filtering.
  4. `app/lib/cost-engine/screening/screen.ts:132` -- In-memory fallback checks only 8 lists: `OFAC_SDN, OFAC_CONS, BIS_ENTITY, BIS_DENIED, BIS_UNVERIFIED, EU_SANCTIONS, UN_SANCTIONS, UK_SANCTIONS`.
- **Method**: DB_LOOKUP (same query, filtered by source)
- **Data source**: `sanctions_entries` (21,301 rows total across all sources). Breakdown by source unknown from code alone.
- **GAP**:
  - All lists are treated identically in terms of match response. In practice:
    - **BIS Entity List**: Specifies per-entity license requirements and review policy (approval, case-by-case, or presumption of denial). Not captured.
    - **BIS Denied Persons List**: Absolute prohibition on any export transaction. Should be treated as severity = critical, not scored alongside partial matches.
    - **BIS Unverified List**: Requires enhanced due diligence (UVL statement from end-user), not a prohibition. Should trigger a different workflow.
    - **EU Sanctions**: Have specific asset freeze and travel ban components. Only the name matching is relevant for trade screening.
  - The `programs` field from `sanctions_entries` is returned in results but not interpreted. Programs like `RUSSIA-EO14024`, `IRAN`, `DPRK` carry different legal obligations.
  - No EU Regulation citation. EU sanctions matches should reference the specific EU Council Regulation number.
  - No list freshness tracking. There is no mechanism to verify when each list was last updated. OFAC SDN updates weekly; BIS Entity List updates less frequently.

---

### Step 6: Vessel/Aircraft Screening
- **Practitioner action**: Screen vessel names, IMO numbers, MMSI numbers, flag state, and aircraft tail numbers against OFAC's SDN vessel/aircraft list and the BIS blocked vessel list. Vessels can be sanctioned individually even if the owner is not. Check for vessel flag changes, name changes, and ownership chains.
- **Current code**:
  1. `app/lib/cost-engine/screening/types.ts:43` -- `entityType` includes `'vessel' | 'aircraft'` in `ScreeningMatch`.
  2. `app/lib/cost-engine/screening/screen.ts:25` -- `SanctionEntry` type includes `entityType: 'vessel' | 'aircraft'` but none of the 24 hardcoded entries are vessels or aircraft.
- **Method**: Not implemented.
- **Data source**: None. No vessel/aircraft-specific data loaded. The `sanctions_entries` table may contain vessel entries from the OFAC SDN file (OFAC includes vessels in the SDN list with vessel-specific fields like call sign, tonnage, flag), but no vessel-specific query path exists.
- **GAP**:
  - **Not implemented**. No vessel name, IMO number, MMSI, call sign, or flag state matching.
  - No aircraft tail number matching.
  - No vessel ownership chain analysis (OFAC's 50% Rule applies -- see Step 7).
  - No deceptive shipping practice detection (flag hopping, AIS transponder manipulation, ship-to-ship transfers).
  - For POTAL's e-commerce use case, vessel/aircraft screening is lower priority than entity screening, but it becomes relevant when shipments are carried on specific vessels (ocean freight) or when the shipping carrier itself may be sanctioned.

---

### Step 7: Circumvention Pattern Analysis (Red Flags)
- **Practitioner action**: Analyze the transaction for red flags indicating potential sanctions evasion: unusual routing (goods transshipped through third countries to reach sanctioned destinations), mismatched documentation (ship-to country differs from end-user country), shell company patterns, unusual payment methods, overvalued/undervalued goods. Apply OFAC's **50% Rule**: an entity owned 50% or more (individually or in aggregate) by one or more SDN-listed persons is itself treated as blocked, even if not individually listed.
- **Current code**: Not implemented. No red flag analysis, no 50% Rule, no transshipment detection.
- **Method**: Not implemented.
- **Data source**: None.
- **GAP**:
  - **Critical (50% Rule)**: OFAC's 50% ownership rule is a cornerstone of sanctions compliance. If Entity A (SDN-listed) owns 50%+ of Entity B (not listed), Entity B is blocked. No ownership data or 50% calculation exists. This is the single most commonly cited gap in sanctions compliance programs.
  - No transshipment risk scoring. Common evasion routes (e.g., goods from US -> UAE -> Iran, or US -> China -> North Korea) are not flagged.
  - No geographic risk indicators. Free trade zones (e.g., Dubai's Jebel Ali, Singapore) are common transshipment points for sanctions evasion.
  - No unusual pricing detection. Goods priced significantly above/below market may indicate transfer pricing manipulation for sanctions evasion.
  - No document consistency checks. End-user country vs shipping destination vs payment origin mismatch detection.
  - BIS "Know Your Customer" red flags (EAR Part 732, Supplement 3) list 25 specific red flags. None are implemented.
  - No historical pattern analysis across transactions (same customer routing different orders through different intermediaries).

---

### Step 8: Final Determination (Clear / Hit / Possible Match)
- **Practitioner action**: Synthesize all screening results into a final determination: (a) Clear -- no matches, transaction may proceed; (b) True Positive -- confirmed match against sanctioned entity, transaction blocked; (c) Possible Match -- requires human review (analyst investigation, additional documentation from counterparty). Document the screening result with timestamp, lists checked, analyst disposition. Retain records for 5 years (OFAC) or 10 years (EU).
- **Current code**:
  1. `app/lib/cost-engine/screening/db-screen.ts:232-236` -- Status determination: `match` (any score >= 0.95), `potential_match` (any matches), or `clear` (no matches).
  2. `app/lib/cost-engine/screening/db-screen.ts:237-249` -- Returns `ScreeningResult`: `{ hasMatches, status, totalMatches, matches[], screenedInput, screenedAt, listsChecked }`.
  3. `app/api/v1/sanctions/screen/route.ts:35-39` -- Single screening returns `{ entity, cleared, matches }`.
  4. `app/api/v1/sanctions/screen/route.ts:21` -- Batch returns `{ results, total, flagged }`.
- **Method**: CODE (threshold-based classification)
- **Data source**: Aggregated match results from preceding steps.
- **GAP**:
  - No analyst review workflow. "Possible match" results need a human disposition (true positive / false positive) before the transaction can proceed or be blocked. No mechanism for this.
  - No record retention. Screening results are returned to the caller but not stored. OFAC requires 5-year retention of screening records; EU requires 10 years.
  - No OFAC voluntary self-disclosure guidance. If a true positive is detected after a transaction has occurred, the entity should file a voluntary self-disclosure. No guidance or workflow for this.
  - The threshold for `match` (0.95) vs `potential_match` (any match above minScore) is arbitrary. Industry standard practice uses tiered thresholds calibrated against false positive rates for each specific list.
  - No aggregate risk score across all steps. A transaction with a country-level warning (Step 2), a low-confidence name match (Step 3), and a BIS Entity List hit (Step 5) should produce a higher aggregate risk than each individual signal, but each is scored independently.
  - `cleared: true` in the API response when `matches.length === 0` does not account for Steps 6 and 7 (vessel screening, circumvention) which are not implemented. The "cleared" status is incomplete.
  - No screening audit log table. Results are ephemeral.

---

## 3. API Endpoint Inventory

| Route | Method | Purpose | File |
|-------|--------|---------|------|
| `/api/v1/sanctions/screen` | POST | Single or batch entity screening | `app/api/v1/sanctions/screen/route.ts` |
| `/api/v1/compliance/check` | POST | Unified compliance check (includes screening via product-restrictions) | `app/api/v1/compliance/check/route.ts` |
| `/api/v1/compliance/export-controls` | POST | Export controls (includes end-user screening reference) | `app/api/v1/compliance/export-controls/route.ts` |

---

## 4. Library File Inventory

| File | Purpose | Key Functions |
|------|---------|---------------|
| `app/lib/cost-engine/screening/db-screen.ts` | Primary DB-backed screening engine (pg_trgm) | `screenPartyDb()`, `screenPartiesDb()` |
| `app/lib/cost-engine/screening/screen.ts` | In-memory fallback with 24 hardcoded entities | `screenParty()`, `screenParties()` |
| `app/lib/cost-engine/screening/types.ts` | Type definitions for 18 list types | `ScreeningList`, `ScreeningInput`, `ScreeningResult`, `ScreeningMatch` |
| `app/lib/compliance/fuzzy-screening.ts` | Standalone fuzzy screening (Levenshtein + Soundex) | `fuzzyMatch()`, `screenBatch()` |
| `app/lib/compliance/product-restrictions.ts` | Product restriction check (references sanctions) | `checkProductRestrictions()` |

---

## 5. Data Source Summary

| Source | Table | Rows | Used In | Notes |
|--------|-------|------|---------|-------|
| OFAC SDN + CSL | `sanctions_entries` | 21,301 | Steps 2-5 | Primary screening table |
| Alias names | `sanctions_aliases` | 22,328 | Step 3 | Joined to entries via `entry_id` |
| Addresses | `sanctions_addresses` | 24,176 | **Unused** | Loaded but never queried |
| ID numbers | `sanctions_ids` | 8,000 | **Unused** | Loaded but never queried |
| In-memory fallback | Hardcoded in `screen.ts` | 24 | Step 3 (fallback) | High-profile entities only |
| Separate fuzzy tables | `sanctions_sdn`, `denied_parties` | Unknown | Step 3 (alt path) | Different tables from db-screen.ts |
| pg_trgm RPC | `search_sanctions_fuzzy` | N/A | Step 3 | DB function, runs when no ilike matches |

---

## 6. Critical Gaps Summary

| # | Gap | Severity | Step | Impact |
|---|-----|----------|------|--------|
| G1 | 50% Rule not implemented (SDN ownership aggregation) | Critical | 7 | Entities owned by SDN persons are treated as unblocked |
| G2 | Address matching not implemented (24,176 rows unused) | Critical | 3 | Common-name entities cannot be distinguished by location |
| G3 | ID matching not implemented (8,000 rows unused) | Critical | 3 | Highest-confidence match method unavailable |
| G4 | SSI treated same as SDN (no Directive-level restrictions) | Critical | 4 | SSI matches falsely appear as full blocks instead of transaction-type-specific restrictions |
| G5 | No screening record retention | High | 8 | Violates OFAC 5-year / EU 10-year retention requirements |
| G6 | Two separate implementations query different tables | High | 3 | `sanctions_entries` vs `sanctions_sdn`/`denied_parties` may produce different results |
| G7 | Vessel/aircraft screening not implemented | High | 6 | Sanctioned vessels not detected |
| G8 | No circumvention/red flag detection | High | 7 | Transshipment evasion patterns not flagged |
| G9 | Russia listed as comprehensively sanctioned (overstated) | Medium | 2 | May incorrectly block legitimate Russia transactions |
| G10 | No analyst review workflow for possible matches | Medium | 8 | Possible matches have no disposition mechanism |
| G11 | No Crimea/Donetsk/Luhansk sub-national screening | Medium | 2 | UA country code does not distinguish sanctioned regions |
| G12 | No transliteration/Jaro-Winkler for name variants | Medium | 3 | Arabic/Cyrillic name variants may be missed |
| G13 | Batch screening is sequential, not parallel | Low | 3 | Performance impact for 50-entity batch |
| G14 | Inconsistent default thresholds (0.80 vs 0.85) | Low | 3 | Different code paths use different sensitivity |

---

## 7. Recommended Priority Fixes

1. **Implement address and ID matching** -- The data is already in the database (`sanctions_addresses` 24,176 rows, `sanctions_ids` 8,000 rows). Adding query paths to `screenPartyDb()` for these tables would immediately improve screening quality with minimal code change.
2. **Unify the two screening implementations** into a single code path that queries `sanctions_entries`/`sanctions_aliases`/`sanctions_addresses`/`sanctions_ids`. Deprecate the separate `fuzzy-screening.ts` that queries `sanctions_sdn`/`denied_parties`.
3. **Add screening audit log** -- Create a `screening_audit_log` table to store every screening result with timestamp, input, matches, and disposition. Required for OFAC/EU compliance.
4. **Differentiate SSI from SDN in results** -- When a match comes from `OFAC_SSI`, return the applicable Directive and its specific prohibitions instead of a generic match status.
5. **Implement basic 50% Rule** -- Add an `ownership` table linking entities to their SDN-listed owners with ownership percentages. Flag any entity where aggregate SDN ownership >= 50%.
6. **Reclassify Russia** -- Change from comprehensively sanctioned to targeted/sectoral. Add program-level detail to Russia matches (EO 14024, CAPTA, CMIC, etc.) so callers understand which restrictions apply.
7. **Add transshipment risk scoring** -- Flag transactions where the shipping destination is a known transshipment hub (UAE, Turkey, Georgia, Armenia, Kazakhstan) and the goods are in sensitive categories.
