'use client';

import { useEffect, useState } from 'react';

export function DisclaimerBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
      <div className="flex gap-2">
        <span className="text-amber-600 text-lg leading-none mt-0.5">&#9888;</span>
        <div className="text-sm text-amber-800">{children}</div>
      </div>
    </div>
  );
}

export function UpdateDate({ date }: { date: string }) {
  return (
    <p className="text-xs text-slate-400 mt-8 border-t border-slate-100 pt-4">
      Last updated: {date}
    </p>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Live data freshness indicator — fetches from /api/v1/data-freshness */
export function LiveDataFreshness({ sourceNames }: { sourceNames: string[]; label?: string }) {
  const [freshness, setFreshness] = useState<{ name: string; lastUpdated: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/data-freshness')
      .then(r => r.json())
      .then(data => {
        if (data.sources) {
          setFreshness(data.sources.filter((s: { name: string }) => sourceNames.includes(s.name)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sourceNames]);

  if (loading || freshness.length === 0) return null;

  // Find the most recent update across all sources
  const latest = freshness
    .filter(s => s.lastUpdated)
    .sort((a, b) => new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime())[0];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {freshness.map(s => (
        <div key={s.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className={`w-2 h-2 rounded-full ${s.lastUpdated ? 'bg-emerald-400' : 'bg-slate-300'}`} />
          <span className="text-sm font-semibold text-slate-600">{s.name}</span>
          <span className="text-sm text-slate-400">{s.lastUpdated ? timeAgo(s.lastUpdated) : 'N/A'}</span>
        </div>
      ))}
    </div>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline underline-offset-2">
      {children} <span className="text-xs">&#8599;</span>
    </a>
  );
}
