import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { validateHsCode } from '@/app/lib/cost-engine/hs-code/hs-validator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // Single validation
  if (typeof body.hs_code === 'string') {
    const result = validateHsCode(body.hs_code);
    return apiSuccess(result, { sellerId: ctx.sellerId });
  }

  // Bulk validation
  if (Array.isArray(body.codes)) {
    if (body.codes.length > 100) return apiError(ApiErrorCode.BAD_REQUEST, 'Max 100 codes per batch.');
    const results = body.codes.map((c: Record<string, unknown>) => {
      const code = typeof c.hs_code === 'string' ? c.hs_code : '';
      return { hs_code: code, ...validateHsCode(code) };
    });
    return apiSuccess({ results, total: results.length, valid_count: results.filter((r: { valid: boolean }) => r.valid).length }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code (string) or codes (array) required.');
});
