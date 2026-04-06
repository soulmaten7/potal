'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

type ChartType = 'bar' | 'line' | 'pie';
type DataSource = 'classifications' | 'calculations' | 'screenings';

const BAR_DATA: Record<DataSource, { label: string; value: number; color: string }[]> = {
  classifications: [
    { label: 'US', value: 84, color: '#60a5fa' }, { label: 'DE', value: 71, color: '#4ade80' },
    { label: 'CN', value: 68, color: '#f87171' }, { label: 'JP', value: 57, color: '#facc15' },
    { label: 'GB', value: 52, color: '#c084fc' }, { label: 'AU', value: 44, color: '#34d399' },
    { label: 'KR', value: 38, color: '#fb923c' }, { label: 'FR', value: 31, color: '#38bdf8' },
  ],
  calculations: [
    { label: 'US', value: 92, color: '#60a5fa' }, { label: 'DE', value: 78, color: '#4ade80' },
    { label: 'GB', value: 65, color: '#c084fc' }, { label: 'CN', value: 59, color: '#f87171' },
    { label: 'AU', value: 48, color: '#34d399' }, { label: 'JP', value: 43, color: '#facc15' },
    { label: 'CA', value: 37, color: '#fb923c' }, { label: 'NL', value: 29, color: '#38bdf8' },
  ],
  screenings: [
    { label: 'US', value: 67, color: '#60a5fa' }, { label: 'RU', value: 58, color: '#f87171' },
    { label: 'CN', value: 52, color: '#facc15' }, { label: 'IR', value: 44, color: '#ef4444' },
    { label: 'DE', value: 38, color: '#4ade80' }, { label: 'KP', value: 33, color: '#f97316' },
    { label: 'GB', value: 28, color: '#c084fc' }, { label: 'SY', value: 21, color: '#fb923c' },
  ],
};

const LINE_DATA: Record<DataSource, number[]> = {
  classifications: [1240, 1580, 1320, 1890, 2100, 1750, 2340, 2680, 2190, 2870, 3120, 3450],
  calculations:    [890, 1020, 980, 1340, 1560, 1280, 1670, 1920, 1740, 2130, 2380, 2640],
  screenings:      [430, 520, 490, 610, 720, 650, 780, 860, 810, 940, 1020, 1150],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_DATA: Record<DataSource, { label: string; value: number; color: string }[]> = {
  classifications: [
    { label: 'Electronics', value: 32, color: '#60a5fa' },
    { label: 'Machinery', value: 24, color: '#4ade80' },
    { label: 'Chemicals', value: 16, color: '#facc15' },
    { label: 'Textiles', value: 14, color: accent },
    { label: 'Food', value: 9, color: '#c084fc' },
    { label: 'Other', value: 5, color: '#94a3b8' },
  ],
  calculations: [
    { label: 'Landed Cost', value: 38, color: '#60a5fa' },
    { label: 'DDP/DDU', value: 27, color: '#4ade80' },
    { label: 'VAT/GST', value: 18, color: '#facc15' },
    { label: 'Duty Rate', value: 12, color: accent },
    { label: 'Other', value: 5, color: '#94a3b8' },
  ],
  screenings: [
    { label: 'Clear', value: 71, color: '#4ade80' },
    { label: 'Low Risk', value: 16, color: '#facc15' },
    { label: 'Medium Risk', value: 8, color: '#fb923c' },
    { label: 'High Risk', value: 5, color: '#f87171' },
  ],
};

function BarChart({ data }: { data: typeof BAR_DATA.classifications }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, padding: '0 8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{d.value}</span>
          <div style={{ width: '100%', height: `${(d.value / max) * 140}px`, background: d.color, borderRadius: '4px 4px 0 0', transition: 'height 0.4s ease', opacity: 0.85 }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 520, H = 160, PAD = 16;
  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + ((max - v) / range) * (H - PAD * 2),
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1].x},${H - PAD} L${pts[0].x},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 180 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD} y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={accent} stroke={bg} strokeWidth="2" />
      ))}
      {MONTHS.map((m, i) => (
        <text key={i} x={PAD + (i / (data.length - 1)) * (W - PAD * 2)} y={H - 2}
          textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">{m}</text>
      ))}
    </svg>
  );
}

function PieChart({ data }: { data: typeof PIE_DATA.classifications }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -90;
  const R = 70, CX = 90, CY = 90;
  const slices = data.map(d => {
    const start = angle;
    const sweep = (d.value / total) * 360;
    angle += sweep;
    return { ...d, start, sweep };
  });
  const toXY = (deg: number, r: number) => ({
    x: CX + r * Math.cos((deg * Math.PI) / 180),
    y: CY + r * Math.sin((deg * Math.PI) / 180),
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg viewBox="0 0 180 180" style={{ width: 180, height: 180, flexShrink: 0 }}>
        {slices.map((s, i) => {
          const p1 = toXY(s.start, R);
          const p2 = toXY(s.start + s.sweep, R);
          const large = s.sweep > 180 ? 1 : 0;
          return (
            <path key={i}
              d={`M${CX},${CY} L${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${R},${R} 0 ${large},1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z`}
              fill={s.color} opacity="0.85" stroke={bg} strokeWidth="2" />
          );
        })}
        <circle cx={CX} cy={CY} r={R * 0.52} fill={bg} />
        <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{total.toLocaleString()}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">TOTAL</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 'auto', paddingLeft: 8 }}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VisualizationPage() {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dataSource, setDataSource] = useState<DataSource>('classifications');

  const title: Record<DataSource, string> = {
    classifications: 'Classifications by Country',
    calculations: 'Calculations by Country',
    screenings: 'Screenings by Country',
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>ANALYTICS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Data Visualization</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 14 }}>API usage trends, classification distribution, and screening analytics.</p>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 4 }}>
            {(['bar', 'line', 'pie'] as ChartType[]).map(t => (
              <button key={t} onClick={() => setChartType(t)} style={{
                padding: '7px 18px', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                background: chartType === t ? accent : 'transparent', color: chartType === t ? 'white' : 'rgba(255,255,255,0.45)',
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 4 }}>
            {(['classifications', 'calculations', 'screenings'] as DataSource[]).map(s => (
              <button key={s} onClick={() => setDataSource(s)} style={{
                padding: '7px 16px', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                background: dataSource === s ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: dataSource === s ? 'white' : 'rgba(255,255,255,0.4)',
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Chart card */}
        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {chartType === 'bar' ? title[dataSource] : chartType === 'line' ? 'Monthly API Calls — 2025' : `${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} Breakdown`}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Last 12 months</div>
          </div>
          {chartType === 'bar' && <BarChart data={BAR_DATA[dataSource]} />}
          {chartType === 'line' && <LineChart data={LINE_DATA[dataSource]} />}
          {chartType === 'pie' && <PieChart data={PIE_DATA[dataSource]} />}
        </div>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Calls', value: '47,230', delta: '+18%' },
            { label: 'Avg Response', value: '142ms', delta: '-12%' },
            { label: 'Success Rate', value: '99.7%', delta: '+0.2%' },
            { label: 'Unique Users', value: '1,842', delta: '+34%' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.delta.startsWith('+') ? '#4ade80' : '#f87171', fontWeight: 700, marginTop: 4 }}>{s.delta} vs last period</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
