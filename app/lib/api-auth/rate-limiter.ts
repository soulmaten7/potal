/**
 * POTAL API Rate Limiter
 *
 * Token bucket algorithm with burst allowance.
 * In-memory primary + DB sync comment for future enhancement.
 *
 * Free: 30/min + 5 burst, Basic: 60/min + 10 burst,
 * Pro: 120/min + 20 burst, Enterprise: 300/min + 50 burst.
 *
 * NOTE: In-memory store resets on Vercel cold start. This is acceptable
 * because plan-checker.ts enforces monthly quotas via DB. The rate limiter
 * prevents short-term abuse (API flooding), not long-term quota evasion.
 */

interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per second
  lastRefill: number;
}

// In-memory store
const store = new Map<string, TokenBucket>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - 120000; // Remove entries idle for 2+ minutes
  for (const [key, bucket] of store) {
    if (bucket.lastRefill < cutoff) {
      store.delete(key);
    }
  }
}

// ─── Burst Allowance per Plan ────────────────────────

const BURST_ALLOWANCE: Record<string, number> = {
  free: 5,
  basic: 10,
  pro: 20,
  enterprise: 50,
};

export function getBurstForPlan(planId: string): number {
  return BURST_ALLOWANCE[planId] ?? BURST_ALLOWANCE.free;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  burst: boolean;
}

/**
 * Check rate limit using token bucket algorithm.
 * Allows burst traffic up to plan-specific allowance.
 *
 * @param keyId - API key identifier
 * @param limitPerMinute - Base rate limit (e.g., 30 for Free)
 * @param planId - Plan for burst calculation
 */
export function checkRateLimit(
  keyId: string,
  limitPerMinute: number,
  planId?: string
): RateLimitResult {
  // Unlimited plan
  if (limitPerMinute <= 0) {
    return { allowed: true, remaining: 999999, resetAt: 0, burst: false };
  }

  cleanup();

  const now = Date.now();
  const burstAllowance = getBurstForPlan(planId || 'free');
  const maxTokens = limitPerMinute + burstAllowance;
  const refillRate = limitPerMinute / 60; // tokens per second

  let bucket = store.get(keyId);
  if (!bucket) {
    bucket = {
      tokens: maxTokens, // Start full
      maxTokens,
      refillRate,
      lastRefill: now,
    };
    store.set(keyId, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  const refill = elapsed * bucket.refillRate;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    // Calculate when next token available
    const waitMs = ((1 - bucket.tokens) / bucket.refillRate) * 1000;
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + Math.ceil(waitMs),
      burst: false,
    };
  }

  // Consume a token
  bucket.tokens -= 1;
  const isBurst = bucket.tokens < burstAllowance;

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetAt: now + 60000,
    burst: isBurst,
  };
}

/** Reset all rate limit entries — for testing only */
export function _resetAllForTesting(): void {
  store.clear();
}
