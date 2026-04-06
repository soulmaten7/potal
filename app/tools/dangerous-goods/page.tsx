'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

interface DGResult {
  isDangerous?: boolean;
  dgClass?: string;
  dgDivision?: string;
  packingGroup?: string;
  properShippingName?: string;
  unNumber?: string;
  labels?: string[];
  restrictions?: { carrier: string; allowed: boolean; conditions?: string }[];
  specialProvisions?: string[];
  packagingRequirements?: string;
  emergencyContact?: string;
  notes?: string;
}

const DG_CLASS_COLORS: Record<string, string> = {
  '1': '#f87171', '2': '#fbbf24', '3': '#fb923c', '4': '#facc15',
  '5': '#a3e635', '6': '#4ade80', '7': '#60a5fa', '8': '#c084fc', '9': '#94a3b8',
};

const DG_CLASS_NAMES: Record<string, string> = {
  '1': 'Explosives', '2': 'Gases', '3': 'Flammable Liquids',
  '4': 'Flammable Solids', '5': 'Oxidizing Substances', '6': 'Toxic & Infectious',
  '7': 'Radioactive', '8': 'Corrosives', '9': 'Misc. Dangerous Goods',
};

export default function DangerousGoodsPage() {
  const [description, setDescription] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [unNumber, setUnNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('air');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DGResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Please describe the product.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'dangerous-goods',
          description: description.trim(),
          hsCode: hsCode.trim() || undefined,
          unNumber: unNumber.trim() || undefined,
          shippingMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const classNum = result?.dgClass?.replace('Class ', '').split('.')[0] ?? '';
  const classColor = DG_CLASS_COLORS[classNum] || '#94a3b8';

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Dangerous Goods Check</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Check IATA/IMDG/ADR dangerous goods classification, packing groups, and carrier restrictions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Lithium-ion battery pack, 100Wh capacity, for laptop computers"
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 8507600000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>UN Number (optional)</label>
              <input value={unNumber} onChange={e => setUnNumber(e.target.value)} placeholder="e.g. UN3480" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Shipping Method</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'air', label: '✈ Air (IATA)' }, { v: 'sea', label: '🚢 Sea (IMDG)' }, { v: 'road', label: '🚚 Road (ADR)' }].map(m => (
                <button key={m.v} onClick={() => setShippingMethod(m.v)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  background: shippingMethod === m.v ? accent : 'rgba(255,255,255,0.08)', color: 'white',
                }}>{m.label}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !description.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Checking...' : 'Check Dangerous Goods'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Status banner */}
            <div style={{
              background: result.isDangerous ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)',
              border: `1px solid ${result.isDangerous ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.3)'}`,
              borderRadius: 14, padding: 20, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 40 }}>{result.isDangerous ? '⚠️' : '✅'}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: result.isDangerous ? '#f87171' : '#4ade80' }}>
                  {result.isDangerous ? 'DANGEROUS GOODS DETECTED' : 'NOT CLASSIFIED AS DANGEROUS'}
                </div>
                {result.dgClass && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>
                    {result.dgClass}{result.dgDivision ? ` — Division ${result.dgDivision}` : ''} · {DG_CLASS_NAMES[classNum] || ''}
                  </div>
                )}
              </div>
            </div>

            {result.isDangerous && (
              <>
                {/* Classification details */}
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 14 }}>Classification Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.dgClass && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Hazard Class</span>
                        <span style={{ fontWeight: 800, padding: '3px 12px', borderRadius: 6, background: `${classColor}20`, color: classColor }}>
                          {result.dgClass}
                        </span>
                      </div>
                    )}
                    {result.unNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>UN Number</span>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{result.unNumber}</span>
                      </div>
                    )}
                    {result.properShippingName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Proper Shipping Name</span>
                        <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right' }}>{result.properShippingName}</span>
                      </div>
                    )}
                    {result.packingGroup && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Packing Group</span>
                        <span style={{ fontWeight: 700 }}>{result.packingGroup}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Labels */}
                {result.labels && result.labels.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Required Labels</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.labels.map((l, i) => (
                        <span key={i} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carrier restrictions */}
                {result.restrictions && result.restrictions.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 18, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Carrier Restrictions</div>
                    {result.restrictions.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < result.restrictions!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{r.carrier}</div>
                          {r.conditions && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.conditions}</div>}
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: r.allowed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.allowed ? '#4ade80' : '#f87171' }}>
                          {r.allowed ? 'ALLOWED' : 'PROHIBITED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Special provisions */}
                {result.specialProvisions && result.specialProvisions.length > 0 && (
                  <div style={{ background: 'rgba(232,100,10,0.06)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(232,100,10,0.2)', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', marginBottom: 10 }}>Special Provisions</div>
                    {result.specialProvisions.map((sp, i) => (
                      <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid rgba(232,100,10,0.4)' }}>{sp}</div>
                    ))}
                  </div>
                )}
              </>
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
