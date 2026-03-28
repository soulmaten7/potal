/**
 * F066: Shipping Insurance Calculator
 *
 * POST /api/v1/shipping/insurance
 * CIF-based insurance premium calculation with multiple coverage tiers.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateInsurancePremium } from '@/app/lib/shipping/carrier-rates';

// Country risk multipliers for high-risk destinations
const HIGH_RISK_COUNTRIES: Record<string, number> = {
  NG: 1.5, PK: 1.4, BD: 1.3, VE: 1.5, ZW: 1.4,
  IQ: 1.6, AF: 1.7, LY: 1.5, SO: 1.6, YE: 1.6,
};

// Product category risk multipliers
const CATEGORY_RISK: Record<string, number> = {
  electronics: 1.4,
  jewelry: 1.6,
  fragile: 1.3,
  perishable: 1.5,
  art: 1.5,
  luxury: 1.4,
  general: 1.0,
};

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue :
    typeof body.declared_value === 'number' ? body.declared_value : 0;
  const shippingCost = typeof body.shippingCost === 'number' ? body.shippingCost :
    typeof body.shipping_cost === 'number' ? body.shipping_cost : 0;
  const dutyCost = typeof body.dutyCost === 'number' ? body.dutyCost :
    typeof body.duty_cost === 'number' ? body.duty_cost : 0;
  const coverageType = typeof body.coverageType === 'string' ? body.coverageType as 'basic' | 'full' | 'premium' : 'basic';
  const destination = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase() : '';
  const category = typeof body.productCategory === 'string' ? body.productCategory.toLowerCase() : 'general';

  if (declaredValue <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"declaredValue" must be > 0.');
  }
  if (!['basic', 'full', 'premium'].includes(coverageType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"coverageType" must be: basic, full, or premium.');
  }

  // Calculate base insurance
  const base = calculateInsurancePremium(declaredValue, shippingCost, coverageType);

  // Apply risk multipliers
  const countryRisk = HIGH_RISK_COUNTRIES[destination] || 1.0;
  const categoryRisk = CATEGORY_RISK[category] || 1.0;
  const riskMultiplier = Math.round(countryRisk * categoryRisk * 100) / 100;

  const adjustedPremium = Math.round(base.premium * riskMultiplier * 100) / 100;

  // CIF value calculation (Cost + Insurance + Freight)
  const cifValue = Math.round((declaredValue + adjustedPremium + shippingCost) * 100) / 100;

  // All tiers comparison
  const tiers = (['basic', 'full', 'premium'] as const).map(tier => {
    const calc = calculateInsurancePremium(declaredValue, shippingCost, tier);
    const adjusted = Math.round(calc.premium * riskMultiplier * 100) / 100;
    return {
      tier,
      premium: adjusted,
      coverageAmount: calc.coverageAmount,
      deductible: calc.deductible,
      features: tier === 'basic'
        ? ['Loss/theft coverage', 'Standard claims process (5-10 business days)']
        : tier === 'full'
          ? ['Loss/theft coverage', 'Damage coverage', 'Expedited claims (3-5 business days)', 'Partial loss covered']
          : ['All-risk coverage', 'Zero deductible', 'Priority claims (1-3 business days)', 'Consequential loss', 'Return shipping covered'],
    };
  });

  return apiSuccess({
    insurance: {
      coverageType,
      premium: adjustedPremium,
      coverageAmount: base.coverageAmount,
      deductible: base.deductible,
      riskMultiplier,
    },
    cifBreakdown: {
      cost: declaredValue,
      insurance: adjustedPremium,
      freight: shippingCost,
      duty: dutyCost,
      cifValue,
      totalWithDuty: Math.round((cifValue + dutyCost) * 100) / 100,
    },
    riskFactors: {
      destinationCountry: destination || null,
      countryRiskMultiplier: countryRisk,
      productCategory: category,
      categoryRiskMultiplier: categoryRisk,
    },
    allTiers: tiers,
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { declaredValue, shippingCost?, dutyCost?, coverageType?: "basic"|"full"|"premium", destinationCountry?, productCategory? }');
}
