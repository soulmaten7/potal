/**
 * POTAL Plan Limit Checker
 *
 * Checks seller's monthly calculation quota.
 * Free plan: hard block at limit.
 * Paid plans (basic/pro/enterprise): allow overage, charge at month end.
 */

import { createClient } from '@supabase/supabase-js';

interface PlanLimitConfig {
  maxCalculationsMonthly: number;
  allowOverage: boolean;
  overageRate: number; // $/call for overage
}

// Plan limits — 신 요금제 (세션 28 확정, 세션 37 Overage 추가)
// Free $0/100건, Basic $20/2K, Pro $80/10K, Enterprise $300/50K
const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free: { maxCalculationsMonthly: 100, allowOverage: false, overageRate: 0 },
  basic: { maxCalculationsMonthly: 2000, allowOverage: true, overageRate: 0.015 },
  pro: { maxCalculationsMonthly: 10000, allowOverage: true, overageRate: 0.012 },
  enterprise: { maxCalculationsMonthly: 50000, allowOverage: true, overageRate: 0.01 },
};

export interface PlanCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  isOverage: boolean;
  overageCount: number;
  overageRate: number;
}

/**
 * Check if seller is within their plan's monthly calculation limit.
 * Paid plans are always allowed (overage is billed at month end).
 * Free plan is hard-blocked at limit.
 */
export async function checkPlanLimits(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  planId: string
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

  // Get current month's usage count
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { count } = await (supabase
    .from('usage_logs') as any)
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .gte('billed_at', monthStart)
    .lte('billed_at', monthEnd);

  const used = count || 0;
  const overLimit = used >= limits.maxCalculationsMonthly;
  const overageCount = overLimit ? used - limits.maxCalculationsMonthly : 0;

  // Paid plans: allow overage (billed at month end)
  // Free plan: hard block
  const allowed = limits.allowOverage ? true : !overLimit;

  return {
    allowed,
    used,
    limit: limits.maxCalculationsMonthly,
    isOverage: overLimit && limits.allowOverage,
    overageCount,
    overageRate: limits.overageRate,
  };
}

export { PLAN_LIMITS };
