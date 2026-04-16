import type { Metadata } from 'next';
import { DisclaimerBanner, UpdateDate, ExternalLink } from '@/components/guides/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'Section 301 Tariffs Guide — US-China Additional Duties | POTAL',
  description: 'Guide to US Section 301 tariffs on Chinese goods. Lists 1-4, duty rates (7.5%-25%), exclusions, and USTR resources.',
  openGraph: { title: 'Section 301 Tariffs Guide', description: 'US additional tariffs on China-origin goods explained.' },
};

const LISTS = [
  { name: 'List 1', rate: '25%', value: '$34 billion', date: 'July 6, 2018', items: '818 tariff lines', sectors: 'Industrial machinery, electronics, aerospace' },
  { name: 'List 2', rate: '25%', value: '$16 billion', date: 'Aug 23, 2018', items: '279 tariff lines', sectors: 'Semiconductors, chemicals, plastics' },
  { name: 'List 3', rate: '25%', value: '$200 billion', date: 'Sep 24, 2018 (initially 10%, raised May 10, 2019)', items: '5,745 tariff lines', sectors: 'Consumer goods, food, textiles, metals' },
  { name: 'List 4A', rate: '7.5%', value: '$120 billion', date: 'Sep 1, 2019 (reduced from 15% on Feb 14, 2020)', items: '3,805 tariff lines', sectors: 'Apparel, footwear, electronics, toys' },
];

export default function Section301GuidePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Section 301 Tariffs Guide</h1>
      <p className="text-slate-600 mb-4">US additional tariffs on goods of Chinese origin under Section 301 of the Trade Act of 1974.</p>

      <DisclaimerBanner>
        This guide summarizes publicly available information about Section 301 tariffs.
        For official and current tariff determinations, refer to the{' '}
        <ExternalLink href="https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions">USTR Section 301 page</ExternalLink>{' '}
        and the <ExternalLink href="https://hts.usitc.gov/">USITC Harmonized Tariff Schedule</ExternalLink>.
        Tariff rates and exclusions change frequently.
      </DisclaimerBanner>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Background</h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p>In 2018, the United States Trade Representative (USTR) initiated an investigation into China&#39;s acts, policies, and practices related to technology transfer, intellectual property, and innovation under Section 301.</p>
          <p>The result was four rounds of additional tariffs (Lists 1-4) covering nearly all imports from China, with rates ranging from 7.5% to 25% on top of regular MFN duty rates.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Tariff Lists</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border text-left">List</th>
                <th className="p-2 border text-left">Rate</th>
                <th className="p-2 border text-left">Trade Value</th>
                <th className="p-2 border text-left">Effective Date</th>
                <th className="p-2 border text-left">Items</th>
                <th className="p-2 border text-left">Key Sectors</th>
              </tr>
            </thead>
            <tbody>
              {LISTS.map(l => (
                <tr key={l.name} className="hover:bg-slate-50">
                  <td className="p-2 border font-semibold">{l.name}</td>
                  <td className="p-2 border text-red-600 font-mono">{l.rate}</td>
                  <td className="p-2 border">{l.value}</td>
                  <td className="p-2 border text-xs">{l.date}</td>
                  <td className="p-2 border">{l.items}</td>
                  <td className="p-2 border text-xs">{l.sectors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Key Points</h2>
        <ul className="text-sm text-slate-600 space-y-2">
          <li><strong>Stacking:</strong> Section 301 duties are added on top of the regular MFN duty rate. A product with 5% MFN + 25% Section 301 = 30% total duty.</li>
          <li><strong>Origin rule:</strong> Applies to goods with China as the country of origin, regardless of shipping route.</li>
          <li><strong>Exclusions:</strong> USTR periodically grants product-specific exclusions. These expire and may or may not be renewed.</li>
          <li><strong>POTAL integration:</strong> POTAL automatically detects Section 301 applicability when origin=CN and destination=US, adding it to the duty calculation.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Official Resources</h2>
        <ul className="text-sm space-y-2">
          <li><ExternalLink href="https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions">USTR Section 301 Tariff Actions</ExternalLink></li>
          <li><ExternalLink href="https://hts.usitc.gov/">USITC Harmonized Tariff Schedule</ExternalLink></li>
          <li><ExternalLink href="https://www.federalregister.gov/">Federal Register (exclusion notices)</ExternalLink></li>
        </ul>
      </section>

      <UpdateDate date="2026-04-15" />
    </div>
  );
}
