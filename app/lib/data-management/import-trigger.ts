import { createClient } from '@supabase/supabase-js';

export interface ImportTriggerResult {
  success: boolean;
  source: string;
  recordsUpdated: number;
  error?: string;
  triggeredBy: string;
  triggeredAt: string;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function logImportResult(result: ImportTriggerResult) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('health_check_logs').insert({
    checked_at: new Date().toISOString(),
    overall_status: result.success ? 'green' : 'red',
    checks: [{
      name: `auto_import_${result.source}`,
      status: result.success ? 'green' : 'red',
      message: result.success
        ? `Auto-imported ${result.recordsUpdated} records from ${result.source}`
        : `Auto-import failed: ${result.error}`,
      recordsUpdated: result.recordsUpdated,
      triggeredBy: result.triggeredBy,
    }],
    duration_ms: 0,
  });
}

export function isAutoImportEnabled(source: string): boolean {
  if (process.env.DISABLE_AUTO_IMPORT === 'true') return false;
  const envKey = `DISABLE_AUTO_IMPORT_${source.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
  if (process.env[envKey] === 'true') return false;
  return true;
}
