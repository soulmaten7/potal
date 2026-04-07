'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };

interface MigrationGuide {
  from: string;
  time: string;
  differences: Array<{ aspect: string; theirs: string; potal: string }>;
  mappings: Array<{ theirs: string; potal: string }>;
}

const GUIDES: MigrationGuide[] = [
  {
    from: 'Avalara',
    time: '2-4 hours',
    differences: [
      { aspect: 'Pricing', theirs: 'Per-transaction fees + annual license', potal: 'Free forever' },
      { aspect: 'HS Classification', theirs: 'Manual or separate product', potal: 'Built-in 10-field AI classification' },
      { aspect: 'Countries', theirs: '~100 countries', potal: '240 countries' },
      { aspect: 'Trade Remedies', theirs: 'Not included', potal: '119,700+ AD/CVD cases' },
      { aspect: 'FTA Detection', theirs: 'Limited', potal: 'Automatic for all country pairs' },
    ],
    mappings: [
      { theirs: 'POST /tax/calculate', potal: 'POST /api/v1/calculate' },
      { theirs: 'POST /tax/classify', potal: 'POST /api/v1/classify' },
      { theirs: 'POST /screening/search', potal: 'POST /api/v1/screening' },
      { theirs: 'X-Avalara-Client header', potal: 'X-API-Key header' },
    ],
  },
  {
    from: 'Zonos',
    time: '1-2 hours',
    differences: [
      { aspect: 'Pricing', theirs: '$0.05-0.15 per transaction', potal: 'Free forever' },
      { aspect: 'Setup', theirs: 'Account manager required', potal: 'Self-serve, instant API key' },
      { aspect: 'Widget', theirs: 'Zonos Checkout widget', potal: 'Shadow DOM widget (zero CSS conflicts)' },
      { aspect: 'Sanctions', theirs: 'Basic screening', potal: '21,300+ entries, 19 lists, fuzzy matching' },
    ],
    mappings: [
      { theirs: 'POST /v1/duties', potal: 'POST /api/v1/calculate' },
      { theirs: 'POST /v1/classify', potal: 'POST /api/v1/classify' },
      { theirs: 'zonos-api-key header', potal: 'X-API-Key header' },
    ],
  },
  {
    from: 'Global-e',
    time: '4-8 hours',
    differences: [
      { aspect: 'Pricing', theirs: 'Revenue share + setup fee', potal: 'Free, no revenue share' },
      { aspect: 'Integration', theirs: 'Full checkout replacement', potal: 'Lightweight API + optional widget' },
      { aspect: 'Control', theirs: 'Global-e manages checkout flow', potal: 'You control your checkout, we provide data' },
      { aspect: 'Data Access', theirs: 'Limited to their dashboard', potal: 'Full API access to all data' },
    ],
    mappings: [
      { theirs: 'Checkout redirect flow', potal: 'POST /api/v1/checkout?action=quote' },
      { theirs: 'Product catalog sync', potal: 'POST /api/v1/classify (per product)' },
      { theirs: 'Order management API', potal: 'POST /api/v1/calculate (per order)' },
    ],
  },
  {
    from: 'Manual Process',
    time: '30 minutes',
    differences: [
      { aspect: 'Speed', theirs: 'Hours of research per shipment', potal: 'Milliseconds per API call' },
      { aspect: 'Accuracy', theirs: 'Human error prone', potal: '100% accuracy with 10-field classification' },
      { aspect: 'Coverage', theirs: 'Few countries you know well', potal: '240 countries, all tariff schedules' },
      { aspect: 'Updates', theirs: 'Manual tracking of rate changes', potal: 'Auto-updated from 12 official sources' },
    ],
    mappings: [
      { theirs: 'Look up HS code manually', potal: 'POST /api/v1/classify' },
      { theirs: 'Check tariff schedule PDF', potal: 'POST /api/v1/calculate' },
      { theirs: 'Google sanctions list', potal: 'POST /api/v1/screening' },
      { theirs: 'Email customs broker', potal: 'POST /api/v1/customs-docs/generate' },
    ],
  },
];

export default function MigrationPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER DOCS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Migration Guide</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Step-by-step guides to migrate from competitors or manual processes to POTAL.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GUIDES.map(g => {
            const isOpen = expanded === g.from;
            return (
              <div key={g.from} style={{ ...cardStyle, overflow: 'hidden' }}>
                <button onClick={() => setExpanded(isOpen ? null : g.from)} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>From {g.from}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>{g.time}</span>
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Key Differences</div>
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Aspect</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: '#f87171', fontSize: 11 }}>{g.from}</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: '#4ade80', fontSize: 11 }}>POTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.differences.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{d.aspect}</td>
                              <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.45)' }}>{d.theirs}</td>
                              <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.8)' }}>{d.potal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>API Mapping</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{g.from}</th>
                            <th style={{ textAlign: 'center', padding: '8px', color: 'rgba(255,255,255,0.25)' }}>&rarr;</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px', color: accent, fontSize: 11 }}>POTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.mappings.map((m, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{m.theirs}</td>
                              <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>&rarr;</td>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: accent, fontSize: 11 }}>{m.potal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
