'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 };

const REPORT_TYPES = ['Compliance Audit', 'Duty Summary', 'Classification History', 'Screening Log'];
const FORMATS = ['PDF', 'CSV', 'Excel'];
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

const MOCK_REPORTS = [
  { id: 'RPT-001', type: 'Duty Summary', date: '2026-04-05', format: 'PDF', status: 'Ready', size: '2.4 MB' },
  { id: 'RPT-002', type: 'Screening Log', date: '2026-04-04', format: 'CSV', status: 'Ready', size: '840 KB' },
  { id: 'RPT-003', type: 'Compliance Audit', date: '2026-04-01', format: 'PDF', status: 'Ready', size: '5.1 MB' },
  { id: 'RPT-004', type: 'Classification History', date: '2026-03-28', format: 'Excel', status: 'Expired', size: '1.2 MB' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('Duty Summary');
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo] = useState('2026-04-06');
  const [format, setFormat] = useState('PDF');
  const [schedFreq, setSchedFreq] = useState('Weekly');
  const [schedEmail, setSchedEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1500);
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>REPORTS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Custom & Scheduled Reports</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Generate on-demand reports or schedule recurring compliance and duty summaries.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Generate Report</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Report Type</label><select value={reportType} onChange={e => setReportType(e.target.value)} style={inputStyle}>{REPORT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={labelStyle}>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Format</label><div style={{ display: 'flex', gap: 8 }}>{FORMATS.map(f => <button key={f} onClick={() => setFormat(f)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: format === f ? accent : 'rgba(255,255,255,0.1)', color: format === f ? '#fff' : 'rgba(255,255,255,0.5)' }}>{f}</button>)}</div></div>
            <button onClick={handleGenerate} disabled={generating} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.6 : 1 }}>{generating ? 'Generating...' : 'Generate Report'}</button>
            {generated && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(74,222,128,0.15)', color: '#4ade80', fontSize: 13, textAlign: 'center' }}>Report generated! Check the table below.</div>}
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Schedule Recurring</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Frequency</label><select value={schedFreq} onChange={e => setSchedFreq(e.target.value)} style={inputStyle}>{FREQUENCIES.map(f => <option key={f}>{f}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Report Type</label><select style={inputStyle}>{REPORT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Email Recipient</label><input value={schedEmail} onChange={e => setSchedEmail(e.target.value)} placeholder="team@company.com" style={inputStyle} /></div>
            <button style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Schedule</button>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Past Reports</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {['ID', 'Type', 'Date', 'Format', 'Size', 'Status'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{MOCK_REPORTS.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', color: accent }}>{r.id}</td>
                <td style={{ padding: '10px' }}>{r.type}</td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.6)' }}>{r.date}</td>
                <td style={{ padding: '10px' }}>{r.format}</td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)' }}>{r.size}</td>
                <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: r.status === 'Ready' ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)', color: r.status === 'Ready' ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>{r.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
