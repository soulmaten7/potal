import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { searchAuditLog, getAuditStats } from '@/app/lib/audit/audit-logger';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id') || ctx.sellerId;
  const endpoint = url.searchParams.get('endpoint') || undefined;
  const dateFrom = url.searchParams.get('from') || undefined;
  const dateTo = url.searchParams.get('to') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const stats = url.searchParams.get('stats') === 'true';

  try {
    if (stats) {
      const auditStats = await getAuditStats(userId);
      return apiSuccess(auditStats, { sellerId: ctx.sellerId });
    }

    const result = await searchAuditLog({ userId, endpoint, dateFrom, dateTo }, { page, limit });
    return apiSuccess(result, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Search failed.');
  }
});
