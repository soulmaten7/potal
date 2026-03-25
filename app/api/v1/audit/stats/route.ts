/**
 * POTAL API v1 — GET /api/v1/audit/stats
 *
 * Data management audit statistics.
 * Query params: period (7d, 30d, 90d, 365d — default 30d)
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { getAuditStats } from '@/app/lib/data-management/audit-trail';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const periodParam = url.searchParams.get('period') || '30d';

  const periodMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
  const periodDays = periodMap[periodParam] || 30;

  try {
    const stats = await getAuditStats(periodDays);
    return apiSuccess({ period: periodParam, periodDays, ...stats }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Stats query failed.');
  }
});
