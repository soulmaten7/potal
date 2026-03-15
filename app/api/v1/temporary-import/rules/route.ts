import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getTemporaryAdmissionRules, calculateBond } from '@/app/lib/trade/temporary-import';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || '';

  if (!country) return apiError(ApiErrorCode.BAD_REQUEST, 'country parameter required.');

  try {
    const rules = getTemporaryAdmissionRules(country.toUpperCase());
    const value = parseFloat(searchParams.get('value') || '0');
    const bond = value > 0 ? calculateBond(value, country.toUpperCase()) : null;
    return apiSuccess({ rules, bond }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Lookup failed.');
  }
});
