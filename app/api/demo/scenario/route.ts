/**
 * POTAL demo API — /api/demo/scenario
 *
 * Homepage-only demo endpoint.
 *
 * - No auth required (homepage data URL for unauthenticated visitors)
 * - Simple in-memory IP throttle: 30 req/min per IP
 * - CW29 Sprint 7: real-first, mock-fallback.
 *     1. Try calling the real POTAL engines (/api/v1/classify + /api/v1/calculate)
 *        with the demo bypass header (`X-Demo-Request: true`).
 *     2. On any error, timeout, or missing field → fall back to scenario mock.
 *     3. Response schema unchanged (NonDevPanel does not see "source" in UI).
 * - Timeouts: 1500ms per engine call, 2500ms for the whole chain.
 * - Adds `X-Response-Time: {ms}` response header for perf tracing.
 * - Cache-Control: no-store (results change with inputs).
 *
 * NOT a public API. Do not link from external docs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockResult, type MockResult } from '@/lib/scenarios/mock-results';
import { getScenarioApiChain } from '@/lib/scenarios/workflow-examples';

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 30;
const TIMEOUT_PER_CALL_MS = 1500;
const TIMEOUT_TOTAL_MS = 2500;

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

// ─── Input scaling (mock baseline) ──────────────────────────────

function applyInputsToResult(
  mock: MockResult,
  inputs: Record<string, string | number | undefined>
): MockResult {
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

// ─── Live engine wiring ─────────────────────────────────────────

type JsonObject = Record<string, unknown>;

function pickNumber(obj: unknown, ...keys: string[]): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as JsonObject;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return undefined;
}

function pickString(obj: unknown, ...keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const o = obj as JsonObject;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim() !== '') return v;
  }
  return undefined;
}

async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res;
  } catch {
    return null;
  }
}

/**
 * Shape the live engine responses into the MockResult structure the UI
 * expects. Missing fields fall back to the scenario's mock baseline so the
 * UI never shows undefined values.
 */
function shapeLiveToMock(
  scenarioId: string,
  classifyData: unknown,
  calculateData: unknown,
  requestedValue: number
): MockResult | null {
  const baseline = getMockResult(scenarioId);
  if (!baseline) return null;

  const productValue =
    pickNumber(calculateData, 'productValue', 'price', 'declaredValue') ??
    requestedValue ??
    baseline.landedCost.productValue;

  const duty = pickNumber(calculateData, 'importDuty', 'duty', 'dutyAmount');
  const dutyRate =
    pickNumber(calculateData, 'dutyRate', 'duty_rate') ?? baseline.landedCost.dutyRate;
  const taxes = pickNumber(calculateData, 'vat', 'salesTax', 'tax', 'taxes');
  const shipping = pickNumber(calculateData, 'shippingCost', 'shipping');
  const fees = pickNumber(calculateData, 'fees', 'serviceFee');
  const total = pickNumber(calculateData, 'totalLandedCost', 'total');

  const hsCode = pickString(classifyData, 'hsCode', 'hs_code', 'code');
  const hsDescription = pickString(classifyData, 'description', 'hsDescription', 'label');

  // If the real calculate engine gave us neither a duty nor a total, treat it
  // as insufficient data and fall back entirely to mock.
  if (duty === undefined && total === undefined) return null;

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const resolvedDuty = duty ?? round2(productValue * dutyRate);
  const resolvedTaxes = taxes ?? baseline.landedCost.taxes;
  const resolvedShipping = shipping ?? baseline.landedCost.shipping;
  const resolvedFees = fees ?? baseline.landedCost.fees;
  const resolvedTotal =
    total ?? round2(productValue + resolvedDuty + resolvedTaxes + resolvedShipping + resolvedFees);

  return {
    ...baseline,
    hsCode: hsCode || baseline.hsCode,
    hsDescription: hsDescription || baseline.hsDescription,
    landedCost: {
      currency: baseline.landedCost.currency,
      productValue: round2(productValue),
      duty: round2(resolvedDuty),
      dutyRate,
      taxes: round2(resolvedTaxes),
      shipping: round2(resolvedShipping),
      fees: round2(resolvedFees),
      total: round2(resolvedTotal),
    },
  };
}

async function tryLiveEngine(
  scenarioId: string,
  inputs: Record<string, string | number | undefined>,
  baseUrl: string,
  totalDeadline: number
): Promise<MockResult | null> {
  const chain = getScenarioApiChain(scenarioId);
  if (chain.length === 0) return null;

  const productName =
    (typeof inputs.product === 'string' && inputs.product) ||
    (typeof inputs.productName === 'string' && inputs.productName) ||
    'leather wallet';
  const origin =
    (typeof inputs.from === 'string' && inputs.from) ||
    (typeof inputs.origin === 'string' && inputs.origin) ||
    'CN';
  const destinationCountry =
    (typeof inputs.to === 'string' && inputs.to) ||
    (typeof inputs.destination === 'string' && inputs.destination) ||
    'US';
  const requestedValue = Number(inputs.value ?? inputs.declaredValue ?? 45);
  const value = Number.isFinite(requestedValue) && requestedValue > 0 ? requestedValue : 45;

  // 1) classify (optional — only if the scenario chain includes it)
  let classifyData: unknown = null;
  if (chain.includes('/api/v1/classify')) {
    const remaining = Math.max(0, totalDeadline - Date.now());
    const perCall = Math.min(TIMEOUT_PER_CALL_MS, remaining);
    if (perCall > 0) {
      const res = await timedFetch(
        `${baseUrl}/api/v1/classify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Demo-Request': 'true',
          },
          body: JSON.stringify({
            productName,
            description: productName,
            originCountry: origin,
            destinationCountry,
          }),
        },
        perCall
      );
      if (res?.ok) {
        const json = (await res.json().catch(() => null)) as { data?: unknown } | null;
        classifyData = (json?.data as unknown) ?? json;
      }
    }
  }

  // 2) calculate (required — this is what drives the landed cost UI)
  let calculateData: unknown = null;
  if (chain.includes('/api/v1/calculate')) {
    const remaining = Math.max(0, totalDeadline - Date.now());
    const perCall = Math.min(TIMEOUT_PER_CALL_MS, remaining);
    if (perCall <= 0) return null;

    const hsCodeFromClassify = pickString(classifyData, 'hsCode', 'hs_code', 'code');
    const res = await timedFetch(
      `${baseUrl}/api/v1/calculate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Request': 'true',
        },
        body: JSON.stringify({
          price: value,
          shippingPrice: 0,
          origin,
          destinationCountry,
          productName,
          hsCode: hsCodeFromClassify,
        }),
      },
      perCall
    );
    if (res?.ok) {
      const json = (await res.json().catch(() => null)) as { data?: unknown } | null;
      calculateData = (json?.data as unknown) ?? json;
    }
  }

  // Without a calculate response we cannot assemble a live MockResult.
  if (!calculateData) return null;

  return shapeLiveToMock(scenarioId, classifyData, calculateData, value);
}

// ─── Handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
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
          'X-Response-Time': `${Date.now() - startedAt}`,
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
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'X-Response-Time': `${Date.now() - startedAt}` },
      }
    );
  }

  const scenarioId = (body.scenarioId || '').trim();
  if (!scenarioId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'missing_scenario', message: 'scenarioId is required.' },
      },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'X-Response-Time': `${Date.now() - startedAt}` },
      }
    );
  }

  const mock = getMockResult(scenarioId);
  if (!mock) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'unknown_scenario', message: `Unknown scenarioId "${scenarioId}".` },
      },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store', 'X-Response-Time': `${Date.now() - startedAt}` },
      }
    );
  }

  const inputs: Record<string, string | number | undefined> = body.inputs || {};
  const baseUrl = new URL(req.url).origin;

  // Try the real POTAL engines first. Any failure → mock fallback.
  const totalDeadline = startedAt + TIMEOUT_TOTAL_MS;
  const liveResult = await tryLiveEngine(scenarioId, inputs, baseUrl, totalDeadline);

  const result = liveResult ?? applyInputsToResult(mock, inputs);
  const source: 'mock' | 'live' = liveResult ? 'live' : 'mock';

  const data: DemoResponseData = {
    scenarioId,
    source,
    inputs,
    result,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(
    { success: true, data },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': `${Date.now() - startedAt}`,
        'X-Demo-Source': source,
      },
    }
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
