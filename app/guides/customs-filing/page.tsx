import type { Metadata } from 'next';
import { DisclaimerBanner } from '@/components/guides/DisclaimerBanner';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CountryGrid } from './CountryGrid';

export const metadata: Metadata = {
  title: 'Customs Filing Guide by Country | POTAL',
  description: 'Step-by-step customs declaration guides for 8 countries: KR, US, EU, GB, JP, CN, AU, CA. Official systems, required documents, and procedures.',
  openGraph: { title: 'Customs Filing Guide', description: 'Import and export customs declaration guides for 8 countries.' },
};

export default function CustomsFilingIndex() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Customs Filing Guide' }]} />
      <h1 className="text-2xl font-bold mb-4">Customs Filing Guide</h1>
      <DisclaimerBanner>
        This is informational content only. POTAL does not perform customs declarations on your behalf.
        Please use the official government systems or a licensed customs broker for actual filings.
      </DisclaimerBanner>

      <p className="text-slate-600 mb-6">
        Select a country to view its import and export customs declaration procedures, required documents, and official system links.
      </p>

      <CountryGrid />
    </div>
  );
}
