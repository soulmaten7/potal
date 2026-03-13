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

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { state: "CA" } or { zipcode: "90210", productValue?: 100 }');
}
