'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface BatchItem {
  productName: string;
  material?: string;
  category?: string;
  hsCode?: string;
  description?: string;
  confidence?: number;
  error?: string;
}

export default function BatchPage() {
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchItem[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): { productName: string; material?: string; category?: string }[] {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('product') || header.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines.filter(l => l.trim()).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return { productName: cols[0] || '', material: cols[1] || undefined, category: cols[2] || undefined };
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTextInput(text);
  }

  async function handleSubmit() {
    const items = parseCSV(textInput);
    if (items.length === 0) { setError('No products to classify. Enter at least one product name.'); return; }
    if (items.length > 50) { setError('Maximum 50 products per batch.'); return; }
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/v1/classify/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ products: items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Batch classification failed');
        return;
      }
      setResults(json.data?.results || []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const header = 'Product Name,Material,Category,HS Code,Description,Confidence\n';
    const rows = results.map(r =>
      `"${r.productName}","${r.material || ''}","${r.category || ''}","${r.hsCode || ''}","${(r.description || '').replace(/"/g, '""')}",${r.confidence ? Math.round(r.confidence * 100) + '%' : ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'potal-batch-classification.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1e3d' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '60px 20px 80px' }}>
        <Link href="/tools" style={{ color: '#E8640A', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← All Tools</Link>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>Batch Classification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
          Classify up to 50 products at once. Upload CSV or paste product list.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Upload CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, alignSelf: 'center' }}>or paste below (one product per line: name, material, category)</span>
          </div>
          <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder={'Product Name, Material, Category\nCotton T-Shirt, cotton, apparel\nLeather Wallet, leather, accessories\nCeramic Mug, ceramic, kitchenware'}
            rows={8}
            style={{ width: '100%', padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              {parseCSV(textInput).length} products detected
            </span>
            <button onClick={handleSubmit} disabled={loading}
              style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: '#E8640A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Classifying...' : 'Classify All'}
            </button>
          </div>
        </div>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {results.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>{results.length} Results</h2>
              <button onClick={downloadCSV}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #E8640A', background: 'transparent', color: '#E8640A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Download CSV
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>HS Code</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 500 }}>{r.productName}</td>
                      <td style={{ padding: '8px 10px', color: '#E8640A', fontWeight: 700, fontFamily: 'monospace' }}>{r.hsCode || '-'}</td>
                      <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '-'}</td>
                      <td style={{ padding: '8px 10px', color: (r.confidence || 0) >= 0.9 ? '#4ade80' : '#facc15', fontWeight: 600, textAlign: 'right' }}>{r.confidence ? Math.round(r.confidence * 100) + '%' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
