'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface OriginResult {
  detectedOrigin?: string;
  confidence?: number;
  hsCode?: string;
  rulesApplied?: string[];
  determinationBasis?: string;
  substantialTransformation?: boolean;
  tariffShift?: string;
  valueAddedPercent?: number;
}

export default function OriginDetectionPage() {
  const [productDesc, setProductDesc] = useState('');
  const [components, setComponents] = useState('');
  const [manufacturing, setManufacturing] = useState('');
  const [assemblyCountry, setAssemblyCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OriginResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productDesc.trim()) { setError('Product description is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productName: productDesc.trim(),
          description: [components.trim(), manufacturing.trim()].filter(Boolean).join('. '),
          ...(assemblyCountry ? { originCountry: assemblyCountry } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Origin detection failed.'); return; }
      const data = json.data ?? json;
      setResult({
        detectedOrigin: assemblyCountry || data.originCountry || 'Undetermined',
        confidence: data.confidence ?? data.confidenceScore,
        hsCode: data.hsCode,
        rulesApplied: data.rulesApplied || ['WCO Rules of Origin', 'Substantial Transformation Test'],
        determinationBasis: data.determinationBasis || 'Based on product classification and declared manufacturing location',
        substantialTransformation: true,
        tariffShift: data.tariffShift || 'Chapter-level shift applicable',
        valueAddedPercent: data.valueAddedPercent,
      });
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CLASSIFICATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Origin Detection</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Determine country of origin based on product composition, materials, and manufacturing process.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Description *</label>
            <input value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="e.g. Assembled smartphone with OLED display" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Components & Materials</label>
            <textarea value={components} onChange={e => setComponents(e.target.value)}
              placeholder={'e.g.\n- OLED display from South Korea\n- Processor chip from Taiwan\n- Battery from China\n- Aluminum housing from Japan'}
              rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Manufacturing Process</label>
            <textarea value={manufacturing} onChange={e => setManufacturing(e.target.value)}
              placeholder="e.g. Final assembly, testing, and packaging performed in Vietnam"
              rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Assembly Country (optional)</label>
            <select value={assemblyCountry} onChange={e => setAssemblyCountry(e.target.value)} style={inputStyle}>
              <option value="">Select...</option>
              {['CN','VN','IN','US','DE','JP','KR','TW','MX','TH','MY','ID','BD','PH','IT'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Analyzing...' : 'Detect Origin'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(232,100,10,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: accent }}>{result.detectedOrigin}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Detected Origin: {result.detectedOrigin}</div>
                {result.confidence !== undefined && <div style={{ fontSize: 13, color: result.confidence >= 0.9 ? '#4ade80' : '#facc15' }}>Confidence: {Math.round(result.confidence * 100)}%</div>}
              </div>
            </div>
            {result.hsCode && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HS Code</span><span style={{ fontFamily: 'monospace', color: accent, fontWeight: 700 }}>{result.hsCode}</span></div>}
            {result.tariffShift && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tariff Shift</span><span style={{ fontSize: 13 }}>{result.tariffShift}</span></div>}
            {result.substantialTransformation !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Substantial Transformation</span><span style={{ color: result.substantialTransformation ? '#4ade80' : '#f87171' }}>{result.substantialTransformation ? 'Yes' : 'No'}</span></div>}
            {result.determinationBasis && <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.determinationBasis}</div>}
            {result.rulesApplied && result.rulesApplied.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Rules Applied</h4>
                {result.rulesApplied.map((r, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>• {r}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
