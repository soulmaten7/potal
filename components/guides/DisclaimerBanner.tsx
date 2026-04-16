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

/** Live data freshness indicator — fetches from /api/v1/data-freshness */
export function LiveDataFreshness({ sourceNames, label }: { sourceNames: string[]; label?: string }) {
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

  if (loading) return null;
  if (freshness.length === 0) return null;

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="mt-8 border-t border-slate-100 pt-4">
      {label && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>}
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {freshness.map(s => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${s.lastUpdated ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <span className="font-medium text-slate-500">{s.name}</span>
            <span>{s.lastUpdated ? timeAgo(s.lastUpdated) : 'N/A'}</span>
          </div>
        ))}
      </div>
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
