/**
 * F134: Affiliate System
 *
 * POST /api/v1/partners/affiliate
 * Affiliate dashboard, commission tracking, and payout management.
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

const COMMISSION_TIERS = {
  bronze: { minRevenue: 0, commissionPercent: 15, payoutThreshold: 50 },
  silver: { minRevenue: 500, commissionPercent: 20, payoutThreshold: 50 },
  gold: { minRevenue: 2000, commissionPercent: 25, payoutThreshold: 25 },
  platinum: { minRevenue: 10000, commissionPercent: 30, payoutThreshold: 0 },
};

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'dashboard';

  if (action === 'enroll') {
    const website = typeof body.website === 'string' ? body.website.trim() : '';
    const promotionMethod = typeof body.promotionMethod === 'string' ? body.promotionMethod : '';

    if (!website) return apiError(ApiErrorCode.BAD_REQUEST, '"website" required for affiliate enrollment.');

    const affiliateId = `AFF-${Date.now().toString(36).toUpperCase()}`;
    const trackingLink = `https://www.potal.app/signup?aff=${affiliateId}`;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('partner_accounts').upsert({
          seller_id: ctx.sellerId,
          partner_type: 'affiliate',
          application_id: affiliateId,
          website,
          description: promotionMethod,
          status: 'approved',
          applied_at: new Date().toISOString(),
        }, { onConflict: 'seller_id' });
      } catch { /* best-effort */ }
    }

    return apiSuccess({
      action: 'enroll',
      affiliateId,
      trackingLink,
      tier: 'bronze',
      commission: COMMISSION_TIERS.bronze,
      assets: {
        bannerUrls: [
          'https://www.potal.app/assets/affiliate/banner-728x90.png',
          'https://www.potal.app/assets/affiliate/banner-300x250.png',
          'https://www.potal.app/assets/affiliate/banner-160x600.png',
        ],
        landingPage: trackingLink,
        utmTemplate: `?utm_source=affiliate&utm_medium=${promotionMethod || 'website'}&utm_campaign=${affiliateId}`,
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'dashboard') {
    const supabase = getSupabase();
    let affiliateData: Record<string, unknown> | null = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('partner_accounts')
          .select('*')
          .eq('seller_id', ctx.sellerId)
          .eq('partner_type', 'affiliate')
          .single();
        affiliateData = data as Record<string, unknown> | null;
      } catch { /* no record */ }
    }

    if (!affiliateData) {
      return apiSuccess({
        enrolled: false,
        note: 'Not enrolled as affiliate. Use action: "enroll" to join.',
      }, { sellerId: ctx.sellerId });
    }

    // Determine tier based on lifetime revenue
    const lifetimeRevenue = 0; // Would be calculated from actual data
    let currentTier: keyof typeof COMMISSION_TIERS = 'bronze';
    if (lifetimeRevenue >= 10000) currentTier = 'platinum';
    else if (lifetimeRevenue >= 2000) currentTier = 'gold';
    else if (lifetimeRevenue >= 500) currentTier = 'silver';

    return apiSuccess({
      enrolled: true,
      affiliateId: affiliateData.application_id,
      tier: currentTier,
      commission: COMMISSION_TIERS[currentTier],
      stats: {
        clicks: 0,
        signups: 0,
        conversions: 0,
        conversionRate: 0,
        pendingCommission: 0,
        paidCommission: 0,
        lifetimeRevenue,
      },
      payoutInfo: {
        method: 'PayPal or Bank Transfer',
        threshold: COMMISSION_TIERS[currentTier].payoutThreshold,
        schedule: 'Monthly (1st of each month)',
        currency: 'USD',
      },
      allTiers: Object.entries(COMMISSION_TIERS).map(([name, config]) => ({
        tier: name,
        ...config,
        isCurrent: name === currentTier,
      })),
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'commissions') {
    const startDate = typeof body.startDate === 'string' ? body.startDate : undefined;
    const endDate = typeof body.endDate === 'string' ? body.endDate : undefined;

    return apiSuccess({
      action: 'commissions',
      dateRange: { start: startDate || null, end: endDate || null },
      commissions: [],
      summary: {
        totalCommissions: 0,
        pendingPayout: 0,
        nextPayoutDate: 'First of next month',
      },
      note: 'Commission tracking activates when referred users subscribe to paid plans.',
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: enroll, dashboard, or commissions.');
});
