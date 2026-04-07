'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user?: string;
  inputSummary: string;
  resultSummary: string;
  status: 'success' | 'flagged' | 'error' | 'pending';
}

interface AuditResult {
  entries?: AuditEntry[];
  total?: number;
  page?: number;
  pageSize?: number;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'classification', label: 'Classification' },
  { value: 'screening', label: 'Screening' },
  { value: 'calculation', label: 'Calculation' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  success: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'SUCCESS' },
  flagged: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'FLAGGED' },
  error: { bg: 'rgba(234,179,8,0.15)', color: '#facc15', label: 'ERROR' },
  pending: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: 'PENDING' },
};

export default function AuditTrailPage() {
  const [txnId, setTxnId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionType, setActionType] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (p = 1) => {
    setLoading(true); setError(''); setPage(p);
    if (p === 1) setResult(null);
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          type: 'audit-trail',
          transactionId: txnId.trim() || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          actionType: actionType === 'all' ? undefined : actionType,
          page: p,
          pageSize: 10,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to fetch audit trail.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const entries = result?.entries ?? [];
  const totalPages = result?.total && result?.pageSize ? Math.ceil(result.total / result.pageSize) : 1;

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return ts; }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Audit Trail Viewer</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Review a complete log of classifications, screenings, and calculations with timestamps and outcomes.
        </p>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Transaction ID (optional — or use date range below)</label>
            <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="e.g. txn_abc123" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(1)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Date From</label>
            <input value={dateFrom} onChange={e => setDateFrom(e.target.value)} type="date" style={selectStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Date To</label>
            <input value={dateTo} onChange={e => setDateTo(e.target.value)} type="date" style={selectStyle} />
          </div>
          <div style={{ gridColumn: '3/5' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Action Type</label>
            <select value={actionType} onChange={e => setActionType(e.target.value)} style={selectStyle}>
              {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={() => handleSubmit(1)} disabled={loading} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer', marginBottom: 8,
        }}>
          {loading ? 'Loading...' : 'Search Audit Trail'}
        </button>

        {error && <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20 }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {result.total !== undefined ? `${result.total.toLocaleString()} records found` : `${entries.length} records`}
              </div>
              {result.total !== undefined && result.total > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Page {page} of {totalPages}</div>
              )}
            </div>

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No audit records found for the selected filters.</div>
            ) : (
              <>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr 1fr 80px', gap: 12, padding: '8px 16px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
                  <span>Timestamp</span><span>Action</span><span>Input</span><span>Result</span><span style={{ textAlign: 'center' }}>Status</span>
                </div>

                {/* Rows */}
                {entries.map((entry, i) => {
                  const st = STATUS_COLORS[entry.status] ?? STATUS_COLORS.pending;
                  return (
                    <div key={entry.id || i} style={{
                      display: 'grid', gridTemplateColumns: '120px 100px 1fr 1fr 80px', gap: 12,
                      padding: '12px 16px', borderRadius: 8, marginBottom: 4,
                      background: i % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'transparent',
                      border: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{formatTime(entry.timestamp)}</div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{entry.action}</span>
                        {entry.user && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{entry.user}</div>}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.inputSummary}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.resultSummary}</div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 7px', borderRadius: 5, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button onClick={() => handleSubmit(page - 1)} disabled={page <= 1 || loading} style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none', background: page <= 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                      color: page <= 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 700,
                    }}>← Prev</button>
                    <span style={{ padding: '8px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
                    <button onClick={() => handleSubmit(page + 1)} disabled={page >= totalPages || loading} style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none', background: page >= totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                      color: page >= totalPages ? 'rgba(255,255,255,0.2)' : 'white', cursor: page >= totalPages ? 'default' : 'pointer', fontSize: 13, fontWeight: 700,
                    }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
