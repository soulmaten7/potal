/**
 * POTAL API v1 — GET /api/v1/admin/usage
 *
 * API usage dashboard data: totals, by-endpoint, daily trend, hourly distribution.
 * Query: ?period=7d|30d|90d
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const PLAN_LIMITS: Record<string, number> = {
  free: 200, basic: 2000, pro: 10000, enterprise: 50000,
};

interface UsageRow {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const periodParam = url.searchParams.get('period') || '30d';
  const periodDays = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30;

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await (supabase.from('usage_logs') as any)
      .select('endpoint, method, status_code, response_time_ms, created_at')
      .eq('seller_id', ctx.sellerId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(50000);

    if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Usage query failed.');

    const rows = (data || []) as UsageRow[];
    const total = rows.length;
    const errors = rows.filter(r => r.status_code >= 400).length;
    const avgResponseMs = total > 0
      ? Math.round(rows.reduce((s, r) => s + (r.response_time_ms || 0), 0) / total)
      : 0;

    // By endpoint
    const epMap = new Map<string, { count: number; errors: number }>();
    for (const r of rows) {
      const key = `${r.method} ${r.endpoint}`;
      const entry = epMap.get(key) || { count: 0, errors: 0 };
      entry.count++;
      if (r.status_code >= 400) entry.errors++;
      epMap.set(key, entry);
    }
    const byEndpoint = [...epMap.entries()]
      .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      .sort((a, b) => b.count - a.count);

    // Daily trend
    const dailyMap = new Map<string, { calls: number; errors: number }>();
    for (const r of rows) {
      const day = r.created_at.split('T')[0];
      const entry = dailyMap.get(day) || { calls: 0, errors: 0 };
      entry.calls++;
      if (r.status_code >= 400) entry.errors++;
      dailyMap.set(day, entry);
    }
    // Fill in missing days
    const dailyTrend: { date: string; calls: number; errors: number }[] = [];
    for (let d = 0; d < periodDays; d++) {
      const date = new Date(Date.now() - (periodDays - 1 - d) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const entry = dailyMap.get(date) || { calls: 0, errors: 0 };
      dailyTrend.push({ date, ...entry });
    }

    // Hourly distribution
    const hourlyMap = new Map<number, number>();
    for (const r of rows) {
      const hour = new Date(r.created_at).getUTCHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    }
    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: h, calls: hourlyMap.get(h) || 0,
    }));

    const planLimit = PLAN_LIMITS[ctx.planId] || PLAN_LIMITS.free;

    return apiSuccess({
      period: periodParam,
      periodDays,
      usage: {
        total,
        errors,
        errorRate: total > 0 ? Math.round((errors / total) * 10000) / 100 : 0,
        avgResponseMs,
        plan: ctx.planId,
        limit: planLimit,
        percentUsed: Math.round((total / planLimit) * 100),
      },
      topEndpoints: byEndpoint.slice(0, 10),
      dailyTrend,
      hourlyDistribution,
    }, { sellerId: ctx.sellerId });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Usage query failed.');
  }
});
