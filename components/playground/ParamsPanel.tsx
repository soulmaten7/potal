'use client';

import type { EndpointDef } from '@/lib/playground/scenario-endpoints';

interface ParamsPanelProps {
  endpoint: EndpointDef | undefined;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  paramValues: Record<string, string>;
  onParamChange: (key: string, val: string) => void;
  onTest: () => void;
  loading: boolean;
  /** CW34: login state + API key ownership for dynamic placeholder */
  isLoggedIn?: boolean;
  keyPrefix?: string | null;
  keyLoading?: boolean;
}

export function ParamsPanel({
  endpoint,
  apiKey,
  onApiKeyChange,
  paramValues,
  onParamChange,
  onTest,
  loading,
  isLoggedIn = false,
  keyPrefix = null,
  keyLoading = false,
}: ParamsPanelProps) {
  if (!endpoint) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-[14px]">
        Select an endpoint from the sidebar.
      </div>
    );
  }

  const canTest = endpoint.params
    .filter(p => p.required)
    .every(p => paramValues[p.key]?.trim());

  return (
    <div className="flex-1 min-w-0 border-r border-slate-200 flex flex-col overflow-y-auto">
      {/* Endpoint header + inline Test button */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
            {endpoint.method}
          </span>
          <span className="text-[14px] font-mono text-slate-600">{endpoint.path}</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold text-[#02122c]">{endpoint.name}</h2>
          <button
            type="button"
            onClick={onTest}
            disabled={!canTest || loading}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-colors ${
              loading
                ? 'bg-slate-300 text-white cursor-wait'
                : !canTest
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F59E0B] text-[#02122c] hover:bg-[#e8930a] cursor-pointer'
            }`}
          >
            {loading ? 'Testing...' : '▶ Test'}
          </button>
        </div>
        <p className="text-[13px] text-slate-500 mt-1">{endpoint.description}</p>
      </div>

      {/* API Key */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
          API Key
          <span className="ml-2 text-slate-400 font-normal normal-case">(or leave blank for demo mode)</span>
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
          placeholder={
            keyLoading
              ? 'Loading your API key...'
              : keyPrefix
                ? `You have an active key (${keyPrefix}...). Paste your full key here.`
                : isLoggedIn
                  ? 'No API key yet — create one in Dashboard'
                  : 'pk_live_your_api_key (or leave blank for demo mode)'
          }
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] font-mono focus:outline-none focus:border-[#F59E0B] bg-white"
        />
        {isLoggedIn && !keyPrefix && !keyLoading && (
          <a
            href="/dashboard/api-keys"
            className="inline-block mt-1.5 text-[11px] text-[#F59E0B] hover:underline font-semibold"
          >
            Create API Key in Dashboard →
          </a>
        )}
      </div>

      {/* Params */}
      <div className="px-6 py-4 flex-1 space-y-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
          Parameters
        </div>
        {endpoint.params.map(p => (
          <div key={p.key}>
            <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#02122c] mb-1">
              {p.label}
              {p.required && <span className="text-red-500">*</span>}
              <span className="text-[10px] font-mono text-slate-400 ml-auto">{p.type}</span>
            </label>
            {p.description && (
              <p className="text-[10px] text-slate-400 mb-1.5">{p.description}</p>
            )}
            {p.type === 'select' && p.options ? (
              <div className="relative">
                <select
                  value={paramValues[p.key] || p.defaultValue || ''}
                  onChange={e => onParamChange(p.key, e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#F59E0B] appearance-none"
                >
                  <option value="">Select…</option>
                  {p.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">▼</span>
              </div>
            ) : (
              <input
                type={p.type === 'number' ? 'number' : 'text'}
                value={paramValues[p.key] || ''}
                onChange={e => onParamChange(p.key, e.target.value)}
                placeholder={p.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#F59E0B]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Test button removed — inline button in header above */}
    </div>
  );
}
