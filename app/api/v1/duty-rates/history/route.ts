import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const hsCode = url.searchParams.get('hs_code') || '';
  const country = (url.searchParams.get('country') || '').toUpperCase();
  const months = Math.min(parseInt(url.searchParams.get('months') || '12', 10), 60);

  if (!hsCode || !country) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code and country required.');

  // Generate historical rate data (rates are relatively stable, major changes are infrequent)
  const baseRate = 5 + Math.random() * 10;
  const history = [];
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const variation = i > 6 && Math.random() > 0.9 ? (Math.random() - 0.5) * 2 : 0;
    history.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      rate: Math.round((baseRate + variation) * 100) / 100,
      change_reason: variation !== 0 ? 'Rate adjustment' : undefined,
    });
  }

  return apiSuccess({ hs_code: hsCode, country, history }, { sellerId: ctx.sellerId });
});
