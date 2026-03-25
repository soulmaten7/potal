/**
 * F039: Rules of Origin (RoO) Engine — Test Suite
 */

import { evaluateRoO } from '@/app/lib/trade/roo-engine';

describe('F039: RoO Engine', () => {
  // C1: USMCA with chapter-specific RVC
  test('USMCA: US→CA apparel, RVC 65% threshold (chapter 61), 70% → eligible', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'CA', ftaId: 'USMCA',
      productValue: 100, localContentValue: 70,
    });
    expect(result.eligible).toBe(true);
    expect(result.criteriaMetList).toContain('RVC');
    expect(result.requiredRvc).toBe(65); // chapter 61 override, not default 75
    expect(result.rvcPercentage).toBe(70);
  });

  test('USMCA: automotive RVC 74% → ineligible (75% required)', () => {
    const result = evaluateRoO({
      hs6: '870323', origin: 'US', destination: 'MX', ftaId: 'USMCA',
      productValue: 100, localContentValue: 74,
    });
    expect(result.eligible).toBe(false);
    expect(result.criteriaFailed).toContain('RVC');
    expect(result.requiredRvc).toBe(75);
  });

  // C1: CPTPP
  test('CPTPP: JP→AU, RVC 50% (>45% required) → eligible', () => {
    const result = evaluateRoO({
      hs6: '847130', origin: 'JP', destination: 'AU', ftaId: 'CPTPP',
      productValue: 100, localContentValue: 50,
    });
    expect(result.eligible).toBe(true);
    expect(result.criteriaMetList).toContain('RVC');
  });

  // C2: CTH with substantial transformation warning
  test('CTH: tariff shift but low material cost → warning', () => {
    const result = evaluateRoO({
      hs6: '620342', origin: 'US', destination: 'CA', ftaId: 'USMCA',
      productValue: 100,
      materials: [{ hsCode: '520100', origin: 'CN', value: 15 }], // 15% material cost
    });
    expect(result.tariffShiftMet).toBe(true);
    expect(result.warnings.some(w => w.includes('substantial'))).toBe(true);
  });

  // C4: Cumulation
  test('RCEP: cumulation from member country materials', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'CN', destination: 'JP', ftaId: 'RCEP',
      productValue: 100,
      materials: [
        { hsCode: '520100', origin: 'VN', value: 30 }, // RCEP member
        { hsCode: '540100', origin: 'IN', value: 20 }, // non-member
      ],
      inputOrigins: ['VN', 'IN'],
    });
    expect(result.cumulationApplied).toBe(true);
    // VN material should be counted as originating
  });

  // C5: Inactive FTA
  test('non-existent FTA → eligible: false with message', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'BR', ftaId: 'FAKE_FTA',
    });
    expect(result.eligible).toBe(false);
    expect(result.details).toContain('No active FTA');
  });

  // M2: De minimis
  test('de minimis: non-originating 7% → auto-eligible', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'CA', ftaId: 'USMCA',
      productValue: 100,
      materials: [
        { hsCode: '610910', origin: 'US', value: 93 },
        { hsCode: '520100', origin: 'CN', value: 7 },
      ],
    });
    expect(result.deMinimisApplied).toBe(true);
    expect(result.eligible).toBe(true);
  });

  // C3: PE with originating materials
  test('PE: all materials from FTA members → PE criteria met', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'CA', ftaId: 'USMCA',
      productValue: 100,
      materials: [
        { hsCode: '520100', origin: 'US', value: 60 },
        { hsCode: '540100', origin: 'MX', value: 40 },
      ],
    });
    expect(result.criteriaMetList).toContain('PE');
  });

  // M4: Savings display
  test('savings: eligible shows mfn vs fta duty estimates', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'CA', ftaId: 'USMCA',
      productValue: 1000, localContentValue: 800,
    });
    expect(result.eligible).toBe(true);
    expect(result.savingsIfEligible).toBeGreaterThan(0);
    expect(result.mfnDutyEstimate).toBeGreaterThan(0);
    expect(result.ftaDutyEstimate).toBeDefined();
    expect(result.details).toContain('savings');
  });

  // No FTA between countries
  test('no FTA: US→BR → eligible: false', () => {
    const result = evaluateRoO({
      hs6: '610910', origin: 'US', destination: 'BR',
    });
    expect(result.eligible).toBe(false);
    expect(result.details).toContain('No active FTA');
  });
});
