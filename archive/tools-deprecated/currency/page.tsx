'use client';

import { useState } from 'react';
import Link from 'next/link';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'CAD', 'AUD', 'CHF', 'HKD',
  'SGD', 'SEK', 'NOK', 'DKK', 'NZD', 'MXN', 'BRL', 'INR', 'THB', 'VND',
  'TWD', 'PLN', 'CZK', 'HUF', 'TRY', 'ZAR', 'AED', 'SAR', 'MYR', 'IDR',
];

interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  rateDate?: string;
}

export default function CurrencyPage() {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/v1/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${numAmount}`, {
        headers: { 'X-Demo-Request': 'true' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Conversion failed');
        return;
      }
      setResult(json.data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1e3d' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 20px 80px' }}>
        <Link href="/tools" style={{ color: '#E8640A', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>← All Tools</Link>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>Currency Converter</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32 }}>
          Convert between 30+ currencies using ECB daily reference rates.
        </p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="1000"
              style={{ ...selectStyle, fontSize: 24, fontWeight: 700, padding: '14px 12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={swap} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#E8640A', fontSize: 18, cursor: 'pointer', marginBottom: 0 }}>⇄</button>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>To</label>
              <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: '#E8640A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 8 }}>
              {result.amount.toLocaleString()} {result.from} =
            </div>
            <div style={{ color: '#E8640A', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
              {result.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {result.to}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              1 {result.from} = {result.rate.toFixed(6)} {result.to}
            </div>
            {result.rateDate && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 6 }}>
                Rate date: {result.rateDate}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
