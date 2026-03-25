/**
 * F106: Compliance Calendar — Test Suite
 */

describe('F106: Compliance Calendar', () => {
  let content: string;

  beforeAll(async () => {
    const fs = await import('fs');
    content = fs.readFileSync('app/api/v1/compliance/calendar/route.ts', 'utf-8');
  });

  test('country filter supported', () => {
    expect(content).toContain("params.get('country')");
    expect(content).toContain('e.country === country');
    expect(content).toContain("e.country === 'GLOBAL'");
  });

  test('date range filtering (from/to)', () => {
    expect(content).toContain("params.get('from')");
    expect(content).toContain("params.get('to')");
    expect(content).toContain('e.date >= from');
    expect(content).toContain('e.date <= to');
  });

  test('critical events for CBAM and HS 2027', () => {
    expect(content).toContain('CBAM');
    expect(content).toContain("impact: 'critical'");
    expect(content).toContain('HS 2027');
    expect(content).toContain('OECD Pillar Two');
  });

  test('10+ countries covered', () => {
    const countries = ['US', 'EU', 'GB', 'AU', 'JP', 'KR', 'CA', 'DE', 'IN', 'GLOBAL'];
    for (const c of countries) {
      expect(content).toContain(`country: '${c}'`);
    }
  });

  test('upcoming and overdue sections', () => {
    expect(content).toContain('upcoming');
    expect(content).toContain('overdue');
    expect(content).toContain('sevenDaysLater');
  });

  test('no as any', () => {
    expect(content).not.toContain(': any');
  });
});
