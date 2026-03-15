import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getCostAllocation } from '@/app/lib/trade/incoterms';
import { estimateShipping } from '@/app/lib/shipping/shipping-calculator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const value = typeof body.value === 'number' ? body.value : 0;
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';
  const dutyRate = typeof body.duty_rate === 'number' ? body.duty_rate : 0;
  const vatRate = typeof body.vat_rate === 'number' ? body.vat_rate : 0;
  const weightKg = typeof body.weight_kg === 'number' ? body.weight_kg : 1;

  if (value <= 0 || !origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'value, origin, destination required.');
  }

  try {
    const shipping = estimateShipping({ origin, destination, weightKg });
    // Use standard tier average cost, fallback to first estimate
    const stdEstimate = shipping.estimates.find(e => e.tier === 'standard') || shipping.estimates[0];
    const shippingCost = stdEstimate ? Math.round((stdEstimate.costMin + stdEstimate.costMax) / 2 * 100) / 100 : 0;
    const surchargeTotal = shipping.surcharges.reduce((s, c) => s + c.amount, 0);
    const totalShipping = shippingCost + surchargeTotal;

    const duty = value * (dutyRate / 100);
    const totalWithDuty = value + totalShipping + duty;
    const vat = totalWithDuty * (vatRate / 100);

    const ddpCost = value + totalShipping + duty + vat;
    const dduCost = value + totalShipping;

    const ddpAllocation = getCostAllocation('DDP');
    const dduAllocation = getCostAllocation('DAP');

    return apiSuccess({
      ddp: { total: Math.round(ddpCost * 100) / 100, breakdown: { product: value, shipping: totalShipping, duty, vat }, seller_pays: ddpAllocation.sellerPays },
      ddu: { total: Math.round(dduCost * 100) / 100, breakdown: { product: value, shipping: totalShipping }, buyer_pays_at_delivery: { duty, vat }, buyer_pays: dduAllocation.buyerPays },
      recommendation: ddpCost < value * 1.5 ? 'DDP recommended for better buyer experience.' : 'DDU may be preferable for high-duty shipments.',
      difference: Math.round((ddpCost - dduCost) * 100) / 100,
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'DDP/DDU calculation failed.');
  }
});
