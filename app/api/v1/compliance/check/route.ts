import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { checkProductRestrictions } from '@/app/lib/compliance/product-restrictions';
import { classifyECCN, checkLicenseRequirement } from '@/app/lib/compliance/export-controls';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code : '';
  const productName = typeof body.product_name === 'string' ? body.product_name : '';
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';

  if (!destination) return apiError(ApiErrorCode.BAD_REQUEST, 'destination required.');
  if (!hsCode && !productName) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code or product_name required.');

  const restrictions = await checkProductRestrictions({ hsCode, destination, origin, description: productName });
  const eccn = hsCode ? classifyECCN({ hsCode, productName }) : null;
  const license = eccn && !eccn.ear99 ? checkLicenseRequirement(eccn.eccn, destination, typeof body.end_use === 'string' ? body.end_use : undefined) : null;

  const cleared = restrictions.level === 'none' && !restrictions.sanctionsHit;

  return apiSuccess({
    cleared,
    restriction_level: restrictions.level,
    details: restrictions,
    export_controls: eccn,
    license_determination: license,
    recommendation: cleared
      ? 'No restrictions detected. Proceed with shipment.'
      : `Restrictions detected (${restrictions.level}). Review requirements before shipping.`,
  }, { sellerId: ctx.sellerId });
});
