import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FILING_GUIDES, COUNTRY_CODES } from '../data';
import { DisclaimerBanner, UpdateDate, ExternalLink } from '@/components/guides/DisclaimerBanner';

export function generateStaticParams() {
  return COUNTRY_CODES.map(code => ({ country: code }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const g = FILING_GUIDES[country];
  if (!g) return { title: 'Not Found' };
  return {
    title: `${g.flag} ${g.name} Customs Filing Guide | POTAL`,
    description: `How to file import and export customs declarations in ${g.name}. Official system: ${g.system}. Required documents and step-by-step procedures.`,
    openGraph: { title: `${g.name} Customs Filing Guide`, description: `Import/export customs guide for ${g.name}` },
  };
}

export default async function CountryFilingPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const g = FILING_GUIDES[country];
  if (!g) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{g.flag} {g.name} Customs Filing Guide</h1>

      <DisclaimerBanner>
        This is informational content only. POTAL does not perform customs declarations.
        For actual filings, use <ExternalLink href={g.systemUrl}>{g.system}</ExternalLink> or
        contact a licensed customs broker.
      </DisclaimerBanner>

      {/* Export Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-blue-600">&#128230;</span> Export
        </h2>
        <div className="mb-3">
          <span className="text-sm font-medium text-slate-500">Official System:</span>{' '}
          <ExternalLink href={g.systemUrl}>{g.system}</ExternalLink>
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Required Documents</h3>
        <ul className="list-disc list-inside text-sm text-slate-600 mb-4 space-y-1">
          {g.exportDocs.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Procedure</h3>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
          {g.exportSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      {/* Import Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-green-600">&#128229;</span> Import
        </h2>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Required Documents</h3>
        <ul className="list-disc list-inside text-sm text-slate-600 mb-4 space-y-1">
          {g.importDocs.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Procedure</h3>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
          {g.importSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      {/* Tips */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Tips</h2>
        <ul className="text-sm text-slate-600 space-y-2">
          {g.tips.map((t, i) => <li key={i} className="flex gap-2"><span className="text-amber-500">&#9679;</span>{t}</li>)}
        </ul>
      </section>

      {/* Links */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Official Links</h2>
        <ul className="text-sm space-y-2">
          {g.links.map((l, i) => <li key={i}><ExternalLink href={l.url}>{l.label}</ExternalLink></li>)}
        </ul>
      </section>

      <UpdateDate date="2026-04-15" />
    </div>
  );
}
