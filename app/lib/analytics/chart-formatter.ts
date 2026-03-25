/**
 * Chart data formatter — Recharts-compatible output for all analytics endpoints.
 */

export interface ChartResponse {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{ x: string; y: number; label?: string }>;
  xAxis: { type: 'date' | 'category'; format?: string };
  yAxis: { type: 'number'; prefix?: string; suffix?: string };
  meta?: { total: number; average: number; period: string };
}

export function formatAsLineChart(
  dataPoints: Array<{ date: string; value: number }>,
  yPrefix?: string,
): ChartResponse {
  const total = dataPoints.reduce((s, d) => s + d.value, 0);
  return {
    type: 'line',
    data: dataPoints.map(d => ({ x: d.date, y: d.value })),
    xAxis: { type: 'date', format: 'MMM DD' },
    yAxis: { type: 'number', prefix: yPrefix },
    meta: {
      total,
      average: dataPoints.length > 0 ? Math.round(total / dataPoints.length) : 0,
      period: dataPoints.length > 0
        ? `${dataPoints[0].date} ~ ${dataPoints[dataPoints.length - 1].date}`
        : '',
    },
  };
}

export function formatAsBarChart(
  categories: Array<{ name: string; value: number }>,
): ChartResponse {
  return {
    type: 'bar',
    data: categories.map(c => ({ x: c.name, y: c.value, label: c.name })),
    xAxis: { type: 'category' },
    yAxis: { type: 'number' },
  };
}

export function formatAsPieChart(
  segments: Array<{ name: string; value: number }>,
): ChartResponse {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return {
    type: 'pie',
    data: segments.map(s => ({
      x: s.name,
      y: s.value,
      label: total > 0 ? `${Math.round((s.value / total) * 100)}%` : '0%',
    })),
    xAxis: { type: 'category' },
    yAxis: { type: 'number' },
    meta: { total, average: segments.length > 0 ? Math.round(total / segments.length) : 0, period: '' },
  };
}
