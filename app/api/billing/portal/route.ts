/**
 * POTAL Billing — POST /api/billing/portal
 *
 * Returns the Paddle Customer Portal URL.
 * Allows sellers to manage their subscription:
 *   - View invoices
 *   - Update payment method
 *   - Cancel subscription
 *   - Upgrade/downgrade plan
 *
 * Requires Supabase auth token (Bearer).
 *
 * Paddle 방식: Subscription → management_urls.cancel / update_payment_method
 * 또는 Paddle.js의 Paddle.Checkout.open() + Retain 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaddleHeaders, getPaddleBaseUrl } from '@/app/lib/billing/paddle';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
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

    // Get seller with billing info
    const { data: seller } = await (supabase.from('sellers') as any)
      .select('id, billing_customer_id, billing_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    if (!seller.billing_subscription_id) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found. Please upgrade first.' },
        { status: 400 }
      );
    }

    // Get Paddle subscription details (includes management URLs)
    const res = await fetch(
      `${getPaddleBaseUrl()}/subscriptions/${seller.billing_subscription_id}`,
      {
        method: 'GET',
        headers: getPaddleHeaders(),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve subscription details' },
        { status: 500 }
      );
    }

    const subscription = await res.json();
    const managementUrls = subscription.data?.management_urls;

    // Paddle provides update_payment_method and cancel URLs
    const updatePaymentUrl = managementUrls?.update_payment_method;
    const cancelUrl = managementUrls?.cancel;

    return NextResponse.json({
      success: true,
      data: {
        updatePaymentUrl: updatePaymentUrl || null,
        cancelUrl: cancelUrl || null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to get portal URL' },
      { status: 500 }
    );
  }
}
