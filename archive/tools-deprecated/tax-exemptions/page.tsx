'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const EXEMPTION_TYPES = ['Diplomatic', 'Military', 'Humanitarian', 'Educational', 'Religious', 'Government', 'Medical', 'Scientific Research', 'Temporary Import', 'Returned Goods'];
const CATEGORIES = ['Electronics', 'Apparel', 'Food & Beverage', 'Machinery', 'Medical Equipment', 'Vehicles', 'Chemicals', 'Agricultural', 'Books & Media', 'Other'];

interface ExemptionResult {
  eligible: boolean;
  exemptionType?: string;
  conditions?: string[];
  requiredDocuments?: string[];
  notes?: string;
  dutyReduction?: number;
  taxReduction?: number;
}

export default function TaxExemptionsPage() {
  const [productCategory, setProductCategory] = useState('Electronics');
  const [origin, setOrigin] = useState('US');
  const [destination, setDestination] = useState('DE');
  const [exemptionType, setExemptionType] = useState('Diplomatic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExemptionResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/tax/exemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ productCategory, originCountry: origin, destinationCountry: destination, exemptionType }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Exemption check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>TAX TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Tax Exemptions</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Check eligibility for duty and tax exemptions based on product type and purpose.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Category</label>
              <select value={productCategory} onChange={e => setProductCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Exemption Type</label>
              <select value={exemptionType} onChange={e => setExemptionType(e.target.value)} style={inputStyle}>
                {EXEMPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Origin Country</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>
                {['US','CN','DE','GB','JP','KR','FR','CA','AU','IN'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Destination Country</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                {['US','CN','DE','GB','JP','KR','FR','CA','AU','IN'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking...' : 'Check Exemption Eligibility'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: result.eligible ? '#4ade80' : '#f87171' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>{result.eligible ? 'Exemption Available' : 'Not Eligible'}</span>
            </div>
            {result.dutyReduction !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Duty Reduction</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{result.dutyReduction}%</span>
              </div>
            )}
            {result.taxReduction !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Tax Reduction</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{result.taxReduction}%</span>
              </div>
            )}
            {result.conditions && result.conditions.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Conditions</h4>
                {result.conditions.map((c, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>• {c}</div>)}
              </div>
            )}
            {result.requiredDocuments && result.requiredDocuments.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Required Documents</h4>
                {result.requiredDocuments.map((d, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>📄 {d}</div>)}
              </div>
            )}
            {result.notes && <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.notes}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
