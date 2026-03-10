import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quick Start — Integrate in 5 Minutes',
  description:
    'Add total landed cost calculations to your store in 5 minutes. Step-by-step guide for Shopify app, JavaScript widget, and REST API integration.',
  openGraph: {
    title: 'POTAL Quick Start Guide',
    description:
      'Shopify, widget, or API — get started in minutes with total landed cost calculations.',
    url: 'https://potal.app/developers/quickstart',
  },
  alternates: { canonical: 'https://potal.app/developers/quickstart' },
};

export default function QuickstartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
