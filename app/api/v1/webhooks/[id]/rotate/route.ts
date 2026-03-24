/**
 * POTAL API v1 — POST /api/v1/webhooks/[id]/rotate
 *
 * Rotate webhook signing secret.
 * Previous secret remains valid for 24 hours (grace period).
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  const idx = segments.indexOf('webhooks');
  return segments[idx + 1] || '';
}

const GRACE_PERIOD_HOURS = 24;

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  const supabase = getSupabase();

  // Verify webhook belongs to seller
  const { data: webhook, error: lookupErr } = await supabase
    .from('seller_webhooks')
    .select('id, secret, active')
    .eq('id', id)
    .eq('seller_id', ctx.sellerId)
    .single();

  if (lookupErr || !webhook) {
    return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');
  }

  if (!webhook.active) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Cannot rotate secret for inactive webhook.');
  }

  // Generate new secret, move current to previous
  const newSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('seller_webhooks')
    .update({
      previous_secret: webhook.secret,
      secret: newSecret,
      secret_rotated_at: now,
      updated_at: now,
    })
    .eq('id', id);

  if (updateErr) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to rotate secret.');
  }

  return apiSuccess({
    message: `Secret rotated. Previous secret valid for ${GRACE_PERIOD_HOURS} hours. Save the new secret — it will not be shown again.`,
    webhook_id: id,
    new_secret: newSecret,
    previous_secret_expires_at: new Date(Date.now() + GRACE_PERIOD_HOURS * 60 * 60 * 1000).toISOString(),
    grace_period_hours: GRACE_PERIOD_HOURS,
  });
});
