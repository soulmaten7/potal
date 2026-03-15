import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { buildBreakdown } from '@/app/lib/cost-engine/breakdown';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const baseParams = body.base_params as Record<string, unknown> | undefined;
  const scenarios = Array.isArray(body.scenarios) ? body.scenarios : [];

  if (!baseParams) return apiError(ApiErrorCode.BAD_REQUEST, 'base_params required.');
  if (scenarios.length === 0 || scenarios.length > 10) return apiError(ApiErrorCode.BAD_REQUEST, 'scenarios: 1-10 required.');

  const value = typeof baseParams.value === 'number' ? baseParams.value : 100;
  const shipping = typeof baseParams.shipping === 'number' ? baseParams.shipping : 10;
  const dutyRate = typeof baseParams.duty_rate === 'number' ? baseParams.duty_rate : 5;
  const vatRate = typeof baseParams.vat_rate === 'number' ? baseParams.vat_rate : 0;

  const base = buildBreakdown({ productValue: value, shippingCost: shipping, insuranceCost: value * 0.01, dutyRate, dutyType: 'MFN', vatRate });

  const scenarioResults = scenarios.map((s: Record<string, unknown>) => {
    const field = typeof s.change_field === 'string' ? s.change_field : '';
    const changeValue = typeof s.change_value === 'number' ? s.change_value : 0;

    let sValue = value, sShipping = shipping, sDuty = dutyRate, sVat = vatRate;
    if (field === 'value') sValue = changeValue;
    if (field === 'shipping') sShipping = changeValue;
    if (field === 'duty_rate') sDuty = changeValue;
    if (field === 'vat_rate') sVat = changeValue;

    const result = buildBreakdown({ productValue: sValue, shippingCost: sShipping, insuranceCost: sValue * 0.01, dutyRate: sDuty, dutyType: 'MFN', vatRate: sVat });
    return {
      change: { field, value: changeValue },
      result,
      diff: Math.round((result.totalLandedCost - base.totalLandedCost) * 100) / 100,
    };
  });

  return apiSuccess({ base, scenarios: scenarioResults }, { sellerId: ctx.sellerId });
});
