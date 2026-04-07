'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CARRIERS = ['DHL Express', 'FedEx International', 'UPS Worldwide', 'USPS Priority Mail International'];

interface LabelResult {
  trackingNumber?: string;
  carrier?: string;
  labelFormat?: string;
  customsDeclaration?: { hsCode?: string; description?: string; value?: number; currency?: string; originCountry?: string };
  estimatedDelivery?: string;
  shippingCost?: number;
}

export default function LabelGenerationPage() {
  const [fromName, setFromName] = useState('');
  const [fromCountry, setFromCountry] = useState('US');
  const [fromCity, setFromCity] = useState('');
  const [toName, setToName] = useState('');
  const [toCountry, setToCountry] = useState('DE');
  const [toCity, setToCity] = useState('');
  const [weight, setWeight] = useState('1.5');
  const [length, setLength] = useState('30');
  const [width, setWidth] = useState('20');
  const [height, setHeight] = useState('10');
  const [carrier, setCarrier] = useState('DHL Express');
  const [productDesc, setProductDesc] = useState('');
  const [declaredValue, setDeclaredValue] = useState('50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabelResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!fromName.trim() || !toName.trim()) { setError('Sender and recipient names are required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          from: { name: fromName.trim(), country: fromCountry, city: fromCity.trim() },
          to: { name: toName.trim(), country: toCountry, city: toCity.trim() },
          package: { weight: parseFloat(weight) || 1, length: parseFloat(length) || 30, width: parseFloat(width) || 20, height: parseFloat(height) || 10 },
          carrier,
          customs: { description: productDesc.trim(), declaredValue: parseFloat(declaredValue) || 0 },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Label generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SHIPPING TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Shipping Labels</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Generate international shipping labels with customs declarations.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>From (Sender)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 10, marginBottom: 16 }}>
            <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Sender name" style={inputStyle} />
            <select value={fromCountry} onChange={e => setFromCountry(e.target.value)} style={inputStyle}>
              {['US','CN','DE','GB','JP','KR','FR','CA','AU','VN','IN','IT'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={fromCity} onChange={e => setFromCity(e.target.value)} placeholder="City" style={inputStyle} />
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>To (Recipient)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 10 }}>
            <input value={toName} onChange={e => setToName(e.target.value)} placeholder="Recipient name" style={inputStyle} />
            <select value={toCountry} onChange={e => setToCountry(e.target.value)} style={inputStyle}>
              {['US','CN','DE','GB','JP','KR','FR','CA','AU','VN','IN','IT','BR','MX'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={toCity} onChange={e => setToCity(e.target.value)} placeholder="City" style={inputStyle} />
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Package & Carrier</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Weight (kg)</label><input value={weight} onChange={e => setWeight(e.target.value)} type="number" style={inputStyle} /></div>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>L (cm)</label><input value={length} onChange={e => setLength(e.target.value)} type="number" style={inputStyle} /></div>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>W (cm)</label><input value={width} onChange={e => setWidth(e.target.value)} type="number" style={inputStyle} /></div>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>H (cm)</label><input value={height} onChange={e => setHeight(e.target.value)} type="number" style={inputStyle} /></div>
          </div>
          <select value={carrier} onChange={e => setCarrier(e.target.value)} style={inputStyle}>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Customs Declaration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <input value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="Product description" style={inputStyle} />
            <input value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} placeholder="Value (USD)" type="number" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Generating...' : 'Generate Shipping Label'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>Label Generated</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.carrier && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Carrier</span><span style={{ fontWeight: 600 }}>{result.carrier}</span></div>}
              {result.trackingNumber && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tracking</span><span style={{ fontFamily: 'monospace', color: accent }}>{result.trackingNumber}</span></div>}
              {result.estimatedDelivery && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Est. Delivery</span><span>{result.estimatedDelivery}</span></div>}
              {result.shippingCost !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Shipping Cost</span><span style={{ color: accent, fontWeight: 700 }}>${result.shippingCost.toFixed(2)}</span></div>}
            </div>
            {result.customsDeclaration && (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Customs Declaration</h4>
                <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result.customsDeclaration, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
