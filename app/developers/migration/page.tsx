'use client';

import React, { useState } from 'react';

const accent = '#E8640A';

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
    <div className="min-h-screen bg-white py-16 px-5">
      <div className="max-w-7xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,100,10,0.1)', color: accent }}>DEVELOPER DOCS</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Migration Guide</h1>
        <p className="text-slate-500 mb-8 text-[15px]">Step-by-step guides to migrate from competitors or manual processes to POTAL.</p>

        <div className="flex flex-col gap-3">
          {GUIDES.map(g => {
            const isOpen = expanded === g.from;
            return (
              <div key={g.from} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <button onClick={() => setExpanded(isOpen ? null : g.from)} className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-slate-50 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-slate-800">From {g.from}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">{g.time}</span>
                  </div>
                  <span className="text-sm text-slate-400 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5">
                    <div className="text-[13px] font-bold text-slate-500 mb-3">Key Differences</div>
                    <div className="overflow-x-auto mb-5">
                      <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <th className="text-left px-3 py-2 text-[11px] text-slate-400 font-semibold">Aspect</th>
                            <th className="text-left px-3 py-2 text-[11px] text-red-400 font-semibold">{g.from}</th>
                            <th className="text-left px-3 py-2 text-[11px] text-emerald-500 font-semibold">POTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.differences.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td className="px-3 py-2 text-slate-600 font-semibold">{d.aspect}</td>
                              <td className="px-3 py-2 text-slate-400">{d.theirs}</td>
                              <td className="px-3 py-2 text-slate-700">{d.potal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-[13px] font-bold text-slate-500 mb-3">API Mapping</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <th className="text-left px-3 py-2 text-[11px] text-slate-400 font-semibold">{g.from}</th>
                            <th className="text-center px-2 py-2 text-slate-300">&rarr;</th>
                            <th className="text-left px-3 py-2 text-[11px] font-semibold" style={{ color: accent }}>POTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.mappings.map((m, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">{m.theirs}</td>
                              <td className="text-center text-slate-300">&rarr;</td>
                              <td className="px-3 py-2 font-mono text-[11px]" style={{ color: accent }}>{m.potal}</td>
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
