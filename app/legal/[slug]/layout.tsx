import type { Metadata } from 'next';

const LEGAL_META: Record<string, { title: string; description: string }> = {
  terms: {
    title: 'Terms of Service — POTAL',
    description: 'POTAL Terms of Service. Read our terms for API usage, rate limits, billing, and user obligations.',
  },
  privacy: {
    title: 'Privacy Policy — POTAL',
    description: 'POTAL Privacy Policy. Learn how we handle your data, GDPR/CCPA compliance, and your privacy rights.',
  },
  'cookie-policy': {
    title: 'Cookie Policy — POTAL',
    description: 'POTAL Cookie Policy. Information about cookies and tracking technologies used on our platform.',
  },
  'privacy-settings': {
    title: 'Privacy Settings — POTAL',
    description: 'Manage your POTAL privacy settings, data preferences, and consent options.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = LEGAL_META[slug];
  if (!meta) return {};

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://potal.app/legal/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
