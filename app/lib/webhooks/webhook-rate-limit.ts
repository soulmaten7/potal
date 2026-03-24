/**
 * Inbound Webhook Rate Limiter
 *
 * Limits inbound webhook events per source to prevent abuse.
 * In-memory sliding window: 100 events per minute per source identifier.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 100;
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - WINDOW_MS * 2;
  for (const [key, entry] of store) {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  }
}

/**
 * Check if an inbound webhook from this source is allowed.
 * @param sourceId - Unique identifier (e.g. "paddle", "shopify_shop.myshopify.com")
 * @returns true if allowed, false if rate limited
 */
export function checkWebhookRateLimit(sourceId: string): boolean {
  cleanup();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = store.get(sourceId);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(sourceId, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= MAX_EVENTS_PER_WINDOW) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}
