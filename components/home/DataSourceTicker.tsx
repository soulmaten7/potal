'use client';

import { useEffect, useState } from 'react';

interface DataSource {
  name: string;
  hoursAgo: number;
  isLive: boolean;
}

const FALLBACK_SOURCES: DataSource[] = [
  { name: 'USITC', hoursAgo: 2, isLive: false },
  { name: 'UK Trade Tariff', hoursAgo: 4, isLive: false },
  { name: 'EU TARIC', hoursAgo: 6, isLive: false },
  { name: 'Canada CBSA', hoursAgo: 8, isLive: false },
  { name: 'Australia ABF', hoursAgo: 12, isLive: false },
  { name: 'Korea KCS', hoursAgo: 6, isLive: false },
  { name: 'Japan Customs', hoursAgo: 8, isLive: false },
  { name: 'MacMap MFN', hoursAgo: 24, isLive: false },
  { name: 'Exchange Rates', hoursAgo: 1, isLive: false },
  { name: 'Section 301/232', hoursAgo: 12, isLive: false },
  { name: 'Trade Remedies', hoursAgo: 24, isLive: false },
  { name: 'FTA Agreements', hoursAgo: 48, isLive: false },
];

function isoToHoursAgo(isoString: string | null): number {
  if (!isoString) return 999;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

function getTimeLabel(hoursAgo: number): string {
  if (hoursAgo >= 999) return 'unknown';
  if (hoursAgo < 1) return 'just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.floor(hoursAgo / 24)}d ago`;
}

function getStatusColor(hoursAgo: number): string {
  if (hoursAgo >= 999) return '#64748b';
  if (hoursAgo < 24) return '#22c55e';
  if (hoursAgo < 72) return '#eab308';
  return '#ef4444';
}

export default function DataSourceTicker() {
  const [mounted, setMounted] = useState(false);
  const [sources, setSources] = useState<DataSource[]>(FALLBACK_SOURCES);

  useEffect(() => {
    setMounted(true);

    async function fetchFreshness() {
      try {
        const res = await fetch('/api/v1/data-freshness');
        if (!res.ok) return;
        const json = await res.json();
        if (json.sources && json.sources.length > 0) {
          const live: DataSource[] = json.sources.map((s: { name: string; lastUpdated: string | null }) => ({
            name: s.name,
            hoursAgo: isoToHoursAgo(s.lastUpdated),
            isLive: s.lastUpdated !== null,
          }));
          setSources(live);
        }
      } catch {
        // fallback maintained
      }
    }

    fetchFreshness();
    const interval = setInterval(fetchFreshness, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const items = sources.map((src, i) => (
    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>
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
      <span style={{ color: '#94a3b8', fontSize: 13 }}>
        {getTimeLabel(src.hoursAgo)}
      </span>
      {i < sources.length - 1 && (
        <span style={{ color: '#334155', margin: '0 16px', fontSize: 11 }}>|</span>
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
      padding: '12px 0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to right, rgba(2,18,44,0.95), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
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
