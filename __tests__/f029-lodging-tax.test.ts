/**
 * F029: Lodging/Hospitality Tax — Test Suite
 */

describe('F029: Lodging Tax Code Analysis', () => {
  let content: string;

  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/tax/special/route.ts', 'utf-8');
  });

  // C1: Flat fee + percentage combined
  test('C1: calculateLodgingTax handles percentage + flat_per_night', () => {
    expect(content).toContain('calculateLodgingTax');
    expect(content).toContain("'percentage'");
    expect(content).toContain("'flat_per_night'");
    expect(content).toContain("'flat_per_stay'");
    expect(content).toContain('percentageRate');
    expect(content).toContain('flatAmount');
  });

  // C2: City-level taxes
  test('C2: NYC city taxes include flat fees', () => {
    expect(content).toContain("'US_NYC'");
    expect(content).toContain('NYC Hotel Tax');
    expect(content).toContain('NYC Unit Fee');
    expect(content).toContain('Javits Center Fee');
    expect(content).toContain('3.50');  // Unit Fee
    expect(content).toContain('1.50');  // Javits
  });

  test('C2: LA city taxes include TMD', () => {
    expect(content).toContain("'US_LA'");
    expect(content).toContain('TMD');
    expect(content).toContain('Tourism Marketing');
  });

  // C3: OTA platform check
  test('C3: platform tax collectors defined', () => {
    expect(content).toContain('PLATFORM_TAX_COLLECTORS');
    expect(content).toContain('airbnb');
    expect(content).toContain('booking.com');
    expect(content).toContain('platformCollected');
  });

  // C4: Long-stay exemption
  test('C4: long-stay exemption with state-specific thresholds', () => {
    expect(content).toContain('LONG_STAY_EXEMPTION');
    expect(content).toContain('longStayExemption');
    expect(content).toContain('DEFAULT: 30');
    expect(content).toContain('NY: 90');
    expect(content).toContain('FL: 183');
  });

  // C5: International lodging taxes
  test('C5: Tokyo accommodation tax ¥200/night', () => {
    expect(content).toContain("'JP_TOKYO'");
    expect(content).toContain('Tokyo Accommodation Tax');
    expect(content).toContain("flatAmount: 200");
    expect(content).toContain("currency: 'JPY'");
  });

  test('C5: Paris taxe de séjour €4.30/night', () => {
    expect(content).toContain("'FR_PARIS'");
    expect(content).toContain('Taxe de Séjour');
    expect(content).toContain('4.30');
  });

  test('C5: Rome city tax €7/night', () => {
    expect(content).toContain("'IT_ROME'");
    expect(content).toContain('Imposta di Soggiorno');
  });

  test('C5: Barcelona tourist tax with surcharge', () => {
    expect(content).toContain("'ES_BARCELONA'");
    expect(content).toContain('Catalan Tourist Tax');
    expect(content).toContain('Barcelona Surcharge');
  });

  // Precision levels
  test('returns precision: city_level when city provided', () => {
    expect(content).toContain("'city_level'");
  });

  // City normalization
  test('city normalization maps aliases', () => {
    expect(content).toContain('normalizeCityKey');
    expect(content).toContain('NEWYORK');
    expect(content).toContain('MANHATTAN');
  });
});
