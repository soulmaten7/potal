'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface PdfResult {
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  base64?: string;
}

const DOC_TYPES = [
  { value: 'commercial_invoice', label: 'Commercial Invoice' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'certificate_of_origin', label: 'Certificate of Origin' },
  { value: 'customs_declaration', label: 'Customs Declaration' },
  { value: 'all', label: 'All Documents' },
];

export default function PdfReportsPage() {
  const [docType, setDocType] = useState('commercial_invoice');
  const [exporterName, setExporterName] = useState('');
  const [exporterCountry, setExporterCountry] = useState('CN');
  const [importerName, setImporterName] = useState('');
  const [importerCountry, setImporterCountry] = useState('US');
  const [itemDesc, setItemDesc] = useState('');
  const [itemHsCode, setItemHsCode] = useState('');
  const [itemQty, setItemQty] = useState('10');
  const [itemPrice, setItemPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!exporterName.trim() || !importerName.trim() || !itemDesc.trim() || !itemPrice) {
      setError('Exporter, importer, item description, and unit price are required.'); return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/documents/pdf?format=base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: docType,
          exporter: { name: exporterName.trim(), country: exporterCountry },
          importer: { name: importerName.trim(), country: importerCountry },
          items: [{ description: itemDesc.trim(), quantity: parseInt(itemQty) || 1, unitPrice: parseFloat(itemPrice), ...(itemHsCode.trim() ? { hsCode: itemHsCode.trim() } : {}), countryOfOrigin: exporterCountry }],
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!result?.base64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${result.base64}`;
    link.download = result.filename || 'document.pdf';
    link.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DOCUMENTATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>PDF Trade Documents</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Generate professional trade documents as downloadable PDFs.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DOC_TYPES.map(d => <option key={d.value} value={d.value} style={{ background: '#0a1e3d' }}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Exporter Name</label>
              <input value={exporterName} onChange={e => setExporterName(e.target.value)} placeholder="ABC Trading Co." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Exporter Country</label>
              <input value={exporterCountry} onChange={e => setExporterCountry(e.target.value)} placeholder="CN" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Importer Name</label>
              <input value={importerName} onChange={e => setImporterName(e.target.value)} placeholder="XYZ Import LLC" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Importer Country</label>
              <input value={importerCountry} onChange={e => setImporterCountry(e.target.value)} placeholder="US" style={inputStyle} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>Item</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Description</label>
                <input value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Cotton T-Shirts" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>HS Code</label>
                <input value={itemHsCode} onChange={e => setItemHsCode(e.target.value)} placeholder="610910" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Qty</label>
                <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, display: 'block' }}>Unit Price ($)</label>
                <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="29.99" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Generating PDF...' : 'Generate PDF'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 14, border: '1px solid rgba(34,197,94,0.2)', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>&#128196;</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>PDF Ready</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{result.filename}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{result.sizeBytes ? `${(result.sizeBytes / 1024).toFixed(1)} KB` : ''}</div>
            {result.base64 && (
              <button onClick={handleDownload} style={{ padding: '12px 28px', background: '#4ade80', color: '#0a1e3d', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Download PDF
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
