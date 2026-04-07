'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const EU_COUNTRIES = [
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }, { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' }, { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' }, { code: 'AT', name: 'Austria' }, { code: 'SE', name: 'Sweden' },
  { code: 'IE', name: 'Ireland' }, { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
];

interface Ics2Issue { field?: string; severity?: string; message?: string; ics2Reference?: string }

interface Ics2Result {
  ics2Status?: string;
  compliant?: boolean;
  errors?: number;
  warnings?: number;
  issues?: Ics2Issue[];
  filingRequirements?: { ensRequired?: boolean; ensDeadline?: string; system?: string; applicableFrom?: string };
  recommendations?: string[];
}

export default function Ics2Page() {
  const [hsCode, setHsCode] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('DE');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [shipperName, setShipperName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Ics2Result | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!hsCode.trim() || !description.trim()) { setError('HS code and commodity description are required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/compliance/ics2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          shipper: { name: shipperName.trim() || 'Demo Shipper', address: 'Demo Address', country: origin },
          consignee: { name: 'EU Consignee', address: 'Demo EU Address', country: destination },
          goods: [{ description: description.trim(), hsCode: hsCode.trim(), weight: 1, ...(value ? { value: parseFloat(value) } : {}), countryOfOrigin: origin }],
          transport: { mode: 'air' },
          routing: { departureCountry: origin },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const statusColor = result?.ics2Status === 'compliant' ? '#4ade80' : result?.ics2Status === 'non_compliant' ? '#f87171' : '#facc15';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CUSTOMS TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>ICS2 Pre-arrival Filing Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Validate ICS2 Entry Summary Declaration data for EU-bound shipments. Check compliance before filing.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Value (EUR)</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 500" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Commodity Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Men's cotton knitted t-shirts, crew neck, short sleeve, for casual wear" rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 48 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. CN" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>EU Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {EU_COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Shipper Name <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={shipperName} onChange={e => setShipperName(e.target.value)} placeholder="e.g. ABC Trading Co." style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Validating...' : 'Check ICS2 Compliance'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '16px 20px', border: `1px solid ${statusColor}33`, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>ICS2 Status</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>{result.ics2Status?.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: result.errors ? '#f87171' : '#4ade80' }}>{result.errors || 0}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>ERRORS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: result.warnings ? '#facc15' : '#4ade80' }}>{result.warnings || 0}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>WARNINGS</div>
                </div>
              </div>
            </div>

            {result.filingRequirements && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Filing Requirements</div>
                {[
                  { label: 'ENS Required', value: result.filingRequirements.ensRequired ? 'Yes' : 'No' },
                  { label: 'Deadline', value: result.filingRequirements.ensDeadline || 'N/A' },
                  { label: 'System', value: result.filingRequirements.system || 'N/A' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {result.issues && result.issues.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ padding: '10px 16px', borderBottom: i < result.issues!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: issue.severity === 'error' ? '#f87171' : '#facc15', fontWeight: 700, flexShrink: 0 }}>{issue.severity === 'error' ? '\u2717' : '!'}</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{issue.message}</div>
                      {issue.field && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Field: {issue.field}</div>}
                    </div>
                  </div>
                ))}
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
