/**
 * F109: CSV/data export.
 * Export calculation history, classification audit, or tax reports as CSV.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.map(escapeCsvField).join(',');
  const body = rows.map(row =>
    columns.map(col => escapeCsvField(row[col])).join(',')
  ).join('\n');
  return header + '\n' + body;
}

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.'); }

  const reportType = typeof body.reportType === 'string' ? body.reportType : '';
  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'csv';
  const limit = typeof body.limit === 'number' ? Math.min(body.limit, 10000) : 1000;
  const startDate = typeof body.startDate === 'string' ? body.startDate : undefined;
  const endDate = typeof body.endDate === 'string' ? body.endDate : undefined;

  if (!reportType) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"reportType" required. Options: classification_audit, usage_log.');
  }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  if (reportType === 'classification_audit') {
    let q = supabase
      .from('hs_classification_audit')
      .select('*')
      .eq('seller_id', context.sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) q = q.gte('created_at', startDate);
    if (endDate) q = q.lte('created_at', endDate);

    const { data, error } = await q;
    if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, `Query failed: ${error.message}`);

    const rows = (data || []).map((r: Record<string, unknown>) => ({
      timestamp: r.created_at,
      product_name: r.product_name,
      product_category: r.product_category || '',
      hs_code_result: r.hs_code_result,
      hs_description: r.hs_description,
      confidence: r.confidence,
      confidence_grade: r.confidence_grade || '',
      classification_source: r.classification_source,
      processing_time_ms: r.processing_time_ms,
    }));

    const columns = ['timestamp', 'product_name', 'product_category', 'hs_code_result', 'hs_description', 'confidence', 'confidence_grade', 'classification_source', 'processing_time_ms'];

    if (format === 'csv') {
      const csv = toCsv(columns, rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="classification_audit_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return Response.json({ success: true, data: { rows, total: rows.length, columns }, meta: { sellerId: context.sellerId, plan: context.planId } });
  }

  if (reportType === 'usage_log') {
    let q = supabase
      .from('usage_logs')
      .select('*')
      .eq('seller_id', context.sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) q = q.gte('created_at', startDate);
    if (endDate) q = q.lte('created_at', endDate);

    const { data, error } = await q;
    if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, `Query failed: ${error.message}`);

    const rows = (data || []).map((r: Record<string, unknown>) => ({
      timestamp: r.created_at,
      endpoint: r.endpoint,
      method: r.method,
      status_code: r.status_code,
      response_time_ms: r.response_time_ms,
    }));

    const columns = ['timestamp', 'endpoint', 'method', 'status_code', 'response_time_ms'];

    if (format === 'csv') {
      const csv = toCsv(columns, rows);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usage_log_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return Response.json({ success: true, data: { rows, total: rows.length, columns }, meta: { sellerId: context.sellerId, plan: context.planId } });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'Unknown reportType. Options: classification_audit, usage_log.');
});

export async function GET() { return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { reportType: "classification_audit"|"usage_log", format?: "csv"|"json", limit?: 1000, startDate?, endDate? }'); }
