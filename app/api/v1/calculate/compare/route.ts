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
      const hs10 = res.hs10Resolution as Record<string, unknown> | undefined;
      const lc = res.localCurrency as Record<string, unknown> | undefined;
      const breakdown = res.breakdown as Array<{ label: string; amount: number; note?: string }> | undefined;

      const importDuty = (res.importDuty as number) ?? 0;
      const declaredValue = price + shipping;

      return {
        destination,
        shipping,
        // Core costs
        totalLandedCost: (res.totalLandedCost as number) ?? 0,
        duty: importDuty,
        tax: (res.vat as number) ?? (res.salesTax as number) ?? 0,
        fees: (res.mpf as number) ?? 0,
        insurance: (res.insurance as number) ?? 0,
        brokerageFee: (res.brokerageFee as number) ?? 0,
        // Rates
        dutyRate: declaredValue > 0 ? Math.round((importDuty / declaredValue) * 10000) / 10000 : 0,
        vatRate: (res.vatRate as number) ?? 0,
        vatLabel: (res.vatLabel as string) || 'VAT',
        dutyRateSource: (res.dutyRateSource as string) || null,
        entryType: (res.entryType as string) || null,
        // De minimis
        deMinimisApplied: (res.deMinimisApplied as boolean) ?? false,
        dutyThresholdUsd: (res.dutyThresholdUsd as number) ?? 0,
        // HS Code
        hsCode: (hs?.hsCode as string) || (res.hsCode as string) || hsCode || '',
        hsCodePrecision: (hs?.hsCodePrecision as string) || (res.hsCodePrecision as string) || null,
        hs10Code: (hs10?.hs10Code as string) || (hs10?.hsCode as string) || null,
        // Breakdown
        breakdown: breakdown || [],
        // Local currency
        localCurrency: lc || null,
        // FTA
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
        insurance: 0,
        brokerageFee: 0,
        dutyRate: 0,
        vatRate: 0,
        vatLabel: 'VAT',
        dutyRateSource: null,
        entryType: null,
        deMinimisApplied: false,
        dutyThresholdUsd: 0,
        hsCode: hsCode || '',
        hsCodePrecision: null,
        hs10Code: null,
        breakdown: [],
        localCurrency: null,
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
