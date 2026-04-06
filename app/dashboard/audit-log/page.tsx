'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white',
  fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

type LogStatus = 'success' | 'denied' | 'error' | 'warning';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  status: LogStatus;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'log_001', timestamp: '2026-04-06 14:32:11', user: 'alice@acme.com', action: 'classify', resource: '/api/v1/classify', ip: '203.0.113.42', status: 'success' },
  { id: 'log_002', timestamp: '2026-04-06 14:31:55', user: 'bob@tradetech.io', action: 'screening', resource: '/api/v1/screening', ip: '198.51.100.7', status: 'success' },
  { id: 'log_003', timestamp: '2026-04-06 14:29:40', user: 'carol@globalship.de', action: 'calculate', resource: '/api/v1/calculate', ip: '192.0.2.88', status: 'success' },
  { id: 'log_004', timestamp: '2026-04-06 14:27:18', user: 'api_key_xyz', action: 'classify', resource: '/api/v1/classify/batch', ip: '10.0.0.5', status: 'error' },
  { id: 'log_005', timestamp: '2026-04-06 14:25:03', user: 'dave@logistics.jp', action: 'export', resource: '/api/v1/audit/export', ip: '203.0.113.19', status: 'denied' },
  { id: 'log_006', timestamp: '2026-04-06 14:22:47', user: 'alice@acme.com', action: 'fta', resource: '/api/v1/fta', ip: '203.0.113.42', status: 'success' },
  { id: 'log_007', timestamp: '2026-04-06 14:20:31', user: 'eve@clearance.au', action: 'documents', resource: '/api/v1/customs-docs/generate', ip: '192.0.2.14', status: 'success' },
  { id: 'log_008', timestamp: '2026-04-06 14:18:09', user: 'frank@freight.ca', action: 'screening', resource: '/api/v1/screening', ip: '198.51.100.22', status: 'warning' },
  { id: 'log_009', timestamp: '2026-04-06 14:15:55', user: 'api_key_abc', action: 'calculate', resource: '/api/v1/calculate/ddp-vs-ddu', ip: '10.0.0.9', status: 'success' },
  { id: 'log_010', timestamp: '2026-04-06 14:13:22', user: 'grace@customs.fr', action: 'classify', resource: '/api/v1/classify', ip: '192.0.2.77', status: 'success' },
  { id: 'log_011', timestamp: '2026-04-06 14:11:04', user: 'henry@import.kr', action: 'tax', resource: '/api/v1/tax/us-sales-tax', ip: '203.0.113.61', status: 'success' },
  { id: 'log_012', timestamp: '2026-04-06 14:09:33', user: 'irene@broker.sg', action: 'screening', resource: '/api/v1/screening', ip: '198.51.100.44', status: 'denied' },
];

const STATUS_CFG: Record<LogStatus, { bg: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  denied:  { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  error:   { bg: 'rgba(234,179,8,0.15)', color: '#facc15' },
  warning: { bg: 'rgba(251,146,60,0.15)', color: '#fb923c' },
};

const PAGE_SIZE = 8;

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = MOCK_LOGS.filter(l => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (userFilter && !l.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const csv = ['ID,Timestamp,User,Action,Resource,IP,Status',
      ...filtered.map(l => `${l.id},${l.timestamp},${l.user},${l.action},${l.resource},${l.ip},${l.status}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueActions = Array.from(new Set(MOCK_LOGS.map(l => l.action)));

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Audit Log</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Complete record of all API actions, user activity, and system events.</p>
          </div>
          <button onClick={handleExport} style={{ padding: '10px 20px', background: accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ↓ Export CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 5 }}>Action</div>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ ...selectStyle, minWidth: 140 }}>
              <option value="all">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 5 }}>User / API Key</div>
            <input value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }} placeholder="Search user or key…" style={{ ...inputStyle, minWidth: 200 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 5 }}>From</div>
            <input value={dateFrom} onChange={e => setDateFrom(e.target.value)} type="date" style={selectStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 5 }}>To</div>
            <input value={dateTo} onChange={e => setDateTo(e.target.value)} type="date" style={selectStyle} />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
            {filtered.length} records
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 100px 1fr 120px 80px', gap: 12, padding: '10px 18px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.15)' }}>
            <span>Timestamp</span><span>User</span><span>Action</span><span>Resource</span><span>IP Address</span><span style={{ textAlign: 'center' }}>Status</span>
          </div>
          {paged.length === 0 ? (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No records match the current filters.</div>
          ) : (
            paged.map((log, i) => {
              const st = STATUS_CFG[log.status];
              return (
                <div key={log.id} style={{
                  display: 'grid', gridTemplateColumns: '160px 160px 100px 1fr 120px 80px', gap: 12,
                  padding: '12px 18px', borderBottom: i < paged.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{log.timestamp.replace('2026-04-06 ', '')}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.user}>{log.user}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', textAlign: 'center', textTransform: 'capitalize' }}>{log.action}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.resource}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{log.ip}</span>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 5, background: st.bg, color: st.color, textTransform: 'uppercase' }}>{log.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: page === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 700, fontSize: 13 }}>← Prev</button>
            <span style={{ padding: '8px 14px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: page === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'white', cursor: page === totalPages ? 'default' : 'pointer', fontWeight: 700, fontSize: 13 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
