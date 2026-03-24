/**
 * POTAL Cron — API Key Monitor
 *
 * Weekly check (Mon 07:00 UTC) for:
 * 1. Keys older than 90 days (rotation recommended)
 * 2. Keys expiring within 7 days (expiration warning)
 * 3. Keys unused for 30+ days (cleanup candidate)
 *
 * Results logged to health_check_logs for Morning Brief visibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DAYS_OLD_THRESHOLD = 90;
const DAYS_EXPIRING_THRESHOLD = 7;
const DAYS_UNUSED_THRESHOLD = 30;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const now = new Date();

  try {
    // Fetch all active keys
    const { data: keys, error } = await (supabase.from('api_keys') as any)
      .select('id, seller_id, key_prefix, created_at, last_used_at, expires_at, is_active')
      .eq('is_active', true)
      .is('revoked_at', null);

    if (error || !keys) {
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    const alerts: { type: string; key_prefix: string; seller_id: string; detail: string }[] = [];

    for (const key of keys) {
      const createdAt = new Date(key.created_at);
      const ageDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // 1. Old keys (90+ days)
      if (ageDays >= DAYS_OLD_THRESHOLD) {
        alerts.push({
          type: 'key_old',
          key_prefix: key.key_prefix,
          seller_id: key.seller_id,
          detail: `Key is ${ageDays} days old. Rotation recommended.`,
        });
      }

      // 2. Expiring keys (within 7 days)
      if (key.expires_at) {
        const expiresAt = new Date(key.expires_at);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 0 && daysUntilExpiry <= DAYS_EXPIRING_THRESHOLD) {
          alerts.push({
            type: 'key_expiring',
            key_prefix: key.key_prefix,
            seller_id: key.seller_id,
            detail: `Key expires in ${daysUntilExpiry} day(s).`,
          });
        }
      }

      // 3. Unused keys (30+ days)
      if (key.last_used_at) {
        const lastUsed = new Date(key.last_used_at);
        const unusedDays = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        if (unusedDays >= DAYS_UNUSED_THRESHOLD) {
          alerts.push({
            type: 'key_unused',
            key_prefix: key.key_prefix,
            seller_id: key.seller_id,
            detail: `Key unused for ${unusedDays} days. Consider revoking.`,
          });
        }
      } else if (ageDays >= DAYS_UNUSED_THRESHOLD) {
        // Never used and old
        alerts.push({
          type: 'key_unused',
          key_prefix: key.key_prefix,
          seller_id: key.seller_id,
          detail: `Key never used since creation (${ageDays} days ago).`,
        });
      }
    }

    // Log results
    await (supabase.from('health_check_logs') as any).insert({
      overall_status: alerts.length > 0 ? 'yellow' : 'green',
      checks: [{
        name: 'api_key_monitor',
        status: alerts.length > 0 ? 'warn' : 'pass',
        total_keys: keys.length,
        alerts_count: alerts.length,
        alerts: alerts.slice(0, 50), // Cap at 50 for log size
      }],
      duration_ms: Date.now() - now.getTime(),
    });

    return NextResponse.json({
      success: true,
      data: {
        total_keys: keys.length,
        alerts_count: alerts.length,
        alerts: alerts.slice(0, 50),
        checked_at: now.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Monitor check failed' }, { status: 500 });
  }
}
