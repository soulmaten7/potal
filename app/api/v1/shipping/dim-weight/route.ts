/**
 * F065: Dimensional Weight Calculator
 *
 * POST /api/v1/shipping/dim-weight
 * Calculates volumetric/dimensional weight and determines billable weight.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateDimWeight } from '@/app/lib/shipping/carrier-rates';

// DIM factors by carrier (cm³/kg)
const DIM_FACTORS: Record<string, number> = {
  dhl: 5000,
  fedex: 5000,
  ups: 5000,
  usps_domestic: 5556,   // 139 cubic inches per lb
  usps_international: 6000,
  royalmail: 5000,
  australia_post: 5000,
  canada_post: 5000,
  default: 5000,
};

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const lengthCm = typeof body.lengthCm === 'number' ? body.lengthCm :
    typeof body.length_cm === 'number' ? body.length_cm : 0;
  const widthCm = typeof body.widthCm === 'number' ? body.widthCm :
    typeof body.width_cm === 'number' ? body.width_cm : 0;
  const heightCm = typeof body.heightCm === 'number' ? body.heightCm :
    typeof body.height_cm === 'number' ? body.height_cm : 0;
  const actualWeightKg = typeof body.weightKg === 'number' ? body.weightKg :
    typeof body.weight_kg === 'number' ? body.weight_kg : 0;
  const carrier = typeof body.carrier === 'string' ? body.carrier.toLowerCase() : '';
  const isDomestic = body.isDomestic === true || body.is_domestic === true;

  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"lengthCm", "widthCm", "heightCm" all required and must be > 0.');
  }

  // Select DIM factor
  let dimFactor = DIM_FACTORS.default;
  if (carrier === 'usps') {
    dimFactor = isDomestic ? DIM_FACTORS.usps_domestic : DIM_FACTORS.usps_international;
  } else if (DIM_FACTORS[carrier]) {
    dimFactor = DIM_FACTORS[carrier];
  }

  const result = calculateDimWeight(lengthCm, widthCm, heightCm, dimFactor);
  const billableWeightKg = actualWeightKg > 0
    ? Math.max(actualWeightKg, result.volumetricWeightKg)
    : result.volumetricWeightKg;
  const useDimWeight = result.volumetricWeightKg > actualWeightKg;

  // Multi-carrier comparison
  const carrierComparison = Object.entries(DIM_FACTORS)
    .filter(([key]) => key !== 'default')
    .map(([name, factor]) => {
      const dim = calculateDimWeight(lengthCm, widthCm, heightCm, factor);
      const billable = actualWeightKg > 0 ? Math.max(actualWeightKg, dim.volumetricWeightKg) : dim.volumetricWeightKg;
      return {
        carrier: name,
        dimFactor: factor,
        volumetricWeightKg: dim.volumetricWeightKg,
        billableWeightKg: Math.round(billable * 100) / 100,
        usesDimWeight: dim.volumetricWeightKg > actualWeightKg,
      };
    });

  return apiSuccess({
    dimensions: { lengthCm, widthCm, heightCm, cubicCm: result.cubicCm },
    actualWeightKg: actualWeightKg || null,
    volumetricWeightKg: result.volumetricWeightKg,
    dimFactor,
    billableWeightKg: Math.round(billableWeightKg * 100) / 100,
    useDimensionalWeight: useDimWeight,
    carrierComparison,
    tips: useDimWeight
      ? 'This package is billed by volumetric weight. Consider reducing package dimensions to lower shipping costs.'
      : 'This package is billed by actual weight.',
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { lengthCm, widthCm, heightCm, weightKg?, carrier?, isDomestic? }');
}
