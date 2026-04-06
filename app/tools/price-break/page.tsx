'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface PriceTier {
  minUnits: number;
  maxUnits?: number;
  dutyRate: number;
  dutyAmount: number;
  savings: number;
  savingsPercent: number;
  label?: string;
}

interface PriceBreakResult {
  hsCode?: string;
  destinationCountry?: string;
  baseDutyRate?: number;
  tiers?: PriceTier[];
  optimalQuantity?: number;
  optimalTier?: PriceTier;
  currency?: string;
  notes?: string;
}

export default function PriceBreakPage() {
  const [hsCode, setHsCode] = useState('');
  const [destCountry, setDestCountry] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [units, setUnits] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceBreakResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!hsCode.trim() || !destCountry.trim() || !totalValue.trim()) {
      setError('Please fill in HS code, destination country, and shipment value.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'price-break',
          hsCode: hsCode.trim(),
          destinationCountry: destCountry.trim().toUpperCase(),
          totalShipmentValue: parseFloat(totalValue),
          numberOfUnits: units ? parseInt(units) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Calculation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmt = (r: number) => `${(r * 100).toFixed(2)}%`;
  const maxSavings = result?.tiers ? Math.max(...result.tiers.map(t => t.savings)) : 0;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TRADE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Price Break Rules</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Discover volume-based duty savings tiers and find the optimal order quantity for your shipment.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code *</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 8471300000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country *</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. US, DE, AU" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Total Shipment Value (USD) *</label>
            <input value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="e.g. 50000" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Number of Units</label>
            <input value={units} onChange={e => setUnits(e.target.value)} placeholder="e.g. 500" type="number" min="1" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !hsCode.trim() || !destCountry.trim() || !totalValue.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Calculating...' : 'Calculate Price Breaks'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Summary */}
            {result.baseDutyRate !== undefined && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Base Duty Rate</div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{fmt(result.baseDutyRate)}</div>
                </div>
                {result.optimalQuantity && (
                  <div style={{ flex: 1, background: 'rgba(232,100,10,0.1)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(232,100,10,0.25)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Optimal Qty</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: accent }}>{result.optimalQuantity.toLocaleString()} units</div>
                  </div>
                )}
                {maxSavings > 0 && (
                  <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Max Savings</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#4ade80' }}>{fmtUSD(maxSavings)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Tiers table */}
            {result.tiers && result.tiers.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                  <span>Volume Tier</span><span style={{ textAlign: 'right' }}>Duty Rate</span><span style={{ textAlign: 'right' }}>Duty Amount</span><span style={{ textAlign: 'right' }}>Savings</span><span style={{ textAlign: 'right' }}>Save %</span>
                </div>
                {result.tiers.map((tier, i) => {
                  const isOptimal = result.optimalQuantity !== undefined && tier.minUnits <= result.optimalQuantity && (!tier.maxUnits || tier.maxUnits >= result.optimalQuantity);
                  return (
                    <div key={i} style={{
                      padding: '14px 18px',
                      borderBottom: i < result.tiers!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: isOptimal ? 'rgba(232,100,10,0.08)' : 'transparent',
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {tier.label || `${tier.minUnits.toLocaleString()}${tier.maxUnits ? `–${tier.maxUnits.toLocaleString()}` : '+'} units`}
                          {isOptimal && <span style={{ fontSize: 9, padding: '2px 6px', background: accent, borderRadius: 4, color: 'white', fontWeight: 800 }}>BEST</span>}
                        </div>
                        {/* Savings bar */}
                        <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${maxSavings > 0 ? (tier.savings / maxSavings) * 100 : 0}%`, background: isOptimal ? accent : 'rgba(255,255,255,0.2)', borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{fmt(tier.dutyRate)}</div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{fmtUSD(tier.dutyAmount)}</div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: tier.savings > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                        {tier.savings > 0 ? fmtUSD(tier.savings) : '—'}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: tier.savingsPercent > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                        {tier.savingsPercent > 0 ? `${tier.savingsPercent.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  );
                })}
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
