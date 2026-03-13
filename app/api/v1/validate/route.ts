/**
 * POTAL API v1 — /api/v1/validate
 *
 * HS Code validation endpoint.
 *
 * POST /api/v1/validate
 * Body: {
 *   hsCode: string,              // required — HS code to validate
 *   hsCodes?: string[]           // batch — array of HS codes to validate
 * }
 *
 * Returns: validation result with format check, existence check, suggestions
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { validateHsCode } from '@/app/lib/cost-engine/hs-code/hs-validator';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

const MAX_BATCH_VALIDATE = 100;

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  // Batch validation
  if (Array.isArray(body.hsCodes)) {
    const codes = body.hsCodes as string[];
    if (codes.length === 0) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'hsCodes array must not be empty.');
    }
    if (codes.length > MAX_BATCH_VALIDATE) {
      return apiError(ApiErrorCode.BAD_REQUEST, `Maximum ${MAX_BATCH_VALIDATE} codes per batch.`);
    }

    const results = codes.map((code, i) => {
      if (typeof code !== 'string') {
        return { index: i, hsCode: String(code), valid: false, error: 'Must be a string.' };
      }
      const result = validateHsCode(code);
      return { index: i, hsCode: code, ...result };
    });

    const validCount = results.filter(r => r.valid).length;

    return apiSuccess(
      {
        results,
        summary: {
          total: codes.length,
          valid: validCount,
          invalid: codes.length - validCount,
        },
      },
      {
        sellerId: context.sellerId,
        plan: context.planId,
      }
    );
  }

  // Single validation
  if (!body.hsCode || typeof body.hsCode !== 'string') {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "hsCode" (string) or "hsCodes" (string[]) is required.');
  }

  const result = validateHsCode(body.hsCode);

  return apiSuccess(result, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { hsCode: "610910" } or { hsCodes: ["610910", "854231"] }'
  );
}
