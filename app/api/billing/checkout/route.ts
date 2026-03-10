/**
 * POTAL Billing — POST /api/billing/checkout
 *
 * Creates a Paddle Checkout session (transaction) for plan upgrade.
 * Requires Supabase auth token (Bearer).
 *
 * Body: { planId: "basic" | "pro" | "enterprise", billingCycle?: "monthly" | "annual" }
 *
 * Returns: { url: "https://checkout.paddle.com/..." }
 *
 * Paddle Checkout 방식:
 * - Paddle.js overlay (프론트엔드) 또는
 * - Transaction API → checkout URL (백엔드, 여기서 사용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  PLAN_CONFIG,
  getPaddleHeaders,
  getPaddleBaseUrl,
  type PlanId,
} from '@/app/lib/billing/paddle';

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
        { success: false, error: 'Invalid plan ID. Must be: basic, pro, or enterprise' },
        { status: 400 }
      );
    }

    const billingCycle = (body.billingCycle as string) || 'monthly';
    const plan = PLAN_CONFIG[planId];
    const priceId = billingCycle === 'annual' ? plan.paddlePriceIdAnnual : plan.paddlePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'This plan does not require payment (free) or is not configured yet' },
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.potal.app';

    // Create Paddle Transaction (generates checkout URL)
    const res = await fetch(`${getPaddleBaseUrl()}/transactions`, {
      method: 'POST',
      headers: getPaddleHeaders(),
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer_email: seller.contact_email,
        custom_data: {
          potal_seller_id: seller.id,
          potal_plan_id: planId,
          potal_billing_cycle: billingCycle,
        },
        checkout: {
          url: `${baseUrl}/dashboard?checkout=success&plan=${planId}`,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: `Failed to create checkout: ${JSON.stringify(err)}` },
        { status: 500 }
      );
    }

    const transaction = await res.json();
    const checkoutUrl = transaction.data?.checkout?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { success: false, error: 'Checkout URL not returned from Paddle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: checkoutUrl },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
