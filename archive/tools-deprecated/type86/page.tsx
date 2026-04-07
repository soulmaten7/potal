'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface Type86Result {
  eligible?: boolean;
  entryType?: string;
  reason?: string;
  restrictions?: string[];
  alternativeEntry?: string | null;
  deMinimis?: { threshold?: number; currency?: string; notes?: string };
  declaredValue?: number;
  originCountry?: string;
  hsCode?: string | null;
  estimatedDuty?: number;
  estimatedDutyNote?: string;
}

export default function Type86Page() {
  const [value, setValue] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [hsCode, setHsCode] = useState('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Type86Result | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!value) { setError('Declared value is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/customs/type86', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          declaredValue: parseFloat(value),
          originCountry: origin,
          ...(hsCode.trim() ? { hsCode: hsCode.trim() } : {}),
          ...(productName.trim() ? { productName: productName.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CUSTOMS TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Type 86 Entry Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check Section 321 de minimis eligibility for US-bound shipments. Determine if Type 86 informal entry applies.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Declared Value (USD)</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 450" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. CN" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Name <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Cotton T-Shirt" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Checking...' : 'Check Type 86 Eligibility'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              borderRadius: 14, padding: 24, textAlign: 'center', marginBottom: 12,
              background: result.eligible ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
              border: `1px solid ${result.eligible ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: result.eligible ? '#4ade80' : '#facc15', marginBottom: 4 }}>
                {result.eligible ? 'TYPE 86 ELIGIBLE' : 'FORMAL ENTRY REQUIRED'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{result.entryType?.toUpperCase()}</div>
              {result.reason && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{result.reason}</div>}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
              {[
                { label: 'Declared Value', value: `$${result.declaredValue?.toFixed(2) || '0.00'}` },
                { label: 'De Minimis Threshold', value: result.deMinimis ? `$${result.deMinimis.threshold} ${result.deMinimis.currency || 'USD'}` : 'N/A' },
                { label: 'Origin', value: result.originCountry || 'N/A' },
                ...(result.hsCode ? [{ label: 'HS Code', value: result.hsCode }] : []),
                { label: 'Estimated Duty', value: `$${result.estimatedDuty?.toFixed(2) || '0.00'}` },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {result.restrictions && result.restrictions.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Restrictions</div>
                {result.restrictions.map((r, i) => <div key={i} style={{ fontSize: 13, color: '#fca5a5', marginBottom: 2 }}>{r}</div>)}
              </div>
            )}

            {result.deMinimis?.notes && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{result.deMinimis.notes}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
