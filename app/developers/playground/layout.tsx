import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Playground — Test Landed Cost Calculations Live',
  description:
    'Try the POTAL widget live. Configure product, origin, destination and see real-time duty, tax & shipping calculations for 240 countries.',
  openGraph: {
    title: 'POTAL API Playground',
    description:
      'Test total landed cost calculations live — duties, taxes, shipping for 240 countries.',
    url: 'https://potal.app/developers/playground',
  },
  alternates: { canonical: 'https://potal.app/developers/playground' },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
