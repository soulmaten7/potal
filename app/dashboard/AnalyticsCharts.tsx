'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

interface TimeSeriesPoint {
  time: string;
  requests: number;
  errors: number;
}

interface EndpointData {
  name: string;
  value: number;
}

interface ResponseTimeBucket {
  name: string;
  count: number;
}

interface ErrorRatePoint {
  time: string;
  rate: number;
}

interface MonthlyData {
  used: number;
  limit: number;
  projected: number;
  usagePercent: number;
  daysUntilLimit: number;
  dayOfMonth: number;
  daysInMonth: number;
}

interface AnalyticsData {
  timeSeries: TimeSeriesPoint[];
  endpointDistribution: EndpointData[];
  responseTimeDistribution: ResponseTimeBucket[];
  errorRate: ErrorRatePoint[];
  monthly: MonthlyData;
}

type TimeRange = '1h' | '24h' | '7d' | '30d';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#94a3b8'];

const RANGE_LABELS: Record<TimeRange, string> = {
  '1h': '1 Hour',
  '24h': '24 Hours',
  '7d': '7 Days',
  '30d': '30 Days',
};

interface Props {
  accessToken: string;
}

export default function AnalyticsCharts({ accessToken }: Props) {
  const [range, setRange] = useState<TimeRange>('24h');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async (r: TimeRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/analytics?range=${r}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => {
    loadAnalytics(range);
  }, [range, loadAnalytics]);

  const card: React.CSSProperties = {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #e5e7eb',
  };

  const monthly = data?.monthly;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>API Analytics</h2>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: range === r ? '#02122c' : 'transparent',
                color: range === r ? 'white' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Usage Projection */}
      {monthly && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#02122c' }}>Monthly Usage</span>
              <span style={{ fontSize: 13, color: '#888', marginLeft: 12 }}>
                {monthly.used.toLocaleString()} / {monthly.limit.toLocaleString()} calls ({monthly.usagePercent}%)
              </span>
            </div>
            <span style={{ fontSize: 12, color: monthly.usagePercent > 80 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
              Projected: {monthly.projected.toLocaleString()} this month
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(monthly.usagePercent, 100)}%`,
              background: monthly.usagePercent > 90 ? '#dc2626' : monthly.usagePercent > 70 ? '#d97706' : '#16a34a',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            {monthly.usagePercent >= 100
              ? 'Limit reached. Overage billing applies.'
              : `At current rate, you'll reach your limit in ~${monthly.daysUntilLimit} days.`}
          </p>
        </div>
      )}

      {loading && !data ? (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#999', fontSize: 14 }}>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Requests', value: data?.timeSeries.reduce((s, p) => s + p.requests, 0).toLocaleString() || '0', color: '#2563eb' },
              { label: 'Total Errors', value: data?.timeSeries.reduce((s, p) => s + p.errors, 0).toLocaleString() || '0', color: '#dc2626' },
              { label: 'Avg Error Rate', value: (() => { const pts = data?.errorRate.filter(p => p.rate > 0) || []; return pts.length > 0 ? `${(pts.reduce((s, p) => s + p.rate, 0) / pts.length).toFixed(1)}%` : '0%'; })(), color: '#d97706' },
              { label: 'Endpoints Hit', value: data?.endpointDistribution.length.toString() || '0', color: '#16a34a' },
            ].map((stat, i) => (
              <div key={i} style={card}>
                <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Requests Over Time — Line Chart */}
            <div style={card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>Requests Over Time</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data?.timeSeries || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" fontSize={10} tick={{ fill: '#888' }} />
                  <YAxis fontSize={10} tick={{ fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} dot={false} name="Requests" />
                  <Line type="monotone" dataKey="errors" stroke="#dc2626" strokeWidth={2} dot={false} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Endpoint Distribution — Pie Chart */}
            <div style={card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>Endpoint Distribution</h4>
              {(data?.endpointDistribution.length || 0) === 0 ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#999', fontSize: 13 }}>No data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={data?.endpointDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      nameKey="name"
                      label={(props: PieLabelRenderProps) => `${props.name || ''} (${(((props.percent as number) ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {(data?.endpointDistribution || []).map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Response Time Distribution — Bar Chart */}
            <div style={card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>Response Time Distribution</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.responseTimeDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#888' }} />
                  <YAxis fontSize={10} tick={{ fill: '#888' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Error Rate — Line Chart */}
            <div style={card}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>Error Rate (%)</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data?.errorRate || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" fontSize={10} tick={{ fill: '#888' }} />
                  <YAxis fontSize={10} tick={{ fill: '#888' }} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value) => [`${value}%`, 'Error Rate']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#dc2626" strokeWidth={2} dot={false} fill="#fecaca" name="Error Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
