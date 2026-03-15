import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluatePriceBreaks } from '@/app/lib/classification/price-break-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const price = typeof body.price === 'number' ? body.price : 0;
  const country = typeof body.country === 'string' ? body.country.toUpperCase() : 'US';

  if (!hsCode || price <= 0) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code and price required.');

  const result = await evaluatePriceBreaks(hsCode, price, country);
  return apiSuccess(result || { message: 'No price break rules found for this HS code.' }, { sellerId: ctx.sellerId });
});
