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

/** Extract webhook ID from path: /api/v1/webhooks/{id}/deliveries */
function extractId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  const webhooksIdx = segments.indexOf('webhooks');
  return segments[webhooksIdx + 1] || '';
}

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const id = extractId(req);
  if (!id) return apiError(ApiErrorCode.BAD_REQUEST, 'Webhook ID required.');

  const supabase = getSupabase();

  // Verify webhook belongs to this seller
  const { data: webhook, error: whError } = await supabase
    .from('seller_webhooks')
    .select('id')
    .eq('id', id)
    .eq('seller_id', ctx.sellerId)
    .single();

  if (whError || !webhook) {
    return apiError(ApiErrorCode.NOT_FOUND, 'Webhook not found.');
  }

  // Fetch delivery logs
  const { data: deliveries, error } = await supabase
    .from('health_check_logs')
    .select('id, status, response_time_ms, details, metadata, created_at')
    .eq('check_type', `webhook_delivery_${id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch deliveries.');
  }

  const formatted = (deliveries || []).map((d: Record<string, unknown>) => {
    const meta = (d.metadata || {}) as Record<string, unknown>;
    return {
      id: d.id,
      event_type: meta.event_type || 'unknown',
      status: meta.delivery_status || d.status,
      response_status: meta.response_status,
      attempt_number: meta.attempt_number,
      duration_ms: d.response_time_ms,
      error: meta.error,
      created_at: d.created_at,
    };
  });

  return apiSuccess({
    webhook_id: id,
    deliveries: formatted,
    total: formatted.length,
  });
});
