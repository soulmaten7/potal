import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { buildBreakdown } from '@/app/lib/cost-engine/breakdown';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const value = typeof body.value === 'number' ? body.value : 0;
  const shipping = typeof body.shipping === 'number' ? body.shipping : 0;
  const insurance = typeof body.insurance === 'number' ? body.insurance : 0;
  const sellingPrice = typeof body.selling_price === 'number' ? body.selling_price : undefined;

  if (value <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'value must be > 0.');

  const breakdown = buildBreakdown({
    productValue: value,
    shippingCost: shipping,
    insuranceCost: insurance,
    dutyRate: 5.0,
    dutyType: 'MFN',
    vatRate: 0,
    sellingPrice,
  });

  return apiSuccess(breakdown, { sellerId: ctx.sellerId });
});
