/**
 * POTAL API v1 — /api/v1/admin/rate-limit
 * F094: Rate Limiting Dashboard — current usage, limits, overage, recommendations.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const PLAN_LIMITS: Record<string, { monthly: number; perSecond: number; perMinute: number }> = {
  free: { monthly: 200, perSecond: 2, perMinute: 30 },
  basic: { monthly: 2000, perSecond: 5, perMinute: 60 },
  pro: { monthly: 10000, perSecond: 10, perMinute: 120 },
  enterprise: { monthly: 50000, perSecond: 20, perMinute: 300 },
};

const OVERAGE_RATES: Record<string, number> = {
  basic: 0.015,
  pro: 0.012,
  enterprise: 0.01,
};

interface Recommendation {
  type: 'upgrade' | 'blocked' | 'info';
  message: string;
}

function getRecommendations(used: number, monthly: number, plan: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const pct = monthly > 0 ? used / monthly : 0;

  if (pct >= 1.0 && plan === 'free') {
    recs.push({ type: 'blocked', message: 'Free plan limit reached. Upgrade to Basic ($20/mo) for 2,000 requests and automatic overage billing.' });
  } else if (pct >= 0.9) {
    recs.push({ type: 'upgrade', message: `${Math.round(pct * 100)}% of monthly limit used. Consider upgrading to avoid interruption.` });
  } else if (pct >= 0.8) {
    recs.push({ type: 'info', message: `${Math.round(pct * 100)}% of monthly limit used. Monitor usage closely.` });
  }

  if (plan === 'free' && used >= 100) {
    recs.push({ type: 'info', message: 'Batch API available on all plans (Free: 50 items/batch). Use batch for bulk calculations.' });
  }

  return recs;
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const sb = getSupabase();

  // Current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Query current month usage
  const { count } = await (sb.from('usage_logs') as ReturnType<ReturnType<typeof createClient>['from']>)
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', ctx.sellerId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', nextMonthStart.toISOString());

  const used = count || 0;
  const limits = PLAN_LIMITS[ctx.planId] || PLAN_LIMITS.free;
  const overageRate = OVERAGE_RATES[ctx.planId] || 0;
  const overageCount = Math.max(0, used - limits.monthly);

  return apiSuccess({
    plan: ctx.planId,
    monthly: {
      limit: limits.monthly,
      used,
      remaining: Math.max(0, limits.monthly - used),
      percentUsed: limits.monthly > 0 ? Math.round((used / limits.monthly) * 100) : 0,
      resetAt: nextMonthStart.toISOString(),
    },
    burst: {
      perSecond: limits.perSecond,
      perMinute: limits.perMinute,
    },
    overage: {
      enabled: ctx.planId !== 'free',
      rate: overageRate > 0 ? overageRate : null,
      currentOverage: overageCount,
      estimatedCharge: Math.round(overageCount * overageRate * 100) / 100,
    },
    recommendations: getRecommendations(used, limits.monthly, ctx.planId),
  });
});
