/**
 * POTAL demo API — /api/demo/scenario
 *
 * Homepage-only demo endpoint.
 *
 * - No auth required (homepage data URL for unauthenticated visitors)
 * - Simple in-memory IP throttle: 30 req/min per IP
 * - CW31 "Honest Reset": directly calls the real POTAL cost engine
 *   (`calculateGlobalLandedCostAsync`) with the user's inputs.
 *     1. Map UI inputs → GlobalCostInput
 *     2. Call engine with a 5s timeout
 *     3. Map engine output → MockResult-shape (UI contract unchanged)
 *     4. On engine failure/timeout → fall back to mock-results.ts
 * - Adds `X-Response-Time: {ms}` and `X-Demo-Source: {mock|live}` headers
 * - Cache-Control: no-store
 *
 * Why direct engine call instead of precomputed baselines (CW29 S7.5):
 *   Precomputed + price-ratio scaling gave fast responses but was dishonest —
 *   origin/destination/quantity/material changes did not affect duty. Users
 *   saw CN-scaled numbers for a KR→US shipment. The engine averages ~1–3s
 *   per call, well within the 5s timeout, and that's what users deserve.
 *
 * NOT a public API. Do not link from external docs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockResult, type MockResult } from '@/lib/scenarios/mock-results';
import {
  calculateGlobalLandedCostAsync,
  type GlobalCostInput,
  type GlobalLandedCost,
} from '@/app/lib/cost-engine/GlobalCostEngine';

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 30;
const ENGINE_TIMEOUT_MS = 5_000;

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

// ─── Input mapping ──────────────────────────────────────────────

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toStr(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function buildEngineInput(
  inputs: Record<string, string | number | undefined>
): GlobalCostInput | null {
  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  const to = toStr(inputs.to);
  const unitValue = toNumber(inputs.value);
  const quantity = toNumber(inputs.quantity, 1);

  if (!from || !to || unitValue <= 0) return null;

  const totalValue = unitValue * quantity;

  return {
    price: totalValue,
    shippingPrice: 0, // engine auto-estimates when zero
    origin: from.toUpperCase(),
    destinationCountry: to.toUpperCase(),
    productName: product,
    quantity,
    shippingType: 'international',
  };
}

// ─── Result mapping ─────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Convert the engine's GlobalLandedCost into the MockResult shape the UI
 * already consumes. Any field the engine doesn't provide falls back to the
 * scenario's mock so the UI never shows "undefined".
 */
function mapEngineResultToMockShape(
  engineOut: GlobalLandedCost,
  mock: MockResult,
  inputs: Record<string, string | number | undefined>
): MockResult {
  const productValue = round2(engineOut.productPrice || 0);
  const duty = round2(engineOut.importDuty || 0);
  const taxes = round2(engineOut.vat ?? engineOut.salesTax ?? 0);
  const shipping = round2(engineOut.shippingCost || 0);
  const fees = round2(
    (engineOut.mpf || 0) +
      (engineOut.insurance || 0) +
      (engineOut.brokerageFee || 0)
  );
  const total = round2(
    engineOut.totalLandedCost || productValue + duty + taxes + shipping + fees
  );
  const dutyRate =
    productValue > 0 ? round2((duty / productValue) * 10000) / 10000 : 0;

  // Notes — synthesize from engine outputs, fall back to mock notes
  const notes: string[] = [];
  if (engineOut.additionalTariffNote) notes.push(engineOut.additionalTariffNote);
  if (engineOut.ftaApplied?.hasFta && engineOut.ftaApplied.ftaName) {
    notes.push(`${engineOut.ftaApplied.ftaName} applied — preferential rate`);
  }
  if (engineOut.tradeRemedies?.hasRemedies) {
    notes.push('Trade remedy measures (AD/CVD/Safeguard) detected');
  }
  if (engineOut.usAdditionalTariffs?.hasAdditionalTariffs) {
    notes.push('US Section 301/232 additional tariffs apply');
  }
  if (engineOut.deMinimisApplied) {
    notes.push(
      `Under ${engineOut.destinationCountry} de minimis threshold — duty exempt`
    );
  }
  if (notes.length === 0) notes.push(...mock.notes);

  // Extras — pass FTA + quantity savings if d2c
  const extras: Record<string, string | number> = {};
  if (engineOut.ftaApplied?.hasFta && engineOut.ftaApplied.ftaName) {
    extras.ftaName = engineOut.ftaApplied.ftaName;
  }
  const qty = toNumber(inputs.quantity, 0);
  if (qty > 1) extras.quantity = qty;

  return {
    scenarioId: mock.scenarioId,
    hsCode: engineOut.hsClassification?.hsCode || mock.hsCode,
    hsDescription:
      engineOut.hsClassification?.description ||
      (toStr(inputs.product) ?? mock.hsDescription),
    restriction: {
      // Engine doesn't expose a boolean block flag — treat presence of
      // additionalTariffNote as informational, never as "blocked".
      blocked: false,
      summary: engineOut.additionalTariffNote || mock.restriction.summary,
    },
    landedCost: {
      currency: 'USD', // demo display is always USD for uniformity
      productValue,
      duty,
      dutyRate,
      taxes,
      shipping,
      fees,
      total,
    },
    extras: Object.keys(extras).length > 0 ? extras : mock.extras,
    notes,
  };
}

async function runEngineWithTimeout(
  input: GlobalCostInput
): Promise<GlobalLandedCost | null> {
  try {
    return await Promise.race<GlobalLandedCost>([
      calculateGlobalLandedCostAsync(input),
      new Promise<GlobalLandedCost>((_, reject) =>
        setTimeout(
          () => reject(new Error('engine_timeout')),
          ENGINE_TIMEOUT_MS
        )
      ),
    ]);
  } catch (err) {
    console.warn('[demo/scenario] engine call failed:', (err as Error).message);
    return null;
  }
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
          message:
            'Demo rate limit: 30 requests per minute. Slow down and try again.',
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
      {
        success: false,
        error: { code: 'bad_json', message: 'Invalid JSON body.' },
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'X-Response-Time': `${Date.now() - startedAt}`,
        },
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
        headers: {
          'Cache-Control': 'no-store',
          'X-Response-Time': `${Date.now() - startedAt}`,
        },
      }
    );
  }

  const mock = getMockResult(scenarioId);
  if (!mock) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'unknown_scenario',
          message: `Unknown scenarioId "${scenarioId}".`,
        },
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
          'X-Response-Time': `${Date.now() - startedAt}`,
        },
      }
    );
  }

  const inputs: Record<string, string | number | undefined> = body.inputs || {};

  // Try the real engine. On any failure (bad inputs, timeout, DB outage)
  // fall back to the bundled mock so the UI never breaks.
  let result: MockResult = mock;
  let source: 'mock' | 'live' = 'mock';

  const engineInput = buildEngineInput(inputs);
  if (engineInput) {
    const engineOut = await runEngineWithTimeout(engineInput);
    if (engineOut) {
      result = mapEngineResultToMockShape(engineOut, mock, inputs);
      source = 'live';
    }
  }

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
          'Use POST with JSON body: { "scenarioId": "seller", "inputs": { "product": "...", "from": "KR", "to": "US", "value": 45 } }',
      },
    },
    { status: 405, headers: { 'Cache-Control': 'no-store' } }
  );
}
