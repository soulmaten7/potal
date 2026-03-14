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
  batchApi: boolean;
  batchMaxItems: number;
  webhookNotifications: boolean;
  analyticsDashboard: 'basic' | 'advanced' | 'full';
  widgetBranding: 'potal' | 'custom' | 'white-label';
}

// Plan limits — 신 요금제 (CW13 업데이트: Free 200건, 전 플랜 기능 동일화)
// 차별화: API 호출량 + 위젯 브랜딩만. Batch/Webhook/Analytics는 전 플랜 개방
const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free: {
    maxCalculationsMonthly: 200, allowOverage: false, overageRate: 0,
    batchApi: true, batchMaxItems: 50, webhookNotifications: true,
    analyticsDashboard: 'basic', widgetBranding: 'potal',
  },
  basic: {
    maxCalculationsMonthly: 2000, allowOverage: true, overageRate: 0.015,
    batchApi: true, batchMaxItems: 100, webhookNotifications: true,
    analyticsDashboard: 'advanced', widgetBranding: 'potal',
  },
  pro: {
    maxCalculationsMonthly: 10000, allowOverage: true, overageRate: 0.012,
    batchApi: true, batchMaxItems: 500, webhookNotifications: true,
    analyticsDashboard: 'advanced', widgetBranding: 'custom',
  },
  enterprise: {
    maxCalculationsMonthly: 50000, allowOverage: true, overageRate: 0.01,
    batchApi: true, batchMaxItems: 5000, webhookNotifications: true,
    analyticsDashboard: 'full', widgetBranding: 'white-label',
  },
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

/**
 * Get plan feature flags for a given plan.
 */
export function getPlanFeatures(planId: string) {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  return {
    batchApi: limits.batchApi,
    batchMaxItems: limits.batchMaxItems,
    webhookNotifications: limits.webhookNotifications,
    analyticsDashboard: limits.analyticsDashboard,
    widgetBranding: limits.widgetBranding,
  };
}

export { PLAN_LIMITS };
