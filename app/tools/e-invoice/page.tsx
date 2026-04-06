'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface LineItem { description: string; qty: string; unitPrice: string }

export default function EInvoicePage() {
  const [sellerName, setSellerName] = useState('');
  const [sellerCountry, setSellerCountry] = useState('US');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCountry, setBuyerCountry] = useState('DE');
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<LineItem[]>([{ description: '', qty: '1', unitPrice: '' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  function updateItem(i: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems(prev => [...prev, { description: '', qty: '1', unitPrice: '' }]); }
  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }

  const handleSubmit = async () => {
    if (!sellerName.trim() || !buyerName.trim()) { setError('Seller and buyer names are required.'); return; }
    if (items.every(it => !it.description.trim())) { setError('At least one line item is required.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/invoicing/e-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          seller: { name: sellerName.trim(), country: sellerCountry },
          buyer: { name: buyerName.trim(), country: buyerCountry },
          currency,
          items: items.filter(it => it.description.trim()).map(it => ({
            description: it.description.trim(),
            quantity: parseInt(it.qty) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || json.error || 'Invoice generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const total = items.reduce((sum, it) => sum + (parseInt(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DOCUMENTATION TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>E-Invoice Generator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Generate Peppol/ZUGFeRD compliant e-invoices for cross-border transactions.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Seller & Buyer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Seller name" style={inputStyle} />
            <select value={sellerCountry} onChange={e => setSellerCountry(e.target.value)} style={inputStyle}>
              {['US','DE','GB','FR','JP','KR','CN','CA','AU','NL','IT','ES'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Buyer name" style={inputStyle} />
            <select value={buyerCountry} onChange={e => setBuyerCountry(e.target.value)} style={inputStyle}>
              {['US','DE','GB','FR','JP','KR','CN','CA','AU','NL','IT','ES'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            {['USD','EUR','GBP','JPY','KRW','CNY','CAD','AUD'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 14 }}>Line Items</h3>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 8, marginBottom: 8 }}>
              <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" style={inputStyle} />
              <input value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="Qty" type="number" style={inputStyle} />
              <input value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="Price" type="number" style={inputStyle} />
              {items.length > 1 && <button onClick={() => removeItem(i)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 16 }}>×</button>}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <button onClick={addItem} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.6)', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>+ Add Item</button>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Total: {currency} {total.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Generating...' : 'Generate E-Invoice'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>Invoice Generated</h3>
            <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
