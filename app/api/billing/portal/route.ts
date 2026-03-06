/**
 * POTAL Billing — POST /api/billing/portal
 *
 * Returns the LemonSqueezy Customer Portal URL.
 * Allows sellers to manage their subscription:
 *   - View invoices
 *   - Update payment method
 *   - Cancel subscription
 *   - Upgrade/downgrade plan
 *
 * Requires Supabase auth token (Bearer).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription } from '@lemonsqueezy/lemonsqueezy.js';
import { initLemonSqueezy } from '@/app/lib/billing/lemonsqueezy';

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

    // Get subscription to retrieve customer portal URL
    initLemonSqueezy();
    const { data: subscription, error: subError } = await getSubscription(
      seller.billing_subscription_id
    );

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve subscription details' },
        { status: 500 }
      );
    }

    // LemonSqueezy provides customer portal URL in subscription attributes
    const portalUrl = (subscription.data.attributes as any).urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json(
        { success: false, error: 'Customer portal URL not available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { url: portalUrl },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to get portal URL' },
      { status: 500 }
    );
  }
}
