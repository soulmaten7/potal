/**
 * POTAL API v1 — /api/v1/admin/gov-api-health
 *
 * D4 Data Pipeline Layer 1 — Government API health checks.
 * Pings all 7 government tariff APIs to verify availability.
 *
 * Vercel Cron: every 12 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { reportCronAlert } from '@/app/lib/notifications/escalation';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

interface GovApi {
  name: string;
  country: string;
  testUrl: string;
  fallbackUrls?: string[];
  headers?: Record<string, string>;
  validateJson?: (data: unknown) => boolean;
  /**
   * If true, connectivity failure from serverless runtime is treated as 'yellow'
   * instead of 'red'. Use for monitor-layer checks where intermittent network
   * issues shouldn't trigger full escalation. (e.g. Korean govt WAF drops
   * non-browser User-Agents at network level — see D4 RED incident 2026-04-07~10.)
   */
  softFail?: boolean;
}

// Default browser-like User-Agent. Many government sites (notably KR, JP) block
// or silently drop requests from default Node/undici User-Agent strings at WAF level.
const DEFAULT_UA =
  'Mozilla/5.0 (compatible; POTAL-HealthCheck/1.0; +https://potal.app/bot) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const GOV_APIS: GovApi[] = [
  {
    name: 'USITC',
    country: 'US',
    testUrl: 'https://hts.usitc.gov/api/search?query=6109100012',
    validateJson: (d: unknown) => Array.isArray(d) || (typeof d === 'object' && d !== null),
  },
  {
    name: 'UK Trade Tariff',
    country: 'GB',
    testUrl: 'https://www.trade-tariff.service.gov.uk/api/v2/commodities/6109100010',
    validateJson: (d: unknown) => typeof d === 'object' && d !== null && 'data' in (d as Record<string, unknown>),
  },
  {
    name: 'EU TARIC',
    country: 'EU',
    testUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric/measures.js?lang=en&SimDate=20260101&GoodsCode=6109100010&CountryCode=US',
  },
  {
    name: 'Canada CBSA',
    country: 'CA',
    testUrl: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2025/html/rules-regles-eng.html',
  },
  {
    name: 'Australia ABF',
    country: 'AU',
    testUrl: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification',
  },
  {
    name: 'Japan Customs',
    country: 'JP',
    testUrl: 'https://www.customs.go.jp/english/tariff/index.htm',
  },
  {
    name: 'Korea KCS',
    country: 'KR',
    testUrl: 'https://unipass.customs.go.kr/clip/index.do',
    fallbackUrls: [
      'https://www.customs.go.kr/kcs/main.do',
      'https://www.customs.go.kr/',
      'https://unipass.customs.go.kr/csp/index.do',
    ],
    softFail: true,
  },
];

interface ApiCheckResult {
  name: string;
  country: string;
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
  const results: ApiCheckResult[] = [];

  // Single URL probe helper — sends browser-like UA by default
  async function probe(
    url: string,
    customHeaders?: Record<string, string>,
  ): Promise<{ ok: boolean; status: number; latencyMs: number; message: string }> {
    const t0 = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': DEFAULT_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.5',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(customHeaders || {}),
        },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      });
      const latency = Date.now() - t0;
      const isUp = res.status >= 200 && res.status < 500;
      return {
        ok: isUp,
        status: res.status,
        latencyMs: latency,
        message: isUp
          ? (latency > 10000 ? `Slow: ${latency}ms` : `OK (${latency}ms)`)
          : `HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        latencyMs: Date.now() - t0,
        message: `Unreachable: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  // Check all APIs in parallel — with fallback chain support
  const checks = GOV_APIS.map(async (api): Promise<ApiCheckResult> => {
    // Try primary, then fallbacks until one succeeds
    const urls = [api.testUrl, ...(api.fallbackUrls || [])];
    let last: Awaited<ReturnType<typeof probe>> | null = null;
    let usedFallback = false;
    for (let i = 0; i < urls.length; i++) {
      last = await probe(urls[i], api.headers);
      if (last.ok) {
        usedFallback = i > 0;
        break;
      }
    }
    if (!last) {
      return {
        name: api.name, country: api.country, status: 'red',
        httpStatus: 0, latencyMs: 0, message: 'No URL configured',
      };
    }

    if (last.ok) {
      const slow = last.latencyMs > 10000;
      return {
        name: api.name, country: api.country,
        status: slow ? 'yellow' : 'green',
        httpStatus: last.status, latencyMs: last.latencyMs,
        message: usedFallback ? `${last.message} (via fallback)` : last.message,
      };
    }

    // All URLs failed. softFail APIs get downgraded RED → YELLOW
    // (monitor-layer connectivity issues shouldn't trigger full escalation)
    return {
      name: api.name, country: api.country,
      status: api.softFail ? 'yellow' : 'red',
      httpStatus: last.status, latencyMs: last.latencyMs,
      message: api.softFail
        ? `Soft-fail: ${last.message} (all ${urls.length} endpoints unreachable)`
        : last.message,
    };
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
      checks: results.map(r => ({ name: `gov_api:${r.name}`, status: r.status, latencyMs: r.latencyMs, message: r.message })),
      duration_ms: durationMs,
    });
  } catch {
    // Silent fail
  }

  // Escalation: Yellow/Red 시 즉시 Chief에게 보고
  if (overall !== 'green') {
    await reportCronAlert({
      source: 'gov-api-health',
      sourceName: 'D4 정부 API 헬스체크',
      overall,
      issues: results.map(r => ({
        name: `${r.name} (${r.country})`,
        status: r.status,
        message: r.message,
      })),
      durationMs,
    });
  }

  return NextResponse.json({
    success: true,
    overall,
    durationMs,
    apis: results,
    alertRequired: overall !== 'green',
  });
}
