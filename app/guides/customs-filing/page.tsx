import type { Metadata } from 'next';
import Link from 'next/link';
import { FILING_GUIDES } from './data';
import { DisclaimerBanner } from '@/components/guides/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'Customs Filing Guide by Country | POTAL',
  description: 'Step-by-step customs declaration guides for 8 countries: KR, US, EU, GB, JP, CN, AU, CA. Official systems, required documents, and procedures.',
  openGraph: { title: 'Customs Filing Guide', description: 'Import and export customs declaration guides for 8 countries.' },
};

export default function CustomsFilingIndex() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Customs Filing Guide</h1>
      <DisclaimerBanner>
        This is informational content only. POTAL does not perform customs declarations on your behalf.
        Please use the official government systems or a licensed customs broker for actual filings.
      </DisclaimerBanner>

      <p className="text-slate-600 mb-6">
        Select a country to view its import and export customs declaration procedures, required documents, and official system links.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.values(FILING_GUIDES).map(g => (
          <Link
            key={g.code}
            href={`/guides/customs-filing/${g.code}`}
            className="block p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <div className="text-3xl mb-2">{g.flag}</div>
            <div className="font-semibold text-sm">{g.name}</div>
            <div className="text-xs text-slate-500 mt-1">{g.system}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
