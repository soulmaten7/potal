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

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' }, { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GR', name: 'Greece' },
  { code: 'HR', name: 'Croatia' }, { code: 'HU', name: 'Hungary' }, { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' }, { code: 'MT', name: 'Malta' }, { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' },
  { code: 'SE', name: 'Sweden' }, { code: 'SI', name: 'Slovenia' }, { code: 'SK', name: 'Slovakia' },
];

interface IOSSResult {
  eligible?: boolean;
  reason?: string;
  vatRate?: number;
  vatAmount?: number;
  productValue?: number;
  currency?: string;
  withIOSS?: {
    total: number;
    buyerPays: number;
    vatCollectedAtCheckout: number;
  };
  withoutIOSS?: {
    total: number;
    buyerPays: number;
    customsFee?: number;
    vatOnImport: number;
  };
  savings?: number;
  recommendation?: string;
}

export default function IOSSPage() {
  const [productValue, setProductValue] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destCountry, setDestCountry] = useState('DE');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IOSSResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productValue.trim()) { setError('Please enter the product value.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'ioss',
          price: parseFloat(productValue),
          currency: 'EUR',
          originCountry: originCountry.trim().toUpperCase() || undefined,
          destinationCountry: destCountry,
          productCategory: category,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Calculation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fmtEUR = (n: number) => `€${n.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TAX TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>IOSS Calculator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Calculate EU Import One-Stop Shop (IOSS) VAT for B2C shipments under €150. Compare costs with and without IOSS registration.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Value (EUR) *</label>
            <input value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="e.g. 89.99 — must be under €150 for IOSS" type="number" min="0" step="0.01" style={inputStyle} />
            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>IOSS applies to consignments ≤ €150 from outside the EU</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin (non-EU)</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. CN, US, GB, KR" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination EU Country</label>
            <select value={destCountry} onChange={e => setDestCountry(e.target.value)} style={selectStyle}>
              {EU_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
              <option value="general">General Merchandise</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing &amp; Accessories</option>
              <option value="books">Books &amp; Media (reduced rate)</option>
              <option value="food">Food &amp; Beverages</option>
              <option value="cosmetics">Cosmetics</option>
              <option value="sports">Sports &amp; Outdoor</option>
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !productValue.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Calculating...' : 'Calculate IOSS VAT'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Eligibility badge */}
            <div style={{
              background: result.eligible ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${result.eligible ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 24 }}>{result.eligible ? '✓' : '✗'}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: result.eligible ? '#4ade80' : '#f87171' }}>
                  {result.eligible ? 'IOSS ELIGIBLE' : 'NOT IOSS ELIGIBLE'}
                </div>
                {(result.reason || !result.eligible) && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {result.reason || 'Shipment value exceeds €150 threshold'}
                  </div>
                )}
              </div>
            </div>

            {/* VAT info */}
            {result.vatRate !== undefined && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>VAT Rate ({destCountry})</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{(result.vatRate * 100).toFixed(0)}%</div>
                </div>
                {result.vatAmount !== undefined && (
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>VAT Amount</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{fmtEUR(result.vatAmount)}</div>
                  </div>
                )}
              </div>
            )}

            {/* With IOSS vs Without IOSS comparison */}
            {(result.withIOSS || result.withoutIOSS) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {result.withIOSS && (
                  <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#4ade80', marginBottom: 12 }}>With IOSS ✓</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80', marginBottom: 10 }}>{fmtEUR(result.withIOSS.total)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                      Buyer pays: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{fmtEUR(result.withIOSS.buyerPays)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      VAT at checkout: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{fmtEUR(result.withIOSS.vatCollectedAtCheckout)}</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: '#4ade80' }}>No customs delays · Seamless buyer experience</div>
                  </div>
                )}
                {result.withoutIOSS && (
                  <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#f87171', marginBottom: 12 }}>Without IOSS ✗</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171', marginBottom: 10 }}>{fmtEUR(result.withoutIOSS.total)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                      Buyer pays: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{fmtEUR(result.withoutIOSS.buyerPays)}</span>
                    </div>
                    {result.withoutIOSS.customsFee !== undefined && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                        Customs handling: <span style={{ color: '#fca5a5', fontWeight: 600 }}>{fmtEUR(result.withoutIOSS.customsFee)}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      VAT on import: <span style={{ color: '#fca5a5', fontWeight: 600 }}>{fmtEUR(result.withoutIOSS.vatOnImport)}</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: '#f87171' }}>Customs clearance delay · Poor buyer experience</div>
                  </div>
                )}
              </div>
            )}

            {result.savings !== undefined && result.savings > 0 && (
              <div style={{ padding: '12px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Buyer saves with IOSS</span>
                <span style={{ fontWeight: 800, color: '#4ade80', fontSize: 16 }}>{fmtEUR(result.savings)}</span>
              </div>
            )}

            {result.recommendation && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{result.recommendation}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
