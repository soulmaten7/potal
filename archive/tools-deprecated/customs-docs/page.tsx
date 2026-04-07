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

interface DocsResult {
  documentType?: string;
  invoiceNumber?: string;
  content?: string;
  preview?: string;
  downloadUrl?: string;
  fields?: Record<string, string | number>;
}

export default function CustomsDocsPage() {
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [originCountry, setOriginCountry] = useState('');
  const [destCountry, setDestCountry] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [docType, setDocType] = useState('commercial_invoice');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocsResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!productName.trim() || !senderName.trim() || !receiverName.trim()) {
      setError('Please fill in product name, sender, and receiver.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/customs-docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          documentType: docType,
          product: {
            name: productName.trim(),
            hsCode: hsCode.trim() || undefined,
            quantity: quantity ? parseInt(quantity) : 1,
            unitValue: unitValue ? parseFloat(unitValue) : undefined,
            currency,
          },
          origin: originCountry.trim().toUpperCase() || undefined,
          destination: destCountry.trim().toUpperCase() || undefined,
          sender: { name: senderName.trim(), address: senderAddress.trim() || undefined },
          receiver: { name: receiverName.trim(), address: receiverAddress.trim() || undefined },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Document generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    const text = result?.content || result?.preview || JSON.stringify(result?.fields, null, 2) || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DOCUMENTATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Customs Documentation Generator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Generate commercial invoices, packing lists, and customs declarations instantly.
        </p>

        {/* Doc type */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Document Type</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'commercial_invoice', label: 'Commercial Invoice' },
              { value: 'packing_list', label: 'Packing List' },
              { value: 'customs_declaration', label: 'Customs Declaration' },
            ].map(d => (
              <button key={d.value} onClick={() => setDocType(d.value)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                background: docType === d.value ? accent : 'rgba(255,255,255,0.08)', color: 'white',
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Product Name *</label>
            <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Wireless Bluetooth Headphones" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>HS Code (optional)</label>
            <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 8518300000" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Quantity</label>
            <input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 10" type="number" min="1" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Unit Value</label>
            <input value={unitValue} onChange={e => setUnitValue(e.target.value)} placeholder="e.g. 49.99" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={selectStyle}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
              <option value="KRW">KRW</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Origin Country</label>
            <input value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="e.g. CN, US, KR" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Destination Country</label>
            <input value={destCountry} onChange={e => setDestCountry(e.target.value)} placeholder="e.g. DE, GB, AU" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Sender / Exporter *</label>
            <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Company or person name" style={{ ...inputStyle, marginBottom: 8 }} />
            <input value={senderAddress} onChange={e => setSenderAddress(e.target.value)} placeholder="Address (optional)" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Receiver / Importer *</label>
            <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Company or person name" style={{ ...inputStyle, marginBottom: 8 }} />
            <input value={receiverAddress} onChange={e => setReceiverAddress(e.target.value)} placeholder="Address (optional)" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Generating...' : 'Generate Document'}
        </button>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: accent, textTransform: 'uppercase' }}>
                {result.documentType || docType.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopy} style={{
                  padding: '6px 14px', background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 8, color: copied ? '#4ade80' : 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
                {result.downloadUrl && (
                  <a href={result.downloadUrl} download style={{
                    padding: '6px 14px', background: accent, borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>Download PDF</a>
                )}
              </div>
            </div>

            {result.invoiceNumber && (
              <div style={{ marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Reference: <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{result.invoiceNumber}</span>
              </div>
            )}

            {/* Content preview */}
            {(result.content || result.preview) && (
              <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', maxHeight: 420, overflowY: 'auto' }}>
                {result.content || result.preview}
              </div>
            )}

            {/* Fields table */}
            {result.fields && !result.content && !result.preview && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                {Object.entries(result.fields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{String(v)}</span>
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
