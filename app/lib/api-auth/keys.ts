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
 * Verify an API key against its stored hash.
 */
export async function verifyApiKey(fullKey: string, storedHash: string): Promise<boolean> {
  const hash = await hashKey(fullKey);
  return hash === storedHash;
}

// ─── Database Operations ─────────────────────────────

interface CreateKeyOptions {
  sellerId: string;
  type: KeyType;
  name?: string;
  rateLimitPerMinute?: number;
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
  const { sellerId, type, name = 'Default', rateLimitPerMinute = 60 } = options;
  const generated = await generateApiKey(type);

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
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

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
} | null> {
  const hash = await hashKey(fullKey);
  const prefix = fullKey.substring(0, 8);

  const { data, error } = await (supabase
    .from('api_keys') as any)
    .select(`
      id,
      seller_id,
      key_type,
      rate_limit_per_minute,
      is_active,
      revoked_at,
      sellers!inner (
        plan_id,
        subscription_status
      )
    `)
    .eq('key_prefix', prefix)
    .eq('key_hash', hash)
    .single();

  if (error || !data) return null;
  const row = data as any;
  if (!row.is_active || row.revoked_at) return null;

  // Update last_used_at
  await (supabase
    .from('api_keys') as any)
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id);

  const seller = row.sellers as { plan_id: string; subscription_status: string };

  return {
    keyId: row.id,
    sellerId: row.seller_id,
    keyType: row.key_type as KeyType,
    rateLimitPerMinute: row.rate_limit_per_minute,
    planId: seller.plan_id,
    subscriptionStatus: seller.subscription_status,
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

  return !error;
}
