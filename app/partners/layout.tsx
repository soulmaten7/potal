import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners & Integrations — Shopify, WooCommerce & More',
  description:
    'POTAL integrates with Shopify, WooCommerce, Magento, BigCommerce, and custom stores via REST API. Become a technology or agency partner.',
  openGraph: {
    title: 'POTAL Partner Ecosystem',
    description:
      'E-commerce platform integrations and partnership opportunities for agencies and developers.',
    url: 'https://potal.app/partners',
  },
  alternates: { canonical: 'https://potal.app/partners' },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
