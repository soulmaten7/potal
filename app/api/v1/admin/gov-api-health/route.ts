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
  headers?: Record<string, string>;
  validateJson?: (data: unknown) => boolean;
}

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

  // Check all APIs in parallel
  const checks = GOV_APIS.map(async (api): Promise<ApiCheckResult> => {
    const apiStart = Date.now();
    try {
      const res = await fetch(api.testUrl, {
        headers: api.headers || {},
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      });

      const latency = Date.now() - apiStart;
      const isUp = res.status >= 200 && res.status < 500;

      if (!isUp) {
        return {
          name: api.name, country: api.country, status: 'red',
          httpStatus: res.status, latencyMs: latency,
          message: `HTTP ${res.status}`,
        };
      }

      return {
        name: api.name, country: api.country,
        status: latency > 10000 ? 'yellow' : 'green',
        httpStatus: res.status, latencyMs: latency,
        message: latency > 10000 ? `Slow: ${latency}ms` : `OK (${latency}ms)`,
      };
    } catch (err) {
      return {
        name: api.name, country: api.country, status: 'red',
        httpStatus: 0, latencyMs: Date.now() - apiStart,
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
