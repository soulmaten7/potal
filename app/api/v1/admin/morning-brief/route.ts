/**
 * POTAL API v1 — /api/v1/admin/morning-brief
 *
 * Layer 2 Monitor — Enhanced Morning Brief API.
 * 1. health_check_logs에서 최신 Cron 결과를 조회하여 15개 Division 상태를 평가
 * 2. Yellow/Red 항목을 Layer 1/2/3으로 분류
 * 3. Layer 1-2 이슈는 자동 수정 시도 (auto-remediation)
 * 4. 결과를 auto_resolved / needs_attention / all_green 3섹션으로 반환
 *
 * GET /api/v1/admin/morning-brief — 전체 Division 상태 요약 + 자동 수정
 * GET /api/v1/admin/morning-brief?auto_fix=false — 자동 수정 없이 상태만 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DIVISION_CHECKLISTS, type CheckItem, type DivisionChecklist } from '@/app/lib/monitoring/division-checklists';
import type { CheckStatus } from '@/app/lib/monitoring/health-monitor';
import { classifyIssue, type ClassifiedIssue } from '@/app/lib/monitoring/issue-classifier';
import { runAutoRemediation, type RemediationResult } from '@/app/lib/monitoring/auto-remediation';

const CRON_SECRET = process.env.CRON_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  const secret = req.nextUrl.searchParams.get('secret');
  return secret === CRON_SECRET;
}

interface CronLogEntry {
  checked_at: string;
  overall_status: CheckStatus;
  checks: Array<{ name: string; status: CheckStatus; message: string }>;
  source?: string;
}

interface DivisionStatus {
  id: string;
  name: string;
  status: CheckStatus;
  layer1: 'done' | 'pending';
  checks: Array<{
    id: string;
    label: string;
    status: CheckStatus;
    message: string;
    lastChecked?: string;
  }>;
}

async function getLatestCronLogs(): Promise<Map<string, CronLogEntry>> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('health_check_logs')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(100);

  const map = new Map<string, CronLogEntry>();
  if (error || !data) return map;

  for (const row of data) {
    const source = row.source || inferSource(row.checks);
    if (source && !map.has(source)) {
      map.set(source, {
        checked_at: row.checked_at,
        overall_status: row.overall_status,
        checks: row.checks || [],
        source,
      });
    }
  }

  return map;
}

function inferSource(checks: Array<{ name: string }> | null): string | null {
  if (!checks || checks.length === 0) return null;
  const names = checks.map(c => c.name);

  if (names.includes('database') && names.includes('auth')) return 'health-check';
  if (names.some(n => n.includes('spot') || n.includes('US_domestic'))) return 'spot-check';
  if (names.some(n => n.includes('uptime') || n === '/')) return 'uptime-check';
  if (names.some(n => n.includes('trade_remedy'))) return 'trade-remedy-sync';
  if (names.some(n => n.includes('USITC') || n.includes('gov'))) return 'gov-api-health';
  if (names.some(n => n.includes('widget') || n.includes('plugin'))) return 'plugin-health';
  if (names.some(n => n.includes('Zonos') || n.includes('competitor'))) return 'competitor-scan';
  if (names.some(n => n.includes('tariff'))) return 'update-tariffs';
  if (names.some(n => n.includes('overage') || n.includes('billing'))) return 'billing-overage';
  if (names.some(n => n.includes('remediation'))) return 'auto-remediation';

  return null;
}

function evaluateCheck(
  check: CheckItem,
  cronLogs: Map<string, CronLogEntry>,
  healthCheckLog: CronLogEntry | undefined,
): { status: CheckStatus; message: string; lastChecked?: string } {
  if (check.source === 'app_builtin') {
    return { status: 'green', message: 'App builtin — always active' };
  }

  if (check.source === 'external') {
    return { status: 'green', message: 'External service — manual verification' };
  }

  if (check.source === 'manual') {
    return { status: 'yellow', message: 'Manual check required' };
  }

  if (check.source === 'cron_log' && check.cronEndpoint) {
    const log = cronLogs.get(check.cronEndpoint);
    if (!log) {
      return { status: 'yellow', message: 'No cron log found' };
    }

    const ageMinutes = (Date.now() - new Date(log.checked_at).getTime()) / 60000;
    const maxAge = check.maxAgeMinutes || 720;

    if (ageMinutes > maxAge) {
      return {
        status: 'yellow',
        message: `Last run ${Math.round(ageMinutes / 60)}h ago (max: ${Math.round(maxAge / 60)}h)`,
        lastChecked: log.checked_at,
      };
    }

    return {
      status: log.overall_status,
      message: log.overall_status === 'green' ? 'OK' : 'Issues detected',
      lastChecked: log.checked_at,
    };
  }

  if (check.source === 'health_check_logs' && healthCheckLog) {
    const matchingCheck = healthCheckLog.checks.find(c => {
      if (check.id.includes('db') || check.id.includes('database')) return c.name === 'database';
      if (check.id.includes('auth')) return c.name === 'auth';
      if (check.id.includes('api-health') || check.id.includes('api_health')) return c.name === 'api_health';
      if (check.id.includes('data') || check.id.includes('vat') || check.id.includes('de-minimis')) return c.name === 'data_integrity';
      return false;
    });

    if (matchingCheck) {
      return {
        status: matchingCheck.status,
        message: matchingCheck.message,
        lastChecked: healthCheckLog.checked_at,
      };
    }

    return {
      status: 'green',
      message: 'Data verified via health check',
      lastChecked: healthCheckLog.checked_at,
    };
  }

  return { status: 'yellow', message: 'Unable to verify' };
}

function getDivisionStatus(
  division: DivisionChecklist,
  cronLogs: Map<string, CronLogEntry>,
  healthCheckLog: CronLogEntry | undefined,
): DivisionStatus {
  const checks = division.checks.map(check => {
    const result = evaluateCheck(check, cronLogs, healthCheckLog);
    return {
      id: check.id,
      label: check.label,
      ...result,
    };
  });

  const hasRed = checks.some(c => c.status === 'red');
  const hasYellow = checks.some(c => c.status === 'yellow');
  const overall: CheckStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  return {
    id: division.id,
    name: division.name,
    status: division.layer1Status === 'pending' ? 'yellow' : overall,
    layer1: division.layer1Status,
    checks,
  };
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const autoFix = req.nextUrl.searchParams.get('auto_fix') !== 'false';

  try {
    const cronLogs = await getLatestCronLogs();
    const healthCheckLog = cronLogs.get('health-check');

    const divisions = DIVISION_CHECKLISTS.map(d =>
      getDivisionStatus(d, cronLogs, healthCheckLog)
    );

    // --- Layer Classification ---
    const allIssues: ClassifiedIssue[] = [];
    for (const div of divisions) {
      for (const check of div.checks) {
        if (check.status === 'yellow' || check.status === 'red') {
          allIssues.push(
            classifyIssue(div.id, div.name, check.id, check.label, check.status, check.message)
          );
        }
      }
    }

    // --- Auto-Remediation (Layer 1-2) ---
    let remediationResults: RemediationResult[] = [];
    if (autoFix && allIssues.some(i => i.autoRemediable)) {
      remediationResults = await runAutoRemediation(allIssues);
    }

    // --- Categorize results ---
    const autoResolved = remediationResults
      .filter(r => r.success)
      .map(r => ({
        division: r.division,
        issue: r.checkLabel,
        action: r.action,
        result: r.message,
      }));

    const autoFailed = remediationResults
      .filter(r => !r.success)
      .map(r => ({
        division: r.division,
        issue: r.checkLabel,
        action: r.action,
        result: r.message,
      }));

    // Issues needing human attention: Layer 3 + failed Layer 1-2
    const needsAttention = allIssues
      .filter(i => {
        // Layer 3 always needs attention
        if (i.layer === 3) return true;
        // Layer 1-2 that failed remediation
        if (i.autoRemediable) {
          const result = remediationResults.find(r => r.checkId === i.checkId);
          return result && !result.success;
        }
        // Layer 2 non-remediable
        return !i.autoRemediable;
      })
      .map(i => ({
        division: i.division,
        divisionName: i.divisionName,
        issue: i.checkLabel,
        status: i.status,
        layer: i.layer,
        layerLabel: i.layerLabel,
        recommendation: i.recommendation,
        message: i.message,
      }));

    const allGreen = divisions
      .filter(d => d.status === 'green')
      .map(d => ({ division: d.id, name: d.name }));

    // --- Summary ---
    const greenCount = divisions.filter(d => d.status === 'green').length;
    const yellowDivisions = divisions.filter(d => d.status === 'yellow');
    const redDivisions = divisions.filter(d => d.status === 'red');
    const hasRed = redDivisions.length > 0;
    const hasYellow = yellowDivisions.length > 0;
    const overall: CheckStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      overall,
      summary: {
        green: greenCount,
        yellow: yellowDivisions.length,
        red: redDivisions.length,
        total: 15,
      },

      // Enhanced: 3-section response
      auto_resolved: autoResolved,
      auto_failed: autoFailed,
      needs_attention: needsAttention,
      all_green: allGreen,

      // Legacy fields (backward compatible)
      yellowAlerts: yellowDivisions.map(d => ({
        id: d.id,
        name: d.name,
        issues: d.checks.filter(c => c.status === 'yellow').map(c => c.label),
      })),
      redAlerts: redDivisions.map(d => ({
        id: d.id,
        name: d.name,
        issues: d.checks.filter(c => c.status === 'red').map(c => c.label),
      })),
      divisions,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      durationMs: Date.now() - start,
    }, { status: 500 });
  }
}
