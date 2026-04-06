'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

interface VATResult {
  valid?: boolean;
  vatNumber?: string;
  countryCode?: string;
  companyName?: string;
  address?: string;
  registrationDate?: string;
  status?: string;
  consultationNumber?: string;
}

export default function VATCheckPage() {
  const [vatNumber, setVatNumber] = useState('');
  const [requesterVAT, setRequesterVAT] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VATResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!vatNumber.trim()) { setError('Please enter a VAT number.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/tax/vat-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          vatNumber: vatNumber.trim().replace(/\s/g, ''),
          ...(requesterVAT.trim() ? { requesterVatNumber: requesterVAT.trim().replace(/\s/g, '') } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'VAT validation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const isValid = result?.valid === true;
  const isInvalid = result?.valid === false;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>VAT TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>VAT Number Verification</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Validate EU VAT numbers via VIES and retrieve company registration details.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>VAT Number to Verify *</label>
            <input
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
              placeholder="e.g. DE123456789, GB123456789, FR12345678901"
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Include country prefix (DE, GB, FR, NL, etc.)</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Your VAT Number (optional — for consultation ref)</label>
            <input
              value={requesterVAT}
              onChange={e => setRequesterVAT(e.target.value)}
              placeholder="e.g. DE987654321"
              style={inputStyle}
            />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !vatNumber.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Verifying...' : 'Verify VAT Number'}
        </button>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>
        )}

        {isValid && (
          <div style={{ marginTop: 24 }}>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 14, padding: 24, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>&#10003;</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>VALID</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{result.vatNumber}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.companyName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Company Name</span>
                    <span style={{ fontWeight: 700, maxWidth: '60%', textAlign: 'right' }}>{result.companyName}</span>
                  </div>
                )}
                {result.countryCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Country</span>
                    <span style={{ fontWeight: 700 }}>{result.countryCode}</span>
                  </div>
                )}
                {result.address && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Address</span>
                    <span style={{ fontWeight: 600, maxWidth: '60%', textAlign: 'right', color: 'rgba(255,255,255,0.8)' }}>{result.address}</span>
                  </div>
                )}
                {result.registrationDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Registration Date</span>
                    <span style={{ fontWeight: 700 }}>{result.registrationDate}</span>
                  </div>
                )}
                {result.consultationNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Consultation Ref</span>
                    <span style={{ fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{result.consultationNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isInvalid && (
          <div style={{ marginTop: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>&#10007;</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171' }}>INVALID</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {result.status || 'This VAT number was not found in the registry.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Example VAT numbers hint */}
        <div style={{ marginTop: 32, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Example formats</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['DE123456789', 'GB123456789', 'FR12345678901', 'NL123456789B01'].map(v => (
              <button key={v} onClick={() => setVatNumber(v)} style={{
                padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
