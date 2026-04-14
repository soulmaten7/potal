import type { Metadata } from 'next';
import { DisclaimerBanner, UpdateDate } from '@/components/guides/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'Incoterms 2020 Guide | POTAL',
  description: 'Complete guide to all 11 Incoterms 2020 rules: EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF. Risk transfer, cost allocation, and recommended use cases.',
  openGraph: { title: 'Incoterms 2020 Guide', description: 'All 11 Incoterms explained with risk transfer and cost allocation.' },
};

const INCOTERMS = [
  { code: 'EXW', name: 'Ex Works', transport: 'Any', seller: 'Minimal', buyer: 'All from seller premises', risk: 'Seller\'s premises', duty: 'Buyer', insurance: 'Buyer', use: 'Domestic sales, buyer arranges everything' },
  { code: 'FCA', name: 'Free Carrier', transport: 'Any', seller: 'To named place/carrier', buyer: 'From carrier', risk: 'Delivery to carrier', duty: 'Buyer', insurance: 'Buyer', use: 'Container shipments, multimodal transport' },
  { code: 'CPT', name: 'Carriage Paid To', transport: 'Any', seller: 'Freight to destination', buyer: 'From delivery point', risk: 'Delivery to first carrier', duty: 'Buyer', insurance: 'Buyer', use: 'Air/multimodal when seller pays freight' },
  { code: 'CIP', name: 'Carriage and Insurance Paid', transport: 'Any', seller: 'Freight + insurance to destination', buyer: 'From delivery point', risk: 'Delivery to first carrier', duty: 'Buyer', insurance: 'Seller (all-risk)', use: 'High-value goods requiring insurance' },
  { code: 'DAP', name: 'Delivered at Place', transport: 'Any', seller: 'To destination (not unloaded)', buyer: 'Unloading + import clearance', risk: 'At destination (before unloading)', duty: 'Buyer', insurance: 'No obligation', use: 'Door-to-door, buyer handles import' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', transport: 'Any', seller: 'To destination + unloaded', buyer: 'Import clearance', risk: 'After unloading at destination', duty: 'Buyer', insurance: 'No obligation', use: 'Terminal/warehouse delivery' },
  { code: 'DDP', name: 'Delivered Duty Paid', transport: 'Any', seller: 'Everything including import duty', buyer: 'Minimal (receive goods)', risk: 'At buyer\'s premises', duty: 'Seller', insurance: 'No obligation', use: 'E-commerce, full seller responsibility' },
  { code: 'FAS', name: 'Free Alongside Ship', transport: 'Sea only', seller: 'To alongside vessel', buyer: 'From alongside vessel', risk: 'Alongside vessel at port', duty: 'Buyer', insurance: 'Buyer', use: 'Bulk cargo, heavy/oversized goods' },
  { code: 'FOB', name: 'Free On Board', transport: 'Sea only', seller: 'On board vessel', buyer: 'From on board vessel', risk: 'On board vessel at port of shipment', duty: 'Buyer', insurance: 'Buyer', use: 'Most common for sea freight' },
  { code: 'CFR', name: 'Cost and Freight', transport: 'Sea only', seller: 'Freight to destination port', buyer: 'From port of destination', risk: 'On board vessel at port of shipment', duty: 'Buyer', insurance: 'Buyer', use: 'Sea freight, seller pays shipping' },
  { code: 'CIF', name: 'Cost, Insurance and Freight', transport: 'Sea only', seller: 'Freight + insurance to destination', buyer: 'From port of destination', risk: 'On board vessel at port of shipment', duty: 'Buyer', insurance: 'Seller (min cover)', use: 'Letters of credit, traditional trade' },
];

export default function IncotermsGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Incoterms 2020 Guide</h1>

      <DisclaimerBanner>
        This guide is for informational purposes only. Incoterms are published by the International Chamber of Commerce (ICC).
        For official definitions, refer to the ICC Incoterms 2020 publication.
      </DisclaimerBanner>

      {/* Overview Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Transport</th>
              <th className="p-2 border">Duty</th>
              <th className="p-2 border">Insurance</th>
              <th className="p-2 border">Risk Transfer</th>
            </tr>
          </thead>
          <tbody>
            {INCOTERMS.map(t => (
              <tr key={t.code} className="hover:bg-slate-50">
                <td className="p-2 border font-mono font-bold text-blue-700">{t.code}</td>
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border text-xs">{t.transport}</td>
                <td className="p-2 border text-xs">{t.duty}</td>
                <td className="p-2 border text-xs">{t.insurance}</td>
                <td className="p-2 border text-xs">{t.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Sections */}
      {INCOTERMS.map(t => (
        <section key={t.code} id={t.code.toLowerCase()} className="mb-6 p-4 border border-slate-200 rounded-lg">
          <h2 className="text-lg font-bold mb-2">
            <span className="font-mono text-blue-700">{t.code}</span> — {t.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="font-semibold text-slate-500">Seller pays:</span> {t.seller}</div>
            <div><span className="font-semibold text-slate-500">Buyer pays:</span> {t.buyer}</div>
            <div><span className="font-semibold text-slate-500">Risk transfers at:</span> {t.risk}</div>
            <div><span className="font-semibold text-slate-500">Import duty:</span> {t.duty}</div>
            <div><span className="font-semibold text-slate-500">Insurance:</span> {t.insurance}</div>
            <div><span className="font-semibold text-slate-500">Transport mode:</span> {t.transport}</div>
          </div>
          <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">Recommended for:</span> {t.use}</p>
        </section>
      ))}

      <UpdateDate date="2026-04-15" />
    </div>
  );
}
