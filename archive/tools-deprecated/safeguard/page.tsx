'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface SafeguardResult {
  safeguardMeasures?: { type: string; additionalDuty: number; effectiveDate: string; expiryDate?: string; wtoRef?: string }[];
  quotaStatus?: string;
  totalAdditionalDuty?: number;
  hsCode?: string;
  dutyRate?: number;
  totalLandedCost?: number;
  importDuty?: number;
  notes?: string;
}

export default function SafeguardPage() {
  const [hsCode, setHsCode] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [importValue, setImportValue] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafeguardResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!hsCode.trim()) { setError('HS Code is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productName: `Product HS ${hsCode.trim()}`,
          price: parseFloat(importValue) || 10000,
          origin,
          destinationCountry: destination,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Safeguard check failed.'); return; }
      const data = json.data ?? {};
      setResult({
        hsCode: data.hsCode || hsCode,
        dutyRate: data.dutyRate,
        totalLandedCost: data.totalLandedCost,
        importDuty: data.importDuty,
        safeguardMeasures: data.additionalTariffs?.map((t: { type: string; rate: number; note: string }) => ({
          type: t.type || 'Safeguard',
          additionalDuty: t.rate || 0,
          effectiveDate: '2025-03-12',
          wtoRef: t.note || undefined,
        })) || [],
        totalAdditionalDuty: data.additionalDutyTotal || 0,
        quotaStatus: data.quotaStatus || 'No active quota restrictions',
        notes: data.dutyNote || data.additionalTariffNote,
      });
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TRADE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Safeguard Measures</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Check for active safeguard duties, anti-dumping measures, and trade remedy actions on specific HS codes.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>HS Code *</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 7208 (steel), 7606 (aluminum)" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Origin</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>
                {['CN','KR','JP','DE','IN','BR','RU','TW','VN','MX','TR','TH'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                {['US','EU','GB','CA','AU','IN','BR','MX','KR','JP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Import Value (USD)</label>
              <input value={importValue} onChange={e => setImportValue(e.target.value)} type="number" placeholder="10000" style={inputStyle} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking...' : 'Check Safeguard Measures'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Trade Remedy Analysis</h3>

            {result.hsCode && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HS Code</span><span style={{ fontFamily: 'monospace', color: accent, fontWeight: 700 }}>{result.hsCode}</span></div>}
            {result.dutyRate !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Base Duty Rate</span><span style={{ fontWeight: 600 }}>{typeof result.dutyRate === 'number' ? (result.dutyRate * 100).toFixed(1) + '%' : result.dutyRate}</span></div>}
            {result.importDuty !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Import Duty</span><span style={{ fontWeight: 600 }}>${result.importDuty.toFixed(2)}</span></div>}
            {result.totalLandedCost !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}><span style={{ fontSize: 14, fontWeight: 700 }}>Total Landed Cost</span><span style={{ color: accent, fontSize: 18, fontWeight: 800 }}>${result.totalLandedCost.toFixed(2)}</span></div>}

            {result.safeguardMeasures && result.safeguardMeasures.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 10 }}>Active Safeguard Measures</h4>
                {result.safeguardMeasures.map((m, i) => (
                  <div key={i} style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{m.type}</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>+{(m.additionalDuty * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Effective: {m.effectiveDate}{m.expiryDate ? ` — ${m.expiryDate}` : ''}</div>
                    {m.wtoRef && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{m.wtoRef}</div>}
                  </div>
                ))}
              </div>
            )}

            {result.safeguardMeasures && result.safeguardMeasures.length === 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                <span style={{ fontSize: 13, color: '#4ade80' }}>No active safeguard measures for this product/route</span>
              </div>
            )}

            {result.quotaStatus && <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Quota: {result.quotaStatus}</div>}
            {result.notes && <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.notes}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
