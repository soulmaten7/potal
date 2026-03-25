/**
 * F146: Partner Dashboard — stats, referrals, revenue.
 *
 * GET /api/v1/partners/dashboard
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

export const GET = withApiAuth(async (_req: NextRequest, context: ApiAuthContext) => {
  const supabase = getSupabase();

  let partnerInfo: Record<string, unknown> | null = null;
  let referralCount = 0;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('partner_accounts')
        .select('company_name, partner_type, status, application_id, applied_at')
        .eq('seller_id', context.sellerId)
        .single();
      partnerInfo = data;

      const { count } = await supabase
        .from('partner_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', context.sellerId);
      referralCount = count || 0;
    } catch { /* no partner record */ }
  }

  if (!partnerInfo || String(partnerInfo.status) !== 'approved') {
    return apiSuccess({
      isPartner: false,
      status: partnerInfo ? String(partnerInfo.status) : 'not_applied',
      note: partnerInfo
        ? `Application ${partnerInfo.status}. Contact partners@potal.app for status updates.`
        : 'Not a partner yet. Apply via POST /api/v1/partners/apply.',
    }, { sellerId: context.sellerId });
  }

  return apiSuccess({
    isPartner: true,
    companyName: partnerInfo.company_name,
    partnerType: partnerInfo.partner_type,
    status: 'approved',
    applicationId: partnerInfo.application_id,
    stats: {
      totalReferrals: referralCount,
      activeClients: 0,
      monthlyRevenue: 0,
      lifetimeRevenue: 0,
    },
    resources: {
      apiDocs: 'https://www.potal.app/developers',
      partnerPortal: 'https://www.potal.app/partners',
      supportEmail: 'partners@potal.app',
    },
  }, { sellerId: context.sellerId, plan: context.planId });
});
