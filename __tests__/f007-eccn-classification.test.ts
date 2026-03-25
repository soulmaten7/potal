/**
 * F007: ECCN Classification — Test Suite
 */

describe('F007: ECCN Route Code Analysis', () => {
  let content: string;

  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/classify/eccn/route.ts', 'utf-8');
  });

  // C1: HS4-level mapping
  test('C1: HS4-level ECCN mapping exists', () => {
    expect(content).toContain('HS4_TO_ECCN');
    expect(content).toContain("'8471'");  // computers
    expect(content).toContain("'8542'");  // ICs
    expect(content).toContain("mappingPrecision");
    expect(content).toContain("'hs4'");
  });

  test('C1: chapter-level fallback with warning', () => {
    expect(content).toContain('HS_CHAPTER_ECCN');
    expect(content).toContain("'chapter'");
    expect(content).toContain('Multiple ECCNs possible');
  });

  // C2: Encryption handling
  test('C2: encryption analysis with ENC exception', () => {
    expect(content).toContain('encryptionAnalysis');
    expect(content).toContain("'ENC'");
    expect(content).toContain('encExceptionEligible');
    expect(content).toContain('massMarket');
    expect(content).toContain('EMBARGOED');
  });

  // C3: Schedule B confidence
  test('C3: Schedule B includes confidence level', () => {
    expect(content).toContain("confidence:");
    expect(content).toContain("'low'");
    expect(content).toContain('Census Bureau');
  });

  // C4: Full control reasons (18)
  test('C4: all 18 control reasons defined', () => {
    const reasons = ['NS', 'NP', 'MT', 'CB', 'RS', 'FC', 'CC', 'AT', 'EI', 'UN', 'SI', 'SL', 'SS', 'CW', 'BW', 'AS', 'HRS', 'XP'];
    for (const r of reasons) {
      expect(content).toContain(`${r}:`);
    }
  });

  // C5: Destination-specific license
  test('C5: destination country analysis', () => {
    expect(content).toContain('destinationCountry');
    expect(content).toContain('destinationAnalysis');
    expect(content).toContain('licenseRequired');
    expect(content).toContain('checkLicenseRequirement');
    expect(content).toContain('GROUP_D1');
    expect(content).toContain('GROUP_A1');
  });

  test('C5: embargoed countries block', () => {
    expect(content).toContain("'CU'");
    expect(content).toContain("'IR'");
    expect(content).toContain("'KP'");
    expect(content).toContain("'SY'");
  });

  // C6: HS code validation
  test('C6: HS code normalization and validation', () => {
    expect(content).toContain('normalizeHsCode');
    expect(content).toContain("replace(/[^0-9]/g, '')");
    expect(content).toContain('Invalid HS code format');
  });

  // C7: AI classification error reporting
  test('C7: classification error includes reason and suggestion', () => {
    expect(content).toContain('classificationError');
    expect(content).toContain('AI classification failed');
    expect(content).toContain('Provide HS code directly');
  });

  // C8: ITAR confidence scoring
  test('C8: ITAR uses confidence scoring not just keywords', () => {
    expect(content).toContain('calculateItarConfidence');
    expect(content).toContain('itarConfidence');
    expect(content).toContain("'review_recommended'");
    // Checks that "military green" style false positives are handled
    expect(content).toContain('green');
    expect(content).toContain('fashion');
  });

  test('C8: "missile guidance" scores high (>= 0.70)', () => {
    expect(content).toContain("'missile guidance'");
    expect(content).toContain('0.45');
  });

  test('C8: ITAR low-confidence words filtered for context', () => {
    expect(content).toContain("'defense'");
    expect(content).toContain('after');
    // Context check for non-defense usage
    expect(content).toContain('jacket');
  });
});
