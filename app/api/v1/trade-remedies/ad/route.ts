import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculateRemedyDuty } from '@/app/lib/trade/remedy-calculator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';
  const value = typeof body.value === 'number' ? body.value : 0;

  if (!hsCode || !origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, origin, destination required.');
  }

  try {
    const result = await calculateRemedyDuty({ hsCode, origin, destination, value });
    return apiSuccess({
      ad_duties: result.adDuties,
      total_ad_amount: result.adDuties.reduce((s, d) => s + d.amount, 0),
      alerts: result.alerts.filter(a => a.type === 'sunset_review' || a.type === 'rate_change'),
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'AD lookup failed.');
  }
});
