'use client';

import { useState, useEffect, useCallback } from 'react';

interface CheckResult {
  id: string;
  label: string;
  status: 'green' | 'yellow' | 'red';
  message: string;
  lastChecked?: string;
}

interface Division {
  id: string;
  name: string;
  status: 'green' | 'yellow' | 'red';
  layer1: 'done' | 'pending';
  checks: CheckResult[];
}

interface MorningBriefResponse {
  success: boolean;
  timestamp: string;
  durationMs: number;
  overall: 'green' | 'yellow' | 'red';
  summary: { green: number; yellow: number; red: number; total: number };
  divisions: Division[];
  error?: string;
}

const STATUS_COLORS = {
  green: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', dot: '#10b981' },
  yellow: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', dot: '#f59e0b' },
  red: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', dot: '#ef4444' },
};

const STATUS_LABEL = { green: 'Green', yellow: 'Yellow', red: 'Red' };

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DivisionStatusPage() {
  const [data, setData] = useState<MorningBriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = useCallback(async (authSecret: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/morning-brief?secret=${encodeURIComponent(authSecret)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `HTTP ${res.status}`);
        if (res.status === 401) setAuthenticated(false);
        return;
      }
      setData(json);
      setAuthenticated(true);
      // Auto-expand yellow/red divisions
      const alerts = new Set<string>();
      for (const d of json.divisions) {
        if (d.status !== 'green') alerts.add(d.id);
      }
      setExpandedDivisions(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check URL hash for secret
    const hash = window.location.hash.slice(1);
    if (hash) {
      setSecret(hash);
      setAuthenticated(true);
      fetchData(hash);
    }
  }, [fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setAuthenticated(true);
    fetchData(secret.trim());
  };

  const toggleDivision = (id: string) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Division Status</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Admin access required.</p>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="CRON_SECRET"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '10px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Division Status Dashboard
            </h1>
            {data && (
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Last updated: {new Date(data.timestamp).toLocaleString()} ({data.durationMs}ms)
              </p>
            )}
          </div>
          <button
            onClick={() => fetchData(secret)}
            disabled={loading}
            style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <SummaryCard label="Overall" value={STATUS_LABEL[data.overall]} color={STATUS_COLORS[data.overall].dot} />
            <SummaryCard label="Green" value={String(data.summary.green)} color="#10b981" />
            <SummaryCard label="Yellow" value={String(data.summary.yellow)} color="#f59e0b" />
            <SummaryCard label="Red" value={String(data.summary.red)} color="#ef4444" />
          </div>
        )}

        {/* Division List */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.divisions.map(division => {
              const colors = STATUS_COLORS[division.status];
              const expanded = expandedDivisions.has(division.id);

              return (
                <div key={division.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${expanded ? colors.border : '#e2e8f0'}`, overflow: 'hidden' }}>
                  {/* Division Header */}
                  <button
                    onClick={() => toggleDivision(division.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', border: 'none', background: expanded ? colors.bg : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', minWidth: 28 }}>{division.id}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', flex: 1 }}>{division.name}</span>
                    {division.layer1 === 'pending' && (
                      <span style={{ fontSize: 11, padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontWeight: 600 }}>Layer 1 미완</span>
                    )}
                    <span style={{ fontSize: 12, color: '#94a3b8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {/* Checks Detail */}
                  {expanded && (
                    <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${colors.border}22` }}>
                      {division.checks.map(check => {
                        const checkColors = STATUS_COLORS[check.status];
                        return (
                          <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: checkColors.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{check.label}</span>
                            <span style={{ fontSize: 12, color: checkColors.text }}>{check.message}</span>
                            {check.lastChecked && (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatAge(check.lastChecked)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
            Loading division status...
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
