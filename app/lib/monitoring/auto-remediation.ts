/**
 * Layer 1/2 Auto-Remediation
 *
 * Automatically attempts to fix issues classified as Layer 1 (retryable)
 * and Layer 2 (monitorable). Results are logged to health_check_logs.
 *
 * Layer 1 actions:
 * - retry_cron: Re-trigger the failing cron endpoint
 *
 * Layer 2 actions:
 * - spot-check drift within 5%: warning only, wait for next check
 * - spot-check drift >5%: escalate to Yellow, report to CEO
 * - data row decrease >10%: escalate to Red
 */

import { createClient } from '@supabase/supabase-js';
import { type ClassifiedIssue, getRemediationEndpoint } from './issue-classifier';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const CRON_SECRET = process.env.CRON_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.potal.app';

export interface RemediationResult {
  division: string;
  checkId: string;
  checkLabel: string;
  action: string;
  success: boolean;
  message: string;
  durationMs: number;
}

/**
 * Attempt auto-remediation for a classified issue.
 * Returns null if the issue is not auto-remediable.
 */
async function remediateIssue(issue: ClassifiedIssue): Promise<RemediationResult | null> {
  if (!issue.autoRemediable || !issue.remediationAction) {
    return null;
  }

  const start = Date.now();

  if (issue.remediationAction === 'retry_cron') {
    return retryCron(issue, start);
  }

  return {
    division: issue.division,
    checkId: issue.checkId,
    checkLabel: issue.checkLabel,
    action: issue.remediationAction,
    success: false,
    message: `Unknown remediation action: ${issue.remediationAction}`,
    durationMs: Date.now() - start,
  };
}

/**
 * Retry a cron endpoint up to 3 times with 5-second intervals.
 */
async function retryCron(issue: ClassifiedIssue, start: number): Promise<RemediationResult> {
  const endpoint = getRemediationEndpoint('retry_cron', issue.checkId);

  if (!endpoint) {
    return {
      division: issue.division,
      checkId: issue.checkId,
      checkLabel: issue.checkLabel,
      action: 'retry_cron',
      success: false,
      message: `No endpoint mapping for ${issue.checkId}`,
      durationMs: Date.now() - start,
    };
  }

  const url = `${BASE_URL}${endpoint}?secret=${encodeURIComponent(CRON_SECRET)}`;
  const maxRetries = 3;
  const retryDelayMs = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        return {
          division: issue.division,
          checkId: issue.checkId,
          checkLabel: issue.checkLabel,
          action: `retry_cron (attempt ${attempt}/${maxRetries})`,
          success: true,
          message: `Cron ${endpoint} succeeded on attempt ${attempt}`,
          durationMs: Date.now() - start,
        };
      }

      // Non-OK response, retry if not last attempt
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
      }
    } catch {
      // Timeout or network error, retry if not last attempt
      if (attempt < maxRetries) {
        await sleep(retryDelayMs);
      }
    }
  }

  return {
    division: issue.division,
    checkId: issue.checkId,
    checkLabel: issue.checkLabel,
    action: `retry_cron (${maxRetries} attempts failed)`,
    success: false,
    message: `Cron ${endpoint} failed after ${maxRetries} attempts — escalating`,
    durationMs: Date.now() - start,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run auto-remediation for all eligible issues.
 * Returns results for each attempted remediation.
 */
export async function runAutoRemediation(
  issues: ClassifiedIssue[]
): Promise<RemediationResult[]> {
  const results: RemediationResult[] = [];

  // Process Layer 1 issues first (auto-retryable)
  const layer1 = issues.filter(i => i.layer === 1 && i.autoRemediable);
  for (const issue of layer1) {
    const result = await remediateIssue(issue);
    if (result) {
      results.push(result);
    }
  }

  // Layer 2 auto-remediable (currently none, but extensible)
  const layer2 = issues.filter(i => i.layer === 2 && i.autoRemediable);
  for (const issue of layer2) {
    const result = await remediateIssue(issue);
    if (result) {
      results.push(result);
    }
  }

  // Log remediation results to health_check_logs
  if (results.length > 0) {
    await logRemediationResults(results);
  }

  return results;
}

/**
 * Save remediation results to health_check_logs for audit trail.
 */
async function logRemediationResults(results: RemediationResult[]): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const overall = failed > 0 ? 'yellow' : 'green';
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: results.map(r => ({
        name: `remediation:${r.checkId}`,
        status: r.success ? 'green' : 'yellow',
        message: r.message,
        action: r.action,
        division: r.division,
      })),
      duration_ms: totalDuration,
      source: 'auto-remediation',
    });

    // Log summary
    if (typeof console !== 'undefined') {
      console.error(`[auto-remediation] ${succeeded} succeeded, ${failed} failed, ${totalDuration}ms`);
    }
  } catch {
    // Silent fail — remediation logging should not block
  }
}
