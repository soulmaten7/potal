'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)' };

const PERIODS = ['7d', '30d', '90d'] as const;

const DEMO_DAILY = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(5, 10),
  calls: Math.floor(Math.random() * 800 + 200),
  errors: Math.floor(Math.random() * 15),
}));

const DEMO_ENDPOINTS = [
  { endpoint: '/api/v1/calculate', calls: 12450, avgMs: 145, errorRate: 0.2 },
  { endpoint: '/api/v1/classify', calls: 8320, avgMs: 210, errorRate: 0.5 },
  { endpoint: '/api/v1/screening', calls: 5180, avgMs: 320, errorRate: 0.1 },
  { endpoint: '/api/v1/restrictions', calls: 3240, avgMs: 180, errorRate: 0.3 },
  { endpoint: '/api/v1/fta', calls: 2150, avgMs: 95, errorRate: 0.1 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('30d');
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const data = DEMO_DAILY.slice(-days);
  const totalCalls = data.reduce((s, d) => s + d.calls, 0);
  const totalErrors = data.reduce((s, d) => s + d.errors, 0);
  const maxCalls = Math.max(...data.map(d => d.calls));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>ANALYTICS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Usage Analytics</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: period === p ? accent : 'rgba(255,255,255,0.08)', color: period === p ? 'white' : 'rgba(255,255,255,0.5)' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total API Calls', value: totalCalls.toLocaleString(), color: accent },
            { label: 'Avg Response Time', value: '168ms', color: '#4ade80' },
            { label: 'Error Rate', value: `${((totalErrors / totalCalls) * 100).toFixed(2)}%`, color: totalErrors / totalCalls < 0.01 ? '#4ade80' : '#facc15' },
            { label: 'Uptime', value: '99.97%', color: '#4ade80' },
          ].map((m, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Daily API Calls</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {data.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: `${(d.calls / maxCalls) * 100}px`, background: accent, borderRadius: '3px 3px 0 0', minHeight: 2, opacity: 0.8 }} title={`${d.date}: ${d.calls} calls`} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </div>

        {/* Top endpoints table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Top Endpoints</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Endpoint', 'Calls', 'Avg Latency', 'Error Rate'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_ENDPOINTS.map((ep, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 20px', fontFamily: 'monospace', color: accent, fontSize: 12 }}>{ep.endpoint}</td>
                  <td style={{ padding: '10px 20px', color: 'rgba(255,255,255,0.8)' }}>{ep.calls.toLocaleString()}</td>
                  <td style={{ padding: '10px 20px', color: ep.avgMs < 200 ? '#4ade80' : '#facc15' }}>{ep.avgMs}ms</td>
                  <td style={{ padding: '10px 20px', color: ep.errorRate < 0.5 ? '#4ade80' : '#facc15' }}>{ep.errorRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
