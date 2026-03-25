/**
 * POTAL API v1 — POST /api/v1/payment/prepay
 * DDP duty pre-payment quote.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { calculatePrepayment } from '@/app/lib/payment/duty-prepayment';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const declaredValue = typeof body.declaredValue === 'number' ? body.declaredValue : 0;
  const dutyRate = typeof body.dutyRate === 'number' ? body.dutyRate : 0;
  const taxRate = typeof body.taxRate === 'number' ? body.taxRate : 0;
  const customsFees = typeof body.customsFees === 'number' ? body.customsFees : 0;
  const currency = typeof body.currency === 'string' ? body.currency.toUpperCase() : 'USD';

  if (declaredValue <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'declaredValue must be positive.');

  try {
    const prepayment = calculatePrepayment({ declaredValue, dutyRate, taxRate, customsFees, currency });
    return apiSuccess({
      prepayment,
      note: `DDP pre-payment quote valid for 24 hours. Includes ${prepayment.bufferPercentage}% exchange rate buffer.`,
    }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.BAD_REQUEST, err instanceof Error ? err.message : 'Calculation failed.');
  }
});
