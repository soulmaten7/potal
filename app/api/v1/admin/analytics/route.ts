/**
 * POTAL API v1 — /api/v1/admin/analytics
 *
 * Aggregated API usage analytics for dashboard charts (Recharts).
 * Returns: time-series requests, endpoint distribution, response times, error rates.
 *
 * GET /api/v1/admin/analytics?range=24h|7d|30d&seller_id=xxx
 *
 * Auth: Bearer token (session) — returns own seller data only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSellerIdFromToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const svc = getServiceClient();
  const { data: seller } = await svc
    .from('sellers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return seller?.id || null;
}

interface UsageLog {
  endpoint: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const sellerId = await getSellerIdFromToken(req);
  if (!sellerId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get('range') || '24h';
  const supabase = getServiceClient();

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let bucketMinutes: number;

  switch (range) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      bucketMinutes = 5;
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      bucketMinutes = 360; // 6 hours
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      bucketMinutes = 1440; // 1 day
      break;
    default: // 24h
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      bucketMinutes = 60;
      break;
  }

  // Fetch usage logs
  const { data: logs, error } = await (supabase
    .from('usage_logs') as ReturnType<typeof supabase.from>)
    .select('endpoint, status_code, response_time_ms, created_at')
    .eq('seller_id', sellerId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }

  const typedLogs = (logs || []) as unknown as UsageLog[];

  // 1. Time-series data (requests over time)
  const timeSeries: { time: string; requests: number; errors: number }[] = [];
  const bucketMs = bucketMinutes * 60 * 1000;
  let bucketStart = startDate.getTime();

  while (bucketStart < now.getTime()) {
    const bucketEnd = bucketStart + bucketMs;
    const bucketLogs = typedLogs.filter(l => {
      const t = new Date(l.created_at).getTime();
      return t >= bucketStart && t < bucketEnd;
    });

    const label = range === '1h' || range === '24h'
      ? new Date(bucketStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : new Date(bucketStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    timeSeries.push({
      time: label,
      requests: bucketLogs.length,
      errors: bucketLogs.filter(l => l.status_code >= 400).length,
    });

    bucketStart = bucketEnd;
  }

  // 2. Endpoint distribution (top 5 + others)
  const endpointCounts: Record<string, number> = {};
  for (const l of typedLogs) {
    const ep = l.endpoint || '/unknown';
    endpointCounts[ep] = (endpointCounts[ep] || 0) + 1;
  }
  const sortedEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1]);
  const top5 = sortedEndpoints.slice(0, 5);
  const othersCount = sortedEndpoints.slice(5).reduce((s, e) => s + e[1], 0);
  const endpointDistribution = [
    ...top5.map(([name, value]) => ({ name: name.replace('/api/v1/', ''), value })),
    ...(othersCount > 0 ? [{ name: 'Others', value: othersCount }] : []),
  ];

  // 3. Response time distribution
  const rtBuckets = [
    { label: '<100ms', min: 0, max: 100, count: 0 },
    { label: '100-300ms', min: 100, max: 300, count: 0 },
    { label: '300-500ms', min: 300, max: 500, count: 0 },
    { label: '500ms-1s', min: 500, max: 1000, count: 0 },
    { label: '1s-3s', min: 1000, max: 3000, count: 0 },
    { label: '>3s', min: 3000, max: Infinity, count: 0 },
  ];
  for (const l of typedLogs) {
    const rt = l.response_time_ms || 0;
    const bucket = rtBuckets.find(b => rt >= b.min && rt < b.max);
    if (bucket) bucket.count++;
  }

  // 4. Error rate over time (reuse timeSeries buckets)
  const errorRate = timeSeries.map(ts => ({
    time: ts.time,
    rate: ts.requests > 0 ? Math.round((ts.errors / ts.requests) * 10000) / 100 : 0,
  }));

  // 5. Monthly usage projection
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { count: monthlyCount } = await (supabase
    .from('usage_logs') as ReturnType<typeof supabase.from>)
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .gte('created_at', monthStart.toISOString());

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonthly = Math.round(((monthlyCount || 0) / dayOfMonth) * daysInMonth);

  // Get plan limit
  const { data: seller } = await supabase
    .from('sellers')
    .select('plan_id')
    .eq('id', sellerId)
    .single();

  const planLimits: Record<string, number> = {
    free: 200, basic: 2000, pro: 10000, enterprise: 50000,
  };
  const limit = planLimits[seller?.plan_id || 'free'] || 200;
  const usagePercent = Math.round(((monthlyCount || 0) / limit) * 100);
  const dailyRate = (monthlyCount || 0) / Math.max(dayOfMonth, 1);
  const remainingCalls = limit - (monthlyCount || 0);
  const daysUntilLimit = dailyRate > 0 ? Math.ceil(remainingCalls / dailyRate) : 999;

  return NextResponse.json({
    success: true,
    data: {
      timeSeries,
      endpointDistribution,
      responseTimeDistribution: rtBuckets.map(b => ({ name: b.label, count: b.count })),
      errorRate,
      monthly: {
        used: monthlyCount || 0,
        limit,
        projected: projectedMonthly,
        usagePercent,
        daysUntilLimit: Math.min(daysUntilLimit, daysInMonth - dayOfMonth),
        dayOfMonth,
        daysInMonth,
      },
    },
  });
}
