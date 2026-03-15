import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluateRoO } from '@/app/lib/trade/roo-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hs6 = typeof body.hs_code === 'string' ? body.hs_code.slice(0, 6) : '';
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';

  if (!hs6 || !origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, origin, destination required.');
  }

  try {
    const result = evaluateRoO({
      hs6, origin, destination,
      ftaId: typeof body.fta_id === 'string' ? body.fta_id : undefined,
      productValue: typeof body.product_value === 'number' ? body.product_value : undefined,
      localContentValue: typeof body.local_content_value === 'number' ? body.local_content_value : undefined,
    });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'RoO evaluation failed.');
  }
});
