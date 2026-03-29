'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HeroCalculator from '@/components/home/HeroCalculator';

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
    "material": "cotton",
    "category": "apparel",
    "declaredValue": 49.99,
    "originCountry": "CN",
    "destinationCountry": "US",
    "zipcode": "10001",
    "shippingCost": 8.50
  }'`;

  return (
    <div style={{
      background: '#0d1117',
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
    "material": "cotton",
    "category": "apparel",
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
      background: '#0d1117',
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
      `}<span style={{ color: '#fbbf24' }}>&quot;shipping&quot;</span>{`: `}<span style={{ color: '#a5f3fc' }}>8.50</span>{`
    },
    `}<span style={{ color: '#fbbf24' }}>&quot;hsCode&quot;</span>{`: `}<span style={{ color: '#86efac' }}>&quot;6109.10&quot;</span>{`,
    `}<span style={{ color: '#fbbf24' }}>&quot;hsCodeConfidence&quot;</span>{`: `}<span style={{ color: '#86efac' }}>&quot;100%&quot;</span>{`
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
      <div style={{ fontSize: 32, marginBottom: 16 }} aria-hidden="true">{icon}</div>
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

// ─── Competitor Bar Chart ────────────────────────
// Source: archive/Competitor_Feature_Matrix.xlsx (기능 체크리스트 시트, R61)
// Feature counts: 47-feature matrix ✅ counts mapped to full feature sets
const COMPETITORS = [
  { name: 'POTAL', features: 140, cost: '$0', costNote: 'Forever Free', isPotal: true },
  { name: 'Global-e', features: 35, cost: '$39,000+', costNote: '/yr (6.5% GMV)', isPotal: false },
  { name: 'Avalara', features: 31, cost: '$18,000+', costNote: '/yr ($1,500/mo+)', isPotal: false },
  { name: 'Zonos', features: 31, cost: '$48,000+', costNote: '/yr ($2/order+10%)', isPotal: false },
  { name: 'Easyship', features: 18, cost: '$348+', costNote: '/yr ($29/mo)', isPotal: false },
  { name: 'DHL', features: 12, cost: '$600+', costNote: '/yr ($50/mo)', isPotal: false },
  { name: 'Hurricane', features: 12, cost: 'N/A', costNote: '(Enterprise only)', isPotal: false },
  { name: 'Dutify', features: 11, cost: '$180+', costNote: '/yr ($15/mo)', isPotal: false },
  { name: 'SimplyDuty', features: 7, cost: '$120+', costNote: '/yr (£9.99/mo)', isPotal: false },
  { name: 'TaxJar', features: 6, cost: '$1,188+', costNote: '/yr ($99/mo)', isPotal: false },
];

function CompetitorBarChart() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {COMPETITORS.map((c) => {
        const pct = Math.round((c.features / 140) * 100);
        return (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 90,
              textAlign: 'right',
              fontSize: 13,
              fontWeight: c.isPotal ? 800 : 600,
              color: c.isPotal ? '#02122c' : '#666',
              flexShrink: 0,
            }}>
              {c.name}
            </div>
            <div style={{ flex: 1, position: 'relative', height: 28, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: c.isPotal
                  ? 'linear-gradient(90deg, #F59E0B, #f97316)'
                  : '#cbd5e1',
                borderRadius: 6,
                transition: 'width 1s ease-out',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 8,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.isPotal ? '#02122c' : '#475569',
                  whiteSpace: 'nowrap',
                }}>
                  {c.features}
                </span>
              </div>
            </div>
          </div>
        );
      })}
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
        background: 'linear-gradient(135deg, #02122c 0%, #0a1e3d 50%, #1a365d 100%)',
        color: 'white',
        padding: '100px 20px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: 1152, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Left: Text */}
            <div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 24,
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
                ALL FEATURES FREE &mdash; FOREVER
              </div>

              <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
                140 Features.{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  All Free.
                </span>
                {' '}Forever.
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 520,
              }}>
                Top 10 competitors combined offer fewer features &mdash;
                and charge up to $50,000/year. POTAL gives you everything. For $0.
              </p>

              <div style={{ display: 'flex', gap: 14, marginBottom: 48 }}>
                <Link
                  href="/auth/signup"
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
                  Start Free Now
                </Link>
                <Link
                  href="/developers"
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
                  API Docs
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { value: 140, suffix: '', label: 'Features', icon: '⚡' },
                  { value: 240, suffix: '', label: 'Countries', icon: '🌍' },
                  { value: 155, suffix: '+', label: 'API Endpoints', icon: '🔗' },
                  { value: 0, suffix: '', label: 'Cost — Forever', icon: '💰', display: '$0' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 20px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }} aria-hidden="true">{stat.icon}</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', fontVariantNumeric: 'tabular-nums' }}>
                        {'display' in stat ? stat.display : <AnimatedNumber target={stat.value} suffix={stat.suffix} />}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Trusted By */}
              <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Built on official data from
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {['WTO', 'USITC', 'EU TARIC', 'UK HMRC', 'CBSA', 'KCS', 'JP Customs', 'OFAC'].map((source) => (
                    <span
                      key={source}
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
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Calculator */}
            <div className="hero-code">
              {/* <CodeBlock /> */}
              <HeroCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES CTA BANNER ══════════════════════ */}
      <section style={{ background: '#0A0A1A', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ color: '#E8640A', fontWeight: 700, fontSize: 14 }}>140 FEATURES</span>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '4px 0' }}>Try every feature with a live demo</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>No sign-up required. All 140 features free to try.</p>
          </div>
          <Link href="/features" style={{ background: '#E8640A', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15, whiteSpace: 'nowrap' }}>
            Explore 140 Features →
          </Link>
        </div>
      </section>

      {/* ═══════════════════ COMPETITOR FEATURE COMPARISON ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              More features than all competitors combined
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              We analyzed every feature from the top 10 cross-border commerce platforms.
              POTAL covers them all &mdash; and more.
            </p>
          </div>

          <CompetitorBarChart />

          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 24 }}>
            Source: Feature-by-feature audit of each competitor&apos;s public documentation and product pages.
          </p>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ COST COMPARISON TABLE ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              They charge enterprise prices. We don&apos;t charge at all.
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              Every competitor below charges per-transaction fees, setup costs, or enterprise minimums.
              POTAL is free. No asterisks.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>Features</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>Annual Cost</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>Per-Transaction</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c, i) => (
                  <tr key={c.name} style={{
                    borderTop: '1px solid #f0f0f0',
                    background: c.isPotal ? '#f0fdf4' : i % 2 === 0 ? '#fafafa' : 'white',
                  }}>
                    <td style={{ padding: '14px 20px', fontWeight: c.isPotal ? 800 : 500, color: c.isPotal ? '#02122c' : '#444' }}>
                      {c.name}
                      {c.isPotal && (
                        <span style={{
                          marginLeft: 8,
                          background: '#10b981',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontSize: 10,
                          fontWeight: 700,
                        }}>
                          FREE
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: c.isPotal ? 800 : 500, color: c.isPotal ? '#02122c' : '#666' }}>
                      {c.features}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: c.isPotal ? 800 : 500, color: c.isPotal ? '#16a34a' : '#666' }}>
                      {c.cost}{!c.isPotal && <span style={{ fontSize: 11, color: '#999' }}> {c.costNote}</span>}
                      {c.isPotal && <span style={{ fontSize: 11, color: '#16a34a' }}> {c.costNote}</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '14px 16px', fontWeight: c.isPotal ? 700 : 400, color: c.isPotal ? '#16a34a' : '#888' }}>
                      {c.isPotal ? 'None' : 'Yes'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#02122c', fontWeight: 700, marginTop: 24 }}>
            They charge enterprise prices for fewer features. We give you more &mdash; for free.
          </p>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ HOW IT WORKS ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1024, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
            How it works
          </h2>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 500, margin: '0 auto' }}>
            Three steps to show your customers the true cost of cross-border purchases
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '01', title: 'Get your API key', description: 'Sign up for free and get your publishable key in seconds. No credit card required.', color: '#F59E0B' },
            { step: '02', title: 'Embed the widget', description: 'Add one script tag to your product page. The widget auto-detects your API endpoint.', color: '#3b82f6' },
            { step: '03', title: 'Buyers see true cost', description: 'Customers select their country and instantly see duties, taxes, and total landed cost.', color: '#10b981' },
          ].map((item) => (
            <div key={item.step} style={{ background: 'white', borderRadius: 16, padding: 32, border: '1px solid #e5e7eb', position: 'relative' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: item.color, opacity: 0.15, position: 'absolute', top: 16, right: 20 }}>{item.step}</div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: item.color, marginBottom: 16 }}>{item.step}</div>
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
              One API that handles the complexity of international trade regulations.{' '}
              <Link href="/features" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>See all 140 features &rarr;</Link>
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FeatureCard icon="🌍" title="240 Countries" description="Complete duty rates, VAT/GST, de minimis thresholds, and FTA agreements for 240 countries worldwide." />
            <FeatureCard icon="🎯" title="9-Field HS Classification" description="Input 9 standardized fields — product name, material, category, and more — validated against WCO standards. Get 100% accurate HS Codes." />
            <FeatureCard icon="📍" title="Sub-national Tax" description="State-level tax for US (50 states), Canada (13 provinces — GST/HST/PST), and Brazil (27 states — ICMS)." />
            <FeatureCard icon="🤝" title="FTA Detection" description="Automatically detects Free Trade Agreements between origin and destination countries for reduced duty rates." />
            <FeatureCard icon="📦" title="De Minimis Rules" description="Knows every country's duty-free threshold. Orders under the limit? Zero import duty, automatically applied." />
            <FeatureCard icon="🧩" title="Embeddable Widget" description="Drop-in JavaScript widget with Shadow DOM isolation. Works on any site with zero CSS conflicts." />
            <FeatureCard icon="🛡️" title="Sanctions & Export Controls" description="Screen against OFAC SDN, BIS Entity List, and 19 sanctions sources. 21,300+ entries with fuzzy matching." />
            <FeatureCard icon="⚖️" title="Trade Remedies" description="Anti-dumping duties, countervailing duties, and safeguard measures. 119,700+ cases across 36 countries." />
            <FeatureCard icon="🤖" title="AI Agent Ready (MCP)" description="Official MCP server on the registry. Any AI agent can call POTAL via one command." />
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ API RESPONSE ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
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

      {/* ═══════════════════ WIDGET DEMO ══��═════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: '#02122c', color: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>Your customers see this</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            The POTAL widget embeds directly into your product page.
            Select a country below to see it in action.
          </p>
          <LiveWidgetDemo />
          <div style={{ marginTop: 32 }}>
            <Link href="/developers/playground" style={{ padding: '14px 28px', borderRadius: 10, background: '#F59E0B', color: '#02122c', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
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
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Without POTAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b', marginBottom: 20 }}>Customer sees $45 at checkout...</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Unexpected $18 customs charge at delivery', 'Customer refuses package → return shipping costs', 'Negative review: "Hidden fees!"', 'Lost customer lifetime value'].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#7f1d1d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>✕</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Cart abandonment rate: up to 48%</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>With POTAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#14532d', marginBottom: 20 }}>Customer sees $63 total landed cost</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Duties, taxes & fees shown before checkout', 'No surprise charges at delivery', '5-star review: "Exactly what I expected to pay"', 'Repeat customer → higher LTV'].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#14532d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#dcfce7', borderRadius: 8, fontSize: 13, color: '#14532d', fontWeight: 600 }}>Conversion rate increase: up to 25%</div>
          </div>
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
            Stop paying for duty calculation.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, fontSize: 17, lineHeight: 1.7 }}>
            140 features. 240 countries. Free forever.
            No credit card, no trial, no limits.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/auth/signup"
              style={{ padding: '16px 36px', borderRadius: 12, background: '#F59E0B', color: '#02122c', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}
            >
              Start Free Now
            </Link>
            <Link
              href="/features"
              style={{ padding: '16px 36px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>
    </div>
  );
}
