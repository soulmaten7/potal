'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface CsvRow { id: string; result?: Record<string, unknown>; error?: string }
interface CsvResult { results?: CsvRow[]; errors?: Array<{ row: number; id: string; error: string }>; summary?: { total: number; success: number; failed: number; fileName: string } }

const SAMPLE_CSV = `id,price,productName,origin,destinationCountry,hsCode
1,29.99,Cotton T-Shirt,CN,US,610910
2,149.00,Running Shoes,VN,GB,640411
3,89.50,Leather Wallet,IT,JP,420231
4,12.00,Ceramic Mug,CN,DE,691110
5,45.00,Yoga Mat,TW,AU,401699`;

export default function CsvExportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!csvText.trim()) { setError('CSV data is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const blob = new Blob([csvText], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'batch.csv');
      formData.append('defaults', JSON.stringify({ origin, destinationCountry: destination }));

      const res = await fetch('/api/v1/calculate/csv', {
        method: 'POST',
        headers: { 'X-Demo-Request': 'true' },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Processing failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!result?.results) return;
    const headers = ['id', 'totalLandedCost', 'importDuty', 'vat', 'hsCode'];
    const rows = result.results.filter(r => r.result).map(r => {
      const d = r.result as Record<string, unknown>;
      return [r.id, d.totalLandedCost, d.importDuty, d.vat, d.hsClassification && typeof d.hsClassification === 'object' ? (d.hsClassification as Record<string, unknown>).hsCode : ''].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'potal_results.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>EXPORT TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>CSV Batch Calculate & Export</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Upload CSV with products, get landed cost calculations for each row, and download results.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>CSV Data <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>edit or paste your own</span></label>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Default Origin</label>
              <input value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Default Destination</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Processing...' : 'Calculate & Export'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            {result.summary && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'Total', value: result.summary.total, color: 'rgba(255,255,255,0.9)' },
                  { label: 'Success', value: result.summary.success, color: '#4ade80' },
                  { label: 'Failed', value: result.summary.failed, color: '#f87171' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {result.results && result.results.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Results Preview (first 5)</div>
                {result.results.slice(0, 5).map((row, i) => {
                  const d = row.result as Record<string, unknown> | undefined;
                  return (
                    <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>#{row.id}</span>
                      {d ? (
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>TLC: ${typeof d.totalLandedCost === 'number' ? d.totalLandedCost.toFixed(2) : 'N/A'}</span>
                      ) : (
                        <span style={{ color: '#f87171' }}>{row.error || 'Failed'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={handleDownload} style={{ width: '100%', padding: '12px', background: '#4ade80', color: '#0a1e3d', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Download Results CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
