/**
 * POTAL API Rate Limiter
 *
 * Simple per-second rate limiter: 20 requests/second per identifier (IP or API key).
 * In-memory sliding window counter.
 *
 * CW22-S4c: Replaced token bucket + monthly quota with simple per-second limit.
 * Monthly quotas removed entirely — Forever Free has no call caps.
 */

interface WindowCounter {
  count: number;
  windowStart: number; // ms timestamp
}

// In-memory store keyed by identifier (API key ID or IP)
const store = new Map<string, WindowCounter>();

const MAX_REQUESTS_PER_SECOND = 20;
const WINDOW_MS = 1000;

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - 60000; // Remove entries idle for 1+ minute
  for (const [key, entry] of store) {
    if (entry.windowStart < cutoff) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  burst: boolean;
}

/**
 * Check rate limit: max 20 requests per second per identifier.
 *
 * @param identifier - API key ID, IP address, or combined key
 * @param _limitPerMinute - DEPRECATED, ignored. Kept for backward compatibility.
 * @param _planId - DEPRECATED, ignored.
 */
export function checkRateLimit(
  identifier: string,
  _limitPerMinute?: number,
  _planId?: string
): RateLimitResult {
  cleanup();

  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window
    entry = { count: 0, windowStart: now };
    store.set(identifier, entry);
  }

  if (entry.count >= MAX_REQUESTS_PER_SECOND) {
    const resetAt = entry.windowStart + WINDOW_MS;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      burst: false,
    };
  }

  entry.count += 1;

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_SECOND - entry.count,
    resetAt: entry.windowStart + WINDOW_MS,
    burst: false,
  };
}

export function getBurstForPlan(_planId: string): number {
  return 0; // No burst concept — flat 20/sec for everyone
}

/** Reset all rate limit entries — for testing only */
export function _resetAllForTesting(): void {
  store.clear();
}
