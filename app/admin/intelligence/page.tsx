'use client';

import { useState, useEffect, useCallback } from 'react';

interface CompetitorCheck {
  name: string;
  status: 'green' | 'yellow' | 'red';
  latencyMs: number;
  message: string;
  pricingStatus?: 'green' | 'yellow' | 'red';
}

interface ScanLog {
  id: number;
  checked_at: string;
  overall_status: 'green' | 'yellow' | 'red';
  checks: CompetitorCheck[];
  duration_ms: number;
}

const STATUS_DOT: Record<string, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

const STATUS_BG: Record<string, string> = {
  green: '#ecfdf5',
  yellow: '#fffbeb',
  red: '#fef2f2',
};

const STATUS_TEXT: Record<string, string> = {
  green: '#065f46',
  yellow: '#92400e',
  red: '#991b1b',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatLatency(ms: number): string {
  if (ms === 0) return 'N/A';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default function IntelligencePage() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [scanning, setScanning] = useState(false);

  const fetchLogs = useCallback(async (authSecret: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/intelligence?secret=${encodeURIComponent(authSecret)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || `HTTP ${res.status}`);
        if (res.status === 401) setAuthenticated(false);
        return;
      }
      setLogs(json.logs);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await fetch(`/api/v1/admin/competitor-scan?secret=${encodeURIComponent(secret)}`);
      await fetchLogs(secret);
    } catch {
      setError('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setSecret(hash);
      setAuthenticated(true);
      fetchLogs(hash);
    }
  }, [fetchLogs]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setAuthenticated(true);
    fetchLogs(secret.trim());
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>Intelligence Dashboard</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Admin access required.</p>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="CRON_SECRET"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '10px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  const latest = logs[0];
  const previous = logs[1];

  // Detect changes between latest and previous scan
  const changes: { name: string; type: string; detail: string }[] = [];
  if (latest && previous) {
    for (const curr of latest.checks) {
      const prev = previous.checks.find(p => p.name === curr.name);
      if (!prev) continue;
      if (prev.status !== curr.status) {
        changes.push({
          name: curr.name.replace('competitor:', ''),
          type: curr.status === 'red' ? 'DOWN' : curr.status === 'yellow' ? 'WARNING' : 'RECOVERED',
          detail: `${prev.status} -> ${curr.status}`,
        });
      }
      if (prev.pricingStatus && curr.pricingStatus && prev.pricingStatus !== curr.pricingStatus) {
        changes.push({
          name: curr.name.replace('competitor:', ''),
          type: 'PRICING',
          detail: `Pricing page: ${prev.pricingStatus} -> ${curr.pricingStatus}`,
        });
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              D15 Intelligence Dashboard
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              10 Competitors &middot; {logs.length} scan{logs.length !== 1 ? 's' : ''} in history
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={triggerScan}
              disabled={scanning}
              style={{ padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: scanning ? 'not-allowed' : 'pointer', opacity: scanning ? 0.6 : 1 }}
            >
              {scanning ? 'Scanning...' : 'Run Scan Now'}
            </button>
            <button
              onClick={() => fetchLogs(secret)}
              disabled={loading}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#991b1b', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Changes Alert */}
        {changes.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Changes Detected</div>
            {changes.map((c, i) => (
              <div key={i} style={{ fontSize: 13, color: '#78350f', padding: '2px 0' }}>
                <strong>{c.name}</strong>: {c.type} — {c.detail}
              </div>
            ))}
          </div>
        )}

        {/* Latest Scan Results */}
        {latest && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: STATUS_DOT[latest.overall_status] }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Latest Scan</h2>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(latest.checked_at)} &middot; {latest.duration_ms}ms</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {latest.checks.map((comp) => {
                const name = comp.name.replace('competitor:', '');
                return (
                  <div key={comp.name} style={{
                    background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px',
                    borderLeft: `4px solid ${STATUS_DOT[comp.status]}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: STATUS_BG[comp.status], color: STATUS_TEXT[comp.status],
                      }}>
                        {comp.status === 'green' ? 'UP' : comp.status === 'yellow' ? 'SLOW' : 'DOWN'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Latency: {formatLatency(comp.latencyMs)}
                    </div>
                    {comp.pricingStatus && (
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        Pricing:
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[comp.pricingStatus] }} />
                        {comp.pricingStatus === 'green' ? 'OK' : comp.pricingStatus === 'yellow' ? 'Changed' : 'Down'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scan History */}
        {logs.length > 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Scan History</h2>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Sites Up</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const upCount = log.checks.filter(c => c.status === 'green').length;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', color: '#374151' }}>{formatDate(log.checked_at)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[log.overall_status], display: 'inline-block' }} />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: '#374151' }}>{upCount}/{log.checks.length}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8' }}>{log.duration_ms}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading && !logs.length && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
            Loading intelligence data...
          </div>
        )}

        {!loading && !logs.length && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
            No scan data yet. Click &quot;Run Scan Now&quot; to start.
          </div>
        )}
      </div>
    </div>
  );
}
