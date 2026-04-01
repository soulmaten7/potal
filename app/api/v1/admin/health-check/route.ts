/**
 * POTAL API v1 — /api/v1/admin/health-check
 *
 * D11 Infrastructure Layer 1 — Automated health monitoring.
 * Checks DB, API, Auth, data integrity every 6 hours.
 * Results logged to health_check_logs for Morning Brief.
 *
 * GET  /api/v1/admin/health-check  — Run health checks (Cron or manual)
 *
 * Vercel Cron: every 6 hours (매 6시간)
 */

import { NextRequest, NextResponse } from 'next/server';
import { runHealthChecks, saveHealthReport, getLatestHealthStatus } from '@/app/lib/monitoring/health-monitor';
import { reportCronAlert } from '@/app/lib/notifications/escalation';

const CRON_SECRET = process.env.CRON_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.potal.app';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

/**
 * GET — Called by Vercel Cron every 6 hours.
 * Query params:
 *   ?status=true  — Return latest saved status (no new check)
 */
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If ?status=true, return latest saved report without running new checks
  const statusOnly = req.nextUrl.searchParams.get('status');
  if (statusOnly === 'true') {
    const latest = await getLatestHealthStatus();
    if (!latest) {
      return NextResponse.json({ error: 'No health check data yet' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: latest });
  }

  // Run full health check
  const report = await runHealthChecks(BASE_URL);

  // Save to Supabase
  await saveHealthReport(report);

  // Escalation: Yellow/Red 시 즉시 Chief에게 보고
  if (report.overall !== 'green') {
    await reportCronAlert({
      source: 'health-check',
      sourceName: 'D11 인프라 헬스체크',
      overall: report.overall,
      issues: report.checks.map(c => ({
        name: c.name,
        status: c.status,
        message: c.message,
      })),
      durationMs: report.durationMs,
    });
  }

  // Return summary
  return NextResponse.json({
    success: true,
    overall: report.overall,
    timestamp: report.timestamp,
    durationMs: report.durationMs,
    checks: report.checks.map(c => ({
      name: c.name,
      status: c.status,
      latencyMs: c.latencyMs,
      message: c.message,
    })),
    alertRequired: report.overall !== 'green',
  });
}
