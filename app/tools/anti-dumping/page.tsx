'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface DutyOrder {
  caseNumber?: string;
  productDescription?: string;
  adRate?: number;
  cvdRate?: number;
  effectiveDate?: string;
  status?: string;
}

interface AntiDumpingResult {
  antiDumpingRate?: number;
  countervailingDutyRate?: number;
  totalAdditionalDuty?: number;
  regularDutyRate?: number;
  totalDutyRate?: number;
  applicableOrders?: DutyOrder[];
  currency?: string;
  additionalDutyAmount?: number;
  totalDutyAmount?: number;
  productValue?: number;
  notes?: string;
}

export default function AntiDumpingPage() {
  const [hsCode, setHsCode] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destCountry, setDestCountry] = useState('US');
  const [productValue, setProductValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AntiDumpingResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!hsCode.trim() || !originCountry.trim()) {
      setError('Please fill in HS code and origin country.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'anti-dumping',
          hsCode: hsCode.trim(),
          originCountry: originCountry.trim().toUpperCase(),
          destinationCountry: destCountry.trim().toUpperCase(),
          productValue: productValue ? parseFloat(productValue) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Calculation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fmt = (rate: number) => `${(rate * 100).toFixed(2)}%`;
  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TRADE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Anti-dumping Duties</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check anti-dumping (AD) and countervailing duties (CVD) for your product. Covers US, EU, and major markets.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code *</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 7318159000, 8471300000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country *</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. CN, VN, IN" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. US, DE, GB" style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Value USD (optional — for duty amount)</label>
            <input value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="e.g. 10000" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !hsCode.trim() || !originCountry.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Checking...' : 'Check Anti-dumping Duties'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Rate cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Anti-dumping', value: result.antiDumpingRate, color: '#f87171' },
                { label: 'Countervailing', value: result.countervailingDutyRate, color: '#fbbf24' },
                { label: 'Total Additional', value: result.totalAdditionalDuty, color: accent },
              ].map(card => (
                <div key={card.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '16px 14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: (card.value ?? 0) > 0 ? card.color : '#4ade80' }}>
                    {card.value !== undefined ? fmt(card.value) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, textTransform: 'uppercase', fontWeight: 700 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Full duty breakdown */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 14 }}>Duty Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.regularDutyRate !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Regular Duty Rate</span>
                    <span style={{ fontWeight: 700 }}>{fmt(result.regularDutyRate)}</span>
                  </div>
                )}
                {result.antiDumpingRate !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Anti-dumping (AD)</span>
                    <span style={{ fontWeight: 700, color: result.antiDumpingRate > 0 ? '#f87171' : '#4ade80' }}>{fmt(result.antiDumpingRate)}</span>
                  </div>
                )}
                {result.countervailingDutyRate !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Countervailing (CVD)</span>
                    <span style={{ fontWeight: 700, color: result.countervailingDutyRate > 0 ? '#fbbf24' : '#4ade80' }}>{fmt(result.countervailingDutyRate)}</span>
                  </div>
                )}
                {result.totalDutyRate !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Total Effective Duty</span>
                    <span style={{ fontWeight: 800, color: accent }}>{fmt(result.totalDutyRate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dollar amounts if product value provided */}
            {productValue && result.totalDutyRate !== undefined && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {result.additionalDutyAmount !== undefined && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>AD/CVD Amount</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>{fmtUSD(result.additionalDutyAmount)}</div>
                  </div>
                )}
                {result.totalDutyAmount !== undefined && (
                  <div style={{ background: 'rgba(232,100,10,0.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(232,100,10,0.2)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Total Duty Amount</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{fmtUSD(result.totalDutyAmount)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Applicable orders */}
            {result.applicableOrders && result.applicableOrders.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 18, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Applicable Orders</div>
                {result.applicableOrders.map((order, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < result.applicableOrders!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{order.productDescription || `Order ${i + 1}`}</span>
                      {order.caseNumber && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{order.caseNumber}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      {order.adRate !== undefined && <span style={{ color: '#f87171' }}>AD: {fmt(order.adRate)}</span>}
                      {order.cvdRate !== undefined && <span style={{ color: '#fbbf24' }}>CVD: {fmt(order.cvdRate)}</span>}
                      {order.status && <span style={{ color: 'rgba(255,255,255,0.4)' }}>{order.status}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.notes && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{result.notes}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
