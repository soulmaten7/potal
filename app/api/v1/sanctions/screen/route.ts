import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { fuzzyMatch, screenBatch } from '@/app/lib/compliance/fuzzy-screening';

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // Batch screening
  if (Array.isArray(body.entities)) {
    if (body.entities.length > 50) return apiError(ApiErrorCode.BAD_REQUEST, 'Max 50 entities per batch.');
    try {
      const results = await screenBatch(
        body.entities.map((e: Record<string, unknown>) => ({
          name: typeof e.name === 'string' ? e.name : '',
          type: typeof e.type === 'string' ? e.type : undefined,
          country: typeof e.country === 'string' ? e.country : undefined,
        }))
      );
      return apiSuccess({ results, total: results.length, flagged: results.filter(r => !r.cleared).length }, { sellerId: ctx.sellerId });
    } catch (e) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Batch screening failed.');
    }
  }

  // Single screening
  const name = typeof body.name === 'string' ? body.name : '';
  if (!name) return apiError(ApiErrorCode.BAD_REQUEST, 'name or entities[] required.');

  const threshold = typeof body.threshold === 'number' ? body.threshold : 0.85;

  try {
    const matches = await fuzzyMatch(name, threshold);
    return apiSuccess({
      entity: name,
      cleared: matches.length === 0,
      matches,
    }, { sellerId: ctx.sellerId });
  } catch (e) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, e instanceof Error ? e.message : 'Screening failed.');
  }
});
