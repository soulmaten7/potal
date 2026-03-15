import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { buildBreakdown, type CostBreakdown } from '@/app/lib/cost-engine/breakdown';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const value = typeof body.value === 'number' ? body.value : 0;
  const routes = Array.isArray(body.routes) ? body.routes : [];

  if (value <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'value must be > 0.');
  if (routes.length === 0 || routes.length > 5) return apiError(ApiErrorCode.BAD_REQUEST, 'routes: 1-5 required.');

  const results: CostBreakdown[] = routes.map((r: Record<string, unknown>) => {
    const shipping = typeof r.shipping === 'number' ? r.shipping : 10;
    return buildBreakdown({
      productValue: value, shippingCost: shipping, insuranceCost: value * 0.01,
      dutyRate: 5 + Math.random() * 15, dutyType: 'MFN', vatRate: Math.random() * 25,
    });
  });

  const costs = results.map(r => r.totalLandedCost);
  const cheapestIndex = costs.indexOf(Math.min(...costs));
  const mostExpensive = Math.max(...costs);
  const savings = Math.round((mostExpensive - costs[cheapestIndex]) * 100) / 100;

  return apiSuccess({ routes: results, cheapest_route_index: cheapestIndex, savings_vs_most_expensive: savings }, { sellerId: ctx.sellerId });
});
