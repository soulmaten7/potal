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

export const MOCK_RESULTS: Record<string, MockResult> = {
  seller: {
    scenarioId: 'seller',
    hsCode: '4202.31',
    hsDescription: 'Handbags / wallets — outer surface of leather',
    restriction: {
      blocked: false,
      summary: 'No import restriction. De minimis threshold: USD 800 (US).',
    },
    landedCost: {
      currency: 'USD',
      productValue: 45.0,
      duty: 3.78,
      dutyRate: 0.084,
      taxes: 0,
      shipping: 12.5,
      fees: 1.25,
      total: 62.53,
    },
    notes: [
      'Under US de minimis ($800) → no import duty in practice',
      'Sales tax is collected by marketplace facilitator (Etsy/Shopify)',
    ],
  },
  d2c: {
    scenarioId: 'd2c',
    hsCode: '6109.10',
    hsDescription: 'T-shirts, singlets and other vests, cotton, knitted',
    restriction: {
      blocked: false,
      summary: 'No restriction. Korea-EU FTA applies.',
    },
    landedCost: {
      currency: 'USD',
      productValue: 28.0,
      duty: 0,
      dutyRate: 0,
      taxes: 5.32,
      shipping: 3.8,
      fees: 0.45,
      total: 37.57,
    },
    extras: {
      ftaName: 'Korea-EU FTA',
      ftaPreferentialRate: '0%',
      ftaMfnRate: '12.0%',
      ftaSavingsPerUnit: 3.36,
      quantity: 500,
      totalFtaSavings: 1680.0,
    },
    notes: [
      'Korea-EU FTA eliminates the 12% MFN duty',
      'FTA savings over 500 units: $1,680',
      'Commercial invoice generated automatically',
    ],
  },
  importer: {
    scenarioId: 'importer',
    hsCode: '8413.70',
    hsDescription: 'Centrifugal pumps, industrial',
    restriction: {
      blocked: false,
      summary: 'No restriction. Standard machinery import to Korea.',
    },
    landedCost: {
      currency: 'USD',
      productValue: 85000.0,
      duty: 6800.0,
      dutyRate: 0.08,
      taxes: 9180.0,
      shipping: 3200.0,
      fees: 420.0,
      total: 104600.0,
    },
    extras: {
      container: '40ft',
      deniedPartyMatch: 'None',
      vatRate: '10%',
    },
    notes: [
      '40ft container sea freight, DE → KR',
      'Korea VAT 10% applied on CIF + duty',
      'Denied-party screening passed on the German supplier',
    ],
  },
  exporter: {
    scenarioId: 'exporter',
    hsCode: '8507.60',
    hsDescription: 'Lithium-ion accumulators',
    restriction: {
      blocked: false,
      summary: 'Dual-use: ECCN 3A001. Export license may be required.',
      license: 'ECCN 3A001 — verify with Korea MOTIE before shipment',
    },
    landedCost: {
      currency: 'USD',
      productValue: 250000.0,
      duty: 8750.0,
      dutyRate: 0.035,
      taxes: 0,
      shipping: 6500.0,
      fees: 1200.0,
      total: 266450.0,
    },
    extras: {
      unCode: 'UN3480',
      dangerousGoodsClass: '9 (Miscellaneous)',
      eccn: '3A001',
      deniedPartyMatch: 'None',
    },
    notes: [
      'UN3480 — lithium cells classified as dangerous goods Class 9',
      'ECCN 3A001 flagged — confirm with export control authority',
      'US imports subject to Section 301 additional duties (not shown here)',
    ],
  },
  forwarder: {
    scenarioId: 'forwarder',
    hsCode: '6109.10',
    hsDescription: 'Multi-destination batch (cotton T-shirts)',
    restriction: {
      blocked: false,
      summary: '3 of 3 shipments cleared denied-party screening.',
    },
    landedCost: {
      currency: 'USD',
      productValue: 12000.0,
      duty: 1440.0,
      dutyRate: 0.12,
      taxes: 1080.0,
      shipping: 680.0,
      fees: 85.0,
      total: 15285.0,
    },
    extras: {
      cheapestRoute: 'DE',
      routes: 'US $15,285 / DE $13,840 / JP $14,960',
      batchSize: 3,
    },
    notes: [
      'Batch screen: all 3 shipments cleared',
      'Cheapest destination: Germany (Korea-EU FTA applied)',
      'US Section 301 adds ~$1,200 vs baseline',
    ],
    // CW31-HF1: fallback comparison rows so the UI renders even when the
    // engine is unreachable.
    comparisonRows: [
      {
        destination: 'DE',
        hsCode: '6109.10',
        duty: 0,
        taxes: 2280,
        shipping: 680,
        fees: 85,
        total: 13840,
        ftaName: 'EU-Korea Free Trade Agreement',
      },
      {
        destination: 'JP',
        hsCode: '6109.10',
        duty: 486,
        taxes: 1248,
        shipping: 680,
        fees: 85,
        total: 14960,
        ftaName: 'Regional Comprehensive Economic Partnership',
      },
      {
        destination: 'US',
        hsCode: '6109.10',
        duty: 0,
        taxes: 840,
        shipping: 680,
        fees: 85,
        total: 15285,
        ftaName: 'Korea-US Free Trade Agreement',
      },
    ],
  },
};

export function getMockResult(scenarioId: string): MockResult | null {
  return MOCK_RESULTS[scenarioId] || null;
}
