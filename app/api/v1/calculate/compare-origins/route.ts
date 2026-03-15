/**
 * POTAL API v1 — /api/v1/calculate/compare-origins
 *
 * Multi-origin TLC comparison.
 * Calculates Total Landed Cost for the same product from multiple origins,
 * identifies the cheapest, and shows FTA savings.
 *
 * POST /api/v1/calculate/compare-origins
 * Body: {
 *   product_name?: string,
 *   hs_code?: string,
 *   product_value: number,
 *   origins: string[],           // ["CN","VN","BD","IN","TR"]
 *   destination: string,          // "US"
 *   weight_kg?: number,
 *   shipping_price?: number,
 *   annual_volume?: number,
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

interface OriginResult {
  origin: string;
  total_landed_cost: number;
  import_duty: number;
  vat_gst: number;
  duty_rate_percent: number;
  duty_rate_source: string;
  fta_applied: string | null;
  fta_savings_percent: number;
  total_savings_vs_highest: number;
  breakdown_summary: string;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const productValue = Number(body.product_value);
  if (!productValue || productValue <= 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "product_value" is required and must be positive.');
  }

  const origins = body.origins as string[] | undefined;
  if (!origins || !Array.isArray(origins) || origins.length < 2 || origins.length > 10) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "origins" must be an array of 2-10 country codes.');
  }

  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase() : 'US';

  // Calculate TLC for each origin
  const results: OriginResult[] = [];

  for (const origin of origins) {
    const costInput: GlobalCostInput = {
      price: productValue,
      shippingPrice: typeof body.shipping_price === 'number' ? body.shipping_price : undefined,
      origin: origin.toUpperCase(),
      destinationCountry: destination,
      hsCode: typeof body.hs_code === 'string' ? body.hs_code : undefined,
      productName: typeof body.product_name === 'string' ? body.product_name : undefined,
      weight_kg: typeof body.weight_kg === 'number' ? body.weight_kg : undefined,
      annualVolume: typeof body.annual_volume === 'number' ? body.annual_volume : undefined,
    };

    try {
      const result = await calculateGlobalLandedCostAsync(costInput);

      const dutyRatePercent = result.tariffOptimization?.optimalRate
        ? result.tariffOptimization.optimalRate * 100
        : (result.importDuty / Math.max(productValue, 0.01)) * 100;

      results.push({
        origin: origin.toUpperCase(),
        total_landed_cost: result.totalLandedCost,
        import_duty: result.importDuty,
        vat_gst: result.vat,
        duty_rate_percent: Math.round(dutyRatePercent * 100) / 100,
        duty_rate_source: result.dutyRateSource || 'hardcoded',
        fta_applied: result.ftaApplied?.hasFta ? (result.ftaApplied.ftaName || result.ftaApplied.ftaCode || 'FTA') : null,
        fta_savings_percent: result.tariffOptimization?.savingsPercent ?? 0,
        total_savings_vs_highest: 0, // Calculated after all origins
        breakdown_summary: `Duty $${result.importDuty} + ${result.vatLabel} $${result.vat} + Fees $${result.mpf}`,
      });
    } catch {
      results.push({
        origin: origin.toUpperCase(),
        total_landed_cost: -1,
        import_duty: 0,
        vat_gst: 0,
        duty_rate_percent: 0,
        duty_rate_source: 'error',
        fta_applied: null,
        fta_savings_percent: 0,
        total_savings_vs_highest: 0,
        breakdown_summary: 'Calculation failed for this origin',
      });
    }
  }

  // Calculate savings vs highest
  const validResults = results.filter(r => r.total_landed_cost > 0);
  const highest = Math.max(...validResults.map(r => r.total_landed_cost));
  for (const r of results) {
    if (r.total_landed_cost > 0) {
      r.total_savings_vs_highest = Math.round((highest - r.total_landed_cost) * 100) / 100;
    }
  }

  // Sort by TLC ascending
  const sorted = [...validResults].sort((a, b) => a.total_landed_cost - b.total_landed_cost);
  const cheapest = sorted[0] || null;

  return apiSuccess({
    destination,
    product_value: productValue,
    hs_code: body.hs_code || null,
    origins: results,
    cheapest_origin: cheapest ? {
      origin: cheapest.origin,
      total_landed_cost: cheapest.total_landed_cost,
      savings_vs_most_expensive: cheapest.total_savings_vs_highest,
      fta_applied: cheapest.fta_applied,
    } : null,
    comparison_count: results.length,
  }, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});
