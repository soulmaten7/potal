/**
 * POTAL API v1 — /api/v1/sellers/keys/rotate
 *
 * Rotate an API key: creates new key + sets grace period on old key.
 * Old key remains active for 24 hours (configurable) to allow migration.
 *
 * POST /api/v1/sellers/keys/rotate
 * Body: { keyId: string, gracePeriodHours?: number }
 * Requires sk_live_ key.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { createApiKey } from '@/app/lib/api-auth/keys';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  // Require secret key
  if (context.keyType !== 'secret') {
    return apiError(ApiErrorCode.FORBIDDEN, 'Key rotation requires a secret key (sk_live_).');
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const keyId = typeof body.keyId === 'string' ? body.keyId : '';
  if (!keyId) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'keyId is required.');
  }

  // Cannot rotate the key currently in use
  if (keyId === context.keyId) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Cannot rotate the key currently in use for this request. Use a different key to authenticate.');
  }

  const gracePeriodHours = typeof body.gracePeriodHours === 'number'
    ? Math.max(1, Math.min(168, body.gracePeriodHours)) // 1h to 7d
    : 24; // default 24h

  const supabase = getServiceClient();

  // 1. Verify old key exists and belongs to this seller
  const { data: oldKey, error: lookupError } = await (supabase
    .from('api_keys') as any)
    .select('id, key_type, name, is_active, rate_limit_per_minute, scopes')
    .eq('id', keyId)
    .eq('seller_id', context.sellerId)
    .single();

  if (lookupError || !oldKey) {
    return apiError(ApiErrorCode.NOT_FOUND, 'API key not found or does not belong to this seller.');
  }

  if (!oldKey.is_active) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Cannot rotate an already revoked key.');
  }

  // 2. Create new key with same settings
  const newKey = await createApiKey(supabase as any, {
    sellerId: context.sellerId,
    type: oldKey.key_type,
    name: `${oldKey.name} (rotated)`,
    rateLimitPerMinute: oldKey.rate_limit_per_minute,
    scopes: oldKey.scopes || ['*'],
  });

  // 3. Set grace period on old key (expires after grace period)
  const oldKeyExpiresAt = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000).toISOString();
  await (supabase
    .from('api_keys') as any)
    .update({ expires_at: oldKeyExpiresAt })
    .eq('id', keyId);

  return apiSuccess({
    message: `Key rotated. Old key will expire in ${gracePeriodHours} hours. Save the new key — it will not be shown again.`,
    newKey: {
      id: newKey.keyId,
      fullKey: newKey.fullKey,
      prefix: newKey.prefix,
      type: newKey.type,
    },
    oldKey: {
      id: keyId,
      expiresAt: oldKeyExpiresAt,
      gracePeriodHours,
    },
  });
});
