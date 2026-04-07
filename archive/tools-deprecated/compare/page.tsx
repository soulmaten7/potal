'use client';

import { useState } from 'react';
import Link from 'next/link';

const DESTINATIONS = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' }, { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' }, { code: 'IN', name: 'India' }, { code: 'CN', name: 'China' },
];

interface CountryResult {
  country: string;
  countryName: string;
  totalLandedCost: number;
  importDuty: number;
  tax: number;
  dutyRate: string;
  taxLabel: string;
  error?: string;
}

export default function ComparePage() {
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('100');
  const [origin, setOrigin] = useState('CN');
  const [selected, setSelected] = useState<Set<string>>(new Set(['US', 'GB', 'DE', 'JP']));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CountryResult[]>([]);
  const [error, setError] = useState('');

  function toggleCountry(code: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  async function handleSubmit() {
    if (!productName.trim()) { setError('Product name is required.'); return; }
    if (selected.size === 0) { setError('Select at least one destination.'); return; }
    setLoading(true);
    setError('');
    setResults([]);

    const destinations = Array.from(selected);
    const allResults: CountryResult[] = [];

    await Promise.all(destinations.map(async (dest) => {
      try {
        const res = await fetch('/api/v1/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
          body: JSON.stringify({
            productName: productName.trim(),
            ...(material.trim() ? { material: material.trim() } : {}),
            ...(category.trim() ? { productCategory: category.trim() } : {}),
            price: parseFloat(price) || 100,
            origin,
            destinationCountry: dest,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          allResults.push({
            country: dest,
            countryName: DESTINATIONS.find(c => c.code === dest)?.name || dest,
            totalLandedCost: d.totalLandedCost || 0,
            importDuty: d.importDuty || 0,
            tax: d.tax || 0,
            dutyRate: d.dutyRate || '0%',
            taxLabel: d.taxLabel || 'Tax',
          });
        } else {
          allResults.push({ country: dest, countryName: DESTINATIONS.find(c => c.code === dest)?.name || dest, totalLandedCost: 0, importDuty: 0, tax: 0, dutyRate: '-', taxLabel: '-', error: 'Failed' });
        }
      } catch {
        allResults.push({ country: dest, countryName: DESTINATIONS.find(c => c.code === dest)?.name || dest, totalLandedCost: 0, importDuty: 0, tax: 0, dutyRate: '-', taxLabel: '-', error: 'Error' });
      }
    }));

    allResults.sort((a, b) => a.totalLandedCost - b.totalLandedCost);
    setResults(allResults);
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1e3d' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '60px 20px 80px' }}>
        <Link href="/tools" style={{ color: '#E8640A', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← All Tools</Link>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>Multi-Country Compare</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
          Compare landed costs across multiple destinations side by side.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Product Name *</label>
              <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Cotton T-Shirt" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Material</label>
              <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="cotton" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="apparel" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Origin</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>
                {DESTINATIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Price (USD)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="100" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase' }}>Destinations (select multiple)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DESTINATIONS.filter(c => c.code !== origin).map(c => (
                <button key={c.code} onClick={() => toggleCountry(c.code)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: selected.has(c.code) ? '#E8640A' : 'rgba(255,255,255,0.1)',
                    color: selected.has(c.code) ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {c.code}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#E8640A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Calculating...' : `Compare ${selected.size} Countries`}
          </button>
        </div>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {results.length > 0 && (
          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase' }}>Country</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase' }}>Duty</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase' }}>Tax</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase' }}>Total Landed</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.country} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: i === 0 ? 'rgba(74,222,128,0.08)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>
                      {r.countryName} {i === 0 && <span style={{ color: '#4ade80', fontSize: 11, marginLeft: 6 }}>Lowest</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>${r.importDuty.toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>${r.tax.toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', color: '#E8640A', fontWeight: 700, textAlign: 'right' }}>${r.totalLandedCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
