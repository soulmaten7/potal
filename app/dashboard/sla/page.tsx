'use client';

import React from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };

const MONTHLY_SLA = [
  { month: 'Mar 2026', uptime: 99.98, avgMs: 142, p99Ms: 890, errorRate: 0.08, status: 'met' },
  { month: 'Feb 2026', uptime: 99.97, avgMs: 155, p99Ms: 920, errorRate: 0.12, status: 'met' },
  { month: 'Jan 2026', uptime: 99.95, avgMs: 168, p99Ms: 1050, errorRate: 0.15, status: 'met' },
  { month: 'Dec 2025', uptime: 99.91, avgMs: 175, p99Ms: 1120, errorRate: 0.22, status: 'warning' },
  { month: 'Nov 2025', uptime: 99.99, avgMs: 138, p99Ms: 780, errorRate: 0.05, status: 'met' },
  { month: 'Oct 2025', uptime: 99.96, avgMs: 148, p99Ms: 850, errorRate: 0.10, status: 'met' },
];

const SLA_TARGETS = { uptime: 99.9, avgMs: 500, p99Ms: 2000, errorRate: 1.0 };

function statusColor(met: boolean): string { return met ? '#4ade80' : '#f87171'; }

export default function SlaPage() {
  const current = MONTHLY_SLA[0];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MONITORING</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>SLA Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontSize: 15 }}>Service Level Agreement metrics. Target: 99.9% uptime, &lt;500ms avg response.</p>

        {/* Current SLA metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Uptime', value: `${current.uptime}%`, target: SLA_TARGETS.uptime, met: current.uptime >= SLA_TARGETS.uptime },
            { label: 'Avg Response', value: `${current.avgMs}ms`, target: SLA_TARGETS.avgMs, met: current.avgMs <= SLA_TARGETS.avgMs },
            { label: 'P99 Latency', value: `${current.p99Ms}ms`, target: SLA_TARGETS.p99Ms, met: current.p99Ms <= SLA_TARGETS.p99Ms },
            { label: 'Error Rate', value: `${current.errorRate}%`, target: SLA_TARGETS.errorRate, met: current.errorRate <= SLA_TARGETS.errorRate },
          ].map((m, i) => (
            <div key={i} style={{ ...cardStyle, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 10, right: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: statusColor(m.met) }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: statusColor(m.met), marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Target: {typeof m.target === 'number' && m.label.includes('Uptime') ? `${m.target}%` : m.label.includes('Rate') ? `<${m.target}%` : `<${m.target}ms`}</div>
            </div>
          ))}
        </div>

        {/* Uptime bar visualization */}
        <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>6-Month Uptime</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {MONTHLY_SLA.slice().reverse().map((m, i) => {
              const barHeight = Math.max(4, ((m.uptime - 99) / 1) * 100);
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: m.uptime >= 99.95 ? '#4ade80' : '#facc15', marginBottom: 4 }}>{m.uptime}%</div>
                  <div style={{ height: barHeight, background: m.uptime >= 99.95 ? '#4ade80' : '#facc15', borderRadius: '4px 4px 0 0', opacity: 0.7 }} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{m.month.slice(0, 3)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly SLA table */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Monthly SLA Report</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Month', 'Uptime', 'Avg Response', 'P99 Latency', 'Error Rate', 'SLA Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_SLA.map((m, i) => {
                const met = m.uptime >= SLA_TARGETS.uptime && m.errorRate <= SLA_TARGETS.errorRate;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{m.month}</td>
                    <td style={{ padding: '10px 16px', color: m.uptime >= 99.95 ? '#4ade80' : '#facc15' }}>{m.uptime}%</td>
                    <td style={{ padding: '10px 16px', color: m.avgMs <= 200 ? '#4ade80' : '#facc15' }}>{m.avgMs}ms</td>
                    <td style={{ padding: '10px 16px', color: m.p99Ms <= 1000 ? '#4ade80' : '#facc15' }}>{m.p99Ms}ms</td>
                    <td style={{ padding: '10px 16px', color: m.errorRate <= 0.1 ? '#4ade80' : '#facc15' }}>{m.errorRate}%</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: met ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: met ? '#4ade80' : '#facc15' }}>{met ? 'MET' : 'WARNING'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
