import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { validateHsCode } from '@/app/lib/classification/hs-validator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // Single validation
  if (typeof body.hs_code === 'string') {
    const country = typeof body.country === 'string' ? body.country : undefined;
    const result = await validateHsCode(body.hs_code, country);
    return apiSuccess(result, { sellerId: ctx.sellerId });
  }

  // Bulk validation
  if (Array.isArray(body.codes)) {
    if (body.codes.length > 100) return apiError(ApiErrorCode.BAD_REQUEST, 'Max 100 codes per batch.');
    const results = await Promise.all(
      body.codes.map(async (c: Record<string, unknown>) => {
        const code = typeof c.hs_code === 'string' ? c.hs_code : '';
        const country = typeof c.country === 'string' ? c.country : undefined;
        return { hs_code: code, ...await validateHsCode(code, country) };
      })
    );
    return apiSuccess({ results, total: results.length, valid_count: results.filter(r => r.valid).length }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code (string) or codes (array) required.');
});
