'use client';

import { useState } from 'react';
import Link from 'next/link';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'CN', name: 'China' }, { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' }, { code: 'MX', name: 'Mexico' },
  { code: 'VN', name: 'Vietnam' }, { code: 'IN', name: 'India' }, { code: 'FR', name: 'France' },
];

interface FtaResult {
  agreements: { name: string; code: string; rate?: number; savings?: number }[];
  origin: string;
  destination: string;
  totalAgreements: number;
}

export default function FtaLookupPage() {
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [hsCode, setHsCode] = useState('');
  const [price, setPrice] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FtaResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/v1/fta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          originCountry: origin,
          destinationCountry: destination,
          ...(hsCode.trim() ? { hsCode: hsCode.trim() } : {}),
          ...(price.trim() ? { declaredValue: parseFloat(price) } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Failed to look up FTAs');
        return;
      }
      setResult(json.data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1e3d' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px 80px' }}>
        <Link href="/tools" style={{ color: '#E8640A', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← All Tools</Link>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>FTA Lookup</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
          Find applicable Free Trade Agreements between two countries and estimate duty savings.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Origin Country</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }}>
                {POPULAR_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Destination Country</label>
              <select value={destination} onChange={e => setDestination(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }}>
                {POPULAR_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Value (USD)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="1000" type="number"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#E8640A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Searching...' : 'Find FTAs'}
          </button>
        </div>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Results</h2>
              <span style={{ fontSize: 13, color: '#E8640A', fontWeight: 600 }}>{result.totalAgreements} FTA(s) found</span>
            </div>
            {result.agreements && result.agreements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.agreements.map((fta, i) => (
                  <div key={i} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{fta.name}</span>
                      {fta.rate !== undefined && <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>{(fta.rate * 100).toFixed(1)}%</span>}
                    </div>
                    {fta.savings !== undefined && fta.savings > 0 && (
                      <div style={{ color: '#4ade80', fontSize: 12, marginTop: 4 }}>Estimated savings: ${fta.savings.toFixed(2)}</div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{fta.code}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No FTAs found between {result.origin} and {result.destination}.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
