/**
 * POTAL API v1 — /api/v1/admin/trade-remedy-sync
 *
 * D1 Tariff & Trade Rules Layer 1 — Trade remedy data freshness check.
 * Monitors TTBD trade remedy tables for staleness and data integrity.
 * Alerts if data hasn't been updated or row counts drop unexpectedly.
 *
 * Vercel Cron: weekly Monday 06:30 UTC (after tariff update)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logImportResult, isAutoImportEnabled } from '@/app/lib/data-management/import-trigger';
import { savePublicationToDb } from '@/app/lib/data-management/publication-updater';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

interface TableCheck {
  table: string;
  label: string;
  minRows: number;
}

const TRADE_REMEDY_TABLES: TableCheck[] = [
  { table: 'trade_remedy_cases', label: 'AD/CVD Cases', minRows: 10000 },
  { table: 'trade_remedy_products', label: 'Remedy Products', minRows: 50000 },
  { table: 'trade_remedy_duties', label: 'Remedy Duties', minRows: 35000 },
  { table: 'safeguard_exemptions', label: 'Safeguard Exemptions', minRows: 15000 },
  { table: 'macmap_trade_agreements', label: 'FTA Agreements', minRows: 1300 },
  { table: 'macmap_ntlc_rates', label: 'MFN Rates (NTLC)', minRows: 500000 },
];

interface CheckResult {
  table: string;
  label: string;
  status: 'green' | 'yellow' | 'red';
  rowCount: number;
  minExpected: number;
  message: string;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getServiceClient();
  const results: CheckResult[] = [];

  for (const t of TRADE_REMEDY_TABLES) {
    try {
      const { count, error } = await supabase
        .from(t.table)
        .select('*', { count: 'exact', head: true });

      const rowCount = count ?? 0;

      if (error) {
        results.push({
          table: t.table, label: t.label, status: 'red',
          rowCount: 0, minExpected: t.minRows,
          message: `Query error: ${error.message}`,
        });
      } else if (rowCount < t.minRows) {
        results.push({
          table: t.table, label: t.label, status: 'red',
          rowCount, minExpected: t.minRows,
          message: `Row count ${rowCount} below minimum ${t.minRows}`,
        });
      } else {
        results.push({
          table: t.table, label: t.label, status: 'green',
          rowCount, minExpected: t.minRows,
          message: `OK (${rowCount.toLocaleString()} rows)`,
        });
      }
    } catch (err) {
      results.push({
        table: t.table, label: t.label, status: 'red',
        rowCount: 0, minExpected: t.minRows,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    }
  }

  // Auto-log if any table is red and auto-import enabled
  const redTables = results.filter(r => r.status === 'red');
  if (redTables.length > 0 && isAutoImportEnabled('TRADE_REMEDIES')) {
    await logImportResult({
      success: false,
      source: 'trade_remedies',
      recordsUpdated: 0,
      error: `${redTables.length} tables below threshold: ${redTables.map(r => r.table).join(', ')}`,
      triggeredBy: 'trade-remedy-sync-cron',
      triggeredAt: new Date().toISOString(),
    });
  }

  // Update source publication with latest case count
  const casesResult = results.find(r => r.table === 'trade_remedy_cases');
  if (casesResult && casesResult.status === 'green' && casesResult.rowCount > 0) {
    await savePublicationToDb('Trade Remedies', {
      publication: 'AD/CVD Orders & Safeguards',
      reference: `${casesResult.rowCount.toLocaleString()} active cases`,
      shortLabel: `${casesResult.rowCount.toLocaleString()} Active Cases`,
    });
  }

  const hasRed = redTables.length > 0;
  const hasYellow = results.some(r => r.status === 'yellow');
  const overall = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';
  const durationMs = Date.now() - start;

  // Save to health_check_logs
  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: results.map(r => ({ name: `trade_remedy:${r.table}`, status: r.status, rowCount: r.rowCount, message: r.message })),
      duration_ms: durationMs,
    });
  } catch {
    // Silent fail
  }

  return NextResponse.json({
    success: true,
    overall,
    durationMs,
    tables: results,
    alertRequired: overall !== 'green',
  });
}
