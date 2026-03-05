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

// Plan limits (mirrors PLAN_CONFIG in stripe.ts — cached here to avoid DB call every request)
const PLAN_LIMITS: PlanLimits = {
  free: { maxCalculationsMonthly: 500 },
  starter: { maxCalculationsMonthly: 5000 },
  growth: { maxCalculationsMonthly: 25000 },
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
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.starter;

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
