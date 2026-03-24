/**
 * F026: Landed Cost Guarantee — Unit Tests
 */
import {
  assessGuarantee,
  TIER_CONFIG,
  PLAN_TO_TIER,
  type GuaranteeTier,
} from '../app/lib/cost-engine/landed-cost-guarantee';

describe('F026 Landed Cost Guarantee', () => {
  // Test 1: Free plan → standard tier
  test('assessGuarantee: free plan returns standard tier', () => {
    const result = assessGuarantee({
      planId: 'free',
      confidenceScore: 0.9,
      dataQuality: 'fresh',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.tier).toBe('standard');
    expect(result.coveragePercentage).toBe(10);
    expect(result.maxClaimAmount).toBe(500);
    expect(result.eligible).toBe(true);
  });

  // Test 2: Pro plan → premium tier
  test('assessGuarantee: pro plan returns premium tier', () => {
    const result = assessGuarantee({
      planId: 'pro',
      confidenceScore: 0.95,
      dataQuality: 'fresh',
      dutyRateSource: 'agr',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.tier).toBe('premium');
    expect(result.coveragePercentage).toBe(5);
    expect(result.maxClaimAmount).toBe(5000);
  });

  // Test 3: Enterprise plan → enterprise tier
  test('assessGuarantee: enterprise plan returns enterprise tier', () => {
    const result = assessGuarantee({
      planId: 'enterprise',
      confidenceScore: 0.99,
      dataQuality: 'fresh',
      dutyRateSource: 'min',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.tier).toBe('enterprise');
    expect(result.coveragePercentage).toBe(2);
    expect(result.maxClaimAmount).toBe(50000);
    expect(result.validDays).toBe(90);
  });

  // Test 4: Low confidence → ineligible
  test('assessGuarantee: low confidence score makes ineligible', () => {
    const result = assessGuarantee({
      planId: 'pro',
      confidenceScore: 0.5,
      dataQuality: 'fresh',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toContain('below 80%');
  });

  // Test 5: Trade remedies → ineligible
  test('assessGuarantee: trade remedies make ineligible', () => {
    const result = assessGuarantee({
      planId: 'pro',
      confidenceScore: 0.95,
      dataQuality: 'fresh',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'potal',
      hasTradeRemedies: true,
      isSanctioned: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toContain('trade remedies');
  });

  // Test 6: Sanctioned destination → ineligible
  test('assessGuarantee: sanctioned destination makes ineligible', () => {
    const result = assessGuarantee({
      planId: 'enterprise',
      confidenceScore: 0.99,
      dataQuality: 'fresh',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toContain('sanctions');
  });

  // Test 7: TIER_CONFIG values are consistent
  test('TIER_CONFIG has correct values', () => {
    expect(TIER_CONFIG.standard.coverage).toBe(10);
    expect(TIER_CONFIG.standard.maxClaim).toBe(500);
    expect(TIER_CONFIG.premium.coverage).toBe(5);
    expect(TIER_CONFIG.premium.maxClaim).toBe(5000);
    expect(TIER_CONFIG.enterprise.coverage).toBe(2);
    expect(TIER_CONFIG.enterprise.maxClaim).toBe(50000);
  });

  // Test 8: PLAN_TO_TIER mapping
  test('PLAN_TO_TIER maps all plans correctly', () => {
    expect(PLAN_TO_TIER['free']).toBe('standard');
    expect(PLAN_TO_TIER['basic']).toBe('standard');
    expect(PLAN_TO_TIER['pro']).toBe('premium');
    expect(PLAN_TO_TIER['enterprise']).toBe('enterprise');
  });

  // Test 9: Stale data quality → ineligible
  test('assessGuarantee: stale data makes ineligible', () => {
    const result = assessGuarantee({
      planId: 'pro',
      confidenceScore: 0.9,
      dataQuality: 'stale',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'potal',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toContain('outdated');
  });

  // Test 10: Manual HS code → ineligible
  test('assessGuarantee: manual HS code makes ineligible', () => {
    const result = assessGuarantee({
      planId: 'pro',
      confidenceScore: 0.9,
      dataQuality: 'fresh',
      dutyRateSource: 'ntlc',
      hsCodeSource: 'manual',
      hasTradeRemedies: false,
      isSanctioned: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.ineligibleReason).toContain('manually overridden');
  });
});
