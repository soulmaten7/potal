import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About POTAL — Total Landed Cost Infrastructure',
  description:
    'POTAL helps e-commerce businesses show customers the true cost of international orders. 240 countries, real-time calculations, 50 languages.',
  openGraph: {
    title: 'About POTAL',
    description:
      'The infrastructure for global e-commerce — accurate duties, taxes & shipping for 240 countries.',
    url: 'https://potal.app/about',
  },
  alternates: { canonical: 'https://potal.app/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
