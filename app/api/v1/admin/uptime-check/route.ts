/**
 * POTAL API v1 — /api/v1/admin/uptime-check
 *
 * D5 Product & Web Layer 1 — Uptime and response time monitoring.
 * Checks critical pages and API endpoints for availability.
 *
 * Vercel Cron: every 6 hours
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
  const secret = req.nextUrl.searchParams.get('secret');
  return secret === CRON_SECRET;
}

interface PageCheck {
  path: string;
  label: string;
  expectedStatus: number;
}

const PAGES_TO_CHECK: PageCheck[] = [
  { path: '/', label: 'Landing page', expectedStatus: 200 },
  { path: '/pricing', label: 'Pricing page', expectedStatus: 200 },
  { path: '/dashboard', label: 'Dashboard (redirect OK)', expectedStatus: 200 },
  { path: '/login', label: 'Login page', expectedStatus: 200 },
  { path: '/api/v1/health', label: 'API Health', expectedStatus: 200 },
  { path: '/api/v1/docs', label: 'API Docs', expectedStatus: 200 },
];

interface CheckResult {
  label: string;
  path: string;
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

  for (const page of PAGES_TO_CHECK) {
    const pageStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      const latency = Date.now() - pageStart;
      const ok = res.status === page.expectedStatus;

      results.push({
        label: page.label,
        path: page.path,
        status: !ok ? 'red' : latency > 5000 ? 'yellow' : 'green',
        httpStatus: res.status,
        latencyMs: latency,
        message: !ok
          ? `Expected ${page.expectedStatus}, got ${res.status}`
          : latency > 5000
            ? `Slow: ${latency}ms`
            : `OK (${latency}ms)`,
      });
    } catch (err) {
      results.push({
        label: page.label,
        path: page.path,
        status: 'red',
        httpStatus: 0,
        latencyMs: Date.now() - pageStart,
        message: `Unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    }
  }

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
      checks: results.map(r => ({ name: `uptime:${r.path}`, status: r.status, latencyMs: r.latencyMs, message: r.message })),
      duration_ms: durationMs,
    });
  } catch {
    // Silent fail
  }

  return NextResponse.json({
    success: true,
    overall,
    durationMs,
    checks: results,
    alertRequired: overall !== 'green',
  });
}
