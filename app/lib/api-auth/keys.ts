/**
 * POTAL API Key Generation & Hashing
 *
 * Key format:
 * - Publishable (widget): pk_live_ + 36 random chars
 * - Secret (server API):  sk_live_ + 36 random chars
 *
 * Security:
 * - Full key shown ONCE at creation (never stored in DB)
 * - Only SHA-256 hash stored in api_keys table
 * - Prefix (first 8 chars) stored for identification
 */

import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

// ─── Key Generation ──────────────────────────────────

const KEY_LENGTH = 36; // chars after prefix

/**
 * Generate a cryptographically random API key.
 * Uses Web Crypto API (available in Node 18+ and Edge Runtime).
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * SHA-256 hash of the full API key.
 * Uses Web Crypto API (no external dependencies).
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type KeyType = 'publishable' | 'secret';

export interface GeneratedKey {
  /** Full key — show to user ONCE, never store */
  fullKey: string;
  /** First 8 chars for display (e.g. "pk_live_") */
  prefix: string;
  /** SHA-256 hash for DB storage */
  hash: string;
  /** Key type */
  type: KeyType;
}

/**
 * Generate a new API key pair (full key + hash).
 *
 * @example
 * const key = await generateApiKey('publishable');
 * // key.fullKey = "pk_live_A3bCd9eF..."  (show to user once)
 * // key.prefix  = "pk_live_"
 * // key.hash    = "a1b2c3d4..."           (store in DB)
 */
export async function generateApiKey(type: KeyType, mode: 'live' | 'test' = 'live'): Promise<GeneratedKey> {
  const prefix = type === 'publishable'
    ? (mode === 'test' ? 'pk_test_' : 'pk_live_')
    : (mode === 'test' ? 'sk_test_' : 'sk_live_');
  const randomPart = generateRandomString(KEY_LENGTH);
  const fullKey = prefix + randomPart;
  const hash = await hashKey(fullKey);

  return { fullKey, prefix, hash, type };
}

/**
 * Verify an API key against its stored hash using timing-safe comparison.
 * Prevents timing attacks that could leak hash bytes.
 */
export async function verifyApiKey(fullKey: string, storedHash: string): Promise<boolean> {
  const hash = await hashKey(fullKey);
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false; // Length mismatch or invalid hex
  }
}

// ─── Database Operations ─────────────────────────────

interface CreateKeyOptions {
  sellerId: string;
  type: KeyType;
  name?: string;
  rateLimitPerMinute?: number;
  expiresIn?: '7d' | '30d' | '90d' | '365d' | 'never';
  scopes?: string[];
}

interface CreateKeyResult {
  /** Full key — return to user ONCE */
  fullKey: string;
  /** DB record ID */
  keyId: string;
  /** Prefix for display */
  prefix: string;
  /** Key type */
  type: KeyType;
}

/**
 * Create a new API key and store its hash in Supabase.
 * Returns the full key (shown once) and the DB record ID.
 */
export async function createApiKey(
  supabase: ReturnType<typeof createClient>,
  options: CreateKeyOptions
): Promise<CreateKeyResult> {
  const { sellerId, type, name = 'Default', rateLimitPerMinute = 60, expiresIn = 'never', scopes = ['*'] } = options;
  const generated = await generateApiKey(type);

  // Calculate expiration date
  let expiresAt: string | null = null;
  if (expiresIn !== 'never') {
    const days = parseInt(expiresIn);
    if (!isNaN(days)) {
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const { data, error } = await (supabase
    .from('api_keys') as any)
    .insert({
      seller_id: sellerId,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      key_type: generated.type,
      name,
      rate_limit_per_minute: rateLimitPerMinute,
      is_active: true,
      expires_at: expiresAt,
      scopes,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  // Audit log (fire-and-forget)
  (supabase.from('health_check_logs') as any).insert({
    check_type: 'api_key_audit',
    status: 'healthy',
    response_time_ms: 0,
    details: 'key_created',
    metadata: { seller_id: sellerId, key_id: (data as any).id, key_type: type, scopes, expires_at: expiresAt },
  }).then(() => {}).catch(() => {});

  return {
    fullKey: generated.fullKey,
    keyId: (data as any).id,
    prefix: generated.prefix,
    type: generated.type,
  };
}

/**
 * Look up an API key by hashing the provided key and matching against DB.
 * Returns seller info if valid, null if invalid/revoked.
 */
export async function lookupApiKey(
  supabase: ReturnType<typeof createClient>,
  fullKey: string
): Promise<{
  keyId: string;
  sellerId: string;
  keyType: KeyType;
  rateLimitPerMinute: number;
  planId: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  expiresAt: string | null;
  scopes: string[];
  createdAt: string | null;
} | null> {
  const hash = await hashKey(fullKey);
  const prefix = fullKey.substring(0, 8);

  // Query by prefix only, then timing-safe compare hash in code.
  // This prevents DB-level timing leaks from the hash comparison.
  const { data: candidates, error } = await (supabase
    .from('api_keys') as any)
    .select(`
      id,
      seller_id,
      key_type,
      key_hash,
      rate_limit_per_minute,
      is_active,
      revoked_at,
      expires_at,
      scopes,
      created_at,
      sellers!inner (
        plan_id,
        subscription_status,
        current_period_end
      )
    `)
    .eq('key_prefix', prefix)
    .eq('is_active', true)
    .is('revoked_at', null);

  if (error || !candidates || candidates.length === 0) return null;

  // Timing-safe hash comparison against all candidates with this prefix
  let row: any = null;
  const hashBuf = Buffer.from(hash, 'hex');
  for (const candidate of candidates) {
    try {
      const candidateHashBuf = Buffer.from(candidate.key_hash, 'hex');
      if (hashBuf.length === candidateHashBuf.length && timingSafeEqual(hashBuf, candidateHashBuf)) {
        row = candidate;
        break;
      }
    } catch {
      continue; // Invalid hex in DB — skip
    }
  }

  if (!row) return null;

  // Check key expiration
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null; // Expired key
  }

  // Update last_used_at (fire-and-forget)
  (supabase
    .from('api_keys') as any)
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => {})
    .catch(() => {});

  const seller = row.sellers as { plan_id: string; subscription_status: string; current_period_end: string | null };

  return {
    keyId: row.id,
    sellerId: row.seller_id,
    keyType: row.key_type as KeyType,
    rateLimitPerMinute: row.rate_limit_per_minute,
    planId: seller.plan_id,
    subscriptionStatus: seller.subscription_status,
    currentPeriodEnd: seller.current_period_end,
    expiresAt: row.expires_at || null,
    scopes: row.scopes || ['*'],
    createdAt: row.created_at || null,
  };
}

/**
 * Revoke an API key (soft delete).
 */
export async function revokeApiKey(
  supabase: ReturnType<typeof createClient>,
  keyId: string,
  sellerId: string
): Promise<boolean> {
  const { error } = await (supabase
    .from('api_keys') as any)
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', keyId)
    .eq('seller_id', sellerId);

  if (!error) {
    // Audit log (fire-and-forget)
    (supabase.from('health_check_logs') as any).insert({
      check_type: 'api_key_audit',
      status: 'healthy',
      response_time_ms: 0,
      details: 'key_revoked',
      metadata: { seller_id: sellerId, key_id: keyId },
    }).then(() => {}).catch(() => {});
  }

  return !error;
}
