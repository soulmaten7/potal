/**
 * F067: Cross-Border Returns Processing — Test Suite
 */

import { calculateReturnDrawback, generateReturnDocuments } from '@/app/lib/returns/cross-border-returns';

describe('F067: Return Drawback', () => {
  test('US drawback: 99% refund for defective item', () => {
    const result = calculateReturnDrawback({
      originalImport: { country: 'US', value: 500, dutiesPaid: 25, taxesPaid: 0, hsCode: '610910' },
      returnReason: 'defective',
      returnDestination: 'CN',
    });
    expect(result.eligible).toBe(true);
    expect(result.refundableDuty).toBe(24.75); // 25 * 0.99
    expect(result.reason).toContain('99%');
    expect(result.form).toContain('CBP');
    expect(result.process.length).toBeGreaterThan(0);
  });

  test('buyer_remorse → not eligible', () => {
    const result = calculateReturnDrawback({
      originalImport: { country: 'US', value: 500, dutiesPaid: 25, taxesPaid: 0 },
      returnReason: 'buyer_remorse',
      returnDestination: 'CN',
    });
    expect(result.eligible).toBe(false);
    expect(result.totalRefundable).toBe(0);
    expect(result.reason).toContain('buyer_remorse');
  });

  test('expired deadline → not eligible', () => {
    const result = calculateReturnDrawback({
      originalImport: {
        country: 'JP', value: 200, dutiesPaid: 10, taxesPaid: 20,
        importDate: '2020-01-01', // JP = 1 year limit → expired
      },
      returnReason: 'defective',
      returnDestination: 'CN',
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('expired');
    expect(result.totalRefundable).toBe(0);
  });

  test('within deadline → eligible', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6);
    const result = calculateReturnDrawback({
      originalImport: {
        country: 'US', value: 300, dutiesPaid: 15, taxesPaid: 30,
        importDate: recentDate.toISOString().split('T')[0],
      },
      returnReason: 'wrong_item',
      returnDestination: 'CN',
    });
    expect(result.eligible).toBe(true);
    expect(result.filingDeadline).toBeTruthy();
    expect(result.refundableDuty).toBeGreaterThan(0);
  });
});

describe('F067: Return Documents', () => {
  test('generates credit invoice + customs declaration', () => {
    const docs = generateReturnDocuments({
      originalImport: { country: 'US', value: 500, dutiesPaid: 25, taxesPaid: 0, hsCode: '610910', entryNumber: 'ENT-123' },
      returnReason: 'defective',
      returnDestination: 'CN',
    });
    expect(docs.commercialInvoice.type).toBe('Return Credit Invoice');
    expect(docs.returnAuthorization.returnId).toBeTruthy();
    expect(docs.returnAuthorization.reason).toBe('defective');
    expect(docs.customsDeclaration.hsCode).toBe('610910');
    expect(docs.customsDeclaration.entryType).toBe('returned_goods');
  });

  test('US return includes CBP Form 4455', () => {
    const docs = generateReturnDocuments({
      originalImport: { country: 'US', value: 100, dutiesPaid: 5, taxesPaid: 0 },
      returnReason: 'wrong_item',
      returnDestination: 'CN',
    });
    expect(docs.countrySpecific).not.toBeNull();
    expect(docs.countrySpecific!.form).toContain('4455');
  });

  test('unknown country → countrySpecific null', () => {
    const docs = generateReturnDocuments({
      originalImport: { country: 'ZZ', value: 100, dutiesPaid: 5, taxesPaid: 0 },
      returnReason: 'defective',
      returnDestination: 'CN',
    });
    expect(docs.countrySpecific).toBeNull();
  });
});
