'use client';

import Link from 'next/link';
import { SCENARIO_META, type EndpointDef } from '@/lib/playground/scenario-endpoints';

interface SidebarProps {
  scenarioId: string;
  endpoints: EndpointDef[];
  selectedEndpoint: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ scenarioId, endpoints, selectedEndpoint, onSelect }: SidebarProps) {
  const meta = SCENARIO_META[scenarioId] || SCENARIO_META.seller;

  return (
    <aside className="w-64 flex-none border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
      {/* Scenario header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-200">
        <Link href="/" className="text-[11px] text-slate-400 hover:text-slate-600 uppercase tracking-wide font-bold">
          ← All scenarios
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[22px]" aria-hidden>{meta.icon}</span>
          <div>
            <div className="text-[14px] font-extrabold text-[#02122c]">{meta.label}</div>
            <div className="text-[11px] text-slate-500">{meta.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Endpoint list */}
      <nav className="py-2" aria-label="API endpoints">
        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Endpoints ({endpoints.length})
        </div>
        {endpoints.map((ep, idx) => (
          <button
            key={ep.id}
            type="button"
            onClick={() => onSelect(ep.id)}
            className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors cursor-pointer ${
              selectedEndpoint === ep.id
                ? 'bg-white border-l-2 border-[#F59E0B] text-[#02122c]'
                : 'text-slate-600 hover:bg-white/60 border-l-2 border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                {ep.method}
              </span>
              <span>{ep.name}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-normal truncate">
              {ep.path}
            </div>
          </button>
        ))}
      </nav>

      {/* Forever Free badge */}
      <div className="px-4 py-4 border-t border-slate-200 mt-auto">
        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-center">
          Forever Free — No usage limits
        </div>
        <a
          href="mailto:contact@potal.app"
          className="block mt-2 text-[11px] text-slate-400 text-center hover:text-slate-600"
        >
          Enterprise? Contact us →
        </a>
      </div>
    </aside>
  );
}
