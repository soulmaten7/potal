/**
 * F068: Multi-Package Shipping Support
 *
 * POST /api/v1/shipping/multi-package
 * Calculate shipping for multiple packages with aggregated rates and dim weight.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getCarrierRates, calculateDimWeight, calculateInsurancePremium, type ShipmentParams } from '@/app/lib/shipping/carrier-rates';

interface PackageInput {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValue: number;
  description?: string;
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const origin = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase() : '';
  const dest = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';
  const packages = Array.isArray(body.packages) ? body.packages as PackageInput[] : [];
  const includeInsurance = body.includeInsurance === true;

  if (!origin || !dest) return apiError(ApiErrorCode.BAD_REQUEST, '"originCountry" and "destinationCountry" required.');
  if (packages.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, '"packages" array required (min 1 package).');
  if (packages.length > 50) return apiError(ApiErrorCode.BAD_REQUEST, 'Maximum 50 packages per request.');

  // Process each package
  const packageDetails = packages.map((pkg, idx) => {
    const weight = Number(pkg.weightKg) || 0;
    const length = Number(pkg.lengthCm) || 0;
    const width = Number(pkg.widthCm) || 0;
    const height = Number(pkg.heightCm) || 0;
    const value = Number(pkg.declaredValue) || 0;

    const dim = length > 0 && width > 0 && height > 0
      ? calculateDimWeight(length, width, height)
      : null;

    const billableWeight = dim
      ? Math.max(weight, dim.volumetricWeightKg)
      : weight;

    const insurance = includeInsurance
      ? calculateInsurancePremium(value, 0, 'basic')
      : null;

    return {
      packageNumber: idx + 1,
      description: pkg.description || `Package ${idx + 1}`,
      actualWeightKg: weight,
      dimensions: dim ? { lengthCm: length, widthCm: width, heightCm: height, cubicCm: dim.cubicCm } : null,
      volumetricWeightKg: dim?.volumetricWeightKg || null,
      billableWeightKg: Math.round(billableWeight * 100) / 100,
      useDimWeight: dim ? dim.volumetricWeightKg > weight : false,
      declaredValue: value,
      insurancePremium: insurance?.premium || 0,
    };
  });

  // Aggregated totals
  const totalActualWeight = Math.round(packageDetails.reduce((s, p) => s + p.actualWeightKg, 0) * 100) / 100;
  const totalBillableWeight = Math.round(packageDetails.reduce((s, p) => s + p.billableWeightKg, 0) * 100) / 100;
  const totalDeclaredValue = Math.round(packageDetails.reduce((s, p) => s + p.declaredValue, 0) * 100) / 100;
  const totalInsurance = Math.round(packageDetails.reduce((s, p) => s + p.insurancePremium, 0) * 100) / 100;

  // Get carrier rates for total shipment
  const params: ShipmentParams = {
    originCountry: origin,
    destinationCountry: dest,
    weightKg: totalBillableWeight,
    declaredValue: totalDeclaredValue,
  };

  const rates = getCarrierRates(params);

  // Top 5 carrier options with multi-package surcharges
  const carrierOptions = rates.slice(0, 10).map(rate => {
    // Multi-package surcharge: ~$2 per additional package
    const multiPackageSurcharge = Math.round((packages.length - 1) * 2 * 100) / 100;
    const totalShipping = Math.round((rate.rate + multiPackageSurcharge) * 100) / 100;

    return {
      carrier: rate.carrier,
      service: rate.service,
      serviceLevel: rate.serviceLevel,
      baseRate: rate.rate,
      multiPackageSurcharge,
      totalShippingCost: totalShipping,
      estimatedDays: rate.estimatedDays,
      totalWithInsurance: Math.round((totalShipping + totalInsurance) * 100) / 100,
    };
  });

  return apiSuccess({
    shipment: {
      originCountry: origin,
      destinationCountry: dest,
      packageCount: packages.length,
      totalActualWeightKg: totalActualWeight,
      totalBillableWeightKg: totalBillableWeight,
      totalDeclaredValue: totalDeclaredValue,
      totalInsurancePremium: includeInsurance ? totalInsurance : undefined,
    },
    packages: packageDetails,
    carrierOptions,
    recommendation: carrierOptions.length > 0 ? {
      cheapest: carrierOptions[0],
      fastest: carrierOptions.reduce((f, c) => c.estimatedDays.min < f.estimatedDays.min ? c : f, carrierOptions[0]),
    } : null,
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { originCountry, destinationCountry, packages: [{ weightKg, lengthCm, widthCm, heightCm, declaredValue, description? }], includeInsurance? }');
}
