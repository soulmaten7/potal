import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function getSupabase() { return createClient(supabaseUrl, supabaseKey); }

interface PageProps {
  params: Promise<{ country: string; hs: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, hs } = await params;
  const cc = country.toUpperCase();
  const sb = getSupabase();
  const { data: c } = await sb.from('countries').select('name, country_name').eq('iso2', cc).single();
  const countryName = c?.name || c?.country_name || cc;

  return {
    title: `${countryName} Import Duty for HS ${hs} | POTAL`,
    description: `Check import duty rates, VAT, de minimis threshold, and FTA options for HS code ${hs} imported into ${countryName}. Real-time tariff data from POTAL.`,
    openGraph: {
      title: `${countryName} Import Duty for HS ${hs}`,
      description: `Tariff rates, VAT, and trade compliance data for importing HS ${hs} into ${countryName}.`,
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function TariffPage({ params }: PageProps) {
  const { country, hs } = await params;
  const cc = country.toUpperCase();
  const hsCode = hs.replace(/[^0-9]/g, '');
  if (!hsCode || hsCode.length < 4) notFound();

  const sb = getSupabase();

  const [countryRes, vatRes, dmRes, mfnRes] = await Promise.all([
    sb.from('countries').select('name, country_name, currency_code, region').eq('iso2', cc).single(),
    sb.from('vat_gst_rates').select('rate, vat_rate, label, tax_name').eq('country_code', cc).single(),
    sb.from('de_minimis_thresholds').select('threshold_usd, amount, currency').eq('country_code', cc).single(),
    sb.from('macmap_ntlc_rates').select('ntlc_rate, hs_code').eq('reporter_code', cc).like('hs_code', `${hsCode.substring(0, 4)}%`).limit(5),
  ]);

  if (!countryRes.data) notFound();

  const countryName = countryRes.data.name || countryRes.data.country_name;
  const vatRate = vatRes.data ? (vatRes.data.rate || vatRes.data.vat_rate) : 'N/A';
  const vatLabel = vatRes.data?.label || vatRes.data?.tax_name || 'VAT';
  const deMinimis = dmRes.data ? (dmRes.data.threshold_usd || dmRes.data.amount) : 'N/A';
  const mfnRates = (mfnRes.data || []) as { ntlc_rate: string; hs_code: string }[];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the import duty for HS ${hsCode} in ${countryName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: mfnRates.length > 0
            ? `The MFN duty rate for HS ${mfnRates[0].hs_code} in ${countryName} is ${mfnRates[0].ntlc_rate}%. Lower preferential rates may be available through FTAs.`
            : `MFN duty rate data for HS ${hsCode} in ${countryName} is available via the POTAL API.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the ${vatLabel} rate in ${countryName}?`,
        acceptedAnswer: { '@type': 'Answer', text: `The standard ${vatLabel} rate in ${countryName} is ${vatRate}%.` },
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {countryName} Import Duty for HS {hsCode}
      </h1>
      <p className="text-gray-600 mb-8">
        Tariff rates, {vatLabel}, and trade compliance data for importing goods classified under HS {hsCode} into {countryName}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase">MFN Duty Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {mfnRates.length > 0 ? `${mfnRates[0].ntlc_rate}%` : 'Check API'}
          </p>
          {mfnRates.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">HS {mfnRates[0].hs_code}</p>
          )}
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase">{vatLabel} Rate</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{vatRate}%</p>
        </div>
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase">De Minimis</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">${deMinimis}</p>
        </div>
      </div>

      {mfnRates.length > 1 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Tariff Lines</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFN Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mfnRates.map((r, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3 text-sm text-gray-900">{r.hs_code}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{r.ntlc_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Calculate Total Landed Cost</h2>
        <p className="text-sm text-blue-800 mb-4">
          Get a complete cost breakdown including duty, {vatLabel}, shipping estimates, and FTA savings with the POTAL API.
        </p>
        <a
          href="/developers"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Try the API
        </a>
      </div>
    </div>
  );
}
