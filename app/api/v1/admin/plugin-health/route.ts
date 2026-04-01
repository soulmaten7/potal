/**
 * POTAL API v1 — /api/v1/admin/plugin-health
 *
 * D6 Platform & Plugins Layer 1 — Plugin ecosystem health monitoring.
 * Validates that the widget JS and key plugin-dependent API endpoints
 * are accessible and functional.
 *
 * Vercel Cron: every 12 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.potal.app';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

interface PluginCheck {
  name: string;
  url: string;
  type: 'endpoint' | 'widget' | 'webhook';
  validateResponse?: (status: number, body: string) => boolean;
}

const PLUGIN_CHECKS: PluginCheck[] = [
  {
    name: 'Widget Config API',
    url: `${BASE_URL}/api/v1/widget/config`,
    type: 'endpoint',
  },
  {
    name: 'Calculate API',
    url: `${BASE_URL}/api/v1/health`,
    type: 'endpoint',
  },
  {
    name: 'Shopify Auth Endpoint',
    url: `${BASE_URL}/api/shopify/auth`,
    type: 'endpoint',
  },
  {
    name: 'Billing Webhook Endpoint',
    url: `${BASE_URL}/api/billing/webhook`,
    type: 'webhook',
  },
  {
    name: 'Shopify Webhook Endpoint',
    url: `${BASE_URL}/api/shopify/webhooks`,
    type: 'webhook',
  },
];

interface CheckResult {
  name: string;
  type: string;
  status: 'green' | 'yellow' | 'red';
  httpStatus: number;
  latencyMs: number;
  message: string;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: CheckResult[] = [];

  const checks = PLUGIN_CHECKS.map(async (check): Promise<CheckResult> => {
    const checkStart = Date.now();
    try {
      const res = await fetch(check.url, {
        method: check.type === 'webhook' ? 'POST' : 'GET',
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
        body: check.type === 'webhook' ? '{}' : undefined,
        headers: check.type === 'webhook' ? { 'Content-Type': 'application/json' } : {},
      });

      const latency = Date.now() - checkStart;
      // Webhooks may return 400/401 (no valid payload) — that's OK, means endpoint exists
      const isAlive = check.type === 'webhook'
        ? res.status < 500
        : res.status >= 200 && res.status < 500;

      return {
        name: check.name, type: check.type,
        status: !isAlive ? 'red' : latency > 5000 ? 'yellow' : 'green',
        httpStatus: res.status, latencyMs: latency,
        message: !isAlive
          ? `Down: HTTP ${res.status}`
          : latency > 5000
            ? `Slow: ${latency}ms`
            : `OK (${latency}ms)`,
      };
    } catch (err) {
      return {
        name: check.name, type: check.type, status: 'red',
        httpStatus: 0, latencyMs: Date.now() - checkStart,
        message: `Unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  });

  results.push(...await Promise.all(checks));

  const hasRed = results.some(r => r.status === 'red');
  const hasYellow = results.some(r => r.status === 'yellow');
  const overall = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';
  const durationMs = Date.now() - start;

  // Save to health_check_logs
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: results.map(r => ({ name: `plugin:${r.name}`, status: r.status, latencyMs: r.latencyMs, message: r.message })),
      duration_ms: durationMs,
    });
  } catch {
    // Silent fail
  }

  return NextResponse.json({
    success: true,
    overall,
    durationMs,
    plugins: results,
    alertRequired: overall !== 'green',
  });
}
