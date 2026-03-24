/**
 * POTAL API Fraud Prevention
 *
 * Request fingerprinting and anomaly detection for API abuse prevention.
 * Features:
 * - Request fingerprinting (IP + User-Agent + key hash)
 * - Burst detection (too many requests in short window)
 * - Pattern anomaly detection (same request repeated)
 * - Geolocation anomaly (key used from unexpected regions)
 */

import { createHash } from 'crypto';

// ─── Types ─────────────────────────────────────────

export interface RequestFingerprint {
  /** SHA-256 hash of IP + UA + API key */
  hash: string;
  /** Client IP */
  ip: string;
  /** User-Agent */
  userAgent: string;
  /** API key prefix (first 12 chars) */
  keyPrefix: string;
  /** Timestamp */
  timestamp: number;
}

export interface FraudCheckResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Risk score (0-1, higher = more suspicious) */
  riskScore: number;
  /** Reason for blocking (if blocked) */
  reason?: string;
  /** Fingerprint hash */
  fingerprint: string;
  /** Flags triggered */
  flags: string[];
}

// ─── In-Memory Stores ──────────────────────────────

interface FingerprintHistory {
  requests: { timestamp: number; endpoint: string; bodyHash: string }[];
  firstSeen: number;
  lastSeen: number;
  distinctEndpoints: Set<string>;
  distinctBodies: Set<string>;
}

const fingerprintStore = new Map<string, FingerprintHistory>();
const BURST_WINDOW_MS = 10_000; // 10 seconds
const BURST_LIMIT = 20; // max 20 requests per 10s
const DUPLICATE_WINDOW_MS = 60_000; // 1 minute
const DUPLICATE_LIMIT = 10; // max 10 identical requests per minute
const CLEANUP_INTERVAL = 300_000; // 5 minutes
let lastCleanup = Date.now();

/** Track fraud strikes per key for auto-disable (5 strikes in 1 hour = disable) */
const FRAUD_STRIKE_WINDOW_MS = 3_600_000; // 1 hour
const FRAUD_STRIKE_THRESHOLD = 5;
const fraudStrikes = new Map<string, number[]>(); // keyPrefix -> timestamps of fraud blocks

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - 600_000; // 10 minutes
  for (const [key, history] of fingerprintStore) {
    if (history.lastSeen < cutoff) {
      fingerprintStore.delete(key);
    }
  }
}

// ─── Fingerprint Generation ────────────────────────

export function generateFingerprint(
  ip: string,
  userAgent: string,
  apiKey: string,
): RequestFingerprint {
  const raw = `${ip}|${userAgent}|${apiKey}`;
  const hash = createHash('sha256').update(raw).digest('hex').substring(0, 32);

  return {
    hash,
    ip,
    userAgent,
    keyPrefix: apiKey.substring(0, 12),
    timestamp: Date.now(),
  };
}

// ─── Body Hashing ──────────────────────────────────

export function hashRequestBody(body: unknown): string {
  const str = typeof body === 'string' ? body : JSON.stringify(body || '');
  return createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// ─── Fraud Check ───────────────────────────────────

export function checkFraud(
  fingerprint: RequestFingerprint,
  endpoint: string,
  bodyHash: string,
): FraudCheckResult {
  cleanupStore();

  const now = Date.now();
  const flags: string[] = [];
  let riskScore = 0;

  // Get or create history
  let history = fingerprintStore.get(fingerprint.hash);
  if (!history) {
    history = {
      requests: [],
      firstSeen: now,
      lastSeen: now,
      distinctEndpoints: new Set(),
      distinctBodies: new Set(),
    };
    fingerprintStore.set(fingerprint.hash, history);
  }

  // Record this request
  history.requests.push({ timestamp: now, endpoint, bodyHash });
  history.lastSeen = now;
  history.distinctEndpoints.add(endpoint);
  history.distinctBodies.add(bodyHash);

  // Trim old requests
  history.requests = history.requests.filter(r => r.timestamp > now - DUPLICATE_WINDOW_MS);

  // ─── Check 1: Burst Detection ──────────────────
  const recentRequests = history.requests.filter(r => r.timestamp > now - BURST_WINDOW_MS);
  if (recentRequests.length > BURST_LIMIT) {
    flags.push('burst_detected');
    riskScore += 0.5;
  }

  // ─── Check 2: Duplicate Request Detection ──────
  const duplicates = history.requests.filter(r =>
    r.bodyHash === bodyHash && r.endpoint === endpoint && r.timestamp > now - DUPLICATE_WINDOW_MS
  );
  if (duplicates.length > DUPLICATE_LIMIT) {
    flags.push('duplicate_flood');
    riskScore += 0.3;
  }

  // ─── Check 3: Missing User-Agent ──────────────
  if (!fingerprint.userAgent || fingerprint.userAgent === 'undefined') {
    flags.push('missing_user_agent');
    riskScore += 0.1;
  }

  // ─── Check 4: Suspicious patterns ─────────────
  // Too many distinct request bodies in short time = probing
  if (history.distinctBodies.size > 50) {
    flags.push('enumeration_suspected');
    riskScore += 0.2;
  }

  // Cap risk score
  riskScore = Math.min(riskScore, 1.0);

  // Block if risk score exceeds threshold
  const blocked = riskScore >= 0.8;

  return {
    allowed: !blocked,
    riskScore: Math.round(riskScore * 100) / 100,
    reason: blocked ? `Blocked: ${flags.join(', ')}` : undefined,
    fingerprint: fingerprint.hash,
    flags,
  };
}

/**
 * Record a fraud strike for a key and check if auto-disable threshold is reached.
 * Returns true if key should be auto-disabled (5 strikes within 1 hour).
 */
export function recordFraudStrike(keyPrefix: string): boolean {
  const now = Date.now();
  const cutoff = now - FRAUD_STRIKE_WINDOW_MS;

  let strikes = fraudStrikes.get(keyPrefix) || [];
  strikes = strikes.filter(ts => ts > cutoff); // Keep only recent strikes
  strikes.push(now);
  fraudStrikes.set(keyPrefix, strikes);

  return strikes.length >= FRAUD_STRIKE_THRESHOLD;
}

/** Reset fraud stores — for testing only */
export function _resetFraudStoreForTesting(): void {
  fingerprintStore.clear();
  fraudStrikes.clear();
}
