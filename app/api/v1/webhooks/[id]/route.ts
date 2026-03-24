/**
 * POTAL API v1 — /api/v1/webhooks/[id]
 *
 * Single webhook management.
 * GET    — Get webhook details
 * PUT    — Update webhook URL or events
 * DELETE — Delete webhook
 */

import { NextRequest } from 'next/server';
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

/** Extract webhook ID from URL path: /api/v1/webhooks/<id> */
function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  // Path: /api/v1/webhooks/{id} or /api/v1/webhooks/{id}/deliveries
  const webhooksIdx = segments.indexOf('webhooks');
  return segments[webhooksIdx + 1] || '';
}

/** GET — Get webhook details (secret masked) */
export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('seller_webhooks')
    .select('id, url, events, active, created_at, updated_at')
    .eq('id', id)
    .eq('seller_id', ctx.sellerId)
    .single();

  if (error || !data) return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');
  return apiSuccess({ webhook: data });
});

/** PUT — Update webhook */
export const PUT = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.url === 'string') {
    const url = body.url.trim();
    if (!/^https:\/\/.+/.test(url)) return apiError(ApiErrorCode.BAD_REQUEST, 'url must use HTTPS.');
    updates.url = url;
  }

  if (Array.isArray(body.events)) {
    const events = body.events as string[];
    if (events.length === 0) return apiError(ApiErrorCode.BAD_REQUEST, 'events must not be empty.');
    const invalid = events.filter(e => e !== '*' && !(SUPPORTED_EVENTS as readonly string[]).includes(e));
    if (invalid.length > 0) return apiError(ApiErrorCode.BAD_REQUEST, `Unsupported events: ${invalid.join(', ')}`);
    updates.events = events;
  }

  if (typeof body.active === 'boolean') {
    updates.active = body.active;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('seller_webhooks')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', ctx.sellerId)
    .select('id, url, events, active, created_at, updated_at')
    .single();

  if (error || !data) return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');
  return apiSuccess({ webhook: data });
});

/** DELETE — Remove webhook */
export const DELETE = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  const supabase = getSupabase();

  const { error } = await supabase
    .from('seller_webhooks')
    .delete()
    .eq('id', id)
    .eq('seller_id', ctx.sellerId);

  if (error) return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');
  return apiSuccess({ message: 'Webhook deleted.', id });
});
