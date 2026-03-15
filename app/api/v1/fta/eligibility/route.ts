import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluateRoO } from '@/app/lib/trade/roo-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hsCode = typeof body.hs_code === 'string' ? body.hs_code.replace(/\./g, '') : '';
  const origin = typeof body.origin === 'string' ? body.origin.toUpperCase() : '';
  const destination = typeof body.destination === 'string' ? body.destination.toUpperCase() : '';

  if (!hsCode || !origin || !destination) return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, origin, destination required.');

  const productValue = typeof body.product_value === 'number' ? body.product_value : undefined;
  const localContent = typeof body.local_content_percentage === 'number' ? body.local_content_percentage : undefined;

  const roo = evaluateRoO({
    hs6: hsCode.slice(0, 6), origin, destination,
    productValue,
    localContentValue: productValue && localContent ? productValue * localContent / 100 : undefined,
  });

  return apiSuccess({
    hs_code: hsCode,
    origin, destination,
    eligible: roo.eligible,
    best_criteria: roo.method,
    criteria_met: roo.criteriaMetList,
    criteria_failed: roo.criteriaFailed,
    rvc_percentage: roo.rvcPercentage,
    required_rvc: roo.requiredRvc,
    savings_if_eligible: roo.savingsIfEligible,
    details: roo.details,
  }, { sellerId: ctx.sellerId });
});
