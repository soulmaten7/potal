/**
 * Mock results for the homepage demo — CW24 Sprint 2
 *
 * When the demo API route (`/api/demo/scenario`) cannot reach the real engines
 * (classifier, cost engine, restrictions), it falls back to these scenario-
 * specific illustrative results so the homepage UI never breaks.
 *
 * Numbers here are rounded, plausible examples — NOT authoritative guidance.
 * The NonDevPanel always shows a "demo data" notice so users understand.
 */

export interface ComparisonRow {
  destination: string;
  hsCode: string;
  duty: number;
  taxes: number;
  shipping: number;
  fees: number;
  total: number;
  ftaName: string | null;
}

export interface MockResult {
  scenarioId: string;
  hsCode: string;
  hsDescription: string;
  restriction: {
    blocked: boolean;
    summary: string;
    license?: string;
  };
  landedCost: {
    currency: string;
    productValue: number;
    duty: number;
    dutyRate: number;
    taxes: number;
    shipping: number;
    fees: number;
    total: number;
  };
  extras?: Record<string, string | number>;
  notes: string[];
  /** CW31-HF1: forwarder multi-destination comparison table (optional) */
  comparisonRows?: ComparisonRow[];
}

// CW33-HF2: Mocks are now **neutral empty shells** — no scenario-specific
// canned numbers, no product-specific restriction text. When the engine
// succeeds, mapEngineResultToMockShape fills these with real data. When
// the engine fails, these render as a clear "engine unavailable" placeholder
// so the UI can't silently display fake tariffs/restrictions.
//
// Previously each scenario had canned HS codes, totals, FTA names, and
// restriction strings like "Standard machinery import to Korea" / "Dual-use:
// ECCN 3A001" that would leak into live responses via the `|| mock.*`
// fallbacks in route.ts — flagged as Bugs 1+2 in CW33-HF2 ticket.
const NEUTRAL_EMPTY: Omit<MockResult, 'scenarioId'> = {
  hsCode: '0000',
  hsDescription: 'POTAL engine unavailable — placeholder result, not a real quote.',
  restriction: {
    blocked: false,
    summary: 'POTAL engine temporarily unavailable — retry shortly for live restriction screening.',
  },
  landedCost: {
    currency: 'USD',
    productValue: 0,
    duty: 0,
    dutyRate: 0,
    taxes: 0,
    shipping: 0,
    fees: 0,
    total: 0,
  },
  notes: [
    'Placeholder result — POTAL engine unavailable. This is NOT a real quote. Retry shortly.',
  ],
};

export const MOCK_RESULTS: Record<string, MockResult> = {
  seller:    { scenarioId: 'seller',    ...NEUTRAL_EMPTY },
  d2c:       { scenarioId: 'd2c',       ...NEUTRAL_EMPTY },
  importer:  { scenarioId: 'importer',  ...NEUTRAL_EMPTY },
  exporter:  { scenarioId: 'exporter',  ...NEUTRAL_EMPTY },
  forwarder: { scenarioId: 'forwarder', ...NEUTRAL_EMPTY },
  custom:    { scenarioId: 'custom',    ...NEUTRAL_EMPTY },
};

export function getMockResult(scenarioId: string): MockResult | null {
  return MOCK_RESULTS[scenarioId] || null;
}
