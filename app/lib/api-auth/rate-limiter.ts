/**
 * POTAL API Rate Limiter
 *
 * In-memory sliding window rate limiting per API key.
 * Free: 30/min, Basic: 60/min, Pro: 120/min, Enterprise: unlimited.
 */

interface RateLimitEntry {
  timestamps: number[];
  windowStart: number;
}

// In-memory store (resets on server restart — acceptable for MVP)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const WINDOW_MS = 60 * 1000; // 1 minute window
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - WINDOW_MS * 2;
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
}

/**
 * Check rate limit for an API key.
 * Returns whether the request is allowed and remaining quota.
 */
export function checkRateLimit(
  keyId: string,
  limitPerMinute: number
): RateLimitResult {
  // Unlimited plan
  if (limitPerMinute <= 0) {
    return { allowed: true, remaining: 999999, resetAt: 0 };
  }

  cleanup();

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = store.get(keyId);
  if (!entry) {
    entry = { timestamps: [], windowStart: now };
    store.set(keyId, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.windowStart = now;

  const currentCount = entry.timestamps.length;

  if (currentCount >= limitPerMinute) {
    // Find when the oldest request in window expires
    const oldestInWindow = entry.timestamps[0];
    const resetAt = oldestInWindow + WINDOW_MS;
    return { allowed: false, remaining: 0, resetAt };
  }

  // Allow request
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limitPerMinute - currentCount - 1,
    resetAt: now + WINDOW_MS,
  };
}

/** Reset all rate limit entries — for testing only */
export function _resetAllForTesting(): void {
  store.clear();
}
