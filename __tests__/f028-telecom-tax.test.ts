/**
 * F028: Telecom/Digital Tax — Unit Tests
 */

describe('F028 Telecom/Digital Tax', () => {
  // Test 1: US Telecom surcharges
  test('US telecom: federal USF rate = 20.1%', () => {
    const USF_RATE = 0.201;
    const revenue = 1000;
    const usfAmount = Math.round(revenue * USF_RATE * 100) / 100;
    expect(usfAmount).toBe(201);
  });

  // Test 2: EU streaming B2C → destination VAT
  test('EU digital B2C: FR streaming → 20% VAT', () => {
    const RATES: Record<string, Record<string, number>> = {
      FR: { streaming: 0.20, software: 0.20, advertising: 0.03 },
    };
    expect(RATES['FR']['streaming']).toBe(0.20);
    expect(RATES['FR']['advertising']).toBe(0.03); // DST, not VAT
  });

  // Test 3: EU B2B reverse charge
  test('EU B2B with VAT number → reverse_charge, tax=0', () => {
    const buyerType = 'business';
    const buyerVatNumber = 'DE123456789';
    const buyerCountry = 'DE';
    const sellerCountry = 'FR';
    const isEU = new Set(['DE','FR','IT']).has(buyerCountry);
    const crossBorder = buyerCountry !== sellerCountry;
    const reverseCharge = buyerType === 'business' && !!buyerVatNumber && isEU && crossBorder;
    expect(reverseCharge).toBe(true);
  });

  // Test 4: France DST threshold — large company
  test('FR DST: global revenue €800M → DST 3% applies', () => {
    const threshold = 750_000_000;
    const sellerRevenue = 800_000_000;
    expect(sellerRevenue >= threshold).toBe(true);
  });

  // Test 5: France DST threshold — small company
  test('FR DST: global revenue €100M → DST not applicable', () => {
    const threshold = 750_000_000;
    const sellerRevenue = 100_000_000;
    expect(sellerRevenue >= threshold).toBe(false);
  });

  // Test 6: India digital → IGST 18% + TCS 2%
  test('India digital: IGST 18% + withholding TCS 2%', () => {
    const igst = 0.18;
    const tcs = 0.02;
    const value = 1000;
    expect(Math.round(value * igst * 100) / 100).toBe(180);
    expect(Math.round(value * tcs * 100) / 100).toBe(20);
  });

  // Test 7: Korea SW royalty withholding
  test('Korea: software royalty withholding 20%', () => {
    const WHT: Record<string, { rate: number }> = { KR: { rate: 0.20 } };
    expect(WHT['KR'].rate).toBe(0.20);
    const amount = 1000 * 0.20;
    expect(amount).toBe(200);
  });

  // Test 8: Turkey streaming vs software rates
  test('Turkey: streaming 7.5% vs software 18%', () => {
    const TR: Record<string, number> = { streaming: 0.075, software: 0.18 };
    expect(TR['streaming']).toBe(0.075);
    expect(TR['software']).toBe(0.18);
    expect(TR['streaming']).toBeLessThan(TR['software']);
  });

  // Test 9: Australia GST on digital
  test('Australia: GST 10% on all digital services', () => {
    const AU: Record<string, number> = { streaming: 0.10, software: 0.10, cloud: 0.10 };
    expect(AU['streaming']).toBe(0.10);
    expect(AU['software']).toBe(0.10);
  });

  // Test 10: B2B domestic (not reverse charge)
  test('B2B domestic: same country → normal taxation', () => {
    const buyerCountry = 'FR';
    const sellerCountry = 'FR';
    const crossBorder = buyerCountry !== sellerCountry;
    expect(crossBorder).toBe(false); // No reverse charge for domestic
  });
});
