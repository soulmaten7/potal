/**
 * F037: Export Controls — Unit Tests
 */
import { classifyECCN, checkLicenseRequirement, COUNTRY_GROUPS } from '../app/lib/compliance/export-controls';

describe('F037 Export Controls', () => {
  // Test 1: EAR99 — consumer goods
  test('EAR99: cotton t-shirt (HS 61) → EAR99, NLR', () => {
    const r = classifyECCN({ hsCode: '610910', productName: 'Cotton T-Shirt' });
    expect(r.eccn).toBe('EAR99');
    expect(r.ear99).toBe(true);
    expect(r.classificationStatus).toBe('ear99');
  });

  // Test 2: Controlled — electronics to CN
  test('controlled: 3A electronics to CN → license_required', () => {
    const r = classifyECCN({ hsCode: '854231', productName: 'Semiconductor chip' });
    expect(r.ear99).toBe(false);
    expect(r.licenseRequired).toBe(true);
    const lic = checkLicenseRequirement(r.eccn, 'CN');
    expect(lic.required).toBe(true);
  });

  // Test 3: Embargo — Iran
  test('embargo: any item to IR → blocked', () => {
    const lic = checkLicenseRequirement('EAR99', 'IR');
    expect(lic.required).toBe(true);
    expect(lic.exceptionAvailable).toBe(false);
    expect(lic.reason).toContain('sanctions');
  });

  // Test 4: LVS threshold exceeded
  test('LVS: $6000 category 3 → LVS not eligible', () => {
    const r = classifyECCN({ hsCode: '854231', productName: 'IC', declaredValue: 6000 });
    const lvs = r.licenseExceptions.find(e => e.code === 'LVS');
    expect(lvs?.eligible).toBe(false);
    expect(lvs?.reason).toContain('exceeds');
  });

  // Test 5: ITAR — compound pattern
  test('ITAR: "missile guidance system" → itar_possible + DDTC', () => {
    const r = classifyECCN({ hsCode: '880000', productName: 'Missile guidance system component' });
    expect(r.classificationStatus).toBe('itar_possible');
    expect(r.itarGuidance?.ddtcUrl).toContain('pmddtc.state.gov');
    expect(r.itarGuidance?.action).toContain('DO NOT EXPORT');
  });

  // Test 6: ITAR false positive prevention
  test('ITAR false positive: "military green jacket" → EAR99 with warning', () => {
    const r = classifyECCN({ hsCode: '620342', productName: 'Military green jacket fashion' });
    expect(r.classificationStatus).toBe('ear99');
    expect(r.warning).toContain('defense keyword');
  });

  // Test 7: TMP — not auto-eligible
  test('TMP: requires documented return, not auto-eligible', () => {
    const r = classifyECCN({ hsCode: '854231', productName: 'Test equipment' });
    const tmp = r.licenseExceptions.find(e => e.code === 'TMP');
    expect(tmp?.eligible).toBe(false);
    expect(tmp?.reason).toContain('12 months');
  });

  // Test 8: Unknown HS → CLASSIFICATION_REQUIRED
  test('unknown HS chapter → classification_required, not EAR99', () => {
    const r = classifyECCN({ hsCode: '999900', productName: 'Unknown item' });
    expect(r.eccn).toBe('UNKNOWN');
    expect(r.classificationStatus).toBe('classification_required');
    expect(r.warning).toContain('Manual BIS classification');
  });

  // Test 9: Country Group D1
  test('country group D1: CN → D1 in groups', () => {
    expect(COUNTRY_GROUPS.D1.has('CN')).toBe(true);
    expect(COUNTRY_GROUPS.D1.has('US')).toBe(false);
    const lic = checkLicenseRequirement('3A001', 'CN');
    expect(lic.countryGroups).toContain('D1');
  });

  // Test 10: Country Group B — allies
  test('country group B: GB, JP, AU → in B', () => {
    expect(COUNTRY_GROUPS.B.has('GB')).toBe(true);
    expect(COUNTRY_GROUPS.B.has('JP')).toBe(true);
    expect(COUNTRY_GROUPS.B.has('AU')).toBe(true);
    expect(COUNTRY_GROUPS.B.has('CN')).toBe(false);
  });
});
