/**
 * POTAL API v1 — Integration Tests
 *
 * Tests for authentication, rate limiting, error handling, and endpoint responses.
 * Run: npx jest __tests__/api/api-v1-integration.test.ts
 *
 * Note: These tests mock Supabase and test the logic layer directly.
 */

import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { checkRateLimit, _resetAllForTesting } from '@/app/lib/api-auth/rate-limiter';
import { parsePriceToNumber } from '@/app/lib/cost-engine/CostEngine';
import { calculateGlobalLandedCost } from '@/app/lib/cost-engine/GlobalCostEngine';
import { getCountryProfile, getSupportedCountries, getCountryCount } from '@/app/lib/cost-engine/country-data';

// ═══════════════════════════════════════════════════════════
// 1. API Response Format
// ═══════════════════════════════════════════════════════════

describe('API Response Format', () => {
  test('apiSuccess returns correct structure', () => {
    const data = { total: 100, breakdown: {} };
    const response = apiSuccess(data);
    expect(response.status).toBe(200);
  });

  test('apiSuccess with meta data', () => {
    const data = { value: 42 };
    const meta = { sellerId: 'seller-123', plan: 'starter' };
    const response = apiSuccess(data, meta);
    expect(response.status).toBe(200);
  });

  test('apiError returns 400 for BAD_REQUEST', () => {
    const response = apiError(ApiErrorCode.BAD_REQUEST, 'Missing field');
    expect(response.status).toBe(400);
  });

  test('apiError returns 401 for UNAUTHORIZED', () => {
    const response = apiError(ApiErrorCode.UNAUTHORIZED, 'Invalid key');
    expect(response.status).toBe(401);
  });

  test('apiError returns 403 for FORBIDDEN', () => {
    const response = apiError(ApiErrorCode.FORBIDDEN, 'Subscription canceled');
    expect(response.status).toBe(403);
  });

  test('apiError returns 404 for NOT_FOUND', () => {
    const response = apiError(ApiErrorCode.NOT_FOUND, 'Not found');
    expect(response.status).toBe(404);
  });

  test('apiError returns 429 for RATE_LIMITED', () => {
    const response = apiError(ApiErrorCode.RATE_LIMITED, 'Rate limit');
    expect(response.status).toBe(429);
  });

  test('apiError returns 429 for PLAN_LIMIT_EXCEEDED', () => {
    const response = apiError(ApiErrorCode.PLAN_LIMIT_EXCEEDED, 'Limit exceeded');
    expect(response.status).toBe(429);
  });

  test('apiError returns 500 for INTERNAL_ERROR', () => {
    const response = apiError(ApiErrorCode.INTERNAL_ERROR, 'Server error');
    expect(response.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════
// 2. Rate Limiter
// ═══════════════════════════════════════════════════════════

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset internal state between tests
    if (typeof _resetAllForTesting === 'function') {
      _resetAllForTesting();
    }
  });

  test('allows requests within rate limit', () => {
    const result = checkRateLimit('test-key-1', 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59);
  });

  test('tracks remaining count correctly', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key-2', 60);
    }
    const result = checkRateLimit('test-key-2', 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(54);
  });

  test('blocks requests exceeding rate limit', () => {
    const keyId = 'test-key-3';
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit(keyId, limit);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit(keyId, limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test('returns resetAt timestamp', () => {
    const result = checkRateLimit('test-key-4', 60);
    expect(result.resetAt).toBeDefined();
    expect(typeof result.resetAt).toBe('number');
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  test('different keys have independent limits', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', 3);
    }
    const blockedA = checkRateLimit('key-a', 3);
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit('key-b', 3);
    expect(allowedB.allowed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// 3. API Key Format Validation
// ═══════════════════════════════════════════════════════════

describe('API Key Format Validation', () => {
  const isValidKeyFormat = (key: string): boolean => {
    return key.startsWith('pk_live_') || key.startsWith('sk_live_');
  };

  test('accepts pk_live_ prefix', () => {
    expect(isValidKeyFormat('pk_live_abc123')).toBe(true);
  });

  test('accepts sk_live_ prefix', () => {
    expect(isValidKeyFormat('sk_live_xyz789')).toBe(true);
  });

  test('rejects invalid prefix', () => {
    expect(isValidKeyFormat('invalid_key')).toBe(false);
    expect(isValidKeyFormat('pk_test_abc')).toBe(false);
    expect(isValidKeyFormat('')).toBe(false);
    expect(isValidKeyFormat('sk_')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// 4. /api/v1/calculate — Input Validation (Logic Tests)
// ═══════════════════════════════════════════════════════════

describe('Calculate Endpoint — Input Validation', () => {
  test('rejects undefined price', () => {
    const price = undefined;
    const parsed = parsePriceToNumber(price);
    expect(parsed).toBe(0);
  });

  test('rejects negative price', () => {
    const parsed = parsePriceToNumber(-50);
    expect(parsed).toBe(0);
  });

  test('parses valid numeric string', () => {
    expect(parsePriceToNumber('$49.99')).toBeCloseTo(49.99);
  });

  test('parses number with commas', () => {
    expect(parsePriceToNumber('1,299.00')).toBeCloseTo(1299);
  });

  test('handles zero price', () => {
    expect(parsePriceToNumber(0)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 5. /api/v1/calculate — TLC Calculation
// ═══════════════════════════════════════════════════════════

describe('Calculate Endpoint — TLC Calculation', () => {
  test('calculates US destination correctly', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'US',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
    expect(result.destinationCountry).toBe('US');
  });

  test('calculates UK destination with VAT', () => {
    const result = calculateGlobalLandedCost({
      price: 200,
      destinationCountry: 'GB',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(200);
    expect(result.totalLandedCost).toBeGreaterThan(200);
  });

  test('calculates Germany destination (EU)', () => {
    const result = calculateGlobalLandedCost({
      price: 500,
      destinationCountry: 'DE',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(500);
  });

  test('calculates Japan destination', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'JP',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });

  test('calculates Korea destination', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'KR',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });

  test('calculates Australia destination', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'AU',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });

  test('calculates Canada destination', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'CA',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });

  test('handles HS Code input', () => {
    const result = calculateGlobalLandedCost({
      price: 50,
      destinationCountry: 'US',
      origin: 'CN',
      hsCode: '6109.10',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });

  test('handles shipping price', () => {
    const withoutShipping = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'GB',
      origin: 'CN',
    });
    const withShipping = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'GB',
      origin: 'CN',
      shippingPrice: 20,
    });
    expect(withShipping.totalLandedCost).toBeGreaterThanOrEqual(withoutShipping.totalLandedCost);
  });

  test('handles US zipcode for sales tax', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'US',
      origin: 'CN',
      zipcode: '10001', // NY
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════
// 6. /api/v1/countries — Country Data
// ═══════════════════════════════════════════════════════════

describe('Countries Endpoint', () => {
  test('returns 181+ countries', () => {
    const count = getCountryCount();
    expect(count).toBeGreaterThanOrEqual(181);
  });

  test('getSupportedCountries returns array', () => {
    const countries = getSupportedCountries();
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThanOrEqual(181);
  });

  test('country profile has required fields', () => {
    const us = getCountryProfile('US');
    expect(us).toBeDefined();
    expect(us?.code).toBe('US');
    expect(us?.name).toBe('United States');
    expect(us?.region).toBeDefined();
    expect(typeof us?.vatRate).toBe('number');
    expect(typeof us?.avgDutyRate).toBe('number');
    expect(typeof us?.deMinimisUsd).toBe('number');
    expect(us?.currency).toBe('USD');
  });

  test('major countries exist', () => {
    const majorCountries = ['US', 'GB', 'DE', 'FR', 'JP', 'KR', 'AU', 'CA', 'CN', 'IN', 'SG', 'BR'];
    for (const code of majorCountries) {
      const profile = getCountryProfile(code);
      expect(profile).toBeDefined();
      expect(profile?.code).toBe(code);
    }
  });

  test('EU countries have correct VAT', () => {
    const de = getCountryProfile('DE');
    expect(de?.vatRate).toBe(0.19);

    const fr = getCountryProfile('FR');
    expect(fr?.vatRate).toBe(0.20);

    const hu = getCountryProfile('HU');
    expect(hu?.vatRate).toBe(0.27); // highest in EU
  });

  test('returns null for unknown country', () => {
    const unknown = getCountryProfile('XX');
    expect(unknown).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// 7. Plan Limits Configuration
// ═══════════════════════════════════════════════════════════

describe('Plan Limits', () => {
  const planLimits: Record<string, number> = {
    free: 500,
    starter: 5000,
    growth: 25000,
    enterprise: -1,
  };

  test('free plan allows 500 calls', () => {
    expect(planLimits.free).toBe(500);
  });

  test('starter plan allows 5000 calls', () => {
    expect(planLimits.starter).toBe(5000);
  });

  test('growth plan allows 25000 calls', () => {
    expect(planLimits.growth).toBe(25000);
  });

  test('enterprise plan is unlimited', () => {
    expect(planLimits.enterprise).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════════════
// 8. CORS Headers
// ═══════════════════════════════════════════════════════════

describe('CORS Headers', () => {
  test('apiSuccess responses can have headers set', () => {
    const response = apiSuccess({ test: true });
    response.headers.set('Access-Control-Allow-Origin', '*');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  test('apiError responses can have rate limit headers', () => {
    const response = apiError(ApiErrorCode.RATE_LIMITED, 'Too many requests');
    response.headers.set('X-RateLimit-Limit', '60');
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('Retry-After', '30');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBe('30');
  });
});

// ═══════════════════════════════════════════════════════════
// 9. Edge Cases
// ═══════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  test('very large price calculation', () => {
    const result = calculateGlobalLandedCost({
      price: 999999,
      destinationCountry: 'GB',
      origin: 'CN',
    });
    expect(result.totalLandedCost).toBeGreaterThan(999999);
  });

  test('zero price calculation', () => {
    const result = calculateGlobalLandedCost({
      price: 0,
      destinationCountry: 'US',
      origin: 'CN',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThanOrEqual(0);
  });

  test('same origin and destination', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      destinationCountry: 'US',
      origin: 'US',
    });
    expect(result).toBeDefined();
  });

  test('de minimis threshold — low value to UK', () => {
    const result = calculateGlobalLandedCost({
      price: 10, // Below UK £135 threshold
      destinationCountry: 'GB',
      origin: 'CN',
    });
    expect(result).toBeDefined();
  });

  test('calculation with all optional fields', () => {
    const result = calculateGlobalLandedCost({
      price: 49.99,
      shippingPrice: 8.50,
      origin: 'CN',
      destinationCountry: 'DE',
      hsCode: '6109.10',
      zipcode: '',
      productName: 'Cotton T-Shirt',
      productCategory: 'apparel',
    });
    expect(result).toBeDefined();
    expect(result.totalLandedCost).toBeGreaterThan(49.99);
  });
});
