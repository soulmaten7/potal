import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { evaluateRoOEnriched } from '@/app/lib/trade/roo-engine';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const hs6 = typeof body.hs_code === 'string' ? body.hs_code.slice(0, 6) : '';
  const origin = typeof body.origin === 'string' ? body.origin : '';
  const destination = typeof body.destination === 'string' ? body.destination : '';

  if (!hs6 || !origin || !destination) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'hs_code, origin, destination required.');
  }

  const baseInput = {
    hs6, origin, destination,
    productValue: typeof body.product_value === 'number' ? body.product_value : undefined,
    localContentValue: typeof body.local_content_value === 'number' ? body.local_content_value : undefined,
    material: typeof body.material === 'string' ? body.material : undefined,
    materialComposition: body.material_composition as Record<string, number> | undefined,
    productForm: typeof body.product_form === 'string' ? body.product_form : undefined,
    intendedUse: typeof body.intended_use === 'string' ? body.intended_use : undefined,
    originatingContentPct: typeof body.originating_content_pct === 'number' ? body.originating_content_pct : undefined,
    materials: Array.isArray(body.materials) ? body.materials : undefined,
  };

  try {
    const ftaId = typeof body.fta_id === 'string' ? body.fta_id : undefined;

    // CW37-S2: Auto-detect mode — when fta_id not specified, try all applicable FTAs
    if (!ftaId && body.auto_detect !== false) {
      const { evaluateRoO } = await import('@/app/lib/trade/roo-engine');
      const FTA_IDS = ['USMCA', 'KORUS', 'CPTPP', 'RCEP', 'EU-KR', 'EFTA'];
      const applicableFTAs: Array<{ ftaId: string; verdict: string; savings: number; requiredRvc?: number; rvcPercentage?: number; method: string }> = [];
      for (const fid of FTA_IDS) {
        const r = evaluateRoO({ ...baseInput, ftaId: fid });
        if (r.details.includes('No active FTA') || r.details.includes('not applicable')) continue;
        applicableFTAs.push({ ftaId: fid, verdict: r.verdict, savings: r.savingsIfEligible, requiredRvc: r.requiredRvc, rvcPercentage: r.rvcPercentage, method: r.method });
      }
      // Also run enriched for the best match
      const result = await evaluateRoOEnriched({ ...baseInput, ftaId: undefined });
      return apiSuccess({ ...result, applicableFTAs, recommended: applicableFTAs.find(f => f.verdict === 'eligible') || applicableFTAs[0] || null }, { sellerId: ctx.sellerId });
    }

    const result = await evaluateRoOEnriched({ ...baseInput, ftaId });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'RoO evaluation failed.');
  }
});
