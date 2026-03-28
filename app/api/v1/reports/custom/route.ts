/**
 * F080: Custom Report Builder
 *
 * POST /api/v1/reports/custom
 * Build custom reports with flexible filters, date ranges, grouping, and format selection.
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

type ReportDataSource = 'classifications' | 'calculations' | 'usage' | 'orders' | 'duty_savings';

interface ReportFilter {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

const DATA_SOURCE_TABLES: Record<ReportDataSource, { table: string; columns: string[] }> = {
  classifications: {
    table: 'hs_classification_audit',
    columns: ['created_at', 'product_name', 'product_category', 'hs_code_result', 'hs_description', 'confidence', 'confidence_grade', 'classification_source', 'processing_time_ms'],
  },
  calculations: {
    table: 'calculation_history',
    columns: ['created_at', 'origin_country', 'destination_country', 'product_value', 'duty_amount', 'tax_amount', 'total_landed_cost', 'hs_code', 'currency'],
  },
  usage: {
    table: 'usage_logs',
    columns: ['created_at', 'endpoint', 'method', 'status_code', 'response_time_ms'],
  },
  orders: {
    table: 'orders',
    columns: ['created_at', 'order_id', 'origin_country', 'destination_country', 'total_value', 'duty_paid', 'tax_paid', 'status'],
  },
  duty_savings: {
    table: 'fta_savings_log',
    columns: ['created_at', 'origin_country', 'destination_country', 'hs_code', 'fta_name', 'standard_rate', 'preferential_rate', 'savings_amount'],
  },
};

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const dataSource = typeof body.dataSource === 'string' ? body.dataSource as ReportDataSource : '' as ReportDataSource;
  const startDate = typeof body.startDate === 'string' ? body.startDate : undefined;
  const endDate = typeof body.endDate === 'string' ? body.endDate : undefined;
  const filters = Array.isArray(body.filters) ? body.filters as ReportFilter[] : [];
  const groupBy = typeof body.groupBy === 'string' ? body.groupBy : undefined;
  const sortBy = typeof body.sortBy === 'string' ? body.sortBy : 'created_at';
  const sortOrder = body.sortOrder === 'asc' ? 'asc' as const : 'desc' as const;
  const limit = typeof body.limit === 'number' ? Math.min(body.limit, 10000) : 1000;
  const format = typeof body.format === 'string' ? body.format.toLowerCase() : 'json';
  const columns = Array.isArray(body.columns) ? body.columns as string[] : undefined;

  if (!dataSource || !DATA_SOURCE_TABLES[dataSource]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"dataSource" required. Options: ${Object.keys(DATA_SOURCE_TABLES).join(', ')}`);
  }

  if (!['json', 'csv'].includes(format)) {
    return apiError(ApiErrorCode.BAD_REQUEST, '"format" must be: json or csv.');
  }

  const dsConfig = DATA_SOURCE_TABLES[dataSource];
  const selectedColumns = columns
    ? columns.filter(c => dsConfig.columns.includes(c))
    : dsConfig.columns;

  if (selectedColumns.length === 0) {
    return apiError(ApiErrorCode.BAD_REQUEST, `No valid columns. Available: ${dsConfig.columns.join(', ')}`);
  }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  let query = supabase
    .from(dsConfig.table)
    .select(selectedColumns.join(','))
    .eq('seller_id', ctx.sellerId)
    .order(dsConfig.columns.includes(sortBy) ? sortBy : 'created_at', { ascending: sortOrder === 'asc' })
    .limit(limit);

  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  for (const filter of filters) {
    if (!dsConfig.columns.includes(filter.field)) continue;
    switch (filter.operator) {
      case 'eq': query = query.eq(filter.field, filter.value); break;
      case 'gt': query = query.gt(filter.field, filter.value); break;
      case 'lt': query = query.lt(filter.field, filter.value); break;
      case 'gte': query = query.gte(filter.field, filter.value); break;
      case 'lte': query = query.lte(filter.field, filter.value); break;
      case 'contains': query = query.ilike(filter.field, `%${filter.value}%`); break;
      case 'in': if (Array.isArray(filter.value)) query = query.in(filter.field, filter.value); break;
    }
  }

  const { data, error } = await query;
  if (error) return apiError(ApiErrorCode.INTERNAL_ERROR, `Query failed: ${error.message}`);

  const rows = (data || []) as unknown as Record<string, unknown>[];

  // Grouping
  let grouped: Record<string, Record<string, unknown>[]> | null = null;
  if (groupBy && dsConfig.columns.includes(groupBy)) {
    grouped = {};
    for (const row of rows) {
      const key = String(row[groupBy] || 'unknown');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }
  }

  // CSV export
  if (format === 'csv') {
    const header = selectedColumns.map(escapeCsvField).join(',');
    const csvBody = rows.map(row =>
      selectedColumns.map(col => escapeCsvField(row[col])).join(',')
    ).join('\n');
    const csv = header + '\n' + csvBody;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="custom_report_${dataSource}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return apiSuccess({
    report: {
      dataSource,
      columns: selectedColumns,
      dateRange: { start: startDate || null, end: endDate || null },
      filters: filters.length > 0 ? filters : undefined,
      groupBy: groupBy || null,
      sortBy,
      sortOrder,
    },
    data: grouped || rows,
    summary: {
      totalRows: rows.length,
      groupCount: grouped ? Object.keys(grouped).length : undefined,
    },
    generatedAt: new Date().toISOString(),
  }, { sellerId: ctx.sellerId, plan: ctx.planId });
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Body: { dataSource: "classifications"|"calculations"|"usage"|"orders"|"duty_savings", startDate?, endDate?, filters?, groupBy?, sortBy?, sortOrder?, limit?, format?: "json"|"csv", columns? }');
}
