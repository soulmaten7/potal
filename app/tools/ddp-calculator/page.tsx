'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface CostBreakdown {
  label: string;
  amount: number;
  included: boolean;
}

interface DDPResult {
  ddp?: {
    total: number;
    breakdown?: CostBreakdown[];
    buyerPays?: number;
    sellerPays?: number;
  };
  ddu?: {
    total: number;
    breakdown?: CostBreakdown[];
    buyerPays?: number;
    sellerPays?: number;
  };
  currency?: string;
  recommendation?: string;
  savings?: number;
  productValue?: number;
  dutyRate?: number;
  vatRate?: number;
}

export default function DDPCalculatorPage() {
  const [productValue, setProductValue] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [weight, setWeight] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destCountry, setDestCountry] = useState('DE');
  const [shippingCost, setShippingCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DDPResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productValue.trim() || !destCountry.trim()) {
      setError('Please fill in product value and destination country.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/calculate/ddp-vs-ddu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productValue: parseFloat(productValue),
          hsCode: hsCode.trim() || undefined,
          weight: weight ? parseFloat(weight) : undefined,
          originCountry: originCountry.trim().toUpperCase(),
          destinationCountry: destCountry.trim().toUpperCase(),
          shippingCost: shippingCost ? parseFloat(shippingCost) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Calculation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(n);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COST CALCULATOR</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>DDP vs DDU Cost Comparison</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Compare Delivered Duty Paid vs Delivered Duty Unpaid total costs including duties, taxes and fees.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Value (USD) *</label>
            <input value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="e.g. 500" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. US, CN, KR" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country *</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. DE, GB, AU" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code (optional)</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 8518300000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Weight kg (optional)</label>
            <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 1.5" type="number" min="0" step="0.1" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Shipping Cost USD (optional)</label>
            <input value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="e.g. 25" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Calculating...' : 'Compare DDP vs DDU'}
        </button>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Recommendation banner */}
            {result.recommendation && (
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(232,100,10,0.12)', border: '1px solid rgba(232,100,10,0.3)', borderRadius: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                {result.recommendation}
              </div>
            )}

            {/* Comparison table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {(['ddp', 'ddu'] as const).map(type => {
                const data = result[type];
                if (!data) return null;
                const isDDP = type === 'ddp';
                return (
                  <div key={type} style={{
                    background: isDDP ? 'rgba(232,100,10,0.1)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isDDP ? 'rgba(232,100,10,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 14, padding: 20,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDDP ? accent : 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>
                      {isDDP ? 'DDP — Seller Handles' : 'DDU — Buyer Handles'}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: isDDP ? accent : 'white', marginBottom: 16 }}>
                      {fmt(data.total, result.currency)}
                    </div>
                    {data.sellerPays !== undefined && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                        Seller pays: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{fmt(data.sellerPays, result.currency)}</span>
                      </div>
                    )}
                    {data.buyerPays !== undefined && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                        Buyer pays: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{fmt(data.buyerPays, result.currency)}</span>
                      </div>
                    )}
                    {data.breakdown && data.breakdown.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                        {data.breakdown.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                            <span style={{ color: item.included ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                              {item.included ? fmt(item.amount, result.currency) : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rates info */}
            {(result.dutyRate !== undefined || result.vatRate !== undefined) && (
              <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {result.dutyRate !== undefined && (
                  <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 13 }}>
                    Duty Rate: <span style={{ fontWeight: 700, color: accent }}>{(result.dutyRate * 100).toFixed(1)}%</span>
                  </div>
                )}
                {result.vatRate !== undefined && (
                  <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 13 }}>
                    VAT/GST: <span style={{ fontWeight: 700, color: accent }}>{(result.vatRate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
