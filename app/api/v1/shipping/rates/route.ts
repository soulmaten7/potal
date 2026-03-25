/**
 * POTAL API v1 — /api/v1/shipping/rates
 * F060: Multi-carrier shipping rate comparison (8 carriers, 20+ services).
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getCarrierRates, recommendCarrier, type ShipmentParams } from '@/app/lib/shipping/carrier-rates';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const origin = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase() :
    typeof body.origin_country === 'string' ? body.origin_country.toUpperCase() : '';
  const dest = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() :
    typeof body.destination_country === 'string' ? body.destination_country.toUpperCase() : '';
  const weight = typeof body.weightKg === 'number' ? body.weightKg :
    typeof body.weight_kg === 'number' ? body.weight_kg : 0;
  const value = typeof body.declaredValue === 'number' ? body.declaredValue :
    typeof body.value === 'number' ? body.value : 0;

  if (!origin || !dest) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" and "destinationCountry" required.');
  if (weight <= 0) return apiError(ApiErrorCode.BAD_REQUEST, '"weightKg" must be > 0.');

  const params: ShipmentParams = {
    originCountry: origin,
    destinationCountry: dest,
    weightKg: weight,
    lengthCm: typeof body.lengthCm === 'number' ? body.lengthCm : typeof body.length_cm === 'number' ? body.length_cm : undefined,
    widthCm: typeof body.widthCm === 'number' ? body.widthCm : typeof body.width_cm === 'number' ? body.width_cm : undefined,
    heightCm: typeof body.heightCm === 'number' ? body.heightCm : typeof body.height_cm === 'number' ? body.height_cm : undefined,
    declaredValue: value,
  };

  const rates = getCarrierRates(params);
  const cheapest = recommendCarrier(rates, 'cheapest');
  const fastest = recommendCarrier(rates, 'fastest');
  const bestValue = recommendCarrier(rates, 'best_value');

  return apiSuccess({
    shipment: { originCountry: origin, destinationCountry: dest, weightKg: weight, declaredValue: value },
    rates,
    recommendation: {
      cheapest: cheapest ? { carrier: cheapest.carrier, service: cheapest.service, rate: cheapest.rate } : null,
      fastest: fastest ? { carrier: fastest.carrier, service: fastest.service, estimatedDays: fastest.estimatedDays } : null,
      bestValue: bestValue ? { carrier: bestValue.carrier, service: bestValue.service, rate: bestValue.rate, estimatedDays: bestValue.estimatedDays } : null,
    },
    totalOptions: rates.length,
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { originCountry, destinationCountry, weightKg, declaredValue?, lengthCm?, widthCm?, heightCm? }');
}
