'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

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

const methodColor: Record<string, string> = { GET: '#4ade80', POST: '#60a5fa' };

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER TOOLS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>API Sandbox</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Test any POTAL API endpoint in real-time. No API key needed for demo mode.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
          {/* Left: Endpoint list */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', padding: 8, maxHeight: 500, overflowY: 'auto' }}>
            {ENDPOINTS.map((e, i) => (
              <button key={i} onClick={() => handleSelect(i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                background: selected === i ? 'rgba(232,100,10,0.15)' : 'transparent', border: 'none',
                borderRadius: 8, cursor: 'pointer', color: 'white', textAlign: 'left', marginBottom: 2,
              }}>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 700, fontFamily: 'monospace', background: `${methodColor[e.method]}20`, color: methodColor[e.method] }}>{e.method}</span>
                <span style={{ fontSize: 12, color: selected === i ? 'white' : 'rgba(255,255,255,0.6)' }}>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Request/Response */}
          <div>
            {/* URL bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace', background: `${methodColor[ep.method]}20`, color: methodColor[ep.method] }}>{ep.method}</span>
              <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: accent, border: '1px solid rgba(255,255,255,0.1)' }}>
                {ep.path}
              </div>
              <button onClick={handleSend} disabled={loading} style={{ padding: '10px 24px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Request body */}
            {ep.method === 'POST' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>Request Body</div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
              </div>
            )}

            {/* Response */}
            {response && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Response</span>
                    {statusCode !== null && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: statusCode >= 200 && statusCode < 300 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: statusCode >= 200 && statusCode < 300 ? '#4ade80' : '#f87171' }}>
                        {statusCode}
                      </span>
                    )}
                  </div>
                  {responseTime !== null && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{responseTime}ms</span>}
                </div>
                <pre style={{ background: '#0d1117', borderRadius: 10, padding: 16, fontSize: 11, fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto', maxHeight: 400, overflowY: 'auto', margin: 0, border: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 }}>
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
