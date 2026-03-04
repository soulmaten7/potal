/**
 * POTAL Billing — POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session.
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
import { getStripe } from '@/app/lib/billing/stripe';
import { getOrCreateStripeCustomer } from '@/app/lib/billing/subscription';

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

    // Get seller
    const { data: seller } = await (supabase.from('sellers') as any)
      .select('id, user_id, contact_email, company_name, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!seller) {
      return NextResponse.json(
        { success: false, error: 'Seller profile not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    const customerId = seller.stripe_customer_id ||
      await getOrCreateStripeCustomer(seller.id, seller.contact_email, seller.company_name);

    // Create portal session
    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://potal-x1vl.vercel.app';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({
      success: true,
      data: { url: session.url },
    });
  } catch (err) {
    console.error('Portal error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
