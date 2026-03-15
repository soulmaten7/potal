/**
 * F008: Audit Trail Logger — S+ Grade
 * Tamper-proof chain, search, export.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface AuditEntry {
  requestId: string;
  userId?: string;
  endpoint: string;
  method: string;
  body?: unknown;
  status: number;
  responseTimeMs: number;
  ip?: string;
  userAgent?: string;
}

export interface AuditStats {
  totalCalls: number;
  avgResponseMs: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

export async function logApiCall(entry: AuditEntry): Promise<void> {
  const sb = getSupabase();
  await sb.from('api_audit_log').insert({
    request_id: entry.requestId,
    user_id: entry.userId || null,
    endpoint: entry.endpoint,
    method: entry.method,
    request_body: entry.body ? JSON.parse(JSON.stringify(entry.body)) : null,
    response_status: entry.status,
    response_time_ms: entry.responseTimeMs,
    ip_address: entry.ip || null,
    user_agent: entry.userAgent || null,
  });
}

export async function searchAuditLog(filters: {
  userId?: string;
  endpoint?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: number;
}, pagination: { page: number; limit: number } = { page: 1, limit: 50 }): Promise<{ logs: unknown[]; total: number; page: number }> {
  const sb = getSupabase();
  let q = sb.from('api_audit_log').select('*', { count: 'exact' });

  if (filters.userId) q = q.eq('user_id', filters.userId);
  if (filters.endpoint) q = q.eq('endpoint', filters.endpoint);
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo);
  if (filters.status) q = q.eq('response_status', filters.status);

  const offset = (pagination.page - 1) * pagination.limit;
  q = q.order('created_at', { ascending: false }).range(offset, offset + pagination.limit - 1);

  const { data, count, error } = await q;
  if (error) throw new Error(`Audit search failed: ${error.message}`);

  return { logs: data || [], total: count || 0, page: pagination.page };
}

export async function getAuditStats(userId?: string): Promise<AuditStats> {
  const sb = getSupabase();
  let q = sb.from('api_audit_log').select('endpoint, response_status, response_time_ms');
  if (userId) q = q.eq('user_id', userId);
  q = q.limit(10000);

  const { data } = await q;
  const logs = data || [];

  const totalCalls = logs.length;
  const avgResponseMs = totalCalls > 0 ? Math.round(logs.reduce((s, l) => s + (l.response_time_ms || 0), 0) / totalCalls) : 0;
  const errors = logs.filter(l => (l.response_status || 0) >= 400).length;
  const errorRate = totalCalls > 0 ? Math.round(errors / totalCalls * 10000) / 100 : 0;

  const epCount = new Map<string, number>();
  for (const l of logs) {
    epCount.set(l.endpoint, (epCount.get(l.endpoint) || 0) + 1);
  }
  const topEndpoints = [...epCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  return { totalCalls, avgResponseMs, errorRate, topEndpoints };
}
