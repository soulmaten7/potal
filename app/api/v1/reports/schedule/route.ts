/**
 * POTAL API v1 — /api/v1/reports/schedule
 * Report schedule management — CRUD for automated report delivery
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

const VALID_TYPES = ['tax_liability', 'compliance_audit', 'shipping_analytics', 'duty_summary', 'landed_cost_export'];
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly'];

export const GET = withApiAuth(async (_req: NextRequest, _ctx: ApiAuthContext) => {
  const sb = getSupabase();
  const { data, error } = await sb.from('report_schedules')
    .select('*')
    .eq('seller_id', _ctx.sellerId)
    .order('created_at', { ascending: false });

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to fetch schedules.');

  return apiSuccess({ schedules: data || [] }, { sellerId: _ctx.sellerId });
});

export const POST = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const reportType = typeof body.report_type === 'string' ? body.report_type : '';
  const frequency = typeof body.frequency === 'string' ? body.frequency : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const filters = typeof body.filters === 'object' && body.filters !== null ? body.filters : {};

  if (!VALID_TYPES.includes(reportType)) return apiError(ApiErrorCode.BAD_REQUEST, `report_type must be one of: ${VALID_TYPES.join(', ')}`);
  if (!VALID_FREQUENCIES.includes(frequency)) return apiError(ApiErrorCode.BAD_REQUEST, `frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  if (!email || !email.includes('@')) return apiError(ApiErrorCode.BAD_REQUEST, 'Valid email required.');

  const sb = getSupabase();
  const { data, error } = await sb.from('report_schedules').insert({
    seller_id: _ctx.sellerId,
    report_type: reportType,
    frequency,
    email,
    filters,
    active: true,
  }).select().single();

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to create schedule.');

  return apiSuccess({ schedule: data, message: `${reportType} report scheduled ${frequency} to ${email}.` }, { sellerId: _ctx.sellerId });
});

export const DELETE = withApiAuth(async (req: NextRequest, _ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const scheduleId = url.searchParams.get('id');
  if (!scheduleId) return apiError(ApiErrorCode.BAD_REQUEST, 'Schedule id required (?id=...).');

  const sb = getSupabase();
  const { error } = await sb.from('report_schedules').delete().eq('id', scheduleId).eq('seller_id', _ctx.sellerId);

  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to delete schedule.');

  return apiSuccess({ deleted: scheduleId }, { sellerId: _ctx.sellerId });
});
