'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FEATURES, CATEGORIES, CATEGORY_ICONS, type FeatureCategory } from './features-data';
import { useI18n } from '@/app/i18n';

export default function FeaturesPage() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'All'>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FEATURES.filter(f => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      if (q) {
        const matchName = f.name.toLowerCase().includes(q);
        const matchDesc = f.description.toLowerCase().includes(q);
        const matchCat = f.category.toLowerCase().includes(q);
        const matchSlug = f.slug.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchSlug) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#02122c] text-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {t('features.hero.title').replace('{count}', String(FEATURES.length))}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            {t('features.hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { value: FEATURES.length, label: t('features.stats.activeFeatures') },
              { value: '240', label: t('features.stats.countries') },
              { value: '155+', label: t('features.stats.apiEndpoints') },
              { value: '$0', label: t('features.stats.toStart') },
            ].map((stat) => (
              <div key={stat.label} className="text-center min-w-[80px]">
                <div className="text-2xl sm:text-4xl font-extrabold text-[#F59E0B]">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[64px] sm:top-[80px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          {/* Search box */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('features.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none transition-colors placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-[#02122c] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
          <div className="flex mt-2">
            <span className="ml-auto text-xs text-slate-400 self-center">
              {t('features.search.count').replace('{count}', String(filtered.length))}
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((feature) => {
            const icon = CATEGORY_ICONS[feature.category];
            const isHovered = hoveredId === feature.id;

            return (
              <Link
                key={feature.id}
                href={`/features/${feature.slug}`}
                onMouseEnter={() => setHoveredId(feature.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 transition-all duration-200 hover:border-[#F59E0B] hover:shadow-md block"
              >
                {/* Top row: icon + badges */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  <div className="flex items-center gap-1.5">
                    {feature.priority === 'MUST' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">MUST</span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">{t('features.badge.active')}</span>
                  </div>
                </div>

                {/* Feature name */}
                <h3 className="text-sm font-bold mb-1 text-[#02122c]">
                  {feature.name}
                </h3>

                {/* Description */}
                <p className="text-xs leading-relaxed text-slate-500">
                  {feature.description}
                </p>

                {/* API badge + View Guide */}
                <div className="flex items-center justify-between mt-3">
                  {feature.apiEndpoint ? (
                    <div className={`text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
                      {feature.apiEndpoint}
                    </div>
                  ) : <div />}
                  <span className={`text-[11px] font-bold text-[#F59E0B] transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {t('features.viewGuide')} &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-semibold">{t('features.noResults')}</p>
            <button onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }} className="mt-2 text-sm text-[#F59E0B] font-bold cursor-pointer">
              {t('features.resetFilters')}
            </button>
          </div>
        )}
      </section>

      {/* Competitor Comparison */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">{t('features.comparison.title')}</h2>
          <p className="text-center text-slate-500 mb-10">{t('features.comparison.subtitle')}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 text-xs uppercase">&nbsp;</th>
                  <th className="text-center py-3 px-4 font-extrabold text-[#02122c]">POTAL</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">Avalara</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">Zonos</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500">SimplyDuty</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: t('features.comparison.activeFeatures'), potal: '140', avalara: '44', zonos: '38', simply: '22' },
                  { label: t('features.comparison.countries'), potal: '240', avalara: '100+', zonos: '200+', simply: '180+' },
                  { label: t('features.comparison.hsAccuracy'), potal: '100%', avalara: '~85%', zonos: '~80%', simply: '~75%' },
                  { label: t('features.comparison.startingPrice'), potal: '$0/mo', avalara: '$1,500/mo', zonos: '$4,000/mo', simply: '$99/mo' },
                  { label: t('features.comparison.perTransaction'), potal: t('features.comparison.none'), avalara: t('features.comparison.yes'), zonos: t('features.comparison.yes'), simply: t('features.comparison.yes') },
                  { label: t('features.comparison.aiCalls'), potal: '0', avalara: t('features.comparison.everyRequest'), zonos: t('features.comparison.everyRequest'), simply: t('features.comparison.mostRequests') },
                  { label: t('features.comparison.responseTime'), potal: '<50ms', avalara: '200-500ms', zonos: '300-800ms', simply: '500ms+' },
                  { label: t('features.comparison.mcp'), potal: t('features.comparison.yes'), avalara: t('features.comparison.no'), zonos: t('features.comparison.no'), simply: t('features.comparison.no') },
                ].map((row) => (
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

      {/* CTA */}
      <section className="bg-[#02122c] py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            {t('features.cta.title').replace('{count}', String(FEATURES.length))}
          </h2>
          <p className="text-slate-400 mb-8">{t('features.cta.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-[#F59E0B] text-[#02122c] font-bold rounded-full hover:bg-[#e8930a] transition-colors text-sm"
            >
              {t('features.cta.getStarted')}
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm"
            >
              {t('features.cta.viewPricing')}
            </Link>
            <Link
              href="/developers"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm"
            >
              {t('features.cta.apiDocs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
