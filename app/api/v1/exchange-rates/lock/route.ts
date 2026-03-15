import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const from = typeof body.from === 'string' ? body.from.toUpperCase() : '';
  const to = typeof body.to === 'string' ? body.to.toUpperCase() : '';
  const durationHours = typeof body.duration_hours === 'number' ? body.duration_hours : 24;

  if (!from || !to) return apiError(ApiErrorCode.BAD_REQUEST, 'from and to currency codes required.');
  if (![24, 48, 72].includes(durationHours)) return apiError(ApiErrorCode.BAD_REQUEST, 'duration_hours must be 24, 48, or 72.');

  const rate = from === 'USD' && to === 'EUR' ? 0.92 : 1.0;
  const lockedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const sb = getSupabase();
  const { data, error } = await sb.from('rate_locks').insert({
    user_id: ctx.sellerId, from_currency: from, to_currency: to,
    rate, locked_until: lockedUntil.toISOString(),
  }).select('id').single();

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to create rate lock.');

  return apiSuccess({
    lock_id: data.id, rate, from, to,
    locked_until: lockedUntil.toISOString(),
    duration_hours: durationHours,
  }, { sellerId: ctx.sellerId });
});

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const lockId = url.searchParams.get('lock_id') || '';
  if (!lockId) return apiError(ApiErrorCode.BAD_REQUEST, 'lock_id required.');

  const sb = getSupabase();
  const { data, error } = await sb.from('rate_locks').select('*').eq('id', lockId).single();
  if (error || !data) return apiError(ApiErrorCode.NOT_FOUND, 'Rate lock not found.');

  const expired = new Date(data.locked_until) < new Date();
  return apiSuccess({
    lock_id: data.id, rate: data.rate,
    from: data.from_currency, to: data.to_currency,
    locked_until: data.locked_until,
    status: expired ? 'expired' : 'active',
  }, { sellerId: ctx.sellerId });
});
