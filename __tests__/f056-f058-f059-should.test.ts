/**
 * F056 + F058 + F059 SHOULD Features Tests
 */
import { getRequiredLicenses } from '../app/lib/compliance/import-license';
import { calculatePrepayment } from '../app/lib/payment/duty-prepayment';
import { createCollectionRecord, calculateOverdueInterest, summarizeCollections } from '../app/lib/payment/duty-collection';

// ─── F056: Import License ────────────────────────────

describe('F056 Import License', () => {
  test('US food (HS 04) → FDA required', () => {
    const result = getRequiredLicenses('US', '0401');
    expect(result.licenses.some(l => l.authority === 'FDA')).toBe(true);
    expect(result.mandatoryCount).toBeGreaterThan(0);
  });

  test('US electronics (HS 85) → FCC required', () => {
    const result = getRequiredLicenses('US', '8541');
    expect(result.licenses.some(l => l.authority === 'FCC')).toBe(true);
  });

  test('US arms (HS 93) → ATF required', () => {
    const result = getRequiredLicenses('US', '9301');
    expect(result.licenses.some(l => l.authority === 'ATF')).toBe(true);
  });

  test('EU electronics (DE) → CE Marking required', () => {
    const result = getRequiredLicenses('DE', '8541');
    expect(result.licenses.some(l => l.licenseType === 'CE Marking')).toBe(true);
  });

  test('no license for standard textile (HS 61) to US', () => {
    const result = getRequiredLicenses('US', '6109');
    expect(result.totalRequired).toBe(0);
  });
});

// ─── F058: Duty Pre-payment ──────────────────────────

describe('F058 Duty Pre-payment', () => {
  test('basic prepayment calculation', () => {
    const result = calculatePrepayment({ declaredValue: 1000, dutyRate: 0.10, taxRate: 0.20 });
    expect(result.dutyAmount).toBe(100);
    expect(result.taxAmount).toBe(220); // (1000 + 100) * 0.20
    expect(result.totalPrepayment).toBeGreaterThan(result.subtotal); // buffer added
    expect(result.bufferPercentage).toBe(3);
  });

  test('prepayment includes processing fee', () => {
    const result = calculatePrepayment({ declaredValue: 100, dutyRate: 0, taxRate: 0 });
    expect(result.processingFee).toBe(5);
    expect(result.totalPrepayment).toBeGreaterThan(0);
  });

  test('negative value throws error', () => {
    expect(() => calculatePrepayment({ declaredValue: -100, dutyRate: 0.10, taxRate: 0.10 }))
      .toThrow('declaredValue must be positive');
  });

  test('validity is 24 hours', () => {
    const result = calculatePrepayment({ declaredValue: 100, dutyRate: 0.05, taxRate: 0.10 });
    const validUntil = new Date(result.validUntil);
    const hoursFromNow = (validUntil.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(hoursFromNow).toBeCloseTo(24, 0);
  });

  test('exchange rate buffer is 3%', () => {
    const result = calculatePrepayment({ declaredValue: 1000, dutyRate: 0.10, taxRate: 0.10 });
    expect(result.exchangeRateBuffer).toBeCloseTo(result.subtotal * 0.03, 1);
  });
});

// ─── F059: Duty Collection ───────────────────────────

describe('F059 Duty Collection', () => {
  test('create collection record', () => {
    const record = createCollectionRecord({
      shipmentId: 'SHIP-001', sellerId: 'seller-1', buyerCountry: 'US',
      dutyAmount: 50, taxAmount: 30,
    });
    expect(record.id).toMatch(/^COL-/);
    expect(record.totalOwed).toBe(80);
    expect(record.status).toBe('pending');
    expect(record.overdueInterestRate).toBe(0.06); // US rate
  });

  test('overdue interest calculation', () => {
    const record = createCollectionRecord({
      shipmentId: 'SHIP-002', sellerId: 'seller-1', buyerCountry: 'US',
      dutyAmount: 1000, taxAmount: 0,
    });
    // Make it overdue by setting dueDate in the past
    record.dueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const interest = calculateOverdueInterest(record);
    expect(interest).toBeGreaterThan(0);
    // 1000 * 0.06/365 * 30 ≈ 4.93
    expect(interest).toBeCloseTo(4.93, 0);
  });

  test('paid record has zero interest', () => {
    const record = createCollectionRecord({
      shipmentId: 'SHIP-003', sellerId: 'seller-1', buyerCountry: 'GB',
      dutyAmount: 100, taxAmount: 50,
    });
    record.status = 'paid';
    expect(calculateOverdueInterest(record)).toBe(0);
  });

  test('summary aggregation', () => {
    const records = [
      { ...createCollectionRecord({ shipmentId: '1', sellerId: 's', buyerCountry: 'US', dutyAmount: 100, taxAmount: 0 }), status: 'pending' as const },
      { ...createCollectionRecord({ shipmentId: '2', sellerId: 's', buyerCountry: 'GB', dutyAmount: 200, taxAmount: 0 }), status: 'overdue' as const },
      { ...createCollectionRecord({ shipmentId: '3', sellerId: 's', buyerCountry: 'US', dutyAmount: 50, taxAmount: 0 }), status: 'paid' as const },
    ];
    const summary = summarizeCollections(records);
    expect(summary.totalOutstanding).toBe(300); // 100 + 200
    expect(summary.totalPaid).toBe(50);
    expect(summary.totalOverdue).toBe(200);
    expect(summary.byCountry['US']).toBe(100);
    expect(summary.byCountry['GB']).toBe(200);
  });

  test('negative amounts rejected', () => {
    expect(() => createCollectionRecord({
      shipmentId: '1', sellerId: 's', buyerCountry: 'US',
      dutyAmount: -10, taxAmount: 0,
    })).toThrow('non-negative');
  });
});
