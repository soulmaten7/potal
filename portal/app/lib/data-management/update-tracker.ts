/**
 * Update Tracker — tracks when each data file/table was last updated.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface UpdateRecord {
  fileId: string;
  lastUpdated: string;
  updatedBy: string;
  changeType: 'full_refresh' | 'incremental' | 'fix' | 'add';
  recordsBefore?: number;
  recordsAfter?: number;
}

/** Log an update event to data_update_log */
export async function logUpdate(record: {
  fileId: string;
  area: number;
  actor: string;
  action: string;
  reason: string;
  sourceUrl?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  validationPassed?: boolean;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('data_update_log').insert({
    file_id: record.fileId,
    area: record.area,
    actor: record.actor,
    action: record.action,
    before_state: record.beforeState || null,
    after_state: record.afterState || null,
    reason: record.reason,
    source_url: record.sourceUrl || null,
    validation_passed: record.validationPassed ?? true,
  });
}

/** Get the last update time for a file/table */
export async function getLastUpdate(fileId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from('data_update_log')
    .select('created_at')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.created_at || null;
}

/** Get DB table stats via pg_stat */
export async function getDbTableStats(tableName: string): Promise<{
  estimatedRows: number;
  lastAutoAnalyze: string | null;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // pg_stat query via Supabase — use REST query instead of RPC
  const { data } = await supabase
    .from('pg_class' as string)
    .select('reltuples')
    .eq('relname', tableName)
    .single();

  const rows = data ? Math.round(Number((data as Record<string, unknown>).reltuples || 0)) : 0;
  return { estimatedRows: rows, lastAutoAnalyze: null };
}
