import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluateRoO } from '@/app/lib/trade/roo-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hs6 = typeof body.hs_code === 'string' ? body.hs_code.slice(0, 6) : '';
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';
  const exporterName = typeof body.exporter_name === 'string' ? body.exporter_name : '';

  if (!hs6 || !origin || !destination || !exporterName) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, origin, destination, exporter_name required.');
  }

  try {
    const roo = evaluateRoO({
      hs6, origin, destination,
      productValue: typeof body.product_value === 'number' ? body.product_value : undefined,
      localContentValue: typeof body.local_content_value === 'number' ? body.local_content_value : undefined,
    });

    const certification = {
      eligible: roo.eligible,
      origin_criteria_met: roo.criteriaMetList,
      origin_criteria_failed: roo.criteriaFailed,
      certification_text: roo.eligible
        ? `The undersigned hereby certifies that the goods described herein (HS ${hs6}) originate in ${origin} and qualify for preferential treatment under applicable trade agreement. Method: ${roo.method}.`
        : null,
      exporter: exporterName,
      date: new Date().toISOString(),
      disclaimer: 'This is a self-certification aid. Verify with official requirements before submission.',
    };

    return apiSuccess(certification, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Self-certification failed.');
  }
});
