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
import { createApiKey } from '@/app/lib/api-auth/keys';

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
      .select('id, user_id, contact_email, company_name, plan_id, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { success: false, error: { message: 'Seller profile not found.' } },
        { status: 404 }
      );
    }

    // Get API keys
    const { data: keys } = await (supabase
      .from('api_keys') as any)
      .select('id, key_prefix, key_type, name, is_active, rate_limit_per_minute, created_at, last_used_at, revoked_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    // Get current month usage
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;

    const { data: usageLogs } = await (supabase
      .from('usage_logs') as any)
      .select('id')
      .eq('seller_id', user.id)
      .gte('created_at', startDate);

    const s = seller as any;

    const planLimits: Record<string, number> = {
      free: 500,
      starter: 5000,
      growth: 25000,
      enterprise: -1,
    };
    const limit = planLimits[s.plan_id] ?? 500;
    const used = usageLogs?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        seller: {
          id: s.id,
          email: s.contact_email,
          companyName: s.company_name,
          plan: s.plan_id,
          subscriptionStatus: s.subscription_status,
          stripeCustomerId: s.stripe_customer_id || null,
          stripeSubscriptionId: s.stripe_subscription_id || null,
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
          period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          used,
          limit: limit === -1 ? 'unlimited' : limit,
          remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - used),
          usagePercent: limit === -1 ? 0 : Math.round((used / limit) * 100),
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
