'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────
interface ApiKey {
  id: string;
  prefix: string;
  type: 'publishable' | 'secret';
  name: string;
  isActive: boolean;
  rateLimitPerMinute: number;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface UsageData {
  period: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseMs: number;
  plan: {
    id: string;
    limit: number | string;
    used: number;
    remaining: number | string;
    usagePercent: number;
  };
}

// ─── Tabs ───────────────────────────────────────────
type TabId = 'overview' | 'keys' | 'widget' | 'usage';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'keys', label: 'API Keys', icon: '🔑' },
  { id: 'widget', label: 'Widget', icon: '🧩' },
  { id: 'usage', label: 'Usage', icon: '📈' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sellerInfo, setSellerInfo] = useState<{ sellerId: string; plan: string } | null>(null);

  // Widget config
  const [widgetOrigin, setWidgetOrigin] = useState('CN');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [widgetProductName, setWidgetProductName] = useState('');
  const [widgetPrice, setWidgetPrice] = useState('');
  const [widgetShipping, setWidgetShipping] = useState('');

  // New key creation
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'publishable' | 'secret'>('publishable');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreateKey, setShowCreateKey] = useState(false);

  const apiBase = 'https://potal-x1vl.vercel.app';

  // ─── Auth & Load Data ─────────────────────────────
  const authenticate = useCallback(async () => {
    if (!secretKey.startsWith('sk_live_')) {
      setError('Secret key must start with sk_live_');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Load keys
      const keysRes = await fetch(`${apiBase}/api/v1/sellers/keys`, {
        headers: { 'X-API-Key': secretKey },
      });
      const keysData = await keysRes.json();

      if (!keysData.success) {
        throw new Error(keysData.error?.message || 'Authentication failed');
      }

      setKeys(keysData.data.keys);

      // Load usage
      const usageRes = await fetch(`${apiBase}/api/v1/sellers/usage`, {
        headers: { 'X-API-Key': secretKey },
      });
      const usageData = await usageRes.json();
      if (usageData.success) {
        setUsage(usageData.data);
        setSellerInfo({
          sellerId: '(authenticated)',
          plan: usageData.data.plan.id,
        });
      }

      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  }, [secretKey, apiBase]);

  // ─── Create Key ───────────────────────────────────
  const handleCreateKey = async () => {
    setLoading(true);
    setError(null);
    setCreatedKey(null);

    try {
      const res = await fetch(`${apiBase}/api/v1/sellers/keys`, {
        method: 'POST',
        headers: {
          'X-API-Key': secretKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newKeyType,
          name: newKeyName || 'Default',
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error?.message || 'Failed to create key');

      setCreatedKey(data.data.key.fullKey);
      setShowCreateKey(false);
      setNewKeyName('');

      // Refresh key list
      const keysRes = await fetch(`${apiBase}/api/v1/sellers/keys`, {
        headers: { 'X-API-Key': secretKey },
      });
      const keysData = await keysRes.json();
      if (keysData.success) setKeys(keysData.data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  // ─── Revoke Key ───────────────────────────────────
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${apiBase}/api/v1/sellers/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': secretKey },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to revoke key');

      // Refresh
      const keysRes = await fetch(`${apiBase}/api/v1/sellers/keys`, {
        headers: { 'X-API-Key': secretKey },
      });
      const keysData = await keysRes.json();
      if (keysData.success) setKeys(keysData.data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  // Get the publishable key for widget config
  const publishableKey = keys.find(k => k.type === 'publishable' && k.isActive);

  // ─── Login Screen ─────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 50%, #1a365d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
              <span style={{ color: '#02122c' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: '#02122c' }}>TAL</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 }}>
              Seller Dashboard
            </div>
            <p style={{ fontSize: 14, color: '#888' }}>
              Enter your secret key to access your dashboard
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_..."
              onKeyDown={(e) => e.key === 'Enter' && authenticate()}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '2px solid #e5e7eb',
                fontSize: 15,
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={authenticate}
            disabled={loading || !secretKey}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#94a3b8' : '#02122c',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: '#999' }}>
              Don&apos;t have an account?{' '}
              <Link href="/developers" style={{ color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>
                Get started
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      background: '#f5f5f5',
      color: '#1a1a1a',
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#02122c',
        color: 'white',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              <span style={{ color: 'white' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: 'white' }}>TAL</span>
            </span>
          </Link>
          <span style={{
            background: 'rgba(245,158,11,0.15)',
            color: '#F59E0B',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
          }}>
            Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>
            Plan: <strong style={{ color: '#F59E0B' }}>{usage?.plan.id || 'starter'}</strong>
          </span>
          <Link href="/developers" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            Docs
          </Link>
          <button
            onClick={() => { setIsAuthenticated(false); setSecretKey(''); }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '24px 20px', gap: 24 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#02122c' : '#666',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
              <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>×</button>
            </div>
          )}

          {/* Created key alert */}
          {createdKey && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              padding: '16px 20px',
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{ fontWeight: 700, color: '#047857', marginBottom: 8, fontSize: 14 }}>
                New API Key Created
              </div>
              <div style={{ fontSize: 13, color: '#065f46', marginBottom: 8 }}>
                Copy this key now — it will not be shown again.
              </div>
              <div style={{
                background: '#065f46',
                color: '#6ee7b7',
                padding: '10px 14px',
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 13,
                wordBreak: 'break-all',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>{createdKey}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(createdKey); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: 10,
                  }}
                >
                  Copy
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                style={{
                  marginTop: 10,
                  background: 'none',
                  border: 'none',
                  color: '#047857',
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ─── Overview Tab ─────────────────────── */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Overview</h2>

              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'API Calls', value: usage?.totalRequests ?? '—', sub: 'This month' },
                  { label: 'Success Rate', value: usage ? `${usage.totalRequests > 0 ? Math.round((usage.successCount / usage.totalRequests) * 100) : 100}%` : '—', sub: 'Current period' },
                  { label: 'Avg Response', value: usage ? `${usage.avgResponseMs}ms` : '—', sub: 'P50 latency' },
                  { label: 'Active Keys', value: keys.filter(k => k.isActive).length, sub: `of ${keys.length} total` },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#02122c', marginBottom: 4 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Usage Bar */}
              {usage && typeof usage.plan.limit === 'number' && (
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #e5e7eb',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Monthly Usage</span>
                    <span style={{ fontSize: 14, color: '#666' }}>
                      {usage.plan.used.toLocaleString()} / {(usage.plan.limit as number).toLocaleString()} calls
                    </span>
                  </div>
                  <div style={{
                    background: '#f0f0f0',
                    borderRadius: 8,
                    height: 12,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      background: usage.plan.usagePercent > 80
                        ? '#ef4444'
                        : usage.plan.usagePercent > 50
                          ? '#F59E0B'
                          : '#10b981',
                      height: '100%',
                      width: `${Math.min(100, usage.plan.usagePercent)}%`,
                      borderRadius: 8,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    {typeof usage.plan.remaining === 'number' ? usage.plan.remaining.toLocaleString() : usage.plan.remaining} calls remaining
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div style={{
                background: 'white',
                borderRadius: 12,
                padding: 24,
                border: '1px solid #e5e7eb',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Links</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'API Documentation', href: '/developers/docs', icon: '📖' },
                    { label: 'Widget Playground', href: '/developers/playground', icon: '🎮' },
                    { label: 'Integration Guide', href: '/developers', icon: '🔧' },
                  ].map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: 10,
                        textDecoration: 'none',
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 500,
                        border: '1px solid #e5e7eb',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Keys Tab ─────────────────────────── */}
          {activeTab === 'keys' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>API Keys</h2>
                <button
                  onClick={() => setShowCreateKey(!showCreateKey)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#02122c',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Create Key
                </button>
              </div>

              {/* Create Key Form */}
              {showCreateKey && (
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '2px solid #F59E0B',
                  marginBottom: 16,
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create New API Key</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Name</label>
                      <input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Production Widget"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          fontSize: 14,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Type</label>
                      <select
                        value={newKeyType}
                        onChange={(e) => setNewKeyType(e.target.value as 'publishable' | 'secret')}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          fontSize: 14,
                          boxSizing: 'border-box',
                          background: 'white',
                        }}
                      >
                        <option value="publishable">Publishable (pk_live_) — for widgets</option>
                        <option value="secret">Secret (sk_live_) — for server-side</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleCreateKey}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#F59E0B',
                        color: '#02122c',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {loading ? 'Creating...' : 'Create Key'}
                    </button>
                    <button
                      onClick={() => setShowCreateKey(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#666',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Key List */}
              <div style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}>
                {keys.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                    No API keys found. Create one to get started.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Key</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Created</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((key) => (
                        <tr key={key.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{key.name}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#666' }}>
                            {key.prefix}...
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: key.type === 'publishable' ? '#dbeafe' : '#fef3c7',
                              color: key.type === 'publishable' ? '#2563eb' : '#d97706',
                            }}>
                              {key.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: key.isActive ? '#dcfce7' : '#fee2e2',
                              color: key.isActive ? '#16a34a' : '#dc2626',
                            }}>
                              {key.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {key.isActive && (
                              <button
                                onClick={() => handleRevokeKey(key.id)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #fca5a5',
                                  color: '#dc2626',
                                  padding: '5px 12px',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ─── Widget Tab ───────────────────────── */}
          {activeTab === 'widget' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Widget Configuration</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Settings */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #e5e7eb',
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Widget Settings</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Product Name</label>
                      <input
                        value={widgetProductName}
                        onChange={(e) => setWidgetProductName(e.target.value)}
                        placeholder="e.g. Cotton T-Shirt"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Price (USD)</label>
                        <input
                          value={widgetPrice}
                          onChange={(e) => setWidgetPrice(e.target.value)}
                          placeholder="49.99"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Shipping (USD)</label>
                        <input
                          value={widgetShipping}
                          onChange={(e) => setWidgetShipping(e.target.value)}
                          placeholder="8.50"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Origin Country</label>
                        <select
                          value={widgetOrigin}
                          onChange={(e) => setWidgetOrigin(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}
                        >
                          <option value="CN">China (CN)</option>
                          <option value="US">United States (US)</option>
                          <option value="DE">Germany (DE)</option>
                          <option value="JP">Japan (JP)</option>
                          <option value="KR">South Korea (KR)</option>
                          <option value="VN">Vietnam (VN)</option>
                          <option value="IN">India (IN)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Theme</label>
                        <select
                          value={widgetTheme}
                          onChange={(e) => setWidgetTheme(e.target.value as 'light' | 'dark')}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embed Code */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #e5e7eb',
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Embed Code</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                    Copy this code and paste it into your product page HTML.
                  </p>
                  <div style={{
                    background: '#1e293b',
                    borderRadius: 10,
                    padding: 16,
                    position: 'relative',
                  }}>
                    <button
                      onClick={() => {
                        const code = `<div id="potal-widget"></div>\n<script src="https://potal-x1vl.vercel.app/widget/potal-widget.js"\n  data-api-key="${publishableKey?.prefix || 'YOUR_PUBLISHABLE_KEY'}..."\n  data-origin="${widgetOrigin}"${widgetProductName ? `\n  data-product-name="${widgetProductName}"` : ''}${widgetPrice ? `\n  data-price="${widgetPrice}"` : ''}${widgetShipping ? `\n  data-shipping="${widgetShipping}"` : ''}\n  data-theme="${widgetTheme}"></script>`;
                        navigator.clipboard.writeText(code);
                      }}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'rgba(255,255,255,0.7)',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                    <pre style={{
                      margin: 0,
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: '#a5f3fc',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
{`<div id="potal-widget"></div>
<script
  src="https://potal-x1vl.vercel.app/widget/potal-widget.js"
  data-api-key="${publishableKey?.prefix || 'YOUR_KEY'}..."
  data-origin="${widgetOrigin}"${widgetProductName ? `
  data-product-name="${widgetProductName}"` : ''}${widgetPrice ? `
  data-price="${widgetPrice}"` : ''}${widgetShipping ? `
  data-shipping="${widgetShipping}"` : ''}
  data-theme="${widgetTheme}">
</script>`}
                    </pre>
                  </div>

                  <div style={{ marginTop: 16, fontSize: 13, color: '#888' }}>
                    <strong>Tip:</strong> Use your publishable key (pk_live_) for client-side widgets.
                    Never expose your secret key in client-side code.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Usage Tab ────────────────────────── */}
          {activeTab === 'usage' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>API Usage</h2>

              {usage ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>TOTAL REQUESTS</div>
                      <div style={{ fontSize: 32, fontWeight: 800 }}>{usage.totalRequests.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>SUCCESS / ERROR</div>
                      <div style={{ fontSize: 32, fontWeight: 800 }}>
                        <span style={{ color: '#10b981' }}>{usage.successCount}</span>
                        <span style={{ color: '#ccc', margin: '0 4px' }}>/</span>
                        <span style={{ color: usage.errorCount > 0 ? '#ef4444' : '#ccc' }}>{usage.errorCount}</span>
                      </div>
                    </div>
                    <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>AVG RESPONSE TIME</div>
                      <div style={{ fontSize: 32, fontWeight: 800 }}>{usage.avgResponseMs}<span style={{ fontSize: 16, color: '#888' }}>ms</span></div>
                    </div>
                  </div>

                  {/* Plan Usage */}
                  <div style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 24,
                    border: '1px solid #e5e7eb',
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Plan: {usage.plan.id}</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 24,
                      marginBottom: 20,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Monthly Limit</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>
                          {typeof usage.plan.limit === 'number' ? usage.plan.limit.toLocaleString() : usage.plan.limit}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Used</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{usage.plan.used.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Remaining</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>
                          {typeof usage.plan.remaining === 'number' ? usage.plan.remaining.toLocaleString() : usage.plan.remaining}
                        </div>
                      </div>
                    </div>

                    {typeof usage.plan.limit === 'number' && (
                      <div>
                        <div style={{
                          background: '#f0f0f0',
                          borderRadius: 8,
                          height: 16,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            background: usage.plan.usagePercent > 80 ? '#ef4444' : usage.plan.usagePercent > 50 ? '#F59E0B' : '#10b981',
                            height: '100%',
                            width: `${Math.min(100, usage.plan.usagePercent)}%`,
                            borderRadius: 8,
                            transition: 'width 0.5s',
                          }} />
                        </div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                          {usage.plan.usagePercent}% of monthly limit used
                        </div>
                      </div>
                    )}

                    {usage.plan.usagePercent > 80 && (
                      <div style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        background: '#fef3c7',
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#92400e',
                      }}>
                        You&apos;re approaching your plan limit.{' '}
                        <Link href="/pricing" style={{ color: '#d97706', fontWeight: 700 }}>
                          Upgrade your plan
                        </Link>{' '}
                        for more API calls.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 40,
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                  color: '#999',
                }}>
                  No usage data available for this period.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
