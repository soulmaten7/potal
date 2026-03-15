import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { predictOrigin } from '@/app/lib/trade/origin-predictor';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const productName = typeof body.product_name === 'string' ? body.product_name : '';
  if (!productName) return apiError(ApiErrorCode.BAD_REQUEST, 'product_name required.');

  try {
    const result = predictOrigin(
      productName,
      typeof body.brand === 'string' ? body.brand : undefined,
      typeof body.category === 'string' ? body.category : undefined,
    );
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Origin prediction failed.');
  }
});
