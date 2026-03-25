/**
 * Data Management Audit Trail — logs all data changes for compliance/traceability.
 *
 * Table: data_update_log
 * Features:
 * - Write audit entries with actor validation
 * - Query with filters (actor, action, area, date range)
 * - Pagination
 * - Stats aggregation
 * - Retention cleanup (archive after 365 days)
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Types ──────────────────────────────────────────

export const VALID_ACTORS = ['system', 'cron', 'admin', 'api', 'user', 'migration'] as const;
export type AuditActor = typeof VALID_ACTORS[number];

export const VALID_ACTIONS = ['create', 'update', 'delete', 'rollback', 'validate', 'verify'] as const;
export type AuditAction = typeof VALID_ACTIONS[number];

export interface AuditEntry {
  fileId: string;
  area: number;
  actor: string;
  action: AuditAction;
  reason: string;
  sourceUrl?: string;
  beforeState?: { recordCount?: number; hash?: string };
  afterState?: { recordCount?: number; hash?: string };
  validationPassed: boolean;
}

export interface AuditQueryFilters {
  actor?: string;
  action?: AuditAction;
  area?: number;
  dateFrom?: string;
  dateTo?: string;
  validationPassed?: boolean;
  fileId?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditQueryResult {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface AuditStats {
  totalEntries: number;
  byAction: Record<string, number>;
  byActor: Record<string, number>;
  byArea: Record<number, number>;
  failedValidations: number;
  avgEntriesPerDay: number;
  oldestEntry?: string;
  newestEntry?: string;
}

// ─── Write ──────────────────────────────────────────

/** Write an audit entry with actor validation */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Validate actor — normalize to known actor or 'unknown'
  const actor = (VALID_ACTORS as readonly string[]).includes(entry.actor)
    ? entry.actor
    : 'unknown';

  try {
    await (supabase.from('data_update_log') as any).insert({
      file_id: entry.fileId,
      area: entry.area,
      actor,
      action: entry.action,
      before_state: entry.beforeState || null,
      after_state: entry.afterState || null,
      reason: entry.reason,
      source_url: entry.sourceUrl || null,
      validation_passed: entry.validationPassed,
    });
  } catch {
    // Audit write should never break the caller
  }
}

// ─── Query ──────────────────────────────────────────

/** Query audit entries with filters and pagination */
export async function queryAudits(filters: AuditQueryFilters = {}): Promise<AuditQueryResult> {
  const supabase = getSupabase();
  if (!supabase) return { data: [], total: 0, page: 1, pageSize: 50, pages: 0 };

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 50));
  const offset = (page - 1) * pageSize;

  try {
    let query = (supabase.from('data_update_log') as any)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filters.actor) query = query.eq('actor', filters.actor);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.area !== undefined) query = query.eq('area', filters.area);
    if (filters.fileId) query = query.eq('file_id', filters.fileId);
    if (filters.validationPassed !== undefined) query = query.eq('validation_passed', filters.validationPassed);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

    const { data, count, error } = await query;

    if (error) return { data: [], total: 0, page, pageSize, pages: 0 };

    const total = count || 0;
    return {
      data: data || [],
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  } catch {
    return { data: [], total: 0, page, pageSize, pages: 0 };
  }
}

/** Get recent audit entries (backward compatible) */
export async function getRecentAudits(limit: number = 20): Promise<Record<string, unknown>[]> {
  const result = await queryAudits({ pageSize: limit });
  return result.data;
}

// ─── Stats ──────────────────────────────────────────

/** Get audit statistics for a given period */
export async function getAuditStats(periodDays: number = 30): Promise<AuditStats> {
  const supabase = getSupabase();
  const empty: AuditStats = {
    totalEntries: 0, byAction: {}, byActor: {}, byArea: {},
    failedValidations: 0, avgEntriesPerDay: 0,
  };
  if (!supabase) return empty;

  try {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, count } = await (supabase.from('data_update_log') as any)
      .select('actor, action, area, validation_passed, created_at', { count: 'exact' })
      .gte('created_at', since);

    if (!data || data.length === 0) return empty;

    const byAction: Record<string, number> = {};
    const byActor: Record<string, number> = {};
    const byArea: Record<number, number> = {};
    let failedValidations = 0;

    for (const row of data) {
      byAction[row.action] = (byAction[row.action] || 0) + 1;
      byActor[row.actor] = (byActor[row.actor] || 0) + 1;
      byArea[row.area] = (byArea[row.area] || 0) + 1;
      if (!row.validation_passed) failedValidations++;
    }

    const dates = data.map((r: Record<string, unknown>) => r.created_at as string).sort();

    return {
      totalEntries: count || data.length,
      byAction,
      byActor,
      byArea,
      failedValidations,
      avgEntriesPerDay: Math.round((count || data.length) / periodDays * 10) / 10,
      oldestEntry: dates[0],
      newestEntry: dates[dates.length - 1],
    };
  } catch {
    return empty;
  }
}

// ─── Cleanup ────────────────────────────────────────

/** Archive audit entries older than retentionDays. Returns count of archived entries. */
export async function cleanupOldAudits(retentionDays: number = 365): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Count entries to archive
    const { count } = await (supabase.from('data_update_log') as any)
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoff);

    if (!count || count === 0) return 0;

    // Copy to archive table (best-effort — if archive table doesn't exist, just delete old entries)
    try {
      const { data: oldEntries } = await (supabase.from('data_update_log') as any)
        .select('*')
        .lt('created_at', cutoff)
        .limit(1000);

      if (oldEntries && oldEntries.length > 0) {
        await (supabase.from('archive_audit_logs') as any).insert(oldEntries);
      }
    } catch {
      // Archive table may not exist yet — continue with deletion
    }

    // Delete old entries
    await (supabase.from('data_update_log') as any)
      .delete()
      .lt('created_at', cutoff);

    return count;
  } catch {
    return 0;
  }
}

// ─── CSV Export ──────────────────────────────────────

/** Generate CSV string from audit entries */
export function auditsToCsv(entries: Record<string, unknown>[]): string {
  const headers = ['timestamp', 'file_id', 'area', 'actor', 'action', 'reason', 'validation_passed', 'source_url'];
  const rows = entries.map(e =>
    headers.map(h => {
      const val = e[h === 'timestamp' ? 'created_at' : h];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
