/**
 * F091: API Usage Dashboard Tests
 */

describe('F091 API Usage Dashboard', () => {
  test('endpoint grouping and sorting', () => {
    const rows = [
      { endpoint: '/classify', status_code: 200 },
      { endpoint: '/calculate', status_code: 200 },
      { endpoint: '/classify', status_code: 200 },
      { endpoint: '/classify', status_code: 400 },
      { endpoint: '/calculate', status_code: 500 },
    ];

    const epMap = new Map<string, { count: number; errors: number }>();
    for (const r of rows) {
      const e = epMap.get(r.endpoint) || { count: 0, errors: 0 };
      e.count++;
      if (r.status_code >= 400) e.errors++;
      epMap.set(r.endpoint, e);
    }
    const sorted = [...epMap.entries()].sort((a, b) => b[1].count - a[1].count);

    expect(sorted[0][0]).toBe('/classify');
    expect(sorted[0][1].count).toBe(3);
    expect(sorted[0][1].errors).toBe(1);
    expect(sorted[1][0]).toBe('/calculate');
    expect(sorted[1][1].errors).toBe(1);
  });

  test('dailyTrend fills missing days with zeros', () => {
    const periodDays = 7;
    const dailyMap = new Map<string, number>();
    dailyMap.set('2026-03-23', 5);
    dailyMap.set('2026-03-25', 10);

    const trend = Array.from({ length: periodDays }, (_, d) => {
      const date = new Date(Date.now() - (periodDays - 1 - d) * 86400000).toISOString().split('T')[0];
      return { date, calls: dailyMap.get(date) || 0 };
    });

    expect(trend).toHaveLength(7);
    expect(trend.every(t => typeof t.calls === 'number')).toBe(true);
    // Most days should be 0 (only 2 have data)
    const zeroDays = trend.filter(t => t.calls === 0);
    expect(zeroDays.length).toBeGreaterThanOrEqual(5);
  });

  test('percentUsed calculation', () => {
    const LIMITS: Record<string, number> = { free: 200, basic: 2000, pro: 10000 };
    const total = 150;
    const plan = 'free';
    const pct = Math.round((total / LIMITS[plan]) * 100);
    expect(pct).toBe(75);

    const overPct = Math.round((250 / LIMITS['free']) * 100);
    expect(overPct).toBe(125); // Over limit
  });
});
