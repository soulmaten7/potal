import type { Metadata } from 'next';
import { MASTER_DATA_REGISTRY } from '@/app/lib/data-management/master-data-registry';
import { DisclaimerBanner, ExternalLink } from '@/components/guides/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'Data Sources & Freshness | POTAL',
  description: 'POTAL uses 32+ authoritative data sources from governments and international organizations. View coverage, update frequency, and automation status.',
};

const CATEGORY_LABELS: Record<string, string> = {
  tariff: 'Tariff & Duty Rates',
  sanctions: 'Sanctions & Screening',
  fta: 'Free Trade Agreements',
  exchange_rate: 'Exchange Rates',
  tax: 'VAT/GST & Tax',
  trade_remedy: 'Trade Remedies',
  classification: 'HS Classification',
  restrictions: 'Restrictions & Export Control',
  country_metadata: 'Country Metadata',
  regulatory: 'Regulatory Monitoring',
  logistics: 'Logistics',
};

const AUTOMATION_BADGE: Record<string, { label: string; color: string }> = {
  auto_cron: { label: 'Auto (Cron)', color: 'bg-emerald-100 text-emerald-700' },
  auto_monitor: { label: 'Monitor', color: 'bg-blue-100 text-blue-700' },
  manual_script: { label: 'Manual', color: 'bg-amber-100 text-amber-700' },
  manual_seed: { label: 'Seed', color: 'bg-slate-100 text-slate-600' },
  static: { label: 'Static', color: 'bg-slate-100 text-slate-500' },
};

export default function DataSourcesPage() {
  const categories = [...new Set(MASTER_DATA_REGISTRY.map(s => s.category))];
  const totalRows = MASTER_DATA_REGISTRY.reduce((sum, s) => sum + s.approxRows, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Data Sources & Freshness</h1>
      <p className="text-slate-500 mb-6">
        POTAL uses {MASTER_DATA_REGISTRY.length} authoritative data sources from governments and international organizations.
      </p>

      <DisclaimerBanner>
        Data freshness varies by source. Automated sources update daily to weekly. Manual seeds are refreshed periodically.
        Always verify critical decisions with official government sources.
      </DisclaimerBanner>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-800">{MASTER_DATA_REGISTRY.length}</div>
          <div className="text-sm text-slate-500">Data Sources</div>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-800">{(totalRows / 1_000_000).toFixed(0)}M+</div>
          <div className="text-sm text-slate-500">Total Records</div>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-800">{categories.length}</div>
          <div className="text-sm text-slate-500">Categories</div>
        </div>
      </div>

      {/* Category sections */}
      {categories.map(cat => {
        const sources = MASTER_DATA_REGISTRY.filter(s => s.category === cat);
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-slate-800">
              {CATEGORY_LABELS[cat] || cat} <span className="text-sm text-slate-400 font-normal">({sources.length})</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                    <th className="p-2 border-b">Source</th>
                    <th className="p-2 border-b">Publisher</th>
                    <th className="p-2 border-b">Coverage</th>
                    <th className="p-2 border-b">Update</th>
                    <th className="p-2 border-b">Automation</th>
                    <th className="p-2 border-b">Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(s => {
                    const badge = AUTOMATION_BADGE[s.automationLevel] || AUTOMATION_BADGE.static;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="p-2">
                          <ExternalLink href={s.sourceUrl}>{s.name}</ExternalLink>
                        </td>
                        <td className="p-2 text-slate-600">{s.publisher}</td>
                        <td className="p-2 text-slate-600">{s.coverage}</td>
                        <td className="p-2 text-slate-500 text-xs">{s.updateFrequency}</td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                        </td>
                        <td className="p-2 text-right font-mono text-slate-600">
                          {s.approxRows >= 1_000_000 ? `${(s.approxRows / 1_000_000).toFixed(1)}M` :
                           s.approxRows >= 1_000 ? `${(s.approxRows / 1_000).toFixed(0)}K` :
                           s.approxRows.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-slate-400 mt-8 border-t border-slate-100 pt-4">
        Last verified: 2026-04-17. For real-time freshness, see the Live Ticker on the homepage.
      </p>
    </div>
  );
}
