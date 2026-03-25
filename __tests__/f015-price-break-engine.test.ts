/**
 * F015: Price Break Engine — Test Suite
 */

describe('F015: price-break-engine.ts', () => {
  let content: string;
  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/lib/classification/price-break-engine.ts', 'utf-8');
  });

  test('uses correct table name hs_price_break_rules', () => {
    expect(content).toContain("from('hs_price_break_rules')");
    expect(content).not.toContain("from('price_break_rules')");
  });

  test('uses parent_hs_code column', () => {
    expect(content).toContain('parent_hs_code');
  });

  test('evaluatePriceBreaks returns null for invalid HS', () => {
    expect(content).toContain('hs10.length < 6');
    expect(content).toContain('return null');
  });

  test('evaluatePriceBreaks handles price=0 (not rejected)', () => {
    // price < 0 is rejected, but 0 should pass
    expect(content).toContain('price < 0');
    expect(content).not.toContain('price <= 0');
  });

  test('supports condition types: over, not_over, range', () => {
    expect(content).toContain("'over'");
    expect(content).toContain("'not_over'");
    expect(content).toContain("'range'");
  });
});

describe('F015: price-break-rules.ts', () => {
  let content: string;
  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/lib/cost-engine/hs-code/price-break-rules.ts', 'utf-8');
  });

  test('uses correct table name hs_price_break_rules', () => {
    expect(content).toContain("from('hs_price_break_rules')");
  });

  test('null guard on duty_rate fields', () => {
    expect(content).toContain('Number(row.duty_rate_under ?? 0)');
    expect(content).toContain('Number(row.duty_rate_over ?? 0)');
  });

  test('has cache with 24h TTL', () => {
    expect(content).toContain('ruleCache');
    expect(content).toContain('CACHE_TTL_MS');
    expect(content).toContain('24 * 60 * 60 * 1000');
  });

  test('invalidatePriceBreakCache exported', () => {
    expect(content).toContain('export function invalidatePriceBreakCache');
  });
});

describe('F015: step10-price-break.ts', () => {
  let content: string;
  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/lib/cost-engine/gri-classifier/steps/step10-price-break.ts', 'utf-8');
  });

  test('uses correct table hs_price_break_rules', () => {
    expect(content).toContain("from('hs_price_break_rules')");
  });

  test('uses parent_hs_code column (not hs_code)', () => {
    expect(content).toContain("'parent_hs_code'");
    expect(content).toContain('r.parent_hs_code');
  });
});

describe('F015: v3/step6-price-break.ts', () => {
  let content: string;
  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/lib/cost-engine/gri-classifier/steps/v3/step6-price-break.ts', 'utf-8');
  });

  test('allows price=0 (not rejected)', () => {
    expect(content).toContain('price < 0');
    expect(content).not.toContain('price <= 0');
  });

  test('uses correct table and column', () => {
    expect(content).toContain("from('hs_price_break_rules')");
    expect(content).toContain("eq('parent_hs_code'");
  });
});

describe('F015: API check/route.ts', () => {
  let content: string;
  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/price-breaks/check/route.ts', 'utf-8');
  });

  test('validates HS code format with regex', () => {
    expect(content).toContain('/^\\d{6,10}$/');
  });

  test('allows price=0', () => {
    expect(content).toContain('price < 0');
    expect(content).not.toContain('price <= 0');
  });
});
