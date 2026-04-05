'use client';

import { useEffect, useState } from 'react';
import fallbackData from '@/data/ticker-fallback.json';

interface DataSource {
  name: string;
  hoursAgo: number;
  isLive: boolean;
}

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

const FALLBACK_SOURCES: DataSource[] = fallbackData.sources.map((src) => ({
  name: src.name,
  hoursAgo: isoToHoursAgo(src.lastUpdated),
  isLive: false,
}));

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
