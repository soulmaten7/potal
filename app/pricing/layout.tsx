import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Forever Free | POTAL',
  description:
    'POTAL is Forever Free. All 140+ features at no cost. 100K API calls/month soft cap. Enterprise? Contact us.',
  keywords: [
    'total landed cost pricing',
    'duty calculator API pricing',
    'TLC API plans',
    'e-commerce API cost',
  ],
  openGraph: {
    title: 'POTAL Pricing — Total Landed Cost API Plans',
    description:
      'From free to enterprise. Calculate duties, taxes & shipping for 240 countries.',
    url: 'https://potal.app/pricing',
  },
  alternates: { canonical: 'https://potal.app/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
