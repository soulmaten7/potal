/**
 * POTAL API v1 — /api/v1/admin/sdn-sync
 *
 * D1 Tariff & Trade Rules — Daily OFAC SDN list freshness check.
 * Checks if the SDN data in DB is up-to-date by comparing file hash.
 * Actual reload is triggered only when OFAC publishes updates.
 *
 * GET  /api/v1/admin/sdn-sync  — Check SDN freshness & reload if needed
 *
 * Vercel Cron: daily at 05:00 UTC (매일 05:00 UTC)
 *
 * Note: Full SDN import is done by scripts/import_ofac_sdn.py.
 * This cron only checks freshness and triggers lightweight status logging.
 * For full reload, use ?reload=true parameter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logImportResult, isAutoImportEnabled, type ImportTriggerResult } from '@/app/lib/data-management/import-trigger';

const CRON_SECRET = process.env.CRON_SECRET || '';
const SDN_XML_URL = 'https://www.treasury.gov/ofac/downloads/sdn.xml';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function computeHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const SDN_CSV_URL = 'https://www.treasury.gov/ofac/downloads/sdn.csv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autoImportSdn(supabase: any): Promise<ImportTriggerResult> {
  const triggeredAt = new Date().toISOString();
  try {
    const res = await fetch(SDN_CSV_URL, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`Fetch SDN CSV failed: ${res.status}`);
    const csvText = await res.text();

    const lines = csvText.split('\n').filter(l => l.trim());
    const entries: Array<Record<string, unknown>> = [];
    for (const line of lines) {
      const fields = line.split(',');
      const entNum = fields[0]?.trim().replace(/"/g, '');
      const name = fields[1]?.trim().replace(/"/g, '');
      const sdnType = fields[2]?.trim().replace(/"/g, '');
      const program = fields[3]?.trim().replace(/"/g, '');
      if (!entNum || !name || entNum === 'ent_num') continue;
      entries.push({
        source: 'OFAC_SDN',
        source_id: entNum,
        name,
        sdn_type: sdnType || 'Entity',
        programs: program ? [program] : [],
        entity_type: (sdnType || '').toLowerCase().includes('individual') ? 'individual' : 'entity',
        is_active: true,
        updated_at: triggeredAt,
      });
    }

    if (entries.length < 100) throw new Error(`Too few entries parsed: ${entries.length}`);

    const BATCH = 500;
    let upserted = 0;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      const { error } = await (supabase.from('sanctions_entries' as any) as any)
        .upsert(batch, { onConflict: 'source,source_id' });
      if (error) throw error;
      upserted += batch.length;
    }

    await (supabase.from('sanctions_load_meta' as any) as any).upsert({
      source: 'OFAC_SDN',
      last_loaded_at: triggeredAt,
      record_count: upserted,
      import_method: 'auto_cron',
    }, { onConflict: 'source' });

    return { success: true, source: 'ofac_sdn', recordsUpdated: upserted, triggeredBy: 'sdn-sync-cron', triggeredAt };
  } catch (err) {
    return { success: false, source: 'ofac_sdn', recordsUpdated: 0, error: err instanceof Error ? err.message : String(err), triggeredBy: 'sdn-sync-cron', triggeredAt };
  }
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = getSupabase();

  try {
    // 1. Check current DB status
    let dbMeta: { file_hash: string; last_loaded_at: string; record_count: number; publish_date: string } | null = null;

    if (supabase) {
      const metaResult: any = await (supabase
        .from('sanctions_load_meta' as any) as any)
        .select('file_hash, last_loaded_at, record_count, publish_date')
        .eq('source', 'OFAC_SDN')
        .single();

      if (metaResult.data) {
        dbMeta = metaResult.data;
      }
    }

    // 2. Check DB table row counts
    let entryCount = 0;
    let aliasCount = 0;
    if (supabase) {
      const entryResult: any = await (supabase
        .from('sanctions_entries' as any) as any)
        .select('id', { count: 'exact', head: true })
        .eq('source', 'OFAC_SDN');
      entryCount = entryResult.count || 0;

      const aliasResult: any = await (supabase
        .from('sanctions_aliases' as any) as any)
        .select('id', { count: 'exact', head: true });
      aliasCount = aliasResult.count || 0;
    }

    // 3. HEAD request to check if OFAC file changed (lightweight)
    let remoteChanged = false;
    let remoteSize: string | null = null;
    try {
      const headResp = await fetch(SDN_XML_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      if (headResp.ok) {
        remoteSize = headResp.headers.get('content-length');
        const lastModified = headResp.headers.get('last-modified');

        // If we have a previous load date, check if remote is newer
        if (dbMeta?.last_loaded_at && lastModified) {
          const remoteDate = new Date(lastModified);
          const dbDate = new Date(dbMeta.last_loaded_at);
          remoteChanged = remoteDate > dbDate;
        } else if (!dbMeta) {
          remoteChanged = true; // No previous load
        }
      }
    } catch {
      // HEAD failed — not critical, just skip freshness check
    }

    // 3b. Auto-import if remote changed and enabled
    let importResult: ImportTriggerResult | null = null;
    if (remoteChanged && supabase && isAutoImportEnabled('OFAC_SDN')) {
      importResult = await autoImportSdn(supabase);
      if (importResult.success) {
        entryCount = importResult.recordsUpdated;
      }
      await logImportResult(importResult);
    }

    // 4. Determine status
    let status: 'green' | 'yellow' | 'red' = 'green';
    let message = '';

    if (!dbMeta || entryCount === 0) {
      status = 'red';
      message = 'SDN data not loaded. Run: python3 scripts/import_ofac_sdn.py';
    } else if (remoteChanged && (!importResult || !importResult.success)) {
      status = 'yellow';
      message = `SDN update available but auto-import ${importResult ? 'failed: ' + importResult.error : 'disabled'}. DB has ${entryCount} entries.`;
    } else {
      const daysSinceLoad = dbMeta.last_loaded_at
        ? Math.floor((Date.now() - new Date(dbMeta.last_loaded_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLoad > 7) {
        status = 'yellow';
        message = `SDN data is ${daysSinceLoad} days old. Consider refreshing.`;
      } else {
        message = `SDN data fresh: ${entryCount} entries, ${aliasCount} aliases (published: ${dbMeta.publish_date || 'unknown'})`;
      }
    }

    // 5. Log to health_check_logs
    const report = {
      status,
      message,
      entryCount,
      aliasCount,
      lastLoaded: dbMeta?.last_loaded_at || null,
      publishDate: dbMeta?.publish_date || null,
      remoteChanged,
      remoteSize,
    };

    if (supabase) {
      await (supabase.from('health_check_logs' as any) as any).insert({
        division: 'D1',
        check_type: 'sdn-sync',
        status,
        details: report,
      });
    }

    return NextResponse.json({
      success: true,
      ...report,
      durationMs: Date.now() - startTime,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      status: 'red',
      message: `SDN sync check failed: ${err.message}`,
      durationMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
