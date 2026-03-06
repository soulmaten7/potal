/**
 * POTAL API v1 — /api/v1/sellers/analytics
 *
 * Get analytics breakdowns for the authenticated seller:
 * - Country distribution
 * - AI platform/endpoint distribution
 * - Recent API logs
 *
 * GET /api/v1/sellers/analytics?type=countries     — Country traffic
 * GET /api/v1/sellers/analytics?type=platforms      — Endpoint/platform breakdown
 * GET /api/v1/sellers/analytics?type=logs&limit=100 — Recent API logs
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const supabase = getServiceClient();
  const type = req.nextUrl.searchParams.get('type') || 'countries';

  // Current month range
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;

  if (type === 'countries') {
    // Country traffic analysis
    const { data: logs, error } = await (supabase
      .from('usage_logs') as any)
      .select('destination_country, status_code, response_time_ms')
      .eq('seller_id', context.sellerId)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch analytics.');
    }

    const byCountry: Record<string, { count: number; successCount: number; avgResponseMs: number; totalMs: number }> = {};
    for (const log of (logs || []) as Record<string, unknown>[]) {
      const cc = (log.destination_country as string) || 'unknown';
      if (!byCountry[cc]) {
        byCountry[cc] = { count: 0, successCount: 0, avgResponseMs: 0, totalMs: 0 };
      }
      byCountry[cc].count++;
      byCountry[cc].totalMs += (log.response_time_ms as number) || 0;
      if ((log.status_code as number) < 400) byCountry[cc].successCount++;
    }
    // Calculate averages and sort
    const countries = Object.entries(byCountry)
      .map(([code, data]) => ({
        country: code,
        requests: data.count,
        successRate: data.count > 0 ? Math.round((data.successCount / data.count) * 100) : 0,
        avgResponseMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
      }))
      .sort((a, b) => b.requests - a.requests);

    return apiSuccess({ countries, period: `${year}-${String(month).padStart(2, '0')}`, total: logs?.length || 0 });
  }

  if (type === 'platforms') {
    // Endpoint/platform breakdown (identifies ChatGPT, Gemini, Widget, Direct API calls)
    const { data: logs, error } = await (supabase
      .from('usage_logs') as any)
      .select('endpoint, method, status_code, response_time_ms')
      .eq('seller_id', context.sellerId)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch analytics.');
    }

    const byEndpoint: Record<string, { count: number; successCount: number }> = {};
    for (const log of (logs || []) as Record<string, unknown>[]) {
      const ep = (log.endpoint as string) || '/unknown';
      if (!byEndpoint[ep]) byEndpoint[ep] = { count: 0, successCount: 0 };
      byEndpoint[ep].count++;
      if ((log.status_code as number) < 400) byEndpoint[ep].successCount++;
    }

    const platforms = Object.entries(byEndpoint)
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.count,
        successRate: data.count > 0 ? Math.round((data.successCount / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests);

    return apiSuccess({ platforms, period: `${year}-${String(month).padStart(2, '0')}`, total: logs?.length || 0 });
  }

  if (type === 'logs') {
    // Recent API logs
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200);

    const { data: logs, error } = await (supabase
      .from('usage_logs') as any)
      .select('endpoint, method, status_code, response_time_ms, destination_country, created_at')
      .eq('seller_id', context.sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch logs.');
    }

    return apiSuccess({
      logs: (logs || []).map((log: Record<string, unknown>) => ({
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.status_code,
        responseTimeMs: log.response_time_ms,
        destinationCountry: log.destination_country,
        timestamp: log.created_at,
      })),
      count: (logs || []).length,
      limit,
    });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid type. Use: countries, platforms, or logs.');
});
