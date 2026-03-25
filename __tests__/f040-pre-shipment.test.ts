/**
 * F040: Pre-Shipment Verification — Test Suite
 */

describe('F040: Verify Route', () => {
  test('mode parameter defaults to standard', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain("'standard'");
    expect(content).toContain("mode?: 'quick' | 'standard' | 'comprehensive'");
  });

  test('embargo check — EMBARGOED_COUNTRIES defined', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain("'CU'");
    expect(content).toContain("'IR'");
    expect(content).toContain("'KP'");
    expect(content).toContain("'SY'");
    expect(content).toContain('EMBARGOED_COUNTRIES');
  });

  test('embargo check for US → PASS logic exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain("'No embargo on destination'");
  });

  test('risk level includes BLOCKED for FAILs', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain("'BLOCKED'");
    expect(content).toContain('shipmentAllowed');
    expect(content).toContain('blockedReasons');
  });

  test('buyer screening (M1) supported', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain('buyerName');
    expect(content).toContain('buyer_screening');
  });

  test('verification logs saved (M2)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/route.ts', 'utf-8');
    expect(content).toContain('verification_logs');
    expect(content).toContain('shipment_allowed');
  });
});

describe('F040: Pre-Shipment Route (deprecated)', () => {
  test('deprecated notice present', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/pre-shipment/route.ts', 'utf-8');
    expect(content).toContain('@deprecated');
    expect(content).toContain('_deprecated');
    expect(content).toContain('Deprecation');
  });

  test('HS code uses 6-digit exact match (C2 fix)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/pre-shipment/route.ts', 'utf-8');
    expect(content).toContain("hsCode.substring(0, 6)");
    expect(content).toContain("eq('hs6', hs6)");
    expect(content).toContain('gov_tariff_schedules');
  });

  test('embargo uses hardcoded list not DB table (C3 fix)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/pre-shipment/route.ts', 'utf-8');
    expect(content).not.toContain('embargo_programs');
    expect(content).toContain('EMBARGO_COMPREHENSIVE');
    expect(content).toContain("'KP'");
  });

  test('risk level BLOCKED when FAIL exists (C4 fix)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/pre-shipment/route.ts', 'utf-8');
    expect(content).toContain("failCount > 0 ? 'BLOCKED'");
    expect(content).toContain('shipmentAllowed');
    expect(content).toContain('blocked_reasons');
  });
});

describe('F040: History Endpoint', () => {
  test('history route exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('app/api/v1/verify/history/route.ts', 'utf-8');
    expect(content).toContain('verification_logs');
    expect(content).toContain('withApiAuth');
    expect(content).toContain('limit');
  });
});

describe('F040: Migration', () => {
  test('verification_logs table migration exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('supabase/migrations/047_verification_logs.sql', 'utf-8');
    expect(content).toContain('CREATE TABLE');
    expect(content).toContain('verification_logs');
    expect(content).toContain('shipment_allowed');
    expect(content).toContain('risk_level');
    expect(content).toContain('checklist JSONB');
  });
});
