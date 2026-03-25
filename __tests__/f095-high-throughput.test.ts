/**
 * F095: High-Throughput API — Test Suite
 * Tests: rate limiter (token bucket + burst), plan checker, batch timeout
 */

import { checkRateLimit, _resetAllForTesting, getBurstForPlan } from '@/app/lib/api-auth/rate-limiter';

beforeEach(() => {
  _resetAllForTesting();
});

// ─── Rate Limiter Tests ─────────────────────────────

describe('F095: Rate Limiter (Token Bucket)', () => {
  test('Free plan: allows 30 requests within limit', () => {
    const keyId = 'test-free-1';
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(keyId, 30, 'free');
      expect(result.allowed).toBe(true);
    }
  });

  test('Free plan: burst allows up to 35 requests (30 + 5 burst)', () => {
    const keyId = 'test-free-burst';
    let allowed = 0;
    for (let i = 0; i < 40; i++) {
      const result = checkRateLimit(keyId, 30, 'free');
      if (result.allowed) allowed++;
    }
    // Token bucket starts full at 35 tokens (30 + 5 burst)
    expect(allowed).toBe(35);
  });

  test('Free plan: 36th request denied after burst exhausted', () => {
    const keyId = 'test-free-deny';
    for (let i = 0; i < 35; i++) {
      checkRateLimit(keyId, 30, 'free');
    }
    const result = checkRateLimit(keyId, 30, 'free');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('Unlimited plan: always allowed', () => {
    const result = checkRateLimit('test-unlimited', 0);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999999);
  });

  test('getBurstForPlan returns correct values', () => {
    expect(getBurstForPlan('free')).toBe(5);
    expect(getBurstForPlan('basic')).toBe(10);
    expect(getBurstForPlan('pro')).toBe(20);
    expect(getBurstForPlan('enterprise')).toBe(50);
    expect(getBurstForPlan('unknown')).toBe(5); // defaults to free
  });

  test('resetAllForTesting clears state', () => {
    const keyId = 'test-reset';
    for (let i = 0; i < 35; i++) {
      checkRateLimit(keyId, 30, 'free');
    }
    const denied = checkRateLimit(keyId, 30, 'free');
    expect(denied.allowed).toBe(false);

    _resetAllForTesting();

    const afterReset = checkRateLimit(keyId, 30, 'free');
    expect(afterReset.allowed).toBe(true);
  });
});

// ─── Plan Checker Tests ─────────────────────────────

describe('F095: Plan Checker', () => {
  test('plan-checker uses created_at not billed_at', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/lib/api-auth/plan-checker.ts', 'utf-8');
    // Should use created_at for monthly quota check
    expect(content).toContain("'created_at'");
    // Should NOT use billed_at for the quota check
    const billedAtMatches = content.match(/\.gte\('billed_at'/g);
    expect(billedAtMatches).toBeNull();
  });
});

// ─── Batch Tests ─────────────────────────────────────

describe('F095: Batch Processing', () => {
  test('batch route uses CONCURRENCY=5', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/calculate/batch/route.ts', 'utf-8');
    expect(content).toContain('CONCURRENCY = 5');
    expect(content).not.toContain('CONCURRENCY = 10');
  });

  test('batch route has Promise.race timeout', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/calculate/batch/route.ts', 'utf-8');
    expect(content).toContain('Promise.race');
    expect(content).toContain('TIMEOUT_MS');
    expect(content).toContain('Calculation timeout');
  });
});

// ─── Usage API Tests ─────────────────────────────────

describe('F095: Usage API', () => {
  test('usage route includes dailyBreakdown in response', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/sellers/usage/route.ts', 'utf-8');
    expect(content).toContain('dailyBreakdown');
    expect(content).toContain('byEndpoint');
  });

  test('usage route has correct Free plan limit (200)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/sellers/usage/route.ts', 'utf-8');
    expect(content).toContain('free: { limit: 200');
  });
});
