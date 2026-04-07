'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const COUNTRIES = [
  { code: 'CN', name: 'China' }, { code: 'RU', name: 'Russia' }, { code: 'IR', name: 'Iran' },
  { code: 'KP', name: 'North Korea' }, { code: 'US', name: 'United States' }, { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' }, { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' }, { code: 'IL', name: 'Israel' }, { code: 'PK', name: 'Pakistan' },
];

interface Issue { type?: string; severity?: string; message?: string; regulation?: string }
interface ChartResult { eccn_group?: string; reason?: string; license_required?: boolean; exceptions?: string[] }

interface DualUseResult {
  status?: string;
  eccn?: string | null;
  eccn_suggestion?: { eccn_group?: string; description?: string; is_ear99?: boolean } | null;
  ear99?: boolean | null;
  license_required?: boolean;
  available_exceptions?: string[];
  issues?: Issue[];
  chart_results?: ChartResult[] | null;
  countryGroups?: Record<string, boolean>;
  recommendations?: string[];
}

export default function DualUsePage() {
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [destination, setDestination] = useState('CN');
  const [endUse, setEndUse] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DualUseResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productName.trim()) { setError('Product description is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/compliance/export-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productName: productName.trim(),
          destinationCountry: destination,
          ...(hsCode.trim() ? { hsCode: hsCode.trim() } : {}),
          ...(endUse.trim() ? { endUse: endUse.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const statusColor = result?.status === 'clear' ? '#4ade80' : result?.status === 'blocked' ? '#f87171' : '#facc15';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Dual-Use Goods Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check if a product is classified as dual-use under EAR, EU, and Wassenaar Arrangement. Determine export license requirements.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Description</label>
            <textarea value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. CNC milling machine, 5-axis, positioning accuracy 6 microns" rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 48 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 845610" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>End Use <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={endUse} onChange={e => setEndUse(e.target.value)} placeholder="e.g. Automotive parts manufacturing" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Checking...' : 'Check Dual-Use Status'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '16px 20px', border: `1px solid ${statusColor}33`, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>{result.status?.toUpperCase() || 'UNKNOWN'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>License</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: result.license_required ? '#f87171' : '#4ade80' }}>{result.license_required ? 'REQUIRED' : 'NOT REQUIRED'}</div>
              </div>
            </div>

            {result.eccn_suggestion && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>ECCN Group</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: result.eccn_suggestion.is_ear99 ? '#4ade80' : accent }}>{result.eccn_suggestion.is_ear99 ? 'EAR99' : result.eccn_suggestion.eccn_group || 'N/A'}</span>
                </div>
                {result.eccn_suggestion.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{result.eccn_suggestion.description}</div>}
              </div>
            )}

            {result.issues && result.issues.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Issues</div>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ padding: '10px 16px', borderBottom: i < result.issues!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: issue.severity === 'high' ? '#f87171' : '#facc15', fontWeight: 700, flexShrink: 0 }}>{issue.severity === 'high' ? '\u2717' : '!'}</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{issue.message}</div>
                      {issue.regulation && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{issue.regulation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.available_exceptions && result.available_exceptions.length > 0 && (
              <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#4ade80', marginBottom: 6 }}>Available License Exceptions</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.available_exceptions.map((e, i) => <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{e}</span>)}
                </div>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Recommendations</div>
                {result.recommendations.map((r, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4, paddingLeft: 12 }}>{r}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
