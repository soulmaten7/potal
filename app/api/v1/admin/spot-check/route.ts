/**
 * POTAL API v1 — /api/v1/admin/spot-check
 *
 * D8 QA Layer 1 — Automated accuracy spot checks.
 * Runs 8 known-good calculation cases and validates results.
 *
 * Vercel Cron: daily at 04:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { runSpotChecks, saveSpotCheckReport } from '@/app/lib/monitoring/spot-checker';
import { reportCronAlert } from '@/app/lib/notifications/escalation';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  const secret = req.nextUrl.searchParams.get('secret');
  return secret === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await runSpotChecks();
  await saveSpotCheckReport(report);

  // Escalation: Yellow/Red 시 즉시 Chief에게 보고
  if (report.overall !== 'green') {
    await reportCronAlert({
      source: 'spot-check',
      sourceName: 'D8 QA 정확도 검증',
      overall: report.overall,
      issues: report.results.map((r) => ({
        name: r.label,
        status: r.status,
        message: r.message || 'Check result',
      })),
      durationMs: report.durationMs,
    });
  }

  return NextResponse.json({
    success: true,
    overall: report.overall,
    passed: report.passed,
    failed: report.failed,
    total: report.total,
    durationMs: report.durationMs,
    results: report.results,
    alertRequired: report.overall !== 'green',
  });
}
