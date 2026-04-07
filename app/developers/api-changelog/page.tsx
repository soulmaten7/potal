'use client';

import React from 'react';

const accent = '#E8640A';

interface Change { type: 'Added' | 'Changed' | 'Fixed' | 'Deprecated'; text: string }
interface Version { version: string; date: string; changes: Change[] }

const typeColor: Record<string, string> = { Added: '#4ade80', Changed: '#60a5fa', Fixed: '#facc15', Deprecated: '#f87171' };
const typeBg: Record<string, string> = { Added: 'rgba(34,197,94,0.15)', Changed: 'rgba(96,165,250,0.15)', Fixed: 'rgba(250,204,21,0.15)', Deprecated: 'rgba(248,113,113,0.15)' };

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER DOCS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>API Changelog</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Track all API changes, new features, and deprecations.</p>

        <div style={{ position: 'relative', paddingLeft: 32 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.08)' }} />

          {VERSIONS.map((v, vi) => (
            <div key={v.version} style={{ marginBottom: 32, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -32, top: 4, width: 16, height: 16, borderRadius: '50%', background: vi === 0 ? accent : 'rgba(255,255,255,0.15)', border: `2px solid ${vi === 0 ? accent : 'rgba(255,255,255,0.2)'}` }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: vi === 0 ? accent : 'rgba(255,255,255,0.9)' }}>{v.version}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{v.date}</span>
                {vi === 0 && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 700 }}>LATEST</span>}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {v.changes.map((c, ci) => (
                  <div key={ci} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: ci < v.changes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: typeBg[c.type], color: typeColor[c.type], fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{c.type}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{c.text}</span>
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
