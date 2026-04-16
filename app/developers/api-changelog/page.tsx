'use client';

import React from 'react';

const accent = '#E8640A';

interface Change { type: 'Added' | 'Changed' | 'Fixed' | 'Deprecated'; text: string }
interface Version { version: string; date: string; changes: Change[] }

const typeStyle: Record<string, string> = {
  Added: 'bg-emerald-50 text-emerald-600',
  Changed: 'bg-blue-50 text-blue-600',
  Fixed: 'bg-amber-50 text-amber-600',
  Deprecated: 'bg-red-50 text-red-500',
};

const VERSIONS: Version[] = [
  { version: 'v2.4.0', date: 'April 2026', changes: [
    { type: 'Added', text: 'ICS2 pre-arrival filing validation endpoint' },
    { type: 'Added', text: 'Type 86 informal entry eligibility check' },
    { type: 'Added', text: 'PDF document generation with base64 output' },
    { type: 'Changed', text: 'Expanded /calculate response with hs10Resolution field' },
    { type: 'Fixed', text: 'FTA detection for RCEP member countries' },
  ]},
  { version: 'v2.3.0', date: 'March 2026', changes: [
    { type: 'Added', text: 'ECCN classification with Commerce Control List mapping' },
    { type: 'Added', text: 'Dual-use goods check under EAR/EU/Wassenaar' },
    { type: 'Added', text: 'Data freshness API (/api/v1/data-freshness)' },
    { type: 'Changed', text: 'Screening now returns embargo status in response' },
    { type: 'Fixed', text: 'De minimis threshold for Australia updated to AUD 1000' },
    { type: 'Deprecated', text: '/api/v1/verify/pre-shipment — use /api/v1/verify?mode=comprehensive' },
  ]},
  { version: 'v2.2.0', date: 'February 2026', changes: [
    { type: 'Added', text: 'Batch classification via CSV upload (/classify/csv)' },
    { type: 'Added', text: 'Multi-country cost comparison endpoint' },
    { type: 'Changed', text: 'HS classification now uses 10-field input (was 7)' },
    { type: 'Fixed', text: 'VAT calculation for UK reverse charge mechanism' },
  ]},
  { version: 'v2.1.0', date: 'January 2026', changes: [
    { type: 'Added', text: 'Webhook delivery with signing secret verification' },
    { type: 'Added', text: 'Rate lock mechanism for exchange rates' },
    { type: 'Changed', text: 'Increased rate limit to 100K calls/month for free tier' },
    { type: 'Fixed', text: 'Section 301 tariff calculation for List 4A products' },
  ]},
  { version: 'v2.0.0', date: 'December 2025', changes: [
    { type: 'Added', text: 'Global Landed Cost engine with 240 country support' },
    { type: 'Added', text: 'FTA detection and preferential rate application' },
    { type: 'Added', text: 'Sanctions screening with fuzzy matching' },
    { type: 'Added', text: 'Trade remedies (AD/CVD) database with 119,700+ cases' },
    { type: 'Changed', text: 'Complete API redesign — all endpoints now under /api/v1/' },
    { type: 'Deprecated', text: 'Legacy /api/calculate endpoint — migrate to /api/v1/calculate' },
  ]},
];

export default function ApiChangelogPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-5">
      <div className="max-w-7xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,100,10,0.1)', color: accent }}>DEVELOPER DOCS</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">API Changelog</h1>
        <p className="text-slate-500 mb-10 text-[15px]">Track all API changes, new features, and deprecations.</p>

        <div className="relative pl-8">
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-slate-200" />

          {VERSIONS.map((v, vi) => (
            <div key={v.version} className="mb-8 relative">
              <div className="absolute -left-8 top-1 w-4 h-4 rounded-full border-2" style={{ background: vi === 0 ? accent : '#f1f5f9', borderColor: vi === 0 ? accent : '#e2e8f0' }} />

              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-extrabold" style={{ color: vi === 0 ? accent : '#1e293b' }}>{v.version}</span>
                <span className="text-[13px] text-slate-400">{v.date}</span>
                {vi === 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">LATEST</span>}
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                {v.changes.map((c, ci) => (
                  <div key={ci} className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: ci < v.changes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex-shrink-0 mt-0.5 ${typeStyle[c.type]}`}>{c.type}</span>
                    <span className="text-[13px] text-slate-600 leading-relaxed">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
