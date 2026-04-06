'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };

interface RateChange { country: string; flag: string; hsCode: string; description: string; oldRate: number; newRate: number; effectiveDate: string; alertEnabled: boolean }

const DEMO: RateChange[] = [
  { country: 'US', flag: '\u{1F1FA}\u{1F1F8}', hsCode: '8471.30', description: 'Laptops (portable)', oldRate: 0, newRate: 0, effectiveDate: '2026-01-01', alertEnabled: true },
  { country: 'EU', flag: '\u{1F1EA}\u{1F1FA}', hsCode: '6109.10', description: 'Cotton T-shirts', oldRate: 12.0, newRate: 12.5, effectiveDate: '2026-04-01', alertEnabled: true },
  { country: 'US', flag: '\u{1F1FA}\u{1F1F8}', hsCode: '7604.29', description: 'Aluminum bars (alloy)', oldRate: 5.0, newRate: 30.0, effectiveDate: '2025-03-12', alertEnabled: false },
  { country: 'GB', flag: '\u{1F1EC}\u{1F1E7}', hsCode: '0406.10', description: 'Fresh cheese', oldRate: 7.7, newRate: 7.7, effectiveDate: '2026-01-01', alertEnabled: false },
  { country: 'JP', flag: '\u{1F1EF}\u{1F1F5}', hsCode: '2204.21', description: 'Wine (< 2L)', oldRate: 15.0, newRate: 12.8, effectiveDate: '2026-04-01', alertEnabled: true },
  { country: 'KR', flag: '\u{1F1F0}\u{1F1F7}', hsCode: '8703.23', description: 'Motor vehicles (1500-3000cc)', oldRate: 8.0, newRate: 8.0, effectiveDate: '2026-01-01', alertEnabled: false },
  { country: 'AU', flag: '\u{1F1E6}\u{1F1FA}', hsCode: '2402.20', description: 'Cigarettes', oldRate: 5.0, newRate: 5.0, effectiveDate: '2026-01-01', alertEnabled: false },
  { country: 'CA', flag: '\u{1F1E8}\u{1F1E6}', hsCode: '9403.60', description: 'Wooden furniture', oldRate: 9.5, newRate: 8.0, effectiveDate: '2026-01-01', alertEnabled: true },
];

export default function RateMonitorPage() {
  const [rates, setRates] = useState(DEMO);
  const [filter, setFilter] = useState<'all' | 'increased' | 'decreased' | 'unchanged'>('all');

  const toggleAlert = (i: number) => setRates(prev => prev.map((r, idx) => idx === i ? { ...r, alertEnabled: !r.alertEnabled } : r));

  const getChange = (r: RateChange) => {
    if (r.newRate > r.oldRate) return 'increased';
    if (r.newRate < r.oldRate) return 'decreased';
    return 'unchanged';
  };

  const filtered = rates.filter(r => filter === 'all' || getChange(r) === filter);

  const changeColor: Record<string, string> = { increased: '#f87171', decreased: '#4ade80', unchanged: '#94a3b8' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MONITORING</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Rate Change Monitor</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontSize: 15 }}>Track duty rate changes across countries. Set alerts for products you care about.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Increased', count: rates.filter(r => r.newRate > r.oldRate).length, color: '#f87171' },
            { label: 'Decreased', count: rates.filter(r => r.newRate < r.oldRate).length, color: '#4ade80' },
            { label: 'Unchanged', count: rates.filter(r => r.newRate === r.oldRate).length, color: '#94a3b8' },
          ].map((m, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.count}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['all', 'increased', 'decreased', 'unchanged'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? accent : 'rgba(255,255,255,0.08)', color: filter === f ? 'white' : 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>

        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Country', 'HS Code', 'Product', 'Old Rate', 'New Rate', 'Change', 'Effective', 'Alert'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const change = getChange(r);
                const diff = r.newRate - r.oldRate;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px' }}>{r.flag} {r.country}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: accent, fontSize: 12 }}>{r.hsCode}</td>
                    <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.7)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                    <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.5)' }}>{r.oldRate}%</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: changeColor[change] }}>{r.newRate}%</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${changeColor[change]}20`, color: changeColor[change] }}>
                        {change === 'increased' ? `+${diff.toFixed(1)}%` : change === 'decreased' ? `${diff.toFixed(1)}%` : '0%'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{r.effectiveDate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => toggleAlert(rates.indexOf(r))} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: r.alertEnabled ? 'rgba(232,100,10,0.2)' : 'rgba(255,255,255,0.05)', color: r.alertEnabled ? accent : 'rgba(255,255,255,0.3)' }}>
                        {r.alertEnabled ? 'ON' : 'OFF'}
                      </button>
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
