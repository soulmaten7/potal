/**
 * Audit Trail — logs all data changes for compliance/traceability.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface AuditEntry {
  fileId: string;
  area: number;
  actor: string;
  action: 'create' | 'update' | 'delete' | 'rollback' | 'validate' | 'verify';
  reason: string;
  sourceUrl?: string;
  beforeState?: { recordCount?: number; hash?: string };
  afterState?: { recordCount?: number; hash?: string };
  validationPassed: boolean;
}

/** Write an audit entry */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('data_update_log').insert({
    file_id: entry.fileId,
    area: entry.area,
    actor: entry.actor,
    action: entry.action,
    before_state: entry.beforeState || null,
    after_state: entry.afterState || null,
    reason: entry.reason,
    source_url: entry.sourceUrl || null,
    validation_passed: entry.validationPassed,
  });
}

/** Get recent audit entries */
export async function getRecentAudits(limit: number = 20): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('data_update_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}
