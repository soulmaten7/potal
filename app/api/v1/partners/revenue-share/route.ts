/**
 * POTAL API v1 — /api/v1/partners/revenue-share
 *
 * Revenue sharing / partner referral program.
 * Partners earn commission on referred customer revenue.
 *
 * GET  — Get partner's revenue share stats
 * POST — Register/manage partner referral
 *
 * POST Body: {
 *   action: "register" | "refer" | "stats",
 *   partnerInfo?: {
 *     companyName: string,
 *     contactEmail: string,
 *     website?: string,
 *     partnerType?: "technology" | "logistics" | "consulting" | "marketplace" | "affiliate",
 *   },
 *   referral?: {
 *     referredEmail: string,
 *     referredCompany?: string,
 *   },
 * }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// Revenue share tiers
const REVENUE_SHARE_TIERS = [
  { tier: 'Bronze', minReferrals: 0, commissionRate: 0.15, description: '15% recurring commission' },
  { tier: 'Silver', minReferrals: 10, commissionRate: 0.20, description: '20% recurring commission' },
  { tier: 'Gold', minReferrals: 25, commissionRate: 0.25, description: '25% recurring commission' },
  { tier: 'Platinum', minReferrals: 50, commissionRate: 0.30, description: '30% recurring commission + priority support' },
];

const VALID_PARTNER_TYPES = ['technology', 'logistics', 'consulting', 'marketplace', 'affiliate'];

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data: partner } = await supabase
    .from('partner_accounts')
    .select('*')
    .eq('seller_id', context.sellerId)
    .single();

  if (!partner) {
    return apiSuccess(
      {
        registered: false,
        message: 'Not registered as a partner. POST with action: "register" to join.',
        program: {
          tiers: REVENUE_SHARE_TIERS,
          features: [
            'Recurring commission on referred customer revenue',
            'Real-time dashboard tracking',
            'Monthly payouts via Paddle',
            'Custom referral links',
            'Co-marketing opportunities',
          ],
        },
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // Get referral stats
  const { count: referralCount } = await supabase
    .from('partner_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partner.id);

  const totalReferrals = referralCount || 0;
  const currentTier = [...REVENUE_SHARE_TIERS].reverse().find(t => totalReferrals >= t.minReferrals) || REVENUE_SHARE_TIERS[0];
  const nextTier = REVENUE_SHARE_TIERS.find(t => t.minReferrals > totalReferrals);

  return apiSuccess(
    {
      registered: true,
      partner: {
        companyName: partner.company_name,
        partnerType: partner.partner_type,
        referralCode: partner.referral_code,
        joinedAt: partner.created_at,
      },
      stats: {
        totalReferrals,
        currentTier: currentTier.tier,
        commissionRate: currentTier.commissionRate,
        commissionRatePercent: `${(currentTier.commissionRate * 100).toFixed(0)}%`,
        totalEarnings: partner.total_earnings || 0,
        pendingPayout: partner.pending_payout || 0,
      },
      nextTier: nextTier ? {
        tier: nextTier.tier,
        referralsNeeded: nextTier.minReferrals - totalReferrals,
        commissionRate: nextTier.commissionRate,
      } : null,
    },
    { sellerId: context.sellerId, plan: context.planId }
  );
});

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const action = typeof body.action === 'string' ? body.action.toLowerCase().trim() : '';

  if (!['register', 'refer', 'stats'].includes(action)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"action" must be: register, refer, or stats.');
  }

  const supabase = getSupabase();

  if (action === 'register') {
    const partnerInfo = body.partnerInfo as Record<string, unknown> | undefined;
    if (!partnerInfo?.companyName || !partnerInfo?.contactEmail) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"partnerInfo" with companyName and contactEmail is required.');
    }

    const partnerType = typeof partnerInfo.partnerType === 'string' && VALID_PARTNER_TYPES.includes(partnerInfo.partnerType)
      ? partnerInfo.partnerType : 'affiliate';

    // Generate referral code
    const referralCode = `POTAL-${context.sellerId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase
      .from('partner_accounts')
      .insert({
        seller_id: context.sellerId,
        company_name: partnerInfo.companyName,
        contact_email: partnerInfo.contactEmail,
        website: partnerInfo.website || null,
        partner_type: partnerType,
        referral_code: referralCode,
        total_earnings: 0,
        pending_payout: 0,
      });

    if (error) {
      if (error.code === '23505') {
        return apiError(ApiErrorCode.BAD_REQUEST, 'Already registered as a partner.');
      }
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to register partner.');
    }

    return apiSuccess(
      {
        action: 'register',
        status: 'approved',
        referralCode,
        commissionRate: REVENUE_SHARE_TIERS[0].commissionRate,
        tier: REVENUE_SHARE_TIERS[0].tier,
        message: 'Welcome to the POTAL Partner Program! Share your referral code to start earning.',
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  if (action === 'refer') {
    const referral = body.referral as Record<string, unknown> | undefined;
    if (!referral?.referredEmail) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"referral.referredEmail" is required.');
    }

    const { data: partner } = await supabase
      .from('partner_accounts')
      .select('id')
      .eq('seller_id', context.sellerId)
      .single();

    if (!partner) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Not registered as a partner. Register first.');
    }

    const { error } = await supabase
      .from('partner_referrals')
      .insert({
        partner_id: partner.id,
        referred_email: referral.referredEmail,
        referred_company: referral.referredCompany || null,
        status: 'pending',
      });

    if (error) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to record referral.');
    }

    return apiSuccess(
      {
        action: 'refer',
        status: 'recorded',
        referredEmail: referral.referredEmail,
        message: 'Referral recorded. Commission will be credited when the referred customer subscribes.',
      },
      { sellerId: context.sellerId, plan: context.planId }
    );
  }

  // stats — return same as GET
  return apiSuccess(
    { action: 'stats', message: 'Use GET method for detailed stats.' },
    { sellerId: context.sellerId, plan: context.planId }
  );
});
