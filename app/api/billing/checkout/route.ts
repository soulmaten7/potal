/**
 * POTAL Billing — POST /api/billing/checkout
 *
 * Creates a LemonSqueezy Checkout session for plan upgrade.
 * Requires Supabase auth token (Bearer).
 *
 * Body: { planId: "starter" | "growth" | "enterprise" }
 *
 * Returns: { url: "https://potal.lemonsqueezy.com/checkout/..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { initLemonSqueezy, PLAN_CONFIG, getStoreId, type PlanId } from '@/app/lib/billing/lemonsqueezy';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const supabase = getServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parse plan
    const body = await req.json();
    const planId = body.planId as PlanId;

    if (!planId || !PLAN_CONFIG[planId]) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID. Must be: starter, growth, or enterprise' },
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIG[planId];
    if (!plan.variantId) {
      return NextResponse.json(
        { success: false, error: 'This plan does not require payment (free or custom)' },
        { status: 400 }
      );
    }

    // Get seller profile
    const { data: seller } = await (supabase.from('sellers') as any)
      .select('id, user_id, contact_email, company_name')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Initialize LemonSqueezy
    initLemonSqueezy();
    const storeId = getStoreId();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://potal-x1vl.vercel.app';

    // Create LemonSqueezy Checkout
    const { data: checkout, error: checkoutError } = await createCheckout(storeId, plan.variantId, {
      checkoutData: {
        email: seller.contact_email,
        name: seller.company_name || seller.contact_email,
        custom: {
          potal_seller_id: seller.id,
          potal_plan_id: planId,
        },
      },
      productOptions: {
        redirectUrl: `${baseUrl}/dashboard?checkout=success&plan=${planId}`,
        receiptButtonText: 'Go to POTAL Dashboard',
        receiptLinkUrl: `${baseUrl}/dashboard`,
      },
      checkoutOptions: {
        embed: false,
      },
    });

    if (checkoutError || !checkout) {
      return NextResponse.json(
        { success: false, error: `Failed to create checkout: ${checkoutError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: checkout.data.attributes.url },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
