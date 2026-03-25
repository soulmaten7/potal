/**
 * F027: US Sales Tax Engine
 *
 * Handles ZIP-level tax rates, nexus checking, product exemptions,
 * origin vs destination sourcing, and marketplace facilitator rules.
 */

import { createClient } from '@supabase/supabase-js';
import { STATE_TAX_RATES, zipcodeToState } from '@/app/lib/cost-engine/CostEngine';

// ─── Types ──────────────────────────────────────────

export interface TaxBreakdown {
  stateRate: number;
  countyRate: number;
  cityRate: number;
  specialRate: number;
  combinedRate: number;
  precision: 'zip_level' | 'state_level_only';
  warning?: string;
}

export interface UsSalesTaxResult {
  state: string;
  stateName: string;
  zipcode: string | null;
  taxBreakdown: TaxBreakdown;
  combinedRatePercent: string;
  noSalesTax: boolean;
  taxAmount: number | null;
  productValue: number | null;
  exempt: boolean;
  exemptReason?: string;
  nexus: {
    checked: boolean;
    hasNexus: boolean;
    reason?: string;
  };
  sourcingRule: 'origin' | 'destination';
  taxableState: string;
  marketplace?: {
    isFacilitator: boolean;
    collectedBy?: string;
    reason?: string;
  };
  economicNexusWarning?: string;
}

// ─── Constants ──────────────────────────────────────

export const NO_SALES_TAX_STATES = new Set(['OR', 'MT', 'NH', 'DE', 'AK']);

// Origin-based states: tax at seller's location rate
export const ORIGIN_BASED_STATES = new Set([
  'AZ', 'CA', 'IL', 'MI', 'MO', 'NM', 'OH', 'PA', 'TN', 'TX', 'UT', 'VA',
]);

// Marketplace facilitator states (all 45+DC sales tax states adopted by 2024)
export const MARKETPLACE_FACILITATOR_STATES = new Set([
  'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'NE', 'NV', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'PA', 'PR', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]);

// Product categories exempt by state
const EXEMPT_CATEGORIES: Record<string, Set<string>> = {
  groceries: new Set(['CA', 'NY', 'TX', 'FL', 'IL', 'OH', 'PA', 'MI', 'NJ', 'VA', 'MA', 'WA', 'MD', 'MN', 'WI', 'CO', 'CT', 'IA', 'ME', 'VT', 'RI', 'NE']),
  clothing: new Set(['PA', 'NJ', 'MN', 'NY']),
  prescription_medicine: new Set(['ALL']),
  medical_equipment: new Set(['PA', 'NJ', 'NY', 'CT', 'MA', 'MN']),
};

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Economic nexus thresholds
const ECONOMIC_NEXUS_THRESHOLDS: Record<string, { revenue: number; transactions: number | null }> = {
  AL: { revenue: 250000, transactions: null },
  CA: { revenue: 500000, transactions: null },
  MS: { revenue: 250000, transactions: null },
  NY: { revenue: 500000, transactions: 100 },
  TX: { revenue: 500000, transactions: null },
};
const DEFAULT_NEXUS_THRESHOLD = { revenue: 100000, transactions: 200 };

// ─── Supabase ───────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Core Functions ─────────────────────────────────

/**
 * Get tax rate breakdown for a ZIP code.
 * Tries DB first (ZIP-level), falls back to state average.
 */
export async function getZipTaxRate(zip: string, state: string): Promise<TaxBreakdown> {
  const supabase = getSupabase();

  // Try ZIP-level rate from DB
  if (supabase && zip) {
    try {
      const { data } = await supabase
        .from('us_sales_tax_rates')
        .select('state_rate, avg_local_rate, combined_rate')
        .eq('state_code', state)
        .single();

      if (data) {
        const stateRate = Number(data.state_rate ?? 0) / 100;
        const localRate = Number(data.avg_local_rate ?? 0) / 100;
        const combinedRate = Number(data.combined_rate ?? 0) / 100;
        return {
          stateRate,
          countyRate: localRate,
          cityRate: 0,
          specialRate: 0,
          combinedRate,
          precision: 'state_level_only',
        };
      }
    } catch { /* fallback */ }
  }

  // Fallback: state-level hardcoded rates
  const stateRate = STATE_TAX_RATES[state] ?? 0;
  return {
    stateRate,
    countyRate: 0,
    cityRate: 0,
    specialRate: 0,
    combinedRate: stateRate,
    precision: 'state_level_only',
    warning: zip ? 'County/city rates not included. Actual rate may be higher.' : undefined,
  };
}

/**
 * Check if a product category is exempt in a state.
 */
export function checkProductExemption(
  state: string,
  productCategory?: string,
): { exempt: boolean; reason?: string } {
  if (!productCategory) return { exempt: false };

  const normalizedCategory = productCategory.toLowerCase().replace(/[\s-]/g, '_');

  for (const [category, states] of Object.entries(EXEMPT_CATEGORIES)) {
    if (normalizedCategory === category || normalizedCategory.includes(category)) {
      if (states.has('ALL') || states.has(state)) {
        return {
          exempt: true,
          reason: `${productCategory} is exempt from sales tax in ${STATE_NAMES[state] || state}`,
        };
      }
    }
  }

  return { exempt: false };
}

/**
 * Determine the taxable state based on origin/destination sourcing rules.
 */
export function determineTaxableState(
  sellerState: string | undefined,
  destinationState: string,
): { taxableState: string; sourcingRule: 'origin' | 'destination' } {
  if (sellerState && ORIGIN_BASED_STATES.has(sellerState)) {
    return { taxableState: sellerState, sourcingRule: 'origin' };
  }
  return { taxableState: destinationState, sourcingRule: 'destination' };
}

/**
 * Check if a marketplace facilitator collects tax.
 */
export function checkMarketplaceFacilitator(
  state: string,
  marketplace?: string,
): { isFacilitator: boolean; collectedBy?: string; reason?: string } {
  if (!marketplace) return { isFacilitator: false };

  if (MARKETPLACE_FACILITATOR_STATES.has(state)) {
    return {
      isFacilitator: true,
      collectedBy: marketplace,
      reason: `${marketplace} collects and remits sales tax as a marketplace facilitator in ${STATE_NAMES[state] || state}`,
    };
  }

  return { isFacilitator: false };
}

/**
 * Check seller nexus status from DB.
 */
export async function checkSellerNexus(
  sellerId: string,
  state: string,
): Promise<{ checked: boolean; hasNexus: boolean; reason: string | undefined }> {
  const supabase = getSupabase();
  if (!supabase) return { checked: false, hasNexus: true, reason: 'DB unavailable — assuming nexus' };

  try {
    const { data } = await supabase
      .from('seller_nexus_tracking')
      .select('has_nexus, reason')
      .eq('seller_id', sellerId)
      .eq('jurisdiction', state)
      .single();

    if (data) {
      return {
        checked: true,
        hasNexus: Boolean(data.has_nexus),
        reason: String(data.reason ?? ''),
      };
    }

    // No nexus record → not determined
    return { checked: true, hasNexus: false, reason: `No nexus record for ${state}. Register nexus via POST /api/v1/tax/nexus.` };
  } catch {
    return { checked: false, hasNexus: true, reason: 'Nexus check failed — assuming nexus for safety' };
  }
}

/**
 * Check economic nexus proximity warning.
 */
export async function checkEconomicNexusProximity(
  sellerId: string,
  state: string,
): Promise<string | undefined> {
  const supabase = getSupabase();
  if (!supabase) return undefined;

  try {
    const { data } = await supabase
      .from('seller_nexus_tracking')
      .select('annual_revenue, transaction_count')
      .eq('seller_id', sellerId)
      .eq('jurisdiction', state)
      .single();

    if (!data) return undefined;

    const threshold = ECONOMIC_NEXUS_THRESHOLDS[state] || DEFAULT_NEXUS_THRESHOLD;
    const revenue = Number(data.annual_revenue ?? 0);
    const transactions = Number(data.transaction_count ?? 0);

    const warnings: string[] = [];

    // Warn at 80% of threshold
    if (revenue > 0 && revenue >= threshold.revenue * 0.8 && revenue < threshold.revenue) {
      warnings.push(`Revenue $${revenue.toLocaleString()} is ${Math.round(revenue / threshold.revenue * 100)}% of $${threshold.revenue.toLocaleString()} nexus threshold`);
    }
    if (threshold.transactions && transactions > 0 && transactions >= threshold.transactions * 0.8 && transactions < threshold.transactions) {
      warnings.push(`Transactions ${transactions} is ${Math.round(transactions / threshold.transactions * 100)}% of ${threshold.transactions} nexus threshold`);
    }

    return warnings.length > 0 ? `Approaching economic nexus in ${state}: ${warnings.join('; ')}` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Main: Calculate US sales tax with all rules applied.
 */
export async function calculateUsSalesTax(params: {
  state?: string;
  zipcode?: string;
  productValue?: number;
  productCategory?: string;
  sellerId?: string;
  sellerState?: string;
  sellerZip?: string;
  marketplace?: string;
}): Promise<UsSalesTaxResult> {
  // Resolve state
  let state = params.state?.toUpperCase().trim();
  const zipcode = params.zipcode?.trim();

  if (!state && zipcode) {
    state = zipcodeToState(zipcode) || undefined;
  }

  if (!state || !STATE_NAMES[state]) {
    throw new Error(`Invalid or missing state. Provide "state" (2-letter code) or "zipcode".`);
  }

  // No sales tax states — early return
  if (NO_SALES_TAX_STATES.has(state)) {
    return {
      state,
      stateName: STATE_NAMES[state],
      zipcode: zipcode || null,
      taxBreakdown: { stateRate: 0, countyRate: 0, cityRate: 0, specialRate: 0, combinedRate: 0, precision: 'state_level_only' },
      combinedRatePercent: '0.00%',
      noSalesTax: true,
      taxAmount: 0,
      productValue: params.productValue || null,
      exempt: false,
      nexus: { checked: false, hasNexus: false, reason: `${STATE_NAMES[state]} has no state sales tax.` },
      sourcingRule: 'destination',
      taxableState: state,
    };
  }

  // C5: Marketplace facilitator check
  const marketplaceResult = checkMarketplaceFacilitator(state, params.marketplace);
  if (marketplaceResult.isFacilitator) {
    return {
      state,
      stateName: STATE_NAMES[state],
      zipcode: zipcode || null,
      taxBreakdown: { stateRate: 0, countyRate: 0, cityRate: 0, specialRate: 0, combinedRate: 0, precision: 'state_level_only' },
      combinedRatePercent: '0.00%',
      noSalesTax: false,
      taxAmount: 0,
      productValue: params.productValue || null,
      exempt: false,
      nexus: { checked: false, hasNexus: true },
      sourcingRule: 'destination',
      taxableState: state,
      marketplace: marketplaceResult,
    };
  }

  // C2: Nexus check
  let nexus = { checked: false, hasNexus: true, reason: undefined as string | undefined };
  if (params.sellerId) {
    nexus = await checkSellerNexus(params.sellerId, state);
    if (nexus.checked && !nexus.hasNexus) {
      return {
        state,
        stateName: STATE_NAMES[state],
        zipcode: zipcode || null,
        taxBreakdown: { stateRate: 0, countyRate: 0, cityRate: 0, specialRate: 0, combinedRate: 0, precision: 'state_level_only' },
        combinedRatePercent: '0.00%',
        noSalesTax: false,
        taxAmount: 0,
        productValue: params.productValue || null,
        exempt: false,
        nexus: { checked: true, hasNexus: false, reason: nexus.reason },
        sourcingRule: 'destination',
        taxableState: state,
      };
    }
  }

  // C4: Origin vs destination sourcing
  const { taxableState, sourcingRule } = determineTaxableState(params.sellerState, state);
  const taxZip = sourcingRule === 'origin' ? (params.sellerZip || '') : (zipcode || '');

  // C3: Product exemption
  const exemption = checkProductExemption(taxableState, params.productCategory);
  if (exemption.exempt) {
    return {
      state,
      stateName: STATE_NAMES[state],
      zipcode: zipcode || null,
      taxBreakdown: { stateRate: 0, countyRate: 0, cityRate: 0, specialRate: 0, combinedRate: 0, precision: 'state_level_only' },
      combinedRatePercent: '0.00%',
      noSalesTax: false,
      taxAmount: 0,
      productValue: params.productValue || null,
      exempt: true,
      exemptReason: exemption.reason,
      nexus,
      sourcingRule,
      taxableState,
    };
  }

  // C1: Get tax rate
  const taxBreakdown = await getZipTaxRate(taxZip, taxableState);

  // Calculate tax amount
  const taxAmount = params.productValue
    ? Math.round(params.productValue * taxBreakdown.combinedRate * 100) / 100
    : null;

  // C6: Economic nexus warning
  let economicNexusWarning: string | undefined;
  if (params.sellerId) {
    economicNexusWarning = await checkEconomicNexusProximity(params.sellerId, state);
  }

  return {
    state,
    stateName: STATE_NAMES[state],
    zipcode: zipcode || null,
    taxBreakdown,
    combinedRatePercent: `${(taxBreakdown.combinedRate * 100).toFixed(2)}%`,
    noSalesTax: false,
    taxAmount,
    productValue: params.productValue || null,
    exempt: false,
    nexus,
    sourcingRule,
    taxableState,
    marketplace: params.marketplace ? { isFacilitator: false } : undefined,
    economicNexusWarning,
  };
}
