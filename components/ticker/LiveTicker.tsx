'use client';

/**
 * LiveTicker — CW23 홈페이지 리디자인 Sprint 1
 *
 * 결정 2 (HOMEPAGE_REDESIGN_SPEC.md): 2줄 티커, 풀네임 병기, Live indicator
 *
 * 각 줄은 독립적으로 좌→우로 천천히 흐르고, 풀세트가 끝나면 반복(marquee).
 * Pulse 애니메이션 "●" 초록 점으로 Operational Transparency 구현.
 *
 * 상대 시간 ("14 min ago")은 마운트 후 클라이언트에서 계산하여 SSR mismatch 방지.
 */

import { useEffect, useState } from 'react';
import {
  LIVE_SOURCES,
  formatRelativeTime,
  getTickerRows,
  type LiveSource,
} from '@/lib/ticker/live-status';

function TickerItem({ source, now }: { source: LiveSource; now: Date }) {
  const relative = formatRelativeTime(source.lastUpdatedAt, now);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap mr-10 text-[12px] text-slate-600">
      <span
        aria-hidden="true"
        className="inline-block w-[7px] h-[7px] rounded-full bg-emerald-500 live-pulse"
      />
      <span className="font-semibold text-emerald-700">Live</span>
      <span className="text-slate-400">·</span>
      <span className="font-semibold text-slate-700">{source.abbr}</span>
      <span className="text-slate-500">({source.fullName})</span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">Updated {relative}</span>
    </span>
  );
}

function TickerRow({ items, now, reverse = false }: { items: LiveSource[]; now: Date; reverse?: boolean }) {
  // Duplicate the list so the marquee loop is seamless.
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-slate-100 py-2">
      <div
        className={`flex ${reverse ? 'ticker-marquee-reverse' : 'ticker-marquee'}`}
        style={{ width: 'max-content' }}
      >
        {loop.map((s, i) => (
          <TickerItem key={`${s.id}-${i}`} source={s} now={now} />
        ))}
      </div>
    </div>
  );
}

export function LiveTicker() {
  const [now, setNow] = useState<Date | null>(null);

  // Set initial time on mount (avoids SSR/CSR mismatch), then tick every 30s.
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const [row1, row2] = getTickerRows(LIVE_SOURCES);

  // Render a neutral placeholder until hydration to prevent mismatched relative times.
  if (!now) {
    return (
      <div
        aria-label="Live data sources ticker"
        className="bg-slate-50 border-y border-slate-200"
      >
        <div className="py-2 px-4 text-[12px] text-slate-400">Loading live data sources…</div>
        <div className="py-2 px-4 text-[12px] text-slate-400">&nbsp;</div>
      </div>
    );
  }

  return (
    <div
      aria-label="Live data sources ticker"
      className="bg-slate-50 border-y border-slate-200"
    >
      <TickerRow items={row1} now={now} />
      <TickerRow items={row2} now={now} reverse />
      <style jsx>{`
        :global(.live-pulse) {
          animation: live-pulse 1.8s ease-in-out infinite;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
        }
        @keyframes live-pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
          }
          50% {
            opacity: 0.55;
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
        }
        :global(.ticker-marquee) {
          animation: ticker-slide 60s linear infinite;
        }
        :global(.ticker-marquee-reverse) {
          animation: ticker-slide-reverse 75s linear infinite;
        }
        @keyframes ticker-slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes ticker-slide-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default LiveTicker;
