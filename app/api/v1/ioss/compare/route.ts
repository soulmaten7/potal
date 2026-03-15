import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { compareIOSSvsNonIOSS, getRegistrationGuidance } from '@/app/lib/tax/ioss-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const value = typeof body.value === 'number' ? body.value : 0;
  const destinationEuCountry = typeof body.destination === 'string' ? body.destination.toUpperCase() : '';

  if (value <= 0 || !destinationEuCountry) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'value and destination required.');
  }

  try {
    const comparison = compareIOSSvsNonIOSS({
      value,
      destinationEuCountry,
      shippingCost: typeof body.shipping_cost === 'number' ? body.shipping_cost : undefined,
    });
    const sellerCountry = typeof body.seller_country === 'string' ? body.seller_country : '';
    const guidance = sellerCountry ? getRegistrationGuidance(sellerCountry.toUpperCase()) : null;

    return apiSuccess({ comparison, registration_guidance: guidance }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'IOSS comparison failed.');
  }
});
