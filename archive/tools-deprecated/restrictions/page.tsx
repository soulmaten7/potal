'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface Restriction {
  type?: string;
  description?: string;
  license_info?: string;
  direction?: string;
  hs_codes?: string[];
}

interface RestrictionsResult {
  hasRestrictions?: boolean;
  isProhibited?: boolean;
  restrictions?: Restriction[];
  hsCode?: string;
  destinationCountry?: string;
  autoClassified?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'CN', name: 'China' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' }, { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' }, { code: 'RU', name: 'Russia' },
  { code: 'IR', name: 'Iran' }, { code: 'MX', name: 'Mexico' }, { code: 'SG', name: 'Singapore' },
];

export default function RestrictionsPage() {
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [destination, setDestination] = useState('US');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RestrictionsResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productName.trim() && !hsCode.trim()) { setError('Enter a product name or HS code.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          destinationCountry: destination,
          ...(hsCode.trim() ? { hsCode: hsCode.trim() } : {}),
          ...(productName.trim() ? { productName: productName.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Import Restrictions Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check if a product has import restrictions, licensing requirements, or prohibitions for a destination country.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Name</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Lithium batteries, Fireworks" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 360410" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Checking...' : 'Check Restrictions'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            {/* Status banner */}
            <div style={{
              borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 12,
              background: result.isProhibited ? 'rgba(239,68,68,0.1)' : result.hasRestrictions ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
              border: `1px solid ${result.isProhibited ? 'rgba(239,68,68,0.3)' : result.hasRestrictions ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.isProhibited ? '#f87171' : result.hasRestrictions ? '#facc15' : '#4ade80' }}>
                {result.isProhibited ? 'PROHIBITED' : result.hasRestrictions ? 'RESTRICTIONS APPLY' : 'NO RESTRICTIONS'}
              </div>
              {result.hsCode && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>HS Code: {result.hsCode} &rarr; {result.destinationCountry}</div>}
              {result.autoClassified && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Auto-classified from product name</div>}
            </div>

            {/* Restriction details */}
            {result.restrictions && result.restrictions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.restrictions.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                    {r.type && <div style={{ fontSize: 13, fontWeight: 700, color: '#facc15', marginBottom: 6 }}>{r.type}</div>}
                    {r.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 6 }}>{r.description}</div>}
                    {r.license_info && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '6px 10px', background: 'rgba(234,179,8,0.1)', borderRadius: 6 }}>
                        License: {r.license_info}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
