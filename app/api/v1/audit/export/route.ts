import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { searchAuditLog } from '@/app/lib/audit/audit-logger';

export const GET = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'csv';
  const dateFrom = url.searchParams.get('from') || undefined;
  const dateTo = url.searchParams.get('to') || undefined;

  try {
    const result = await searchAuditLog({ userId: ctx.sellerId, dateFrom, dateTo }, { page: 1, limit: 10000 });
    const logs = result.logs as Array<Record<string, unknown>>;

    if (format === 'json') {
      return Response.json({ success: true, data: logs, total: result.total });
    }

    // CSV
    const headers = ['timestamp', 'endpoint', 'method', 'status', 'response_time_ms'];
    const rows = logs.map(l => headers.map(h => String(l[h === 'timestamp' ? 'created_at' : h === 'status' ? 'response_status' : h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_log_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    return apiError(ApiErrorCode.INTERNAL_ERROR, err instanceof Error ? err.message : 'Export failed.');
  }
});
