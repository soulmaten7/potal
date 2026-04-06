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
  { code: 'KP', name: 'North Korea' }, { code: 'CU', name: 'Cuba' }, { code: 'SY', name: 'Syria' },
  { code: 'VE', name: 'Venezuela' }, { code: 'BY', name: 'Belarus' }, { code: 'MM', name: 'Myanmar' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' }, { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' }, { code: 'FR', name: 'France' }, { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' },
];

interface EmbargoResult {
  embargo?: { embargoed: boolean; programs?: string[]; details?: string };
  status?: string;
  matches?: Array<{ name: string; source: string; score: number }>;
}

export default function EmbargoPage() {
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmbargoResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          name: companyName.trim() || `Embargo check ${origin} to ${destination}`,
          country: origin,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const embargoed = result?.embargo?.embargoed;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Trade Embargo Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check if trade is permitted between two countries. Covers US, EU, and UN sanctions programs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country</label>
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
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Company Name (optional)</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. ABC Trading Co." style={inputStyle} />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Checking...' : 'Check Embargo'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{
            marginTop: 20, borderRadius: 14, padding: 24, textAlign: 'center',
            background: embargoed ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${embargoed ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{embargoed ? '&#10007;' : '&#10003;'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: embargoed ? '#f87171' : '#4ade80', marginBottom: 8 }}>
              {embargoed ? 'TRADE BLOCKED' : 'TRADE PERMITTED'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
              {origin} &rarr; {destination}
            </div>
            {embargoed && result.embargo?.programs && result.embargo.programs.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {result.embargo.programs.map((p, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
