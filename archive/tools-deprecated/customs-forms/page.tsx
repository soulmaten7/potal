'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface GeneratedDoc {
  document_type?: string;
  date?: string;
  items?: Array<{ hs_code?: string; description?: string; value?: number; quantity?: number; weight?: number }>;
  totals?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CustomsFormResult {
  document?: GeneratedDoc;
  validation_warnings?: string[];
  generated_at?: string;
}

export default function CustomsFormsPage() {
  const [docType, setDocType] = useState('customs_declaration');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [shipperName, setShipperName] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemHsCode, setItemHsCode] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemWeight, setItemWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CustomsFormResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!itemDesc.trim() || !itemHsCode.trim() || !itemValue) { setError('Item description, HS code, and value are required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/customs-docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          doc_type: docType,
          shipment: {
            shipper: { name: shipperName.trim() || 'Demo Shipper', country: origin },
            consignee: { name: consigneeName.trim() || 'Demo Consignee', country: destination },
            destination,
            items: [{
              hs_code: itemHsCode.trim(),
              description: itemDesc.trim(),
              value: parseFloat(itemValue),
              quantity: parseInt(itemQty) || 1,
              weight: parseFloat(itemWeight) || 0.5,
              origin,
            }],
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const DOC_TYPES = [
    { value: 'customs_declaration', label: 'Customs Declaration' },
    { value: 'commercial_invoice', label: 'Commercial Invoice' },
    { value: 'packing_list', label: 'Packing List' },
    { value: 'certificate_of_origin', label: 'Certificate of Origin' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CUSTOMS TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Customs Forms Generator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Generate customs declarations, commercial invoices, packing lists, and certificates of origin.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value} style={{ background: '#0a1e3d' }}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Shipper Name</label>
              <input value={shipperName} onChange={e => setShipperName(e.target.value)} placeholder="e.g. ABC Trading Co." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Consignee Name</label>
              <input value={consigneeName} onChange={e => setConsigneeName(e.target.value)} placeholder="e.g. XYZ Import LLC" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. CN" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. US" style={inputStyle} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>Item Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Description</label>
                <input value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="e.g. Cotton T-Shirts" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>HS Code</label>
                  <input value={itemHsCode} onChange={e => setItemHsCode(e.target.value)} placeholder="610910" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Value ($)</label>
                  <input type="number" value={itemValue} onChange={e => setItemValue(e.target.value)} placeholder="500" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Qty</label>
                  <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="10" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Weight (kg)</label>
                  <input type="number" value={itemWeight} onChange={e => setItemWeight(e.target.value)} placeholder="2.5" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Generating...' : 'Generate Document'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result?.document && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Generated Document</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>{result.document.document_type?.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.document.date}</div>
            </div>

            {/* Document fields preview */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
              {Object.entries(result.document)
                .filter(([k]) => !['items', 'document_type', 'date'].includes(k))
                .slice(0, 12)
                .map(([key, val], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Items */}
            {result.document.items && result.document.items.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Items</div>
                {result.document.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.description} ({item.hs_code})</span>
                    <span style={{ color: accent, fontWeight: 600 }}>${item.value?.toFixed(2)} x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {result.validation_warnings && result.validation_warnings.length > 0 && (
              <div style={{ background: 'rgba(234,179,8,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#facc15', marginBottom: 6 }}>Validation Warnings</div>
                {result.validation_warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(234,179,8,0.8)', marginBottom: 2 }}>{w}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
