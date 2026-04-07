'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface EccnCandidate {
  eccn: string;
  description?: string;
  controlReasons?: string[];
  licenseExceptions?: string[];
}

interface EccnResult {
  productName?: string;
  exportControlStatus?: string;
  eccn?: { candidates?: EccnCandidate[]; precision?: string; note?: string };
  destinationAnalysis?: { country?: string; licenseRequired?: boolean; reason?: string; applicableExceptions?: string[]; countryGroup?: string };
  recommendations?: string[];
  scheduleB?: { code?: string; confidence?: string };
}

export default function ClassifyEccnPage() {
  const [productName, setProductName] = useState('');
  const [techSpecs, setTechSpecs] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EccnResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productName.trim()) { setError('Product description is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/classify/eccn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productName: productName.trim(),
          ...(techSpecs.trim() ? { technicalSpecs: techSpecs.trim() } : {}),
          ...(destination.trim() ? { destinationCountry: destination.trim().toUpperCase() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Classification failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const status = result?.exportControlStatus;
  const statusColor = status === 'EAR99' ? '#4ade80' : status === 'controlled' ? '#f87171' : '#facc15';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>ECCN Classification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Classify products under the EAR Commerce Control List. Get ECCN code, control reasons, and license requirements.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Description</label>
            <textarea value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Thermal imaging camera with 640x480 resolution" rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 48 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Technical Parameters <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={techSpecs} onChange={e => setTechSpecs(e.target.value)} placeholder="e.g. 30mK NETD, uncooled microbolometer" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>optional</span></label>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. CN, RU, IR" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Classifying...' : 'Classify ECCN'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            {/* Status banner */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '16px 20px', border: `1px solid ${statusColor}33`, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Export Control Status</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>{status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}</div>
              </div>
              {result.scheduleB?.code && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Schedule B</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: accent }}>{result.scheduleB.code}</div>
                </div>
              )}
            </div>

            {/* ECCN candidates */}
            {result.eccn?.candidates && result.eccn.candidates.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>ECCN Candidates</div>
                {result.eccn.candidates.map((c, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < result.eccn!.candidates!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15, color: accent }}>{c.eccn}</span>
                    </div>
                    {c.description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{c.description}</div>}
                    {c.controlReasons && c.controlReasons.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.controlReasons.map((r, j) => <span key={j} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>{r}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Destination analysis */}
            {result.destinationAnalysis && (
              <div style={{ background: result.destinationAnalysis.licenseRequired ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', borderRadius: 10, padding: 14, marginBottom: 12, border: `1px solid ${result.destinationAnalysis.licenseRequired ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>License for {result.destinationAnalysis.country}</span>
                  <span style={{ fontWeight: 700, color: result.destinationAnalysis.licenseRequired ? '#f87171' : '#4ade80' }}>{result.destinationAnalysis.licenseRequired ? 'REQUIRED' : 'NOT REQUIRED'}</span>
                </div>
                {result.destinationAnalysis.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{result.destinationAnalysis.reason}</div>}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Recommendations</div>
                {result.recommendations.map((r, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4, paddingLeft: 12 }}>{r}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
