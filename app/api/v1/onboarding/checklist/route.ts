/**
 * POTAL API v1 — GET /api/v1/onboarding/checklist
 *
 * Dynamic onboarding checklist based on seller's actual progress.
 * Checks DB for API keys, first API call, integrations, webhooks, plan.
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  url: string;
  helpText: string;
  estimatedMinutes: number;
}

export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  const supabase = getSupabase();

  // Query seller progress from DB (all fire-and-forget safe)
  let hasApiKey = false;
  let hasFirstCall = false;
  let hasIntegration = false;
  let hasWebhook = false;
  let hasProfile = false;
  let isPaid = ctx.planId !== 'free';

  if (supabase) {
    try {
      const [keys, logs, integrations, webhooks, seller] = await Promise.all([
        (supabase.from('api_keys') as any).select('id').eq('seller_id', ctx.sellerId).eq('is_active', true).limit(1),
        (supabase.from('usage_logs') as any).select('id').eq('seller_id', ctx.sellerId).limit(1),
        (supabase.from('marketplace_connections') as any).select('id').eq('seller_id', ctx.sellerId).limit(1),
        (supabase.from('seller_webhooks') as any).select('id').eq('seller_id', ctx.sellerId).eq('active', true).limit(1),
        (supabase.from('sellers') as any).select('company_name, plan_id').eq('id', ctx.sellerId).single(),
      ]);

      hasApiKey = (keys.data?.length || 0) > 0;
      hasFirstCall = (logs.data?.length || 0) > 0;
      hasIntegration = (integrations.data?.length || 0) > 0;
      hasWebhook = (webhooks.data?.length || 0) > 0;
      hasProfile = !!seller.data?.company_name;
      isPaid = seller.data?.plan_id !== 'free' && !!seller.data?.plan_id;
    } catch {
      // DB query failed — show all steps as incomplete
    }
  }

  const steps: OnboardingStep[] = [
    { id: 'account', title: 'Create Account', description: 'Sign up for POTAL', completed: true, url: '/dashboard', helpText: 'You are already signed in.', estimatedMinutes: 2 },
    { id: 'profile', title: 'Complete Profile', description: 'Add company name and business details', completed: hasProfile, url: '/settings', helpText: 'Go to Settings and fill in your company information.', estimatedMinutes: 3 },
    { id: 'api_key', title: 'Generate API Key', description: 'Create your first API key', completed: hasApiKey, url: '/dashboard', helpText: 'Dashboard → API Keys → Create New Key.', estimatedMinutes: 1 },
    { id: 'first_call', title: 'Make First API Call', description: 'Test with a sample landed cost calculation', completed: hasFirstCall, url: '/developers', helpText: 'Try POST /api/v1/calculate with a sample product.', estimatedMinutes: 5 },
    { id: 'integration', title: 'Connect Your Store', description: 'Link Shopify, WooCommerce, or custom store', completed: hasIntegration, url: '/developers', helpText: 'Shopify app available in Shopify App Store.', estimatedMinutes: 10 },
    { id: 'webhook', title: 'Set Up Webhooks', description: 'Get notified of rate changes automatically', completed: hasWebhook, url: '/developers', helpText: 'POST /api/v1/webhooks to register webhook URL.', estimatedMinutes: 5 },
    { id: 'go_live', title: 'Upgrade & Go Live', description: 'Choose a paid plan for production use', completed: isPaid, url: '/pricing', helpText: 'Free plan: 200 calls/month. Basic: 2,000. Pro: 10,000.', estimatedMinutes: 3 },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const nextStep = steps.find(s => !s.completed) || null;
  const remainingMinutes = steps.filter(s => !s.completed).reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return apiSuccess({
    steps,
    completionPercent: Math.round((completedCount / steps.length) * 100),
    completedCount,
    totalSteps: steps.length,
    nextStep,
    estimatedTimeToComplete: `${remainingMinutes} minutes`,
    allComplete: completedCount === steps.length,
    plan: ctx.planId,
  }, { sellerId: ctx.sellerId });
});
