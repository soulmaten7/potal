'use client';

import { useState, useEffect } from 'react';
import { COUNTRY_DATA } from '@/app/lib/cost-engine/country-data';

interface ProfileData {
  completion: {
    percent: number;
    isComplete: boolean;
    missingFields: string[];
  };
  trial: {
    type: string;
    daysRemaining: number | null;
    isForeverFree: boolean;
    isExpired: boolean;
  };
  fieldOptions: Array<{
    field: string;
    label: string;
    options?: readonly string[];
    type: string;
  }>;
}

const FIELD_OPTIONS: Record<string, string[]> = {
  company_size: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
  monthly_shipments: ['0-100', '101-1000', '1001-10000', '10000+'],
  primary_platform: ['Shopify', 'WooCommerce', 'Amazon', 'Magento', 'BigCommerce', 'Custom', 'Other'],
  annual_revenue_range: ['Under $100K', '$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M+'],
};

const FIELD_LABELS: Record<string, string> = {
  'Company Size': 'company_size',
  'Monthly Shipments': 'monthly_shipments',
  'Primary Platform': 'primary_platform',
  'Main Trade Countries': 'main_trade_countries',
  'Annual Revenue': 'annual_revenue_range',
};

export default function ProfileCompletionBanner({ apiKeyPrefix }: { apiKeyPrefix?: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [justUpgraded, setJustUpgraded] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/v1/sellers/profile', {
        headers: apiKeyPrefix ? { 'X-API-Key': apiKeyPrefix } : {},
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* silent */ }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const [label, fieldName] of Object.entries(FIELD_LABELS)) {
        if (formValues[fieldName]) {
          updates[fieldName] = formValues[fieldName];
        }
      }

      if (Object.keys(updates).length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch('/api/v1/sellers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKeyPrefix ? { 'X-API-Key': apiKeyPrefix } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (json.success) {
        if (json.data?.upgradedToForeverFree) {
          setJustUpgraded(true);
        }
        await fetchProfile();
        setShowForm(false);
      }
    } catch { /* silent */ }
    setSaving(false);
  }

  if (!data) return null;
  if (data.trial.isForeverFree && !justUpgraded) return null;

  // Just upgraded celebration
  if (justUpgraded) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
        color: 'white',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          Forever Free Unlocked!
        </div>
        <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
          Your profile is complete. All 140 features are now free forever. No expiration, no credit card.
        </p>
      </div>
    );
  }

  const percent = data.completion.percent;
  const missing = data.completion.missingFields;
  const daysLeft = data.trial.daysRemaining;
  const isExpired = data.trial.isExpired;

  return (
    <div style={{
      background: isExpired ? '#fef2f2' : 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
      border: isExpired ? '1px solid #fca5a5' : '1px solid #fbbf24',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#02122c' }}>
            {isExpired
              ? 'Trial Expired — Complete Your Profile to Continue Free'
              : `Complete Your Profile for Forever Free (${percent}%)`
            }
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {isExpired
              ? 'Your 30-day trial has ended. Fill in the remaining fields to unlock Forever Free access.'
              : daysLeft !== null
                ? `${daysLeft} days left in trial. Complete ${missing.length} more field(s) to never expire.`
                : `Complete ${missing.length} more field(s) for permanent free access.`
            }
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#F59E0B',
            color: '#02122c',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {showForm ? 'Close' : 'Complete Now'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e5e7eb', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: showForm ? 16 : 0 }}>
        <div style={{
          background: percent >= 100 ? '#10b981' : '#F59E0B',
          height: '100%',
          width: `${percent}%`,
          borderRadius: 8,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Inline form */}
      {showForm && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {missing.map(label => {
            const fieldName = FIELD_LABELS[label];
            if (!fieldName) return null;

            if (fieldName === 'main_trade_countries') {
              const countries = Object.values(COUNTRY_DATA)
                .map(c => ({ code: c.code, name: c.name }))
                .sort((a, b) => a.name.localeCompare(b.name));
              const selected = (formValues[fieldName] || []) as string[];

              return (
                <div key={fieldName} style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {label} (select up to 5)
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && selected.length < 5 && !selected.includes(val)) {
                        setFormValues({ ...formValues, [fieldName]: [...selected, val] });
                      }
                      e.target.value = '';
                    }}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: '1px solid #d1d5db', fontSize: 13, background: 'white',
                    }}
                  >
                    <option value="">Add a country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code} disabled={selected.includes(c.code)}>{c.name}</option>
                    ))}
                  </select>
                  {selected.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {selected.map(code => (
                        <span key={code} style={{
                          background: '#e0f2fe', color: '#0369a1', fontSize: 11, padding: '2px 8px',
                          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {COUNTRY_DATA[code]?.name || code}
                          <button
                            onClick={() => setFormValues({ ...formValues, [fieldName]: selected.filter(c => c !== code) })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#0369a1', padding: 0 }}
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const options = FIELD_OPTIONS[fieldName] || [];
            return (
              <div key={fieldName}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  {label}
                </label>
                <select
                  value={(formValues[fieldName] as string) || ''}
                  onChange={(e) => setFormValues({ ...formValues, [fieldName]: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1px solid #d1d5db', fontSize: 13, background: 'white',
                  }}
                >
                  <option value="">Select...</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}

          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save & Unlock Forever Free'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
