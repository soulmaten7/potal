/**
 * Webhook Event Log — atomic idempotency + event logging.
 *
 * Uses webhook_events table with UNIQUE(source, event_id) constraint
 * for race-condition-safe duplicate prevention.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Atomically check + mark a webhook event as processed.
 * INSERT with ON CONFLICT (source, event_id) DO NOTHING.
 * Returns true if already processed (skip), false if newly inserted (process).
 */
export async function isEventProcessed(source: string, eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data } = await (supabase.from('webhook_events') as any)
      .insert({ source, event_id: eventId, status: 'processing' })
      .select('id');

    // If insert succeeded (data has row), this is new
    if (data && data.length > 0) return false;

    // Conflict = already exists = already processed
    return true;
  } catch {
    // On conflict error, already processed
    return true;
  }
}

/**
 * Log webhook event result (success or failure).
 */
export async function logWebhookEvent(params: {
  source: string;
  eventId: string;
  topic: string;
  status: 'success' | 'error';
  errorMessage?: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await (supabase.from('webhook_events') as any)
      .update({
        topic: params.topic,
        status: params.status,
        error_message: params.errorMessage || null,
      })
      .eq('source', params.source)
      .eq('event_id', params.eventId);
  } catch {
    // Fire-and-forget
  }
}
