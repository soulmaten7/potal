# PIPELINE: Customs Fees & Processing Charges
> Technical design document for the POTAL customs fees pipeline.
> Last updated: 2026-03-18 KST

---

## 1. Practitioner Process (6 Steps)

A customs broker calculates all government-imposed and service fees for an import shipment:

1. Entry type determination (formal/informal/express)
2. Country-specific mandatory fees (MPF, HMF, DTA, IPC, etc.)
3. Broker fees (optional, $30-$200 depending on country and entry complexity)
4. Port/airport handling fees
5. Documentation fees
6. Total fees

---

## 2. Step-by-Step Analysis

### Step 1: Entry Type (Formal/Informal/Express)
- **Practitioner action**: Determine the entry type based on the value of the goods and the country's customs rules. This affects which fees apply and at what rate.
  - **US**: Formal entry (value > $2,500 or goods requiring license/quota), Informal entry (value <= $2,500), Section 321 (value <= $800 de minimis, minimal documentation).
  - **EU**: Standard customs declaration (SAD/CDS), simplified declaration (authorized operators), low-value consignment (<= EUR 150 IOSS).
  - **AU**: Full Import Declaration (FID, value > AUD 1,000), Self-Assessed Clearance (SAC, value <= AUD 1,000).
  - **JP**: General declaration, simplified (<=JPY 200,000 / ~$1,300).
  - **CA**: Casual goods (personal, <=CAD 2,500 duty+tax), commercial goods (formal B40/B3 declaration).
- **Current code**: `GlobalCostEngine.ts:826-827`:
  ```
  const entryType: 'formal' | 'informal' = declaredValue > 2500 ? 'formal' : 'informal';
  ```
  This is a US-centric threshold applied universally. The `entryType` is used at lines 832-841 to determine MPF amount for US entries.
- **Method**: CODE (hardcoded $2,500 threshold)
- **Data source**: None (single hardcoded value)
- **GAP**:
  - **Entry type uses a US-specific $2,500 threshold for all countries.** Each country has its own thresholds. The `entryType` field should be country-specific. For example, AU uses AUD 1,000, JP uses JPY 200,000, EU uses EUR 150 (IOSS vs standard).
  - **No "express" entry type.** Many countries have an express/courier entry pathway with different fee structures (e.g., US Type 86 entry for e-commerce shipments <=USD 2,500, which has different processing requirements than informal entry).
  - The entry type is only used for US MPF differentiation (formal vs informal fee structure). For other countries, the fee calculation ignores entry type entirely.
  - **NEEDED**: A `customs_entry_types` table or per-country threshold config mapping (country_code, entry_type, value_threshold, description).

---

### Step 2: Country-Specific Mandatory Fees
- **Practitioner action**: Look up all government-imposed customs fees for the destination country. These are non-negotiable and vary significantly by country.
- **Current code**: `GlobalCostEngine.ts:829-891` (async) and `GlobalCostEngine.ts:1362-1402` (sync). A chain of `if/else if` blocks by country code. Additionally, S-Grade functions:
  - `getHarborMaintenanceFee()` at `GlobalCostEngine.ts:1528-1533` (US only: 0.125% of declared value).
  - `getDocumentationFee()` at `GlobalCostEngine.ts:1537-1544` (11 countries with specific fees, $15 default).
  - `getBrokerFeeEstimate()` at `GlobalCostEngine.ts:1522-1524` (44 countries with specific estimates, $100 default).

**Implemented fees by country:**

| Country | Fee Name | Calculation | Code Line (async) |
|---------|---------|-------------|-------------------|
| **US** (formal) | MPF | 0.3464% of value, min $31.67, max $614.35 | 834-836 |
| **US** (informal) | MPF | Flat $2.00 | 838-840 |
| **US** | HMF | 0.125% of value (ocean only) | 1528-1533 |
| **AU** | IPC | Flat ~AUD 88 (~$56 USD) | 843-845 |
| **NZ** | Biosecurity Levy | Flat ~NZD 33 (~$20 USD) | 847-850 |
| **CA** | CBSA handling | Flat ~$10 (estimate) | 852-855 |
| **JP** | Customs broker | Flat ~$20 (estimate) | 857-859 |
| **KR** | KCS clearance | Flat ~$15 (estimate) | 861-863 |
| **IN** | Landing charges | 1% of CIF | 865-867 |
| **CH** | Statistical fee | Flat CHF 15 (~$17) | 869-871 |
| **CN** | Customs clearance | Flat ~$30 (estimate) | 873-875 |
| **MX** | DTA | 0.8% of value, min ~$36 | 877-879 |
| **SG** | TradeNet permit | Flat ~$10 (estimate) | 881-883 |
| **BR** | SISCOMEX | Flat BRL 185 (~$36) | 885-887 |

- **Method**: CODE (hardcoded per-country fee logic)
- **Data source**: `customs_fees` table (240 rows in DB) -- but **NOT used by the engine**. The engine uses hardcoded values in the if/else chain. The `customs_fees` DB table exists but is not queried.
- **GAP**:
  - **The `customs_fees` DB table (240 rows) is not used.** The engine hardcodes fees for 14 countries and ignores the DB table. This means updates to the DB table have no effect, and the remaining 226 countries have zero customs fees in the calculation.
  - **US MPF informal entry fee is wrong.** The code uses flat $2.00 (line 839) but the actual informal entry MPF is $2.69 (minimum) to $12.09 (maximum) per CBP schedule. The older `CostEngine.ts:41` uses `MPF_INFORMAL = 5.50` (a reasonable average), but `GlobalCostEngine.ts` overrides with $2.00.
  - **US HMF only applies to ocean shipments.** The code at line 1531 applies HMF to all international shipments regardless of transport mode. The API input has no `transportMode` field to distinguish ocean vs air vs ground. HMF does not apply to air cargo or overland.
  - **AU IPC**: The actual IPC is AUD 50.00 (not AUD 88). AUD 88 is the documentary screening fee. Total can be AUD 50 + AUD 88 + AUD 42.47 (cargo examination) depending on risk assessment. The code's $56 USD is too low for a full IPC but too high for just the entry fee.
  - **JP**: Japan's customs examination fee is tiered: JPY 100-200 for simple, JPY 300-3,000 for complex. The flat $20 estimate conflates government fees with private broker fees.
  - **CA**: Canada CBSA does not charge a customs processing fee for most imports. The $10 is a broker-imposed handling fee, not a government fee. This should be separated from mandatory fees.
  - **MX DTA**: The code computes `Math.max(declaredValue * 0.008, 36)`. The actual DTA rate varies: 0.8% (general), 0.176% (under free trade agreements), or fixed MXN 432 (~$24) for USMCA goods. The FTA-conditional rate is not implemented.
  - **EU countries**: No customs fees implemented. EU does not have a standardized customs processing fee, but individual member states may charge: DE customs clearance fee ~EUR 5.50 (post-clearance), NL customs handling fee, etc. The code correctly notes "EU & UK: No separate customs processing fee" at line 889, which is approximately correct for government fees.
  - **Missing countries**: 226+ countries have zero customs fees in the calculation. Many have significant fees: Thailand (customs surcharge 0.5%), Indonesia (income tax advance 2.5-7.5%), South Africa (SARS customs duty surcharge), etc.

---

### Step 3: Broker Fees
- **Practitioner action**: Customs brokers charge for their services. Fees vary by country, complexity, entry type, and broker. These are NOT government fees but are often unavoidable for formal entries.
- **Current code**: Two implementations:
  1. **Value-based estimate** at `GlobalCostEngine.ts:906-918`:
     ```
     if (declaredValue > 2500) {
       brokerageFee = Math.min(declaredValue * 0.005, 250); // 0.5% capped at $250
     } else if (declaredValue > 800) {
       brokerageFee = 25; // Flat $25 for mid-range
     }
     // Under $800: typically no formal entry / broker needed
     ```
     Controlled by `input.includeBrokerage !== false` (default: include).
  2. **Country-based estimate** at `GlobalCostEngine.ts:1511-1524`:
     ```
     BROKER_FEE_BY_COUNTRY: Record<string, number> = {
       US: 200, CA: 180, GB: 120, AU: 150, JP: 180, KR: 130, DE: 150, ...
     };
     ```
     44 countries with specific estimates, $100 default for others. This is used in the S-Grade detailed breakdown at line 1011 (`getBrokerFeeEstimate()`).
  3. **Reconciliation**: Line 1013 picks the higher of the two: `const effectiveBrokerFee = brokerageFee > 0 ? brokerageFee : (!isDomestic && declaredValue > 800 ? brokerEstimate : 0)`.
- **Method**: CODE (hardcoded tiered estimates)
- **Data source**: `BROKER_FEE_BY_COUNTRY` hardcoded map (44 countries)
- **GAP**:
  - The two broker fee calculations can conflict. The value-based method (0.5% capped at $250) applies to all countries. The country-based method has fixed amounts (e.g., US $200). For a $10,000 shipment to the US: value-based = $50 (0.5%), country-based = $200. The reconciliation at line 1013 uses the value-based result if > 0, ignoring the country estimate. This means the country-specific estimates are only used when value-based returns 0 (i.e., shipments $0-$800).
  - Broker fees should be optional and clearly labeled as estimates. The API should allow the user to provide their own broker fee or opt out entirely. The `includeBrokerage` flag exists but defaults to `true`, which means broker fees are silently added to the total.
  - **NEEDED**: Distinguish between "government-mandated customs processing fee" (non-negotiable) and "private broker service fee" (negotiable/optional) in the breakdown and documentation.

---

### Step 4: Port/Airport Handling Fees
- **Practitioner action**: Ports and airports charge handling fees for cargo processing. These are separate from customs fees and vary by port, cargo type (containerized vs break-bulk vs air cargo), and weight/volume.
  - **US**: Terminal handling charge (THC) $200-$600 per container, air cargo handling $0.10-0.15/kg.
  - **EU**: EUR 50-150 depending on port and cargo type.
  - **Asia**: Varies widely. Shanghai ~CNY 200-500, Singapore SGD 50-150.
- **Current code**: MISSING. No port/airport handling fees are calculated anywhere in the engine. The `DetailedCostBreakdown` interface at `GlobalCostEngine.ts:119-140` does not have a port/handling fee field. The S-Grade breakdown has 15 items but none is "port handling."
- **Method**: MISSING
- **Data source**: NEEDED -- `port_handling_fees` table or per-country estimates
- **GAP**:
  - **Port/airport handling fees are completely absent.** These can be $50-$600+ per shipment and are a significant cost component for e-commerce and B2B shipments.
  - For POTAL's use case (B2B API providing landed cost estimates), port handling fees are often absorbed by the freight forwarder and bundled into the shipping cost. If the user provides `shippingCost`, it may already include port handling. The API should document this assumption.
  - A reasonable approach: do NOT add port handling fees to the default calculation (they are too variable and often bundled), but provide a separate API parameter `portHandlingFee` for users who know their fees, and document that `shippingCost` should include port handling if applicable.

---

### Step 5: Documentation Fees
- **Practitioner action**: Filing fees for customs declarations, certificates, and permits. These include:
  - Government filing fees (e.g., US ACE entry filing, EU CDS submission)
  - Certificate fees (Certificate of Origin, health certificates, phytosanitary certificates)
  - Inspection fees (if goods selected for examination)
- **Current code**: `GlobalCostEngine.ts:1537-1544` `getDocumentationFee()`:
  ```
  const fees: Record<string, number> = {
    US: 35, CA: 25, GB: 20, AU: 30, JP: 40, KR: 25, DE: 25, FR: 25, CN: 20, IN: 15, BR: 30,
  };
  return fees[countryCode] ?? 15;
  ```
  Called at line 1010 and included in the S-Grade `totalWithAllFees` at line 1016 and `detailedCostBreakdown` at line 1640.
- **Method**: CODE (hardcoded flat estimates per country)
- **Data source**: Hardcoded map (11 countries + $15 default)
- **GAP**:
  - Documentation fees are flat estimates that do not vary by product type, entry complexity, or document requirements. In reality, a shipment of food products requires a health certificate (~$50-100) and possibly phytosanitary inspection ($150-300), while electronics may need an FCC declaration ($0 self-certification).
  - The documentation fee is only included in the S-Grade detailed breakdown path. The basic `totalLandedCost` at line 1063 uses `totalWithMpf` (which excludes documentation fees), while the S-Grade path uses `totalWithAllFees` (which includes them). This means the basic API response and the S-Grade breakdown show different totals.
  - The `customs_fees` DB table (240 rows) likely contains documentation fee data but is not queried. Should be integrated.
  - **NEEDED**: At minimum, integrate the `customs_fees` DB table into the fee calculation. The table already has 240 country rows and likely contains per-country fee structures.

---

### Step 6: Total Fees
- **Practitioner action**: Sum all fee components and present a clear breakdown distinguishing government fees from service fees.
- **Current code**: Two totals are calculated:
  1. **Basic total**: `totalWithMpf = productPrice + shippingCost + importDuty + vat + mpf + insurance + brokerageFee` (line 928). This is the `totalLandedCost` returned in the response (line 1063).
  2. **S-Grade total**: `totalWithAllFees = totalWithMpf + hmf + docFee + (effectiveBrokerFee - brokerageFee)` (line 1016). This is used in the `detailedCostBreakdown` only.

  The fee-related fields in the response:
  - `mpf`: Country-specific processing fee (line 1061)
  - `brokerageFee`: Broker fee estimate (line 1094)
  - `insurance`: Insurance estimate (line 1093)
  - `detailedCostBreakdown.customs_processing_fee`: Same as `mpf`
  - `detailedCostBreakdown.merchandise_processing_fee`: US MPF specifically
  - `detailedCostBreakdown.harbor_maintenance_fee`: US HMF
  - `detailedCostBreakdown.broker_fee_estimate`: Broker fee
  - `detailedCostBreakdown.documentation_fee`: Filing fee estimate
- **Method**: CODE
- **Data source**: Computed from Steps 1-5
- **GAP**:
  - **The basic and S-Grade totals differ.** `totalLandedCost` (basic) excludes HMF and documentation fees. `detailedCostBreakdown.total_landed_cost` (S-Grade) includes them. For a $10,000 US shipment: HMF = $12.50, docFee = $35. The S-Grade total is $47.50 higher. API consumers see inconsistent totals depending on which field they read.
  - The `mpf` field name (Merchandise Processing Fee) is US-specific but is used for all countries' customs fees (Brazil SISCOMEX, Mexico DTA, etc.). The field should be renamed or the breakdown should use country-appropriate labels.
  - The `customs_processing_fee` and `merchandise_processing_fee` in the S-Grade breakdown overlap for US entries (both show the MPF amount). For non-US countries, `merchandise_processing_fee` is 0 but `customs_processing_fee` shows the country fee. This is confusing.
  - No clear separation between "government mandatory fees" and "estimated service fees" in the response structure. A fee classification field would help API consumers.

---

## 3. Data Inventory

| Data Point | Source | Table/File | Row Count | Status |
|---|---|---|---|---|
| Country customs fees | WCO, national customs | `customs_fees` DB table | 240 | EXISTS but NOT USED by engine |
| US MPF rates | CBP (19 USC 58c) | `GlobalCostEngine.ts:833-841` | Hardcoded | COMPLETE |
| US HMF rate | CBP (19 USC 24.24) | `GlobalCostEngine.ts:1528-1533` | Hardcoded | PARTIAL (no transport mode check) |
| AU IPC | ABF | `GlobalCostEngine.ts:843-845` | Hardcoded | PARTIAL (amount disputed) |
| MX DTA | SAT | `GlobalCostEngine.ts:877-879` | Hardcoded | PARTIAL (no FTA-conditional rate) |
| BR SISCOMEX | Receita Federal | `GlobalCostEngine.ts:885-887` | Hardcoded | COMPLETE |
| IN landing charges | CBIC | `GlobalCostEngine.ts:865-867` | Hardcoded | COMPLETE |
| Broker fees by country | Industry estimates | `GlobalCostEngine.ts:1513-1520` | 44 countries | COMPLETE (estimates) |
| Documentation fees | Estimates | `GlobalCostEngine.ts:1540-1543` | 11 countries | PARTIAL |
| Port handling fees | Port authorities | MISSING | 0 | NOT IMPLEMENTED |
| Entry type thresholds | National customs | MISSING | 0 | NEEDED |

---

## 4. GAP Summary

| # | Gap | Severity | Impact | Fix Complexity |
|---|---|---|---|---|
| G1 | `customs_fees` DB table (240 rows) not used by engine | HIGH | 226 countries have zero customs fees; DB data wasted | MEDIUM -- query DB in fee calculation |
| G2 | Basic and S-Grade totals differ (HMF + docFee discrepancy) | HIGH | Inconsistent API response totals | LOW -- include all fees in basic total |
| G3 | US MPF informal entry wrong ($2 vs $2.69-$12.09) | MEDIUM | Understates US informal entry fee | LOW -- use $5.50 average or min/max range |
| G4 | US HMF applied to all transport modes (should be ocean only) | MEDIUM | Overstates fees for air/ground shipments | LOW -- add `transportMode` input parameter |
| G5 | Entry type uses US $2,500 threshold for all countries | MEDIUM | Wrong entry classification for non-US | MEDIUM -- country-specific thresholds |
| G6 | MX DTA has no FTA-conditional rate (0.176% for FTA partners) | MEDIUM | Overstates Mexico fees for USMCA/other FTA imports | LOW -- check FTA result |
| G7 | Broker fee reconciliation logic inconsistent | LOW | Country estimates ignored for >$800 shipments | LOW -- use max(value-based, country-based) |
| G8 | `mpf` field name US-centric for all countries | LOW | Semantic confusion in API response | LOW -- rename to `customsFee` |
| G9 | Port/airport handling fees absent | LOW | Missing $50-600 cost component (often bundled in shipping) | LOW -- document assumption, add optional input |
| G10 | S-Grade `customs_processing_fee` and `merchandise_processing_fee` overlap for US | LOW | Double-reporting of MPF in detailed breakdown | LOW -- clarify: MPF is a subset of customs fee |

---

## 5. Implementation Plan

### Phase 1: Critical Fixes
1. **G1 -- Integrate `customs_fees` DB table**: Replace the hardcoded if/else chain with a DB lookup. Query `customs_fees` table by country_code. Parse the fee structure (flat amount, percentage with min/max, or formula). Fall back to hardcoded values if DB unavailable. This is the single most impactful change -- it brings 240-country coverage vs 14 today.
2. **G2 -- Unify totals**: Include HMF and documentation fee in the basic `totalWithMpf` calculation. Change line 928 to: `totalWithMpf = productPrice + shippingCost + importDuty + vat + mpf + insurance + brokerageFee + hmf + docFee`. Move HMF and docFee calculations BEFORE the total calculation (currently they are S-Grade only, calculated after the main total).

### Phase 2: Accuracy Improvements
3. **G3 -- US MPF informal**: Change flat $2 to $5.50 (average of $2.69-$12.09 range), matching `CostEngine.ts:41`. Or better: use `Math.min(Math.max(declaredValue * 0.003464, 2.69), 12.09)` for informal entries.
4. **G4 -- Transport mode**: Add `transportMode?: 'ocean' | 'air' | 'ground' | 'express'` to `GlobalCostInput`. Apply HMF only when `transportMode === 'ocean'` or undefined (conservative default).
5. **G5 -- Country-specific entry types**: Add entry type thresholds to the `customs_fees` DB table (e.g., US formal >$2500, AU FID >AUD 1000, JP general >JPY 200K). Use country threshold for entry type determination.
6. **G6 -- MX DTA FTA rate**: After FTA check, if Mexico destination and FTA applies, use DTA 0.176% instead of 0.8%. If USMCA specifically, use fixed MXN 432.

### Phase 3: Polish
7. **G7 -- Broker fee reconciliation**: Use `Math.max(brokerageFee, brokerEstimate)` instead of the current fallback logic. Or better: always use the country-based estimate and apply value-based scaling as a multiplier.
8. **G8 -- Field rename**: Add `customsFee` field (alias for `mpf`). Keep `mpf` for backward compatibility. Update `detailedCostBreakdown` to have `country_customs_fee` (general) distinct from `us_mpf` (US-specific).
9. **G9 -- Port handling documentation**: Add `portHandlingFee?: number` optional input parameter. Document that `shippingCost` should include port handling unless separately specified.
10. **G10 -- S-Grade overlap**: In `detailedCostBreakdown`, set `merchandise_processing_fee` = US MPF amount, and `customs_processing_fee` = non-MPF country customs fee. For US, `customs_processing_fee` = 0 since MPF is the customs fee. For non-US, `merchandise_processing_fee` = 0.

---

## 6. Architecture Diagram

```
Input: { destinationCountry, declaredValue, transportMode?, includeBrokerage? }
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 1: Entry Type            │
                    │  DB: customs_fees.threshold     │
                    │  US: >$2500 = formal           │
                    │  AU: >AUD 1000 = FID           │
                    │  JP: >JPY 200K = general       │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 2: Mandatory Fees         │
                    │  DB: customs_fees (240 countries)│
                    │  ┌──────────────────────────┐  │
                    │  │ US: MPF + HMF (ocean)    │  │
                    │  │ AU: IPC AUD 50           │  │
                    │  │ MX: DTA 0.8%/0.176%(FTA)│  │
                    │  │ BR: SISCOMEX BRL 185     │  │
                    │  │ IN: Landing 1% CIF       │  │
                    │  │ ... 240 countries        │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 3: Broker Fee (optional)  │
                    │  BROKER_FEE_BY_COUNTRY (44)    │
                    │  Value-based: 0.5% cap $250    │
                    │  Controlled by includeBrokerage│
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 4: Port Handling          │
                    │  (NOT IMPLEMENTED)              │
                    │  Assumed bundled in shippingCost│
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 5: Documentation Fee      │
                    │  11 countries + $15 default     │
                    │  Flat estimates                 │
                    └───────────────┬───────────────┘
                                    |
                    ┌───────────────v───────────────┐
                    │  Step 6: Total Fees             │
                    │  mandatoryFees (mpf)            │
                    │  + hmf (US ocean)               │
                    │  + brokerageFee (optional)      │
                    │  + docFee                       │
                    │  = totalFees                    │
                    │                                 │
                    │  Added to totalLandedCost       │
                    └─────────────────────────────────┘
```

---

## 7. The `customs_fees` Table Integration

The `customs_fees` DB table has 240 rows (one per country) but is currently unused. Integrating it is the highest-priority improvement.

**Proposed query pattern:**
```typescript
async function getCustomsFeeFromDb(countryCode: string, declaredValue: number, entryType: string): Promise<number> {
  const { data } = await supabase
    .from('customs_fees')
    .select('fee_type, rate, min_amount, max_amount, flat_fee, currency')
    .eq('country_code', countryCode)
    .single();

  if (!data) return 0;

  if (data.fee_type === 'percentage') {
    const fee = declaredValue * data.rate;
    return Math.min(Math.max(fee, data.min_amount ?? 0), data.max_amount ?? Infinity);
  } else if (data.fee_type === 'flat') {
    return data.flat_fee ?? 0;
  }
  return 0;
}
```

This would replace the 14-country if/else chain with a single DB-driven lookup covering all 240 countries. The hardcoded values become fallback-only.
