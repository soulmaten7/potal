/**
 * POTAL API v1 — /api/v1/sellers/usage
 *
 * Get API usage statistics for the authenticated seller.
 * Requires any valid API key (pk_live_ or sk_live_).
 *
 * GET /api/v1/sellers/usage                — Current month usage
 * GET /api/v1/sellers/usage?month=2026-03  — Specific month
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

  // Parse month parameter (default: current month)
  const monthParam = req.nextUrl.searchParams.get('month');
  const now = new Date();
  let year: number, month: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number);
    year = y;
    month = m;
  } else {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;

  // Query usage logs for the seller in the given month
  const { data: logs, error } = await (supabase
    .from('usage_logs') as any)
    .select('endpoint, method, status_code, response_time_ms, created_at')
    .eq('seller_id', context.sellerId)
    .gte('created_at', startDate)
    .lt('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch usage data.');
  }

  const totalRequests = logs?.length || 0;

  // Aggregate by endpoint
  const byEndpoint: Record<string, { count: number; avgResponseMs: number }> = {};
  let totalResponseMs = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const log of (logs || []) as Record<string, unknown>[]) {
    const endpoint = log.endpoint as string;
    const responseTime = (log.response_time_ms as number) || 0;
    const statusCode = log.status_code as number;

    if (!byEndpoint[endpoint]) {
      byEndpoint[endpoint] = { count: 0, avgResponseMs: 0 };
    }
    byEndpoint[endpoint].count++;
    byEndpoint[endpoint].avgResponseMs += responseTime;
    totalResponseMs += responseTime;

    if (statusCode >= 200 && statusCode < 400) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // Calculate averages
  for (const key of Object.keys(byEndpoint)) {
    if (byEndpoint[key].count > 0) {
      byEndpoint[key].avgResponseMs = Math.round(byEndpoint[key].avgResponseMs / byEndpoint[key].count);
    }
  }

  // Plan limits — 신 요금제 (세션 28 확정, 세션 37 Overage 추가)
  const planConfig: Record<string, { limit: number; overageRate: number }> = {
    free: { limit: 100, overageRate: 0 },
    basic: { limit: 2000, overageRate: 0.015 },
    pro: { limit: 10000, overageRate: 0.012 },
    enterprise: { limit: 50000, overageRate: 0.01 },
  };
  const config = planConfig[context.planId] ?? planConfig.free;
  const limit = config.limit;
  const overageCount = Math.max(0, totalRequests - limit);
  const overageCost = overageCount * config.overageRate;

  return apiSuccess({
    period: `${year}-${String(month).padStart(2, '0')}`,
    totalRequests,
    successCount,
    errorCount,
    avgResponseMs: totalRequests > 0 ? Math.round(totalResponseMs / totalRequests) : 0,
    byEndpoint,
    plan: {
      id: context.planId,
      limit,
      used: totalRequests,
      remaining: Math.max(0, limit - totalRequests),
      usagePercent: Math.round((totalRequests / limit) * 100),
    },
    overage: {
      count: overageCount,
      rate: config.overageRate,
      estimatedCharge: Math.round(overageCost * 100) / 100,
    },
  });
});
