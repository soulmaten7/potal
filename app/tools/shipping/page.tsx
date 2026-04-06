'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface ShippingRate {
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimatedDays?: number;
  transitTime?: string;
  includes?: string[];
  recommended?: boolean;
}

interface ShippingResult {
  rates?: ShippingRate[];
  cheapest?: ShippingRate;
  fastest?: ShippingRate;
  currency?: string;
  originCountry?: string;
  destinationCountry?: string;
}

export default function ShippingPage() {
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destCountry, setDestCountry] = useState('DE');
  const [originPostal, setOriginPostal] = useState('');
  const [destPostal, setDestPostal] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!weight.trim() || !originCountry.trim() || !destCountry.trim()) {
      setError('Please fill in weight, origin, and destination country.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          weight: parseFloat(weight),
          dimensions: (length && width && height)
            ? { length: parseFloat(length), width: parseFloat(width), height: parseFloat(height) }
            : undefined,
          originCountry: originCountry.trim().toUpperCase(),
          destinationCountry: destCountry.trim().toUpperCase(),
          originPostalCode: originPostal.trim() || undefined,
          destinationPostalCode: destPostal.trim() || undefined,
          declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to fetch shipping rates.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(n);

  const carrierColor: Record<string, string> = {
    DHL: '#FFCC00',
    FedEx: '#FF6600',
    UPS: '#5C4A1E',
    USPS: '#004B87',
    TNT: '#F4371C',
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SHIPPING TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Shipping Rate Comparison</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Compare rates across DHL, FedEx, UPS, and more for international shipments.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Weight (kg) *</label>
            <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 2.5" type="number" min="0.01" step="0.1" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country *</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. US, CN, KR" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country *</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. DE, GB, AU" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Postal Code</label>
            <input value={originPostal} onChange={e => setOriginPostal(e.target.value)} placeholder="e.g. 10001" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Postal Code</label>
            <input value={destPostal} onChange={e => setDestPostal(e.target.value)} placeholder="e.g. 10115" style={inputStyle} />
          </div>
        </div>

        {/* Dimensions (optional) */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Dimensions cm (optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input value={length} onChange={e => setLength(e.target.value)} placeholder="L" type="number" min="0" style={inputStyle} />
            <input value={width} onChange={e => setWidth(e.target.value)} placeholder="W" type="number" min="0" style={inputStyle} />
            <input value={height} onChange={e => setHeight(e.target.value)} placeholder="H" type="number" min="0" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Declared Value USD (optional)</label>
          <input value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} placeholder="e.g. 200" type="number" min="0" step="0.01" style={inputStyle} />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Fetching rates...' : 'Compare Shipping Rates'}
        </button>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {result.cheapest && (
                <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#4ade80', marginBottom: 6 }}>Cheapest</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>{fmt(result.cheapest.price, result.cheapest.currency || result.currency)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{result.cheapest.carrier} {result.cheapest.service}</div>
                </div>
              )}
              {result.fastest && result.fastest.carrier !== result.cheapest?.carrier && (
                <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 6 }}>Fastest</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#a5b4fc' }}>{fmt(result.fastest.price, result.fastest.currency || result.currency)}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {result.fastest.carrier} — {result.fastest.transitTime || `${result.fastest.estimatedDays}d`}
                  </div>
                </div>
              )}
            </div>

            {/* All rates */}
            {result.rates && result.rates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.rates.sort((a, b) => a.price - b.price).map((rate, i) => (
                  <div key={i} style={{
                    background: rate.recommended ? 'rgba(232,100,10,0.1)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${rate.recommended ? 'rgba(232,100,10,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, background: carrierColor[rate.carrier] ? `${carrierColor[rate.carrier]}20` : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: carrierColor[rate.carrier] || 'rgba(255,255,255,0.7)', textAlign: 'center',
                      }}>
                        {rate.carrier}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{rate.service}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {rate.transitTime || (rate.estimatedDays ? `${rate.estimatedDays} business days` : 'Transit time TBD')}
                        </div>
                        {rate.includes && rate.includes.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            {rate.includes.map((inc, j) => (
                              <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{inc}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: rate.recommended ? accent : 'white' }}>
                        {fmt(rate.price, rate.currency || result.currency)}
                      </div>
                      {rate.recommended && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginTop: 2 }}>RECOMMENDED</div>
                      )}
                    </div>
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
