/**
 * POTAL API v1 — /api/v1/tax/us-sales-tax
 *
 * US Sales Tax calculation with:
 * - ZIP-level tax rate breakdown (state + county + city + special)
 * - Nexus verification (seller must have nexus to collect)
 * - Product category exemptions (groceries, clothing, medicine)
 * - Origin vs destination sourcing rules
 * - Marketplace facilitator detection
 * - Economic nexus threshold warnings
 *
 * POST /api/v1/tax/us-sales-tax
 * Body: {
 *   state?: string,          // 2-letter state code
 *   zipcode?: string,        // ZIP code (resolves state if not provided)
 *   productValue?: number,   // Item value for tax calculation
 *   productCategory?: string, // groceries|clothing|prescription_medicine|medical_equipment
 *   sellerState?: string,    // Seller's state (for origin-based sourcing)
 *   sellerZip?: string,      // Seller's ZIP (for origin-based sourcing)
 *   marketplace?: string,    // Amazon|eBay|Etsy etc. (marketplace facilitator check)
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import {
  calculateUsSalesTax,
  STATE_NAMES,
  NO_SALES_TAX_STATES,
  checkProductExemption,
} from '@/app/lib/tax/us-sales-tax';
import { STATE_TAX_RATES } from '@/app/lib/cost-engine/CostEngine';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── POST: Full calculation ─────────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const state = typeof body.state === 'string' ? body.state : undefined;
  const zipcode = typeof body.zipcode === 'string' ? body.zipcode.trim() : undefined;
  const productValue = typeof body.productValue === 'number' ? body.productValue : undefined;
  const productCategory = typeof body.productCategory === 'string' ? body.productCategory : undefined;
  const sellerState = typeof body.sellerState === 'string' ? body.sellerState : undefined;
  const sellerZip = typeof body.sellerZip === 'string' ? body.sellerZip : undefined;
  const marketplace = typeof body.marketplace === 'string' ? body.marketplace : undefined;

  // Validate ZIP format
  if (zipcode && !/^\d{5}(-\d{4})?$/.test(zipcode)) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid ZIP code format. Expected 5-digit (e.g., "90001") or ZIP+4 (e.g., "90001-1234").');
  }

  if (!state && !zipcode) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "state" (2-letter code) or "zipcode".');
  }

  if (productValue !== undefined && productValue < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'productValue must be non-negative.');
  }

  try {
    const result = await calculateUsSalesTax({
      state,
      zipcode,
      productValue,
      productCategory,
      sellerId: context.sellerId,
      sellerState,
      sellerZip,
      marketplace,
    });

    return apiSuccess(
      {
        state: result.state,
        stateName: result.stateName,
        zipcode: result.zipcode,
        combinedRate: result.taxBreakdown.combinedRate,
        combinedRatePercent: result.combinedRatePercent,
        taxBreakdown: {
          stateRate: result.taxBreakdown.stateRate,
          countyRate: result.taxBreakdown.countyRate,
          cityRate: result.taxBreakdown.cityRate,
          specialRate: result.taxBreakdown.specialRate,
          precision: result.taxBreakdown.precision,
          warning: result.taxBreakdown.warning,
        },
        noSalesTax: result.noSalesTax,
        taxAmount: result.taxAmount,
        productValue: result.productValue,
        exempt: result.exempt,
        exemptReason: result.exemptReason,
        nexus: result.nexus,
        sourcingRule: result.sourcingRule,
        taxableState: result.taxableState,
        marketplace: result.marketplace,
        economicNexusWarning: result.economicNexusWarning,
        exemptions: {
          clothingExempt: checkProductExemption(result.taxableState, 'clothing').exempt,
          groceryExempt: checkProductExemption(result.taxableState, 'groceries').exempt,
          prescriptionExempt: true,
        },
        note: result.noSalesTax
          ? `${result.stateName} has no state sales tax.`
          : result.marketplace?.isFacilitator
            ? `Sales tax collected by ${result.marketplace.collectedBy} as marketplace facilitator.`
            : result.exempt
              ? result.exemptReason
              : !result.nexus.hasNexus
                ? `No nexus in ${result.stateName}. No tax collection obligation.`
                : `Rate for ${result.stateName}${result.sourcingRule === 'origin' ? ' (origin-based)' : ''}.`,
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calculation failed';
    return apiError(ApiErrorCode.BAD_REQUEST, message);
  }
});

// ─── GET: Quick lookup (backward compatible) ────────

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const state = (url.searchParams.get('state') || '').toUpperCase();
  const productCategory = url.searchParams.get('product_category') || '';
  const value = parseFloat(url.searchParams.get('value') || '0');

  if (!state || state.length !== 2 || !STATE_NAMES[state]) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'state query param required (2-letter code).');
  }

  // Try DB-backed data
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: dbRate } = await supabase
        .from('us_state_tax_rates')
        .select('*')
        .eq('state_code', state)
        .single();

      if (dbRate) {
        const isExempt =
          (productCategory === 'food' && dbRate.food_exempt) ||
          (productCategory === 'clothing' && dbRate.clothing_exempt) ||
          productCategory === 'prescription_medicine';

        const effectiveRate = isExempt ? 0 : Number(dbRate.combined_rate ?? 0);
        const taxAmount = value > 0 ? Math.round(value * effectiveRate) / 100 : null;

        return apiSuccess({
          state,
          state_name: String(dbRate.state_name ?? ''),
          state_rate: Number(dbRate.state_rate ?? 0),
          avg_local_rate: Number(dbRate.avg_local_rate ?? 0),
          combined_rate: Number(dbRate.combined_rate ?? 0),
          product_category: productCategory || null,
          exempt: isExempt,
          effective_rate: effectiveRate,
          tax_amount: taxAmount,
          value: value || null,
          economic_nexus: {
            has_nexus: Boolean(dbRate.has_economic_nexus),
            revenue_threshold: Number(dbRate.nexus_revenue_threshold ?? 100000),
            transaction_threshold: Number(dbRate.nexus_transaction_threshold ?? 200),
          },
          food_exempt: Boolean(dbRate.food_exempt),
          clothing_exempt: Boolean(dbRate.clothing_exempt),
          notes: dbRate.notes ? String(dbRate.notes) : null,
          source: 'database',
        }, { sellerId: ctx.sellerId });
      }
    } catch { /* fallback to hardcoded */ }
  }

  // Fallback
  const rate = STATE_TAX_RATES[state] ?? 0.07;
  return apiSuccess({
    state,
    state_name: STATE_NAMES[state],
    combined_rate: rate * 100,
    no_sales_tax: NO_SALES_TAX_STATES.has(state),
    tax_amount: value > 0 ? Math.round(value * rate * 100) / 100 : null,
    source: 'hardcoded',
  }, { sellerId: ctx.sellerId });
});
