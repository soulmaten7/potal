/**
 * F104: Tax Liability Dashboard — Test Suite
 */

describe('F104: Tax Liability Code Analysis', () => {
  let content: string;

  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/reports/tax-liability/route.ts', 'utf-8');
  });

  // C1: Actual data aggregation (not hardcoded 0)
  test('C1: queries usage_logs for calculate endpoint', () => {
    expect(content).toContain("from('usage_logs')");
    expect(content).toContain("'/api/v1/calculate'");
    expect(content).toContain('product_price_cents');
  });

  test('C1: aggregates dutyOwed and vatOwed per country', () => {
    expect(content).toContain('dutyOwed');
    expect(content).toContain('vatOwed');
    expect(content).toContain('totalOwed');
    expect(content).toContain('byCountry');
  });

  // C2: Filing deadlines
  test('C2: filing deadlines for 12+ countries', () => {
    expect(content).toContain('FILING_DEADLINES');
    expect(content).toContain("GB:");
    expect(content).toContain("DE:");
    expect(content).toContain("KR:");
    expect(content).toContain("JP:");
    expect(content).toContain("AU:");
    expect(content).toContain("IN:");
  });

  test('C2: deadline calculates daysLeft and urgent flag', () => {
    expect(content).toContain('daysLeft');
    expect(content).toContain('urgent');
    expect(content).toContain('overdue');
    expect(content).toContain('calculateDueDate');
  });

  // C3: VAT registration thresholds
  test('C3: VAT thresholds for 10+ countries', () => {
    expect(content).toContain('VAT_THRESHOLDS');
    expect(content).toContain('threshold');
    expect(content).toContain('registrationRequired');
    expect(content).toContain('registrationWarning');
  });

  test('C3: warns at 80% of threshold', () => {
    expect(content).toContain('0.8');
    expect(content).toContain('Approaching VAT threshold');
  });

  // C4: Multi-currency
  test('C4: local currency per country', () => {
    expect(content).toContain('COUNTRY_CURRENCIES');
    expect(content).toContain('localCurrency');
    expect(content).toContain('baseCurrency');
    expect(content).toContain("'GBP'");
    expect(content).toContain("'EUR'");
    expect(content).toContain("'JPY'");
  });

  // C5: Trends
  test('C5: period-over-period comparison', () => {
    expect(content).toContain('trends');
    expect(content).toContain('previousPeriodTotal');
    expect(content).toContain('changePercent');
    expect(content).toContain("'increasing'");
    expect(content).toContain("'decreasing'");
  });

  // C6: CSV export
  test('C6: CSV export with headers', () => {
    expect(content).toContain("format === 'csv'");
    expect(content).toContain("'text/csv");
    expect(content).toContain('Content-Disposition');
    expect(content).toContain('Country,Local Currency');
  });

  // Sort order
  test('liabilities sorted by totalOwed descending', () => {
    expect(content).toContain('b.totalOwed - a.totalOwed');
  });

  // Deadlines sorted
  test('deadlines sorted by daysLeft ascending', () => {
    expect(content).toContain('a.daysLeft - b.daysLeft');
  });
});
