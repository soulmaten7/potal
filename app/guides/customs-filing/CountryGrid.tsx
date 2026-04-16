'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FILING_GUIDES } from './data';

const SOURCE_MAP: Record<string, string> = {
  KR: 'Korea KCS',
  US: 'USITC',
  EU: 'EU TARIC',
  GB: 'UK Trade Tariff',
  JP: 'Japan Customs',
  CN: '',
  AU: 'Australia ABF',
  CA: 'Canada CBSA',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CountryGrid() {
  const [freshness, setFreshness] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetch('/api/v1/data-freshness')
      .then(r => r.json())
      .then(data => {
        if (data.sources) {
          const map: Record<string, string | null> = {};
          for (const s of data.sources) {
            map[s.name] = s.lastUpdated;
          }
          setFreshness(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Object.values(FILING_GUIDES).map(g => {
        const sourceName = SOURCE_MAP[g.code];
        const lastUpdated = sourceName ? freshness[sourceName] : null;

        return (
          <Link
            key={g.code}
            href={`/guides/customs-filing/${g.code}`}
            className="block p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">{g.flag}</div>
            <div className="font-semibold text-sm">{g.name}</div>
            <div className="text-xs text-slate-500 mt-1">{g.system}</div>
            {sourceName && lastUpdated && (
              <div className="flex items-center justify-center gap-1 mt-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{timeAgo(lastUpdated)}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
