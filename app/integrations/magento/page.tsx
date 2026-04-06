'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const bg = '#0a1e3d';
const accent = '#E8640A';
const magentoColor = '#F26322';

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '11px 14px', background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
};

const FEATURES = [
  { icon: '🏭', title: 'B2B & B2C Support', desc: 'Full support for Magento\'s B2B features — company accounts, custom pricing, and separate compliance rules per segment.' },
  { icon: '🏷️', title: 'Product Attribute Sync', desc: 'Write HS codes and compliance metadata back to Magento product attributes automatically.' },
  { icon: '💱', title: 'Multi-currency Duties', desc: 'Works with Magento\'s multi-currency setup — duties displayed in the store\'s active currency.' },
  { icon: '🔌', title: 'REST & GraphQL API', desc: 'Integrates via Magento\'s REST and GraphQL APIs. Works with Magento 2.4+ and Adobe Commerce.' },
  { icon: '📊', title: 'Order Compliance Reports', desc: 'Automated compliance reporting per order batch. Export to CSV or forward to your ERP.' },
];

const STEPS = [
  { n: '1', title: 'Install the Magento module', desc: 'Install via Composer: composer require potal/magento2-module. Compatible with Magento 2.4.x.' },
  { n: '2', title: 'Configure API credentials', desc: 'Add your POTAL API key in Admin → Stores → Configuration → POTAL Trade Compliance.' },
  { n: '3', title: 'Map product attributes', desc: 'Select which product attributes should receive HS codes and compliance flags from POTAL.' },
  { n: '4', title: 'Enable checkout compliance', desc: 'Turn on the duty display block in your checkout. Compatible with Luma and Hyva themes.' },
];

export default function MagentoPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white' }}>
      <div style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🏗️</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(242,99,34,0.15)', border: '1px solid rgba(242,99,34,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: magentoColor }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: magentoColor }}>MAGENTO / ADOBE COMMERCE — COMING SOON</span>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>POTAL × Magento</h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 32 }}>
          Enterprise trade compliance for Magento 2 and Adobe Commerce. B2B-ready, Composer-installable, and built for high-volume merchants.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Magento 2.4+', 'Adobe Commerce'].map(p => (
            <span key={p} style={{ padding: '5px 14px', background: 'rgba(242,99,34,0.12)', border: '1px solid rgba(242,99,34,0.25)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: magentoColor }}>{p}</span>
          ))}
          <span style={{ padding: '5px 14px', background: 'rgba(232,100,10,0.12)', border: '1px solid rgba(232,100,10,0.25)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: accent }}>Expected: Q1 2027</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 28 }}>What you get with the integration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 28 }}>Setup in 4 steps</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(242,99,34,0.15)', border: '1px solid rgba(242,99,34,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: magentoColor, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'rgba(232,100,10,0.08)', border: '1px solid rgba(232,100,10,0.25)', borderRadius: 16, padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Get Notified at Launch</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Be first to know when the Magento module ships.</div>
          {submitted ? (
            <div style={{ padding: '14px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, fontWeight: 700, color: '#4ade80' }}>✓ You&apos;re on the list!</div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if (email.trim()) setSubmitted(true); }} style={{ display: 'flex', gap: 8 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required style={inputStyle} />
              <button type="submit" style={{ padding: '11px 20px', background: accent, border: 'none', borderRadius: 9, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>Notify Me</button>
            </form>
          )}
          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            <Link href="/contact" style={{ color: accent, textDecoration: 'none', fontWeight: 700 }}>Contact us</Link> for enterprise early access or custom integration support.
          </div>
        </div>
      </div>
    </div>
  );
}
