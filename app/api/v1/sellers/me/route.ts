/**
 * POTAL API v1 — /api/v1/sellers/me
 *
 * Get current seller profile from Supabase auth session.
 * Uses the Supabase auth token (not API key).
 *
 * GET /api/v1/sellers/me
 * Headers: Authorization: Bearer <supabase_access_token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { message: 'Authorization header required.' } },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const supabase = getServiceClient();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired session.' } },
        { status: 401 }
      );
    }

    // Get seller record
    const { data: seller, error: sellerError } = await (supabase
      .from('sellers') as any)
      .select('id, user_id, contact_email, company_name, plan_id, subscription_status, billing_customer_id, billing_subscription_id, current_period_end, created_at')
      .eq('user_id', user.id)
      .single();

    let sellerRecord = seller as any;

    if (sellerError || !seller) {
      // Auto-create seller profile for authenticated users
      const meta = user.user_metadata || {};
      const { data: newSeller, error: createError } = await (supabase
        .from('sellers') as any)
        .insert({
          user_id: user.id,
          contact_email: user.email,
          company_name: meta.company_name || meta.full_name || user.email?.split('@')[0] || 'My Company',
          country: typeof meta.country === 'string' ? meta.country.toUpperCase() : '',
          industry: meta.industry || '',
          plan_id: 'free',
          subscription_status: 'active',
          trial_type: 'monthly',
          trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, user_id, contact_email, company_name, plan_id, subscription_status, billing_customer_id, billing_subscription_id, current_period_end, created_at')
        .single();

      if (createError || !newSeller) {
        return NextResponse.json(
          { success: false, error: { message: 'Failed to create seller profile.', details: createError?.message } },
          { status: 500 }
        );
      }
      sellerRecord = newSeller;
    }

    const s = sellerRecord;

    // Get API keys (use seller.id, not auth user.id)
    const sellerId = s.id;
    const { data: keys } = await (supabase
      .from('api_keys') as any)
      .select('id, key_prefix, key_type, name, is_active, rate_limit_per_minute, created_at, last_used_at, revoked_at')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Get total usage count (no monthly limit — Forever Free)
    const now = new Date();

    const { count: totalUsed } = await (supabase
      .from('usage_logs') as any)
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    const used = totalUsed || 0;

    return NextResponse.json({
      success: true,
      data: {
        seller: {
          id: s.id,
          email: s.contact_email,
          companyName: s.company_name,
          plan: s.plan_id,
          subscriptionStatus: s.subscription_status,
          billingCustomerId: s.billing_customer_id || null,
          billingSubscriptionId: s.billing_subscription_id || null,
          currentPeriodEnd: s.current_period_end || null,
          createdAt: s.created_at,
        },
        keys: (keys || []).map((k: any) => ({
          id: k.id,
          prefix: k.key_prefix,
          type: k.key_type,
          name: k.name,
          isActive: k.is_active,
          rateLimitPerMinute: k.rate_limit_per_minute,
          createdAt: k.created_at,
          lastUsedAt: k.last_used_at,
        })),
        usage: {
          period: 'all-time',
          used,
          limit: 'unlimited',
          remaining: 'unlimited',
          usagePercent: 0,
          rateLimitPerSecond: 20,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
