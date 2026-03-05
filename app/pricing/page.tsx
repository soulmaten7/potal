'use client';

import Link from 'next/link';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    description: 'Try POTAL with basic features',
    highlight: false,
    features: [
      '500 API calls / month',
      'Widget embed (light theme)',
      '180+ countries supported',
      'AI-powered HS Code classification',
      'Community support',
    ],
    limitations: [
      'POTAL branding on widget',
      'Standard rate limits',
    ],
    cta: 'Get Started Free',
    ctaLink: '/developers',
  },
  {
    name: 'Starter',
    price: '$9',
    priceNote: '/ month',
    description: 'For small stores getting started',
    highlight: false,
    features: [
      '5,000 API calls / month',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      'Real-time exchange rates',
      'Sub-national tax (US/CA/BR)',
      'Email support',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaLink: '/developers',
  },
  {
    name: 'Growth',
    price: '$29',
    priceNote: '/ month',
    description: 'For growing e-commerce businesses',
    highlight: true,
    features: [
      '25,000 API calls / month',
      'Custom widget branding',
      'FTA & preferential rate detection',
      'Batch API (100 items)',
      'Priority email support',
      'Advanced analytics dashboard',
      'Webhook notifications',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaLink: '/developers',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'contact us',
    description: 'For large-scale operations',
    highlight: false,
    features: [
      'Unlimited API calls',
      'Dedicated infrastructure',
      '180+ countries + custom rules',
      'All sub-national tax engines',
      'Custom HS Code models',
      'White-label widget',
      'SSO & team management',
      'Dedicated account manager',
      'SLA guarantee (99.99%)',
      'Custom integrations',
      'Bulk calculation API',
      'Audit logs & compliance',
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
];

const FAQS = [
  {
    q: 'What counts as an API call?',
    a: 'Each request to /api/v1/calculate counts as one API call. Widget renders that trigger a calculation also count. Country list and metadata endpoints are free and unlimited.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes! You can upgrade or downgrade at any time. When upgrading, you get immediate access to the new plan. When downgrading, changes take effect at the next billing cycle.',
  },
  {
    q: 'What happens if I exceed my monthly limit?',
    a: 'On the Starter plan, API calls will return a 429 rate limit error. On the Growth plan, overage is billed at $0.002 per additional call. Enterprise plans have no limits.',
  },
  {
    q: 'Do you support all countries?',
    a: 'Yes — POTAL supports 139 countries with accurate duty rates, VAT/GST, de minimis thresholds, and FTA detection. The US, Canada, and Brazil also have state/province-level tax calculations.',
  },
  {
    q: 'Is there a free trial for Growth?',
    a: 'Yes! Growth comes with a 14-day free trial with full access to all features. No credit card required to start.',
  },
  {
    q: 'Can I use the widget on multiple domains?',
    a: 'Starter allows one domain. Growth supports up to 10 domains. Enterprise has unlimited domains with per-domain analytics.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.price === 'Free' || plan.price === 'Custom') return plan.price;
    const monthly = parseInt(plan.price.replace('$', ''));
    if (billingCycle === 'annual') {
      return `$${Math.round(monthly * 0.8)}`;
    }
    return plan.price;
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#fafafa',
      minHeight: '100vh',
      color: '#1a1a1a',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 50%, #1a365d 100%)',
        color: 'white',
        padding: '80px 20px 60px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(245,158,11,0.15)',
            color: '#F59E0B',
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            Simple, transparent pricing
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            Pay only for what you use
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 32px' }}>
            Start free, scale as you grow. All plans include 139-country coverage
            with real-time duty, tax, and shipping calculations.
          </p>

          {/* Billing Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 4,
          }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                background: billingCycle === 'monthly' ? 'white' : 'transparent',
                color: billingCycle === 'monthly' ? '#02122c' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                background: billingCycle === 'annual' ? 'white' : 'transparent',
                color: billingCycle === 'annual' ? '#02122c' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
              }}
            >
              Annual
              <span style={{
                marginLeft: 8,
                background: '#10b981',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: 1100,
        margin: '-40px auto 0',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
      }}>
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              border: plan.highlight ? '2px solid #F59E0B' : '1px solid #e5e7eb',
              boxShadow: plan.highlight
                ? '0 20px 40px rgba(245,158,11,0.15)'
                : '0 1px 3px rgba(0,0,0,0.08)',
              position: 'relative',
              transform: plan.highlight ? 'scale(1.03)' : 'none',
            }}
          >
            {plan.highlight && (
              <div style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#F59E0B',
                color: '#02122c',
                padding: '4px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}>
                MOST POPULAR
              </div>
            )}

            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>{plan.description}</p>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 42, fontWeight: 800 }}>{getPrice(plan)}</span>
              <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>
                {plan.price === 'Free' || plan.price === 'Custom'
                  ? plan.priceNote
                  : billingCycle === 'annual' ? '/ month (billed annually)' : plan.priceNote}
              </span>
            </div>

            <Link
              href={plan.ctaLink}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '14px 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                background: plan.highlight
                  ? 'linear-gradient(135deg, #F59E0B 0%, #d97706 100%)'
                  : '#02122c',
                color: 'white',
                marginBottom: 28,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {plan.cta}
            </Link>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                What&apos;s included
              </div>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: '#10b981', fontSize: 16, lineHeight: '20px', flexShrink: 0 }}>&#10003;</span>
                  <span style={{ fontSize: 14, color: '#444', lineHeight: '20px' }}>{f}</span>
                </div>
              ))}
              {plan.limitations.length > 0 && (
                <>
                  <div style={{ height: 12 }} />
                  {plan.limitations.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <span style={{ color: '#ccc', fontSize: 16, lineHeight: '20px', flexShrink: 0 }}>&#8212;</span>
                      <span style={{ fontSize: 14, color: '#999', lineHeight: '20px' }}>{l}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div style={{ maxWidth: 1100, margin: '60px auto', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Compare Plans
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 40, fontSize: 15 }}>
          Detailed feature comparison across all plans
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '16px 20px', fontWeight: 600, color: '#666', width: '28%' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%' }}>Free</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%' }}>Starter</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%', color: '#F59E0B' }}>Growth</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['API Calls / Month', '500', '5,000', '25,000', 'Unlimited'],
                ['Countries Supported', '180+', '180+', '180+', '180+ + Custom'],
                ['HS Code Precision', '6-digit', '10-digit', '10-digit', '10-digit'],
                ['AI HS Classification', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['Real-time FX Rates', '&#10007;', '&#10003;', '&#10003;', '&#10003;'],
                ['FTA Detection', '&#10007;', '&#10003;', '&#10003;', '&#10003;'],
                ['Widget Embed', 'Light only', 'All themes', 'Custom brand', 'White-label'],
                ['Batch API', '&#10007;', '&#10007;', '100 items', 'Unlimited'],
                ['Analytics', 'Basic', 'Basic', 'Advanced', 'Full + Export'],
                ['Support', 'Community', 'Email', 'Priority', 'Dedicated'],
                ['SLA', '&#8212;', '&#8212;', '99.9%', '99.99%'],
              ].map(([feature, free, starter, growth, enterprise], i) => (
                <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 20px', color: '#444' }}>{feature}</td>
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#888' }}
                    dangerouslySetInnerHTML={{ __html: free }}
                  />
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#666' }}
                    dangerouslySetInnerHTML={{ __html: starter }}
                  />
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#444', fontWeight: 500 }}
                    dangerouslySetInnerHTML={{ __html: growth }}
                  />
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#444' }}
                    dangerouslySetInnerHTML={{ __html: enterprise }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: 700, margin: '60px auto 80px', padding: '0 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Frequently Asked Questions
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 40, fontSize: 15 }}>
          Everything you need to know about POTAL pricing
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '18px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                {faq.q}
                <span style={{
                  fontSize: 20,
                  color: '#999',
                  transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div style={{
                  padding: '0 20px 18px',
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 1.7,
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: '#02122c',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 16 }}>
            Ready to go global?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 32, fontSize: 16 }}>
            Start calculating total landed costs for your customers in minutes.
            No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link
              href="/developers"
              style={{
                padding: '14px 32px',
                borderRadius: 12,
                background: '#F59E0B',
                color: '#02122c',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Get API Key
            </Link>
            <Link
              href="/developers/playground"
              style={{
                padding: '14px 32px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Try Playground
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
