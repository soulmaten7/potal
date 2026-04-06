'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ClassifyResult {
  hsCode: string;
  description: string;
  confidence: number;
  classificationSource: string;
  chapter: string;
  alternatives?: { hsCode: string; description: string; confidence: number }[];
}

export default function HsLookupPage() {
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!productName.trim()) { setError('Product name is required.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          productName: productName.trim(),
          ...(material.trim() ? { material: material.trim() } : {}),
          ...(category.trim() ? { category: category.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Classification failed');
        return;
      }
      setResult(json.data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
    marginBottom: 6, textTransform: 'uppercase',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1e3d' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px 80px' }}>
        <Link href="/tools" style={{ color: '#E8640A', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← All Tools</Link>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>HS Code Lookup</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
          Classify your product and get the correct HS Code with confidence scoring.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Product Name *</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Cotton T-Shirt" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Material</label>
              <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g. cotton" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. apparel" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Short-sleeve crew neck t-shirt" style={inputStyle} />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#E8640A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Classifying...' : 'Classify Product'}
          </button>
        </div>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Classification Result</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>HS Code</span>
                <span style={{ color: '#E8640A', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{result.hsCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Confidence</span>
                <span style={{ color: result.confidence >= 0.9 ? '#4ade80' : '#facc15', fontSize: 14, fontWeight: 700 }}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Method</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{result.classificationSource}</span>
              </div>
              {result.description && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                  {result.description}
                </div>
              )}
            </div>
            {result.alternatives && result.alternatives.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Alternative Classifications</h3>
                {result.alternatives.map((alt, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{alt.hsCode}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 8 }}>{alt.description?.substring(0, 60)}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{Math.round(alt.confidence * 100)}%</span>
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
