'use client';

import React, { useState, useEffect } from 'react';
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
  const code = `curl -X POST https://potal-x1vl.vercel.app/api/v1/calculate \\
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
        <span style={{ color: '#c084fc' }}>curl</span> -X POST https://potal-x1vl.vercel.app/api/v1/calculate \{'\n'}
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
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#02122c', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{description}</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
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

              <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
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
                and shipping — for 139 countries. Embed in minutes, not months.
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
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  Get API Key — Free
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
                  { value: 139, suffix: '', label: 'Countries' },
                  { value: 50, suffix: '+', label: 'HS Code Categories' },
                  { value: 120, suffix: 'ms', label: 'Avg Response' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>
                      <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Code Preview */}
            <div>
              <CodeBlock />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ LOGOS ══════════════════ */}
      <section style={{
        padding: '40px 20px',
        borderBottom: '1px solid #e5e7eb',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: '#999', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
          Built for modern e-commerce platforms
        </p>
        <div style={{
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

      {/* ═══════════════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
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

      {/* ═══════════════════ FEATURES ═══════════════ */}
      <section style={{ padding: '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
              Everything you need for global commerce
            </h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 550, margin: '0 auto' }}>
              One API that handles the complexity of international trade regulations
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <FeatureCard
              icon="🌍"
              title="139 Countries"
              description="Complete duty rates, VAT/GST, de minimis thresholds, and FTA agreements for 139 countries worldwide."
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

      {/* ═══════════════════ API RESPONSE ═══════════ */}
      <section style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
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

      {/* ═══════════════════ WIDGET DEMO ════════════ */}
      <section style={{ padding: '80px 20px', background: '#02122c', color: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>
            Your customers see this
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            The POTAL widget embeds directly into your product page.
            Buyers select their country and instantly see the full cost.
          </p>

          {/* Widget mockup */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            margin: '0 auto',
            textAlign: 'left',
            color: '#1a1a1a',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#02122c', marginBottom: 16 }}>
              Total Landed Cost
            </div>
            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 14,
              color: '#666',
              border: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>Destination Country</span>
              <span style={{ fontWeight: 600, color: '#333' }}>United States</span>
            </div>
            <div style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 14,
              color: '#666',
              border: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>ZIP Code</span>
              <span style={{ fontWeight: 600, color: '#333' }}>10001</span>
            </div>

            <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 12 }}>
              Tax rate based on New York
            </div>

            {[
              ['Product Price', '$49.99'],
              ['Import Duty (16.5%)', '$8.25'],
              ['Sales Tax (NY 8.875%)', '$5.19'],
              ['Shipping', '$8.50'],
            ].map(([label, value], i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                fontSize: 14,
                borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
              }}>
                <span style={{ color: '#666' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
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
            }}>
              <span>Total Landed Cost</span>
              <span style={{ color: '#02122c' }}>$71.93</span>
            </div>
          </div>

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

      {/* ═══════════════════ PRICING TEASER ═════════ */}
      <section style={{ padding: '80px 20px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: '#02122c', marginBottom: 12 }}>
          Start free, scale as you grow
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 40 }}>
          1,000 free API calls per month. No credit card required.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { name: 'Starter', price: 'Free', desc: '1,000 calls/mo', highlight: false },
            { name: 'Growth', price: '$49/mo', desc: '50,000 calls/mo', highlight: true },
            { name: 'Enterprise', price: 'Custom', desc: 'Unlimited', highlight: false },
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

      {/* ═══════════════════ CTA ════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>
            Ready to go global?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 36, fontSize: 17, lineHeight: 1.7 }}>
            Join sellers who use POTAL to show transparent pricing
            to customers in 139 countries.
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

      {/* Footer */}
      <footer style={{
        background: '#02122c',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 20px',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>
              <span style={{ color: 'white' }}>P</span>
              <span style={{ color: '#F59E0B' }}>O</span>
              <span style={{ color: 'white' }}>TAL</span>
            </span>
            <span style={{ marginLeft: 16 }}>&copy; 2026 POTAL Inc.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/developers" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Developers</Link>
            <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
