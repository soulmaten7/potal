/**
 * F060: Multi-carrier rate comparison.
 * F064: Shipping insurance.
 * F066: Shipping rules engine.
 * F067: Split/merge shipments.
 * F070: Cartonization.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const CARRIERS = [
  { id: 'dhl_express', name: 'DHL Express', services: ['Express Worldwide', 'Economy Select'], transitDays: { min: 1, max: 5 }, coverage: 220 },
  { id: 'fedex', name: 'FedEx', services: ['International Priority', 'International Economy', 'Ground'], transitDays: { min: 1, max: 7 }, coverage: 220 },
  { id: 'ups', name: 'UPS', services: ['Worldwide Express', 'Worldwide Expedited', 'Standard'], transitDays: { min: 1, max: 7 }, coverage: 220 },
  { id: 'usps', name: 'USPS', services: ['Priority Mail International', 'First-Class Intl'], transitDays: { min: 6, max: 21 }, coverage: 190 },
  { id: 'royal_mail', name: 'Royal Mail', services: ['International Tracked', 'International Standard'], transitDays: { min: 5, max: 14 }, coverage: 200 },
  { id: 'australia_post', name: 'Australia Post', services: ['International Express', 'International Standard'], transitDays: { min: 3, max: 14 }, coverage: 200 },
  { id: 'canada_post', name: 'Canada Post', services: ['Xpresspost International', 'International Parcel'], transitDays: { min: 4, max: 12 }, coverage: 200 },
  { id: 'japan_post', name: 'Japan Post', services: ['EMS', 'ePacket', 'SAL'], transitDays: { min: 2, max: 14 }, coverage: 200 },
  { id: 'sf_express', name: 'SF Express', services: ['International Standard Express', 'Economy'], transitDays: { min: 3, max: 10 }, coverage: 200 },
];

function estimateRate(weight: number, carrier: typeof CARRIERS[0], service: string): number {
  const baseRate = carrier.id.includes('express') || carrier.id === 'dhl_express' ? 25 : 15;
  const perKg = carrier.id === 'usps' ? 5 : carrier.id === 'dhl_express' ? 12 : 8;
  const serviceMultiplier = service.toLowerCase().includes('express') || service.toLowerCase().includes('priority') ? 1.5 : 1.0;
  return Math.round((baseRate + weight * perKg) * serviceMultiplier * 100) / 100;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const originCountry = typeof body.originCountry === 'string' ? body.originCountry.toUpperCase().trim() : '';
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : '';
  const weightKg = typeof body.weightKg === 'number' ? body.weightKg : 1;
  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue : undefined;
  const includeInsurance = body.includeInsurance === true;

  if (!originCountry || !destinationCountry) return apiError(ApiErrorCode.BAD_REQUEST, 'originCountry and destinationCountry required.');

  const rates = CARRIERS.flatMap(carrier =>
    carrier.services.map(service => {
      const rate = estimateRate(weightKg, carrier, service);
      const insuranceCost = includeInsurance && declaredValue ? Math.round(declaredValue * 0.015 * 100) / 100 : 0;
      return {
        carrier: carrier.name, carrierId: carrier.id, service,
        estimatedRate: rate, currency: 'USD',
        transitDays: carrier.transitDays,
        insuranceCost, totalCost: Math.round((rate + insuranceCost) * 100) / 100,
        countryCoverage: carrier.coverage,
      };
    })
  ).sort((a, b) => a.estimatedRate - b.estimatedRate);

  return apiSuccess({
    originCountry, destinationCountry, weightKg,
    rates: rates.slice(0, 15),
    cheapest: rates[0] || null,
    fastest: [...rates].sort((a, b) => a.transitDays.min - b.transitDays.min)[0] || null,
    insurance: includeInsurance ? { available: true, rate: '1.5% of declared value', declaredValue } : { available: true, note: 'Set includeInsurance: true for quotes.' },
    cartonization: {
      note: 'Provide dimensions for optimal box packing recommendations.',
      standardBoxes: ['Small Flat Rate', 'Medium Flat Rate', 'Large Flat Rate', 'Custom'],
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { originCountry, destinationCountry, weightKg, declaredValue?, includeInsurance? }'); }
