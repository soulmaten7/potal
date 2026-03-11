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

const CRON_SECRET = process.env.CRON_SECRET || '';
const SDN_XML_URL = 'https://www.treasury.gov/ofac/downloads/sdn.xml';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  const secret = req.nextUrl.searchParams.get('secret');
  return secret === CRON_SECRET;
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

    // 4. Determine status
    let status: 'green' | 'yellow' | 'red' = 'green';
    let message = '';

    if (!dbMeta || entryCount === 0) {
      status = 'red';
      message = 'SDN data not loaded. Run: python3 scripts/import_ofac_sdn.py';
    } else if (remoteChanged) {
      status = 'yellow';
      message = `SDN update available. DB has ${entryCount} entries (loaded: ${dbMeta.last_loaded_at}). Run import to update.`;
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
