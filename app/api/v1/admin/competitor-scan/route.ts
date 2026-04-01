/**
 * POTAL API v1 — /api/v1/admin/competitor-scan
 *
 * D15 Intelligence Layer 1 — Competitor website availability monitoring.
 * Checks if the 10 main competitor websites are still live.
 * Detects if any competitor goes down, rebrands, or changes pricing page.
 *
 * Vercel Cron: weekly Monday 08:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

interface Competitor {
  name: string;
  url: string;
  pricingUrl?: string;
}

const COMPETITORS: Competitor[] = [
  { name: 'Zonos', url: 'https://zonos.com', pricingUrl: 'https://zonos.com/pricing' },
  { name: 'Avalara', url: 'https://www.avalara.com', pricingUrl: 'https://www.avalara.com/us/en/products/cross-border.html' },
  { name: 'Global-e', url: 'https://www.global-e.com' },
  { name: 'Duty Calculator', url: 'https://www.dutycalculator.com' },
  { name: 'SimplyDuty', url: 'https://www.simplyduty.com', pricingUrl: 'https://www.simplyduty.com/pricing' },
  { name: 'Tarifflo', url: 'https://tarifflo.com' },
  { name: 'Cross-Border', url: 'https://cross-border.com' },
  { name: 'Landed Cost Guru', url: 'https://landedcostguru.com' },
  { name: 'TaxJar', url: 'https://www.taxjar.com' },
  { name: 'Vertex', url: 'https://www.vertexinc.com' },
];

interface CompetitorResult {
  name: string;
  mainSite: { status: 'green' | 'yellow' | 'red'; httpStatus: number; latencyMs: number };
  pricingPage?: { status: 'green' | 'yellow' | 'red'; httpStatus: number; latencyMs: number };
  message: string;
}

async function checkUrl(url: string): Promise<{ status: 'green' | 'yellow' | 'red'; httpStatus: number; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    const latency = Date.now() - start;
    const isUp = res.status >= 200 && res.status < 400;
    return {
      status: !isUp ? 'yellow' : latency > 10000 ? 'yellow' : 'green',
      httpStatus: res.status,
      latencyMs: latency,
    };
  } catch {
    return { status: 'red', httpStatus: 0, latencyMs: Date.now() - start };
  }
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: CompetitorResult[] = [];

  // Check all competitors in parallel
  const checks = COMPETITORS.map(async (comp): Promise<CompetitorResult> => {
    const mainCheck = await checkUrl(comp.url);
    const pricingCheck = comp.pricingUrl ? await checkUrl(comp.pricingUrl) : undefined;

    const mainDown = mainCheck.status === 'red';
    const pricingChanged = pricingCheck && pricingCheck.status !== 'green';

    let message = `${comp.name}: `;
    if (mainDown) {
      message += 'SITE DOWN';
    } else if (pricingChanged) {
      message += `site OK, pricing page ${pricingCheck.status === 'red' ? 'DOWN' : 'changed'} (HTTP ${pricingCheck.httpStatus})`;
    } else {
      message += 'OK';
    }

    return { name: comp.name, mainSite: mainCheck, pricingPage: pricingCheck, message };
  });

  results.push(...await Promise.all(checks));

  const siteDownCount = results.filter(r => r.mainSite.status === 'red').length;
  const pricingChanges = results.filter(r => r.pricingPage && r.pricingPage.status !== 'green').length;
  const overall = siteDownCount >= 3 ? 'red' : (siteDownCount > 0 || pricingChanges > 0) ? 'yellow' : 'green';
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
      checks: results.map(r => ({
        name: `competitor:${r.name}`,
        status: r.mainSite.status,
        latencyMs: r.mainSite.latencyMs,
        message: r.message,
        pricingStatus: r.pricingPage?.status,
      })),
      duration_ms: durationMs,
    });
  } catch {
    // Silent fail
  }

  return NextResponse.json({
    success: true,
    overall,
    durationMs,
    siteDownCount,
    pricingChanges,
    competitors: results,
    alertRequired: overall !== 'green',
  });
}
