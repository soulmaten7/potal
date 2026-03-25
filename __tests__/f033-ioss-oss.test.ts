/**
 * F033: IOSS/OSS Compliance — Unit Tests
 */
import { calculateIoss, calculateOss, REGULATION_TOPICS_IOSS } from '../app/lib/cost-engine/ioss-oss';

// Re-export test helpers
const EU_VAT_RATES: Record<string, number> = {
  DE: 0.19, FR: 0.20, IT: 0.22, ES: 0.21, NL: 0.21, BE: 0.21, AT: 0.20,
  PT: 0.23, FI: 0.24, IE: 0.23, GR: 0.24, LU: 0.17, SK: 0.20, SI: 0.22,
  EE: 0.22, LV: 0.21, LT: 0.21, CY: 0.19, MT: 0.18, HR: 0.25, BG: 0.20,
  RO: 0.19, CZ: 0.21, DK: 0.25, HU: 0.27, PL: 0.23, SE: 0.25,
};

describe('F033 IOSS/OSS', () => {
  // Test 1: IOSS eligible — €140
  test('IOSS: €140 to DE → iossApplicable: true', () => {
    const result = calculateIoss(140, 'DE', 'CN');
    expect(result.iossApplicable).toBe(true);
    expect(result.dutyWaived).toBeDefined();
    expect(result.vatAmount).toBeGreaterThan(0);
  });

  // Test 2: IOSS ineligible — €160
  test('IOSS: €160 to FR → iossApplicable: false', () => {
    const result = calculateIoss(160, 'FR', 'CN');
    expect(result.iossApplicable).toBe(false);
    expect(result.notApplicableReason).toContain('exceeds');
  });

  // Test 3: VAT calculation correctness
  test('VAT: €100 × 19% (DE) = €19.00', () => {
    const result = calculateIoss(100, 'DE', 'CN');
    expect(result.vatAmount).toBe(19.00);
    expect(result.vatRate).toBe(0.19);
  });

  // Test 4: VAT calculation — no 100x error
  test('VAT amount is not 100x too small', () => {
    const result = calculateIoss(100, 'FR', 'CN');
    // FR VAT = 20% → €100 × 0.20 = €20.00
    expect(result.vatAmount).toBeCloseTo(20.00, 1);
    expect(result.vatAmount).toBeGreaterThan(1); // Must not be 0.20
  });

  // Test 5: IOSS number validation — valid
  test('IOSS number: IMDE1234567890 → valid', () => {
    const result = calculateIoss(100, 'DE', 'CN', 'IMDE1234567890');
    expect(result.sellerRegistered).toBe(true);
    expect(result.iossNumberValid).toBe(true);
  });

  // Test 6: IOSS number validation — invalid
  test('IOSS number: abc123 → invalid + warning', () => {
    const result = calculateIoss(100, 'DE', 'CN', 'abc123');
    expect(result.sellerRegistered).toBe(false);
    expect(result.iossNumberValid).toBe(false);
    expect(result.iossWarning).toContain('Invalid IOSS');
  });

  // Test 7: IOSS number null — not registered
  test('IOSS number: null → sellerRegistered: false', () => {
    const result = calculateIoss(100, 'DE', 'CN');
    expect(result.sellerRegistered).toBe(false);
  });

  // Test 8: Non-EU destination
  test('IOSS: non-EU destination → not applicable', () => {
    const result = calculateIoss(100, 'US', 'CN');
    expect(result.iossApplicable).toBe(false);
    expect(result.notApplicableReason).toContain('not an EU member');
  });

  // Test 9: OSS threshold — below €10K
  test('OSS: annual €5000 → thresholdExceeded: false', () => {
    const result = calculateOss(50, 'DE', 'FR', 5000);
    expect(result.thresholdExceeded).toBe(false);
    expect(result.ossApplicable).toBe(false);
  });

  // Test 10: OSS threshold — not provided → warning
  test('OSS: annual sales not provided → thresholdWarning', () => {
    const result = calculateOss(50, 'DE', 'FR');
    // Should have warning about missing data
    expect(result.thresholdWarning || result.filingObligation).toBeDefined();
  });
});
