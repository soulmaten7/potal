/**
 * POTAL API v1 — /api/v1/sellers/keys
 *
 * API Key management for sellers.
 * Requires secret key (sk_live_) — publishable keys cannot manage keys.
 *
 * GET  /api/v1/sellers/keys         — List all keys for this seller
 * POST /api/v1/sellers/keys         — Create a new API key
 * DELETE /api/v1/sellers/keys?id=x  — Revoke a key
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { createApiKey, revokeApiKey, type KeyType } from '@/app/lib/api-auth/keys';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

// ─── Supabase Service Client ────────────────────────

function getServiceClient(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// ─── Require Secret Key ─────────────────────────────

function requireSecretKey(context: ApiAuthContext): Response | null {
  if (context.keyType !== 'secret') {
    return apiError(
      ApiErrorCode.FORBIDDEN,
      'Key management requires a secret key (sk_live_). Publishable keys cannot manage API keys.'
    );
  }
  return null;
}

// ─── GET: List seller's API keys ────────────────────

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const forbidden = requireSecretKey(context);
  if (forbidden) return forbidden;

  const supabase = getServiceClient();

  const { data, error } = await (supabase
    .from('api_keys') as any)
    .select('id, key_prefix, key_type, name, is_active, rate_limit_per_minute, created_at, last_used_at, revoked_at')
    .eq('seller_id', context.sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch API keys.');
  }

  const keys = (data || []).map((key: Record<string, unknown>) => ({
    id: key.id,
    prefix: key.key_prefix,
    type: key.key_type,
    name: key.name,
    isActive: key.is_active,
    rateLimitPerMinute: key.rate_limit_per_minute,
    createdAt: key.created_at,
    lastUsedAt: key.last_used_at,
    revokedAt: key.revoked_at,
  }));

  return apiSuccess({ keys, total: keys.length });
});

// ─── POST: Create a new API key ─────────────────────

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const forbidden = requireSecretKey(context);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const type: KeyType = body.type === 'publishable' ? 'publishable' : 'secret';
  const name = typeof body.name === 'string' ? body.name.slice(0, 100) : 'Default';
  const rateLimitPerMinute = typeof body.rateLimitPerMinute === 'number'
    ? Math.max(1, Math.min(10000, body.rateLimitPerMinute))
    : 60;

  const supabase = getServiceClient();

  try {
    const result = await createApiKey(supabase as any, {
      sellerId: context.sellerId,
      type,
      name,
      rateLimitPerMinute,
    });

    return apiSuccess({
      message: 'API key created. Save the full key — it will not be shown again.',
      key: {
        id: result.keyId,
        fullKey: result.fullKey,
        prefix: result.prefix,
        type: result.type,
        name,
        rateLimitPerMinute,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create API key.';
    return apiError(ApiErrorCode.INTERNAL_ERROR, message);
  }
});

// ─── DELETE: Revoke an API key ──────────────────────

export const DELETE = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const forbidden = requireSecretKey(context);
  if (forbidden) return forbidden;

  const keyId = req.nextUrl.searchParams.get('id');
  if (!keyId) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Query parameter "id" is required.');
  }

  // Prevent revoking the key being used for this request
  if (keyId === context.keyId) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Cannot revoke the API key currently in use.');
  }

  const supabase = getServiceClient();
  const success = await revokeApiKey(supabase as any, keyId, context.sellerId);

  if (!success) {
    return apiError(ApiErrorCode.NOT_FOUND, 'API key not found or already revoked.');
  }

  return apiSuccess({ message: 'API key revoked successfully.', keyId });
});
