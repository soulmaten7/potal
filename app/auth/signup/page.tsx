'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';

export default function SignupPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keys shown after registration
  const [createdKeys, setCreatedKeys] = useState<{
    publishable: { fullKey: string; prefix: string };
    secret: { fullKey: string; prefix: string };
  } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters with letters and numbers.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, companyName }),
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
      await supabase.auth.signInWithPassword({ email, password });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  // ─── Keys Display (after successful registration) ──
  if (createdKeys) {
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
          padding: '48px 40px',
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#127881;</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>
              Welcome to POTAL!
            </h1>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Your account is ready. Save these API keys — they won&apos;t be shown again.
            </p>
          </div>

          {/* Publishable Key */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
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
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
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
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
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
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
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

  // ─── Signup Form ─────────────────────────────────────
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
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>
              <span style={{ color: '#02122c' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: '#02122c' }}>TAL</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#02122c', marginTop: 16, marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Start calculating total landed costs for free
          </p>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '2px solid #e5e7eb',
            background: 'white',
            color: '#374151',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'border-color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSignup}>
          {/* Company Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Company Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
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

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
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
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
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
            {/* Password requirements */}
            {password.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: '8 characters minimum', met: password.length >= 8 },
                  { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
                  { label: 'Contains a number', met: /[0-9]/.test(password) },
                ].map((rule) => (
                  <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      background: rule.met ? '#dcfce7' : '#f1f5f9',
                      color: rule.met ? '#16a34a' : '#94a3b8',
                    }}>
                      {rule.met ? '✓' : '·'}
                    </div>
                    <span style={{
                      fontSize: 12,
                      color: rule.met ? '#16a34a' : '#94a3b8',
                      fontWeight: 500,
                    }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: `2px solid ${confirmPassword.length > 0 && password !== confirmPassword ? '#fca5a5' : '#e5e7eb'}`,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = confirmPassword.length > 0 && password !== confirmPassword ? '#fca5a5' : '#e5e7eb'}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>
                Passwords do not match
              </span>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && (
              <span style={{ fontSize: 12, color: '#16a34a', marginTop: 4, display: 'block' }}>
                Passwords match
              </span>
            )}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#94a3b8' : '#F59E0B',
              color: '#02122c',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Terms */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
        </p>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>
            Already have an account?{' '}
          </span>
          <Link href="/auth/login" style={{ color: '#F59E0B', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
