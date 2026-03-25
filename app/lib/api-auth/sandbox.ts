/**
 * POTAL Sandbox Environment
 *
 * Provides test mode for developers to integrate without affecting production data.
 * Sandbox keys: pk_test_xxx, sk_test_xxx
 * Live keys: pk_live_xxx, sk_live_xxx
 *
 * Sandbox behavior:
 * - /calculate: Fixed duty 5% + VAT 20% (deterministic for testing)
 * - /classify: Real classification but no DB save
 * - /sanctions: Always returns "clear"
 * - Monthly quota: NOT counted (unlimited sandbox calls)
 * - Rate limit: 100 req/min (generous for testing)
 * - usage_logs: Tagged with mode='sandbox'
 */

export type ApiMode = 'live' | 'sandbox';

/**
 * Detect API mode from key prefix.
 * pk_test_ or sk_test_ → sandbox
 * Everything else → live (default)
 */
export function detectApiMode(apiKey: string): ApiMode {
  if (apiKey.startsWith('pk_test_') || apiKey.startsWith('sk_test_')) {
    return 'sandbox';
  }
  return 'live';
}

export function isSandboxKey(apiKey: string): boolean {
  return detectApiMode(apiKey) === 'sandbox';
}

/** Sandbox configuration */
export const SANDBOX_CONFIG = {
  /** Fixed duty rate for deterministic testing */
  fixedDutyRate: 0.05,
  /** Fixed VAT rate for deterministic testing */
  fixedVatRate: 0.20,
  /** Fixed exchange rate (1 USD = 1 of any currency) */
  fixedExchangeRate: 1.0,
  /** Rate limit for sandbox (generous) */
  maxRequestsPerMinute: 100,
  /** Sanctions screening always returns clear in sandbox */
  sanctionsAlwaysClear: true,
  /** Don't save HS classification results to DB in sandbox */
  classificationSaveToDB: false,
  /** Don't count sandbox usage toward monthly quota */
  countTowardQuota: false,
};

/**
 * Generate a sandbox/mock response for a given endpoint.
 * Used when sandbox mode is detected and mock responses are appropriate.
 */
export function getSandboxCalculateResponse(params: {
  price: number;
  destinationCountry?: string;
  originCountry?: string;
}): Record<string, unknown> {
  const price = params.price;
  const duty = price * SANDBOX_CONFIG.fixedDutyRate;
  const vatBase = price + duty;
  const vat = vatBase * SANDBOX_CONFIG.fixedVatRate;
  const totalLandedCost = price + duty + vat;

  return {
    price,
    destinationCountry: params.destinationCountry || 'US',
    originCountry: params.originCountry || 'CN',
    importDuty: Math.round(duty * 100) / 100,
    dutyRate: SANDBOX_CONFIG.fixedDutyRate,
    vat: Math.round(vat * 100) / 100,
    vatRate: SANDBOX_CONFIG.fixedVatRate,
    vatLabel: 'VAT (Sandbox)',
    totalLandedCost: Math.round(totalLandedCost * 100) / 100,
    currency: 'USD',
    exchangeRate: SANDBOX_CONFIG.fixedExchangeRate,
    confidence: 1.0,
    hsCode: '999999',
    hsCodeSource: 'sandbox_fixed',
    mode: 'sandbox',
    _sandbox: true,
    _note: 'This is a sandbox response with fixed rates. Production responses use real tariff data.',
  };
}

/**
 * Sandbox sanctions screening — always returns clear.
 */
export function getSandboxSanctionsResponse(params: {
  name: string;
}): Record<string, unknown> {
  return {
    screened: true,
    status: 'clear',
    matches: [],
    listsChecked: ['OFAC_SDN', 'BIS_ENTITY', 'EU_SANCTIONS', 'UN_SANCTIONS', 'UK_SANCTIONS'],
    screenedName: params.name,
    mode: 'sandbox',
    _sandbox: true,
    _note: 'Sandbox mode — always returns clear. Production mode checks real sanctions lists.',
  };
}
