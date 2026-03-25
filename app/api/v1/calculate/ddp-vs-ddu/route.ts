/**
 * POTAL API v1 — /api/v1/calculate/ddp-vs-ddu
 *
 * DDP vs DDU pricing comparison.
 *
 * POST Body: {
 *   value: number,           // Product value (USD)
 *   origin: string,          // Origin country ISO code
 *   destination: string,     // Destination country ISO code
 *   duty_rate?: number,      // Duty rate % (default: auto from macmap)
 *   vat_rate?: number,       // VAT rate % (default: auto from country profile)
 *   weight_kg?: number,      // Weight in kg (for shipping estimate)
 *   shipping_cost?: number,  // Override shipping cost
 *   mode?: 'DDP' | 'DDU' | 'DAP' | 'compare',  // Default: 'compare'
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getCostAllocation } from '@/app/lib/trade/incoterms';
import { estimateShipping } from '@/app/lib/shipping/shipping-calculator';
import { calculatePricingMode, comparePricingModes, type PricingMode } from '@/app/lib/cost-engine/pricing-mode';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const value = typeof body.value === 'number' ? body.value : 0;
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase() : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase() : '';
  const dutyRate = typeof body.duty_rate === 'number' ? body.duty_rate : 0;
  const vatRate = typeof body.vat_rate === 'number' ? body.vat_rate : 0;
  const weightKg = typeof body.weight_kg === 'number' ? body.weight_kg : 1;
  const shippingOverride = typeof body.shipping_cost === 'number' ? body.shipping_cost : undefined;
  const mode = typeof body.mode === 'string' && ['DDP', 'DDU', 'DAP', 'compare'].includes(body.mode)
    ? body.mode as PricingMode | 'compare'
    : 'compare';

  if (value <= 0 || !origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'value (> 0), origin, destination required.');
  }

  try {
    // Calculate shipping
    let totalShipping = 0;
    if (shippingOverride !== undefined) {
      totalShipping = shippingOverride;
    } else {
      const shipping = estimateShipping({ origin, destination, weightKg });
      const stdEstimate = shipping.estimates.find(e => e.tier === 'standard') || shipping.estimates[0];
      const shippingCost = stdEstimate ? Math.round((stdEstimate.costMin + stdEstimate.costMax) / 2 * 100) / 100 : 0;
      const surchargeTotal = shipping.surcharges.reduce((s, c) => s + c.amount, 0);
      totalShipping = shippingCost + surchargeTotal;
    }

    // Calculate duty and VAT
    const duty = Math.round(value * (dutyRate / 100) * 100) / 100;
    const vatBase = value + totalShipping + duty;
    const vat = Math.round(vatBase * (vatRate / 100) * 100) / 100;

    // Incoterm allocations for reference
    const ddpAllocation = getCostAllocation('DDP');
    const dduAllocation = getCostAllocation('DAP');

    if (mode === 'compare') {
      const comparison = comparePricingModes(value, totalShipping, duty, vat, 0, 0, 'USD');
      return apiSuccess({
        ...comparison,
        incoterms: {
          ddp: { sellerPays: ddpAllocation.sellerPays, riskTransfer: ddpAllocation.riskTransferPoint },
          ddu: { buyerPays: dduAllocation.buyerPays, riskTransfer: dduAllocation.riskTransferPoint },
        },
      }, { sellerId: ctx.sellerId });
    }

    // Single mode
    const result = calculatePricingMode(
      mode === 'DAP' ? 'DAP' : mode as PricingMode,
      value, totalShipping, duty, vat, 0, 0, 'USD',
    );

    return apiSuccess({
      ...result,
      incoterm: mode === 'DDP' ? 'DDP' : 'DAP',
      incotermAllocation: mode === 'DDP' ? ddpAllocation : dduAllocation,
    }, { sellerId: ctx.sellerId });

  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'DDP/DDU calculation failed.');
  }
});
