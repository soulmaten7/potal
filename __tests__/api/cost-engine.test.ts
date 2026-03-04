/**
 * POTAL Cost Engine — Unit Tests
 *
 * Tests for both US-specific and Global cost calculation.
 * Run: npx jest __tests__/api/cost-engine.test.ts
 */

import { calculateLandedCost, parsePriceToNumber, zipcodeToState } from '@/app/lib/cost-engine/CostEngine';
import { calculateGlobalLandedCost } from '@/app/lib/cost-engine/GlobalCostEngine';
import { getCountryProfile, getSupportedCountries, getCountryCount } from '@/app/lib/cost-engine/country-data';
import type { CostInput } from '@/app/lib/cost-engine/types';

// ═══ parsePriceToNumber ═══

describe('parsePriceToNumber', () => {
  test('parses number input', () => {
    expect(parsePriceToNumber(49.99)).toBe(49.99);
  });

  test('parses string with dollar sign', () => {
    expect(parsePriceToNumber('$29.99')).toBe(29.99);
  });

  test('parses string with commas', () => {
    expect(parsePriceToNumber('1,299.99')).toBe(1299.99);
  });

  test('returns 0 for undefined', () => {
    expect(parsePriceToNumber(undefined)).toBe(0);
  });

  test('returns 0 for invalid string', () => {
    expect(parsePriceToNumber('abc')).toBe(0);
  });

  test('returns 0 for negative', () => {
    expect(parsePriceToNumber(-10)).toBe(0);
  });
});

// ═══ zipcodeToState ═══

describe('zipcodeToState', () => {
  test('maps NYC zip to NY', () => {
    expect(zipcodeToState('10001')).toBe('NY');
  });

  test('maps LA zip to CA', () => {
    expect(zipcodeToState('90210')).toBe('CA');
  });

  test('maps Seattle zip to WA', () => {
    expect(zipcodeToState('98101')).toBe('WA');
  });

  test('returns null for invalid zip', () => {
    expect(zipcodeToState('')).toBeNull();
    expect(zipcodeToState('00')).toBeNull();
  });
});

// ═══ US Landed Cost (domestic) ═══

describe('calculateLandedCost — US Domestic', () => {
  test('domestic product with sales tax', () => {
    const input: CostInput = {
      price: 100,
      shippingPrice: 10,
      origin: 'US',
      zipcode: '10001', // NY
    };
    const result = calculateLandedCost(input);

    expect(result.type).toBe('domestic');
    expect(result.productPrice).toBe(100);
    expect(result.shippingCost).toBe(10);
    expect(result.importDuty).toBe(0);
    expect(result.mpf).toBe(0);
    expect(result.salesTax).toBeGreaterThan(0);
    expect(result.totalLandedCost).toBeGreaterThan(110);
    expect(result.originCountry).toBe('DOMESTIC');
  });

  test('no sales tax in Oregon', () => {
    const input: CostInput = {
      price: 100,
      origin: 'US',
      zipcode: '97201', // OR
    };
    const result = calculateLandedCost(input);

    expect(result.salesTax).toBe(0);
    expect(result.totalLandedCost).toBe(100);
  });
});

// ═══ US Landed Cost (China import) ═══

describe('calculateLandedCost — China to US', () => {
  test('China origin with duty and MPF', () => {
    const input: CostInput = {
      price: 50,
      shippingPrice: 5,
      origin: 'CN',
    };
    const result = calculateLandedCost(input);

    expect(result.type).toBe('global');
    expect(result.originCountry).toBe('CN');
    expect(result.importDuty).toBe(11); // 55 * 0.20 = 11
    expect(result.mpf).toBe(5.50);
    expect(result.totalLandedCost).toBe(71.50); // 50 + 5 + 11 + 5.50
  });

  test('AliExpress detected as China origin', () => {
    const input: CostInput = {
      price: 30,
      origin: 'AliExpress',
    };
    const result = calculateLandedCost(input);

    expect(result.originCountry).toBe('CN');
    expect(result.importDuty).toBeGreaterThan(0);
  });
});

// ═══ Global Cost Engine ═══

describe('calculateGlobalLandedCost', () => {
  test('US destination delegates to US engine', () => {
    const input: CostInput = {
      price: 100,
      origin: 'US',
      zipcode: '10001',
      destinationCountry: 'US',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.destinationCountry).toBe('US');
    expect(result.vatLabel).toBe('Sales Tax');
  });

  test('UK destination with VAT (above de minimis)', () => {
    const input: CostInput = {
      price: 200,
      shippingPrice: 20,
      origin: 'CN',
      destinationCountry: 'GB',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.destinationCountry).toBe('GB');
    expect(result.vatLabel).toBe('VAT');
    expect(result.vatRate).toBe(0.20);
    // £135 ≈ $170 de minimis; $220 is above → duty applies
    expect(result.importDuty).toBeGreaterThan(0);
    expect(result.vat).toBeGreaterThan(0);
    expect(result.totalLandedCost).toBeGreaterThan(220);
  });

  test('Germany de minimis for low-value goods', () => {
    const input: CostInput = {
      price: 20,
      shippingPrice: 5,
      origin: 'CN',
      destinationCountry: 'DE',
    };
    const result = calculateGlobalLandedCost(input);

    // €150 de minimis ≈ $160 USD; $25 is below
    expect(result.deMinimisApplied).toBe(true);
    expect(result.importDuty).toBe(0);
    expect(result.vat).toBeGreaterThan(0); // VAT still applies
  });

  test('Japan with JCT', () => {
    const input: CostInput = {
      price: 80,
      origin: 'US',
      destinationCountry: 'JP',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.destinationCountry).toBe('JP');
    expect(result.vatLabel).toBe('JCT');
    expect(result.vatRate).toBe(0.10);
    // ¥10,000 ≈ $67 de minimis, $80 is above
    expect(result.deMinimisApplied).toBe(false);
  });

  test('Hong Kong — no duty no VAT', () => {
    const input: CostInput = {
      price: 500,
      origin: 'US',
      destinationCountry: 'HK',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.importDuty).toBe(0);
    expect(result.vat).toBe(0);
    expect(result.totalLandedCost).toBe(500);
  });

  test('Australia with GST and ChAFTA', () => {
    const input: CostInput = {
      price: 200,
      shippingPrice: 20,
      origin: 'CN',
      destinationCountry: 'AU',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.destinationCountry).toBe('AU');
    expect(result.vatLabel).toBe('GST');
    expect(result.vatRate).toBe(0.10);
    expect(result.destinationCurrency).toBe('AUD');
  });

  test('Brazil with high duty', () => {
    const input: CostInput = {
      price: 100,
      origin: 'CN',
      destinationCountry: 'BR',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.importDuty).toBeGreaterThan(0);
    expect(result.vat).toBeGreaterThan(0);
    expect(result.totalLandedCost).toBeGreaterThan(130); // High total
  });

  test('Unknown country uses conservative defaults', () => {
    const input: CostInput = {
      price: 100,
      origin: 'CN',
      destinationCountry: 'XX',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.destinationCountry).toBe('XX');
    expect(result.importDuty).toBeGreaterThan(0); // 10% default
    expect(result.vat).toBeGreaterThan(0); // 15% default
  });

  test('Domestic same-country = no duty', () => {
    const input: CostInput = {
      price: 100,
      origin: 'DE',
      destinationCountry: 'DE',
    };
    const result = calculateGlobalLandedCost(input);

    expect(result.type).toBe('domestic');
    expect(result.importDuty).toBe(0);
    expect(result.isDutyFree).toBe(true);
  });
});

// ═══ Country Data ═══

describe('Country Data', () => {
  test('has 50+ countries', () => {
    expect(getCountryCount()).toBeGreaterThanOrEqual(50);
  });

  test('all countries have required fields', () => {
    const codes = getSupportedCountries();
    for (const code of codes) {
      const profile = getCountryProfile(code);
      expect(profile).not.toBeNull();
      expect(profile!.code).toBe(code);
      expect(profile!.name).toBeTruthy();
      expect(profile!.region).toBeTruthy();
      expect(typeof profile!.vatRate).toBe('number');
      expect(typeof profile!.avgDutyRate).toBe('number');
      expect(typeof profile!.deMinimisUsd).toBe('number');
      expect(profile!.currency).toBeTruthy();
    }
  });

  test('case-insensitive lookup', () => {
    expect(getCountryProfile('us')).not.toBeNull();
    expect(getCountryProfile('US')).not.toBeNull();
    expect(getCountryProfile('gb')).not.toBeNull();
  });

  test('unknown country returns null', () => {
    expect(getCountryProfile('ZZ')).toBeNull();
  });
});
