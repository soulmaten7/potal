/**
 * POTAL demo API — /api/demo/scenario
 *
 * CW24 Sprint 2. Homepage-only demo endpoint.
 *
 * - No auth required (homepage data URL for unauthenticated visitors)
 * - Simple in-memory IP throttle: 30 req/min per IP
 * - Always returns structured result; falls back to mock data if anything goes
 *   wrong so the NonDevPanel UI never breaks
 * - Cache-Control: no-store (results change with inputs)
 *
 * NOT a public API. Do not link from external docs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockResult, type MockResult } from '@/lib/scenarios/mock-results';

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 30;

interface Counter {
  count: number;
  windowStart: number;
}
const ipCounters = new Map<string, Counter>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounters.get(ip);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    ipCounters.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= LIMIT_PER_WINDOW) return true;
  entry.count += 1;
  return false;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

interface DemoRequestBody {
  scenarioId?: string;
  inputs?: Record<string, string | number | undefined>;
}

interface DemoResponseData {
  scenarioId: string;
  source: 'mock' | 'live';
  inputs: Record<string, string | number | undefined>;
  result: MockResult;
  generatedAt: string;
}

function applyInputsToResult(mock: MockResult, inputs: Record<string, string | number | undefined>): MockResult {
  // Let the user's declared value / quantity flow through so the UI reflects
  // their input instead of a hardcoded number. Everything else stays on the
  // mock baseline for Sprint 2 (real engine integration comes later).
  const value = Number(inputs.value ?? inputs.declaredValue ?? mock.landedCost.productValue);
  if (!Number.isFinite(value) || value <= 0 || value === mock.landedCost.productValue) {
    return mock;
  }
  const ratio = value / mock.landedCost.productValue;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ...mock,
    landedCost: {
      ...mock.landedCost,
      productValue: round2(value),
      duty: round2(mock.landedCost.duty * ratio),
      taxes: round2(mock.landedCost.taxes * ratio),
      shipping: mock.landedCost.shipping,
      fees: mock.landedCost.fees,
      total: round2(
        value +
          mock.landedCost.duty * ratio +
          mock.landedCost.taxes * ratio +
          mock.landedCost.shipping +
          mock.landedCost.fees
      ),
    },
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (throttled(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'rate_limited',
          message: 'Demo rate limit: 30 requests per minute. Slow down and try again.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': '30',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  let body: DemoRequestBody;
  try {
    body = (await req.json()) as DemoRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'bad_json', message: 'Invalid JSON body.' } },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const scenarioId = (body.scenarioId || '').trim();
  if (!scenarioId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'missing_scenario', message: 'scenarioId is required.' },
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const mock = getMockResult(scenarioId);
  if (!mock) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'unknown_scenario', message: `Unknown scenarioId "${scenarioId}".` },
      },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const inputs: Record<string, string | number | undefined> = body.inputs || {};
  const result = applyInputsToResult(mock, inputs);

  // Sprint 2: always `source: mock`. Later sprints can try the real engines
  // first and fall back to mock on error without changing this response shape.
  const data: DemoResponseData = {
    scenarioId,
    source: 'mock',
    inputs,
    result,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(
    { success: true, data },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'method_not_allowed',
        message:
          'Use POST with JSON body: { "scenarioId": "seller", "inputs": { "value": 45 } }',
      },
    },
    { status: 405, headers: { 'Cache-Control': 'no-store' } }
  );
}
