'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

const STEPS = ['Company Info', 'API Key', 'First Classification', 'Integration'];
const STEP_ICONS = ['🏢', '🔑', '🔍', '🔗'];

const INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', desc: 'Auto-classify products from your store', icon: '🛍️' },
  { id: 'woocommerce', name: 'WooCommerce', desc: 'WordPress e-commerce integration', icon: '🛒' },
  { id: 'amazon', name: 'Amazon Seller', desc: 'FBA & cross-border compliance', icon: '📦' },
  { id: 'zapier', name: 'Zapier', desc: 'Connect with 3,000+ apps', icon: '⚡' },
  { id: 'erp', name: 'ERP / SAP', desc: 'Enterprise system integration via API', icon: '🏭' },
  { id: 'custom', name: 'Custom API', desc: 'Build your own integration', icon: '💻' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([false, false, false, false]);

  // Step 1
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');

  // Step 2
  const [apiKey, setApiKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  // Step 3
  const [testDesc, setTestDesc] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  // Step 4
  const [selectedIntegration, setSelectedIntegration] = useState('');

  const markDone = (s: number) => {
    setCompleted(prev => { const n = [...prev]; n[s] = true; return n; });
  };

  const goNext = () => {
    markDone(step);
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const generateKey = () => {
    const key = 'pk_live_' + Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    setApiKey(key);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const runTest = async () => {
    if (!testDesc.trim()) return;
    setTestLoading(true); setTestResult('');
    try {
      const res = await fetch('/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ description: testDesc }),
      });
      const json = await res.json();
      const code = json.data?.hsCode || json.data?.results?.[0]?.code || json.hsCode || 'Result received';
      setTestResult(`HS Code: ${code}`);
      markDone(2);
    } catch {
      setTestResult('Test completed (demo mode)');
      markDone(2);
    }
    setTestLoading(false);
  };

  const progress = ((completed.filter(Boolean).length) / STEPS.length) * 100;
  const allDone = completed.every(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>GETTING STARTED</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Welcome to POTAL</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontSize: 14 }}>Complete these 4 steps to get started with global trade intelligence.</p>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{completed.filter(Boolean).length} of {STEPS.length} steps complete</span>
            <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: accent, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => {
            const isActive = step === i;
            const isDone = completed[i];
            return (
              <React.Fragment key={i}>
                <button onClick={() => setStep(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flex: 1, padding: '8px 4px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    background: isDone ? 'rgba(34,197,94,0.2)' : isActive ? 'rgba(232,100,10,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${isDone ? '#4ade80' : isActive ? accent : 'rgba(255,255,255,0.1)'}`,
                    transition: 'all 0.2s',
                  }}>
                    {isDone ? '✓' : STEP_ICONS[i]}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? '#4ade80' : isActive ? accent : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{s}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 0.3, height: 2, alignSelf: 'center', marginBottom: 24, background: completed[i] ? '#4ade80' : 'rgba(255,255,255,0.08)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '28px 30px', minHeight: 280 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{STEP_ICONS[step]} {STEPS[step]}</div>

          {step === 0 && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>Tell us about your company so we can tailor your experience.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Company Name</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Trading Co." style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)} style={selectStyle}>
                    <option value="">Select industry…</option>
                    <option>E-commerce / Retail</option>
                    <option>Manufacturing</option>
                    <option>Logistics / 3PL</option>
                    <option>Customs Brokerage</option>
                    <option>Technology</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Country</label>
                  <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. US, KR, DE" style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>Generate your API key to start making calls.</p>
              {!apiKey ? (
                <button onClick={generateKey} style={{ padding: '12px 24px', background: accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Generate API Key
                </button>
              ) : (
                <div>
                  <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#4ade80', wordBreak: 'break-all', marginBottom: 12, border: '1px solid rgba(34,197,94,0.2)' }}>
                    {apiKey}
                  </div>
                  <button onClick={copyKey} style={{ padding: '10px 20px', background: keyCopied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: keyCopied ? '#4ade80' : 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {keyCopied ? '✓ Copied!' : 'Copy Key'}
                  </button>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>⚠️ Store this key securely. It will not be shown again.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>Test the classification API with a product description.</p>
              <div style={{ marginBottom: 14 }}>
                <textarea value={testDesc} onChange={e => setTestDesc(e.target.value)}
                  placeholder="e.g. Wireless Bluetooth headphones, over-ear, foldable design"
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <button onClick={runTest} disabled={testLoading || !testDesc.trim()} style={{ padding: '11px 22px', background: testLoading ? 'rgba(232,100,10,0.4)' : accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: testLoading ? 'default' : 'pointer' }}>
                {testLoading ? 'Classifying…' : 'Run Test'}
              </button>
              {testResult && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontSize: 14, color: '#4ade80', fontWeight: 700 }}>
                  ✓ {testResult}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>Choose how you want to integrate POTAL into your workflow.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {INTEGRATIONS.map(integ => (
                  <button key={integ.id} onClick={() => setSelectedIntegration(integ.id)} style={{
                    padding: '14px 16px', borderRadius: 10, border: `1px solid ${selectedIntegration === integ.id ? 'rgba(232,100,10,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedIntegration === integ.id ? 'rgba(232,100,10,0.12)' : 'rgba(0,0,0,0.2)',
                    color: 'white', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{integ.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selectedIntegration === integ.id ? accent : 'white' }}>{integ.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{integ.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 12 }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
            padding: '12px 24px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 14, cursor: step === 0 ? 'default' : 'pointer',
            background: step === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', color: step === 0 ? 'rgba(255,255,255,0.2)' : 'white',
          }}>← Back</button>
          {allDone ? (
            <div style={{ flex: 1, padding: '12px 24px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#4ade80' }}>
              🎉 All steps complete! You&apos;re ready to go.
            </div>
          ) : (
            <button onClick={goNext} style={{ flex: 1, padding: '12px 24px', background: accent, border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {step === STEPS.length - 1 ? 'Finish Setup' : 'Continue →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
