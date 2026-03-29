/**
 * POTAL Plan Limit Checker
 *
 * PIVOT (CW22): All plans are now "Forever Free" — 140 features, unlimited access.
 * Only rate limit for DDoS prevention (100K calls/month soft cap).
 * Enterprise: custom via contact form.
 *
 * Previous paid tiers (Basic $20, Pro $80, Enterprise $300) are deprecated.
 */

import { createClient } from '@supabase/supabase-js';

interface PlanLimitConfig {
  maxCalculationsMonthly: number;
  allowOverage: boolean;
  overageRate: number;
  batchApi: boolean;
  batchMaxItems: number;
  webhookNotifications: boolean;
  analyticsDashboard: 'basic' | 'advanced' | 'full';
  widgetBranding: 'potal' | 'custom' | 'white-label';
  retentionDays: number;
}

// Forever Free: all users get the same generous limits
// Enterprise contacts get custom config via DB override
const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free: {
    maxCalculationsMonthly: 100000, allowOverage: true, overageRate: 0,
    batchApi: true, batchMaxItems: 500, webhookNotifications: true,
    analyticsDashboard: 'advanced', widgetBranding: 'potal', retentionDays: 365,
  },
  // Legacy plans — map to free limits (existing users won't break)
  basic: {
    maxCalculationsMonthly: 100000, allowOverage: true, overageRate: 0,
    batchApi: true, batchMaxItems: 500, webhookNotifications: true,
    analyticsDashboard: 'advanced', widgetBranding: 'potal', retentionDays: 365,
  },
  pro: {
    maxCalculationsMonthly: 100000, allowOverage: true, overageRate: 0,
    batchApi: true, batchMaxItems: 500, webhookNotifications: true,
    analyticsDashboard: 'advanced', widgetBranding: 'custom', retentionDays: 365,
  },
  enterprise: {
    maxCalculationsMonthly: 999999, allowOverage: true, overageRate: 0,
    batchApi: true, batchMaxItems: 5000, webhookNotifications: true,
    analyticsDashboard: 'full', widgetBranding: 'white-label', retentionDays: 99999,
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
 * Check monthly usage. Forever Free: always allowed (soft cap at 100K for DDoS prevention).
 */
export async function checkPlanLimits(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  planId: string
): Promise<PlanCheckResult> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { count } = await (supabase
    .from('usage_logs') as any)
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  const used = count || 0;

  // Forever Free: always allowed. Usage alerts at 80K and 100K for awareness only.
  const percentUsed = limits.maxCalculationsMonthly > 0
    ? Math.round((used / limits.maxCalculationsMonthly) * 100) : 0;
  if (percentUsed >= 80 && percentUsed < 100) {
    void triggerUsageAlert(sellerId, 'usage-alert-80', used, limits.maxCalculationsMonthly, percentUsed, planId);
  } else if (percentUsed >= 100) {
    void triggerUsageAlert(sellerId, 'usage-alert-100', used, limits.maxCalculationsMonthly, percentUsed, planId);
  }

  return {
    allowed: true, // Forever Free: always allowed
    used,
    limit: limits.maxCalculationsMonthly,
    isOverage: false,
    overageCount: 0,
    overageRate: 0,
  };
}

async function triggerUsageAlert(sellerId: string, alertType: 'usage-alert-80' | 'usage-alert-100', used: number, limit: number, percentUsed: number, planId: string) {
  try {
    const { sendEmail } = await import('@/app/lib/email/send');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: seller } = await (sb.from('sellers') as ReturnType<ReturnType<typeof createClient>['from']>)
      .select('email')
      .eq('id', sellerId)
      .single();

    const sellerData = seller as { email?: string } | null;
    if (sellerData?.email) {
      await sendEmail(alertType, sellerData.email, {
        used,
        limit,
        planName: 'Forever Free',
        percentUsed,
      }, { sellerId });
    }
  } catch { /* non-blocking */ }
}

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

export async function enforceDataRetention(
  supabase: ReturnType<typeof createClient>,
  sellerId: string,
  planId: string
): Promise<{ tablesProcessed: number; rowsDeleted: number; retentionDays: number }> {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  const retentionDays = limits.retentionDays;

  if (retentionDays >= 99999) {
    return { tablesProcessed: 0, rowsDeleted: 0, retentionDays };
  }

  const cutoffDate = new Date(Date.now() - retentionDays * 86400000).toISOString();
  let totalDeleted = 0;
  const tables = ['usage_logs', 'hs_classification_audit', 'calculation_history'];

  for (const table of tables) {
    try {
      const { count } = await (supabase
        .from(table) as any)
        .delete({ count: 'exact' })
        .eq('seller_id', sellerId)
        .lt('created_at', cutoffDate);
      totalDeleted += count || 0;
    } catch { /* table may not exist */ }
  }

  return { tablesProcessed: tables.length, rowsDeleted: totalDeleted, retentionDays };
}

export function getRetentionPolicy(planId: string) {
  const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  return {
    retentionDays: limits.retentionDays,
    retentionDescription: limits.retentionDays >= 99999 ? 'Unlimited' : `${limits.retentionDays} days`,
    dataTypes: ['API usage logs', 'Classification audit', 'Calculation history'],
    autoDeleteEnabled: limits.retentionDays < 99999,
    nextCleanupNote: 'Data retention is enforced daily via scheduled cron job.',
  };
}

export { PLAN_LIMITS };
