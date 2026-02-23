/**
 * POTAL SearchLogger — Phase 1: Observe
 *
 * 검색 데이터를 비동기로 Supabase에 저장.
 * 검색 성능에 절대 영향을 주지 않음 (fire-and-forget).
 */

import { createClient } from '@supabase/supabase-js';

export interface SearchLogEntry {
  session_id: string;
  query: string;
  intent: string;
  intent_confidence: number;
  is_question_query: boolean;
  search_query_used: string;  // actual query sent to providers
  category: string;
  strategy: string;
  provider_results: Record<string, number>;  // { amazon: 5, walmart: 3, ... }
  total_results: number;
  fraud_removed: number;
  ai_filtered: number;
  response_time_ms: number;
  ai_cost_usd: number;
  used_ai_analysis: boolean;  // did QueryAgent use AI or deterministic?
  error?: string;
}

export interface SearchSignal {
  search_id: string;
  signal_type: 'click' | 'add_wishlist' | 're_search' | 'bounce' | 'filter_apply' | 'photo_search';
  product_id?: string;
  product_site?: string;
  metadata?: Record<string, unknown>;
}

// ─── Signal Batch Queue ───
const signalBatch: SearchSignal[] = [];
const BATCH_SIZE = 20;
const BATCH_FLUSH_INTERVAL = 5000; // 5 seconds

let flushTimer: NodeJS.Timeout | null = null;

// ─── Supabase Client ───
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

/**
 * Generate a unique session ID per browser session
 */
export function generateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a simple UUID-like string
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Client-side: try crypto.randomUUID, fallback to date-based
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Flush batched signals to Supabase (fire-and-forget)
 */
async function flushSignals() {
  if (signalBatch.length === 0) return;

  const toFlush = [...signalBatch];
  signalBatch.length = 0; // clear immediately
  flushTimer = null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return; // silently skip if credentials missing
  }

  try {
    const supabase = getSupabaseClient();
    await (supabase.from('search_signals').insert(toFlush as any).select() as unknown as Promise<any>);
  } catch (err) {
    // Fire-and-forget: never throw or log (to avoid console pollution)
  }
}

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush() {
  if (flushTimer === null) {
    flushTimer = setTimeout(() => {
      flushSignals().catch(() => {});
    }, BATCH_FLUSH_INTERVAL);
  }
}

/**
 * Log a search and send to Supabase (async, never awaited)
 *
 * Usage:
 *   logSearch({
 *     session_id: sessionId,
 *     query: "airpods",
 *     intent: "PRODUCT_SPECIFIC",
 *     ...
 *   });
 *   // Returns immediately, Supabase call happens in background
 */
export function logSearch(entry: SearchLogEntry) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return; // skip if credentials missing
  }

  // Fire-and-forget: start async without awaiting
  (async () => {
    try {
      const supabase = getSupabaseClient();
      const query = supabase.from('search_logs').insert([entry] as any);
      await (query.select() as unknown as Promise<any>);
    } catch (err) {
      // swallow error (never affects search path)
    }
  })().catch(() => {});
}

/**
 * Log a user signal (click, wishlist, re-search, bounce, filter_apply, photo_search)
 * Batches signals in memory, flushes every 5s or when batch hits 20 items
 *
 * Usage:
 *   logSignal({
 *     search_id: "abc123",
 *     signal_type: "click",
 *     product_id: "prod456",
 *     product_site: "amazon",
 *   });
 */
export function logSignal(signal: SearchSignal) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return; // skip if credentials missing
  }

  signalBatch.push(signal);

  // Auto-flush when batch hits size limit
  if (signalBatch.length >= BATCH_SIZE) {
    flushSignals().catch(() => {});
  } else {
    scheduleFlush();
  }
}

/**
 * Flush all pending signals immediately (useful on page unload)
 */
export function flushPendingSignals() {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  return flushSignals().catch(() => {});
}
