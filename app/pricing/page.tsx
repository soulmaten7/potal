'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { FEATURES, CATEGORIES, CATEGORY_ICONS, type FeatureCategory } from '../features/features-data';

const COMPETITOR_DATA = [
  { label: 'Active Features', potal: '140', avalara: '44', zonos: '38', simply: '22' },
  { label: 'Countries', potal: '240', avalara: '100+', zonos: '200+', simply: '180+' },
  { label: 'HS Code Accuracy', potal: '100%', avalara: '~85%', zonos: '~80%', simply: '~75%' },
  { label: 'Starting Price', potal: 'Free forever', avalara: '$1,500/mo', zonos: '$4,000/mo', simply: '$99/mo' },
  { label: 'Per-Transaction Fee', potal: 'None', avalara: 'Yes', zonos: 'Yes', simply: 'Yes' },
  { label: 'API Response Time', potal: '<50ms', avalara: '200-500ms', zonos: '300-800ms', simply: '500ms+' },
  { label: 'API Endpoints', potal: '155+', avalara: '~30', zonos: '~20', simply: '~10' },
  { label: 'MCP Server', potal: 'Yes', avalara: 'No', zonos: 'No', simply: 'No' },
];

const FAQS = [
  {
    q: 'Why is everything free?',
    a: 'POTAL\'s mission is to make cross-border commerce accessible to every business, regardless of size. We believe duty & tax calculation should be infrastructure — like GPS — not a premium service. Our architecture runs on code, not AI calls, so our marginal cost per request is near zero.',
  },
  {
    q: 'Will it stay free forever?',
    a: 'Yes. "Forever Free" is a commitment, not a trial. All 140 features, all 240 countries, all API endpoints — permanently free. We will never retroactively gate features behind a paywall.',
  },
  {
    q: 'What about Enterprise?',
    a: 'Enterprise is for organizations that need custom integrations, dedicated infrastructure, SLA guarantees, or white-label solutions. Contact us and we\'ll build a tailored package. For everyone else, the free plan has everything.',
  },
  {
    q: 'Is there a catch? Rate limits?',
    a: 'We apply a generous rate limit (100,000 calls/month) to prevent abuse. For 99.9% of businesses, this is more than enough. If you need higher volume, reach out via the Enterprise form.',
  },
  {
    q: 'How is this different from Avalara or Zonos?',
    a: 'Avalara charges $1,500+/month. Zonos charges $4,000+/month. Both charge per-transaction fees on top. POTAL offers more features (140 vs their 22-44), better accuracy (100% with complete input), and faster response times (<50ms) — all for free.',
  },
  {
    q: 'Do you support all countries?',
    a: 'Yes — 240 countries with duty rates, VAT/GST, de minimis thresholds, FTA detection, anti-dumping duties, and sanctions screening. 12 countries have sub-national tax calculations.',
  },
];

function EnterpriseInquiryForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      company_name: (form.elements.namedItem('company_name') as HTMLInputElement).value,
      contact_name: (form.elements.namedItem('contact_name') as HTMLInputElement).value,
      contact_email: (form.elements.namedItem('contact_email') as HTMLInputElement).value,
      estimated_volume: (form.elements.namedItem('requirements') as HTMLTextAreaElement).value,
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
      <div className="text-center py-6">
        <p className="text-lg font-bold text-emerald-600 mb-2">Thank you!</p>
        <p className="text-sm text-slate-500">We&apos;ll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="text" name="company_name" placeholder="Company name" required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <input type="text" name="contact_name" placeholder="Your name" required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <input type="email" name="contact_email" placeholder="Work email" required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <textarea name="requirements" placeholder="Tell us about your needs (volume, integrations, timeline...)" rows={3}
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors resize-none" />
      <button type="submit" disabled={status === 'submitting'}
        className="px-6 py-3 rounded-xl bg-[#02122c] text-white font-bold text-sm hover:bg-[#0a2540] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1">
        {status === 'submitting' ? 'Sending...' : 'Contact Sales'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500">{errorMsg}</p>}
    </form>
  );
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Group features by category for the feature list
  const featuresByCategory = CATEGORIES.filter(c => c.key !== 'All').map(cat => ({
    ...cat,
    icon: CATEGORY_ICONS[cat.key as FeatureCategory],
    features: FEATURES.filter(f => f.category === cat.key),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#02122c] text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block bg-emerald-500/15 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
            No credit card required
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
            Everything Free.{' '}
            <span className="text-[#F59E0B]">Forever.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            140 features. 240 countries. 155+ API endpoints. Zero cost.
            What competitors charge $1,500–$4,000/month for, POTAL gives you for free.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
            {[
              { value: '140', label: 'Features' },
              { value: '240', label: 'Countries' },
              { value: '155+', label: 'API Endpoints' },
              { value: '$0', label: 'Forever' },
            ].map((stat) => (
              <div key={stat.label} className="text-center min-w-[70px]">
                <div className="text-2xl sm:text-4xl font-extrabold text-[#F59E0B]">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup"
              className="px-8 py-3.5 bg-[#F59E0B] text-[#02122c] font-bold rounded-full hover:bg-[#e8930a] transition-colors text-sm">
              Get Started Free
            </Link>
            <Link href="/developers"
              className="px-8 py-3.5 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Single Plan Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#02122c]">Forever Free</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                  All Features Included
                </span>
              </div>
              <p className="text-slate-500 text-sm">Every feature, every country, every API endpoint — no limits, no catches.</p>
            </div>
            <div className="text-right">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#02122c]">$0</div>
              <div className="text-sm text-slate-400">forever</div>
            </div>
          </div>

          {/* Key highlights grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '⚡', label: '140 Features', sub: 'All active' },
              { icon: '🌍', label: '240 Countries', sub: 'Full coverage' },
              { icon: '🔗', label: '155+ Endpoints', sub: 'Full API access' },
              { icon: '🎯', label: '100% Accuracy', sub: '9-field HS Code' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-sm font-bold text-[#02122c]">{item.label}</div>
                <div className="text-[10px] text-slate-400">{item.sub}</div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup"
            className="block text-center w-full py-3.5 bg-[#02122c] text-white font-bold rounded-xl hover:bg-[#0a2540] transition-colors text-sm">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Feature List by Category */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
          All {FEATURES.length} Features Included
        </h2>
        <p className="text-center text-slate-500 mb-10 text-sm">
          Every feature below is free. No tiers, no gates, no upgrade prompts.
        </p>

        <div className="space-y-6">
          {featuresByCategory.slice(0, showAllFeatures ? undefined : 4).map((cat) => (
            <div key={cat.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <h3 className="font-bold text-sm text-[#02122c]">{cat.label}</h3>
                <span className="text-[10px] font-bold text-slate-400 ml-auto">{cat.count} features</span>
              </div>
              <div className="px-5 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {cat.features.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 py-1">
                      <span className="text-emerald-500 text-xs mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-sm text-slate-600">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showAllFeatures && featuresByCategory.length > 4 && (
          <div className="text-center mt-6">
            <button onClick={() => setShowAllFeatures(true)}
              className="text-sm font-bold text-[#F59E0B] hover:text-[#d97706] cursor-pointer transition-colors">
              Show all {featuresByCategory.length} categories →
            </button>
          </div>
        )}
      </section>

      {/* Competitor Comparison */}
      <section className="bg-white border-t border-b border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
            Why Pay $1,500+/month?
          </h2>
          <p className="text-center text-slate-500 mb-10 text-sm">
            POTAL delivers more features, better accuracy, and faster performance — for free.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 text-xs uppercase">&nbsp;</th>
                  <th className="text-center py-3 px-4 font-extrabold text-[#02122c]">
                    POTAL
                    <div className="text-[10px] font-bold text-emerald-500 mt-0.5">FREE</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">Avalara</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">Zonos</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">SimplyDuty</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_DATA.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-600">{row.label}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#02122c]">{row.potal}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.avalara}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.zonos}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.simply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section id="enterprise" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#02122c] mb-4">
              Need Custom Integration?
            </h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              For organizations that need dedicated infrastructure, custom SLAs,
              white-label solutions, or tailored integrations — let&apos;s talk.
            </p>
            <div className="space-y-3">
              {[
                'Dedicated infrastructure & SLA guarantee',
                'White-label widget (no POTAL branding)',
                'SSO & team management',
                'Custom integrations & bulk APIs',
                'Dedicated account manager',
                'Priority support (24/7)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-[#F59E0B] text-sm flex-shrink-0">★</span>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#02122c] mb-1">Contact Sales</h3>
            <p className="text-xs text-slate-400 mb-5">We respond within 24 hours on business days.</p>
            <EnterpriseInquiryForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-slate-500 mb-10 text-sm">
            Everything you need to know about POTAL pricing
          </p>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full text-left px-5 py-4 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm font-bold text-[#02122c]">{faq.q}</span>
                  <span className="text-slate-400 text-lg ml-4 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#02122c] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Stop paying for duty calculation.
          </h2>
          <p className="text-slate-400 mb-8">
            140 features. 240 countries. Free forever. Get started in 30 seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup"
              className="px-8 py-3 bg-[#F59E0B] text-[#02122c] font-bold rounded-full hover:bg-[#e8930a] transition-colors text-sm">
              Create Free Account
            </Link>
            <Link href="/features"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              See All Features
            </Link>
            <Link href="/developers"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              API Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
