'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { FEATURES, CATEGORIES, CATEGORY_ICONS, type FeatureCategory } from '../features/features-data';
import { useI18n } from '@/app/i18n';
import type { TranslationKey } from '@/app/i18n/translations/en';

function EnterpriseInquiryForm({ t }: { t: (key: TranslationKey) => string }) {
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
        <p className="text-lg font-bold text-emerald-600 mb-2">{t('pricing.enterprise.thankYou')}</p>
        <p className="text-sm text-slate-500">{t('pricing.enterprise.thankYouSub')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="text" name="company_name" placeholder={t('pricing.enterprise.formCompany')} required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <input type="text" name="contact_name" placeholder={t('pricing.enterprise.formName')} required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <input type="email" name="contact_email" placeholder={t('pricing.enterprise.formEmail')} required
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors" />
      <textarea name="requirements" placeholder={t('pricing.enterprise.formNeeds')} rows={3}
        className="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#F59E0B] transition-colors resize-none" />
      <button type="submit" disabled={status === 'submitting'}
        className="px-6 py-3 rounded-xl bg-[#02122c] text-white font-bold text-sm hover:bg-[#0a2540] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1">
        {status === 'submitting' ? t('pricing.enterprise.sending') : t('pricing.enterprise.contactSales')}
      </button>
      {status === 'error' && <p className="text-xs text-red-500">{errorMsg}</p>}
    </form>
  );
}

export default function PricingPage() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const featuresByCategory = CATEGORIES.filter(c => c.key !== 'All').map(cat => ({
    ...cat,
    icon: CATEGORY_ICONS[cat.key as FeatureCategory],
    features: FEATURES.filter(f => f.category === cat.key),
  }));

  const COMPETITOR_DATA = [
    { label: t('pricing.comparison.activeFeatures'), potal: '140', avalara: '44', zonos: '38', simply: '22' },
    { label: t('pricing.comparison.countries'), potal: '240', avalara: '100+', zonos: '200+', simply: '180+' },
    { label: t('pricing.comparison.hsAccuracy'), potal: '100%', avalara: '~85%', zonos: '~80%', simply: '~75%' },
    { label: t('pricing.comparison.startingPrice'), potal: t('pricing.comparison.freeForever'), avalara: '$1,500/mo', zonos: '$4,000/mo', simply: '$99/mo' },
    { label: t('pricing.comparison.perTransaction'), potal: t('pricing.comparison.none'), avalara: t('pricing.comparison.yes'), zonos: t('pricing.comparison.yes'), simply: t('pricing.comparison.yes') },
    { label: t('pricing.comparison.responseTime'), potal: '<50ms', avalara: '200-500ms', zonos: '300-800ms', simply: '500ms+' },
    { label: t('pricing.comparison.apiEndpoints'), potal: '155+', avalara: '~30', zonos: '~20', simply: '~10' },
    { label: t('pricing.comparison.mcp'), potal: t('pricing.comparison.yes'), avalara: t('pricing.comparison.no'), zonos: t('pricing.comparison.no'), simply: t('pricing.comparison.no') },
  ];

  const FAQS: { q: string; a: string }[] = [
    { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
    { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
    { q: t('pricing.faq.q3'), a: t('pricing.faq.a3') },
    { q: t('pricing.faq.q4'), a: t('pricing.faq.a4') },
    { q: t('pricing.faq.q5'), a: t('pricing.faq.a5') },
    { q: t('pricing.faq.q6'), a: t('pricing.faq.a6') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#02122c] text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-block bg-emerald-500/15 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
            {t('pricing.badge.noCreditCard')}
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
            {t('pricing.hero.title')}{' '}
            <span className="text-[#F59E0B]">{t('pricing.hero.titleHighlight')}</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            {t('pricing.hero.subtitle')}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10">
            {[
              { value: '140', label: t('pricing.stats.features') },
              { value: '240', label: t('pricing.stats.countries') },
              { value: '155+', label: t('pricing.stats.apiEndpoints') },
              { value: '$0', label: t('pricing.stats.forever') },
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
              {t('pricing.hero.getStarted')}
            </Link>
            <Link href="/developers"
              className="px-8 py-3.5 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              {t('pricing.hero.apiDocs')}
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
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#02122c]">{t('pricing.plan.title')}</h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                  {t('pricing.plan.badge')}
                </span>
              </div>
              <p className="text-slate-500 text-sm">{t('pricing.plan.description')}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#02122c]">$0</div>
              <div className="text-sm text-slate-400">{t('pricing.plan.priceLabel')}</div>
            </div>
          </div>

          {/* Key highlights grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '⚡', label: t('pricing.plan.highlight.features'), sub: t('pricing.plan.highlight.featuresSub') },
              { icon: '🌍', label: t('pricing.plan.highlight.countries'), sub: t('pricing.plan.highlight.countriesSub') },
              { icon: '🔗', label: t('pricing.plan.highlight.endpoints'), sub: t('pricing.plan.highlight.endpointsSub') },
              { icon: '🎯', label: t('pricing.plan.highlight.accuracy'), sub: t('pricing.plan.highlight.accuracySub') },
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
            {t('pricing.plan.createAccount')}
          </Link>
        </div>
      </section>

      {/* Feature List by Category */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
          {t('pricing.allFeatures.title').replace('{count}', String(FEATURES.length))}
        </h2>
        <p className="text-center text-slate-500 mb-10 text-sm">
          {t('pricing.allFeatures.subtitle')}
        </p>

        <div className="space-y-6">
          {featuresByCategory.slice(0, showAllFeatures ? undefined : 4).map((cat) => (
            <div key={cat.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <h3 className="font-bold text-sm text-[#02122c]">{cat.label}</h3>
                <span className="text-[10px] font-bold text-slate-400 ml-auto">
                  {t('pricing.allFeatures.count').replace('{count}', String(cat.count))}
                </span>
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
              {t('pricing.allFeatures.showAll').replace('{count}', String(featuresByCategory.length))}
            </button>
          </div>
        )}
      </section>

      {/* Competitor Comparison */}
      <section className="bg-white border-t border-b border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
            {t('pricing.comparison.title')}
          </h2>
          <p className="text-center text-slate-500 mb-10 text-sm">
            {t('pricing.comparison.subtitle')}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 text-xs uppercase">&nbsp;</th>
                  <th className="text-center py-3 px-4 font-extrabold text-[#02122c]">
                    POTAL
                    <div className="text-[10px] font-bold text-emerald-500 mt-0.5">{t('pricing.comparison.free')}</div>
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
              {t('pricing.enterprise.title')}
            </h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              {t('pricing.enterprise.description')}
            </p>
            <div className="space-y-3">
              {([
                'pricing.enterprise.feature1',
                'pricing.enterprise.feature2',
                'pricing.enterprise.feature3',
                'pricing.enterprise.feature4',
                'pricing.enterprise.feature5',
                'pricing.enterprise.feature6',
              ] as const).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[#F59E0B] text-sm flex-shrink-0">★</span>
                  <span className="text-sm text-slate-600">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#02122c] mb-1">{t('pricing.enterprise.contactSales')}</h3>
            <p className="text-xs text-slate-400 mb-5">{t('pricing.enterprise.responseTime')}</p>
            <EnterpriseInquiryForm t={t} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">
            {t('pricing.faq.title')}
          </h2>
          <p className="text-center text-slate-500 mb-10 text-sm">
            {t('pricing.faq.subtitle')}
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
            {t('pricing.cta.title')}
          </h2>
          <p className="text-slate-400 mb-8">
            {t('pricing.cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup"
              className="px-8 py-3 bg-[#F59E0B] text-[#02122c] font-bold rounded-full hover:bg-[#e8930a] transition-colors text-sm">
              {t('pricing.cta.createAccount')}
            </Link>
            <Link href="/features"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              {t('pricing.cta.seeFeatures')}
            </Link>
            <Link href="/developers"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm">
              {t('pricing.cta.apiDocs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
