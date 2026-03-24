/**
 * POTAL API v1 — /api/v1/validate/hs-code
 *
 * Simplified HS code validation endpoint (single or bulk).
 * Supports both hsCode/hs_code field names for backward compatibility.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { validateHsCode } from '@/app/lib/cost-engine/hs-code/hs-validator';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // Single validation — support both field names
  const singleCode = typeof body.hsCode === 'string' ? body.hsCode
    : typeof body.hs_code === 'string' ? body.hs_code as string
      : null;

  if (singleCode) {
    const result = validateHsCode(singleCode);
    return apiSuccess(result, { sellerId: ctx.sellerId });
  }

  // Bulk validation — support both field names
  const bulkCodes = Array.isArray(body.codes) ? body.codes
    : Array.isArray(body.hsCodes) ? body.hsCodes
      : null;

  if (bulkCodes) {
    if (bulkCodes.length > 100) return apiError(ApiErrorCode.BAD_REQUEST, 'Max 100 codes per batch.');
    const results = bulkCodes.map((c: unknown) => {
      const codeStr = typeof c === 'string' ? c
        : typeof c === 'object' && c !== null
          ? (typeof (c as Record<string, unknown>).hs_code === 'string' ? (c as Record<string, unknown>).hs_code as string
            : typeof (c as Record<string, unknown>).hsCode === 'string' ? (c as Record<string, unknown>).hsCode as string : '')
          : '';
      return { hs_code: codeStr, ...validateHsCode(codeStr) };
    });
    return apiSuccess({
      results,
      total: results.length,
      valid_count: results.filter((r: { valid: boolean }) => r.valid).length,
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'hsCode/hs_code (string) or codes/hsCodes (array) required.');
});
