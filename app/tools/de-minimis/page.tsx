'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

interface DeMinimisResult {
  country?: string;
  threshold?: number;
  currency?: string;
  productValue?: number;
  status?: 'below' | 'above';
  dutyFreeEligible?: boolean;
  taxFreeEligible?: boolean;
  dutyThreshold?: number;
  taxThreshold?: number;
  specialRules?: string[];
  notes?: string;
  recommendation?: string;
}

export default function DeMinimisPage() {
  const [destCountry, setDestCountry] = useState('');
  const [productValue, setProductValue] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeMinimisResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!destCountry.trim() || !productValue.trim()) {
      setError('Please fill in destination country and product value.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'de-minimis',
          destinationCountry: destCountry.trim().toUpperCase(),
          productValue: parseFloat(productValue),
          productCategory: category,
          currency: 'USD',
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Calculation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const isBelow = result?.status === 'below' || (result?.threshold !== undefined && result?.productValue !== undefined && result.productValue < result.threshold);
  const isAbove = result?.status === 'above' || (result?.threshold !== undefined && result?.productValue !== undefined && result.productValue >= result.threshold);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TRADE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>De Minimis Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check if your shipment qualifies for duty-free entry under the destination country&apos;s de minimis threshold.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country *</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. US, DE, GB, AU, CA" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Value (USD) *</label>
            <input value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="e.g. 150" type="number" min="0" step="0.01" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
              <option value="general">General Merchandise</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing &amp; Apparel</option>
              <option value="food">Food &amp; Beverages</option>
              <option value="cosmetics">Cosmetics &amp; Health</option>
              <option value="books">Books &amp; Media</option>
              <option value="gifts">Gifts</option>
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !destCountry.trim() || !productValue.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Checking...' : 'Check De Minimis'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Status banner */}
            <div style={{
              background: isBelow ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isBelow ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 14, padding: 24, marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>{isBelow ? '✓' : '!'}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: isBelow ? '#4ade80' : '#f87171', marginBottom: 6 }}>
                {isBelow ? 'BELOW DE MINIMIS' : 'ABOVE DE MINIMIS'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                {isBelow
                  ? 'Your shipment may qualify for duty-free entry'
                  : 'Duties and taxes will apply to this shipment'}
              </div>
            </div>

            {/* Threshold info */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 14 }}>Threshold Details — {result.country || destCountry.toUpperCase()}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.threshold !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>De Minimis Threshold</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: accent }}>{result.currency || 'USD'} {result.threshold.toLocaleString()}</span>
                  </div>
                )}
                {result.dutyThreshold !== undefined && result.dutyThreshold !== result.threshold && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Duty-Free Threshold</span>
                    <span style={{ fontWeight: 700 }}>{result.currency || 'USD'} {result.dutyThreshold.toLocaleString()}</span>
                  </div>
                )}
                {result.taxThreshold !== undefined && result.taxThreshold !== result.threshold && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tax-Free Threshold</span>
                    <span style={{ fontWeight: 700 }}>{result.currency || 'USD'} {result.taxThreshold.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Your Product Value</span>
                  <span style={{ fontWeight: 700 }}>USD {parseFloat(productValue).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Duty-Free Eligible</span>
                  <span style={{ fontWeight: 700, color: result.dutyFreeEligible ? '#4ade80' : '#f87171' }}>
                    {result.dutyFreeEligible ? 'Yes' : 'No'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tax-Free Eligible</span>
                  <span style={{ fontWeight: 700, color: result.taxFreeEligible ? '#4ade80' : '#f87171' }}>
                    {result.taxFreeEligible ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Special rules */}
            {result.specialRules && result.specialRules.length > 0 && (
              <div style={{ background: 'rgba(232,100,10,0.06)', borderRadius: 12, padding: 16, border: '1px solid rgba(232,100,10,0.2)', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 10 }}>Special Rules</div>
                {result.specialRules.map((rule, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid rgba(232,100,10,0.4)' }}>{rule}</div>
                ))}
              </div>
            )}

            {(result.notes || result.recommendation) && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {result.recommendation || result.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
