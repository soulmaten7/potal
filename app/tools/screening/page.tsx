'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface ScreeningMatch {
  name: string;
  source: string;
  score: number;
  programs?: string[];
  country?: string;
  type?: string;
}

interface ScreeningResult {
  status: string;
  matches?: ScreeningMatch[];
  totalMatches?: number;
  embargo?: { embargoed: boolean; programs?: string[] };
}

export default function ScreeningPage() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter a name to screen.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ name: name.trim(), ...(country ? { country } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Screening failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const isClean = result && (!result.matches || result.matches.length === 0);
  const isHit = result && result.matches && result.matches.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Denied Party Screening</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Screen against OFAC SDN, BIS Entity List, EU/UK/UN sanctions. 21,300+ entries with fuzzy matching.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Name to Screen</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Smith, ABC Trading Co." style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Country (optional)</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. IR, RU, CN" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !name.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Screening...' : 'Screen Now'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {isClean && (
          <div style={{ marginTop: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>&#10003;</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>CLEAR</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No matches found across all sanctions lists.</div>
            {result.embargo && !result.embargo.embargoed && (
              <div style={{ fontSize: 12, color: 'rgba(34,197,94,0.8)', marginTop: 8 }}>No trade embargo detected.</div>
            )}
          </div>
        )}

        {isHit && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 20, marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                HIT &mdash; {result.matches!.length} Match{result.matches!.length > 1 ? 'es' : ''} Found
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Manual review required before proceeding.</div>
            </div>

            {result.embargo?.embargoed && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13, color: '#fca5a5' }}>
                Trade Embargo: {result.embargo.programs?.join(', ') || 'Active'}
              </div>
            )}

            {result.matches!.map((m, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 16, marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: m.score >= 0.95 ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)', color: m.score >= 0.95 ? '#f87171' : '#facc15' }}>
                    {Math.round(m.score * 100)}% match
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>List: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.source}</span></span>
                  {m.type && <span style={{ color: 'rgba(255,255,255,0.5)' }}>Type: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.type}</span></span>}
                  {m.country && <span style={{ color: 'rgba(255,255,255,0.5)' }}>Country: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.country}</span></span>}
                </div>
                {m.programs && m.programs.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.programs.map((p, j) => (
                      <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
