'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface ChecklistItem {
  item: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
  detail: string;
}

interface PreShipmentResult {
  checklist?: ChecklistItem[];
  summary?: { total: number; pass: number; fail: number; warning: number };
  risk_score?: number;
  risk_level?: string;
  shipment_allowed?: boolean;
  blocked_reasons?: string[];
  missing_documents?: string[];
  recommendations?: string[];
  estimated_clearance_time?: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'CN', name: 'China' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' }, { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' },
];

const statusColor: Record<string, string> = { PASS: '#4ade80', FAIL: '#f87171', WARNING: '#facc15', SKIP: '#94a3b8' };
const statusIcon: Record<string, string> = { PASS: '\u2713', FAIL: '\u2717', WARNING: '!', SKIP: '-' };

export default function PreShipmentPage() {
  const [hsCode, setHsCode] = useState('');
  const [destination, setDestination] = useState('US');
  const [origin, setOrigin] = useState('CN');
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState('');
  const [shipper, setShipper] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreShipmentResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!hsCode.trim()) { setError('HS Code is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/verify/pre-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          hs_code: hsCode.trim(),
          destination,
          origin,
          ...(value ? { declared_value: parseFloat(value) } : {}),
          ...(weight ? { weight_kg: parseFloat(weight) } : {}),
          ...(shipper.trim() ? { shipper_name: shipper.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Verification failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const riskColor = result?.risk_level === 'LOW' ? '#4ade80' : result?.risk_level === 'MEDIUM' ? '#facc15' : result?.risk_level === 'HIGH' ? '#f87171' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Pre-Shipment Verification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          All-in-one compliance check: sanctions, restrictions, documentation, and duty estimation before shipping.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin</label>
            <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination</label>
            <select value={destination} onChange={e => setDestination(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Value (USD)</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 500" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 2.5" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Shipper Name (optional — triggers sanctions screening)</label>
            <input value={shipper} onChange={e => setShipper(e.target.value)} placeholder="e.g. ABC Trading Co." style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Verifying...' : 'Run Pre-Shipment Check'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            {/* Risk banner */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '16px 20px',
              border: `1px solid ${riskColor}33`, marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Risk Level</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: riskColor }}>{result.risk_level}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Risk Score</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: riskColor }}>{result.risk_score}/100</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Shipment</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: result.shipment_allowed ? '#4ade80' : '#f87171' }}>
                  {result.shipment_allowed ? 'ALLOWED' : 'BLOCKED'}
                </div>
              </div>
            </div>

            {/* Blocked reasons */}
            {result.blocked_reasons && result.blocked_reasons.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Blocked Reasons</div>
                {result.blocked_reasons.map((r, i) => <div key={i} style={{ fontSize: 13, color: '#fca5a5', marginBottom: 2 }}>{r}</div>)}
              </div>
            )}

            {/* Checklist */}
            {result.checklist && result.checklist.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                {result.checklist.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: i < result.checklist!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span style={{ color: statusColor[c.status], fontWeight: 700, fontSize: 14, flexShrink: 0, width: 16, textAlign: 'center' }}>{statusIcon[c.status]}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{c.item}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{c.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary row */}
            {result.summary && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {(['pass', 'fail', 'warning'] as const).map(k => (
                  <div key={k} style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: k === 'pass' ? '#4ade80' : k === 'fail' ? '#f87171' : '#facc15' }}>{result.summary![k]}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{k}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Recommendations</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4, paddingLeft: 12 }}>
                    {r}
                  </div>
                ))}
              </div>
            )}

            {result.estimated_clearance_time && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                Estimated clearance time: {result.estimated_clearance_time}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
