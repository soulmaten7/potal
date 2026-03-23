/**
 * Error Handler — rollback + detailed error logging + AI Agent auto-diagnosis.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface DataError {
  fileId: string;
  area: number;
  context: {
    sourceUrl: string;
    failureReason: string;
    stackTrace?: string;
    filesUsed?: string[];
  };
  rollback?: {
    backupPath: string;
    executed: boolean;
    success: boolean;
  };
  aiDiagnosis?: {
    rootCause: string;
    suggestedFix: string;
    autoFixAttempted: boolean;
    autoFixSuccess: boolean;
    requiresHuman: boolean;
  };
}

/** Log an error and attempt auto-diagnosis */
export async function handleError(error: DataError): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // 1. Log error
  await supabase.from('data_error_log').insert({
    file_id: error.fileId,
    area: error.area,
    error_context: error.context,
    rollback_info: error.rollback || null,
    ai_diagnosis: error.aiDiagnosis || null,
    status: error.aiDiagnosis?.requiresHuman ? 'manual_required' : 'open',
  });

  // 2. Auto-diagnose common patterns
  const reason = error.context.failureReason.toLowerCase();
  let diagnosis: DataError['aiDiagnosis'] = {
    rootCause: 'unknown',
    suggestedFix: 'Manual investigation required',
    autoFixAttempted: false,
    autoFixSuccess: false,
    requiresHuman: true,
  };

  if (reason.includes('timeout') || reason.includes('econnrefused')) {
    diagnosis = {
      rootCause: 'Network timeout / connection refused',
      suggestedFix: 'Retry in 30 minutes',
      autoFixAttempted: false,
      autoFixSuccess: false,
      requiresHuman: false,
    };
  } else if (reason.includes('404') || reason.includes('not found')) {
    diagnosis = {
      rootCause: 'Source URL no longer exists',
      suggestedFix: 'Search for new URL using fallback strategy',
      autoFixAttempted: false,
      autoFixSuccess: false,
      requiresHuman: true,
    };
  } else if (reason.includes('parse') || reason.includes('json')) {
    diagnosis = {
      rootCause: 'Data format changed at source',
      suggestedFix: 'Update parser to handle new format',
      autoFixAttempted: false,
      autoFixSuccess: false,
      requiresHuman: true,
    };
  } else if (reason.includes('validation') || reason.includes('row count')) {
    diagnosis = {
      rootCause: 'Data validation failed (unexpected values/counts)',
      suggestedFix: 'Compare with previous version, check source integrity',
      autoFixAttempted: false,
      autoFixSuccess: false,
      requiresHuman: true,
    };
  }

  // 3. Update diagnosis
  if (diagnosis.rootCause !== 'unknown') {
    error.aiDiagnosis = diagnosis;
    await supabase.from('data_error_log')
      .update({ ai_diagnosis: diagnosis, status: diagnosis.requiresHuman ? 'manual_required' : 'diagnosed' })
      .eq('file_id', error.fileId)
      .order('created_at', { ascending: false })
      .limit(1);
  }
}

/** Get open errors */
export async function getOpenErrors(): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('data_error_log')
    .select('*')
    .in('status', ['open', 'diagnosed', 'manual_required'])
    .order('created_at', { ascending: false })
    .limit(20);

  return data || [];
}
