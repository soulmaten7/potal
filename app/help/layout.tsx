import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & FAQ — Support Center',
  description:
    'Frequently asked questions about POTAL pricing, API usage, Shopify integration, and duty calculations. Contact our support team for help.',
  openGraph: {
    title: 'POTAL Help Center & FAQ',
    description:
      'Get answers about pricing, API integration, Shopify app, and landed cost calculations.',
    url: 'https://potal.app/help',
  },
  alternates: { canonical: 'https://potal.app/help' },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
