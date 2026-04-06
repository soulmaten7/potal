'use client';

import React, { useState, useEffect, useCallback } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

const ALL_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'KRW', name: 'Korean Won', flag: '🇰🇷' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
];

interface RateResult {
  base?: string;
  rates?: Record<string, number>;
  updatedAt?: string;
  source?: string;
}

export default function MultiCurrencyPage() {
  const [amount, setAmount] = useState('1000');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [selected, setSelected] = useState<string[]>(['EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD']);
  const [rates, setRates] = useState<RateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState('');

  const fetchRates = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const targets = selected.filter(c => c !== baseCurrency);
      const params = new URLSearchParams({ base: baseCurrency });
      targets.forEach(c => params.append('target', c));
      const res = await fetch(`/api/v1/exchange-rate?${params.toString()}`, {
        headers: { 'X-Demo-Request': 'true' },
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to fetch rates.'); return; }
      setRates(json.data ?? json);
      setLastFetch(new Date().toLocaleTimeString());
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  }, [baseCurrency, selected]);

  // Auto-fetch when base or targets change
  useEffect(() => {
    if (selected.length > 0) fetchRates();
  }, [baseCurrency, fetchRates]);

  const toggleCurrency = (code: string) => {
    if (code === baseCurrency) return;
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const fmtAmount = (rate: number, targetCode: string) => {
    const val = parseFloat(amount || '0') * rate;
    if (isNaN(val)) return '—';
    if (targetCode === 'JPY' || targetCode === 'KRW') return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const displayCurrencies = ALL_CURRENCIES.filter(c => c.code !== baseCurrency && selected.includes(c.code));

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>REFERENCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Multi-currency Display</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Live exchange rates across 20+ currencies. Select target currencies and enter an amount to convert.
        </p>

        {/* Input row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Amount</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1000" type="number" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Base Currency</label>
            <select value={baseCurrency} onChange={e => { setBaseCurrency(e.target.value); setSelected(prev => prev.filter(c => c !== e.target.value)); }} style={selectStyle}>
              {ALL_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
          </div>
        </div>

        {/* Currency selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Target Currencies ({selected.filter(c => c !== baseCurrency).length} selected)</label>
            <button onClick={() => setSelected(ALL_CURRENCIES.filter(c => c.code !== baseCurrency).map(c => c.code))} style={{ fontSize: 11, background: 'none', border: 'none', color: accent, cursor: 'pointer', fontWeight: 700 }}>Select All</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_CURRENCIES.filter(c => c.code !== baseCurrency).map(c => {
              const isOn = selected.includes(c.code);
              return (
                <button key={c.code} onClick={() => toggleCurrency(c.code)} style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${isOn ? 'rgba(232,100,10,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: isOn ? 'rgba(232,100,10,0.15)' : 'rgba(0,0,0,0.2)',
                  color: isOn ? accent : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {c.flag} {c.code}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={fetchRates} disabled={loading || selected.length === 0} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', marginBottom: 8,
        }}>
          {loading ? 'Fetching rates...' : '↻ Refresh Rates'}
        </button>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5', marginBottom: 8 }}>{error}</div>}

        {/* Rates table */}
        {rates?.rates && displayCurrencies.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {parseFloat(amount || '0').toLocaleString()} {baseCurrency} =
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {lastFetch && `Updated ${lastFetch}`}
                {rates.source && ` · ${rates.source}`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {displayCurrencies.map(c => {
                const rate = rates.rates![c.code];
                if (rate === undefined) return null;
                return (
                  <div key={c.code} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 24 }}>{c.flag}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{c.code}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{c.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>{fmtAmount(rate, c.code)}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                          1 {baseCurrency} = {c.code === 'JPY' || c.code === 'KRW' ? rate.toFixed(2) : rate.toFixed(4)} {c.code}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {rates.updatedAt && (
              <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                Rates as of {rates.updatedAt} · For reference only. Use live broker rates for transactions.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
