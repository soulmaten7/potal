/**
 * POTAL API v1 — /api/v1/tax/us-sales-tax
 *
 * US Sales Tax lookup endpoint.
 * Returns state/local combined sales tax rate by state or ZIP code.
 *
 * POST /api/v1/tax/us-sales-tax
 * Body: { state?: string, zipcode?: string, productValue?: number }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { STATE_TAX_RATES, zipcodeToState } from '@/app/lib/cost-engine/CostEngine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// Tax-free product categories by state (simplified)
const TAX_EXEMPT_CATEGORIES: Record<string, string[]> = {
  'clothing': ['PA', 'NJ', 'MN', 'NY'], // Some states exempt clothing
  'food_grocery': ['CA', 'NY', 'TX', 'FL', 'IL', 'OH', 'PA', 'MI', 'NJ', 'VA', 'MA', 'WA', 'MD', 'MN', 'WI', 'CO', 'CT', 'IA', 'ME', 'VT', 'RI', 'NE'],
  'prescription_medicine': ['ALL'], // All states exempt Rx drugs
};

const NO_SALES_TAX_STATES = new Set(['OR', 'MT', 'NH', 'DE', 'AK']);

const STATE_NAMES: Record<string, string> = {
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

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  let state = typeof body.state === 'string' ? body.state.toUpperCase().trim() : undefined;
  const zipcode = typeof body.zipcode === 'string' ? body.zipcode.trim() : undefined;
  const productValue = typeof body.productValue === 'number' ? body.productValue : undefined;

  // Resolve state from ZIP if not provided
  if (!state && zipcode) {
    state = zipcodeToState(zipcode) || undefined;
  }

  if (!state) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Provide "state" (2-letter code) or "zipcode".');
  }

  if (state.length !== 2 || !STATE_NAMES[state]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Invalid state code "${state}".`);
  }

  const rate = STATE_TAX_RATES[state] ?? 0.07;
  const taxAmount = productValue ? Math.round(productValue * rate * 100) / 100 : null;

  return apiSuccess(
    {
      state,
      stateName: STATE_NAMES[state],
      zipcode: zipcode || null,
      combinedRate: rate,
      combinedRatePercent: `${(rate * 100).toFixed(2)}%`,
      noSalesTax: NO_SALES_TAX_STATES.has(state),
      taxAmount,
      productValue: productValue || null,
      exemptions: {
        clothingExempt: TAX_EXEMPT_CATEGORIES['clothing'].includes(state),
        groceryExempt: TAX_EXEMPT_CATEGORIES['food_grocery'].includes(state),
        prescriptionExempt: true,
      },
      note: NO_SALES_TAX_STATES.has(state)
        ? `${STATE_NAMES[state]} has no state sales tax.`
        : `Rate includes estimated state + local combined average for ${STATE_NAMES[state]}.`,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const state = (url.searchParams.get('state') || '').toUpperCase();
  const productCategory = url.searchParams.get('product_category') || '';
  const value = parseFloat(url.searchParams.get('value') || '0');

  if (!state || state.length !== 2 || !STATE_NAMES[state]) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'state query param required (2-letter code).');
  }

  // Try DB-backed data
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: dbRate } = await sb.from('us_state_tax_rates').select('*').eq('state_code', state).single();

    if (dbRate) {
      const isExempt =
        (productCategory === 'food' && dbRate.food_exempt) ||
        (productCategory === 'clothing' && dbRate.clothing_exempt) ||
        productCategory === 'prescription_medicine';

      const effectiveRate = isExempt ? 0 : parseFloat(dbRate.combined_rate);
      const taxAmount = value > 0 ? Math.round(value * effectiveRate) / 100 : null;

      return apiSuccess({
        state, state_name: dbRate.state_name,
        state_rate: parseFloat(dbRate.state_rate),
        avg_local_rate: parseFloat(dbRate.avg_local_rate),
        combined_rate: parseFloat(dbRate.combined_rate),
        product_category: productCategory || null,
        exempt: isExempt,
        effective_rate: effectiveRate,
        tax_amount: taxAmount,
        value: value || null,
        economic_nexus: {
          has_nexus: dbRate.has_economic_nexus,
          revenue_threshold: parseFloat(dbRate.nexus_revenue_threshold),
          transaction_threshold: dbRate.nexus_transaction_threshold,
        },
        food_exempt: dbRate.food_exempt,
        clothing_exempt: dbRate.clothing_exempt,
        notes: dbRate.notes,
        source: 'database',
      }, { sellerId: ctx.sellerId });
    }
  } catch { /* fallback to hardcoded */ }

  // Fallback
  const rate = STATE_TAX_RATES[state] ?? 0.07;
  return apiSuccess({
    state, state_name: STATE_NAMES[state],
    combined_rate: rate * 100,
    tax_amount: value > 0 ? Math.round(value * rate * 100) / 100 : null,
    source: 'hardcoded',
  }, { sellerId: ctx.sellerId });
});
