/**
 * B-4: Seller Profile API
 *
 * GET  /api/v1/sellers/profile — Get profile + completion percentage
 * PUT  /api/v1/sellers/profile — Update profile fields + check Forever Free upgrade
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

const PROFILE_FIELDS = {
  // Required at signup (50%)
  required: ['email', 'company_name', 'country', 'industry'] as const,
  // Optional for Forever Free (+10% each = 50%)
  optional: [
    { field: 'company_size', label: 'Company Size', options: ['1-10', '11-50', '51-200', '201-1000', '1000+'] },
    { field: 'monthly_shipments', label: 'Monthly Shipments', options: ['0-100', '101-1000', '1001-10000', '10000+'] },
    { field: 'primary_platform', label: 'Primary Platform', options: ['Shopify', 'WooCommerce', 'Amazon', 'Magento', 'BigCommerce', 'Custom', 'Other'] },
    { field: 'main_trade_countries', label: 'Main Trade Countries', type: 'array' },
    { field: 'annual_revenue_range', label: 'Annual Revenue', options: ['Under $100K', '$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M+'] },
  ] as const,
};

function calculateCompletion(seller: Record<string, unknown>): { percent: number; missing: string[]; completed: string[] } {
  let percent = 0;
  const missing: string[] = [];
  const completed: string[] = [];

  // Required fields (50% total — assumed done at signup)
  const hasRequired = PROFILE_FIELDS.required.every(f => seller[f] && String(seller[f]).trim());
  if (hasRequired) {
    percent += 50;
    completed.push('Email', 'Company Name', 'Country', 'Industry');
  } else {
    for (const f of PROFILE_FIELDS.required) {
      if (!seller[f] || !String(seller[f]).trim()) missing.push(f);
      else completed.push(f);
    }
    percent += completed.length * (50 / PROFILE_FIELDS.required.length);
  }

  // Optional fields (10% each = 50%)
  for (const opt of PROFILE_FIELDS.optional) {
    const val = seller[opt.field];
    if (opt.field === 'main_trade_countries') {
      if (Array.isArray(val) && val.length > 0) {
        percent += 10;
        completed.push(opt.label);
      } else {
        missing.push(opt.label);
      }
    } else {
      if (val && String(val).trim()) {
        percent += 10;
        completed.push(opt.label);
      } else {
        missing.push(opt.label);
      }
    }
  }

  return { percent: Math.min(100, Math.round(percent)), missing, completed };
}

export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  const { data, error } = await (supabase
    .from('sellers') as any)
    .select('email, company_name, country, industry, company_size, monthly_shipments, primary_platform, main_trade_countries, annual_revenue_range, profile_completed_at, trial_type, trial_expires_at, created_at')
    .eq('id', ctx.sellerId)
    .single();

  if (error || !data) return apiError(ApiErrorCode.NOT_FOUND, 'Seller not found.');

  const completion = calculateCompletion(data as Record<string, unknown>);
  const trialExpiresAt = data.trial_expires_at ? new Date(data.trial_expires_at as string) : null;
  const daysRemaining = trialExpiresAt ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - Date.now()) / 86400000)) : null;

  return apiSuccess({
    profile: data,
    completion: {
      percent: completion.percent,
      isComplete: completion.percent >= 100,
      missingFields: completion.missing,
      completedFields: completion.completed,
    },
    trial: {
      type: data.trial_type,
      expiresAt: data.trial_expires_at,
      daysRemaining,
      isForeverFree: data.trial_type === 'forever',
      isExpired: data.trial_type === 'monthly' && trialExpiresAt ? trialExpiresAt < new Date() : false,
    },
    fieldOptions: PROFILE_FIELDS.optional.map(f => ({
      field: f.field,
      label: f.label,
      options: 'options' in f ? f.options : undefined,
      type: f.field === 'main_trade_countries' ? 'array' : 'select',
    })),
  }, { sellerId: ctx.sellerId });
});

export const PUT = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  // Build update object (only allow profile fields)
  const allowedFields = ['company_name', 'country', 'industry', 'company_size', 'monthly_shipments', 'primary_platform', 'main_trade_countries', 'annual_revenue_range'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'main_trade_countries') {
        if (Array.isArray(body[field])) {
          const countries = (body[field] as string[]).slice(0, 5).map(c => String(c).toUpperCase());
          updates[field] = countries;
        }
      } else {
        updates[field] = String(body[field]).trim();
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'No valid fields to update.');
  }

  // Update seller
  const { error: updateError } = await (supabase
    .from('sellers') as any)
    .update(updates)
    .eq('id', ctx.sellerId);

  if (updateError) return apiError(ApiErrorCode.INTERNAL_ERROR, `Update failed: ${updateError.message}`);

  // Re-fetch to check completion
  const { data: updated } = await (supabase
    .from('sellers') as any)
    .select('email, company_name, country, industry, company_size, monthly_shipments, primary_platform, main_trade_countries, annual_revenue_range, profile_completed_at, trial_type, trial_expires_at')
    .eq('id', ctx.sellerId)
    .single();

  if (!updated) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to re-fetch profile.');

  const completion = calculateCompletion(updated as Record<string, unknown>);

  // Auto-upgrade to Forever Free if 100%
  let upgradedToForever = false;
  if (completion.percent >= 100 && updated.trial_type === 'monthly' && !updated.profile_completed_at) {
    const { error: upgradeError } = await (supabase
      .from('sellers') as any)
      .update({
        trial_type: 'forever',
        profile_completed_at: new Date().toISOString(),
      })
      .eq('id', ctx.sellerId);

    if (!upgradeError) upgradedToForever = true;
  }

  return apiSuccess({
    updated: true,
    upgradedToForeverFree: upgradedToForever,
    completion: {
      percent: completion.percent,
      isComplete: completion.percent >= 100,
      missingFields: completion.missing,
    },
    message: upgradedToForever
      ? 'Profile complete! You now have Forever Free access to all 140 features.'
      : completion.percent >= 100
        ? 'Profile is complete. You have Forever Free access.'
        : `Profile ${completion.percent}% complete. Fill in ${completion.missing.length} more field(s) for Forever Free.`,
  }, { sellerId: ctx.sellerId });
});
