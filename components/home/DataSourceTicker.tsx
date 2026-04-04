'use client';

import { useEffect, useState } from 'react';

interface DataSource {
  name: string;
  hoursAgo: number;
}

const DATA_SOURCES: DataSource[] = [
  { name: 'USITC', hoursAgo: 2 },
  { name: 'UK Trade Tariff', hoursAgo: 4 },
  { name: 'EU TARIC', hoursAgo: 6 },
  { name: 'Canada CBSA', hoursAgo: 8 },
  { name: 'Australia ABF', hoursAgo: 12 },
  { name: 'Korea KCS', hoursAgo: 6 },
  { name: 'Japan Customs', hoursAgo: 8 },
  { name: 'MacMap MFN', hoursAgo: 24 },
  { name: 'Exchange Rates', hoursAgo: 1 },
  { name: 'Section 301/232', hoursAgo: 12 },
  { name: 'Trade Remedies', hoursAgo: 24 },
  { name: 'FTA Agreements', hoursAgo: 48 },
];

function getTimeLabel(hoursAgo: number): string {
  if (hoursAgo < 1) return 'just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

function getStatusColor(hoursAgo: number): string {
  if (hoursAgo < 24) return '#22c55e';
  if (hoursAgo < 72) return '#eab308';
  return '#ef4444';
}

export default function DataSourceTicker() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const items = DATA_SOURCES.map((src, i) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
        {src.name}
      </span>
      <span style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: getStatusColor(src.hoursAgo),
        flexShrink: 0,
      }} />
      <span style={{ color: '#94a3b8', fontSize: 12 }}>
        {getTimeLabel(src.hoursAgo)}
      </span>
      {i < DATA_SOURCES.length - 1 && (
        <span style={{ color: '#334155', margin: '0 12px', fontSize: 10 }}>|</span>
      )}
    </span>
  ));

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      backgroundColor: 'rgba(2, 18, 44, 0.95)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      padding: '10px 0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to right, rgba(2,18,44,0.95), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to left, rgba(2,18,44,0.95), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          animation: 'tickerScroll 40s linear infinite',
        }}
        onMouseEnter={e => { e.currentTarget.style.animationPlayState = 'paused'; }}
        onMouseLeave={e => { e.currentTarget.style.animationPlayState = 'running'; }}
      >
        {items}
        {items}
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
