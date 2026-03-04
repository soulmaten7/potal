'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Keys shown after registration
  const [createdKeys, setCreatedKeys] = useState<{
    publishable: { fullKey: string; prefix: string };
    secret: { fullKey: string; prefix: string };
  } | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || 'Registration failed.');
        setLoading(false);
        return;
      }

      // Show generated keys
      if (data.data.keys) {
        setCreatedKeys({
          publishable: data.data.keys.publishable,
          secret: data.data.keys.secret,
        });
      }

      // Auto-login after registration
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setSuccess('Account created! Please sign in with your credentials.');
        setMode('login');
      } else {
        setSuccess('Account created successfully! Save your API keys below.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  // ─── Keys Display (after successful registration) ──
  if (createdKeys && success) {
    return (
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: 'calc(100vh - 80px)',
        background: '#f8fafc',
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
          maxWidth: 520,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#127881;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>
              Welcome to POTAL!
            </h1>
            <p style={{ fontSize: 14, color: '#666' }}>
              Your account is ready. Save these API keys — they won&apos;t be shown again.
            </p>
          </div>

          {/* Publishable Key */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Publishable Key (for widgets)
            </div>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 10,
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              color: '#166534',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>{createdKeys.publishable.fullKey}</span>
              <button
                onClick={() => navigator.clipboard.writeText(createdKeys.publishable.fullKey)}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              Secret Key (for server-side)
            </div>
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: 10,
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              color: '#92400e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>{createdKeys.secret.fullKey}</span>
              <button
                onClick={() => navigator.clipboard.writeText(createdKeys.secret.fullKey)}
                style={{
                  background: '#d97706',
                  color: 'white',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#dc2626',
            marginBottom: 24,
          }}>
            <strong>Important:</strong> Save both keys somewhere safe now. You won&apos;t be able to see the full keys again.
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: '#02122c',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Login / Signup Form ───────────────────────────
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: 'calc(100vh - 80px)',
      background: '#f8fafc',
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
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>
              <span style={{ color: '#02122c' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: '#02122c' }}>TAL</span>
            </span>
          </Link>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginTop: 8 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your seller account'}
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
        }}>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#02122c' : '#94a3b8',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: mode === 'signup' ? 'white' : 'transparent',
              color: mode === 'signup' ? '#02122c' : '#94a3b8',
              boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Company Name (signup only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
                Company Name <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '2px solid #e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Error */}
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

          {/* Success (login redirect message) */}
          {success && !createdKeys && (
            <div style={{
              background: '#f0fdf4',
              color: '#16a34a',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
            }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#94a3b8' : mode === 'signup' ? '#F59E0B' : '#02122c',
              color: mode === 'signup' && !loading ? '#02122c' : 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Footer text */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#999' }}>
          {mode === 'signup' ? (
            <>
              By signing up, you agree to our{' '}
              <Link href="/terms" style={{ color: '#F59E0B', textDecoration: 'none' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#F59E0B', textDecoration: 'none' }}>Privacy Policy</Link>
            </>
          ) : (
            <>
              Free to start &middot; 1,000 API calls/month &middot;{' '}
              <Link href="/pricing" style={{ color: '#F59E0B', textDecoration: 'none' }}>View plans</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
