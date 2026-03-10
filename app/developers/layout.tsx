import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer Hub — API, Widget & Shopify Integration',
  description:
    'Integrate total landed cost calculations into your e-commerce platform. REST API, JavaScript widget, and Shopify app. Full documentation and quick start guides.',
  keywords: [
    'total landed cost API',
    'duty calculator API',
    'e-commerce widget',
    'Shopify duty app',
    'REST API integration',
  ],
  openGraph: {
    title: 'POTAL Developer Hub — TLC API Integration',
    description:
      'REST API, JS widget, Shopify app. Calculate duties & taxes for 240 countries in real-time.',
    url: 'https://potal.app/developers',
  },
  alternates: { canonical: 'https://potal.app/developers' },
};

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
