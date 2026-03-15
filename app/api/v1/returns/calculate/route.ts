import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateReturnCost } from '@/app/lib/trade/returns-calculator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const originalValue = typeof body.original_value === 'number' ? body.original_value : 0;
  const dutiesPaid = typeof body.duties_paid === 'number' ? body.duties_paid : 0;
  const country = typeof body.country === 'string' ? body.country : '';
  const returnDestination = typeof body.return_destination === 'string' ? body.return_destination : '';

  if (originalValue <= 0 || !country) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'original_value and country required.');
  }

  try {
    const result = calculateReturnCost({
      originalImport: { country, value: originalValue, dutyPaid: dutiesPaid },
      returnDestination: returnDestination || country,
      shippingEstimate: typeof body.shipping_estimate === 'number' ? body.shipping_estimate : undefined,
    });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Return cost calculation failed.');
  }
});
