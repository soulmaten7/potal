/**
 * F008: Audit Trail — query, filter, and export audit logs.
 *
 * GET /api/v1/audit?area=3&action=classify&from=2026-01-01&limit=50
 */

import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const area = url.searchParams.get('area');
  const action = url.searchParams.get('action');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const format = url.searchParams.get('format') || 'json';

  const supabase = getSupabase();
  if (!supabase) {
    return apiSuccess({
      audits: [],
      total: 0,
      note: 'Database unavailable. No audit logs to display.',
    }, { sellerId: context.sellerId });
  }

  try {
    let query = supabase
      .from('health_check_logs')
      .select('id, overall_status, checks, duration_ms, checked_at', { count: 'exact' })
      .order('checked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) query = query.gte('checked_at', from);
    if (to) query = query.lte('checked_at', to);

    const { data, count, error } = await query;
    if (error) throw error;

    const audits = (data || []).map((row: Record<string, unknown>) => {
      const checks = row.checks as Array<Record<string, unknown>> | null;
      return {
        id: row.id,
        status: row.overall_status,
        timestamp: row.checked_at,
        durationMs: row.duration_ms,
        entries: Array.isArray(checks)
          ? checks.filter(c => {
              if (area && String(c.area) !== area) return false;
              if (action && !String(c.action || c.name || '').includes(action)) return false;
              return true;
            }).map(c => ({
              name: c.name || c.action,
              area: c.area,
              sellerId: c.sellerId,
              detail: c.detail || c.reason || c.note,
            }))
          : [],
      };
    }).filter(a => a.entries.length > 0 || (!area && !action));

    if (format === 'csv') {
      const csvLines = ['timestamp,status,name,area,detail'];
      for (const a of audits) {
        for (const e of a.entries) {
          csvLines.push(`${a.timestamp},${a.status},${e.name || ''},${e.area || ''},${String(e.detail || '').replace(/,/g, ';')}`);
        }
      }
      return new Response(csvLines.join('\n'), {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="audit_export.csv"' },
      });
    }

    return apiSuccess({
      audits,
      total: count || 0,
      limit,
      offset,
      filters: { area: area || null, action: action || null, from: from || null, to: to || null },
      hasMore: (count || 0) > offset + limit,
    }, { sellerId: context.sellerId, plan: context.planId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to query audit logs.');
  }
});
