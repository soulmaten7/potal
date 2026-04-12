'use client';

/**
 * ScenarioSelector — CW34 Full-width RapidAPI-style homepage
 *
 * Full-width layout with 6 large scenario cards (2 rows × 3 cols on desktop).
 * Each card shows: icon, title, subtitle, description, key endpoints,
 * and a "Try it →" CTA. Clicking navigates to /playground/{scenarioId}.
 *
 * Replaces the CW23 compact button strip — now utilizes full viewport width
 * to match the full-width playground pages for UI consistency ("일체감").
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ScenarioId } from '@/lib/scenarios/scenario-config';

interface ScenarioCardData {
  id: ScenarioId;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  endpoints: string[];
  color: string; // accent color for the card
}

const SCENARIO_CARDS: ScenarioCardData[] = [
  {
    id: 'seller',
    icon: '🛒',
    title: 'Online Seller',
    subtitle: 'Etsy · Shopify · eBay · Amazon',
    description:
      'Calculate exact landed costs for every international order. Know your real margin after duties, taxes, and shipping — before you set your price. Classify products automatically with AI-powered HS code detection.',
    endpoints: ['Classify Product', 'Check Restrictions', 'Calculate Landed Cost'],
    color: '#F59E0B',
  },
  {
    id: 'd2c',
    icon: '🌐',
    title: 'D2C Brand',
    subtitle: 'Your own online store',
    description:
      'Compare landed costs across multiple countries to find your best markets. See duty rates, taxes, and FTA savings side by side. Make data-driven expansion decisions with real numbers, not guesswork.',
    endpoints: ['Compare Countries', 'Calculate Landed Cost', 'Lookup FTA'],
    color: '#3B82F6',
  },
  {
    id: 'importer',
    icon: '📦',
    title: 'Importer',
    subtitle: 'B2B container loads',
    description:
      'Get precise container-level landed costs with detailed duty breakdowns. Verify HS classifications, check FTA eligibility for preferential rates, and screen for import restrictions before goods ship.',
    endpoints: ['Classify (Precise)', 'Lookup FTA', 'Calculate Landed Cost', 'Check Restrictions'],
    color: '#10B981',
  },
  {
    id: 'exporter',
    icon: '✈️',
    title: 'Exporter',
    subtitle: 'Quotes & contracts',
    description:
      'Show your international buyers exactly what they will pay at their door. Generate professional quotes with full cost transparency. Check FTA eligibility to offer competitive pricing with preferential duty rates.',
    endpoints: ['Calculate Landed Cost', 'Generate Document', 'Lookup FTA'],
    color: '#8B5CF6',
  },
  {
    id: 'forwarder',
    icon: '🚚',
    title: 'Forwarder / 3PL',
    subtitle: 'Small-team logistics',
    description:
      'Calculate on behalf of multiple clients with a single API integration. Automate landed cost calculations across all your shipments. Full API access to every POTAL feature — classify, screen, calculate, and document.',
    endpoints: ['All Features via API'],
    color: '#EF4444',
  },
  {
    id: 'custom',
    icon: '⚙️',
    title: 'CUSTOM',
    subtitle: 'Build your own combo',
    description:
      'Pick exactly the features you need. Mix and match any combination of POTAL\'s API endpoints to build a workflow that fits your specific cross-border operation. Full flexibility, zero restrictions.',
    endpoints: ['Any Endpoint Combination'],
    color: '#6B7280',
  },
];

function ScenarioCard({
  card,
  onSelect,
}: {
  card: ScenarioCardData;
  onSelect: (id: ScenarioId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className="group relative flex flex-col text-left bg-white rounded-2xl border border-slate-200 p-8 transition-all duration-200 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer w-full"
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: card.color }}
      />

      {/* Icon + Title row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[36px] leading-none">{card.icon}</span>
        <div>
          <h3 className="text-[20px] font-extrabold text-[#02122c] leading-tight">
            {card.title}
          </h3>
          <p className="text-[13px] text-slate-400 font-medium mt-0.5">
            {card.subtitle}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[14px] text-slate-600 leading-relaxed mb-5 flex-1">
        {card.description}
      </p>

      {/* Endpoints */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {card.endpoints.map(ep => (
          <span
            key={ep}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 border border-slate-100"
          >
            {ep}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        className="text-[14px] font-bold transition-colors duration-150"
        style={{ color: card.color }}
      >
        Try it free →
      </div>
    </button>
  );
}

export function ScenarioSelector() {
  const router = useRouter();

  const handleSelect = useCallback(
    (id: ScenarioId) => {
      router.push(`/playground/${id}`);
    },
    [router]
  );

  return (
    <section aria-label="Choose your scenario" className="w-full px-8 lg:px-12 pt-10 pb-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-[32px] md:text-[40px] font-extrabold text-[#02122c] leading-tight mb-3">
          Cross-Border Trade API
        </h1>
        <p className="text-[16px] md:text-[18px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Choose your scenario and start calculating landed costs in seconds.
          <br className="hidden md:block" />
          Every API endpoint is <span className="font-bold text-[#02122c]">forever free</span> — no usage limits, no credit card.
        </p>
      </div>

      {/* 6 cards — 3 cols on large, 2 cols on medium, 1 col on small */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1600px] mx-auto">
        {SCENARIO_CARDS.map(card => (
          <ScenarioCard
            key={card.id}
            card={card}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Bottom note */}
      <div className="text-center mt-8">
        <p className="text-[13px] text-slate-400">
          Enterprise needs?{' '}
          <a href="/contact" className="text-[#F59E0B] font-semibold hover:underline">
            Contact us →
          </a>
        </p>
      </div>
    </section>
  );
}

export default ScenarioSelector;
