import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference — Endpoints, Parameters & Examples',
  description:
    'Complete API documentation for POTAL. Endpoints: /calculate, /calculate/batch, /countries, /hs-lookup. Authentication, rate limits, and response formats.',
  keywords: [
    'total landed cost API docs',
    'duty calculation API reference',
    'import tax API documentation',
    'HS code API',
  ],
  openGraph: {
    title: 'POTAL API Documentation',
    description:
      'Full API reference — calculate duties, taxes & shipping for 240 countries.',
    url: 'https://potal.app/developers/docs',
  },
  alternates: { canonical: 'https://potal.app/developers/docs' },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
