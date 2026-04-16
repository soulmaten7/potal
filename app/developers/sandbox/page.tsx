'use client';

import React, { useState } from 'react';

const accent = '#E8640A';

interface EndpointOption { label: string; method: 'GET' | 'POST'; path: string; defaultBody: string }

const ENDPOINTS: EndpointOption[] = [
  { label: 'Calculate Landed Cost', method: 'POST', path: '/api/v1/calculate', defaultBody: JSON.stringify({ productName: 'Cotton T-Shirt', material: 'cotton', productCategory: 'apparel', price: 29.99, origin: 'CN', destinationCountry: 'US' }, null, 2) },
  { label: 'Classify HS Code', method: 'POST', path: '/api/v1/classify', defaultBody: JSON.stringify({ productName: 'Cotton T-Shirt', material: 'cotton', category: 'apparel' }, null, 2) },
  { label: 'Screen Party', method: 'POST', path: '/api/v1/screening', defaultBody: JSON.stringify({ name: 'John Smith', country: 'US' }, null, 2) },
  { label: 'Check Restrictions', method: 'POST', path: '/api/v1/restrictions', defaultBody: JSON.stringify({ destinationCountry: 'US', productName: 'Lithium batteries' }, null, 2) },
  { label: 'FTA Lookup', method: 'POST', path: '/api/v1/fta', defaultBody: JSON.stringify({ origin: 'KR', destination: 'US', hsCode: '610910' }, null, 2) },
  { label: 'Exchange Rate', method: 'GET', path: '/api/v1/exchange-rate', defaultBody: '' },
  { label: 'Country List', method: 'GET', path: '/api/v1/countries', defaultBody: '' },
  { label: 'Data Freshness', method: 'GET', path: '/api/v1/data-freshness', defaultBody: '' },
  { label: 'ECCN Classify', method: 'POST', path: '/api/v1/classify/eccn', defaultBody: JSON.stringify({ productName: 'Thermal imaging camera', destinationCountry: 'CN' }, null, 2) },
  { label: 'Type 86 Check', method: 'POST', path: '/api/v1/customs/type86', defaultBody: JSON.stringify({ declaredValue: 450, originCountry: 'CN' }, null, 2) },
];

const methodBg: Record<string, string> = { GET: 'bg-emerald-50 text-emerald-700', POST: 'bg-blue-50 text-blue-700' };

export default function SandboxPage() {
  const [selected, setSelected] = useState(0);
  const [body, setBody] = useState(ENDPOINTS[0].defaultBody);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const ep = ENDPOINTS[selected];

  const handleSelect = (i: number) => {
    setSelected(i);
    setBody(ENDPOINTS[i].defaultBody);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(null);
  };

  const handleSend = async () => {
    setLoading(true); setResponse(null); setStatusCode(null);
    const start = Date.now();
    try {
      const opts: RequestInit = {
        method: ep.method,
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
      };
      if (ep.method === 'POST' && body.trim()) {
        opts.body = body;
      }
      const res = await fetch(ep.path, opts);
      const elapsed = Date.now() - start;
      setStatusCode(res.status);
      setResponseTime(elapsed);
      const json = await res.json();
      setResponse(JSON.stringify(json, null, 2));
    } catch (err) {
      setStatusCode(0);
      setResponseTime(Date.now() - start);
      setResponse(JSON.stringify({ error: err instanceof Error ? err.message : 'Network error' }, null, 2));
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white py-16 px-5">
      <div className="max-w-7xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,100,10,0.1)', color: accent }}>DEVELOPER TOOLS</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">API Sandbox</h1>
        <p className="text-slate-500 mb-8 text-[15px]">Test any POTAL API endpoint in real-time. No API key needed for demo mode.</p>

        <div className="grid gap-5" style={{ gridTemplateColumns: '240px 1fr' }}>
          {/* Left: Endpoint list */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 max-h-[500px] overflow-y-auto">
            {ENDPOINTS.map((e, i) => (
              <button key={i} onClick={() => handleSelect(i)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left mb-0.5 transition-colors" style={{ background: selected === i ? 'rgba(232,100,10,0.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${methodBg[e.method]}`}>{e.method}</span>
                <span className="text-xs" style={{ color: selected === i ? '#1e293b' : '#64748b' }}>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Request/Response */}
          <div>
            {/* URL bar */}
            <div className="flex gap-3 mb-4 items-center">
              <span className={`text-[11px] px-3 py-1 rounded-md font-bold font-mono ${methodBg[ep.method]}`}>{ep.method}</span>
              <div className="flex-1 px-4 py-2.5 rounded-lg font-mono text-[13px] border border-slate-200 bg-slate-50" style={{ color: accent }}>
                {ep.path}
              </div>
              <button onClick={handleSend} disabled={loading} className="px-6 py-2.5 rounded-lg font-bold text-[13px] text-white whitespace-nowrap transition-colors" style={{ background: loading ? 'rgba(232,100,10,0.5)' : accent, border: 'none', cursor: loading ? 'default' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Request body */}
            {ep.method === 'POST' && (
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase mb-2">Request Body</div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-mono outline-none resize-y" style={{ boxSizing: 'border-box' }} />
              </div>
            )}

            {/* Response */}
            {response && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Response</span>
                    {statusCode !== null && (
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${statusCode >= 200 && statusCode < 300 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {statusCode}
                      </span>
                    )}
                  </div>
                  {responseTime !== null && <span className="text-[11px] text-slate-400">{responseTime}ms</span>}
                </div>
                <pre className="rounded-xl p-4 text-[11px] font-mono overflow-x-auto max-h-[400px] overflow-y-auto m-0 leading-relaxed" style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #e2e8f0' }}>
                  {response}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
