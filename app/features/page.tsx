'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FEATURES, CATEGORIES, CATEGORY_ICONS, type FeatureCategory } from './features-data';

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'All'>('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FEATURES.filter(f => {
      if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#02122c] text-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {FEATURES.length}+ Features. One API.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Everything top 10 competitors offer — unified into a single platform at 1/100th the cost.
            No per-transaction fees. No hidden charges.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { value: FEATURES.length, label: 'Active Features' },
              { value: '240', label: 'Countries' },
              { value: '155+', label: 'API Endpoints' },
              { value: '$0', label: 'To Start' },
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
            <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} features</span>
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
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredId(feature.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 transition-all duration-200 hover:border-[#F59E0B] hover:shadow-md"
              >
                {/* Top row: icon + badges */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  <div className="flex items-center gap-1.5">
                    {feature.priority === 'MUST' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">MUST</span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Active</span>
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

                {/* API badge */}
                {feature.apiEndpoint && (
                  <div className={`mt-3 text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
                    {feature.apiEndpoint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-semibold">No features match your filter.</p>
            <button onClick={() => setSelectedCategory('All')} className="mt-2 text-sm text-[#F59E0B] font-bold cursor-pointer">
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* Competitor Comparison */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-[#02122c] mb-2">Why POTAL?</h2>
          <p className="text-center text-slate-500 mb-10">More features, lower cost, zero per-transaction fees.</p>

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
                  { label: 'Active Features', potal: '140', avalara: '44', zonos: '38', simply: '22' },
                  { label: 'Countries', potal: '240', avalara: '100+', zonos: '200+', simply: '180+' },
                  { label: 'HS Code Accuracy', potal: '100%', avalara: '~85%', zonos: '~80%', simply: '~75%' },
                  { label: 'Starting Price', potal: '$0/mo', avalara: '$1,500/mo', zonos: '$4,000/mo', simply: '$99/mo' },
                  { label: 'Per-Transaction Fee', potal: 'None', avalara: 'Yes', zonos: 'Yes', simply: 'Yes' },
                  { label: 'AI Calls Required', potal: '0', avalara: 'Every request', zonos: 'Every request', simply: 'Most requests' },
                  { label: 'API Response Time', potal: '<50ms', avalara: '200-500ms', zonos: '300-800ms', simply: '500ms+' },
                  { label: 'MCP Server', potal: 'Yes', avalara: 'No', zonos: 'No', simply: 'No' },
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
            Start Free — 2,000 API calls/month included
          </h2>
          <p className="text-slate-400 mb-8">No credit card required. Upgrade anytime.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-[#F59E0B] text-[#02122c] font-bold rounded-full hover:bg-[#e8930a] transition-colors text-sm"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm"
            >
              View Pricing
            </Link>
            <Link
              href="/developers"
              className="px-8 py-3 border border-slate-600 text-slate-300 font-bold rounded-full hover:border-slate-400 hover:text-white transition-colors text-sm"
            >
              API Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
