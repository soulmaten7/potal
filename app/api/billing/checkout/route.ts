/**
 * POTAL Billing — POST /api/billing/checkout
 *
 * Creates a Stripe Checkout session for plan upgrade.
 * Requires Supabase auth token (Bearer).
 *
 * Body: { planId: "growth" | "enterprise" }
 *
 * Returns: { url: "https://checkout.stripe.com/..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, PLAN_CONFIG, type PlanId } from '@/app/lib/billing/stripe';
import { getOrCreateStripeCustomer } from '@/app/lib/billing/subscription';

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
        { success: false, error: 'Invalid plan ID. Must be: growth or enterprise' },
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIG[planId];
    if (!plan.stripePriceId) {
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

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      seller.id,
      seller.contact_email,
      seller.company_name
    );

    // Create Checkout session
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://potal-x1vl.vercel.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          potal_seller_id: seller.id,
          potal_plan_id: planId,
        },
      },
      success_url: `${baseUrl}/dashboard?checkout=success&plan=${planId}`,
      cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
      metadata: {
        potal_seller_id: seller.id,
        potal_plan_id: planId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
