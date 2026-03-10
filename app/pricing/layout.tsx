import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans — Free to Enterprise',
  description:
    'Simple, transparent pricing for total landed cost API. Free 100 calls/month, Basic $20/mo, Pro $80/mo, Enterprise $300/mo. All paid plans include a 14-day free trial.',
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
