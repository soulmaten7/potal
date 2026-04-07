'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' }, { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' }, { code: 'NL', name: 'Netherlands' }, { code: 'IT', name: 'Italy' },
];

interface QuoteResult {
  quote?: {
    subtotal?: number;
    importDuty?: number;
    vat?: number;
    shippingCost?: number;
    insuranceCost?: number;
    processingFee?: number;
    totalLandedCost?: number;
    [key: string]: unknown;
  };
  pricingMode?: string;
  dutyCollectedAtCheckout?: boolean;
  customerFacingNote?: string;
}

export default function CheckoutPage() {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [shippingCost, setShippingCost] = useState('');
  const [pricingMode, setPricingMode] = useState('DDP');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productName.trim() || !price) { setError('Product name and price are required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/checkout?action=quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          originCountry: origin,
          destinationCountry: destination,
          items: [{ productName: productName.trim(), price: parseFloat(price), quantity: 1, ...(weight ? { weightKg: parseFloat(weight) } : {}) }],
          ...(shippingCost ? { shippingCost: parseFloat(shippingCost) } : {}),
          pricingMode,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Quote failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const q = result?.quote;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>INTEGRATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Checkout Integration Demo</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Preview a real checkout experience with duties, taxes, and total landed cost calculated in real-time.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Name</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Wireless Headphones" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Price ($)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="79.99" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Weight (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.5" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Shipping ($)</label>
              <input type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="8.50" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background: '#0a1e3d' }}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Mode</label>
              <select value={pricingMode} onChange={e => setPricingMode(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="DDP" style={{ background: '#0a1e3d' }}>DDP</option>
                <option value="DDU" style={{ background: '#0a1e3d' }}>DDU</option>
                <option value="DAP" style={{ background: '#0a1e3d' }}>DAP</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Calculating...' : 'Get Checkout Quote'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {q && (
          <div style={{ marginTop: 20, background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Checkout Preview</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{result?.pricingMode || 'DDP'}</span>
            </div>
            {[
              { label: 'Item Price', value: q.subtotal },
              { label: 'Import Duty', value: q.importDuty },
              { label: 'VAT / GST', value: q.vat },
              ...(q.shippingCost ? [{ label: 'Shipping', value: q.shippingCost }] : []),
              ...(q.processingFee ? [{ label: 'Processing Fee', value: q.processingFee }] : []),
            ].filter(r => r.value != null).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 14 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>${typeof row.value === 'number' ? row.value.toFixed(2) : row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(232,100,10,0.1)', fontSize: 16 }}>
              <span style={{ fontWeight: 700 }}>Total Landed Cost</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: accent }}>${typeof q.totalLandedCost === 'number' ? q.totalLandedCost.toFixed(2) : 'N/A'}</span>
            </div>
            {result?.customerFacingNote && (
              <div style={{ padding: '10px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.customerFacingNote}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
