import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateGlobalLandedCostAsync } from '@/app/lib/cost-engine';
import type { GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const price = typeof body.price === 'number' ? body.price : typeof body.value === 'number' ? body.value : 0;
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase() : '';
  const hsCode = typeof body.hsCode === 'string' ? body.hsCode.trim() : undefined;
  const productName = typeof body.productName === 'string' ? body.productName.trim() : undefined;
  const productCategory = typeof body.productCategory === 'string' ? body.productCategory.trim() : undefined;
  const material = typeof body.material === 'string' ? body.material.trim() : undefined;
  const currency = typeof body.currency === 'string' ? body.currency.trim() : undefined;
  const routesRaw = Array.isArray(body.routes) ? body.routes as Record<string, unknown>[] : [];
  // Filter out empty destination rows (Playground UI keeps empty rows for UX)
  const routes = routesRaw.filter(r => typeof r.destination === 'string' && r.destination.trim() !== '');

  if (price <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'price must be > 0.');
  if (routes.length === 0 || routes.length > 5) return apiError(ApiErrorCode.BAD_REQUEST, 'routes: 1-5 required.');

  // Calculate landed cost for each route destination
  const results = await Promise.all(routes.map(async (r) => {
    const destination = typeof r.destination === 'string' ? r.destination.toUpperCase() : 'US';
    const shipping = typeof r.shipping === 'number' ? r.shipping : 0;
    const input: GlobalCostInput = {
      price,
      shippingPrice: shipping,
      origin: origin || undefined,
      destinationCountry: destination,
      hsCode,
      productName,
      productCategory,
      shippingType: 'international' as const,
    };

    try {
      const result = await calculateGlobalLandedCostAsync(input);
      const res = result as unknown as Record<string, unknown>;
      const hs = res.hsClassification as Record<string, unknown> | undefined;
      return {
        destination,
        shipping,
        totalLandedCost: (res.totalLandedCost as number) ?? 0,
        duty: (res.importDuty as number) ?? 0,
        tax: (res.vat as number) ?? (res.salesTax as number) ?? 0,
        fees: (res.mpf as number) ?? 0,
        hsCode: (hs?.hsCode as string) || (res.hsCode as string) || hsCode || '',
        ftaApplied: res.ftaApplied || null,
        source: 'live',
      };
    } catch {
      return {
        destination,
        shipping,
        totalLandedCost: 0,
        duty: 0,
        tax: 0,
        fees: 0,
        hsCode: hsCode || '',
        ftaApplied: null,
        source: 'error',
      };
    }
  }));

  const costs = results.map(r => r.totalLandedCost);
  const cheapestIndex = costs.indexOf(Math.min(...costs));
  const mostExpensive = Math.max(...costs);
  const savings = Math.round((mostExpensive - costs[cheapestIndex]) * 100) / 100;

  return apiSuccess({
    origin,
    routes: results,
    cheapest_route_index: cheapestIndex,
    savings_vs_most_expensive: savings,
  }, { sellerId: ctx.sellerId });
});
