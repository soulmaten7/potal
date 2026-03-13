/**
 * POTAL API v1 — /api/v1/ioss
 *
 * IOSS/OSS VAT check endpoint.
 *
 * POST /api/v1/ioss
 * Body: {
 *   declaredValueEur: number,      // required — intrinsic value in EUR
 *   destinationCountry: string,    // required — EU member state ISO code
 *   originCountry: string,         // required — seller's country ISO code
 *   iossNumber?: string,           // seller's IOSS number (if registered)
 *   annualCrossBorderSalesEur?: number  // annual cross-border EU sales (for OSS threshold)
 * }
 *
 * Returns: { ioss?, oss?, recommendation }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { checkIossOss } from '@/app/lib/cost-engine/ioss-oss';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  if (typeof body.declaredValueEur !== 'number' || body.declaredValueEur < 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "declaredValueEur" must be a non-negative number.');
  }

  if (typeof body.destinationCountry !== 'string' || body.destinationCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "destinationCountry" must be a 2-letter ISO code.');
  }

  if (typeof body.originCountry !== 'string' || body.originCountry.length !== 2) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Field "originCountry" must be a 2-letter ISO code.');
  }

  const result = checkIossOss({
    declaredValueEur: body.declaredValueEur,
    destinationCountry: body.destinationCountry,
    originCountry: body.originCountry,
    iossNumber: typeof body.iossNumber === 'string' ? body.iossNumber : undefined,
    annualCrossBorderSalesEur: typeof body.annualCrossBorderSalesEur === 'number'
      ? body.annualCrossBorderSalesEur : undefined,
  });

  return apiSuccess(result, {
    sellerId: context.sellerId,
    plan: context.planId,
  });
});

export async function GET() {
  return apiError(
    ApiErrorCode.BAD_REQUEST,
    'Use POST method. Body: { declaredValueEur, destinationCountry, originCountry, iossNumber?, annualCrossBorderSalesEur? }'
  );
}
