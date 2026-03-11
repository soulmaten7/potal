/**
 * POTAL API v1 — /api/v1/admin/morning-brief
 *
 * Layer 2 Monitor — Morning Brief API.
 * health_check_logs에서 최신 Cron 결과를 조회하여
 * 15개 Division 상태를 Green/Yellow/Red로 요약.
 *
 * GET /api/v1/admin/morning-brief — 전체 Division 상태 요약
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DIVISION_CHECKLISTS, type CheckItem, type DivisionChecklist } from '@/app/lib/monitoring/division-checklists';
import type { CheckStatus } from '@/app/lib/monitoring/health-monitor';

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

/**
 * health_check_logs에서 각 Cron 엔드포인트의 최신 로그를 가져온다.
 * source 필드가 없는 경우 checks 배열의 name으로 판별.
 */
async function getLatestCronLogs(): Promise<Map<string, CronLogEntry>> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 최근 100개 로그를 가져와서 엔드포인트별로 최신 것만 추출
  const { data, error } = await supabase
    .from('health_check_logs')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(100);

  const map = new Map<string, CronLogEntry>();

  if (error || !data) return map;

  for (const row of data) {
    // source 필드가 있으면 사용, 없으면 checks의 첫 번째 name으로 추정
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

/** checks 배열의 name 패턴으로 source를 추정 */
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

  return null;
}

function evaluateCheck(
  check: CheckItem,
  cronLogs: Map<string, CronLogEntry>,
  healthCheckLog: CronLogEntry | undefined,
): { status: CheckStatus; message: string; lastChecked?: string } {
  // app_builtin: 항상 green
  if (check.source === 'app_builtin') {
    return { status: 'green', message: 'App builtin — always active' };
  }

  // external: 외부 서비스 (Make.com, Google Calendar) — 자동 체크 불가, green 처리
  if (check.source === 'external') {
    return { status: 'green', message: 'External service — manual verification' };
  }

  // manual: 수동 확인 필요
  if (check.source === 'manual') {
    return { status: 'yellow', message: 'Manual check required' };
  }

  // cron_log: health_check_logs에서 해당 엔드포인트 최신 로그 확인
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
      message: log.overall_status === 'green' ? 'OK' : `Issues detected`,
      lastChecked: log.checked_at,
    };
  }

  // health_check_logs: D11 health-check의 개별 체크 결과에서 확인
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

    // health_check_logs에 데이터가 있으면 green
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

  // Division 전체 상태: 가장 심각한 상태로 결정
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

  try {
    const cronLogs = await getLatestCronLogs();
    const healthCheckLog = cronLogs.get('health-check');

    const divisions = DIVISION_CHECKLISTS.map(d =>
      getDivisionStatus(d, cronLogs, healthCheckLog)
    );

    const greenCount = divisions.filter(d => d.status === 'green').length;
    const yellowDivisions = divisions.filter(d => d.status === 'yellow');
    const redDivisions = divisions.filter(d => d.status === 'red');

    // Overall status
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
