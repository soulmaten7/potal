/**
 * F133: Referral Program
 *
 * POST /api/v1/partners/referral
 * Generate referral codes, track referrals, and manage rewards.
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

// Referral reward tiers
const REWARD_TIERS = {
  starter: { commissionPercent: 10, maxMonths: 3, creditAmount: 5 },
  growth: { commissionPercent: 15, maxMonths: 6, creditAmount: 10 },
  champion: { commissionPercent: 20, maxMonths: 12, creditAmount: 20 },
};

function generateReferralCode(sellerId: string): string {
  const prefix = sellerId.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `POTAL-${prefix}-${rand}`;
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'generate';

  if (action === 'generate') {
    const referralCode = generateReferralCode(ctx.sellerId);
    const tier = 'starter';
    const rewards = REWARD_TIERS[tier];

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('partner_referrals').insert({
          partner_id: ctx.sellerId,
          referral_code: referralCode,
          tier,
          commission_percent: rewards.commissionPercent,
          status: 'active',
          created_at: new Date().toISOString(),
        });
      } catch { /* best-effort */ }
    }

    return apiSuccess({
      action: 'generate',
      referralCode,
      referralLink: `https://www.potal.app/signup?ref=${referralCode}`,
      tier,
      rewards: {
        commissionPercent: rewards.commissionPercent,
        duration: `${rewards.maxMonths} months`,
        signupCredit: `$${rewards.creditAmount} for referred user`,
      },
      shareable: {
        message: `Try POTAL for cross-border duty calculation! Use my referral code ${referralCode} and get $${rewards.creditAmount} credit. https://www.potal.app/signup?ref=${referralCode}`,
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'stats') {
    const supabase = getSupabase();
    let referrals: Record<string, unknown>[] = [];
    let totalEarnings = 0;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('partner_referrals')
          .select('referral_code, tier, status, created_at, referred_seller_id, commission_earned')
          .eq('partner_id', ctx.sellerId)
          .order('created_at', { ascending: false });
        referrals = (data || []) as Record<string, unknown>[];
        totalEarnings = referrals.reduce((s, r) => s + (Number(r.commission_earned) || 0), 0);
      } catch { /* best-effort */ }
    }

    const active = referrals.filter(r => r.status === 'active');
    const converted = referrals.filter(r => r.referred_seller_id);

    // Determine current tier based on conversions
    let currentTier: keyof typeof REWARD_TIERS = 'starter';
    if (converted.length >= 10) currentTier = 'champion';
    else if (converted.length >= 3) currentTier = 'growth';

    return apiSuccess({
      action: 'stats',
      currentTier,
      nextTier: currentTier === 'champion' ? null : currentTier === 'growth' ? 'champion' : 'growth',
      nextTierRequirement: currentTier === 'champion' ? null : currentTier === 'growth' ? '10 referrals' : '3 referrals',
      stats: {
        totalReferralCodes: referrals.length,
        activeReferrals: active.length,
        conversions: converted.length,
        conversionRate: referrals.length > 0 ? Math.round((converted.length / referrals.length) * 100) : 0,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        pendingPayout: 0,
      },
      rewards: REWARD_TIERS[currentTier],
      allTiers: Object.entries(REWARD_TIERS).map(([name, config]) => ({
        tier: name,
        ...config,
        isCurrent: name === currentTier,
      })),
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'validate') {
    const code = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';
    if (!code) return apiError(ApiErrorCode.BAD_REQUEST, '"referralCode" required.');

    const supabase = getSupabase();
    let valid = false;
    let referrerInfo: Record<string, unknown> | null = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('partner_referrals')
          .select('partner_id, tier, status, commission_percent')
          .eq('referral_code', code)
          .eq('status', 'active')
          .single();
        if (data) {
          valid = true;
          referrerInfo = data as Record<string, unknown>;
        }
      } catch { /* not found */ }
    }

    return apiSuccess({
      action: 'validate',
      referralCode: code,
      valid,
      benefit: valid ? `$${REWARD_TIERS.starter.creditAmount} signup credit` : null,
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: generate, stats, or validate.');
});
