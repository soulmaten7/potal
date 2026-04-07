'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CERT_TYPES = [
  { value: 'certificate_of_origin', label: 'Certificate of Origin (CO)', authority: 'Chamber of Commerce', description: 'Certifies where goods were manufactured/produced.' },
  { value: 'eur1', label: 'EUR.1 Movement Certificate', authority: 'Customs Authority (EU)', description: 'Proof of preferential origin for EU trade agreements.' },
  { value: 'form_a', label: 'Form A (GSP Certificate)', authority: 'Customs/Trade Ministry', description: 'Certificate for Generalized System of Preferences beneficiary countries.' },
  { value: 'ata_carnet', label: 'ATA Carnet', authority: 'Chamber of Commerce (ICC)', description: 'International customs document for temporary imports (exhibitions, samples).' },
  { value: 'eur_med', label: 'EUR-MED Certificate', authority: 'Customs Authority', description: 'Origin certificate for Pan-Euro-Mediterranean cumulation zone.' },
  { value: 'fumigation', label: 'Fumigation Certificate', authority: 'NPPO / ISPM 15', description: 'Certifies wood packaging has been heat-treated or fumigated.' },
];

interface CertResult {
  certificateType?: string;
  requiredFields?: string[];
  issuingAuthority?: string;
  processingTime?: string;
  validity?: string;
  notes?: string;
}

export default function CertificatesPage() {
  const [certType, setCertType] = useState('certificate_of_origin');
  const [exporterName, setExporterName] = useState('');
  const [exporterCountry, setExporterCountry] = useState('US');
  const [importerCountry, setImporterCountry] = useState('DE');
  const [productDesc, setProductDesc] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertResult | null>(null);
  const [error, setError] = useState('');

  const selectedCert = CERT_TYPES.find(c => c.value === certType)!;

  const handleSubmit = async () => {
    if (!exporterName.trim()) { setError('Exporter name is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/compliance/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          certificateType: certType,
          exporter: { name: exporterName.trim(), country: exporterCountry },
          importerCountry,
          product: { description: productDesc.trim(), hsCode: hsCode.trim() || undefined },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Certificate lookup failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Compliance Certificates</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Check requirements for trade compliance certificates and origin documentation.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Certificate Type</label>
            <select value={certType} onChange={e => setCertType(e.target.value)} style={inputStyle}>
              {CERT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {selectedCert.description}<br />
              <span style={{ color: accent }}>Issuing Authority:</span> {selectedCert.authority}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Exporter Name</label>
              <input value={exporterName} onChange={e => setExporterName(e.target.value)} placeholder="Company name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Exporter Country</label>
              <select value={exporterCountry} onChange={e => setExporterCountry(e.target.value)} style={inputStyle}>
                {['US','CN','DE','GB','JP','KR','FR','CA','AU','VN','IN','IT','MX'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Importer Country</label>
              <select value={importerCountry} onChange={e => setImporterCountry(e.target.value)} style={inputStyle}>
                {['US','CN','DE','GB','JP','KR','FR','CA','AU','VN','IN','IT','MX','BR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>HS Code (optional)</label>
              <input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="e.g. 610910" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Description</label>
            <input value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="e.g. Cotton T-Shirts" style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking...' : 'Check Certificate Requirements'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>Certificate Requirements</h3>
            {result.issuingAuthority && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Issuing Authority</span><span style={{ fontWeight: 600 }}>{result.issuingAuthority}</span></div>}
            {result.processingTime && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Processing Time</span><span>{result.processingTime}</span></div>}
            {result.validity && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Validity</span><span>{result.validity}</span></div>}
            {result.requiredFields && result.requiredFields.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Required Fields</h4>
                {result.requiredFields.map((f, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: accent }}>☐</span> {f}</div>)}
              </div>
            )}
            {result.notes && <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{result.notes}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
