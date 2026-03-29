'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

export default function CompleteProfilePage() {
  const router = useRouter();
  const { session } = useSupabase();

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [isIndividual, setIsIndividual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const res = await fetch('/api/v1/sellers/complete-oauth-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: isIndividual ? 'Individual' : companyName.trim(),
          country,
          industry,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Failed to complete profile.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const userEmail = session?.user?.email || '';

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      overflow: 'auto',
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
            Complete Your Profile
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {userEmail ? `Signed in as ${userEmail}` : 'Just a few more details to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
            {loading ? 'Saving...' : 'Complete Profile & Start Free'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
          All 140 features are free. No credit card required.
        </p>
      </div>
    </div>
  );
}
