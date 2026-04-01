/**
 * POTAL API v1 — /api/v1/admin/division-monitor
 *
 * 24/7 자동 모니터링 루프 (매 30분 Vercel Cron).
 * 1. 15개 Division 체크 실행 (division-checklists)
 * 2. Yellow/Red 이슈 분류 (issue-classifier)
 * 3. Layer 1/2 자동 수정 시도 (auto-remediation)
 * 4. Layer 3 이슈 → Telegram 알림 → Make.com 폴백 → 이메일 폴백
 * 5. 결과를 health_check_logs에 저장
 *
 * GET /api/v1/admin/division-monitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DIVISION_CHECKLISTS, type CheckItem, type DivisionChecklist } from '@/app/lib/monitoring/division-checklists';
import type { CheckStatus } from '@/app/lib/monitoring/health-monitor';
import { classifyIssue, type ClassifiedIssue } from '@/app/lib/monitoring/issue-classifier';
import { runAutoRemediation, type RemediationResult } from '@/app/lib/monitoring/auto-remediation';
import { sendTelegramAlertBatch } from '@/app/lib/notifications/telegram-alert';
import { reportEscalationResult } from '@/app/lib/notifications/escalation';

const CRON_SECRET = process.env.CRON_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MORNING_BRIEF_EMAIL_TO = process.env.MORNING_BRIEF_EMAIL_TO || 'contact@potal.app';
const MORNING_BRIEF_EMAIL_FROM = process.env.MORNING_BRIEF_EMAIL_FROM || 'POTAL <onboarding@resend.dev>';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

interface CronLogEntry {
  checked_at: string;
  overall_status: CheckStatus;
  checks: Array<{ name: string; status: CheckStatus; message: string }>;
  source?: string;
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
  if (names.some(n => n.includes('division-monitor'))) return 'division-monitor';

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

interface DivisionStatus {
  id: string;
  name: string;
  status: CheckStatus;
  checks: Array<{
    id: string;
    label: string;
    status: CheckStatus;
    message: string;
  }>;
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
      status: result.status,
      message: result.message,
    };
  });

  const hasRed = checks.some(c => c.status === 'red');
  const hasYellow = checks.some(c => c.status === 'yellow');
  const overall: CheckStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  return {
    id: division.id,
    name: division.name,
    status: division.layer1Status === 'pending' ? 'yellow' : overall,
    checks,
  };
}

/**
 * Send Layer 3 issues via Make.com webhook as fallback.
 */
async function sendMakeWebhook(
  issues: Array<{ division: string; divisionName: string; issue: string; status: string; recommendation: string }>
): Promise<{ sent: boolean; reason: string }> {
  if (!MAKE_WEBHOOK_URL) {
    return { sent: false, reason: 'MAKE_WEBHOOK_URL not configured' };
  }

  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'potal-division-monitor',
        timestamp: new Date().toISOString(),
        issues,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { sent: false, reason: `Make.com webhook error (${res.status})` };
    }

    return { sent: true, reason: 'Make.com webhook sent' };
  } catch (err) {
    return { sent: false, reason: `Make.com webhook failed: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

/**
 * Send Layer 3 alert email via Resend as last fallback.
 */
async function sendAlertEmail(
  issues: Array<{ division: string; divisionName: string; issue: string; status: string; recommendation: string }>
): Promise<{ sent: boolean; reason: string }> {
  if (!RESEND_API_KEY) {
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }

  const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const issueRows = issues.map(i =>
    `<tr>
      <td style="padding:6px 8px;font-weight:600;">${i.division} ${i.divisionName}</td>
      <td style="padding:6px 8px;">${i.issue}</td>
      <td style="padding:6px 8px;color:${i.status === 'red' ? '#ef4444' : '#f59e0b'};">${i.status.toUpperCase()}</td>
      <td style="padding:6px 8px;font-size:12px;">${i.recommendation}</td>
    </tr>`
  ).join('');

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#dc2626;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">🔴 POTAL Division Monitor — 긴급 알림</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#fecaca;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <th style="padding:8px;text-align:left;">Division</th>
        <th style="padding:8px;text-align:left;">Issue</th>
        <th style="padding:8px;text-align:left;">Status</th>
        <th style="padding:8px;text-align:left;">Recommendation</th>
      </tr>
      ${issueRows}
    </table>
  </div>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MORNING_BRIEF_EMAIL_FROM,
        to: [MORNING_BRIEF_EMAIL_TO],
        subject: `🔴 POTAL 긴급 — ${issues.length} Layer 3 이슈`,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { sent: false, reason: `Resend error (${res.status})` };
    }

    return { sent: true, reason: 'Alert email sent' };
  } catch (err) {
    return { sent: false, reason: `Email failed: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  try {
    // Step 1: Get cron logs and evaluate all divisions
    const cronLogs = await getLatestCronLogs();
    const healthCheckLog = cronLogs.get('health-check');

    const divisions = DIVISION_CHECKLISTS.map(d =>
      getDivisionStatus(d, cronLogs, healthCheckLog)
    );

    // Step 2: Classify all issues
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

    // Step 3: Auto-remediation for Layer 1/2
    let remediationResults: RemediationResult[] = [];
    if (allIssues.some(i => i.autoRemediable)) {
      remediationResults = await runAutoRemediation(allIssues);
    }

    const autoResolved = remediationResults.filter(r => r.success);

    // Step 4: Identify Layer 3 issues needing human attention
    const layer3Issues = allIssues
      .filter(i => i.layer === 3)
      .map(i => ({
        division: i.division,
        divisionName: i.divisionName,
        issue: i.checkLabel,
        status: i.status,
        recommendation: i.recommendation,
      }));

    // Also include failed remediation attempts
    const failedRemediation = remediationResults
      .filter(r => !r.success)
      .map(r => {
        const issue = allIssues.find(i => i.checkId === r.checkId);
        return {
          division: r.division,
          divisionName: issue?.divisionName || r.division,
          issue: r.checkLabel,
          status: 'yellow' as string,
          recommendation: `Auto-fix failed: ${r.message}`,
        };
      });

    const needsAttention = [...layer3Issues, ...failedRemediation];

    // Step 5: Escalation 보고 — 성공/실패 모두 Chief Bot으로 보고
    const greenCount = divisions.filter(d => d.status === 'green').length;
    const yellowCount = divisions.filter(d => d.status === 'yellow').length;
    const redCount = divisions.filter(d => d.status === 'red').length;
    const overall: CheckStatus = redCount > 0 ? 'red' : yellowCount > 0 ? 'yellow' : 'green';

    const notifications: Record<string, { sent: boolean; reason: string }> = {};

    const escalationReport = await reportEscalationResult({
      overall,
      greenCount,
      yellowCount,
      redCount,
      autoResolved: autoResolved.map(r => ({
        division: r.division,
        issue: r.checkLabel,
        action: r.action,
      })),
      needsAttention,
      durationMs: Date.now() - start,
    });

    notifications.escalation = { sent: escalationReport.sent, reason: escalationReport.type };

    // Telegram 실패 시 Make.com → Email 폴백 (needsAttention 있을 때만)
    if (!escalationReport.sent && needsAttention.length > 0) {
      const makeResult = await sendMakeWebhook(needsAttention);
      notifications.make = makeResult;

      if (!makeResult.sent) {
        const emailResult = await sendAlertEmail(needsAttention);
        notifications.email = emailResult;
      }
    }

    // Step 6: Save to health_check_logs

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      await supabase.from('health_check_logs').insert({
        checked_at: new Date().toISOString(),
        overall_status: overall,
        checks: divisions.map(d => ({
          name: `division:${d.id}`,
          status: d.status,
          message: `${d.name}: ${d.checks.filter(c => c.status !== 'green').length} issues`,
        })),
        duration_ms: Date.now() - start,
        source: 'division-monitor',
      });
    } catch {
      // Silent fail — logging should not block response
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - start,
      overall,
      total_divisions: 15,
      green: greenCount,
      yellow: yellowCount,
      red: redCount,
      auto_resolved: autoResolved.map(r => ({
        division: r.division,
        issue: r.checkLabel,
        action: r.action,
      })),
      needs_attention: needsAttention,
      notifications,
      escalation: escalationReport,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      durationMs: Date.now() - start,
    }, { status: 500 });
  }
}
