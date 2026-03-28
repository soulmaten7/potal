/**
 * F135: Reseller Program
 *
 * POST /api/v1/partners/reseller
 * Reseller registration, discount tiers, and client management.
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

const RESELLER_TIERS = {
  authorized: { minClients: 0, discountPercent: 20, revenueShare: 30, support: 'standard', whiteLabel: false },
  preferred: { minClients: 5, discountPercent: 30, revenueShare: 35, support: 'priority', whiteLabel: false },
  premier: { minClients: 20, discountPercent: 40, revenueShare: 40, support: 'dedicated', whiteLabel: true },
};

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'info';

  if (action === 'register') {
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
    const website = typeof body.website === 'string' ? body.website.trim() : '';
    const region = typeof body.region === 'string' ? body.region : '';
    const expectedClients = typeof body.expectedClients === 'number' ? body.expectedClients : 0;

    if (!companyName) return apiError(ApiErrorCode.BAD_REQUEST, '"companyName" required.');
    if (!contactEmail || !contactEmail.includes('@')) return apiError(ApiErrorCode.BAD_REQUEST, '"contactEmail" must be valid email.');

    const resellerId = `RSL-${Date.now().toString(36).toUpperCase()}`;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('partner_accounts').upsert({
          seller_id: ctx.sellerId,
          company_name: companyName,
          contact_email: contactEmail,
          website,
          partner_type: 'reseller',
          application_id: resellerId,
          description: `Region: ${region}, Expected clients: ${expectedClients}`,
          status: 'pending',
          applied_at: new Date().toISOString(),
        }, { onConflict: 'seller_id' });
      } catch { /* best-effort */ }
    }

    return apiSuccess({
      action: 'register',
      resellerId,
      status: 'pending',
      tier: 'authorized',
      benefits: RESELLER_TIERS.authorized,
      nextSteps: [
        '1. Application review (2-3 business days)',
        '2. Agreement signing and onboarding call',
        '3. Access to reseller portal and client management tools',
        '4. Marketing materials and co-branded assets',
      ],
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'dashboard') {
    return apiSuccess({
      action: 'dashboard',
      tier: 'authorized',
      tierBenefits: RESELLER_TIERS.authorized,
      clients: {
        total: 0,
        active: 0,
        churned: 0,
      },
      revenue: {
        monthlyRecurring: 0,
        lifetimeRevenue: 0,
        pendingPayout: 0,
        lastPayout: null,
      },
      allTiers: Object.entries(RESELLER_TIERS).map(([name, config]) => ({
        tier: name,
        ...config,
        isCurrent: name === 'authorized',
      })),
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'add_client') {
    const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
    const clientEmail = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : '';
    const plan = typeof body.plan === 'string' ? body.plan : 'basic';

    if (!clientName) return apiError(ApiErrorCode.BAD_REQUEST, '"clientName" required.');
    if (!clientEmail || !clientEmail.includes('@')) return apiError(ApiErrorCode.BAD_REQUEST, '"clientEmail" required.');

    const clientId = `CLT-${Date.now().toString(36).toUpperCase()}`;

    return apiSuccess({
      action: 'add_client',
      clientId,
      clientName,
      clientEmail,
      plan,
      discount: `${RESELLER_TIERS.authorized.discountPercent}% off retail pricing`,
      status: 'invitation_sent',
      activationLink: `https://www.potal.app/signup?reseller=${ctx.sellerId}&client=${clientId}`,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'pricing') {
    const basePricing = {
      basic: { retail: 9, reseller: 0 },
      pro: { retail: 29, reseller: 0 },
      enterprise: { retail: 99, reseller: 0 },
    };

    const discount = RESELLER_TIERS.authorized.discountPercent / 100;
    for (const plan of Object.values(basePricing)) {
      plan.reseller = Math.round(plan.retail * (1 - discount) * 100) / 100;
    }

    return apiSuccess({
      action: 'pricing',
      tier: 'authorized',
      discountPercent: RESELLER_TIERS.authorized.discountPercent,
      pricing: Object.entries(basePricing).map(([name, prices]) => ({
        plan: name,
        retailPrice: prices.retail,
        resellerPrice: prices.reseller,
        marginPerClient: Math.round((prices.retail - prices.reseller) * 100) / 100,
      })),
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'info') {
    return apiSuccess({
      program: 'POTAL Reseller Program',
      description: 'White-label POTAL services under your brand. Manage clients, set margins, earn recurring revenue.',
      tiers: Object.entries(RESELLER_TIERS).map(([name, config]) => ({
        tier: name,
        ...config,
      })),
      actions: ['register', 'dashboard', 'add_client', 'pricing', 'info'],
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: info, register, dashboard, add_client, or pricing.');
});
