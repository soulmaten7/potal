'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const RETURN_REASONS = ['Defective/Damaged', 'Wrong Item Shipped', 'Customer Changed Mind', 'Not As Described', 'Warranty Return', 'Recall', 'Re-export'];

interface DrawbackResult {
  eligible: boolean;
  drawbackType?: string;
  estimatedRefund?: number;
  dutiesPaid?: number;
  refundPercentage?: number;
  requiredForms?: string[];
  processSteps?: string[];
  timelineEstimate?: string;
  notes?: string;
}

export default function ReturnsPage() {
  const [hsCode, setHsCode] = useState('');
  const [productValue, setProductValue] = useState('500');
  const [dutiesPaid, setDutiesPaid] = useState('75');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [returnReason, setReturnReason] = useState('Defective/Damaged');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrawbackResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!productValue.trim()) { setError('Product value is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/returns/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          hsCode: hsCode.trim() || undefined,
          productValue: parseFloat(productValue) || 0,
          dutiesPaid: parseFloat(dutiesPaid) || 0,
          originCountry: origin,
          destinationCountry: destination,
          returnReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Drawback check failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SHIPPING TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Returns & Duty Drawback</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Check duty drawback eligibility and estimate refunds for returned goods.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Original Shipment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Value (USD)</label>
              <input value={productValue} onChange={e => setProductValue(e.target.value)} type="number" placeholder="500" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Duties Paid (USD)</label>
              <input value={dutiesPaid} onChange={e => setDutiesPaid(e.target.value)} type="number" placeholder="75" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Origin</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>
                {['CN','US','DE','GB','JP','KR','VN','IN','MX','CA'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                {['US','CN','DE','GB','JP','KR','CA','AU','FR','IT'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Return Details</h3>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Return Reason</label>
          <select value={returnReason} onChange={e => setReturnReason(e.target.value)} style={inputStyle}>
            {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking...' : 'Check Duty Drawback'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: result.eligible ? '#4ade80' : '#f87171' }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>{result.eligible ? 'Drawback Eligible' : 'Not Eligible for Drawback'}</span>
            </div>
            {result.eligible && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.drawbackType && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Drawback Type</span><span style={{ fontWeight: 600 }}>{result.drawbackType}</span></div>}
                {result.estimatedRefund !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Estimated Refund</span><span style={{ color: '#4ade80', fontSize: 18, fontWeight: 700 }}>${result.estimatedRefund.toFixed(2)}</span></div>}
                {result.refundPercentage !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Refund Rate</span><span style={{ fontWeight: 600 }}>{result.refundPercentage}%</span></div>}
                {result.timelineEstimate && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Timeline</span><span>{result.timelineEstimate}</span></div>}
              </div>
            )}
            {result.requiredForms && result.requiredForms.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Required Forms</h4>
                {result.requiredForms.map((f, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>📋 {f}</div>)}
              </div>
            )}
            {result.processSteps && result.processSteps.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Process Steps</h4>
                {result.processSteps.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}><span style={{ color: accent, fontWeight: 700 }}>{i + 1}.</span> {s}</div>)}
              </div>
            )}
            {result.notes && <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.notes}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
