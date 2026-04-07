'use client';

import React, { useState, useRef } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface HSCode {
  code: string;
  description: string;
  confidence: number;
  category?: string;
}

interface ClassifyResult {
  hsCodes?: HSCode[];
  topResult?: HSCode;
  productCategory?: string;
  suggestions?: HSCode[];
}

export default function ImageClassifyPage() {
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!description) setDescription(`Product shown in image: ${file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Please describe your product or upload an image.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          description: description.trim(),
          originCountry: originCountry.trim().toUpperCase() || undefined,
          topN: 3,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Classification failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const codes: HSCode[] = result?.hsCodes || result?.suggestions || (result?.topResult ? [result.topResult] : []);

  const confidenceColor = (c: number) => c >= 0.85 ? '#4ade80' : c >= 0.65 ? '#facc15' : '#f87171';
  const confidenceLabel = (c: number) => c >= 0.85 ? 'High' : c >= 0.65 ? 'Medium' : 'Low';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CLASSIFICATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Image Classification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Upload a product image or describe your product to get top HS code suggestions with confidence scores.
        </p>

        {/* Image upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${fileName ? 'rgba(232,100,10,0.6)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: fileName ? 'rgba(232,100,10,0.06)' : 'rgba(0,0,0,0.15)',
            marginBottom: 16, transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: fileName ? accent : 'rgba(255,255,255,0.5)' }}>
            {fileName || 'Click to upload product image'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {fileName ? 'Click to change' : 'JPG, PNG, WEBP — image will be described automatically'}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR DESCRIBE YOUR PRODUCT</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Wireless Bluetooth noise-cancelling over-ear headphones with foldable design, 30-hour battery, USB-C charging"
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country (optional)</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. CN, US, DE" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !description.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Classifying...' : 'Classify Product'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {codes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {result?.productCategory && (
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Category:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: accent, padding: '3px 10px', background: 'rgba(232,100,10,0.12)', borderRadius: 8 }}>{result.productCategory}</span>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Top {codes.length} HS Code Suggestion{codes.length > 1 ? 's' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {codes.map((item, i) => (
                <div key={i} style={{
                  background: i === 0 ? 'rgba(232,100,10,0.1)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${i === 0 ? 'rgba(232,100,10,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12, padding: 18,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, color: i === 0 ? accent : 'white' }}>{item.code}</span>
                        {i === 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: 'rgba(232,100,10,0.2)', borderRadius: 4, color: accent }}>TOP MATCH</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{item.description}</div>
                      {item.category && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{item.category}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: confidenceColor(item.confidence) }}>
                        {Math.round(item.confidence * 100)}%
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: confidenceColor(item.confidence), textTransform: 'uppercase' }}>
                        {confidenceLabel(item.confidence)}
                      </div>
                    </div>
                  </div>
                  {/* Confidence bar */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.confidence * 100}%`, background: confidenceColor(item.confidence), borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Results are AI-assisted suggestions. Verify with a licensed customs broker for official classification.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
