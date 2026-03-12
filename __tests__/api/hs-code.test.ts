/**
 * POTAL HS Code System Tests
 *
 * Tests classifier, duty rates, FTA logic, and CostEngine integration.
 */

import { classifyProduct, classifyWithOverride } from '@/app/lib/cost-engine/hs-code/classifier';
import { getDutyRate, getEffectiveDutyRate, hasCountryDutyData } from '@/app/lib/cost-engine/hs-code/duty-rates';
import { findApplicableFta, applyFtaRate } from '@/app/lib/cost-engine/hs-code/fta';
import { calculateGlobalLandedCost } from '@/app/lib/cost-engine/GlobalCostEngine';

// ═══ HS Code Classifier ═══

describe('classifyProduct', () => {
  test('classifies "iPhone 15 Pro" and returns valid HS code', () => {
    const result = classifyProduct('iPhone 15 Pro');
    // Keyword classifier matches on "phone" → 8517 or related electronics codes
    expect(result.hsCode).not.toBe('9999');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies "Nike running shoes" and returns valid HS code', () => {
    const result = classifyProduct('Nike running shoes');
    // Keyword classifier matches on "shoes" → footwear chapter 64xx or "running" related
    expect(result.hsCode).not.toBe('9999');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies "cotton t-shirt" and returns valid HS code', () => {
    const result = classifyProduct('cotton t-shirt');
    // Keyword classifier matches on "cotton" → 5205 or "shirt" → 6109/6105
    expect(result.hsCode).not.toBe('9999');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies "laptop case" and returns valid HS code', () => {
    const result = classifyProduct('laptop protective case');
    expect(result.hsCode).not.toBe('9999');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies "wireless headphones" and returns valid HS code', () => {
    const result = classifyProduct('wireless bluetooth headphones');
    expect(result.hsCode).not.toBe('9999');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('returns 9999 for unrecognizable product', () => {
    const result = classifyProduct('xyzzy qwerty blorp');
    expect(result.hsCode).toBe('9999');
    expect(result.confidence).toBe(0);
  });

  test('returns 9999 for empty input', () => {
    const result = classifyProduct('');
    expect(result.hsCode).toBe('9999');
  });

  test('provides alternatives for ambiguous products', () => {
    const result = classifyProduct('leather boot');
    // Keyword matches on "leather" → 4205 or "boot" → 6403/6402
    expect(result.hsCode).not.toBe('9999');
    expect(result.alternatives).toBeDefined();
  });

  test('category hint boosts relevant matches', () => {
    const withHint = classifyProduct('gold ring', 'jewelry');
    const withoutHint = classifyProduct('gold ring');
    // With category hint should return valid code with equal or higher confidence
    expect(withHint.hsCode).not.toBe('9999');
    expect(withHint.confidence).toBeGreaterThanOrEqual(withoutHint.confidence);
  });
});

describe('classifyWithOverride', () => {
  test('uses HS code override when provided', () => {
    const result = classifyWithOverride('anything', '6402');
    expect(result.hsCode).toBe('6402');
    expect(result.confidence).toBe(1);
    expect(result.method).toBe('manual');
  });

  test('falls back to keyword matching without override', () => {
    const result = classifyWithOverride('bluetooth speaker');
    expect(result.hsCode).not.toBe('9999');
    expect(result.method).toBe('keyword');
  });
});

// ═══ Duty Rates ═══

describe('getDutyRate', () => {
  test('returns US duty rate for apparel (Chapter 61)', () => {
    const rate = getDutyRate('6109', 'US');
    expect(rate).not.toBeNull();
    expect(rate!.mfnRate).toBe(0.16); // 16% for knitted apparel
  });

  test('returns 0% for electronics (Chapter 84 — ITA)', () => {
    const rate = getDutyRate('8471', 'US');
    expect(rate).not.toBeNull();
    expect(rate!.mfnRate).toBe(0); // ITA duty-free
  });

  test('returns EU rate for Germany (EU member)', () => {
    const rate = getDutyRate('6109', 'DE');
    expect(rate).not.toBeNull();
    expect(rate!.mfnRate).toBe(0.12); // EU rate for apparel
  });

  test('returns EU rate for France (EU member)', () => {
    const rate = getDutyRate('6109', 'FR');
    expect(rate).not.toBeNull();
    expect(rate!.mfnRate).toBe(0.12);
  });

  test('includes Section 301 tariff for CN → US', () => {
    const rate = getDutyRate('8517', 'US', 'CN');
    expect(rate).not.toBeNull();
    expect(rate!.additionalTariff).toBe(0.25); // 25% Section 301
    expect(rate!.notes).toContain('Section 301');
  });

  test('no Section 301 for non-China origin', () => {
    const rate = getDutyRate('8517', 'US', 'KR');
    expect(rate).not.toBeNull();
    expect(rate!.additionalTariff).toBeUndefined();
  });

  test('returns null for unknown chapter', () => {
    const rate = getDutyRate('9999', 'US');
    expect(rate).toBeNull();
  });
});

describe('getEffectiveDutyRate', () => {
  test('combines MFN + Section 301 for CN → US electronics', () => {
    const rate = getEffectiveDutyRate('8517', 'US', 'CN');
    expect(rate).toBe(0.25); // 0% MFN + 25% Section 301
  });

  test('returns just MFN for non-China origin', () => {
    const rate = getEffectiveDutyRate('6109', 'US', 'KR');
    expect(rate).toBe(0.16); // just MFN
  });
});

describe('hasCountryDutyData', () => {
  test('returns true for US', () => {
    expect(hasCountryDutyData('US')).toBe(true);
  });

  test('returns true for EU members', () => {
    expect(hasCountryDutyData('DE')).toBe(true);
    expect(hasCountryDutyData('FR')).toBe(true);
  });

  test('returns true for Japan', () => {
    expect(hasCountryDutyData('JP')).toBe(true);
  });
});

// ═══ FTA Logic ═══

describe('findApplicableFta', () => {
  test('finds RCEP for China → Japan', () => {
    const fta = findApplicableFta('CN', 'JP');
    expect(fta.hasFta).toBe(true);
    expect(fta.ftaCode).toBe('RCEP');
  });

  test('finds USMCA for US → Canada', () => {
    const fta = findApplicableFta('US', 'CA');
    expect(fta.hasFta).toBe(true);
    expect(fta.ftaCode).toBe('USMCA');
    expect(fta.preferentialMultiplier).toBe(0);
  });

  test('finds ChAFTA for China → Australia', () => {
    const fta = findApplicableFta('CN', 'AU');
    expect(fta.hasFta).toBe(true);
    expect(['ChAFTA', 'RCEP']).toContain(fta.ftaCode);
  });

  test('no FTA for China → US', () => {
    const fta = findApplicableFta('CN', 'US');
    expect(fta.hasFta).toBe(false);
  });

  test('finds KORUS for Korea → US', () => {
    const fta = findApplicableFta('KR', 'US');
    expect(fta.hasFta).toBe(true);
    expect(fta.ftaCode).toBe('KORUS');
  });

  test('finds EU-Korea FTA', () => {
    const fta = findApplicableFta('KR', 'DE');
    expect(fta.hasFta).toBe(true);
    expect(fta.ftaCode).toBe('EU-KR');
  });

  test('domestic = always has FTA', () => {
    const fta = findApplicableFta('US', 'US');
    expect(fta.hasFta).toBe(true);
    expect(fta.ftaCode).toBe('DOMESTIC');
  });
});

describe('applyFtaRate', () => {
  test('reduces rate to 0 for USMCA (duty-free)', () => {
    const { rate } = applyFtaRate(0.10, 'US', 'CA');
    expect(rate).toBe(0);
  });

  test('reduces rate by 50% for RCEP', () => {
    const { rate } = applyFtaRate(0.10, 'CN', 'JP');
    expect(rate).toBe(0.05); // 50% of MFN
  });

  test('no change when no FTA exists', () => {
    const { rate } = applyFtaRate(0.10, 'CN', 'US');
    expect(rate).toBe(0.10);
  });
});

// ═══ CostEngine Integration with HS Code ═══

describe('GlobalCostEngine with HS Code', () => {
  test('uses HS Code-specific rate for t-shirt CN → UK', () => {
    const result = calculateGlobalLandedCost({
      price: 200,
      shippingPrice: 20,
      origin: 'CN',
      destinationCountry: 'GB',
      productName: 'cotton t-shirt',
    });

    expect(result.hsClassification).toBeDefined();
    // Keyword classifier matches "cotton" → 5205 or "shirt" → apparel; exact HS4 varies
    expect(result.hsClassification!.hsCode).not.toBe('9999');
    expect(result.importDuty).toBeGreaterThanOrEqual(0);
    expect(result.vat).toBeGreaterThan(0);
  });

  test('uses HS Code override when provided', () => {
    const result = calculateGlobalLandedCost({
      price: 100,
      origin: 'CN',
      destinationCountry: 'GB',
      hsCode: '6402',
      productName: 'whatever',
    });

    expect(result.hsClassification).toBeDefined();
    expect(result.hsClassification!.hsCode).toBe('6402');
    expect(result.hsClassification!.method).toBe('manual');
  });

  test('applies FTA discount for Japan → Australia (RCEP/CPTPP)', () => {
    const result = calculateGlobalLandedCost({
      price: 200,
      shippingPrice: 20,
      origin: 'JP',
      destinationCountry: 'AU',
      productName: 'wireless headphones',
    });

    expect(result.ftaApplied).toBeDefined();
    expect(result.ftaApplied!.hasFta).toBe(true);
  });

  test('electronics from CN to UK — 0% duty (ITA)', () => {
    const result = calculateGlobalLandedCost({
      price: 500,
      shippingPrice: 10,
      origin: 'CN',
      destinationCountry: 'GB',
      productName: 'laptop computer',
    });

    expect(result.hsClassification).toBeDefined();
    expect(result.importDuty).toBe(0); // ITA = 0% duty
    expect(result.vat).toBeGreaterThan(0); // VAT still applies
  });

  test('falls back to country average without productName', () => {
    const result = calculateGlobalLandedCost({
      price: 200,
      shippingPrice: 20,
      origin: 'CN',
      destinationCountry: 'GB',
    });

    // No HS classification
    expect(result.hsClassification).toBeUndefined();
    expect(result.importDuty).toBeGreaterThan(0); // above de minimis, uses avg rate
  });
});
