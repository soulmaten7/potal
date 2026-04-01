/**
 * Daily Data Management Cron — checks all 12 items.
 * Vercel Cron: 0 2 * * * (daily at 02:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DATA_REGISTRY, getP0Files, getDailyChecks,
  SOURCE_CONFIGS, verifySource,
  VALIDATION_RULES,
  getOpenErrors,
  getPrioritySummary,
  getRecentAudits,
  getEstimatedMonthlyCost,
} from '@/app/lib/data-management';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Record<string, unknown> = {};

  // 1. Registry integrity (are all files accounted for?)
  results.registry = {
    totalFiles: DATA_REGISTRY.length,
    byArea: Array.from({ length: 12 }, (_, i) => ({
      area: i,
      files: DATA_REGISTRY.filter(f => f.area === i).length,
    })),
  };

  // 2. Source URL verification (daily sources only)
  const dailyChecks = getDailyChecks();
  const sourceResults: Record<string, unknown>[] = [];

  for (const fileId of dailyChecks) {
    const config = SOURCE_CONFIGS.find(s => s.fileId === fileId);
    if (config) {
      try {
        const result = await verifySource(config);
        sourceResults.push({ fileId, status: result.status, contentChanged: result.contentChanged });
      } catch (err) {
        sourceResults.push({ fileId, status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  results.sourceVerification = sourceResults;

  // 3. Open errors
  const errors = await getOpenErrors();
  results.openErrors = { count: errors.length, items: errors.slice(0, 5) };

  // 4. Priority summary
  results.priorities = getPrioritySummary();

  // 5. Cost estimate
  results.cost = getEstimatedMonthlyCost();

  // 6. Recent audits
  const audits = await getRecentAudits(5);
  results.recentAudits = audits.length;

  results.duration_ms = Date.now() - startTime;
  results.timestamp = new Date().toISOString();

  return NextResponse.json({
    status: 'ok',
    message: 'Data management daily check complete',
    ...results,
  });
}
