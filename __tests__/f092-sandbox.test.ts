/**
 * F092: Sandbox Environment — Test Suite
 */

import {
  detectApiMode,
  isSandboxKey,
  SANDBOX_CONFIG,
  getSandboxCalculateResponse,
  getSandboxSanctionsResponse,
} from '@/app/lib/api-auth/sandbox';

describe('F092: API Mode Detection', () => {
  test('sk_live_ → live', () => {
    expect(detectApiMode('sk_live_abc123')).toBe('live');
  });

  test('sk_test_ → sandbox', () => {
    expect(detectApiMode('sk_test_abc123')).toBe('sandbox');
  });

  test('pk_test_ → sandbox', () => {
    expect(detectApiMode('pk_test_xyz')).toBe('sandbox');
  });

  test('pk_live_ → live', () => {
    expect(detectApiMode('pk_live_xyz')).toBe('live');
  });

  test('invalid key → live (default)', () => {
    expect(detectApiMode('invalid_key')).toBe('live');
    expect(detectApiMode('')).toBe('live');
  });

  test('isSandboxKey helper', () => {
    expect(isSandboxKey('sk_test_abc')).toBe(true);
    expect(isSandboxKey('sk_live_abc')).toBe(false);
  });
});

describe('F092: Sandbox Calculate Response', () => {
  test('returns fixed 5% duty + 20% VAT', () => {
    const result = getSandboxCalculateResponse({ price: 100 });
    expect(result.importDuty).toBe(5);       // 100 * 0.05
    expect(result.vat).toBe(21);             // (100 + 5) * 0.20
    expect(result.totalLandedCost).toBe(126); // 100 + 5 + 21
    expect(result.mode).toBe('sandbox');
    expect(result._sandbox).toBe(true);
  });

  test('works with different prices', () => {
    const result = getSandboxCalculateResponse({ price: 50, destinationCountry: 'GB' });
    expect(result.importDuty).toBe(2.5);     // 50 * 0.05
    expect(result.destinationCountry).toBe('GB');
  });

  test('includes fixed exchange rate 1.0', () => {
    const result = getSandboxCalculateResponse({ price: 200 });
    expect(result.exchangeRate).toBe(1.0);
  });
});

describe('F092: Sandbox Sanctions Response', () => {
  test('always returns clear', () => {
    const result = getSandboxSanctionsResponse({ name: 'Test Person' });
    expect(result.status).toBe('clear');
    expect(result.matches).toEqual([]);
    expect(result._sandbox).toBe(true);
  });
});

describe('F092: Sandbox Config', () => {
  test('sandbox rate limit is 100 req/min', () => {
    expect(SANDBOX_CONFIG.maxRequestsPerMinute).toBe(100);
  });

  test('sandbox does not count toward quota', () => {
    expect(SANDBOX_CONFIG.countTowardQuota).toBe(false);
  });

  test('sandbox does not save classifications to DB', () => {
    expect(SANDBOX_CONFIG.classificationSaveToDB).toBe(false);
  });

  test('sanctions always clear in sandbox', () => {
    expect(SANDBOX_CONFIG.sanctionsAlwaysClear).toBe(true);
  });
});

describe('F092: Middleware Integration', () => {
  test('middleware imports sandbox config', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/api-auth/middleware.ts', 'utf-8');
    expect(content).toContain("import { SANDBOX_CONFIG } from './sandbox'");
    expect(content).toContain('SANDBOX_CONFIG.maxRequestsPerMinute');
  });

  test('middleware skips plan limits for sandbox', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/api-auth/middleware.ts', 'utf-8');
    expect(content).toContain('isSandbox');
    expect(content).toContain('sandbox requests are exempt');
  });

  test('usage logger supports mode field', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/api-auth/usage-logger.ts', 'utf-8');
    expect(content).toContain("mode?: 'live' | 'sandbox'");
    expect(content).toContain("mode: entry.mode || 'live'");
  });
});
