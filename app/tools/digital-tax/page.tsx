'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const SERVICE_TYPES = ['SaaS', 'Streaming', 'E-book', 'Online Advertising', 'Cloud Services', 'Digital Marketplace', 'Gaming', 'Social Media'];

interface DstResult {
  applicable: boolean;
  rate?: number;
  estimatedTax?: number;
  threshold?: { amount: number; currency: string; type: string };
  countryRules?: string;
  taxName?: string;
}

export default function DigitalTaxPage() {
  const [serviceType, setServiceType] = useState('SaaS');
  const [revenue, setRevenue] = useState('100000');
  const [sellerCountry, setSellerCountry] = useState('US');
  const [buyerCountry, setBuyerCountry] = useState('FR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DstResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!revenue.trim() || parseFloat(revenue) <= 0) { setError('Enter a valid revenue amount.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/tax/digital-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          serviceType,
          revenue: parseFloat(revenue),
          sellerCountry,
          buyerCountry,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'DST lookup failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TAX TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Digital Services Tax</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Check DST obligations for digital services across jurisdictions.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Service Type</label>
            <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={inputStyle}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Annual Revenue (USD)</label>
            <input value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="100000" type="number" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Seller Country</label>
              <select value={sellerCountry} onChange={e => setSellerCountry(e.target.value)} style={inputStyle}>
                {['US','GB','DE','FR','JP','KR','CN','CA','AU','IN','SG','IE'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Buyer Country</label>
              <select value={buyerCountry} onChange={e => setBuyerCountry(e.target.value)} style={inputStyle}>
                {['US','GB','DE','FR','JP','KR','CN','CA','AU','IN','IT','ES','AT','HU','TR','ID','MY','NG','KE'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking...' : 'Check DST Obligation'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: result.applicable ? '#f59e0b' : '#4ade80' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>{result.applicable ? 'DST Applicable' : 'No DST Obligation'}</span>
            </div>
            {result.applicable && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.taxName && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tax Name</span><span style={{ fontSize: 14, fontWeight: 600 }}>{result.taxName}</span></div>}
                {result.rate !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Rate</span><span style={{ color: accent, fontSize: 16, fontWeight: 700 }}>{(result.rate * 100).toFixed(1)}%</span></div>}
                {result.estimatedTax !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Estimated Tax</span><span style={{ color: '#facc15', fontSize: 16, fontWeight: 700 }}>${result.estimatedTax.toLocaleString()}</span></div>}
                {result.threshold && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Threshold</span><span style={{ fontSize: 13 }}>{result.threshold.currency} {result.threshold.amount.toLocaleString()} ({result.threshold.type})</span></div>}
                {result.countryRules && <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.countryRules}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
