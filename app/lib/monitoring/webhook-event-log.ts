/**
 * Webhook Event Log — idempotency + event logging for all webhook sources.
 *
 * Uses health_check_logs table (already exists) for event tracking.
 * Checks event_id uniqueness to prevent duplicate processing.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Check if a webhook event has already been processed (idempotency).
 * Returns true if already processed (skip), false if new (process).
 */
export async function isEventProcessed(source: string, eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false; // No DB = can't check, proceed

  try {
    const { data } = await supabase
      .from('health_check_logs')
      .select('id')
      .eq('check_type', `webhook_event_${source}`)
      .eq('details', eventId)
      .limit(1);

    return data !== null && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Log a webhook event (success or failure).
 */
export async function logWebhookEvent(params: {
  source: string;   // 'paddle' | 'shopify' | 'bigcommerce'
  eventId: string;
  topic: string;
  status: 'success' | 'error';
  errorMessage?: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('health_check_logs')
      .insert({
        check_type: `webhook_event_${params.source}`,
        status: params.status === 'success' ? 'healthy' : 'degraded',
        details: params.eventId,
        response_time_ms: 0,
        metadata: {
          topic: params.topic,
          error: params.errorMessage || null,
          processed_at: new Date().toISOString(),
        },
      });
  } catch {
    // Fire-and-forget — don't block webhook response
  }
}
