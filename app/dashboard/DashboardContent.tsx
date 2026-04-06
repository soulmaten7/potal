'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { COUNTRY_DATA } from '@/app/lib/cost-engine/country-data';
import { fetchWithTimeout } from '@/app/lib/fetch-with-timeout';
import dynamic from 'next/dynamic';

const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), { ssr: false });
const ProfileCompletionBanner = dynamic(() => import('./ProfileCompletionBanner'), { ssr: false });

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

type TabId = 'overview' | 'keys' | 'widget' | 'usage' | 'countries' | 'platforms' | 'logs' | 'billing' | 'classify' | 'calculator' | 'fta' | 'sanctions' | 'documents' | 'batch' | 'analytics' | 'settings' | 'integrations' | 'team';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'keys', label: 'API Keys', icon: '🔑' },
  { id: 'classify', label: 'HS Classification', icon: '🏷️' },
  { id: 'calculator', label: 'Tariff Calculator', icon: '🧮' },
  { id: 'fta', label: 'FTA & Trade', icon: '🤝' },
  { id: 'sanctions', label: 'Sanctions', icon: '🛡️' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'batch', label: 'Batch Ops', icon: '📦' },
  { id: 'widget', label: 'Widget', icon: '🧩' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'usage', label: 'Usage', icon: '📈' },
  { id: 'countries', label: 'Countries', icon: '🌍' },
  { id: 'platforms', label: 'Platforms', icon: '🤖' },
  { id: 'analytics', label: 'Analytics', icon: '📉' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'team', label: 'Team', icon: '👥' },
];

// Plan display — Forever Free (CW22 pivot)
const PLANS_DEPRECATED = true; // Legacy plan cards removed — all users are Forever Free

// ── Dashboard CountrySelect (light theme) ──
const DB_POPULAR_CODES = new Set(['CN','US','GB','DE','JP','KR','AU','CA','FR','IT','IN','MX','BR','SG','HK','TH','VN','ID','NL','ES']);
const DB_ALL_COUNTRIES = Object.values(COUNTRY_DATA).map(c => ({ code: c.code, name: c.name })).sort((a, b) => a.name.localeCompare(b.name));
const DB_POPULAR = DB_ALL_COUNTRIES.filter(c => DB_POPULAR_CODES.has(c.code));
const DB_OTHER = DB_ALL_COUNTRIES.filter(c => !DB_POPULAR_CODES.has(c.code));

function DashCountrySelect({ value, onChange, placeholder }: { value: string; onChange: (code: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = DB_ALL_COUNTRIES.find(c => c.code === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setSearch(''); } }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return DB_ALL_COUNTRIES.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [search]);

  const handleSelect = useCallback((code: string) => { onChange(code); setOpen(false); setSearch(''); setShowAll(false); }, [onChange]);

  const optStyle = (isSelected: boolean): React.CSSProperties => ({
    width: '100%', padding: '7px 10px', background: isSelected ? 'rgba(2,18,44,0.1)' : 'transparent',
    border: 'none', borderRadius: 6, color: isSelected ? '#02122c' : '#333', fontSize: 13,
    cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, fontWeight: isSelected ? 600 : 400,
  });

  const renderOpt = (c: { code: string; name: string }) => (
    <button key={c.code} type="button" onClick={() => handleSelect(c.code)} style={optStyle(c.code === value)}
      onMouseEnter={e => { if (c.code !== value) e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={e => { if (c.code !== value) e.currentTarget.style.background = 'transparent'; }}
    >
      {c.code === value && <span style={{ fontSize: 11 }}>✓</span>}
      {c.code} — {c.name}
    </button>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14,
        background: 'white', color: selected ? '#333' : '#9ca3af', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', boxSizing: 'border-box',
      }}>
        <span>{selected ? `${selected.code} — ${selected.name}` : (placeholder || 'Select country...')}</span>
        <span style={{ fontSize: 10, color: '#9ca3af', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid #d1d5db', borderRadius: 10, zIndex: 9999, maxHeight: 400, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input ref={searchRef} type="text" placeholder="Search country..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, color: '#333', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 4px' }}>
            {filtered ? (
              filtered.length === 0 ? <div style={{ padding: '12px 8px', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>No countries found</div>
              : filtered.map(renderOpt)
            ) : (
              <>
                <div style={{ padding: '4px 10px 2px', fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Popular</div>
                {DB_POPULAR.map(renderOpt)}
                {showAll ? (
                  <>
                    <div style={{ padding: '8px 10px 2px', fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderTop: '1px solid #e5e7eb', marginTop: 4 }}>All Countries ({DB_ALL_COUNTRIES.length})</div>
                    {DB_OTHER.map(renderOpt)}
                  </>
                ) : (
                  <button type="button" onClick={() => setShowAll(true)} style={{ width: '100%', padding: '8px 10px', background: 'transparent', border: 'none', borderTop: '1px solid #e5e7eb', marginTop: 4, color: '#02122c', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Show all {DB_ALL_COUNTRIES.length} countries ▾
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [originSearch, setOriginSearch] = useState('');
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);

  // Country select state for Calculator, FTA, Sanctions
  const [calcDest, setCalcDest] = useState('');
  const [calcOrigin, setCalcOrigin] = useState('CN');
  const [ftaOrigin, setFtaOrigin] = useState('');
  const [ftaDest, setFtaDest] = useState('');
  const [screenCountry, setScreenCountry] = useState('');
  const [partyCountry, setPartyCountry] = useState('');
  const [classifyMaterial, setClassifyMaterial] = useState('');
  const [classifyCategory, setClassifyCategory] = useState('');
  const [classifyOrigin, setClassifyOrigin] = useState('');
  const [classifyDest, setClassifyDest] = useState('');

  // 240 countries sorted by name, with popular ones first
  const allCountries = useMemo(() => {
    const popular = ['CN', 'US', 'DE', 'JP', 'KR', 'VN', 'IN', 'GB', 'FR', 'IT', 'CA', 'AU', 'BR', 'MX', 'TW', 'TH', 'ID', 'TR', 'BD', 'PK'];
    const entries = Object.values(COUNTRY_DATA).map(c => ({ code: c.code, name: c.name }));
    const popularEntries = popular.map(code => entries.find(e => e.code === code)).filter(Boolean) as { code: string; name: string }[];
    const rest = entries.filter(e => !popular.includes(e.code)).sort((a, b) => a.name.localeCompare(b.name));
    return { popular: popularEntries, all: rest };
  }, []);

  // Close origin dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setOriginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [widgetPrice, setWidgetPrice] = useState('');
  const [widgetShipping, setWidgetShipping] = useState('');

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);
  // billingCycle removed — Forever Free pivot (CW22). Paddle checkout disabled.
  const billingCycle = 'monthly' as const; // kept for type compat if referenced

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

  // ─── Load Data (with timeout + auto-retry) ──────
  const retryCountRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const token = session.access_token;
      const res = await fetchWithTimeout('/api/v1/sellers/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      const data = await res.json();

      if (!data.success) {
        if (res.status === 404) {
          setError('Seller profile not found. Please contact support.');
        } else {
          setError(data.error?.message || 'Failed to load dashboard.');
        }
        // Fallback plan display so the page isn't blank
        setSeller(prev => prev ?? { id: '', email: session.user?.email || '', companyName: null, plan: 'free', subscriptionStatus: 'active', createdAt: new Date().toISOString() });
        return;
      }

      retryCountRef.current = 0;
      setSeller(data.data.seller);
      setKeys(data.data.keys);
      setUsage(data.data.usage);
    } catch {
      // Auto-retry once after 5 seconds
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        setTimeout(() => loadData(), 5000);
        setError('Loading is slow. Retrying...');
      } else {
        setError('Failed to connect. Please try again.');
      }
      // Fallback plan so page isn't blank
      setSeller(prev => prev ?? { id: '', email: session.user?.email || '', companyName: null, plan: 'free', subscriptionStatus: 'active', createdAt: new Date().toISOString() });
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

  // ─── Load Analytics (lazy, debounced, abortable) ──
  const analyticsAbortRef = useRef<AbortController | null>(null);
  const analyticsDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadAnalytics = useCallback(async (type: 'countries' | 'platforms' | 'logs') => {
    if (!session) return;

    // Abort previous request
    if (analyticsAbortRef.current) analyticsAbortRef.current.abort();
    const controller = new AbortController();
    analyticsAbortRef.current = controller;

    setAnalyticsLoading(true);
    try {
      const limit = type === 'logs' ? '100' : '';
      const url = `/api/v1/sellers/analytics?type=${type}${limit ? `&limit=${limit}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'countries') setCountryData(data.data.countries || []);
        else if (type === 'platforms') setPlatformData(data.data.platforms || []);
        else if (type === 'logs') setLogData(data.data.logs || []);
      }
    } catch { /* silent — aborted or failed */ }
    finally { setAnalyticsLoading(false); }
  }, [session]);

  // Load analytics when tab changes (debounced 300ms)
  useEffect(() => {
    const analyticsTab = activeTab === 'countries' || activeTab === 'platforms' || activeTab === 'logs';
    if (!analyticsTab) return;

    const alreadyLoaded =
      (activeTab === 'countries' && countryData.length > 0) ||
      (activeTab === 'platforms' && platformData.length > 0) ||
      (activeTab === 'logs' && logData.length > 0);
    if (alreadyLoaded) return;

    clearTimeout(analyticsDebounceRef.current);
    analyticsDebounceRef.current = setTimeout(() => {
      loadAnalytics(activeTab as 'countries' | 'platforms' | 'logs');
    }, 300);

    return () => clearTimeout(analyticsDebounceRef.current);
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

  // ─── Billing: Upgrade (Paddle.js — disabled, Forever Free pivot CW22) ────
  const _handleUpgrade = async (planId: string) => {
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
  const _handleManageBilling = async () => {
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

      // Open Paddle Customer Portal in new tab (so user doesn't lose dashboard)
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
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
        minHeight: 'calc(100vh - 80px)',
        background: '#f5f5f5',
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Skeleton header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ width: 180, height: 28, borderRadius: 8, background: '#e5e7eb' }} className="animate-pulse" />
            <div style={{ width: 120, height: 36, borderRadius: 8, background: '#e5e7eb' }} className="animate-pulse" />
          </div>
          {/* Skeleton stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                <div style={{ width: 80, height: 12, borderRadius: 4, background: '#e5e7eb', marginBottom: 12 }} className="animate-pulse" />
                <div style={{ width: 60, height: 28, borderRadius: 6, background: '#e5e7eb' }} className="animate-pulse" />
              </div>
            ))}
          </div>
          {/* Skeleton content blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', minHeight: 200 }}>
                <div style={{ width: 140, height: 16, borderRadius: 4, background: '#e5e7eb', marginBottom: 20 }} className="animate-pulse" />
                <div style={{ width: '100%', height: 12, borderRadius: 4, background: '#f3f4f6', marginBottom: 12 }} className="animate-pulse" />
                <div style={{ width: '80%', height: 12, borderRadius: 4, background: '#f3f4f6', marginBottom: 12 }} className="animate-pulse" />
                <div style={{ width: '60%', height: 12, borderRadius: 4, background: '#f3f4f6' }} className="animate-pulse" />
              </div>
            ))}
          </div>
          <p aria-live="polite" style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
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
      background: '#f5f5f5',
      color: '#1a1a1a',
      minHeight: 'calc(100vh - 80px)',
    }}>
      {/* Paddle.js — checkout overlay for payment method collection */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.Paddle) {
            const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
            if (paddleToken) {
              const paddleConfig: { token: string; environment?: string } = { token: paddleToken };
              if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox') {
                paddleConfig.environment = 'sandbox';
              }
              try {
                window.Paddle.Initialize(paddleConfig);
              } catch {
                // Paddle initialization failed — non-blocking
              }
            }
          }
        }}
      />

      {/* Mobile horizontal tab bar */}
      <style>{`
        .dashboard-mobile-tabs { display: none; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 12px 16px 0; max-width: 1440; margin: 0 auto; }
        .dashboard-mobile-tabs::-webkit-scrollbar { display: none; }
        @media (max-width: 768px) {
          .dashboard-mobile-tabs { display: flex !important; }
          .dashboard-sidebar { display: none !important; }
          .dashboard-layout { padding: 12px 12px !important; }
        }
      `}</style>
      <div className="dashboard-mobile-tabs">
        <div role="tablist" aria-label="Dashboard sections" style={{ display: 'flex', gap: 8 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 20, border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                background: activeTab === tab.id ? '#02122c' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#666',
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }} aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-layout" style={{ display: 'flex', maxWidth: 1440, margin: '0 auto', padding: '24px 24px', gap: 24 }}>
        {/* Sidebar (desktop) */}
        <div className="dashboard-sidebar" style={{ width: 200, flexShrink: 0 }}>
          <nav role="tablist" aria-label="Dashboard sections" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
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
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`} style={{ flex: 1, minWidth: 0 }}>
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
                  Welcome to POTAL — Forever Free!
                </div>
                <div style={{ fontSize: 13, color: '#065f46', marginTop: 2 }}>
                  All 140 features are available. No charges, no limits, no trial period.
                </div>
              </div>
            </div>
          )}

          {checkoutStatus === 'canceled' && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '14px 20px', borderRadius: 12, marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              Checkout was canceled. No charges were made.
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
              {/* B-4: Profile Completion Banner */}
              <ProfileCompletionBanner />

              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'API Calls', value: usage?.used ?? '—', sub: 'This month' },
                  { label: 'Plan', value: 'Forever Free', sub: 'active' },
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
                      <div ref={originRef} style={{ position: 'relative' }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Origin</label>
                        <button
                          type="button"
                          onClick={() => { setOriginDropdownOpen(!originDropdownOpen); setOriginSearch(''); }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box' as const, background: 'white', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <span>{widgetOrigin} — {Object.values(COUNTRY_DATA).find(c => c.code === widgetOrigin)?.name || widgetOrigin}</span>
                          <span style={{ fontSize: 10, color: '#999' }}>{originDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                        {originDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 300, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                              <input
                                autoFocus
                                value={originSearch}
                                onChange={(e) => setOriginSearch(e.target.value)}
                                placeholder="Search country..."
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none' }}
                              />
                            </div>
                            <div style={{ overflowY: 'auto', maxHeight: 250 }}>
                              {(() => {
                                const q = originSearch.toLowerCase();
                                const filtered = q
                                  ? [...allCountries.popular, ...allCountries.all].filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
                                  : null;
                                if (filtered && filtered.length === 0) return <div style={{ padding: '12px 16px', color: '#999', fontSize: 13 }}>No results</div>;
                                const renderItem = (c: { code: string; name: string }) => (
                                  <div
                                    key={c.code}
                                    onClick={() => { setWidgetOrigin(c.code); setOriginDropdownOpen(false); setOriginSearch(''); }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 13, background: c.code === widgetOrigin ? '#f0f7ff' : 'transparent', display: 'flex', justifyContent: 'space-between' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = c.code === widgetOrigin ? '#f0f7ff' : 'transparent'; }}
                                  >
                                    <span style={{ fontWeight: c.code === widgetOrigin ? 600 : 400 }}>{c.code} — {c.name}</span>
                                    {c.code === widgetOrigin && <span style={{ color: '#2563eb' }}>✓</span>}
                                  </div>
                                );
                                if (filtered) return filtered.map(renderItem);
                                return (
                                  <>
                                    <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, background: '#f9fafb' }}>Popular</div>
                                    {allCountries.popular.map(renderItem)}
                                    <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' as const, background: '#f9fafb' }}>All Countries</div>
                                    {allCountries.all.map(renderItem)}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
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
                      Approaching limit. <Link href="/pricing#enterprise" style={{ color: '#d97706', fontWeight: 700 }}>Contact us</Link> for higher limits.
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

          {/* ── HS Classification ── */}
          {activeTab === 'classify' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>HS Classification</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Classify products into HS codes using our AI-powered 3-stage pipeline: Cache → Vector Search → Keyword Match → LLM Fallback.</p>

              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Single Product Classification — 10-Field Input</h3>
                  <span id="classify-confidence" style={{ fontSize: 12, fontWeight: 600, color: '#888', padding: '4px 10px', borderRadius: 6, background: '#f1f5f9' }}>0 / 10 fields</span>
                </div>
                {/* Row 1: Product Name (full width) */}
                <div style={{ marginBottom: 10 }}>
                  <input id="classify-input" type="text" placeholder="Product Name — e.g. Organic cotton t-shirt for men" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                {/* Row 2: Material | Category (dropdowns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select value={classifyMaterial} onChange={e => setClassifyMaterial(e.target.value)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white', color: classifyMaterial ? '#333' : '#9ca3af', cursor: 'pointer' }}>
                    <option value="" disabled>Select material...</option>
                    {['cotton','polyester','wool','silk','linen','denim','nylon','leather','plastic','rubber','aluminum','steel','copper','zinc','titanium','carbon-fiber','lithium-ion','wood','glass','ceramic','paper','gold','silver','other'].map(m => (
                      <option key={m} value={m}>{m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}</option>
                    ))}
                  </select>
                  <select value={classifyCategory} onChange={e => setClassifyCategory(e.target.value)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: 'white', color: classifyCategory ? '#333' : '#9ca3af', cursor: 'pointer' }}>
                    <option value="" disabled>Select category...</option>
                    {['apparel','electronics','footwear','accessories','cosmetics','food','furniture','toys','books','automotive','jewelry','sporting_goods','industrial','other'].map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                {/* Row 3: Description (full width) */}
                <div style={{ marginBottom: 10 }}>
                  <input id="classify-description" type="text" placeholder="Description — e.g. Men's crew neck short sleeve basic t-shirt for casual wear" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                {/* Row 4: Processing | Composition */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input id="classify-processing" type="text" placeholder="Processing — e.g. knitted, woven, forged" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  <input id="classify-composition" type="text" placeholder="Composition — e.g. 100% cotton, 80/20 blend" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                </div>
                {/* Row 5: Weight/Spec | Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input id="classify-weight" type="text" placeholder="Weight / Spec — e.g. 200g, 5kg, 2.5mm" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  <input id="classify-price" type="number" placeholder="Price (USD) — e.g. 29.99" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                </div>
                {/* Row 6: Origin | Destination | Classify button */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 16 }}>
                  <DashCountrySelect value={classifyOrigin} onChange={setClassifyOrigin} placeholder="Origin country..." />
                  <DashCountrySelect value={classifyDest} onChange={setClassifyDest} placeholder="Destination country..." />
                  <button onClick={async () => {
                    const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '';
                    const input = g('classify-input');
                    const description = g('classify-description');
                    const processing = g('classify-processing');
                    const composition = g('classify-composition');
                    const weightSpec = g('classify-weight');
                    const price = g('classify-price');
                    // Update confidence counter
                    const filled = [input, classifyMaterial, classifyCategory, description, processing, composition, weightSpec, price, classifyOrigin, classifyDest].filter(Boolean).length;
                    const confEl = document.getElementById('classify-confidence');
                    if (confEl) { confEl.textContent = `${filled} / 10 fields`; confEl.style.color = filled >= 8 ? '#16a34a' : filled >= 5 ? '#ca8a04' : '#888'; }
                    const el = document.getElementById('classify-result');
                    if (!input) { if (el) el.textContent = 'Please enter a product name.'; return; }
                    if (!classifyMaterial) { if (el) el.textContent = 'Material is required. Please select from the dropdown.'; return; }
                    if (el) el.textContent = 'Classifying...';
                    try {
                      const token = session?.access_token;
                      if (!token) { if (el) el.textContent = 'Error: Not authenticated. Please log in again.'; return; }
                      const reqBody: Record<string, unknown> = { productName: input, material: classifyMaterial };
                      if (classifyCategory) reqBody.category = classifyCategory;
                      if (description) reqBody.description = description;
                      if (processing) reqBody.processing = processing;
                      if (composition) reqBody.composition = composition;
                      if (weightSpec) reqBody.weight_spec = weightSpec;
                      if (price) reqBody.price = parseFloat(price);
                      if (classifyOrigin) reqBody.originCountry = classifyOrigin;
                      if (classifyDest) reqBody.destinationCountry = classifyDest;
                      const res = await fetch('/api/v1/classify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(reqBody) });
                      const data = await res.json();
                      if (res.status === 401) { if (el) el.textContent = 'API Key가 필요합니다. API Keys 탭에서 키를 생성하세요.'; return; }
                      if (el) el.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error ${res.status}: ${JSON.stringify(data, null, 2)}`;
                    } catch { if (el) el.textContent = 'Network error. Please check your connection and try again.'; }
                  }} style={{ padding: '10px 24px', background: '#02122c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>Classify</button>
                </div>
                <pre id="classify-result" style={{ background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333', minHeight: 60, border: '1px solid #e5e7eb' }}>Results will appear here...</pre>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Pipeline Stages</h4>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div><strong>1. Cache</strong> — Instant lookup from 1,017+ pre-mapped products ($0)</div>
                    <div><strong>2. Vector Search</strong> — pgvector similarity with 1,023 embeddings</div>
                    <div><strong>3. Keyword Match</strong> — Bigram/unigram scoring across 5,371 HS codes</div>
                    <div><strong>4. LLM Fallback</strong> — AI classification for unknown products</div>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>API Endpoint</h4>
                  <code style={{ fontSize: 12, background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, display: 'block', marginBottom: 8 }}>POST /api/v1/classify</code>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    <div>Body: <code>{`{ "productName": "...", "material": "cotton", "category": "apparel", "description": "...", "processing": "knitted", "composition": "100% cotton", "weight_spec": "200g", "price": 29.99, "originCountry": "CN", "destinationCountry": "US" }`}</code></div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>Material: 24 options (dropdown) | Category: 14 options (dropdown) | Origin/Destination: 240 countries (searchable)</div>
                    <div style={{ marginTop: 4 }}>Batch: <code>POST /api/v1/classify/batch</code> (up to 50 items)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tariff Calculator ── */}
          {activeTab === 'calculator' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Tariff Calculator</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Calculate total landed cost including duties, taxes, and fees for 240 countries.</p>

              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Calculate</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>HS Code</label>
                    <input id="calc-hs" type="text" placeholder="e.g. 610910" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Destination Country</label>
                    <DashCountrySelect value={calcDest} onChange={setCalcDest} placeholder="Select destination..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Value (USD)</label>
                    <input id="calc-value" type="number" placeholder="e.g. 100" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Origin Country</label>
                    <DashCountrySelect value={calcOrigin} onChange={setCalcOrigin} placeholder="Select origin..." />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                    <input id="calc-weight" type="number" placeholder="e.g. 0.5" defaultValue="0.5" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={async () => {
                    const hs = (document.getElementById('calc-hs') as HTMLInputElement)?.value;
                    const value = (document.getElementById('calc-value') as HTMLInputElement)?.value;
                    const weight = (document.getElementById('calc-weight') as HTMLInputElement)?.value;
                    const el = document.getElementById('calc-result');
                    if (!hs && !calcDest && !value) { if (el) el.textContent = 'Please fill in HS Code, Destination, and Value.'; return; }
                    if (el) el.textContent = 'Calculating...';
                    try {
                      const token = session?.access_token;
                      if (!token) { if (el) el.textContent = 'Error: Not authenticated. Please log in again.'; return; }
                      const res = await fetch('/api/v1/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ hsCode: hs, destinationCountry: calcDest, price: parseFloat(value || '0') || 100, origin: calcOrigin || 'CN', weight: parseFloat(weight || '0') || 0.5 }) });
                      const data = await res.json();
                      if (el) el.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error ${res.status}: ${JSON.stringify(data, null, 2)}`;
                    } catch { if (el) el.textContent = 'Network error. Please check your connection and try again.'; }
                  }} style={{ padding: '10px 20px', background: '#02122c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, alignSelf: 'flex-end' }}>Calculate</button>
                </div>
                <pre id="calc-result" style={{ background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333', minHeight: 80, border: '1px solid #e5e7eb' }}>Results will appear here...</pre>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#047857' }}>Duty Rates</h4>
                  <div style={{ fontSize: 13, color: '#666' }}>MFN, MIN, AGR rates from 186+ countries. Auto-selects lowest applicable rate.</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#047857' }}>Tax Engine</h4>
                  <div style={{ fontSize: 13, color: '#666' }}>VAT/GST for 240 countries, de minimis thresholds, IOSS, 12 special taxes.</div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#047857' }}>Trade Remedies</h4>
                  <div style={{ fontSize: 13, color: '#666' }}>Anti-dumping, countervailing duties, safeguards — 119,706 cases checked.</div>
                </div>
              </div>
            </div>
          )}

          {/* ── FTA & Trade Agreements ── */}
          {activeTab === 'fta' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>FTA & Trade Agreements</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Look up preferential tariff rates from 63 Free Trade Agreements and 1,319 trade agreements in our database.</p>

              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>FTA Lookup</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 16, alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Origin</label>
                    <DashCountrySelect value={ftaOrigin} onChange={setFtaOrigin} placeholder="Select origin..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Destination</label>
                    <DashCountrySelect value={ftaDest} onChange={setFtaDest} placeholder="Select destination..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>HS Code</label>
                    <input id="fta-hs" type="text" placeholder="e.g. 610910" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={async () => {
                    const hs = (document.getElementById('fta-hs') as HTMLInputElement)?.value;
                    const el = document.getElementById('fta-result');
                    if (!session?.access_token) { if (el) el.textContent = 'Error: Not authenticated. Please log in.'; return; }
                    if (el) el.textContent = 'Looking up...';
                    try {
                      const res = await fetch(`/api/v1/fta?origin=${ftaOrigin}&destination=${ftaDest}${hs ? `&hsCode=${hs}` : ''}`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
                      const data = await res.json();
                      if (el) el.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error ${res.status}: ${JSON.stringify(data, null, 2)}`;
                    } catch { if (el) el.textContent = 'Network error. Please check your connection and try again.'; }
                  }} style={{ padding: '10px 20px', background: '#02122c', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Lookup</button>
                </div>
                <pre id="fta-result" style={{ background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333', minHeight: 60, border: '1px solid #e5e7eb' }}>Results will appear here...</pre>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Coverage</h4>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <div>63 Free Trade Agreements</div>
                    <div>1,319 trade agreements in database</div>
                    <div>Rules of Origin (RoO) verification</div>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>API Endpoints</h4>
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>GET /api/v1/fta</code> — FTA lookup<br/>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>GET /api/v1/roo</code> — Rules of Origin<br/>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>GET /api/v1/regulations</code> — Trade regulations
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Sanctions Screening ── */}
          {activeTab === 'sanctions' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Sanctions Screening</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Screen shipments and parties against 21,301 entries from OFAC SDN (14,600) and Consolidated Screening List (6,701) across 19 sources.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Shipment Screening</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    <DashCountrySelect value={screenCountry} onChange={setScreenCountry} placeholder="Destination country..." />
                    <input id="screen-hs" type="text" placeholder="HS Code (e.g. 847130)" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                    <button onClick={async () => {
                      const el = document.getElementById('screen-result');
                      if (!session?.access_token) { if (el) el.textContent = 'Error: Not authenticated. Please log in.'; return; }
                      if (el) el.textContent = 'Screening...';
                      try {
                        const res = await fetch('/api/v1/sanctions/screen', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ name: screenCountry, country: screenCountry }) });
                        const data = await res.json();
                        if (el) el.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error ${res.status}: ${JSON.stringify(data, null, 2)}`;
                      } catch { if (el) el.textContent = 'Network error. Please check your connection and try again.'; }
                    }} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Screen Shipment</button>
                  </div>
                  <pre id="screen-result" style={{ background: '#fef2f2', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333', minHeight: 40, border: '1px solid #fecaca', marginTop: 12 }}>Results will appear here...</pre>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Denied Party Screening</h3>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                    <input id="party-name" type="text" placeholder="Party name (e.g. Company XYZ)" style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                    <DashCountrySelect value={partyCountry} onChange={setPartyCountry} placeholder="Country..." />
                    <button onClick={async () => {
                      const name = (document.getElementById('party-name') as HTMLInputElement)?.value;
                      const el = document.getElementById('party-result');
                      if (!session?.access_token) { if (el) el.textContent = 'Error: Not authenticated. Please log in.'; return; }
                      if (el) el.textContent = 'Screening...';
                      try {
                        const res = await fetch('/api/v1/sanctions/screen', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ name, country: partyCountry }) });
                        const data = await res.json();
                        if (el) el.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error ${res.status}: ${JSON.stringify(data, null, 2)}`;
                      } catch { if (el) el.textContent = 'Network error. Please check your connection and try again.'; }
                    }} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Screen Party</button>
                  </div>
                  <pre id="party-result" style={{ background: '#fef2f2', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#333', minHeight: 40, border: '1px solid #fecaca', marginTop: 12 }}>Results will appear here...</pre>
                </div>
              </div>

              <div style={{ background: '#fffbeb', borderRadius: 12, padding: 16, border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
                <strong>Data Sources:</strong> OFAC SDN List (14,600 entries), Consolidated Screening List (6,701 entries from 19 sources including BIS Entity List, DPL, ITAR Debarred, and more). Updated regularly via automated sync.
              </div>
            </div>
          )}

          {/* ── Documents / Export ── */}
          {activeTab === 'documents' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Documents & Export</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Generate customs documents, export reports, and manage compliance paperwork.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { title: 'Commercial Invoice', desc: 'Generate commercial invoices with HS codes and duty estimates', endpoint: '/api/v1/documents?type=commercial-invoice' },
                  { title: 'Packing List', desc: 'Create packing lists with item descriptions and weights', endpoint: '/api/v1/documents?type=packing-list' },
                  { title: 'Certificate of Origin', desc: 'Generate CoO for FTA preferential treatment', endpoint: '/api/v1/documents?type=certificate-of-origin' },
                  { title: 'VAT Report', desc: 'IOSS/VAT compliance reports for EU shipments', endpoint: '/api/v1/vat-report' },
                  { title: 'Duty Drawback', desc: 'Calculate and document duty drawback claims', endpoint: '/api/v1/drawback' },
                  { title: 'Landed Cost Report', desc: 'Complete landed cost breakdown export', endpoint: '/api/v1/export' },
                ].map((doc, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{doc.title}</h4>
                    <p style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.5 }}>{doc.desc}</p>
                    <code style={{ fontSize: 11, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, color: '#475569' }}>{doc.endpoint}</code>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>API Usage</h4>
                <div style={{ fontSize: 13, color: '#666' }}>
                  Use <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>POST /api/v1/documents</code> to generate documents programmatically. Supports JSON and PDF output formats.
                  See the <a href="https://potal.app/docs/api" style={{ color: '#047857', textDecoration: 'underline' }}>API documentation</a> for full details.
                </div>
              </div>
            </div>
          )}

          {/* ── Batch Operations ── */}
          {activeTab === 'batch' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Batch Operations</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Process multiple products at once — classify, calculate duties, or screen shipments in bulk.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Batch Classification</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Classify up to 50 products per request.</p>
                  <code style={{ fontSize: 12, background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, display: 'block', marginBottom: 8 }}>POST /api/v1/classify/batch</code>
                  <pre style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#475569', border: '1px solid #e5e7eb' }}>{`{
  "items": [
    { "id": "1", "productName": "Cotton t-shirt" },
    { "id": "2", "productName": "Leather wallet" },
    { "id": "3", "productName": "Laptop 15 inch" }
  ]
}`}</pre>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Batch Calculation</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Calculate landed costs for multiple items in one call.</p>
                  <code style={{ fontSize: 12, background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, display: 'block', marginBottom: 8 }}>POST /api/v1/calculate/batch</code>
                  <pre style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#475569', border: '1px solid #e5e7eb' }}>{`{
  "items": [
    { "hs_code": "610910", "value": 25, "destination": "US" },
    { "hs_code": "420221", "value": 150, "destination": "DE" }
  ],
  "origin_country": "CN"
}`}</pre>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534' }}>
                <strong>Tip:</strong> Batch operations count as 1 API call per item in the batch. Use batch endpoints to reduce HTTP overhead and improve throughput.
              </div>
            </div>
          )}

          {/* ── Integrations ── */}
          {activeTab === 'integrations' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Integrations</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Connect POTAL to your e-commerce platform for automated duty & tax calculations at checkout.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {[
                  { name: 'Shopify', status: 'Available', desc: 'Theme App Extension — shows landed cost on product pages. OAuth + GDPR webhooks included.', color: '#96bf48', docs: '/docs/integrations/shopify' },
                  { name: 'WooCommerce', status: 'Available', desc: 'WordPress plugin — auto-calculates duties at checkout. Supports variable products.', color: '#96588a', docs: '/docs/integrations/woocommerce' },
                  { name: 'BigCommerce', status: 'Available', desc: 'App integration — webhook-based duty calculation for BigCommerce stores.', color: '#34313f', docs: '/docs/integrations/bigcommerce' },
                  { name: 'Magento', status: 'Available', desc: 'Extension for Magento 2 — cart-level landed cost calculation.', color: '#f26322', docs: '/docs/integrations/magento' },
                ].map((platform, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{platform.name}</h3>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: 20 }}>{platform.status}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{platform.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { name: 'JavaScript Widget', desc: 'Embed a duty calculator on any website with a single script tag.', code: '<script src="https://potal.app/widget/potal-widget.js"></script>' },
                  { name: 'REST API', desc: '7 endpoints for full programmatic access. OpenAPI spec available.', code: 'curl https://potal.app/api/v1/calculate?...' },
                  { name: 'AI Platforms', desc: 'ChatGPT Actions, MCP Server, Gemini Gem — let AI agents calculate duties.', code: 'MCP Server v1.2.0 — 7 tools' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{item.name}</h4>
                    <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{item.desc}</p>
                    <code style={{ fontSize: 10, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, color: '#475569', display: 'block', wordBreak: 'break-all' as const }}>{item.code}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Analytics (Recharts) ── */}
          {activeTab === 'analytics' && session && (
            <AnalyticsCharts accessToken={session.access_token} />
          )}

          {/* ── Team ── */}
          {activeTab === 'team' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Team Management</h2>
                <a
                  href="/dashboard/team"
                  style={{
                    padding: '8px 20px',
                    background: '#02122c',
                    color: 'white',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Open Team Page
                </a>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8 }}>
                  Manage your team members, invite colleagues, and control access levels with role-based permissions.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                  {[
                    { role: 'Admin', desc: 'Full access to everything', color: '#dc2626' },
                    { role: 'Manager', desc: 'Billing, team, API (no delete)', color: '#d97706' },
                    { role: 'Analyst', desc: 'Read + API usage only', color: '#2563eb' },
                    { role: 'Viewer', desc: 'Read-only dashboards', color: '#6b7280' },
                  ].map(r => (
                    <div key={r.role} style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.color, color: 'white', marginBottom: 8 }}>
                        {r.role}
                      </span>
                      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</h2>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Account</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: 14 }}>
                    <span style={{ color: '#888', fontWeight: 500 }}>Email</span>
                    <span style={{ color: '#333' }}>{seller?.email || '—'}</span>
                    <span style={{ color: '#888', fontWeight: 500 }}>Company</span>
                    <span style={{ color: '#333' }}>{seller?.companyName || 'Not set'}</span>
                    <span style={{ color: '#888', fontWeight: 500 }}>Plan</span>
                    <span style={{ color: '#333', textTransform: 'capitalize' }}>{seller?.plan || 'free'}</span>
                    <span style={{ color: '#888', fontWeight: 500 }}>Member since</span>
                    <span style={{ color: '#333' }}>{seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>API Configuration</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px 16px', fontSize: 14 }}>
                    <span style={{ color: '#888', fontWeight: 500 }}>Rate Limit</span>
                    <span style={{ color: '#333' }}>{keys[0]?.rateLimitPerMinute || 60} req/min</span>
                    <span style={{ color: '#888', fontWeight: 500 }}>Active Keys</span>
                    <span style={{ color: '#333' }}>{keys.filter(k => k.isActive).length} of {keys.length}</span>
                    <span style={{ color: '#888', fontWeight: 500 }}>Base URL</span>
                    <code style={{ color: '#475569', fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>https://potal.app/api/v1</code>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Webhook Configuration</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Configure webhooks to receive real-time notifications about shipment screenings, classification results, and billing events.</p>
                  <div style={{ fontSize: 13, color: '#999' }}>Webhook management is available via the API. See <a href="https://potal.app/docs/api#webhooks" style={{ color: '#047857' }}>documentation</a> for details.</div>
                </div>

                <div style={{ background: '#fef2f2', borderRadius: 12, padding: 24, border: '1px solid #fecaca' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#dc2626' }}>Danger Zone</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>These actions are irreversible. Please be certain before proceeding.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Revoke All API Keys</button>
                    <button style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Billing ── */}
          {activeTab === 'billing' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Plan</h2>

              {/* Forever Free Banner */}
              <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 32,
                border: '2px solid #10b981',
                marginBottom: 24,
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'inline-block',
                  background: '#dcfce7',
                  color: '#16a34a',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}>
                  FOREVER FREE
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>
                  All 140 Features Included
                </div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                  240 countries &middot; 155+ API endpoints &middot; No limits &middot; No credit card
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {['HS Classification', 'Duty Calculation', 'FTA Detection', 'Sanctions Screening', 'Batch API', 'Webhooks'].map((f) => (
                    <span key={f} style={{
                      background: '#f0fdf4',
                      color: '#16a34a',
                      padding: '4px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Usage */}
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
                  <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 4 }}>THIS MONTH</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {usage ? `${usage.used.toLocaleString()} API calls` : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Status</div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#dcfce7',
                    color: '#16a34a',
                  }}>
                    Active
                  </span>
                </div>
              </div>

              {/* Enterprise CTA */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                color: '#666',
              }}>
                <strong style={{ color: '#333' }}>Need Enterprise features?</strong>
                <div style={{ marginTop: 8, lineHeight: 1.8 }}>
                  For dedicated infrastructure, white-label widgets, custom SLAs, or SSO — <a href="/pricing#enterprise" style={{ color: '#F59E0B', fontWeight: 600 }}>contact our sales team</a>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

