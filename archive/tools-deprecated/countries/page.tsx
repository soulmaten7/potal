'use client';

import React, { useState, useEffect } from 'react';

const accent = '#E8640A';
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface Country {
  code: string;
  name: string;
  region?: string;
  vatRate?: number;
  vatLabel?: string;
  avgDutyRate?: number;
  deMinimisUsd?: number;
  currency?: string;
  hasFtaWithChina?: boolean;
  notes?: string;
}

const REGIONS = ['All', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East'];

const FLAG_MAP: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', CN: '\u{1F1E8}\u{1F1F3}', GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}',
  FR: '\u{1F1EB}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}', KR: '\u{1F1F0}\u{1F1F7}', AU: '\u{1F1E6}\u{1F1FA}',
  CA: '\u{1F1E8}\u{1F1E6}', IN: '\u{1F1EE}\u{1F1F3}', BR: '\u{1F1E7}\u{1F1F7}', MX: '\u{1F1F2}\u{1F1FD}',
  SG: '\u{1F1F8}\u{1F1EC}', IT: '\u{1F1EE}\u{1F1F9}', NL: '\u{1F1F3}\u{1F1F1}', ES: '\u{1F1EA}\u{1F1F8}',
  SE: '\u{1F1F8}\u{1F1EA}', CH: '\u{1F1E8}\u{1F1ED}', RU: '\u{1F1F7}\u{1F1FA}', TH: '\u{1F1F9}\u{1F1ED}',
  VN: '\u{1F1FB}\u{1F1F3}', ID: '\u{1F1EE}\u{1F1E9}', AE: '\u{1F1E6}\u{1F1EA}', SA: '\u{1F1F8}\u{1F1E6}',
  ZA: '\u{1F1FF}\u{1F1E6}', NG: '\u{1F1F3}\u{1F1EC}', EG: '\u{1F1EA}\u{1F1EC}', TR: '\u{1F1F9}\u{1F1F7}',
  PL: '\u{1F1F5}\u{1F1F1}', HK: '\u{1F1ED}\u{1F1F0}',
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/countries?lang=en', { headers: { 'X-Demo-Request': 'true' } })
      .then(r => r.json())
      .then(json => {
        const data = json.data?.countries || json.countries || [];
        setCountries(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = countries.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === 'All' || c.region?.toLowerCase().includes(region.toLowerCase());
    return matchSearch && matchRegion;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>REFERENCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Country Database</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontSize: 15 }}>Browse 240 countries with duty rates, VAT/GST, de minimis thresholds, and FTA data.</p>

        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search country or code..." style={{ ...inputStyle, maxWidth: 300 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: region === r ? accent : 'rgba(255,255,255,0.08)', color: region === r ? 'white' : 'rgba(255,255,255,0.5)',
              }}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{filtered.length} countries</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>Loading countries...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(c => (
              <div key={c.code} onClick={() => setExpanded(expanded === c.code ? null : c.code)} style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 16, border: expanded === c.code ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'border 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{FLAG_MAP[c.code] || '\u{1F3F3}'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.code} &middot; {c.currency || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.vatRate != null && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{c.vatLabel || 'VAT'} {(c.vatRate * 100).toFixed(0)}%</span>}
                  {c.deMinimisUsd != null && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>De Minimis ${c.deMinimisUsd}</span>}
                  {c.hasFtaWithChina && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>FTA w/ CN</span>}
                </div>
                {expanded === c.code && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}>
                    {[
                      { label: 'Region', value: c.region },
                      { label: 'Avg Duty Rate', value: c.avgDutyRate != null ? `${(c.avgDutyRate * 100).toFixed(1)}%` : 'N/A' },
                      { label: 'Notes', value: c.notes },
                    ].filter(r => r.value).map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '60%', textAlign: 'right' }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
