'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    priceAnnualMonthly: '$0',
    priceAnnualTotal: '$0',
    annualSavings: '',
    priceNote: 'forever',
    description: 'Full features, limited volume',
    highlight: false,
    overageNote: 'Hard stop at 200 calls',
    features: [
      '200 API calls / month',
      'Widget embed (light theme)',
      '240 countries supported',
      '10-digit HS Code precision',
      'AI-powered HS Code classification',
      'Real-time exchange rates',
      'FTA & preferential rate detection',
      'Anti-dumping / CVD duty alerts',
      'Sub-national tax (12 countries)',
      'Batch API (50 items)',
      'Webhook notifications',
      'Basic analytics dashboard',
      '30+ language support',
      'Community support',
    ],
    limitations: [
      'POTAL branding on widget',
      'Standard rate limits (30/min)',
    ],
    cta: 'Get Started Free',
    ctaLink: '/developers',
  },
  {
    name: 'Basic',
    price: '$20',
    priceAnnualMonthly: '$16',
    priceAnnualTotal: '$192',
    annualSavings: 'Save $48/yr',
    priceNote: '/ month',
    description: 'For growing stores with real traffic',
    highlight: false,
    overageNote: 'Overage: $0.015 / call',
    features: [
      '2,000 API calls / month',
      'Widget embed (all themes)',
      '10-digit HS Code precision',
      'Real-time exchange rates',
      'FTA & preferential rate detection',
      'Anti-dumping / CVD duty alerts',
      'Sub-national tax (12 countries)',
      'Batch API (100 items)',
      'Webhook notifications',
      'Advanced analytics dashboard',
      '30+ language support',
      'Email support',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaLink: '/developers',
  },
  {
    name: 'Pro',
    price: '$80',
    priceAnnualMonthly: '$64',
    priceAnnualTotal: '$768',
    annualSavings: 'Save $192/yr',
    priceNote: '/ month',
    description: 'For serious e-commerce operations',
    highlight: true,
    overageNote: 'Overage: $0.012 / call',
    features: [
      '10,000 API calls / month',
      'Custom widget branding (no POTAL logo)',
      'Batch API (500 items)',
      'Webhook notifications',
      'Advanced analytics dashboard',
      'Priority email support',
      'All Basic features included',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    ctaLink: '/developers',
  },
  {
    name: 'Enterprise',
    price: '$300',
    priceAnnualMonthly: '$240',
    priceAnnualTotal: '$2,880',
    annualSavings: 'Save $720/yr',
    priceNote: '/ month',
    description: 'For large-scale operations',
    highlight: false,
    overageNote: 'Overage: $0.01 / call (100K+ commit: $0.008)',
    features: [
      '50,000+ API calls / month',
      'White-label widget',
      'Dedicated infrastructure',
      'SSO & team management',
      'SLA guarantee (99.99%)',
      'Custom integrations',
      'Bulk calculation API',
      'Dedicated account manager',
      'Audit logs & compliance',
      'All Pro features included',
    ],
    limitations: [],
    cta: 'Get Custom Pricing',
    ctaLink: '#enterprise-form',
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
    a: 'For paid plans (Basic, Pro, Enterprise), overage calls are automatically billed at a per-call rate: Basic $0.015, Pro $0.012, Enterprise $0.01 per call. Enterprise customers with 100K+ volume commitments get $0.008 per call. For the Free plan, API calls stop at the 200-call limit.',
  },
  {
    q: 'Do you support all countries?',
    a: 'Yes — POTAL supports 240 countries with accurate duty rates, VAT/GST, de minimis thresholds, and FTA detection. 12 countries have sub-national tax calculations including US, Canada, Brazil, India, Australia, and more.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes! All paid plans come with a 14-day free trial with full access to all features. A payment method is required at signup, but you won\'t be charged until the trial ends. Cancel anytime before — no charge.',
  },
  {
    q: 'What makes POTAL different from competitors?',
    a: 'POTAL covers 240 countries with AI-powered HS classification, real-time FTA detection, anti-dumping duty alerts, and 30+ language support — all at a fraction of competitors\' pricing. Our Basic plan at $20/month includes features that competitors charge $500+/month for.',
  },
];

const inputStyle = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  outline: 'none' as const,
  width: '100%',
  boxSizing: 'border-box' as const,
};

function formatNumberWithCommas(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString() : '';
}

function EnterpriseInquiryForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [volumeDisplay, setVolumeDisplay] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      company_name: (form.elements.namedItem('company_name') as HTMLInputElement).value,
      contact_name: (form.elements.namedItem('contact_name') as HTMLInputElement).value,
      contact_email: (form.elements.namedItem('contact_email') as HTMLInputElement).value,
      estimated_volume: volumeDisplay.replace(/,/g, ''),
    };

    try {
      const res = await fetch('/api/v1/enterprise-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginBottom: 8 }}>
          Thank you for your interest!
        </p>
        <p style={{ fontSize: 14, color: '#666' }}>
          We&apos;ve sent our capability overview and requirements questionnaire to your email.
          Please check your inbox.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="text" name="company_name" placeholder="Company name" required style={inputStyle} />
        <input type="text" name="contact_name" placeholder="Your name" required style={inputStyle} />
        <input type="email" name="contact_email" placeholder="Work email" required style={inputStyle} />
        <input
          type="text"
          name="estimated_volume"
          placeholder="Estimated monthly API calls (e.g. 100,000)"
          required
          style={inputStyle}
          value={volumeDisplay}
          onChange={(e) => setVolumeDisplay(formatNumberWithCommas(e.target.value))}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: status === 'submitting' ? '#6b7280' : '#02122c',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            marginTop: 4,
          }}
        >
          {status === 'submitting' ? 'Submitting...' : 'Get Custom Pricing'}
        </button>
      </form>
      {status === 'error' && (
        <p style={{ fontSize: 13, color: '#dc2626', marginTop: 8 }}>{errorMsg}</p>
      )}
      <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
        We respond within 24 hours on business days.
      </p>
    </>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.price === '$0') return plan.price;
    if (billingCycle === 'annual') return plan.priceAnnualMonthly;
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
            Start free, scale as you grow. All plans include 240-country coverage
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

            <div style={{ marginBottom: 24, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#888', verticalAlign: 'top', lineHeight: '1.6' }}>$</span>
              <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em' }}>{getPrice(plan).replace('$', '')}</span>
              <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>
                {plan.price === '$0'
                  ? plan.priceNote
                  : billingCycle === 'annual' ? '/mo (billed annually)' : plan.priceNote}
              </span>
              {plan.price !== '$0' && plan.annualSavings && billingCycle === 'monthly' && (
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    background: 'rgba(16,185,129,0.12)',
                    color: '#059669',
                    padding: '3px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {plan.annualSavings} with annual billing
                  </span>
                </div>
              )}
              {billingCycle === 'annual' && plan.price !== '$0' && (
                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  {plan.priceAnnualTotal} / year
                  {plan.annualSavings && (
                    <span style={{
                      marginLeft: 8,
                      background: 'rgba(16,185,129,0.12)',
                      color: '#059669',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {plan.annualSavings}
                    </span>
                  )}
                </div>
              )}
              {plan.overageNote && plan.price !== '$0' && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                  {plan.overageNote}
                </div>
              )}
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
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%' }}>Basic</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%', color: '#F59E0B' }}>Pro</th>
                <th style={{ textAlign: 'center', padding: '16px 12px', fontWeight: 700, width: '18%' }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['API Calls / Month', '200', '2,000', '10,000', '50,000+'],
                ['Countries Supported', '240', '240', '240', '240 + Custom'],
                ['HS Code Precision', '10-digit', '10-digit', '10-digit', '10-digit'],
                ['AI HS Classification', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['Real-time FX Rates', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['FTA Detection', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['Anti-dumping / CVD Alerts', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['Sub-national Tax', '12 countries', '12 countries', '12 countries', '12 + Custom'],
                ['Widget Branding', 'POTAL logo', 'POTAL logo', 'Custom brand', 'White-label'],
                ['Languages', '30+', '30+', '30+', '30+ + Custom'],
                ['Batch API', '50 items', '100 items', '500 items', '5,000 items'],
                ['Webhook Notifications', '&#10003;', '&#10003;', '&#10003;', '&#10003;'],
                ['Analytics Dashboard', 'Basic', 'Advanced', 'Advanced', 'Full + Export'],
                ['Support', 'Community', 'Email', 'Priority', 'Dedicated'],
                ['SLA', '&#8212;', '&#8212;', '99.9%', '99.99%'],
                ['Rate Limit', '30/min', '60/min', '120/min', 'Unlimited'],
              ].map(([feature, free, basic, pro, enterprise], i) => (
                <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '14px 20px', color: '#444' }}>{feature}</td>
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#888' }}
                    dangerouslySetInnerHTML={{ __html: free }}
                  />
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#666' }}
                    dangerouslySetInnerHTML={{ __html: basic }}
                  />
                  <td
                    style={{ textAlign: 'center', padding: '14px 12px', color: '#444', fontWeight: 500 }}
                    dangerouslySetInnerHTML={{ __html: pro }}
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

      {/* Enterprise Contact Form */}
      <div id="enterprise-form" style={{
        maxWidth: 600,
        margin: '60px auto',
        padding: '0 20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: 40,
          border: '2px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Enterprise Inquiry
          </h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            Need 50,000+ API calls? Get custom pricing with a dedicated account manager.
          </p>
          <EnterpriseInquiryForm />
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
              Calculate Duties Free
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
