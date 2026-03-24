/**
 * POTAL API v1 — /api/v1/webhooks/[id]/deliveries
 *
 * GET — Webhook delivery history (last 100 deliveries)
 */

import { NextRequest } from 'next/server';
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

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  const supabase = getSupabase();

  // Verify webhook belongs to seller
  const { data: webhook, error: whErr } = await supabase
    .from('seller_webhooks')
    .select('id')
    .eq('id', id)
    .eq('seller_id', ctx.sellerId)
    .single();

  if (whErr || !webhook) return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');

  // Fetch delivery logs from webhook_events
  const { data: deliveries, error } = await (supabase.from('webhook_events') as any)
    .select('id, source, event_id, topic, status, error_message, created_at')
    .eq('source', `delivery_${id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch deliveries.');

  return apiSuccess({
    webhook_id: id,
    deliveries: deliveries || [],
    total: (deliveries || []).length,
  });
});
