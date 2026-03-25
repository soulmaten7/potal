/**
 * F098-F102: Advanced Analytics Tests
 */
import { formatAsLineChart, formatAsBarChart, formatAsPieChart } from '../app/lib/analytics/chart-formatter';
import { convertToCSV } from '../app/lib/analytics/export-formatter';

describe('F098-F102 Advanced Analytics', () => {
  test('line chart format with meta', () => {
    const chart = formatAsLineChart([
      { date: '2026-03-20', value: 100 },
      { date: '2026-03-21', value: 150 },
      { date: '2026-03-22', value: 200 },
    ], '$');
    expect(chart.type).toBe('line');
    expect(chart.data).toHaveLength(3);
    expect(chart.data[0].x).toBe('2026-03-20');
    expect(chart.data[0].y).toBe(100);
    expect(chart.yAxis.prefix).toBe('$');
    expect(chart.meta?.total).toBe(450);
    expect(chart.meta?.average).toBe(150);
    expect(chart.meta?.period).toContain('2026-03-20');
  });

  test('bar chart categories sorted by input', () => {
    const chart = formatAsBarChart([
      { name: '/classify', value: 300 },
      { name: '/calculate', value: 200 },
      { name: '/validate', value: 50 },
    ]);
    expect(chart.type).toBe('bar');
    expect(chart.data).toHaveLength(3);
    expect(chart.data[0].label).toBe('/classify');
    expect(chart.xAxis.type).toBe('category');
  });

  test('CSV conversion with escaping', () => {
    const csv = convertToCSV([
      { name: 'Cotton T-Shirt', price: 29.99, note: 'includes "quotes"' },
      { name: 'Wool, Cashmere Blend', price: 89.99, note: 'premium' },
    ]);
    expect(csv).toContain('name,price,note');
    expect(csv).toContain('"includes ""quotes"""'); // Escaped quotes
    expect(csv).toContain('"Wool, Cashmere Blend"'); // Escaped comma
  });

  test('pie chart percentage labels', () => {
    const chart = formatAsPieChart([
      { name: 'US', value: 500 },
      { name: 'EU', value: 300 },
      { name: 'Other', value: 200 },
    ]);
    expect(chart.type).toBe('pie');
    expect(chart.data[0].label).toBe('50%');
    expect(chart.data[1].label).toBe('30%');
    expect(chart.data[2].label).toBe('20%');
    expect(chart.meta?.total).toBe(1000);
  });
});
