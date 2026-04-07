'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

interface TaxResult {
  rate?: number;
  totalRate?: number;
  stateRate?: number;
  countyRate?: number;
  cityRate?: number;
  specialRate?: number;
  jurisdiction?: string;
  state?: string;
  county?: string;
  city?: string;
  taxType?: string;
  description?: string;
  threshold?: number;
  currency?: string;
}

export default function TaxPage() {
  const [mode, setMode] = useState<'us' | 'specialized'>('us');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [taxType, setTaxType] = useState('vat');
  const [productAmount, setProductAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      if (mode === 'us') {
        if (!zipCode.trim()) { setError('Please enter a US ZIP code.'); setLoading(false); return; }
        const res = await fetch(`/api/v1/tax/us-sales-tax?zip=${encodeURIComponent(zipCode.trim())}`, {
          headers: { 'X-Demo-Request': 'true' },
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Failed to fetch tax rate.'); return; }
        setResult(json.data ?? json);
      } else {
        if (!country.trim()) { setError('Please enter a country code.'); setLoading(false); return; }
        const res = await fetch('/api/v1/tax/specialized', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
          body: JSON.stringify({
            country: country.trim().toUpperCase(),
            taxType,
            ...(productAmount ? { productAmount: parseFloat(productAmount) } : {}),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || 'Failed to fetch tax data.'); return; }
        setResult(json.data ?? json);
      }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TAX TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Tax Rate Lookup</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          US Sales Tax by ZIP code or VAT/GST/Digital Services Tax by country.
        </p>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['us', 'specialized'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setError(''); }} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: mode === m ? accent : 'rgba(255,255,255,0.08)', color: 'white',
            }}>
              {m === 'us' ? 'US Sales Tax' : 'VAT / GST'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {mode === 'us' ? (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>US ZIP Code</label>
              <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="e.g. 90210, 10001" style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Country Code</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. DE, GB, AU, JP" style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Tax Type</label>
                <select value={taxType} onChange={e => setTaxType(e.target.value)} style={selectStyle}>
                  <option value="vat">VAT</option>
                  <option value="gst">GST</option>
                  <option value="digital">Digital Services Tax</option>
                  <option value="customs">Customs Duty</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Amount (USD, optional)</label>
                <input value={productAmount} onChange={e => setProductAmount(e.target.value)} placeholder="e.g. 500" type="number" min="0" style={inputStyle} />
              </div>
            </>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Looking up...' : 'Get Tax Rate'}
        </button>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 24, background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 16 }}>Tax Rate Results</div>

            {/* Main rate */}
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: accent }}>
                {((result.totalRate ?? result.rate ?? 0) * 100).toFixed(2)}%
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {result.jurisdiction || result.taxType || (mode === 'us' ? 'Combined Rate' : 'Tax Rate')}
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.stateRate !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>State Rate</span>
                  <span style={{ fontWeight: 700 }}>{(result.stateRate * 100).toFixed(3)}%</span>
                </div>
              )}
              {result.countyRate !== undefined && result.countyRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>County Rate</span>
                  <span style={{ fontWeight: 700 }}>{(result.countyRate * 100).toFixed(3)}%</span>
                </div>
              )}
              {result.cityRate !== undefined && result.cityRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>City Rate</span>
                  <span style={{ fontWeight: 700 }}>{(result.cityRate * 100).toFixed(3)}%</span>
                </div>
              )}
              {result.specialRate !== undefined && result.specialRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Special District</span>
                  <span style={{ fontWeight: 700 }}>{(result.specialRate * 100).toFixed(3)}%</span>
                </div>
              )}
              {result.state && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>State</span>
                  <span style={{ fontWeight: 700 }}>{result.state}</span>
                </div>
              )}
              {result.city && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>City</span>
                  <span style={{ fontWeight: 700 }}>{result.city}</span>
                </div>
              )}
              {result.threshold !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Threshold</span>
                  <span style={{ fontWeight: 700 }}>{result.currency || '$'}{result.threshold.toLocaleString()}</span>
                </div>
              )}
              {result.description && (
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(232,100,10,0.08)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  {result.description}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
