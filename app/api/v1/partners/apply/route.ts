/**
 * F146: Partner Management — application + onboarding.
 *
 * POST /api/v1/partners/apply
 * Body: { companyName, contactEmail, website?, partnerType, description? }
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

const PARTNER_TYPES = ['technology', 'logistics', 'customs_broker', 'accounting', 'marketplace', 'reseller', 'affiliate'];

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
  const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : undefined;
  const partnerType = typeof body.partnerType === 'string' ? body.partnerType.toLowerCase() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;

  if (!companyName) return apiError(ApiErrorCode.BAD_REQUEST, '"companyName" required.');
  if (!contactEmail || !contactEmail.includes('@')) return apiError(ApiErrorCode.BAD_REQUEST, '"contactEmail" must be a valid email.');
  if (!PARTNER_TYPES.includes(partnerType)) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"partnerType" must be: ${PARTNER_TYPES.join(', ')}`);
  }

  const applicationId = `PTNR-${Date.now().toString(36).toUpperCase()}`;

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('partner_accounts').upsert({
        seller_id: context.sellerId,
        company_name: companyName,
        contact_email: contactEmail,
        website,
        partner_type: partnerType,
        description,
        status: 'pending',
        application_id: applicationId,
        applied_at: new Date().toISOString(),
      }, { onConflict: 'seller_id' });
    } catch { /* best-effort */ }
  }

  return apiSuccess({
    applicationId,
    status: 'pending',
    companyName,
    partnerType,
    nextSteps: [
      '1. Application received — review within 2-3 business days.',
      '2. If approved, API keys with partner tier access will be issued.',
      '3. Access to partner dashboard, revenue sharing, and co-marketing.',
    ],
    partnerBenefits: {
      technology: ['API access', 'Co-marketing', 'Technical support', 'Revenue share 20%'],
      logistics: ['Integrated tracking', 'Rate API access', 'Co-branded labels', 'Revenue share 15%'],
      customs_broker: ['Classification API', 'Compliance tools', 'Client referrals', 'Revenue share 25%'],
      reseller: ['White-label access', 'Volume discounts', 'Dedicated account manager', 'Revenue share 30%'],
    }[partnerType] || ['API access', 'Partner support'],
  }, { sellerId: context.sellerId, plan: context.planId });
});
