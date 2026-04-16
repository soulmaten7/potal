import type { Metadata } from 'next';
import { DisclaimerBanner, ExternalLink, LiveDataFreshness } from '@/components/guides/DisclaimerBanner';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'Anti-Dumping & Countervailing Duties Guide | POTAL',
  description: 'Guide to anti-dumping (AD) and countervailing (CVD) duties. How they work, active cases, affected HS codes, and official resources.',
  openGraph: { title: 'Anti-Dumping Duties Guide', description: 'Understanding AD/CVD trade remedies and active cases.' },
};

const NOTABLE_CASES = [
  { product: 'Steel products (various)', origin: 'CN, KR, JP, IN, BR', imposer: 'US', type: 'AD+CVD', rateRange: '3%-265%', hsChapters: '72-73' },
  { product: 'Solar cells/modules', origin: 'CN, TW', imposer: 'US', type: 'AD+CVD', rateRange: '15%-238%', hsChapters: '85' },
  { product: 'Aluminum extrusions', origin: 'CN', imposer: 'US', type: 'AD+CVD', rateRange: '33%-374%', hsChapters: '76' },
  { product: 'Wooden bedroom furniture', origin: 'CN', imposer: 'US', type: 'AD', rateRange: '4%-216%', hsChapters: '94' },
  { product: 'Cold-rolled steel flat', origin: 'CN, JP, KR', imposer: 'EU', type: 'AD', rateRange: '13.2%-22.1%', hsChapters: '72' },
  { product: 'Ceramic tableware', origin: 'CN', imposer: 'EU', type: 'AD', rateRange: '13.1%-36.1%', hsChapters: '69' },
  { product: 'Stainless steel bars', origin: 'CN, IN', imposer: 'US', type: 'AD+CVD', rateRange: '5%-186%', hsChapters: '72' },
  { product: 'Tires (passenger/light truck)', origin: 'CN, KR, TW, TH, VN', imposer: 'US', type: 'AD+CVD', rateRange: '4%-82%', hsChapters: '40' },
];

export default function AntiDumpingGuidePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Anti-Dumping & CVD' }]} />
      <h1 className="text-2xl font-bold mb-4">Anti-Dumping &amp; Countervailing Duties Guide</h1>

      <DisclaimerBanner>
        This guide provides general information about trade remedy duties. AD/CVD rates are firm-specific and
        change with administrative reviews. For binding determinations, consult the{' '}
        <ExternalLink href="https://www.trade.gov/enforcement-and-compliance">US ITA Enforcement &amp; Compliance</ExternalLink>{' '}
        or your country&#39;s trade authority. POTAL does not provide legal advice.
      </DisclaimerBanner>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">What are AD/CVD Duties?</h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p><strong>Anti-Dumping (AD) duties</strong> are imposed when a foreign manufacturer sells goods in an importing country at less than fair value (below home market price or cost of production).</p>
          <p><strong>Countervailing Duties (CVD)</strong> are imposed to offset subsidies provided by a foreign government to its exporters.</p>
          <p>Both are added on top of the normal MFN tariff rate and can significantly increase the total landed cost.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">How AD/CVD Works</h2>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li><strong>Petition filed</strong> by domestic industry claiming injury from dumped/subsidized imports</li>
          <li><strong>Investigation</strong> by trade authority (US: ITC + Commerce Dept; EU: European Commission)</li>
          <li><strong>Preliminary determination</strong> with estimated duty rates (cash deposits required)</li>
          <li><strong>Final determination</strong> with firm-specific duty rates</li>
          <li><strong>Order issued</strong> — duties collected on covered imports</li>
          <li><strong>Annual reviews</strong> — rates adjusted based on current pricing</li>
          <li><strong>Sunset review</strong> (every 5 years) — order continued or revoked</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Notable Active Cases</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 border text-left">Product</th>
                <th className="p-2 border text-left">Origin</th>
                <th className="p-2 border text-left">Imposed By</th>
                <th className="p-2 border text-left">Type</th>
                <th className="p-2 border text-left">Rate Range</th>
                <th className="p-2 border text-left">HS Chapters</th>
              </tr>
            </thead>
            <tbody>
              {NOTABLE_CASES.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-2 border">{c.product}</td>
                  <td className="p-2 border font-mono text-xs">{c.origin}</td>
                  <td className="p-2 border">{c.imposer}</td>
                  <td className="p-2 border text-red-600 font-semibold">{c.type}</td>
                  <td className="p-2 border font-mono">{c.rateRange}</td>
                  <td className="p-2 border text-xs">{c.hsChapters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">POTAL Integration</h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p>POTAL automatically checks for applicable AD/CVD duties during landed cost calculation. When a product&#39;s HS code and origin country match an active trade remedy order, the additional duty is included in the total.</p>
          <p>The <code className="bg-slate-100 px-1 rounded">tradeRemedies</code> field in the calculate API response shows whether AD/CVD applies and the estimated additional duty amount.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Official Resources</h2>
        <ul className="text-sm space-y-2">
          <li><ExternalLink href="https://www.trade.gov/enforcement-and-compliance">US ITA Enforcement &amp; Compliance</ExternalLink></li>
          <li><ExternalLink href="https://www.usitc.gov/trade_remedy/731_702.htm">USITC AD/CVD Investigations</ExternalLink></li>
          <li><ExternalLink href="https://trade.ec.europa.eu/tdi/">EU Trade Defence Instruments</ExternalLink></li>
          <li><ExternalLink href="https://www.wto.org/english/tratop_e/adp_e/adp_e.htm">WTO Anti-Dumping</ExternalLink></li>
        </ul>
      </section>

      <LiveDataFreshness sourceNames={['USITC', 'Trade Remedies']} label="Data Sources" />
    </div>
  );
}
