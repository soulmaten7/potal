'use client';

/**
 * LiveTicker — CW38-HF20: 진짜 API 연결
 *
 * /api/v1/data-freshness 에서 12개 데이터 소스의 실제 업데이트 시각을 가져와서
 * 2줄 marquee 티커로 표시. 5분마다 API 재조회, 30초마다 상대시간 갱신.
 *
 * 결정 2 (HOMEPAGE_REDESIGN_SPEC.md): 2줄 티커, 풀네임 병기, Live indicator
 */

import { useEffect, useState } from 'react';
import {
  apiToLiveSources,
  formatRelativeTime,
  getTickerRows,
  type LiveSource,
} from '@/lib/ticker/live-status';

function TickerItem({ source, now }: { source: LiveSource; now: Date }) {
  const relative = formatRelativeTime(source.lastUpdatedAt, now);
  const isStale = !source.lastUpdatedAt;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap mr-10 text-[12px] text-slate-600">
      <span
        aria-hidden="true"
        className={`inline-block w-[7px] h-[7px] rounded-full ${isStale ? 'bg-slate-400' : 'bg-emerald-500 live-pulse'}`}
      />
      <span className={`font-semibold ${isStale ? 'text-slate-500' : 'text-emerald-700'}`}>
        {isStale ? 'Pending' : 'Live'}
      </span>
      <span className="text-slate-400">·</span>
      <span className="font-semibold text-slate-700">{source.abbr}</span>
      <span className="text-slate-500">({source.fullName})</span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">Updated {relative}</span>
    </span>
  );
}

function TickerRow({ items, now, reverse = false }: { items: LiveSource[]; now: Date; reverse?: boolean }) {
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
  const [sources, setSources] = useState<LiveSource[]>([]);

  useEffect(() => {
    setNow(new Date());

    // Tick relative times every 30s
    const timeId = setInterval(() => setNow(new Date()), 30_000);

    // Fetch real data from API
    async function fetchFreshness() {
      try {
        const res = await fetch('/api/v1/data-freshness');
        if (!res.ok) return;
        const json = await res.json();
        if (json.sources && json.sources.length > 0) {
          setSources(apiToLiveSources(json.sources));
        }
      } catch {
        // Keep previous data on failure
      }
    }

    fetchFreshness();
    // Re-fetch from API every 5 minutes (matches API cache TTL)
    const fetchId = setInterval(fetchFreshness, 5 * 60 * 1000);

    return () => {
      clearInterval(timeId);
      clearInterval(fetchId);
    };
  }, []);

  // Loading placeholder
  if (!now || sources.length === 0) {
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

  const [row1, row2] = getTickerRows(sources);

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
