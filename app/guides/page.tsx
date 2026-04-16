import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
  title: 'Trade Guides | POTAL',
  description: 'Free trade guides: customs filing by country, Incoterms 2020, Section 301 tariffs, and anti-dumping duties.',
  openGraph: { title: 'POTAL Trade Guides', description: 'Free trade compliance guides for global commerce.' },
};

const GUIDES = [
  { href: '/guides/customs-filing', icon: '\uD83D\uDCCB', title: 'Customs Filing Guide', desc: 'Import/export declaration procedures for 8 countries', badge: '8 countries' },
  { href: '/guides/incoterms-2020', icon: '\uD83D\uDEE2\uFE0F', title: 'Incoterms 2020', desc: 'All 11 Incoterms explained with risk transfer and cost allocation', badge: '11 terms' },
  { href: '/guides/section-301', icon: '\uD83C\uDDFA\uD83C\uDDF8', title: 'Section 301 Tariffs', desc: 'US additional tariffs on Chinese goods — Lists 1-4, rates, exclusions', badge: 'US-CN' },
  { href: '/guides/anti-dumping', icon: '\u2696\uFE0F', title: 'Anti-Dumping & CVD', desc: 'Trade remedy duties: how they work, active cases, HS codes affected', badge: 'AD/CVD' },
];

export default function GuidesIndexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Trade Guides' }]} />
      <h1 className="text-2xl font-bold mb-2">Trade Guides</h1>
      <p className="text-slate-500 mb-6">Free reference guides for international trade compliance. Informational only.</p>

      <div className="grid gap-4">
        {GUIDES.map(g => (
          <Link key={g.href} href={g.href} className="block p-5 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all">
            <div className="flex items-start gap-4">
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{g.title}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{g.badge}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{g.desc}</p>
              </div>
              <span className="text-slate-300 text-lg">&#8250;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
