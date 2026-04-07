'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface HSResult {
  code: string;
  description: string;
  confidence: number;
  reasoning?: string;
  chapter?: string;
  heading?: string;
}

interface ConfidenceResult {
  results?: HSResult[];
  topResult?: HSResult;
  overallConfidence?: number;
  breakdown?: { factor: string; score: number; weight: number }[];
  productCategory?: string;
  description?: string;
}

const confColor = (c: number) => {
  if (c >= 0.9) return '#4ade80';
  if (c >= 0.75) return '#86efac';
  if (c >= 0.6) return '#facc15';
  if (c >= 0.45) return '#fb923c';
  return '#f87171';
};

const confLabel = (c: number) => {
  if (c >= 0.9) return 'Very High';
  if (c >= 0.75) return 'High';
  if (c >= 0.6) return 'Medium';
  if (c >= 0.45) return 'Low';
  return 'Very Low';
};

const EXAMPLES = [
  'Wireless Bluetooth noise-cancelling over-ear headphones with USB-C, 30h battery',
  'Men\'s 100% cotton woven dress shirt, long sleeve, button-front',
  'Industrial servo motor, 3-phase, 5kW, 400V, IP55 protection class',
  'Frozen Atlantic salmon fillets, skin-on, individually vacuum-packed, 200g each',
];

export default function ConfidencePage() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConfidenceResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (desc?: string) => {
    const d = desc ?? description;
    if (!d.trim()) { setError('Please describe your product.'); return; }
    setLoading(true); setError(''); setResult(null);
    if (desc) setDescription(desc);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ description: d.trim(), topN: 5, includeConfidence: true, includeReasoning: true }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Classification failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const codes: HSResult[] = result?.results ?? (result?.topResult ? [result.topResult] : []);
  const overallConf = result?.overallConfidence ?? (codes[0]?.confidence);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CLASSIFICATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Confidence Score Demo</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 28, fontSize: 15 }}>
          See how POTAL&apos;s AI rates confidence for each HS code suggestion with per-factor breakdown and reasoning.
        </p>

        {/* Example chips */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Try an example</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => handleSubmit(ex)} style={{
                padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer',
                maxWidth: 220, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{ex}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe your product in detail — material, function, use case, key specs..."
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleSubmit()} />
          <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Ctrl + Enter to classify</div>
        </div>

        <button onClick={() => handleSubmit()} disabled={loading || !description.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Classifying...' : 'Classify & Show Confidence'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {codes.length > 0 && (
          <div style={{ marginTop: 28 }}>
            {/* Overall confidence ring */}
            {overallConf !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '18px 22px', background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                  <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={confColor(overallConf)} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallConf)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: confColor(overallConf) }}>{Math.round(overallConf * 100)}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: confColor(overallConf) }}>{confLabel(overallConf)} Confidence</div>
                  {result?.productCategory && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Category: {result.productCategory}</div>}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Based on top classification result</div>
                </div>
              </div>
            )}

            {/* Confidence breakdown chart */}
            {result?.breakdown && result.breakdown.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14 }}>Confidence Breakdown</div>
                {result.breakdown.map((b, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{b.factor}</span>
                      <span style={{ fontWeight: 700, color: confColor(b.score) }}>{Math.round(b.score * 100)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.score * 100}%`, background: confColor(b.score), borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>weight: {(b.weight * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            )}

            {/* HS code results */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 10 }}>
              Top {codes.length} Suggestions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {codes.map((item, i) => (
                <div key={i} style={{
                  background: i === 0 ? 'rgba(232,100,10,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${i === 0 ? 'rgba(232,100,10,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, padding: 18,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: i === 0 ? accent : 'white' }}>{item.code}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>#{i + 1}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{item.description}</div>
                      {(item.chapter || item.heading) && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                          {item.chapter && `Chapter ${item.chapter}`}{item.chapter && item.heading ? ' · ' : ''}{item.heading && `Heading ${item.heading}`}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: confColor(item.confidence) }}>{Math.round(item.confidence * 100)}%</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: confColor(item.confidence), textTransform: 'uppercase' }}>{confLabel(item.confidence)}</div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: item.reasoning ? 10 : 0 }}>
                    <div style={{ height: '100%', width: `${item.confidence * 100}%`, background: confColor(item.confidence), borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>

                  {/* Reasoning */}
                  {item.reasoning && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, fontStyle: 'italic' }}>
                      {item.reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              AI-assisted classification demo. Always verify with a licensed customs broker.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
