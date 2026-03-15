import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { checkLicenseRequirement } from '@/app/lib/trade/import-licensing';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';

  if (!hsCode || !destination) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code and destination required.');

  try {
    const result = checkLicenseRequirement(hsCode, destination.toUpperCase());
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'License check failed.');
  }
});
