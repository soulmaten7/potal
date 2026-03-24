/**
 * POTAL API v1 — /api/v1/webhooks
 *
 * Webhook registration management.
 * GET  — List seller's webhooks
 * POST — Register a new webhook
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { SUPPORTED_EVENTS } from '@/app/lib/webhooks/webhook-sender';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const URL_PATTERN = /^https:\/\/.+/;
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

function isUrlBlocked(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_HOSTS.includes(parsed.hostname);
  } catch {
    return true;
  }
}

/** GET — List seller's webhooks (secret masked) */
export const GET = withApiAuth(async (_req: NextRequest, ctx: ApiAuthContext) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('seller_webhooks')
    .select('id, url, events, active, created_at, updated_at')
    .eq('seller_id', ctx.sellerId)
    .order('created_at', { ascending: false });

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch webhooks.');

  return apiSuccess({
    webhooks: data || [],
    total: (data || []).length,
  });
});

/** POST — Register a new webhook */
export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  // Validate URL
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) return apiError(ApiErrorCode.BAD_REQUEST, 'url is required.');
  if (!URL_PATTERN.test(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'url must use HTTPS.');
  if (isUrlBlocked(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'url cannot point to localhost or private IPs.');

  // Validate events
  const events = Array.isArray(body.events) ? body.events as string[] : [];
  if (events.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'events array is required and must not be empty.');
  const invalidEvents = events.filter(e => e !== '*' && !(SUPPORTED_EVENTS as readonly string[]).includes(e));
  if (invalidEvents.length > 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported events: ${invalidEvents.join(', ')}. Supported: ${SUPPORTED_EVENTS.join(', ')}, *`);
  }

  // Generate signing secret
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('seller_webhooks')
    .insert({
      seller_id: ctx.sellerId,
      url,
      events,
      secret,
      active: true,
    })
    .select('id, url, events, active, created_at')
    .single();

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, `Failed to create webhook: ${error.message}`);
  }

  return apiSuccess({
    message: 'Webhook registered. Save the secret — it will not be shown again.',
    webhook: { ...data, secret },
  });
});
