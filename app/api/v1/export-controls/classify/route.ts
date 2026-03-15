import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { classifyECCN, checkLicenseRequirement } from '@/app/lib/compliance/export-controls';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const productName = typeof body.product_name === 'string' ? body.product_name : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';

  if (!hsCode && !productName) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code or product_name required.');

  try {
    const eccn = classifyECCN({ hsCode, productName, technicalSpecs: typeof body.technical_specs === 'string' ? body.technical_specs : undefined });
    const license = destination && !eccn.ear99
      ? checkLicenseRequirement(eccn.eccn, destination, typeof body.end_use === 'string' ? body.end_use : undefined)
      : null;
    return apiSuccess({ eccn_classification: eccn, license_determination: license }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'ECCN classification failed.');
  }
});
