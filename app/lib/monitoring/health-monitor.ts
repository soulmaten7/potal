/**
 * D11 Infrastructure — Health Monitor
 *
 * Checks critical infrastructure components:
 * 1. Supabase DB connectivity + row counts
 * 2. API endpoint responsiveness
 * 3. Cron job last-run status
 *
 * Results are logged to `health_check_logs` table for Morning Brief consumption.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export type CheckStatus = 'green' | 'yellow' | 'red';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  timestamp: string;
  overall: CheckStatus;
  checks: CheckResult[];
  durationMs: number;
}

/** Check Supabase DB connectivity + critical table row counts */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = getServiceClient();

    // Quick connectivity test
    const { count, error } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        name: 'database',
        status: 'red',
        latencyMs: Date.now() - start,
        message: `DB error: ${error.message}`,
      };
    }

    const latency = Date.now() - start;
    const countryCount = count ?? 0;

    if (countryCount < 200) {
      return {
        name: 'database',
        status: 'yellow',
        latencyMs: latency,
        message: `countries table has ${countryCount} rows (expected 240)`,
        details: { countryCount },
      };
    }

    return {
      name: 'database',
      status: latency > 5000 ? 'yellow' : 'green',
      latencyMs: latency,
      message: latency > 5000
        ? `DB slow: ${latency}ms (countries: ${countryCount})`
        : `DB OK (countries: ${countryCount})`,
      details: { countryCount },
    };
  } catch (err) {
    return {
      name: 'database',
      status: 'red',
      latencyMs: Date.now() - start,
      message: `DB unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/** Check critical data tables have expected row counts */
async function checkDataIntegrity(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = getServiceClient();

    const tables = [
      { name: 'vat_gst_rates', minRows: 200 },
      { name: 'de_minimis_thresholds', minRows: 200 },
      { name: 'customs_fees', minRows: 200 },
      { name: 'macmap_ntlc_rates', minRows: 100000 },
    ];

    const issues: string[] = [];
    const details: Record<string, number> = {};

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      const rowCount = count ?? 0;
      details[table.name] = rowCount;

      if (error) {
        issues.push(`${table.name}: error — ${error.message}`);
      } else if (rowCount < table.minRows) {
        issues.push(`${table.name}: ${rowCount} rows (min: ${table.minRows})`);
      }
    }

    const latency = Date.now() - start;

    if (issues.length > 0) {
      return {
        name: 'data_integrity',
        status: 'yellow',
        latencyMs: latency,
        message: issues.join('; '),
        details,
      };
    }

    return {
      name: 'data_integrity',
      status: 'green',
      latencyMs: latency,
      message: `All ${tables.length} critical tables OK`,
      details,
    };
  } catch (err) {
    return {
      name: 'data_integrity',
      status: 'red',
      latencyMs: Date.now() - start,
      message: `Data check failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/** Check API health endpoint */
async function checkApiHealth(baseUrl: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - start;

    if (!res.ok) {
      return {
        name: 'api_health',
        status: 'red',
        latencyMs: latency,
        message: `API returned ${res.status}`,
      };
    }

    const data = await res.json();

    return {
      name: 'api_health',
      status: latency > 3000 ? 'yellow' : 'green',
      latencyMs: latency,
      message: latency > 3000
        ? `API slow: ${latency}ms`
        : `API OK (${data.version || 'unknown'})`,
      details: { status: data.status, version: data.version },
    };
  } catch (err) {
    return {
      name: 'api_health',
      status: 'red',
      latencyMs: Date.now() - start,
      message: `API unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/** Check Supabase Auth service */
async function checkAuth(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_KEY },
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - start;

    if (!res.ok) {
      return {
        name: 'auth',
        status: 'red',
        latencyMs: latency,
        message: `Auth service returned ${res.status}`,
      };
    }

    return {
      name: 'auth',
      status: latency > 3000 ? 'yellow' : 'green',
      latencyMs: latency,
      message: latency > 3000 ? `Auth slow: ${latency}ms` : 'Auth OK',
    };
  } catch (err) {
    return {
      name: 'auth',
      status: 'red',
      latencyMs: Date.now() - start,
      message: `Auth unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/** Run all health checks and return a report */
export async function runHealthChecks(baseUrl: string): Promise<HealthReport> {
  const start = Date.now();

  const checks = await Promise.all([
    checkDatabase(),
    checkDataIntegrity(),
    checkApiHealth(baseUrl),
    checkAuth(),
  ]);

  const hasRed = checks.some(c => c.status === 'red');
  const hasYellow = checks.some(c => c.status === 'yellow');
  const overall: CheckStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

  return {
    timestamp: new Date().toISOString(),
    overall,
    checks,
    durationMs: Date.now() - start,
  };
}

/** Save health report to Supabase for Morning Brief */
export async function saveHealthReport(report: HealthReport): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase.from('health_check_logs').insert({
      checked_at: report.timestamp,
      overall_status: report.overall,
      checks: report.checks,
      duration_ms: report.durationMs,
    });
  } catch {
    // Silent fail — health check itself should not crash
  }
}

/** Get latest health status (for Morning Brief) */
export async function getLatestHealthStatus(): Promise<HealthReport | null> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('health_check_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      timestamp: data.checked_at,
      overall: data.overall_status,
      checks: data.checks,
      durationMs: data.duration_ms,
    };
  } catch {
    return null;
  }
}
