'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import HeroCalculator from '@/components/home/HeroCalculator';
import DataSourceTicker from '@/components/home/DataSourceTicker';
import { useI18n } from '@/app/context/I18nProvider';
// CW23 Sprint 1 imports
import HeaderMinimal from '@/components/layout/HeaderMinimal';
import DesktopOnlyGuard from '@/components/layout/DesktopOnlyGuard';
import LiveTicker from '@/components/ticker/LiveTicker';
import ScenarioSelector from '@/components/home/ScenarioSelector';

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
  { name: 'POTAL', features: 141, cost: '$0', costNote: 'Forever Free', isPotal: true },
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {COMPETITORS.map((c) => {
        const pct = Math.round((c.features / 141) * 100);
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
// ─── CW23 Sprint 1 — Legacy homepage preserved ─────────────────
// Per docs/HOMEPAGE_REDESIGN_SPEC.md and user instruction (2026-04-10),
// the original CW22 homepage is preserved below as `HomePageLegacyCW22`
// (no longer the default export) so that content/logic can be referenced
// during the CW23+ rebuild. It is NOT rendered anywhere. The new minimal
// Sprint 1 home is exported at the bottom of this file.
// DO NOT DELETE this function — see CLAUDE.md session notes for CW23.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomePageLegacyCW22() {
  const { t } = useI18n();
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fafafa',
      color: '#1a1a1a',
    }}>
      {/* ═══════════════════ DATA SOURCE TICKER ═══════════════════════ */}
      <DataSourceTicker />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a1e3d 50%, #1a365d 100%)',
        color: 'white',
        padding: '100px 20px 80px',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1340, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
                {t('home.hero.badge')}
              </div>

              <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
                {t('home.hero.title.part1')}{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #f97316)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {t('home.hero.title.part2')}
                </span>
                {' '}{t('home.hero.title.part3')}
              </h1>

              <p style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 520,
              }}>
                {t('home.hero.description')}
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
                  {t('home.hero.ctaPrimary')}
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
                  {t('home.hero.ctaSecondary')}
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { value: 141, suffix: '', label: t('home.hero.stat.features'), icon: '⚡' },
                  { value: 240, suffix: '', label: t('home.hero.stat.countries'), icon: '🌍' },
                  { value: 155, suffix: '+', label: t('home.hero.stat.endpoints'), icon: '🔗' },
                  { value: 0, suffix: '', label: t('home.hero.stat.cost'), icon: '💰', display: '$0' },
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
                  {t('home.hero.trustedBy')}
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
        <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ color: '#E8640A', fontWeight: 700, fontSize: 14 }}>{t('home.featuresBanner.count')}</span>
            <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: '4px 0' }}>{t('home.featuresBanner.title')}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>{t('home.featuresBanner.description')}</p>
          </div>
          <Link href="/features" style={{ background: '#E8640A', color: 'white', padding: '14px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15, whiteSpace: 'nowrap' }}>
            {t('home.featuresBanner.cta')}
          </Link>
        </div>
      </section>

      {/* ═══════════════════ COMPETITOR FEATURE COMPARISON ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              {t('home.competitor.title')}
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              {t('home.competitor.description')}
            </p>
          </div>

          <CompetitorBarChart />

          <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 24 }}>
            {t('home.competitor.source')}
          </p>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ COST COMPARISON TABLE ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              {t('home.cost.title')}
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 600, margin: '0 auto' }}>
              {t('home.cost.description')}
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>{t('home.cost.table.provider')}</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>{t('home.cost.table.features')}</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>{t('home.cost.table.annualCost')}</th>
                  <th style={{ textAlign: 'center', padding: '14px 16px', fontWeight: 600, color: '#888', fontSize: 12, textTransform: 'uppercase' }}>{t('home.cost.table.perTransaction')}</th>
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
                          {t('home.cost.table.free')}
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
                      {c.isPotal ? t('home.cost.table.none') : t('home.cost.table.yes')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#02122c', fontWeight: 700, marginTop: 24 }}>
            {t('home.cost.conclusion')}
          </p>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ HOW IT WORKS ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
            {t('home.howItWorks.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 500, margin: '0 auto' }}>
            {t('home.howItWorks.subtitle')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '01', title: t('home.howItWorks.step1.title'), description: t('home.howItWorks.step1.description'), color: '#F59E0B' },
            { step: '02', title: t('home.howItWorks.step2.title'), description: t('home.howItWorks.step2.description'), color: '#3b82f6' },
            { step: '03', title: t('home.howItWorks.step3.title'), description: t('home.howItWorks.step3.description'), color: '#10b981' },
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
        <div style={{ maxWidth: 1340, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              {t('home.features.title')}
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 550, margin: '0 auto' }}>
              {t('home.features.subtitle')}{' '}
              <Link href="/features" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>{t('home.features.seeAll')}</Link>
            </p>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FeatureCard icon="🌍" title={t('home.features.countries.title')} description={t('home.features.countries.desc')} />
            <FeatureCard icon="🎯" title={t('home.features.hsCode.title')} description={t('home.features.hsCode.desc')} />
            <FeatureCard icon="📍" title={t('home.features.tax.title')} description={t('home.features.tax.desc')} />
            <FeatureCard icon="🤝" title={t('home.features.fta.title')} description={t('home.features.fta.desc')} />
            <FeatureCard icon="📦" title={t('home.features.deMinimis.title')} description={t('home.features.deMinimis.desc')} />
            <FeatureCard icon="🧩" title={t('home.features.widget.title')} description={t('home.features.widget.desc')} />
            <FeatureCard icon="🛡️" title={t('home.features.sanctions.title')} description={t('home.features.sanctions.desc')} />
            <FeatureCard icon="⚖️" title={t('home.features.remedies.title')} description={t('home.features.remedies.desc')} />
            <FeatureCard icon="🤖" title={t('home.features.mcp.title')} description={t('home.features.mcp.desc')} />
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ API RESPONSE ═══════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1340, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 16 }}>
              {t('home.apiResponse.title')}
            </h2>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
              {t('home.apiResponse.description')}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                t('home.apiResponse.check1'),
                t('home.apiResponse.check2'),
                t('home.apiResponse.check3'),
                t('home.apiResponse.check4'),
                t('home.apiResponse.check5'),
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
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>{t('home.widgetDemo.title')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            {t('home.widgetDemo.description')}
          </p>
          <LiveWidgetDemo />
          <div style={{ marginTop: 32 }}>
            <Link href="/developers/playground" style={{ padding: '14px 28px', borderRadius: 10, background: '#F59E0B', color: '#02122c', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              {t('home.widgetDemo.cta')}
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ VIDEO GUIDES ═════════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
            See POTAL in Action
          </h2>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 48, maxWidth: 500, margin: '0 auto 48px' }}>
            Watch real demos — from 60-second overviews to feature deep dives.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
            {[
              { icon: '🎯', title: 'Quick Start', desc: '5 videos — Calculate landed cost, see live pricing, explore the dashboard', playlist: 'Quick Start' },
              { icon: '🌍', title: 'Real Scenarios', desc: 'Ship cosmetics to EU, electronics to Japan, clothing to US with FTA benefits', playlist: 'Real Scenarios' },
              { icon: '🔧', title: 'Features Deep Dive', desc: 'HS code classification, FTA lookup, sanctions screening, restrictions check', playlist: 'Features Deep Dive' },
              { icon: '💻', title: 'For Developers', desc: 'API docs walkthrough, dashboard demo, 141 features browser', playlist: 'For Developers' },
              { icon: '📊', title: 'Data & Transparency', desc: 'Live data ticker, 12 sources monitored, freshness indicators explained', playlist: 'Data & Transparency' },
            ].map((item, i) => (
              <a
                key={i}
                href="https://youtube.com/@POTAL-Official"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: 28,
                  textDecoration: 'none',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  display: 'block',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#02122c', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{item.desc}</div>
              </a>
            ))}
          </div>
          <a
            href="https://youtube.com/@POTAL-Official"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 32px',
              borderRadius: 10,
              background: '#FF0000',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
            Watch All Videos on YouTube
          </a>
        </div>
      </section>
      </FadeInSection>

      {/* ═══════════════════ BEFORE vs AFTER ═════════ */}
      <FadeInSection>
      <section style={{ padding: '96px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12, textAlign: 'center' }}>
          The checkout experience your customers deserve
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 48, textAlign: 'center' }}>
          Surprise fees kill conversions. Transparency drives trust.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('home.before.label')}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b', marginBottom: 20 }}>{t('home.before.title')}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[t('home.before.item1'), t('home.before.item2'), t('home.before.item3'), t('home.before.item4')].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#7f1d1d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0 }}>✕</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{t('home.before.stat')}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('home.after.label')}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#14532d', marginBottom: 20 }}>{t('home.after.title')}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[t('home.after.item1'), t('home.after.item2'), t('home.after.item3'), t('home.after.item4')].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: '#14532d', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 24, padding: '12px 16px', background: '#dcfce7', borderRadius: 8, fontSize: 13, color: '#14532d', fontWeight: 600 }}>{t('home.after.stat')}</div>
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
            {t('home.cta.title')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, fontSize: 17, lineHeight: 1.7 }}>
            {t('home.cta.description')}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/auth/signup"
              style={{ padding: '16px 36px', borderRadius: 12, background: '#F59E0B', color: '#02122c', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}
            >
              {t('home.cta.primary')}
            </Link>
            <Link
              href="/features"
              style={{ padding: '16px 36px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {t('home.cta.secondary')}
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>
    </div>
  );
}

// ─── CW23 Sprint 1 — New minimal homepage ──────────────────────
// Spec: docs/HOMEPAGE_REDESIGN_SPEC.md
// Components:
//   - DesktopOnlyGuard (Decision 8 — mobile not supported)
//   - HeaderMinimal (Decision 1 — logo + Community/Help only)
//   - LiveTicker (Decision 2 — 2-row authority ticker)
//   - ScenarioSelector (Decision 3 — 6 entry types)
// Sprint 2 (CW24) will fill in the ScenarioPanel/NonDevPanel/DevPanel.

export default function HomePage() {
  return (
    <DesktopOnlyGuard>
      <div className="min-h-screen bg-white">
        <LiveTicker />

        {/* CW38-HF4: Tighter hero + horizontal box layout */}
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
          <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">Free forever &middot; No credit card</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#02122c] mb-4 text-center leading-tight">
            Cross-Border Trade, Made Simple
          </h1>
          <p className="text-slate-500 text-center mb-10 max-w-3xl text-lg">
            HS classification, landed cost, FTA eligibility, sanctions screening — all in one place.
          </p>

          {/* CW38-HF4: Horizontal internal layout for boxes — fits in one viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 w-full max-w-6xl">
            <Link
              href="/workspace/export"
              className="flex flex-col sm:flex-row gap-5 sm:gap-6 py-7 px-7 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-500 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
            >
              {/* Left: Header + CTA */}
              <div className="flex flex-col justify-between sm:w-2/5 sm:border-r sm:border-blue-100 sm:pr-5 pb-4 sm:pb-0 border-b sm:border-b-0 border-blue-100">
                <div>
                  <span className="block text-5xl mb-2 group-hover:scale-110 transition-transform duration-200">&#128230;</span>
                  <span className="block text-3xl font-black text-blue-800 mb-1">Export</span>
                  <span className="block text-[13px] text-blue-500">I sell or ship abroad</span>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm group-hover:bg-blue-700 group-hover:shadow-md transition-all">
                    Start Export &#8594;
                  </span>
                </div>
              </div>

              {/* Right: Workflow + Also useful (vertically centered for balance with 3-step) */}
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Typical workflow</p>
                  <ul className="space-y-1 text-[14px] text-slate-700">
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 font-bold">1.</span><span>Classify Product</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 font-bold">2.</span><span>Apply FTA / RoO</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-500 font-bold">3.</span><span>Generate Document</span></li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Also useful</p>
                  <ul className="space-y-1 text-[13px] text-slate-600">
                    <li className="flex items-start gap-1.5"><span className="text-blue-400">&#8226;</span><span>Screen Parties</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-blue-400">&#8226;</span><span>ECCN Lookup</span></li>
                  </ul>
                </div>
              </div>
            </Link>

            <Link
              href="/workspace/import"
              className="flex flex-col sm:flex-row gap-5 sm:gap-6 py-7 px-7 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-500 hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
            >
              {/* Left: Header + CTA */}
              <div className="flex flex-col justify-between sm:w-2/5 sm:border-r sm:border-emerald-100 sm:pr-5 pb-4 sm:pb-0 border-b sm:border-b-0 border-emerald-100">
                <div>
                  <span className="block text-5xl mb-2 group-hover:scale-110 transition-transform duration-200">&#128229;</span>
                  <span className="block text-3xl font-black text-emerald-800 mb-1">Import</span>
                  <span className="block text-[13px] text-emerald-500">I buy or receive from abroad</span>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm group-hover:bg-emerald-700 group-hover:shadow-md transition-all">
                    Start Import &#8594;
                  </span>
                </div>
              </div>

              {/* Right: Workflow + Also useful (vertically centered) */}
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Typical workflow</p>
                  <ul className="space-y-1 text-[14px] text-slate-700">
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">1.</span><span>Classify Product</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">2.</span><span>Calculate Landed Cost</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">3.</span><span>Check Restrictions</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">4.</span><span>Compare Countries</span></li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Also useful</p>
                  <ul className="space-y-1 text-[13px] text-slate-600">
                    <li className="flex items-start gap-1.5"><span className="text-emerald-400">&#8226;</span><span>Apply FTA</span></li>
                    <li className="flex items-start gap-1.5"><span className="text-emerald-400">&#8226;</span><span>Generate Document</span></li>
                  </ul>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>8 API Endpoints</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>240 Countries</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>645K Rulings</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>47K Sanctions</span>
          </div>

          <div className="mt-10 flex gap-3">
            <Link href="/guides" className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all">
              Guides
            </Link>
            <Link href="/workspace/export" className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all">
              Workspace
            </Link>
          </div>
        </div>
      </div>
    </DesktopOnlyGuard>
  );
}
