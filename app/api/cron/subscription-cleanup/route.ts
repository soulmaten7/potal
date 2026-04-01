/**
 * POTAL Cron — Subscription Cleanup
 *
 * Runs daily. Finds canceled subscriptions whose billing period has ended
 * and downgrades them to the free plan.
 *
 * This ensures users keep access until their paid period expires,
 * then cleanly transition to free.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find sellers with canceled subscription whose period has ended
  const now = new Date().toISOString();

  const { data: expiredSellers, error: fetchError } = await (supabase
    .from('sellers') as any)
    .select('id, plan_id, current_period_end, billing_customer_id')
    .eq('subscription_status', 'canceled')
    .neq('plan_id', 'free')
    .lt('current_period_end', now);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredSellers || expiredSellers.length === 0) {
    return NextResponse.json({ cleaned: 0, message: 'No expired subscriptions' });
  }

  // Downgrade each to free
  const ids = expiredSellers.map((s: any) => s.id);

  const { error: updateError } = await (supabase
    .from('sellers') as any)
    .update({
      plan_id: 'free',
      subscription_status: 'inactive',
      billing_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    cleaned: ids.length,
    sellers: expiredSellers.map((s: any) => ({
      id: s.id,
      previousPlan: s.plan_id,
      periodEnd: s.current_period_end,
    })),
  });
}
