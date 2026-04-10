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
import {
  getMockResult,
  type MockResult,
  type ComparisonRow,
} from '@/lib/scenarios/mock-results';
import {
  calculateGlobalLandedCostAsync,
  type GlobalCostInput,
  type GlobalLandedCost,
} from '@/app/lib/cost-engine/GlobalCostEngine';
import { checkRestrictions } from '@/app/lib/cost-engine/restrictions/check';

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 30;
const ENGINE_TIMEOUT_MS = 5_000;
// CW31-HF1: forwarder fires N engine calls in parallel. The DB pool sees
// contention and each call can take longer than the single-scenario path,
// so we give it more headroom.
const FORWARDER_TIMEOUT_MS = 8_000;

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

type DemoInputs = Record<string, string | number | string[] | undefined>;

interface DemoRequestBody {
  scenarioId?: string;
  inputs?: DemoInputs;
}

interface DemoResponseData {
  scenarioId: string;
  source: 'mock' | 'live';
  inputs: DemoInputs;
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
  inputs: Record<string, string | number | string[] | undefined>
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

/**
 * CW31-HF1: forwarder multi-destination input builder.
 * Returns an array of engine inputs — one per destination — so the handler
 * can fire them in parallel.
 */
function buildForwarderInputs(
  inputs: Record<string, string | number | string[] | undefined>
): GlobalCostInput[] | null {
  const product = toStr(inputs.product);
  const from = toStr(inputs.from);
  const raw = inputs.destinations;
  const destinations = Array.isArray(raw)
    ? (raw as string[]).filter(Boolean).map(d => d.toUpperCase())
    : [];
  const unitValue = toNumber(inputs.value);
  if (!from || destinations.length === 0 || unitValue <= 0) return null;

  return destinations.slice(0, 5).map(dest => ({
    price: unitValue,
    shippingPrice: 0,
    origin: from.toUpperCase(),
    destinationCountry: dest,
    productName: product,
    quantity: 1,
    shippingType: 'international' as const,
  }));
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
  inputs: Record<string, string | number | string[] | undefined>
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

  // CW31-HF1: Surface real engine restriction check (hazmat, ECCN, carriers)
  const hsCode = engineOut.hsClassification?.hsCode || mock.hsCode;
  const destCountry =
    engineOut.destinationCountry ||
    (typeof inputs.to === 'string' ? inputs.to.toUpperCase() : 'US');
  const restrictionCheck = checkRestrictions(hsCode, destCountry);

  let restrictionBlocked = false;
  let restrictionSummary =
    engineOut.additionalTariffNote || mock.restriction.summary;
  let restrictionLicense: string | undefined;

  if (restrictionCheck.isProhibited) {
    restrictionBlocked = true;
    restrictionSummary =
      restrictionCheck.restrictions[0]?.description || 'Import prohibited';
    const top = restrictionCheck.restrictions[0];
    if (top?.requiredDocuments && top.requiredDocuments.length > 0) {
      restrictionLicense = `Requires: ${top.requiredDocuments.join(', ')}`;
    }
  } else if (restrictionCheck.hasRestrictions) {
    const top = restrictionCheck.restrictions[0];
    if (top) {
      restrictionSummary = `${top.category}: ${top.description}`;
      if (top.requiredDocuments && top.requiredDocuments.length > 0) {
        restrictionLicense = `Requires: ${top.requiredDocuments.join(', ')}`;
      } else if (restrictionCheck.restrictedCarriers.length > 0) {
        restrictionLicense = `Carrier restricted: ${restrictionCheck.restrictedCarriers
          .slice(0, 3)
          .join(', ')}`;
      }
    }
  }

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
    hsCode,
    hsDescription:
      engineOut.hsClassification?.description ||
      (toStr(inputs.product) ?? mock.hsDescription),
    restriction: {
      blocked: restrictionBlocked,
      summary: restrictionSummary,
      ...(restrictionLicense ? { license: restrictionLicense } : {}),
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

/**
 * CW31-HF1: Merge multiple per-destination engine outputs into a single
 * MockResult. Uses the first successful destination for the top-level
 * landedCost + restriction + HS fields (so existing UI blocks keep rendering)
 * and attaches `comparisonRows` for the forwarder-specific comparison table.
 */
function mapForwarderResultsToMockShape(
  results: Array<{ input: GlobalCostInput; output: GlobalLandedCost }>,
  mock: MockResult,
  inputs: DemoInputs
): MockResult {
  const rows: ComparisonRow[] = results.map(({ input, output }) => {
    const productValue = round2(
      output.productPrice || (typeof input.price === 'number' ? input.price : 0)
    );
    const duty = round2(output.importDuty || 0);
    const taxes = round2(output.vat ?? output.salesTax ?? 0);
    const shipping = round2(output.shippingCost || 0);
    const fees = round2(
      (output.mpf || 0) + (output.insurance || 0) + (output.brokerageFee || 0)
    );
    const total = round2(
      output.totalLandedCost || productValue + duty + taxes + shipping + fees
    );
    return {
      destination: input.destinationCountry || 'US',
      hsCode: output.hsClassification?.hsCode || mock.hsCode,
      duty,
      taxes,
      shipping,
      fees,
      total,
      ftaName:
        output.ftaApplied?.hasFta && output.ftaApplied.ftaName
          ? output.ftaApplied.ftaName
          : null,
    };
  });

  const cheapest = rows.reduce((a, b) => (a.total < b.total ? a : b));

  // Reuse the first destination's mapping for the top-level fields so the
  // existing HS code / restriction / landed-cost blocks render something
  // sensible above the comparison table.
  const first = results[0];
  const baseShape = mapEngineResultToMockShape(first.output, mock, {
    ...inputs,
    to: first.input.destinationCountry,
  });

  return {
    ...baseShape,
    extras: {
      ...(baseShape.extras || {}),
      forwarderCheapest: `${cheapest.destination} — $${cheapest.total.toLocaleString()}`,
      forwarderCount: rows.length,
    },
    comparisonRows: rows,
  };
}

async function runEngineWithTimeout(
  input: GlobalCostInput,
  timeoutMs: number = ENGINE_TIMEOUT_MS
): Promise<GlobalLandedCost | null> {
  try {
    return await Promise.race<GlobalLandedCost>([
      calculateGlobalLandedCostAsync(input),
      new Promise<GlobalLandedCost>((_, reject) =>
        setTimeout(() => reject(new Error('engine_timeout')), timeoutMs)
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

  const inputs: DemoInputs = body.inputs || {};

  // Try the real engine. On any failure (bad inputs, timeout, DB outage)
  // fall back to the bundled mock so the UI never breaks.
  let result: MockResult = mock;
  let source: 'mock' | 'live' = 'mock';

  if (scenarioId === 'forwarder') {
    // CW31-HF1: forwarder fires one engine call per destination in parallel.
    const batchInputs = buildForwarderInputs(inputs);
    if (batchInputs) {
      const batchResults = await Promise.all(
        batchInputs.map(i => runEngineWithTimeout(i, FORWARDER_TIMEOUT_MS))
      );
      const successes = batchResults
        .map((r, i) => (r ? { input: batchInputs[i], output: r } : null))
        .filter(
          (x): x is { input: GlobalCostInput; output: GlobalLandedCost } =>
            x !== null
        );
      if (successes.length > 0) {
        result = mapForwarderResultsToMockShape(successes, mock, inputs);
        source = 'live';
      }
    }
  } else {
    const engineInput = buildEngineInput(inputs);
    if (engineInput) {
      const engineOut = await runEngineWithTimeout(engineInput);
      if (engineOut) {
        result = mapEngineResultToMockShape(engineOut, mock, inputs);
        source = 'live';
      }
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
