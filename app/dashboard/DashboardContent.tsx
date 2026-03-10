'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useSupabase } from '@/app/context/SupabaseProvider';

// Paddle.js global type
declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: { token: string; environment?: string }) => void;
      Checkout: {
        open: (config: {
          transactionId: string;
          settings?: {
            displayMode?: string;
            theme?: string;
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

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
}

interface SellerProfile {
  id: string;
  email: string;
  companyName: string | null;
  plan: string;
  subscriptionStatus: string;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
}

interface UsageData {
  period: string;
  used: number;
  limit: number | string;
  remaining: number | string;
  usagePercent: number;
}

interface CountryAnalytics {
  country: string;
  requests: number;
  successRate: number;
  avgResponseMs: number;
}

interface PlatformAnalytics {
  endpoint: string;
  requests: number;
  successRate: number;
}

interface ApiLogEntry {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  destinationCountry: string;
  timestamp: string;
}

type TabId = 'overview' | 'keys' | 'widget' | 'usage' | 'countries' | 'platforms' | 'logs' | 'billing';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'keys', label: 'API Keys', icon: '🔑' },
  { id: 'widget', label: 'Widget', icon: '🧩' },
  { id: 'usage', label: 'Usage', icon: '📈' },
  { id: 'countries', label: 'Countries', icon: '🌍' },
  { id: 'platforms', label: 'Platforms', icon: '🤖' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'billing', label: 'Billing', icon: '💳' },
];

// Plan display config (mirrors paddle.ts PLAN_CONFIG — 세션 28 신 요금제)
const PLANS = [
  {
    id: 'basic' as const,
    name: 'Basic',
    priceMonthly: '$20',
    priceAnnualMonthly: '$16',
    priceNote: '/ month',
    calls: '2,000',
    features: [
      '2,000 API calls / month',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      'FTA & preferential rate detection',
      'Anti-dumping / CVD duty alerts',
      '30+ language support',
      'Email support',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    priceMonthly: '$80',
    priceAnnualMonthly: '$64',
    priceNote: '/ month',
    calls: '10,000',
    popular: true,
    features: [
      '10,000 API calls / month',
      'Custom widget branding',
      'Batch API (100 items)',
      'Webhook notifications',
      'Advanced analytics dashboard',
      'Priority email support',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    priceMonthly: '$300',
    priceAnnualMonthly: '$240',
    priceNote: '/ month',
    calls: '50,000+',
    features: [
      '50,000+ API calls / month',
      'White-label widget',
      'Dedicated infrastructure',
      'SSO & team management',
      'SLA guarantee (99.99%)',
      'Custom integrations',
    ],
  },
];

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, session } = useSupabase();

  // Handle checkout redirect
  const checkoutStatus = searchParams.get('checkout');
  const checkoutPlan = searchParams.get('plan');

  const [activeTab, setActiveTab] = useState<TabId>(
    checkoutStatus ? 'billing' : 'overview'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Widget config
  const [widgetOrigin, setWidgetOrigin] = useState('CN');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('light');
  const [widgetProductName, setWidgetProductName] = useState('');
  const [widgetPrice, setWidgetPrice] = useState('');
  const [widgetShipping, setWidgetShipping] = useState('');

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // New key creation
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'publishable' | 'secret'>('publishable');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreateKey, setShowCreateKey] = useState(false);

  // Analytics (4-08, 4-09, 4-11)
  const [countryData, setCountryData] = useState<CountryAnalytics[]>([]);
  const [platformData, setPlatformData] = useState<PlatformAnalytics[]>([]);
  const [logData, setLogData] = useState<ApiLogEntry[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Load Data ────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const token = session.access_token;
      const res = await fetch('/api/v1/sellers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        if (res.status === 404) {
          setError('Seller profile not found. Please contact support.');
        } else {
          setError(data.error?.message || 'Failed to load dashboard.');
        }
        return;
      }

      setSeller(data.data.seller);
      setKeys(data.data.keys);
      setUsage(data.data.usage);
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      // Not logged in — redirect to auth
      const timer = setTimeout(() => {
        if (!session) router.push('/auth/login');
      }, 1500);
      return () => clearTimeout(timer);
    }
    loadData();
  }, [session, loadData, router]);

  // ─── Load Analytics (lazy — only when tab is selected) ──
  const loadAnalytics = useCallback(async (type: 'countries' | 'platforms' | 'logs') => {
    if (!session) return;
    setAnalyticsLoading(true);
    try {
      const limit = type === 'logs' ? '100' : '';
      const url = `/api/v1/sellers/analytics?type=${type}${limit ? `&limit=${limit}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'countries') setCountryData(data.data.countries || []);
        else if (type === 'platforms') setPlatformData(data.data.platforms || []);
        else if (type === 'logs') setLogData(data.data.logs || []);
      }
    } catch { /* silent fail */ }
    finally { setAnalyticsLoading(false); }
  }, [session]);

  // Load analytics when tab changes
  useEffect(() => {
    if (activeTab === 'countries' && countryData.length === 0) loadAnalytics('countries');
    if (activeTab === 'platforms' && platformData.length === 0) loadAnalytics('platforms');
    if (activeTab === 'logs' && logData.length === 0) loadAnalytics('logs');
  }, [activeTab, countryData.length, platformData.length, logData.length, loadAnalytics]);

  // ─── Create Key (uses secret key from keys list) ──
  const getSecretKey = () => {
    // We need to use the /api/v1/sellers/me endpoint + session token to create keys
    // Instead, we'll create a new endpoint or use session-based key creation
    return session?.access_token || '';
  };

  const handleCreateKey = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setCreatedKey(null);

    try {
      // Session-based key creation — no existing key needed
      const res = await fetch('/api/v1/sellers/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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

      // Refresh data
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setLoading(false);
    }
  };

  // ─── Revoke Key ───────────────────────────────────
  const handleRevokeKey = async (keyId: string) => {
    if (!session || !confirm('Are you sure you want to revoke this key?')) return;

    try {
      const res = await fetch(`/api/v1/sellers/keys/revoke?id=${keyId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to revoke');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  // ─── Billing: Upgrade (Paddle.js Overlay Checkout) ────
  const handleUpgrade = async (planId: string) => {
    if (!session) return;
    setBillingLoading(true);
    setError(null);

    try {
      // 1. Create transaction server-side
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create checkout');

      // 2. Open Paddle.js overlay checkout (always shows payment form)
      if (window.Paddle) {
        window.Paddle.Checkout.open({
          transactionId: data.data.transactionId,
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            successUrl: `${window.location.origin}/dashboard?checkout=success&plan=${planId}`,
          },
        });
      } else {
        // Fallback: redirect if Paddle.js not loaded
        if (data.data.url) {
          window.location.href = data.data.url;
        } else {
          throw new Error('Paddle checkout not available');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBillingLoading(false);
    }
  };

  // ─── Billing: Manage (Customer Portal) ──────────
  const handleManageBilling = async () => {
    if (!session) return;
    setBillingLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to open portal');

      // Redirect to Paddle Customer Portal
      window.location.href = data.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal failed');
    } finally {
      setBillingLoading(false);
    }
  };

  // ─── Sign Out ─────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const publishableKey = keys.find(k => k.type === 'publishable' && k.isActive);

  // ─── Loading / Not Authenticated ──────────────────
  if (!session || loading) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            <span style={{ color: '#02122c' }}>P</span>
            <span style={{ color: '#F59E0B' }}>O</span>
            <span style={{ color: '#02122c' }}>TAL</span>
          </div>
          <p style={{ color: '#888', fontSize: 14 }}>
            {!session ? 'Redirecting to sign in...' : 'Loading dashboard...'}
          </p>
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
      {/* Paddle.js — checkout overlay for payment method collection */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.Paddle) {
            const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
            if (paddleToken) {
              window.Paddle.Initialize({
                token: paddleToken,
                environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox' ? 'sandbox' : undefined,
              });
            }
          }
        }}
      />
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
            {seller?.email}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>
            Plan: <strong style={{ color: '#F59E0B' }}>{seller?.plan || 'free'}</strong>
          </span>
          <Link href="/developers" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>
            Docs
          </Link>
          <button
            onClick={handleSignOut}
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
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              {error}
              <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>x</button>
            </div>
          )}

          {checkoutStatus === 'success' && (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '16px 20px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>&#127881;</span>
              <div>
                <div style={{ fontWeight: 700, color: '#047857', fontSize: 15 }}>
                  Welcome to {checkoutPlan ? checkoutPlan.charAt(0).toUpperCase() + checkoutPlan.slice(1) : ''} Plan!
                </div>
                <div style={{ fontSize: 13, color: '#065f46', marginTop: 2 }}>
                  Your 14-day free trial has started. No charges until the trial ends.
                  You can cancel anytime from <span style={{ fontWeight: 600 }}>Billing &gt; Manage Subscription</span>.
                </div>
              </div>
            </div>
          )}

          {checkoutStatus === 'canceled' && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '14px 20px', borderRadius: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              Checkout was canceled. No charges were made. You can upgrade anytime from the Billing tab.
            </div>
          )}

          {createdKey && (
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '16px 20px', borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#047857', marginBottom: 8, fontSize: 14 }}>New API Key Created</div>
              <div style={{ fontSize: 13, color: '#065f46', marginBottom: 8 }}>Copy this key now — it will not be shown again.</div>
              <div style={{ background: '#065f46', color: '#6ee7b7', padding: '10px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{createdKey}</span>
                <button onClick={() => navigator.clipboard.writeText(createdKey)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}>Copy</button>
              </div>
              <button onClick={() => setCreatedKey(null)} style={{ marginTop: 10, background: 'none', border: 'none', color: '#047857', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
            </div>
          )}

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'API Calls', value: usage?.used ?? '—', sub: 'This month' },
                  { label: 'Plan', value: seller?.plan || '—', sub: seller?.subscriptionStatus || '' },
                  { label: 'Active Keys', value: keys.filter(k => k.isActive).length, sub: `of ${keys.length} total` },
                  { label: 'Remaining', value: typeof usage?.remaining === 'number' ? usage.remaining.toLocaleString() : usage?.remaining ?? '—', sub: 'This month' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{stat.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#02122c', marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {usage && typeof usage.limit === 'number' && (
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Monthly Usage</span>
                    <span style={{ fontSize: 14, color: '#666' }}>{usage.used.toLocaleString()} / {(usage.limit as number).toLocaleString()}</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                    <div style={{ background: usage.usagePercent > 80 ? '#ef4444' : usage.usagePercent > 50 ? '#F59E0B' : '#10b981', height: '100%', width: `${Math.min(100, usage.usagePercent)}%`, borderRadius: 8 }} />
                  </div>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Links</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'API Documentation', href: '/developers/docs', icon: '📖' },
                    { label: 'Widget Playground', href: '/developers/playground', icon: '🎮' },
                    { label: 'Integration Guide', href: '/developers', icon: '🔧' },
                  ].map((link, i) => (
                    <Link key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, textDecoration: 'none', color: '#333', fontSize: 14, fontWeight: 500, border: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: 20 }}>{link.icon}</span>{link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Keys ── */}
          {activeTab === 'keys' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>API Keys</h2>
                <button onClick={() => setShowCreateKey(!showCreateKey)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#02122c', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Create Key</button>
              </div>

              {showCreateKey && (
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '2px solid #F59E0B', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create New API Key</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Name</label>
                      <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Widget" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Type</label>
                      <select value={newKeyType} onChange={(e) => setNewKeyType(e.target.value as 'publishable' | 'secret')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}>
                        <option value="publishable">Publishable (pk_live_)</option>
                        <option value="secret">Secret (sk_live_)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleCreateKey} disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#02122c', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Creating...' : 'Create Key'}</button>
                    <button onClick={() => setShowCreateKey(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#666', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {keys.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>No API keys found.</div>
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
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#666' }}>{key.prefix}...</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: key.type === 'publishable' ? '#dbeafe' : '#fef3c7', color: key.type === 'publishable' ? '#2563eb' : '#d97706' }}>{key.type}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: key.isActive ? '#dcfce7' : '#fee2e2', color: key.isActive ? '#16a34a' : '#dc2626' }}>{key.isActive ? 'Active' : 'Revoked'}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{new Date(key.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {key.isActive && (
                              <button onClick={() => handleRevokeKey(key.id)} style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Revoke</button>
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

          {/* ── Widget ── */}
          {activeTab === 'widget' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Widget Configuration</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Settings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Product Name</label>
                      <input value={widgetProductName} onChange={(e) => setWidgetProductName(e.target.value)} placeholder="e.g. Cotton T-Shirt" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Price (USD)</label>
                        <input value={widgetPrice} onChange={(e) => setWidgetPrice(e.target.value)} placeholder="49.99" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Shipping</label>
                        <input value={widgetShipping} onChange={(e) => setWidgetShipping(e.target.value)} placeholder="8.50" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Origin</label>
                        <select value={widgetOrigin} onChange={(e) => setWidgetOrigin(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}>
                          {['CN', 'US', 'DE', 'JP', 'KR', 'VN', 'IN'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Theme</label>
                        <select value={widgetTheme} onChange={(e) => setWidgetTheme(e.target.value as 'light' | 'dark')} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}>
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Embed Code</h3>
                  <div style={{ background: '#1e293b', borderRadius: 10, padding: 16 }}>
                    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#a5f3fc', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`<div id="potal-widget"></div>
<script
  src="https://www.potal.app/widget/potal-widget.js"
  data-api-key="${publishableKey?.prefix || 'YOUR_KEY'}..."
  data-origin="${widgetOrigin}"${widgetProductName ? `\n  data-product-name="${widgetProductName}"` : ''}${widgetPrice ? `\n  data-price="${widgetPrice}"` : ''}${widgetShipping ? `\n  data-shipping="${widgetShipping}"` : ''}
  data-theme="${widgetTheme}">
</script>`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Usage ── */}
          {activeTab === 'usage' && usage && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>API Usage</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>TOTAL REQUESTS</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{usage.used.toLocaleString()}</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>PLAN LIMIT</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{typeof usage.limit === 'number' ? usage.limit.toLocaleString() : usage.limit}</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 8 }}>REMAINING</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{typeof usage.remaining === 'number' ? usage.remaining.toLocaleString() : usage.remaining}</div>
                </div>
              </div>
              {typeof usage.limit === 'number' && (
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Usage ({usage.usagePercent}%)</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 8, height: 16, overflow: 'hidden' }}>
                    <div style={{ background: usage.usagePercent > 80 ? '#ef4444' : usage.usagePercent > 50 ? '#F59E0B' : '#10b981', height: '100%', width: `${Math.min(100, usage.usagePercent)}%`, borderRadius: 8 }} />
                  </div>
                  {usage.usagePercent > 80 && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                      Approaching limit. <Link href="/pricing" style={{ color: '#d97706', fontWeight: 700 }}>Upgrade</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* ── Countries (4-08) ── */}
          {activeTab === 'countries' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Country Traffic</h2>
                <button onClick={() => loadAnalytics('countries')} disabled={analyticsLoading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#333', fontSize: 13, cursor: 'pointer' }}>
                  {analyticsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {analyticsLoading && countryData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading analytics...</div>
              ) : countryData.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 40, border: '1px solid #e5e7eb', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🌍</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No traffic data yet</div>
                  <div style={{ fontSize: 14 }}>Country analytics will appear once API calls are made.</div>
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Country</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Requests</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Success</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#666' }}>Avg Speed</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#666', width: '30%' }}>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryData.slice(0, 20).map((row, i) => {
                        const maxReq = countryData[0]?.requests || 1;
                        const pct = Math.round((row.requests / maxReq) * 100);
                        return (
                          <tr key={row.country} style={{ borderTop: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '10px 16px', color: '#999', fontSize: 13 }}>{i + 1}</td>
                            <td style={{ padding: '10px 16px', fontWeight: 600 }}>{row.country}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.requests.toLocaleString()}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                              <span style={{ color: row.successRate >= 95 ? '#16a34a' : row.successRate >= 80 ? '#d97706' : '#dc2626' }}>{row.successRate}%</span>
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', color: '#666', fontSize: 13 }}>{row.avgResponseMs}ms</td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                <div style={{ background: '#3b82f6', height: '100%', width: `${pct}%`, borderRadius: 4 }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Platforms (4-09) ── */}
          {activeTab === 'platforms' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Platform Analytics</h2>
                <button onClick={() => loadAnalytics('platforms')} disabled={analyticsLoading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#333', fontSize: 13, cursor: 'pointer' }}>
                  {analyticsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {analyticsLoading && platformData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading analytics...</div>
              ) : platformData.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 40, border: '1px solid #e5e7eb', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No platform data yet</div>
                  <div style={{ fontSize: 14 }}>Platform analytics will appear once API calls come from different endpoints.</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {platformData.map((p) => {
                      const totalReqs = platformData.reduce((s, x) => s + x.requests, 0);
                      const pct = totalReqs > 0 ? Math.round((p.requests / totalReqs) * 100) : 0;
                      const label = p.endpoint.includes('calculate') ? 'Calculate API'
                        : p.endpoint.includes('classify') ? 'Classify API'
                        : p.endpoint.includes('countries') ? 'Countries API'
                        : p.endpoint.includes('widget') ? 'Widget Config'
                        : p.endpoint.includes('rates') ? 'Rates API'
                        : p.endpoint;
                      return (
                        <div key={p.endpoint} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace', marginBottom: 12 }}>{p.endpoint}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                            <div style={{ fontSize: 28, fontWeight: 800 }}>{p.requests.toLocaleString()}</div>
                            <div style={{ fontSize: 14, color: '#888' }}>{pct}%</div>
                          </div>
                          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ background: '#F59E0B', height: '100%', width: `${pct}%`, borderRadius: 4 }} />
                          </div>
                          <div style={{ fontSize: 12, color: p.successRate >= 95 ? '#16a34a' : '#d97706' }}>
                            {p.successRate}% success rate
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Logs (4-11) ── */}
          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>API Logs</h2>
                <button onClick={() => loadAnalytics('logs')} disabled={analyticsLoading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#333', fontSize: 13, cursor: 'pointer' }}>
                  {analyticsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {analyticsLoading && logData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading logs...</div>
              ) : logData.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, padding: 40, border: '1px solid #e5e7eb', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No logs yet</div>
                  <div style={{ fontSize: 14 }}>API request logs will appear here once calls are made.</div>
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Method</th>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Endpoint</th>
                        <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Status</th>
                        <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Country</th>
                        <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, color: '#666' }}>Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logData.map((log, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 14px', color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'monospace', background: log.method === 'POST' ? '#dbeafe' : '#f0fdf4', color: log.method === 'POST' ? '#2563eb' : '#16a34a' }}>{log.method}</span>
                          </td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 12, color: '#555' }}>{log.endpoint}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.statusCode < 400 ? '#dcfce7' : log.statusCode < 500 ? '#fef3c7' : '#fee2e2', color: log.statusCode < 400 ? '#16a34a' : log.statusCode < 500 ? '#d97706' : '#dc2626' }}>{log.statusCode}</span>
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center', fontSize: 12 }}>{log.destinationCountry || '—'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 12, color: log.responseTimeMs > 500 ? '#d97706' : '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{log.responseTimeMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Billing ── */}
          {activeTab === 'billing' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>Billing & Plans</h2>
                  <div style={{
                    display: 'inline-flex',
                    background: '#f1f5f9',
                    borderRadius: 8,
                    padding: 3,
                  }}>
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: billingCycle === 'monthly' ? 'white' : 'transparent',
                        color: billingCycle === 'monthly' ? '#02122c' : '#888',
                        boxShadow: billingCycle === 'monthly' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: billingCycle === 'annual' ? 'white' : 'transparent',
                        color: billingCycle === 'annual' ? '#02122c' : '#888',
                        boxShadow: billingCycle === 'annual' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      Annual <span style={{ color: '#10b981', fontWeight: 700 }}>-20%</span>
                    </button>
                  </div>
                </div>
                {seller?.billingCustomerId && (
                  <button
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      color: '#333',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: billingLoading ? 'not-allowed' : 'pointer',
                      opacity: billingLoading ? 0.6 : 1,
                    }}
                  >
                    {billingLoading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                )}
              </div>

              {/* Current Plan Banner */}
              <div style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #e5e7eb',
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 4 }}>CURRENT PLAN</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#02122c' }}>
                    {(seller?.plan || 'free').charAt(0).toUpperCase() + (seller?.plan || 'free').slice(1)}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                    Status:{' '}
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        seller?.subscriptionStatus === 'active' ? '#dcfce7' :
                        seller?.subscriptionStatus === 'trialing' ? '#dbeafe' :
                        seller?.subscriptionStatus === 'past_due' ? '#fef3c7' :
                        '#f3f4f6',
                      color:
                        seller?.subscriptionStatus === 'active' ? '#16a34a' :
                        seller?.subscriptionStatus === 'trialing' ? '#2563eb' :
                        seller?.subscriptionStatus === 'past_due' ? '#d97706' :
                        '#666',
                    }}>
                      {seller?.subscriptionStatus || 'active'}
                    </span>
                  </div>
                  {seller?.currentPeriodEnd && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                      {seller.subscriptionStatus === 'trialing' ? 'Trial ends' : 'Renews'}: {new Date(seller.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>API Calls</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {usage ? `${usage.used.toLocaleString()} / ${typeof usage.limit === 'number' ? usage.limit.toLocaleString() : usage.limit}` : '—'}
                  </div>
                </div>
              </div>

              {/* Plan Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {PLANS.map((plan) => {
                  const isCurrent = (seller?.plan || 'free') === plan.id;
                  const isUpgrade = plan.id === 'pro' && (seller?.plan || 'free') === 'basic';
                  const isEnterprise = plan.id === 'enterprise';

                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: 28,
                        border: isCurrent ? '2px solid #F59E0B' : plan.popular ? '2px solid #02122c' : '1px solid #e5e7eb',
                        position: 'relative',
                      }}
                    >
                      {plan.popular && !isCurrent && (
                        <div style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#02122c',
                          color: 'white',
                          padding: '4px 14px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}>
                          MOST POPULAR
                        </div>
                      )}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#F59E0B',
                          color: '#02122c',
                          padding: '4px 14px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}>
                          CURRENT PLAN
                        </div>
                      )}

                      <div style={{ marginBottom: 20, marginTop: 4 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#02122c', marginBottom: 8 }}>
                          {plan.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 36, fontWeight: 800, color: '#02122c' }}>
                            {billingCycle === 'annual' ? plan.priceAnnualMonthly : plan.priceMonthly}
                          </span>
                          <span style={{ fontSize: 14, color: '#888' }}>
                            {billingCycle === 'annual' ? '/ mo (billed annually)' : plan.priceNote}
                          </span>
                        </div>
                        {billingCycle === 'annual' && (
                          <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                            Save 20% vs monthly
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                          {plan.calls} API calls / month
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginBottom: 20 }}>
                        {plan.features.map((feature, i) => (
                          <div key={i} style={{
                            fontSize: 13,
                            color: '#555',
                            padding: '6px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>&#10003;</span>
                            {feature}
                          </div>
                        ))}
                      </div>

                      {isCurrent ? (
                        <button
                          disabled
                          style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 10,
                            border: '1px solid #e5e7eb',
                            background: '#f8fafc',
                            color: '#999',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'default',
                          }}
                        >
                          Current Plan
                        </button>
                      ) : isEnterprise ? (
                        <a
                          href="mailto:hello@potal.io?subject=Enterprise%20Plan%20Inquiry"
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 10,
                            border: '2px solid #02122c',
                            background: 'white',
                            color: '#02122c',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center',
                            textDecoration: 'none',
                            boxSizing: 'border-box',
                          }}
                        >
                          Contact Sales
                        </a>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={billingLoading}
                          style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 10,
                            border: 'none',
                            background: isUpgrade ? '#F59E0B' : '#02122c',
                            color: isUpgrade ? '#02122c' : 'white',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: billingLoading ? 'not-allowed' : 'pointer',
                            opacity: billingLoading ? 0.6 : 1,
                          }}
                        >
                          {billingLoading ? 'Processing...' : isUpgrade ? 'Start 14-Day Free Trial' : `Upgrade to ${plan.name}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Billing Info */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: 20,
                marginTop: 24,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                color: '#666',
              }}>
                <strong style={{ color: '#333' }}>Billing FAQ:</strong>
                <div style={{ marginTop: 8, lineHeight: 1.8 }}>
                  All paid plans include a <strong>14-day free trial</strong>. Your payment method will be saved at signup, but you won&apos;t be charged until the trial ends.
                  Cancel anytime before the trial ends — no charge. After the trial, billing starts automatically (monthly or annual depending on your selection).
                  Manage your subscription, update payment method, or cancel through the <span style={{ color: '#F59E0B', fontWeight: 600, cursor: 'pointer' }} onClick={handleManageBilling}>Manage Subscription</span> portal.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

