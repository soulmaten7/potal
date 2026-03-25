/**
 * GET /api/v1/shipping/dangerous-goods?hs_code=850760&weight=5
 * Check DG status + carrier acceptance for an HS code.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { checkDangerousGoods, CARRIER_RULES } from '@/app/lib/shipping/dangerous-goods';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hsCode = url.searchParams.get('hs_code') || url.searchParams.get('hsCode') || '';
  const weight = parseFloat(url.searchParams.get('weight') || '0') || undefined;

  if (!hsCode) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code required.');

  const result = checkDangerousGoods(hsCode, weight);

  return apiSuccess({
    ...result,
    carrierCount: CARRIER_RULES.length,
    note: result.isDangerous
      ? `UN ${result.unMapping?.unNumber}: ${result.unMapping?.properShippingName}. ${result.acceptingCarriers.length} carrier(s) accept this item.`
      : 'No dangerous goods classification found for this HS code.',
  }, { sellerId: ctx.sellerId });
});
