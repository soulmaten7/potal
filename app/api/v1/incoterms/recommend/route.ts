import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { recommendIncoterm, getCostAllocation, validateIncoterm } from '@/app/lib/trade/incoterms';
import type { Incoterm } from '@/app/lib/trade/incoterms';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // If specific incoterm provided, return its details
  if (typeof body.incoterm === 'string') {
    const term = body.incoterm.toUpperCase() as Incoterm;
    const allocation = getCostAllocation(term);
    const transport = typeof body.transport_mode === 'string' ? body.transport_mode : 'any';
    const validation = validateIncoterm(term, transport);
    return apiSuccess({ incoterm: term, allocation, validation }, { sellerId: ctx.sellerId });
  }

  // Recommend best incoterm
  const experienceLevel = typeof body.experience_level === 'string' ? body.experience_level as 'beginner' | 'intermediate' | 'expert' : 'intermediate';
  const transportMode = typeof body.transport_mode === 'string' ? body.transport_mode : 'sea';
  const productType = typeof body.product_type === 'string' ? body.product_type : undefined;

  try {
    const result = recommendIncoterm({ experienceLevel, transportMode, productType });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Recommendation failed.');
  }
});
