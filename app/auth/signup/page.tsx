'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';
import { COUNTRY_DATA } from '@/app/lib/cost-engine/country-data';

const INDUSTRIES = [
  { value: 'ecommerce_seller', label: 'E-commerce Seller' },
  { value: 'logistics_freight', label: 'Logistics & Freight' },
  { value: 'customs_broker', label: 'Customs Broker' },
  { value: 'marketplace_operator', label: 'Marketplace Operator' },
  { value: 'developer', label: 'Developer' },
  { value: 'other', label: 'Other' },
];

export default function SignupPage() {
  const { supabase } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [isIndividual, setIsIndividual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification sent state
  const [emailSent, setEmailSent] = useState(false);

  // Country list sorted by name
  const countries = useMemo(() =>
    Object.values(COUNTRY_DATA)
      .map(c => ({ code: c.code, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '2px solid #e5e7eb',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#374151',
    display: 'block' as const,
    marginBottom: 6,
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
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
    if (!isIndividual && !companyName.trim()) {
      setError('Company name is required. Select "Individual" if not applicable.');
      setLoading(false);
      return;
    }
    if (!country) {
      setError('Please select your country.');
      setLoading(false);
      return;
    }
    if (!industry) {
      setError('Please select your industry.');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '';

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'seller',
            company_name: isIndividual ? 'Individual' : companyName.trim(),
            country: country.toUpperCase(),
            industry,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already') || signUpError.message?.includes('exists')) {
          setError('An account with this email already exists.');
        } else {
          setError(signUpError.message || 'Registration failed.');
        }
        setLoading(false);
        return;
      }

      setEmailSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?complete_profile=true`
      : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  // ─── Email Verification Sent ──
  if (emailSent) {
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
          maxWidth: 480,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9993;</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4, lineHeight: 1.6 }}>
            We sent a confirmation link to
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#02122c', marginBottom: 20 }}>
            {email}
          </p>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 13,
            color: '#166534',
            lineHeight: 1.6,
            marginBottom: 24,
          }}>
            Click the link in the email to verify your account and get started.
            <br />
            Your API keys will be generated automatically.
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              borderRadius: 12,
              background: '#02122c',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to Sign In
          </Link>
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
        padding: '40px 36px',
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>
              <span style={{ color: '#02122c' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: '#02122c' }}>TAL</span>
            </span>
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#02122c', marginTop: 14, marginBottom: 4 }}>
            Start Free — All 140 Features Included
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            No credit card required. Complete your profile for Forever Free access.
          </p>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '2px solid #e5e7eb', background: 'white', color: '#374151',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <form onSubmit={handleSignup}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email *</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" required style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Password *</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, letters & numbers" required minLength={8} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Confirm Password *</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password" required
              style={{ ...inputStyle, borderColor: confirmPassword.length > 0 && password !== confirmPassword ? '#fca5a5' : '#e5e7eb' }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = confirmPassword.length > 0 && password !== confirmPassword ? '#fca5a5' : '#e5e7eb'}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, display: 'block' }}>Passwords do not match</span>
            )}
          </div>

          {/* Company Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Company Name *
              <label style={{ marginLeft: 12, fontWeight: 400, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={isIndividual} onChange={(e) => { setIsIndividual(e.target.checked); if (e.target.checked) setCompanyName(''); }}
                  style={{ marginRight: 4, accentColor: '#F59E0B' }}
                />
                Individual (no company)
              </label>
            </label>
            {!isIndividual && (
              <input
                type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            )}
          </div>

          {/* Country */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Country *</label>
            <select
              value={country} onChange={(e) => setCountry(e.target.value)} required
              style={{ ...inputStyle, background: 'white', color: country ? '#374151' : '#94a3b8', cursor: 'pointer' }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="" disabled>Select your country</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Industry *</label>
            <select
              value={industry} onChange={(e) => setIndustry(e.target.value)} required
              style={{ ...inputStyle, background: 'white', color: industry ? '#374151' : '#94a3b8', cursor: 'pointer' }}
              onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="" disabled>Select your industry</option>
              {INDUSTRIES.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', color: '#dc2626', padding: '10px 14px',
              borderRadius: 8, fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: loading ? '#94a3b8' : '#F59E0B', color: '#02122c',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating account...' : 'Start Free — All 140 Features Included'}
          </button>
        </form>

        {/* Terms */}
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
        </p>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>Already have an account? </span>
          <Link href="/auth/login" style={{ color: '#F59E0B', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
