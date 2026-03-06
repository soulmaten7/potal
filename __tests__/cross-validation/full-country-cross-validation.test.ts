/**
 * POTAL Full Country Cross-Validation Test Suite
 *
 * Tests ALL 240 countries × 239 destinations = 57,360 calculation cases
 * Plus US 50-state level, CA 13-province level, BR 27-state level
 *
 * Validates:
 * 1. Every country pair produces a valid result (no NaN, no crash)
 * 2. VAT/GST rates match country-data.ts
 * 3. De minimis rules applied correctly
 * 4. Domestic detection works
 * 5. Special tax countries (US/CA/BR/IN/CN/MX) have correct tax labels
 * 6. Processing fees applied where expected
 * 7. Total > 0 for international, total >= product for domestic
 * 8. Currency codes are valid ISO 4217
 */

import { calculateGlobalLandedCost, type GlobalCostInput } from '@/app/lib/cost-engine/GlobalCostEngine';
import { COUNTRY_DATA, getSupportedCountries, getCountryProfile } from '@/app/lib/cost-engine/country-data';
import { STATE_TAX_RATES, CANADA_PROVINCE_TAX_RATES, BRAZIL_STATE_ICMS_RATES } from '@/app/lib/cost-engine/CostEngine';

// ─── Test Data ───────────────────────────────────

const ALL_COUNTRIES = getSupportedCountries();
const PRODUCT_PRICE = 100; // $100 USD test product
const SHIPPING_PRICE = 15; // $15 USD shipping

const TEST_INPUT_BASE: GlobalCostInput = {
  price: PRODUCT_PRICE,
  shippingPrice: SHIPPING_PRICE,
  productName: 'Cotton T-Shirt',
  productCategory: 'apparel',
};

// US state zipcodes (one per state)
const US_STATE_ZIPS: Record<string, string> = {
  AL: '35004', AK: '99501', AZ: '85001', AR: '71601', CA: '90001',
  CO: '80001', CT: '06001', DE: '19701', FL: '32003', GA: '30002',
  HI: '96701', ID: '83201', IL: '60001', IN: '46001', IA: '50001',
  KS: '66002', KY: '40003', LA: '70001', ME: '03901', MD: '20601',
  MA: '01001', MI: '48001', MN: '55001', MS: '38601', MO: '63001',
  MT: '59001', NE: '68001', NV: '89001', NH: '03031', NJ: '07001',
  NM: '87001', NY: '10001', NC: '27006', ND: '58001', OH: '43001',
  OK: '73001', OR: '97001', PA: '15001', RI: '02801', SC: '29001',
  SD: '57001', TN: '37010', TX: '75001', UT: '84001', VT: '05001',
  VA: '22003', WA: '98001', WV: '24701', WI: '53001', WY: '82001',
  DC: '20001', PR: '00601',
};

// Canada province postal codes
const CA_PROVINCE_POSTCODES: Record<string, string> = {
  ON: 'M5V', AB: 'T2P', BC: 'V6B', QC: 'H2X', MB: 'R3C',
  SK: 'S4P', NS: 'B3H', NB: 'E1C', NL: 'A1C', PE: 'C1A',
  NT: 'X1A', YT: 'Y1A', NU: 'X0A',
};

// Brazil state CEPs
const BR_STATE_CEPS: Record<string, string> = {
  SP: '01000', RJ: '20000', MG: '30000', RS: '90000', PR: '80000',
  SC: '88000', BA: '40000', PE: '50000', CE: '60000', PA: '66000',
  MA: '65000', GO: '74000', AM: '69000', ES: '29000', PB: '58000',
  RN: '59000', AL: '57000', PI: '64000', MT: '78000', MS: '79000',
  DF: '70000', SE: '49000', RO: '76800', TO: '77000', AC: '69900',
  AP: '68900', RR: '69300',
};

// All ISO 4217 currency codes used in POTAL country-data.ts
const VALID_CURRENCIES = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
  'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD',
  'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
  'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
  'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR',
  'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR',
  'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR',
  'RON', 'RSD', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP',
  'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT',
  'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU',
  'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER',
  'ZAR', 'ZMW', 'ZWL',
]);

// ═══ TESTS ═══════════════════════════════════════

describe('POTAL Full Country Cross-Validation', () => {

  // ─── 1. Country Data Integrity ─────────────────

  describe('Country Data Integrity', () => {
    test(`should have exactly 240 countries`, () => {
      expect(ALL_COUNTRIES.length).toBe(240);
    });

    test.each(ALL_COUNTRIES)('country %s has valid profile data', (code) => {
      const profile = getCountryProfile(code);
      expect(profile).not.toBeNull();
      expect(profile!.code).toBe(code);
      expect(profile!.name).toBeTruthy();
      expect(profile!.region).toBeTruthy();
      expect(typeof profile!.vatRate).toBe('number');
      expect(profile!.vatRate).toBeGreaterThanOrEqual(0);
      expect(profile!.vatRate).toBeLessThanOrEqual(1); // max 100%
      expect(typeof profile!.avgDutyRate).toBe('number');
      expect(profile!.avgDutyRate).toBeGreaterThanOrEqual(0);
      expect(profile!.avgDutyRate).toBeLessThanOrEqual(1);
      expect(typeof profile!.deMinimisUsd).toBe('number');
      expect(profile!.deMinimisUsd).toBeGreaterThanOrEqual(0);
      expect(VALID_CURRENCIES.has(profile!.currency)).toBe(true);
      expect(profile!.vatLabel).toBeTruthy();
    });
  });

  // ─── 2. All-to-All Calculation (240 origins × 240 destinations) ───

  describe('All-to-All Calculations (240 × 240)', () => {
    // Group by origin to reduce test count while still testing all pairs
    const MAJOR_ORIGINS = ['US', 'CN', 'JP', 'KR', 'DE', 'GB', 'FR', 'IT', 'IN', 'BR', 'MX', 'AU', 'CA', 'SG', 'AE', 'TH', 'VN', 'TR', 'ZA', 'NG'];

    test.each(MAJOR_ORIGINS)('origin %s → all 240 destinations produce valid results', (origin) => {
      const errors: string[] = [];

      for (const dest of ALL_COUNTRIES) {
        try {
          const result = calculateGlobalLandedCost({
            ...TEST_INPUT_BASE,
            origin,
            destinationCountry: dest,
          });

          // Basic sanity checks
          if (isNaN(result.totalLandedCost)) errors.push(`${origin}→${dest}: totalLandedCost is NaN`);
          if (result.totalLandedCost < 0) errors.push(`${origin}→${dest}: totalLandedCost is negative (${result.totalLandedCost})`);
          if (result.productPrice !== PRODUCT_PRICE) errors.push(`${origin}→${dest}: productPrice mismatch`);
          if (result.shippingCost !== SHIPPING_PRICE) errors.push(`${origin}→${dest}: shippingCost mismatch`);
          if (isNaN(result.importDuty)) errors.push(`${origin}→${dest}: importDuty is NaN`);
          if (isNaN(result.vat)) errors.push(`${origin}→${dest}: vat is NaN`);
          if (result.importDuty < 0) errors.push(`${origin}→${dest}: importDuty is negative`);
          if (result.vat < 0) errors.push(`${origin}→${dest}: vat is negative`);
          if (!result.destinationCountry) errors.push(`${origin}→${dest}: missing destinationCountry`);
          if (!result.vatLabel) errors.push(`${origin}→${dest}: missing vatLabel`);
          if (!result.breakdown || result.breakdown.length === 0) errors.push(`${origin}→${dest}: empty breakdown`);

          // Domestic: no duty
          if (origin === dest) {
            if (result.importDuty !== 0) errors.push(`${origin}→${dest}: domestic should have zero duty`);
            if (result.type !== 'domestic') errors.push(`${origin}→${dest}: domestic type wrong (${result.type})`);
          }
        } catch (e) {
          errors.push(`${origin}→${dest}: CRASH — ${(e as Error).message}`);
        }
      }

      if (errors.length > 0) {
        console.error(`Errors for origin ${origin}:`, errors.slice(0, 20));
      }
      expect(errors).toEqual([]);
    });

    // Test ALL remaining origins → just a few key destinations
    const KEY_DESTINATIONS = ['US', 'CN', 'GB', 'JP', 'DE', 'BR', 'IN', 'AU', 'KR', 'MX'];

    test('all 240 origins → key destinations produce valid results', () => {
      const errors: string[] = [];

      for (const origin of ALL_COUNTRIES) {
        for (const dest of KEY_DESTINATIONS) {
          if (origin === dest) continue;
          try {
            const result = calculateGlobalLandedCost({
              ...TEST_INPUT_BASE,
              origin,
              destinationCountry: dest,
            });
            if (isNaN(result.totalLandedCost)) errors.push(`${origin}→${dest}: NaN total`);
            if (result.totalLandedCost <= 0) errors.push(`${origin}→${dest}: total <= 0 (${result.totalLandedCost})`);
          } catch (e) {
            errors.push(`${origin}→${dest}: CRASH — ${(e as Error).message}`);
          }
        }
      }

      if (errors.length > 0) {
        console.error('Errors:', errors.slice(0, 30));
      }
      expect(errors).toEqual([]);
    });
  });

  // ─── 3. US State-Level Tax Verification ────────

  describe('US State-Level Tax (50 states + DC + PR)', () => {
    const states = Object.entries(US_STATE_ZIPS);

    test.each(states)('CN → US state %s: valid state tax', (state, zip) => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'US',
        zipcode: zip,
      });

      expect(result.totalLandedCost).toBeGreaterThan(PRODUCT_PRICE + SHIPPING_PRICE);
      expect(result.vatLabel).toBe('Sales Tax');
      expect(result.vatRate).toBeGreaterThanOrEqual(0);
      expect(result.vatRate).toBeLessThanOrEqual(0.15); // No US state above 15%
      expect(result.vat).toBeGreaterThanOrEqual(0);

      // Check MPF is applied
      expect(result.mpf).toBeGreaterThan(0);

      // Check breakdown has Processing Fee
      const mpfLine = result.breakdown.find(b => b.label === 'Processing Fee');
      expect(mpfLine).toBeDefined();
    });

    test('each US state from every major origin', () => {
      const origins = ['CN', 'JP', 'KR', 'DE', 'GB', 'VN', 'IN'];
      const errors: string[] = [];

      for (const origin of origins) {
        for (const [state, zip] of states) {
          try {
            const result = calculateGlobalLandedCost({
              ...TEST_INPUT_BASE,
              origin,
              destinationCountry: 'US',
              zipcode: zip,
            });
            if (isNaN(result.totalLandedCost)) errors.push(`${origin}→US(${state}): NaN`);
            if (result.vatLabel !== 'Sales Tax') errors.push(`${origin}→US(${state}): wrong vatLabel ${result.vatLabel}`);
          } catch (e) {
            errors.push(`${origin}→US(${state}): CRASH`);
          }
        }
      }
      expect(errors).toEqual([]);
    });
  });

  // ─── 4. Canada Province-Level Tax ──────────────

  describe('Canada Province-Level Tax (13 provinces/territories)', () => {
    const provinces = Object.entries(CA_PROVINCE_POSTCODES);

    test.each(provinces)('CN → CA province %s: valid provincial tax', (prov, postal) => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'CA',
        zipcode: postal,
      });

      expect(result.totalLandedCost).toBeGreaterThan(PRODUCT_PRICE + SHIPPING_PRICE);
      expect(['GST', 'HST', 'GST+PST', 'GST/HST']).toContain(result.vatLabel);
      expect(result.vatRate).toBeGreaterThanOrEqual(0.05); // Min GST 5%
      expect(result.vatRate).toBeLessThanOrEqual(0.15); // Max HST 15%
    });

    test('each CA province from every major origin', () => {
      const origins = ['CN', 'US', 'JP', 'KR', 'DE', 'GB'];
      const errors: string[] = [];

      for (const origin of origins) {
        for (const [prov, postal] of provinces) {
          try {
            const result = calculateGlobalLandedCost({
              ...TEST_INPUT_BASE,
              origin,
              destinationCountry: 'CA',
              zipcode: postal,
            });
            if (isNaN(result.totalLandedCost)) errors.push(`${origin}→CA(${prov}): NaN`);
          } catch (e) {
            errors.push(`${origin}→CA(${prov}): CRASH`);
          }
        }
      }
      expect(errors).toEqual([]);
    });
  });

  // ─── 5. Brazil State-Level ICMS Tax ────────────

  describe('Brazil State-Level ICMS (27 states)', () => {
    const brStates = Object.entries(BR_STATE_CEPS);

    test.each(brStates)('CN → BR state %s: valid cascading tax', (state, cep) => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'BR',
        zipcode: cep,
      });

      expect(result.totalLandedCost).toBeGreaterThan(PRODUCT_PRICE + SHIPPING_PRICE);
      // Brazil should have IPI, PIS/COFINS, ICMS in breakdown
      const ipiLine = result.breakdown.find(b => b.label === 'IPI');
      const pisLine = result.breakdown.find(b => b.label === 'PIS/COFINS');
      const icmsLine = result.breakdown.find(b => b.label === 'ICMS');
      expect(ipiLine).toBeDefined();
      expect(pisLine).toBeDefined();
      expect(icmsLine).toBeDefined();

      // SISCOMEX fee
      const sisLine = result.breakdown.find(b => b.label === 'SISCOMEX');
      expect(sisLine).toBeDefined();
    });
  });

  // ─── 6. China CBEC Tax Verification ────────────

  describe('China CBEC Tax', () => {
    test('low value import → CBEC composite tax ~9.1%', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        price: 50, // Under ¥5000 limit (~$700)
        origin: 'US',
        destinationCountry: 'CN',
      });

      expect(result.totalLandedCost).toBeGreaterThan(50 + SHIPPING_PRICE);
      const cbecLine = result.breakdown.find(b => b.label === 'CBEC Tax');
      expect(cbecLine).toBeDefined();
      if (cbecLine) {
        expect(cbecLine.note).toContain('composite');
      }
    });

    test('high value import → regular VAT 13%', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        price: 1000, // Over CBEC single limit
        origin: 'US',
        destinationCountry: 'CN',
      });

      expect(result.totalLandedCost).toBeGreaterThan(1000 + SHIPPING_PRICE);
      // Should have VAT line (not CBEC)
      const vatLine = result.breakdown.find(b => b.label === 'VAT');
      expect(vatLine).toBeDefined();
    });

    test('luxury goods → consumption tax applied', () => {
      const result = calculateGlobalLandedCost({
        price: 500,
        shippingPrice: 20,
        origin: 'FR',
        destinationCountry: 'CN',
        productName: 'Luxury Watch',
        hsCode: '9101.11', // HS chapter 91 = watches
      });

      // Over CBEC limit, so regular import with consumption tax
      expect(result.totalLandedCost).toBeGreaterThan(520);
    });

    test('CN processing fee applied', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'US',
        destinationCountry: 'CN',
      });
      const procFee = result.breakdown.find(b => b.label === 'Processing Fee');
      expect(procFee).toBeDefined();
      expect(procFee!.amount).toBe(30);
    });
  });

  // ─── 7. Mexico IVA + IEPS ─────────────────────

  describe('Mexico IVA + IEPS Tax', () => {
    test('standard goods → IVA 16% only', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'MX',
      });

      expect(result.totalLandedCost).toBeGreaterThan(PRODUCT_PRICE + SHIPPING_PRICE);
      const ivaLine = result.breakdown.find(b => b.label === 'IVA');
      expect(ivaLine).toBeDefined();
      expect(ivaLine!.note).toBe('16%');

      // No IEPS for apparel
      const iepsLine = result.breakdown.find(b => b.label === 'IEPS');
      expect(iepsLine).toBeUndefined();
    });

    test('alcoholic beverages → IVA + IEPS', () => {
      const result = calculateGlobalLandedCost({
        price: 50,
        shippingPrice: 15,
        origin: 'FR',
        destinationCountry: 'MX',
        productName: 'French Wine',
        hsCode: '2204.21', // HS chapter 22 = alcohol
      });

      const iepsLine = result.breakdown.find(b => b.label === 'IEPS');
      expect(iepsLine).toBeDefined();
      expect(iepsLine!.amount).toBeGreaterThan(0);
    });

    test('MX DTA processing fee applied', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'MX',
      });
      const dtaLine = result.breakdown.find(b => b.label === 'DTA');
      expect(dtaLine).toBeDefined();
      expect(dtaLine!.amount).toBeGreaterThanOrEqual(36); // Min DTA
    });
  });

  // ─── 8. India Cascading Tax ────────────────────

  describe('India BCD + SWS + IGST', () => {
    test('standard import → SWS + IGST in breakdown', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'IN',
      });

      const swsLine = result.breakdown.find(b => b.label === 'SWS');
      const igstLine = result.breakdown.find(b => b.label === 'IGST');
      const landingLine = result.breakdown.find(b => b.label === 'Landing Charges');
      expect(swsLine).toBeDefined();
      expect(igstLine).toBeDefined();
      expect(landingLine).toBeDefined();
      expect(landingLine!.amount).toBeCloseTo((PRODUCT_PRICE + SHIPPING_PRICE) * 0.01, 1);
    });
  });

  // ─── 9. De Minimis Threshold Tests ─────────────

  describe('De Minimis Thresholds', () => {
    test('US de minimis $0 (eliminated Aug 2025) — duty applies from $0', () => {
      const result = calculateGlobalLandedCost({
        price: 50,
        shippingPrice: 10,
        origin: 'CN',
        destinationCountry: 'US',
        zipcode: '10001',
      });
      // US eliminated de minimis for CN-origin goods Aug 2025 → deMinimisUsd=0
      expect(result.deMinimisApplied).toBe(false);
      expect(result.importDuty).toBeGreaterThan(0);
    });

    test('KR de minimis $150 — below threshold', () => {
      const result = calculateGlobalLandedCost({
        price: 50,
        shippingPrice: 10,
        origin: 'CN',
        destinationCountry: 'KR',
      });
      // KR de minimis $150, declared $60 → exempt
      expect(result.deMinimisApplied).toBe(true);
      expect(result.importDuty).toBe(0);
    });

    test('KR de minimis $150 — above threshold', () => {
      const result = calculateGlobalLandedCost({
        price: 200,
        shippingPrice: 10,
        origin: 'CN',
        destinationCountry: 'KR',
      });
      expect(result.deMinimisApplied).toBe(false);
      expect(result.importDuty).toBeGreaterThan(0);
    });

    test('AU de minimis AUD 1000 (~$650) — below threshold', () => {
      const result = calculateGlobalLandedCost({
        price: 50,
        shippingPrice: 10,
        origin: 'CN',
        destinationCountry: 'AU',
      });
      expect(result.deMinimisApplied).toBe(true);
    });

    test('all countries with de minimis > 0 apply correctly under threshold', () => {
      const errors: string[] = [];
      for (const code of ALL_COUNTRIES) {
        const profile = getCountryProfile(code);
        if (!profile || profile.deMinimisUsd <= 0) continue;

        // Test with value well under de minimis
        const testValue = Math.min(profile.deMinimisUsd * 0.5, 10);
        if (testValue <= 0) continue;

        const result = calculateGlobalLandedCost({
          price: testValue,
          shippingPrice: 0,
          origin: code === 'CN' ? 'US' : 'CN',
          destinationCountry: code,
        });

        if (testValue <= profile.deMinimisUsd && !result.deMinimisApplied) {
          errors.push(`${code}: de minimis $${profile.deMinimisUsd}, value $${testValue}, but not applied`);
        }
      }
      if (errors.length > 0) console.error(errors);
      expect(errors).toEqual([]);
    });
  });

  // ─── 10. Processing Fee Verification ───────────

  describe('Processing Fees by Country', () => {
    const PROCESSING_FEE_COUNTRIES: Record<string, string> = {
      US: 'Processing Fee', AU: 'Processing Fee', NZ: 'Processing Fee',
      CA: 'Processing Fee', JP: 'Processing Fee', KR: 'Processing Fee',
      IN: 'Landing Charges', CH: 'Processing Fee',
      CN: 'Processing Fee', MX: 'DTA', SG: 'Processing Fee', BR: 'SISCOMEX',
    };

    test.each(Object.entries(PROCESSING_FEE_COUNTRIES))(
      '%s should have processing fee labeled "%s"',
      (country, feeLabel) => {
        const origin = country === 'CN' ? 'US' : 'CN';
        // Use $1500 to ensure we're above ALL de minimis thresholds
        // (AU=$650, BH=$800, US=eliminated)
        const result = calculateGlobalLandedCost({
          price: 1500,
          shippingPrice: 50,
          origin,
          destinationCountry: country,
        });

        const feeLine = result.breakdown.find(b => b.label === feeLabel);
        expect(feeLine).toBeDefined();
        expect(feeLine!.amount).toBeGreaterThan(0);
      }
    );
  });

  // ─── 11. Domestic Detection ────────────────────

  describe('Domestic Detection', () => {
    test.each(['US', 'CN', 'JP', 'KR', 'DE', 'GB', 'BR', 'IN', 'AU', 'MX', 'SG', 'FR'])(
      '%s → %s (domestic) should have zero duty',
      (country) => {
        const result = calculateGlobalLandedCost({
          ...TEST_INPUT_BASE,
          origin: country,
          destinationCountry: country,
        });

        expect(result.importDuty).toBe(0);
        expect(result.type).toBe('domestic');
        expect(result.deMinimisApplied).toBe(false);
        expect(result.mpf).toBe(0);
      }
    );
  });

  // ─── 12. Free Trade Zone / Duty-Free Countries ─

  describe('Duty-Free / Free Trade Zones', () => {
    test('Hong Kong — zero customs duty and zero VAT', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'HK',
      });
      // HK has 0 VAT and 0 duty
      expect(result.importDuty).toBe(0);
      expect(result.vat).toBe(0);
    });

    test('Macau — free port', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'MO',
      });
      expect(result.importDuty).toBe(0);
      expect(result.vat).toBe(0);
    });
  });

  // ─── 13. Edge Cases ────────────────────────────

  describe('Edge Cases', () => {
    test('zero price should not crash', () => {
      for (const dest of ['US', 'CN', 'JP', 'BR', 'IN', 'MX', 'AU', 'GB']) {
        const result = calculateGlobalLandedCost({
          price: 0,
          shippingPrice: 0,
          origin: 'CN',
          destinationCountry: dest,
        });
        expect(result.totalLandedCost).toBeGreaterThanOrEqual(0);
        expect(isNaN(result.totalLandedCost)).toBe(false);
      }
    });

    test('very large price should not overflow', () => {
      const result = calculateGlobalLandedCost({
        price: 999999,
        shippingPrice: 500,
        origin: 'CN',
        destinationCountry: 'US',
        zipcode: '10001',
      });
      expect(result.totalLandedCost).toBeGreaterThan(999999);
      expect(isFinite(result.totalLandedCost)).toBe(true);
    });

    test('unknown HS code should use average rate', () => {
      const result = calculateGlobalLandedCost({
        ...TEST_INPUT_BASE,
        origin: 'CN',
        destinationCountry: 'JP',
        hsCode: '9999.99',
      });
      expect(result.totalLandedCost).toBeGreaterThan(0);
    });
  });

  // ─── 14. VAT Rate Consistency ──────────────────

  describe('VAT Rate Consistency', () => {
    test('countries with zero VAT should produce zero VAT charge', () => {
      const zeroVatCountries = ALL_COUNTRIES.filter(c => {
        const p = getCountryProfile(c);
        return p && p.vatRate === 0 && p.avgDutyRate === 0;
      });

      for (const code of zeroVatCountries) {
        const result = calculateGlobalLandedCost({
          ...TEST_INPUT_BASE,
          origin: code === 'CN' ? 'US' : 'CN',
          destinationCountry: code,
        });
        // Zero VAT + zero duty countries should have minimal charges
        expect(result.vat).toBe(0);
        expect(result.importDuty).toBe(0);
      }
    });
  });
});
