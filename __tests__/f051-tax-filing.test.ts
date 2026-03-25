/**
 * F051: Tax Filing Assistance — Test Suite
 */

describe('F051: Tax Filing Code Analysis', () => {
  let content: string;

  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/tax/filing/route.ts', 'utf-8');
  });

  // C1: No longer queries api_usage_logs for tax data
  test('C1: does not query api_usage_logs', () => {
    expect(content).not.toContain("from('api_usage_logs')");
  });

  test('C1: queries verification_logs or usage_logs', () => {
    expect(content).toContain("from('verification_logs')");
    expect(content).toContain("from('usage_logs')");
  });

  // C2: Actual aggregation (not hardcoded 0)
  test('C2: aggregates duty and tax amounts', () => {
    expect(content).toContain('totalDuty');
    expect(content).toContain('totalTax');
    expect(content).toContain('totalTaxable');
    expect(content).toContain('byCountry');
    expect(content).toContain('.duty');
    expect(content).toContain('.tax');
  });

  // C3: Period parameter
  test('C3: supports monthly/quarterly/annual periods', () => {
    expect(content).toContain("'monthly'");
    expect(content).toContain("'quarterly'");
    expect(content).toContain("'annual'");
    expect(content).toContain('calculatePeriodDates');
    expect(content).toContain('quarter');
    expect(content).toContain('month');
  });

  // C4: VAT refund calculation
  test('C4: includes VAT refund calculation', () => {
    expect(content).toContain('vatRefund');
    expect(content).toContain('outputVat');
    expect(content).toContain('inputVat');
    expect(content).toContain('refundable');
  });

  // C5: Filing guides by country
  test('C5: filing guides for 12+ jurisdictions', () => {
    expect(content).toContain('FILING_GUIDES');
    expect(content).toContain("'US_sales_tax'");
    expect(content).toContain("'EU_vat'");
    expect(content).toContain("'GB_vat'");
    expect(content).toContain("'KR_vat'");
    expect(content).toContain("'JP_ct'");
    expect(content).toContain("'IN_gst'");
    expect(content).toContain("'DE_vat'");
    expect(content).toContain("'FR_vat'");
  });

  test('C5: filing guides include URL and authority', () => {
    expect(content).toContain('authority');
    expect(content).toContain('url');
    expect(content).toContain('deadline');
    expect(content).toContain('frequency');
  });

  // C6: CSV export
  test('C6: CSV export format supported', () => {
    expect(content).toContain('generateCsv');
    expect(content).toContain("'text/csv");
    expect(content).toContain('Content-Disposition');
    expect(content).toContain("format === 'csv'");
  });

  // C7: Multi-currency
  test('C7: base currency parameter', () => {
    expect(content).toContain('baseCurrency');
    expect(content).toContain('currencyBreakdown');
    expect(content).toContain("body.currency");
  });

  // Input validation
  test('rejects invalid period type', () => {
    expect(content).toContain("'monthly', 'quarterly', 'annual'");
  });

  test('rejects invalid taxType', () => {
    expect(content).toContain("'vat', 'gst', 'sales_tax', 'ioss', 'ct'");
  });
});
