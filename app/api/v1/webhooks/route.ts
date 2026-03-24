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
const MAX_URL_LENGTH = 2048;

/** Check if a hostname is a private/reserved IP or dangerous domain */
function isUrlBlocked(url: string): boolean {
  try {
    const parsed = new URL(url);
    const h = parsed.hostname;

    // Direct blocked hostnames
    if (['localhost', '0.0.0.0'].includes(h)) return true;

    // Dangerous domain suffixes
    if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return true;

    // IPv4 private ranges (RFC 1918 + loopback + link-local)
    if (/^127\./.test(h)) return true;                           // 127.0.0.0/8
    if (/^10\./.test(h)) return true;                            // 10.0.0.0/8
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;      // 172.16.0.0/12
    if (/^192\.168\./.test(h)) return true;                      // 192.168.0.0/16
    if (/^169\.254\./.test(h)) return true;                      // 169.254.0.0/16 link-local
    if (/^0\./.test(h)) return true;                             // 0.0.0.0/8

    // IPv6 private ranges
    if (h === '::1' || h === '[::1]') return true;               // Loopback
    if (/^(fc|fd)/i.test(h) || /^\[(fc|fd)/i.test(h)) return true; // Unique local (ULA)
    if (/^fe80/i.test(h) || /^\[fe80/i.test(h)) return true;    // Link-local

    return false;
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
  if (url.length > MAX_URL_LENGTH) return apiError(ApiErrorCode.BAD_REQUEST, `url exceeds ${MAX_URL_LENGTH} character limit.`);
  if (!URL_PATTERN.test(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'url must use HTTPS.');
  if (isUrlBlocked(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'url cannot point to localhost, private IPs, or reserved networks.');

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
