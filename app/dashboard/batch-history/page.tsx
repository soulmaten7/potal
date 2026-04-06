'use client';

import React, { useState, useRef } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 };

const BATCH_TYPES = ['HS Classification', 'Duty Calculation', 'Screening', 'Landed Cost'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Completed: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
  Processing: { bg: 'rgba(250,204,21,0.15)', color: '#facc15' },
  Failed: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
};

const MOCK_BATCHES = [
  { id: 'BATCH-042', type: 'HS Classification', file: 'products_q2.csv', records: 1250, status: 'Completed', created: '2026-04-05 14:30', completed: '2026-04-05 14:32' },
  { id: 'BATCH-041', type: 'Duty Calculation', file: 'import_manifest.csv', records: 340, status: 'Completed', created: '2026-04-04 09:15', completed: '2026-04-04 09:16' },
  { id: 'BATCH-040', type: 'Screening', file: 'vendor_list.csv', records: 89, status: 'Completed', created: '2026-04-03 11:00', completed: '2026-04-03 11:01' },
  { id: 'BATCH-039', type: 'Landed Cost', file: 'catalog_spring.csv', records: 2100, status: 'Failed', created: '2026-04-02 16:45', completed: '2026-04-02 16:48' },
  { id: 'BATCH-038', type: 'HS Classification', file: 'new_skus.csv', records: 45, status: 'Completed', created: '2026-04-01 10:20', completed: '2026-04-01 10:20' },
];

export default function BatchHistoryPage() {
  const [batchType, setBatchType] = useState('HS Classification');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name);
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DATA</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Batch Import / Export History</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Upload CSV files for batch processing and track job history.</p>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>New Batch Upload</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Batch Type</label><select value={batchType} onChange={e => setBatchType(e.target.value)} style={inputStyle}>{BATCH_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>CSV File</label>
              <button onClick={() => fileRef.current?.click()} style={{ ...inputStyle, cursor: 'pointer', color: fileName ? '#fff' : 'rgba(255,255,255,0.4)', textAlign: 'left' }}>{fileName || 'Choose file...'}</button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
            </div>
            <button style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Upload & Process</button>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Job History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {['Batch ID', 'Type', 'File', 'Records', 'Status', 'Created', 'Completed'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{MOCK_BATCHES.map(b => {
              const st = STATUS_COLORS[b.status] || STATUS_COLORS.Failed;
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: accent }}>{b.id}</td>
                  <td style={{ padding: '10px' }}>{b.type}</td>
                  <td style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{b.file}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{b.records.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{b.status}</span></td>
                  <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{b.created}</td>
                  <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{b.completed}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
