/**
 * POTAL API v1 — /api/v1/notifications
 * In-app notifications CRUD
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

export const GET = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  if (!_ctx.sellerId) return apiError(ApiErrorCode.UNAUTHORIZED, 'Authentication required.');

  const sb = getSupabase();
  let query = sb.from('notifications')
    .select('*')
    .eq('user_id', _ctx.sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('read', false);

  const { data, error } = await query;
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch notifications.');

  const { count } = await sb.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', _ctx.sellerId)
    .eq('read', false);

  return apiSuccess({
    notifications: data || [],
    unread_count: count || 0,
  }, { sellerId: _ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'mark_read') {
    const id = body.id;
    const sb = getSupabase();
    if (id === 'all') {
      await sb.from('notifications').update({ read: true }).eq('user_id', _ctx.sellerId).eq('read', false);
      return apiSuccess({ marked: 'all' }, { sellerId: _ctx.sellerId });
    }
    if (typeof id === 'number' || typeof id === 'string') {
      await sb.from('notifications').update({ read: true }).eq('id', id).eq('user_id', _ctx.sellerId);
      return apiSuccess({ marked: id }, { sellerId: _ctx.sellerId });
    }
    return apiError(ApiErrorCode.BAD_REQUEST, 'id required (number or "all").');
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action required: "mark_read".');
});
