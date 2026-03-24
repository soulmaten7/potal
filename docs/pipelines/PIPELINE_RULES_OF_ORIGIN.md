# Pipeline Design: Rules of Origin (RoO)

Last updated: 2026-03-18 KST

## Overview

Rules of Origin determine whether a product qualifies for preferential (FTA) tariff rates.
This is POTAL's most data-deficient pipeline. The current implementation covers Steps 1-2 of an 8-step
practitioner process, with Step 3 (Product-Specific Rules) being the critical gap that requires
~50,000+ data entries we do not yet have.

---

## The 8-Step Practitioner Process

A customs broker determines origin/FTA eligibility through these steps:

---

### Step 1: Identify Applicable FTAs

**What a broker does:** Given origin + destination country pair, identify all FTAs in force between them.
Select the most favorable one (lowest preferential rate).

**Current code:**

| File | Function | What it does |
|------|----------|-------------|
| `app/lib/cost-engine/hs-code/fta.ts` | `findApplicableFta()` | Hardcoded 63 FTA definitions with member lists, loops through all, returns lowest `preferentialMultiplier` |
| `app/lib/cost-engine/db/fta-db.ts` | `findApplicableFtaFromDb()` | DB-backed version reading `macmap_trade_agreements` (1,319 rows), falls back to hardcoded |
| `app/api/v1/fta/route.ts` | `POST /api/v1/fta` | API endpoint for FTA lookup |
| `app/api/v1/fta/eligibility/route.ts` | `POST /api/v1/fta/eligibility` | Eligibility check endpoint |
| `app/api/v1/roo/route.ts` | `POST /api/v1/roo` | Main RoO endpoint, calls `getCountryFtas()` for common FTAs |

**Coverage:** GOOD. 63 FTAs hardcoded + 1,319 DB agreements. Covers all major trade corridors.

**GAP:** Minor.
- `preferentialMultiplier` is a single number per FTA (e.g., 0.0 = duty-free, 0.5 = 50% MFN). In reality, preferential rates vary by HS code within the same FTA. A product in Ch.87 under RCEP may get 20% reduction while Ch.85 gets 0% duty.
- Fix: The `preferentialMultiplier` should be replaced by actual preferential tariff schedules per HS code per FTA. This data exists in MacMap MIN rates (~105M rows) which already contain FTA-specific preferential rates. The MIN lookup in the cost engine partially addresses this.

---

### Step 2: General Origin Rules (WO, CTH/CC/CTSH, RVC, SP)

**What a broker does:** Check which general origin criteria the product satisfies:
- **WO** (Wholly Obtained) -- raw materials, agriculture, minerals extracted in-country
- **PE** (Produced Entirely) -- all processing in-country
- **CTC** (Change in Tariff Classification) -- raw materials changed HS chapter/heading/subheading
  - **CC** = Change of Chapter (2-digit)
  - **CTH** = Change of Tariff Heading (4-digit)
  - **CTSH** = Change of Tariff Sub-Heading (6-digit)
- **RVC** (Regional Value Content) -- percentage of value from FTA region
- **SP** (Specific Process) -- e.g., yarn-forward for textiles, chemical reaction

**Current code:**

| File | Function | What it does |
|------|----------|-------------|
| `app/lib/trade/roo-engine.ts` | `evaluateRoO()` | Evaluates WO (by chapter), RVC (ratio calc), CTH/CC/CTSH (prefix comparison). Returns `eligible`, `criteriaMetList`, `savingsIfEligible` |
| `app/lib/cost-engine/hs-code/fta.ts` | `FTA_ROO_DEFAULTS` | Chapter-level RoO patterns for USMCA, RCEP, CPTPP (3 FTAs only) |
| `app/lib/cost-engine/hs-code/fta.ts` | `GENERIC_ROO` | Fallback: CTH + RVC 40% + DM 10% |
| `app/api/v1/roo/evaluate/route.ts` | `POST /api/v1/roo/evaluate` | Calls `evaluateRoO()` |
| `app/api/v1/origin/determine/route.ts` | `POST /api/v1/origin/determine` | Tariff shift analysis (CC/CTH/CTSH) with chapter descriptions |

**Coverage:** MODERATE. Generic CTC and RVC logic works correctly. RVC supports 4 methods (build-up, build-down, focused-value, net-cost).

**GAP:** Medium.
- `FTA_ROO_DEFAULTS` only covers 3 FTAs (USMCA, RCEP, CPTPP) at chapter level. The other 60 FTAs fall back to `GENERIC_ROO` (CTH + RVC 40%).
- The WO check in `roo-engine.ts` uses a hardcoded chapter set (`01-10, 25-27`). Some FTAs define WO differently.
- `evaluateRoO()` checks all criteria independently and returns `eligible = true` if ANY criterion is met. In practice, some FTAs require a COMBINATION (e.g., "CTH + RVC 40% or CC alone").
- The savings estimate is a flat 5% of product value -- not based on actual MFN vs preferential rate difference.

---

### Step 3: Product-Specific Rules (PSR) -- THE CORE GAP

**What a broker does:** Each FTA has an annex listing Product-Specific Rules for every HS code (or range).
These override the general rules. PSR is the definitive answer to "does this product qualify?"

**Examples:**
- USMCA Ch.87 (autos): RVC >= 75% (net cost), plus labor value content >= 40%, plus 70% North American steel
- RCEP HS 8471 (computers): CTH except from HS 8473, or RVC >= 40% (build-up) / 50% (build-down)
- EU-Korea HS 6204 (women's suits): Weaving + making-up of fabric, or manufacture from yarn
- CPTPP HS 6110 (knitted garments): Yarn-forward rule (yarn spinning in CPTPP territory)

**Current code:**

| File | What it does |
|------|-------------|
| `supabase/migrations/032_psr_screening_logs_export_control.sql` | Creates `product_specific_rules` table: `(fta_code, hs6_code, rule_type, rule_text, threshold_pct, notes)` |
| `app/api/v1/roo/check/route.ts` | `POST /api/v1/roo/check` -- queries `product_specific_rules` table for PSR, falls back to hardcoded RoO |
| `app/api/v1/roo/rvc-calc/route.ts` | `POST /api/v1/roo/rvc-calc` -- RVC calculator, queries PSR table for threshold |
| `app/api/v1/origin/determine/route.ts` | `POST /api/v1/origin/determine` -- checks PSR in determination flow |

**Coverage:** INFRASTRUCTURE EXISTS. Table created, API endpoints query it. But the table is EMPTY (0 rows).

**GAP:** CRITICAL. This is the largest data gap in POTAL.

**Scale of the problem:**
- ~5,300 HS6 codes x 63 FTAs = ~334,000 potential PSR entries
- In practice, not every FTA covers every HS code. Realistic estimate: **50,000-80,000 PSR entries** needed.
- Each entry is not a simple number -- it's a structured rule like "CTH except from heading 39.01 through 39.15, or RVC >= 45% using build-down method"

**Data sources for PSR:**

| Source | URL | Format | Coverage | Access |
|--------|-----|--------|----------|--------|
| **ITC Rules of Origin Facilitator** | findrulesoforigin.org | Web scraping / no bulk API | ~200 FTAs, HS6-level PSR | Free, but no API. Would need scraping with rate limits |
| **WTO RTA-IS (Regional Trade Agreements Info System)** | rtais.wto.org | PDF/HTML | All notified RTAs | Free. Rules in PDF annexes -- needs extraction |
| **MacMap (ITC)** | macmap.org | API (have access) | 53 countries, preferential rates | Already have MIN/AGR rates. PSR text not included in rate data |
| **FTA Original Texts** | Government websites | PDF | Authoritative | Free. Annexes are 100s-1000s of pages per FTA |
| **UNCTAD** | unctad.org | Reports | General analysis | Academic, not structured data |
| **Customs authorities** | Various | Databases | Country-specific | US: HTSUS General Notes; EU: ROSA tool; UK: check-duties-customs-exporting |

**Recommended PSR data collection strategy (3 phases):**

**Phase 1 -- ITC Rules of Origin Facilitator scraping (estimated 30,000-40,000 rules):**
- findrulesoforigin.org has the most comprehensive structured PSR database
- Scrape HS6 x FTA combinations for the 15 most important FTAs first:
  USMCA, RCEP, CPTPP, EU-UK TCA, CETA, EU-Korea, EU-Japan, KORUS,
  ChAFTA, AUSFTA, EU-Vietnam, EU-Singapore, AfCFTA, DR-CAFTA, EFTA
- Output format: `{ fta_code, hs6_code, rule_type, rule_text, threshold_pct, conditions[], exceptions[] }`
- Estimated effort: scraping script + rate limiting + validation = 2-3 days of script runtime

**Phase 2 -- EU ROSA (Rules of Origin Self-Assessment) tool:**
- EU has a structured digital tool for RoO self-assessment covering all EU FTAs
- API at `trade.ec.europa.eu/access-to-markets/en/content/welcome-rosa-rules-origin-self-assessment`
- Covers ~25 EU FTAs with HS8-level PSR
- Estimated: 15,000-20,000 additional rules

**Phase 3 -- AI extraction from FTA texts:**
- For FTAs not covered by ITC/ROSA, extract PSR from official FTA annexes (PDF)
- Use LLM to parse tables like "Annex 4-B: Product-Specific Rules of Origin"
- Each major FTA has a dedicated annex, typically Annex III or IV
- Validate AI extraction against known rules from Phase 1/2

**Schema enhancement needed:**
```sql
-- Current schema is too simple. Enhanced version:
CREATE TABLE product_specific_rules_v2 (
  id serial PRIMARY KEY,
  fta_code text NOT NULL,
  hs_range_start text NOT NULL,  -- e.g., '870100' (HS6 start)
  hs_range_end text,              -- e.g., '870899' (HS6 end, null = exact match)
  rule_type text NOT NULL,        -- PRIMARY criterion: CTC/CTH/CTSH/CC/RVC/SP/WO/COMBO
  alternative_rules jsonb,        -- Array of alternative criteria (OR logic)
  required_rules jsonb,           -- Array of mandatory criteria (AND logic)
  rvc_threshold_pct numeric,      -- RVC percentage if applicable
  rvc_method text,                -- build-up / build-down / net-cost / focused-value
  exceptions text[],              -- "except from heading 39.01 through 39.15"
  additional_conditions text[],   -- "minimum 40% labor value content"
  rule_text_original text,        -- Original FTA text verbatim
  rule_text_simplified text,      -- AI-simplified plain English
  de_minimis_pct numeric,         -- Tolerance for non-originating materials
  cumulation_type text,           -- bilateral / diagonal / full
  source_document text,           -- "USMCA Annex 4-B"
  source_url text,
  effective_date date,
  expiry_date date,               -- For phased-in rules
  confidence numeric DEFAULT 1.0, -- 1.0 = official source, 0.8 = AI-extracted
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_psr_v2_fta_hs ON product_specific_rules_v2(fta_code, hs_range_start);
CREATE INDEX idx_psr_v2_hs_range ON product_specific_rules_v2 USING btree (hs_range_start, hs_range_end);
```

---

### Step 4: Direct Shipment Rule

**What a broker does:** Verify that goods were shipped directly from origin to destination, or if transshipped
through a third country, that they remained under customs control and were not altered.

**Current code:** Not implemented.

**GAP:** Medium.
- Most e-commerce shipments are direct. This matters for complex supply chains.
- Implementation: Add a `direct_shipment` boolean input to the RoO evaluation. If false, require
  transit documentation (bill of lading showing same container/seal number).
- Low priority for B2B API -- this is typically verified by the importer's customs broker, not calculated.
- API response should include a `direct_shipment_required: true` note with guidance text.

---

### Step 5: Cumulation Rules

**What a broker does:** Determine if materials from other FTA member countries can count as "originating."
- **Bilateral**: Only materials from the two FTA partner countries count
- **Diagonal**: Materials from any FTA member country count (e.g., RCEP: materials from any of 15 members)
- **Full**: Any processing in any member country counts toward origin

**Current code:**

| File | Location | What it does |
|------|----------|-------------|
| `app/lib/cost-engine/hs-code/fta.ts` | `getRulesOfOrigin()` | Sets `accumulationType` to `'diagonal'` for RCEP/CPTPP/USMCA/ACFTA/AKFTA, `'bilateral'` for others |
| `app/lib/trade/roo-engine.ts` | `evaluateRoO()` | Does NOT check cumulation. Checks materials origin against single `origin` country only |

**Coverage:** PARTIAL. Metadata exists but not enforced in evaluation logic.

**GAP:** Medium.
- `evaluateRoO()` should accept `ftaMembers: string[]` and treat any material from a member country as
  originating when diagonal/full cumulation applies.
- Current WO check: `!materials?.some(m => m.origin !== origin)` -- should be
  `!materials?.some(m => !ftaMembers.includes(m.origin))` under cumulation.
- Current CTH/CC/CTSH checks don't consider cumulated materials at all.

---

### Step 6: De Minimis Rule

**What a broker does:** Allow a tolerance for non-originating materials that don't meet CTC requirements.
Typically 7-10% of transaction value (varies by FTA and product type).

**Current code:**

| File | Location | What it does |
|------|----------|-------------|
| `app/lib/cost-engine/hs-code/fta.ts` | `GENERIC_ROO` | Includes `DM` criterion with `deMinimisPercent: 10` as default |
| `app/lib/cost-engine/hs-code/fta.ts` | `RuleOfOrigin` interface | Has `deMinimisPercent` field |

**Coverage:** METADATA ONLY. The 10% de minimis is declared but never enforced in evaluation.

**GAP:** Medium.
- `evaluateRoO()` in `roo-engine.ts` should check: if CTC fails, calculate non-originating value as % of
  total. If below de minimis threshold, treat CTC as passed.
- Different FTAs have different de minimis: USMCA 10%, RCEP 10%, CPTPP 10%, EU FTAs 10% (15% for textiles),
  some FTAs exclude textiles/agriculture from de minimis entirely.
- This is product-category dependent -- textiles (Ch.50-63) often have stricter or no de minimis.

---

### Step 7: Documentation (Certificate of Origin)

**What a broker does:** Determine which certificate type is required and whether self-certification is allowed.

**Current code:**

| File | Location | What it does |
|------|----------|-------------|
| `app/lib/cost-engine/hs-code/fta.ts` | `getRulesOfOrigin()` | Returns `certificateType` string for RCEP/CPTPP/USMCA/EU FTAs |
| `app/api/v1/roo/check/route.ts` | `CERT_TYPES` | Maps 8 FTA codes to certificate type strings |

**Coverage:** GOOD for major FTAs (8 explicit + pattern matching for EU-*).

**GAP:** Low.
- 55 FTAs fall back to generic "Certificate of Origin (CO)".
- Should expand `CERT_TYPES` to cover all 63 FTAs. This is a documentation task, not complex logic.
- Could add: issuing authority, validity period, required fields, self-certification eligibility per FTA.

---

### Step 8: Origin Determination (Final Decision)

**What a broker does:** Combine all the above into a final determination: originating or non-originating.
Issue the determination with supporting evidence.

**Current code:**

| File | What it does |
|------|-------------|
| `app/api/v1/origin/determine/route.ts` | Tariff shift analysis + PSR lookup. Returns `preferential_eligible` boolean |
| `app/lib/trade/roo-engine.ts` | Returns `eligible` if any single criterion passes |

**Coverage:** BASIC.

**GAP:** High.
- Current logic: `eligible = criteriaMetList.length > 0` -- if ANY criterion passes, product qualifies.
  In reality, PSR may require a specific combination (e.g., "CTH + RVC >= 40%" as AND, not OR).
- No multi-step determination: should check PSR first (Step 3), then general rules (Step 2), then
  apply de minimis (Step 6), then check cumulation (Step 5).
- No audit trail / determination record that could serve as documentation for customs.
- `savingsIfEligible` is hardcoded 5% -- should calculate actual MFN minus preferential rate.

---

## Summary: Current Coverage vs Full Process

| Step | Description | Coverage | Priority |
|------|-------------|----------|----------|
| 1 | Identify applicable FTAs | GOOD (63 FTAs) | Low |
| 2 | General origin rules | MODERATE (3 FTA-specific, generic fallback) | Medium |
| 3 | Product-Specific Rules (PSR) | CRITICAL GAP (table exists, 0 rows) | **P0** |
| 4 | Direct shipment rule | NOT IMPLEMENTED | Low |
| 5 | Cumulation rules | METADATA ONLY (not enforced) | Medium |
| 6 | De minimis rule | METADATA ONLY (not enforced) | Medium |
| 7 | Documentation/certificates | GOOD (8 FTAs explicit) | Low |
| 8 | Final determination | BASIC (any-criterion-passes logic) | High |

---

## Implementation Roadmap

### Phase A: PSR Data Collection (the bottleneck)

**Priority: P0. Everything else is logic that takes hours to code. PSR data takes weeks to collect.**

1. Write scraper for findrulesoforigin.org (ITC Rules of Origin Facilitator)
   - Target: 15 major FTAs x ~3,500 HS6 codes = ~30,000 rules
   - Script: `scripts/scrape_itc_roo.py`
   - Rate limit: 1 req/sec, respect robots.txt
   - Parse rule text into structured fields (rule_type, threshold, exceptions)

2. EU ROSA tool integration
   - API endpoint: `trade.ec.europa.eu` ROSA API
   - Target: ~25 EU FTAs, HS8-level
   - Structured JSON output -- higher quality than scraping

3. AI extraction from FTA annex PDFs (Phase 3, for remaining FTAs)
   - Download FTA texts from WTO RTA-IS
   - Use LLM to extract PSR tables from Annex pages
   - Human validation on sample set, then bulk process

### Phase B: Engine Logic Enhancement (after PSR data exists)

1. **PSR-first evaluation** -- Refactor `evaluateRoO()`:
   ```
   if PSR exists for (fta_code, hs6):
     evaluate PSR criteria (may be AND/OR combination)
     apply de minimis if CTC fails marginally
   else:
     fall back to general FTA rules
     fall back to GENERIC_ROO
   ```

2. **Cumulation enforcement** -- Modify material origin checks:
   ```
   if cumulation_type == 'diagonal':
     originating = material.origin in fta_member_list
   elif cumulation_type == 'full':
     originating = any_processing_in_fta_territory
   else:
     originating = material.origin == declared_origin
   ```

3. **De minimis enforcement** -- Add tolerance check:
   ```
   if CTC fails:
     non_orig_pct = sum(non_originating_values) / total_value * 100
     if non_orig_pct <= de_minimis_threshold:
       CTC = PASS (de minimis exception)
   ```

4. **Actual savings calculation** -- Replace hardcoded 5%:
   ```
   savings = (mfn_rate - preferential_rate) * product_value
   // Use existing duty rate lookup pipeline
   ```

### Phase C: Determination Quality

1. Add AND/OR logic to PSR evaluation (many rules are "CTH or RVC >= 40%")
2. Determination audit record (store evaluation steps for compliance documentation)
3. Expand certificate types to all 63 FTAs
4. Add direct shipment advisory text

---

## AI Role in PSR

**Where AI is needed:**
- Parsing unstructured PSR text from FTA annexes (PDF tables -> structured data)
- Interpreting complex rules like "CTH except from heading 39.01 through 39.15, provided that the value of all non-originating materials of any of headings 39.01 through 39.15 used does not exceed 50% of the ex-works price"
- Generating simplified plain-English explanations of rules

**Where AI is NOT needed:**
- Evaluating CTC (pure HS code prefix comparison)
- Calculating RVC (pure arithmetic)
- FTA member lookup (DB query)
- Certificate type determination (lookup table)

**Cost estimate for AI extraction:**
- ~50,000 PSR entries x ~500 tokens per rule = ~25M tokens input
- Claude/GPT-4 at $3/M input = ~$75 one-time cost
- Validation pass: ~$20
- Total: ~$100 one-time for complete PSR database

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/lib/cost-engine/hs-code/fta.ts` | 63 FTA definitions + chapter-level RoO for 3 FTAs + generic fallback |
| `app/lib/cost-engine/db/fta-db.ts` | DB-backed FTA lookup with hardcoded fallback |
| `app/lib/trade/roo-engine.ts` | Core RoO evaluation (WO/RVC/CTC checks) |
| `app/api/v1/roo/route.ts` | Main RoO API endpoint |
| `app/api/v1/roo/check/route.ts` | PSR lookup endpoint (queries `product_specific_rules`) |
| `app/api/v1/roo/evaluate/route.ts` | RoO evaluation endpoint |
| `app/api/v1/roo/rvc-calc/route.ts` | RVC calculator (4 methods) |
| `app/api/v1/origin/determine/route.ts` | Origin determination with tariff shift analysis |
| `app/api/v1/fta/route.ts` | FTA lookup |
| `app/api/v1/fta/eligibility/route.ts` | FTA eligibility check |
| `app/api/v1/fta/compare/route.ts` | FTA comparison |
| `app/api/v1/fta/database/route.ts` | FTA database access |
| `supabase/migrations/032_psr_screening_logs_export_control.sql` | PSR table DDL |
| `supabase/migrations/016_macmap_bulk_tables.sql` | macmap_trade_agreements DDL |

---

## Bottom Line

The RoO pipeline has solid infrastructure (API endpoints, DB table, evaluation functions) but is
operating on **empty PSR data** and **oversimplified evaluation logic**. The single highest-impact
action is populating the `product_specific_rules` table with 50,000+ entries from ITC/ROSA/FTA texts.
Once PSR data exists, the engine logic enhancements (Phase B) are straightforward coding tasks
that can be completed in 1-2 sessions.
