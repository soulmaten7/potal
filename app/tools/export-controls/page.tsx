'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface EccnResult {
  eccn_classification?: {
    eccn?: string;
    ear99?: boolean;
    category?: string;
    description?: string;
    reason?: string;
    control_reasons?: string[];
  };
  license_determination?: {
    license_required?: boolean;
    license_type?: string;
    reason?: string;
    exceptions?: string[];
  } | null;
}

export default function ExportControlsPage() {
  const [productName, setProductName] = useState('');
  const [destination, setDestination] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EccnResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productName.trim() && !hsCode.trim()) { setError('Enter a product name or HS code.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/export-controls/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          ...(productName.trim() ? { product_name: productName.trim() } : {}),
          ...(hsCode.trim() ? { hs_code: hsCode.trim() } : {}),
          ...(destination.trim() ? { destination: destination.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Classification failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const eccn = result?.eccn_classification;
  const lic = result?.license_determination;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Export Controls Classification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Classify products under EAR (ECCN) and determine export license requirements.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Name</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. GPS receiver, encryption software" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 852691" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination (optional)</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. CN, RU" style={inputStyle} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Classifying...' : 'Classify'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {eccn && (
          <div style={{ marginTop: 20, background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>ECCN</span>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: eccn.ear99 ? '#4ade80' : accent }}>
                {eccn.ear99 ? 'EAR99' : eccn.eccn || 'N/A'}
              </span>
            </div>
            {eccn.category && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Category</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{eccn.category}</span>
              </div>
            )}
            {eccn.description && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {eccn.description}
              </div>
            )}
            {eccn.control_reasons && eccn.control_reasons.length > 0 && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Control Reasons</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {eccn.control_reasons.map((r, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {lic && (
              <div style={{ padding: '14px 20px', background: lic.license_required ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>License Required</span>
                  <span style={{ fontWeight: 700, color: lic.license_required ? '#f87171' : '#4ade80' }}>
                    {lic.license_required ? 'YES' : 'NO'}
                  </span>
                </div>
                {lic.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{lic.reason}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
