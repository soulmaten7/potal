/**
 * POTAL Plan Limit Checker
 *
 * Checks if a seller has exceeded their monthly calculation quota.
 * Uses the seller_monthly_usage VIEW for efficient aggregation.
 */

import { createClient } from '@supabase/supabase-js';

interface PlanLimits {
  [planId: string]: {
    maxCalculationsMonthly: number;
  };
}

// Plan limits — 신 요금제 (세션 28 확정, 세션 36 코드 반영)
// Free $0/100건, Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
const PLAN_LIMITS: PlanLimits = {
  free: { maxCalculationsMonthly: 100 },
  basic: { maxCalculationsMonthly: 2000 },
  pro: { maxCalculationsMonthly: 10000 },
  enterprise: { maxCalculationsMonthly: -1 }, // unlimited
};

export interface PlanCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Check if seller is within their plan's monthly calculation limit.
 */
export async function checkPlanLimits(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  planId: string
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

  // Unlimited plan — always allowed
  if (limits.maxCalculationsMonthly === -1) {
    return { allowed: true, used: 0, limit: -1 };
  }

  // Get current month's usage count
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { count, error } = await (supabase
    .from('usage_logs') as any)
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .gte('billed_at', monthStart)
    .lte('billed_at', monthEnd);

  const used = count || 0;

  return {
    allowed: used < limits.maxCalculationsMonthly,
    used,
    limit: limits.maxCalculationsMonthly,
  };
}
