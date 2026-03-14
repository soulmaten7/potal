'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Animated Counter ─────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{value.toLocaleString()}{suffix}</>;
}

// ─── Code Preview Component ───────────────────────
function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const code = `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productName": "Cotton T-Shirt",
    "declaredValue": 49.99,
    "originCountry": "CN",
    "destinationCountry": "US",
    "zipcode": "10001",
    "shippingCost": 8.50
  }'`;

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#eab308' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '20px',
        fontSize: 13,
        lineHeight: 1.7,
        color: '#a5f3fc',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        <span style={{ color: '#c084fc' }}>curl</span> -X POST https://www.potal.app/api/v1/calculate \{'\n'}
        {'  '}-H <span style={{ color: '#fbbf24' }}>&quot;X-API-Key: pk_live_your_key&quot;</span> \{'\n'}
        {'  '}-H <span style={{ color: '#fbbf24' }}>&quot;Content-Type: application/json&quot;</span> \{'\n'}
        {'  '}-d <span style={{ color: '#86efac' }}>{`'{
    "productName": "Cotton T-Shirt",
    "declaredValue": 49.99,
    "originCountry": "CN",
    "destinationCountry": "US",
    "zipcode": "10001",
    "shippingCost": 8.50
  }'`}</span>
      </pre>
    </div>
  );
}

// ─── Response Preview ─────────────────────────────
function ResponsePreview() {
  return (
    <div style={{
      background: '#0f172a',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(34,197,94,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>200 OK</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>~120ms</span>
      </div>
      <pre style={{
        margin: 0,
        padding: '20px',
        fontSize: 13,
        lineHeight: 1.7,
        color: '#94a3b8',
        overflowX: 'auto',
      }}>
{`{
  `}<span style={{ color: '#fbbf24' }}>&quot;success&quot;</span>{`: `}<span style={{ color: '#22c55e' }}>true</span>{`,
  `}<span style={{ color: '#fbbf24' }}>&quot;data&quot;</span>{`: {
    `}<span style={{ color: '#fbbf24' }}>&quot;totalLandedCost&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>79.83</span>{`,
    `}<span style={{ color: '#fbbf24' }}>&quot;breakdown&quot;</span>{`: {
      `}<span style={{ color: '#fbbf24' }}>&quot;productPrice&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>49.99</span>{`,
      `}<span style={{ color: '#fbbf24' }}>&quot;importDuty&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>8.25</span>{`,
      `}<span style={{ color: '#fbbf24' }}>&quot;tax&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>5.19</span>{`,
      `}<span style={{ color: '#fbbf24' }}>&quot;shipping&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>8.50</span>{`,
      `}<span style={{ color: '#fbbf24' }}>&quot;taxLabel&quot;</span>{`: `}<span style={{ color: '#86efac' }}>&quot;Sales Tax (NY)&quot;</span>{`
    },
    `}<span style={{ color: '#fbbf24' }}>&quot;hsCode&quot;</span>{`: `}<span style={{ color: '#86efac' }}>&quot;6109.10&quot;</span>{`,
    `}<span style={{ color: '#fbbf24' }}>&quot;fta&quot;</span>{`: `}<span style={{ color: '#ef4444' }}>false</span>{`,
    `}<span style={{ color: '#fbbf24' }}>&quot;deMinimis&quot;</span>{`: `}<span style={{ color: '#ef4444' }}>false</span>{`
  }
}`}
      </pre>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 28,
      border: '1px solid #e5e7eb',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#02122c', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

// ─── Live Widget Demo ─────────────────────────────
const DEMO_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
  { code: 'GB', name: 'United Kingdom', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'DE', name: 'Germany', flag: '\uD83C\uDDE9\uD83C\uDDEA' },
  { code: 'JP', name: 'Japan', flag: '\uD83C\uDDEF\uD83C\uDDF5' },
  { code: 'AU', name: 'Australia', flag: '\uD83C\uDDE6\uD83C\uDDFA' },
  { code: 'KR', name: 'South Korea', flag: '\uD83C\uDDF0\uD83C\uDDF7' },
  { code: 'BR', name: 'Brazil', flag: '\uD83C\uDDE7\uD83C\uDDF7' },
  { code: 'CA', name: 'Canada', flag: '\uD83C\uDDE8\uD83C\uDDE6' },
];

interface DemoResult {
  importDuty: number;
  salesTax: number;
  taxLabel: string;
  totalLandedCost: number;
  deMinimisApplied: boolean;
  dutyRate: string;
}

const DEMO_PRELOADED: Record<string, DemoResult> = {
  US: { importDuty: 8.25, salesTax: 4.44, taxLabel: 'Sales Tax', totalLandedCost: 71.18, deMinimisApplied: false, dutyRate: '16.5%' },
  GB: { importDuty: 0, salesTax: 10.00, taxLabel: 'VAT 20%', totalLandedCost: 68.49, deMinimisApplied: true, dutyRate: '0% (de minimis)' },
  DE: { importDuty: 0, salesTax: 9.50, taxLabel: 'VAT 19%', totalLandedCost: 68.24, deMinimisApplied: true, dutyRate: '0% (de minimis)' },
  JP: { importDuty: 5.00, salesTax: 5.50, taxLabel: 'JCT 10%', totalLandedCost: 69.74, deMinimisApplied: false, dutyRate: '10%' },
  AU: { importDuty: 0, salesTax: 5.00, taxLabel: 'GST 10%', totalLandedCost: 63.49, deMinimisApplied: true, dutyRate: '0% (de minimis)' },
  KR: { importDuty: 0, salesTax: 5.00, taxLabel: 'VAT 10%', totalLandedCost: 63.49, deMinimisApplied: true, dutyRate: '0% (de minimis)' },
  BR: { importDuty: 17.50, salesTax: 30.20, taxLabel: 'Import Taxes', totalLandedCost: 106.19, deMinimisApplied: false, dutyRate: '35%' },
  CA: { importDuty: 9.00, salesTax: 2.95, taxLabel: 'GST 5%', totalLandedCost: 70.44, deMinimisApplied: false, dutyRate: '18%' },
};

function LiveWidgetDemo() {
  const [selected, setSelected] = useState('US');
  const result = DEMO_PRELOADED[selected];
  const country = DEMO_COUNTRIES.find(c => c.code === selected)!;

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 32,
      maxWidth: 420,
      margin: '0 auto',
      textAlign: 'left',
      color: '#1a1a1a',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#02122c', marginBottom: 16 }}>
        Total Landed Cost
      </div>

      {/* Country selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 6, display: 'block' }}>
          Destination Country
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEMO_COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSelected(c.code)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: selected === c.code ? '2px solid #F59E0B' : '1px solid #e5e7eb',
                background: selected === c.code ? '#FEF3C7' : '#f8fafc',
                fontSize: 13,
                fontWeight: selected === c.code ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                color: '#333',
              }}
            >
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 12 }}>
        {result.deMinimisApplied
          ? `De minimis applies — duty-free to ${country.name}`
          : `Duty rate: ${result.dutyRate} to ${country.name}`}
      </div>

      {/* Breakdown */}
      {[
        ['Product Price', '$49.99'],
        [`Import Duty (${result.dutyRate})`, `$${result.importDuty.toFixed(2)}`],
        [`${result.taxLabel}`, `$${result.salesTax.toFixed(2)}`],
        ['Shipping', '$8.50'],
      ].map(([label, value], i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 0',
          fontSize: 14,
          borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ color: '#666' }}>{label}</span>
          <span style={{ fontWeight: 600, color: result.importDuty === 0 && i === 1 ? '#10b981' : '#333' }}>
            {value}
          </span>
        </div>
      ))}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '14px 0 0',
        marginTop: 8,
        borderTop: '2px solid #02122c',
        fontSize: 16,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span>Total Landed Cost</span>
        <span style={{ color: '#02122c' }}>${result.totalLandedCost.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Fade In Section ─────────────────────────────
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fafafa',
      color: '#1a1a1a',
    }}>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 40%, #1a365d 100%)',
        color: 'white',
        padding: '100px 20px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Left: Text */}
            <div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(245,158,11,0.15)',
                color: '#F59E0B',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 24,
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                The infrastructure for global commerce
              </div>

              <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
                Total Landed Cost,{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  One API Call
                </span>
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 480,
              }}>
                Show your buyers the true cost of any product — duties, taxes,
                and shipping — for 240 countries. Embed in minutes, not months.
              </p>

              <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
                <Link
                  href="/developers"
                  style={{
                    padding: '16px 32px',
                    borderRadius: 12,
                    background: '#F59E0B',
                    color: '#02122c',
                    fontWeight: 700,
                    fontSize: 16,
                    textDecoration: 'none',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Calculate Duties Free
                </Link>
                <Link
                  href="/developers/docs"
                  style={{
                    padding: '16px 32px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 16,
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.15)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  Read Docs
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 40 }}>
                {[
                  { value: 240, suffix: '', label: 'Countries' },
                  { value: 5371, suffix: '', label: 'HS Codes' },
                  { value: 63, suffix: '', label: 'FTAs' },
                  { value: 181, suffix: '', label: 'Tariff Countries' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
                      <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Trusted By */}
              <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Built on official data from
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { name: 'WTO', full: 'World Trade Organization' },
                    { name: 'USITC', full: 'US International Trade Commission' },
                    { name: 'EU TARIC', full: 'EU Tariff Database' },
                    { name: 'UK HMRC', full: 'UK Trade Tariff' },
                    { name: 'CBSA', full: 'Canada Border Services' },
                    { name: 'KCS', full: 'Korea Customs Service' },
                    { name: 'OFAC', full: 'US Sanctions' },
                  ].map((source) => (
                    <span
                      key={source.name}
                      title={source.full}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.45)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {source.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Code Preview */}
            <div className="hero-code">
              <CodeBlock />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUST METRICS ═════════ */}
      <FadeInSection>
      <section style={{
        padding: '48px 20px 40px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}>
        <div className="trust-grid" style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32,
          textAlign: 'center',
        }}>
          {[
            { value: '240', label: 'Countries Covered', sub: 'Every territory worldwide' },
            { value: '113M+', label: 'Tariff Data Points', sub: 'MFN + preferential rates' },
            { value: '99.2%', label: 'Calculation Accuracy', sub: 'Verified against gov sources' },
            { value: '<200ms', label: 'API Response Time', sub: 'p95 latency globally' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '20px 16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: '#02122c', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#444', marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          maxWidth: 900,
          margin: '32px auto 0',
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          alignItems: 'center',
          opacity: 0.4,
          fontSize: 18,
          fontWeight: 700,
          color: '#444',
        }}>
          {['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Custom Stores'].map(name => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ HOW IT WORKS ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
            How it works
          </h2>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 500, margin: '0 auto' }}>
            Three steps to show your customers the true cost of cross-border purchases
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            {
              step: '01',
              title: 'Get your API key',
              description: 'Sign up for free and get your publishable key in seconds. No credit card required.',
              color: '#F59E0B',
            },
            {
              step: '02',
              title: 'Embed the widget',
              description: 'Add one script tag to your product page. The widget auto-detects your API endpoint.',
              color: '#3b82f6',
            },
            {
              step: '03',
              title: 'Buyers see true cost',
              description: 'Customers select their country and instantly see duties, taxes, and total landed cost.',
              color: '#10b981',
            },
          ].map((item) => (
            <div key={item.step} style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              border: '1px solid #e5e7eb',
              position: 'relative',
            }}>
              <div style={{
                fontSize: 48,
                fontWeight: 900,
                color: item.color,
                opacity: 0.15,
                position: 'absolute',
                top: 16,
                right: 20,
              }}>
                {item.step}
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${item.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: item.color,
                marginBottom: 16,
              }}>
                {item.step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ FEATURES ═══════════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              Everything you need for global commerce
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 550, margin: '0 auto' }}>
              One API that handles the complexity of international trade regulations
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            <FeatureCard
              icon="🌍"
              title="240 Countries"
              description="Complete duty rates, VAT/GST, de minimis thresholds, and FTA agreements for 240 countries worldwide."
            />
            <FeatureCard
              icon="🏷"
              title="HS Code Classification"
              description="AI-powered product classification. Send a product name, get the correct HS code and applicable duty rate."
            />
            <FeatureCard
              icon="📍"
              title="Sub-national Tax"
              description="State-level tax for US (50 states), Canada (13 provinces — GST/HST/PST), and Brazil (27 states — ICMS)."
            />
            <FeatureCard
              icon="🤝"
              title="FTA Detection"
              description="Automatically detects Free Trade Agreements between origin and destination countries for reduced duty rates."
            />
            <FeatureCard
              icon="📦"
              title="De Minimis Rules"
              description="Knows every country's duty-free threshold. Orders under the limit? Zero import duty, automatically applied."
            />
            <FeatureCard
              icon="🧩"
              title="Embeddable Widget"
              description="Drop-in JavaScript widget with Shadow DOM isolation. Works on any site with zero CSS conflicts."
            />
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ API RESPONSE ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 16 }}>
              One request, complete breakdown
            </h2>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
              Every calculation returns a detailed breakdown including product price,
              import duty, taxes, shipping, HS code, FTA status, and de minimis eligibility.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Total landed cost in one number',
                'Line-by-line cost breakdown',
                'HS code with duty rate',
                'State-level tax for US, CA, BR',
                'FTA & de minimis detection',
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#444' }}>
                  <span style={{ color: '#10b981', fontSize: 18 }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ResponsePreview />
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ WIDGET DEMO ════════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: '#02122c', color: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>
            Your customers see this
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            The POTAL widget embeds directly into your product page.
            Select a country below to see it in action.
          </p>

          <LiveWidgetDemo />

          <div style={{ marginTop: 32 }}>
            <Link
              href="/developers/playground"
              style={{
                padding: '14px 28px',
                borderRadius: 10,
                background: '#F59E0B',
                color: '#02122c',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Try Widget Playground
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ BEFORE vs AFTER ═════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12, textAlign: 'center' }}>
          The checkout experience your customers deserve
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 48, textAlign: 'center' }}>
          Surprise fees kill conversions. Transparency drives trust.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* WITHOUT POTAL */}
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Without POTAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b', marginBottom: 20 }}>
              Customer sees $45 at checkout...
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Unexpected $18 customs charge at delivery',
                'Customer refuses package → return shipping costs',
                'Negative review: "Hidden fees!"',
                'Lost customer lifetime value',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#7f1d1d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>✕</span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
              Cart abandonment rate: up to 48%
            </div>
          </div>

          {/* WITH POTAL */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 32,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              With POTAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#14532d', marginBottom: 20 }}>
              Customer sees $63 total landed cost
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Duties, taxes & fees shown before checkout',
                'No surprise charges at delivery',
                '5-star review: "Exactly what I expected to pay"',
                'Repeat customer → higher LTV',
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#14532d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#dcfce7', borderRadius: 8, fontSize: 13, color: '#14532d', fontWeight: 600 }}>
              Conversion rate increase: up to 25%
            </div>
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ PRICING TEASER ═════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
          Start free, scale as you grow
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 40 }}>
          200 free API calls per month. No credit card required.
        </p>

        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { name: 'Free', price: '$0', desc: '200 calls/mo', highlight: false },
            { name: 'Basic', price: '$20/mo', desc: '2,000 calls/mo', highlight: false },
            { name: 'Pro', price: '$80/mo', desc: '10,000 calls/mo', highlight: true },
            { name: 'Enterprise', price: '$300/mo', desc: '50,000+ calls/mo', highlight: false },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 28,
                border: plan.highlight ? '2px solid #F59E0B' : '1px solid #e5e7eb',
                boxShadow: plan.highlight ? '0 8px 24px rgba(245,158,11,0.12)' : 'none',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#02122c', marginBottom: 8 }}>{plan.price}</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{plan.desc}</div>
              <Link
                href="/pricing"
                style={{
                  fontSize: 14,
                  color: '#F59E0B',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View details &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ CTA ════════════════════ */}
      <FadeInSection>
      <section style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 100%)',
        color: 'white',
        padding: '96px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Ready to go global?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, fontSize: 17, lineHeight: 1.7 }}>
            Join sellers who use POTAL to show transparent pricing
            to customers in 240 countries.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link
              href="/developers"
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                background: '#F59E0B',
                color: '#02122c',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* Footer is provided by layout.tsx */}
    </div>
  );
}
