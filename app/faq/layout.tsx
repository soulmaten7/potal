import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about POTAL cross-border commerce API, pricing, HS codes, duties, taxes, and features.',
  openGraph: {
    title: 'POTAL FAQ',
    description:
      'Find answers about duties, taxes, HS codes, FTAs, and cross-border commerce with POTAL.',
    url: 'https://potal.app/faq',
  },
  alternates: { canonical: 'https://potal.app/faq' },
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Total Landed Cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Total Landed Cost (TLC) is the complete cost of a product delivered to the buyer's door, including: product price, shipping, customs duties, VAT/GST, processing fees, insurance, and brokerage. POTAL calculates all 15 cost components.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is an HS Code?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Harmonized System (HS) code is a standardized numerical method of classifying traded products. It is used by customs authorities around the world to identify products for tariff and statistical purposes. HS codes are maintained by the World Customs Organization (WCO) and consist of 6 digits at the international level, with countries adding additional digits for national specificity.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does POTAL cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free: $0 (200 lookups/mo), Basic: $20/mo (2,000), Pro: $80/mo (10,000), Enterprise: $300/mo (50,000). Annual billing saves 20%. All plans include the same features — only volume differs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does POTAL classify products to HS codes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POTAL uses a 3-stage AI classification pipeline: (1) Vector similarity search against 8,389+ pre-classified products, (2) Keyword matching against product descriptions, (3) LLM-based classification for novel products. Results are cached for instant future lookups at zero cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a Free Trade Agreement (FTA)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An FTA is an agreement between two or more countries to reduce or eliminate tariffs on goods traded between them. POTAL tracks 63 active FTAs and automatically identifies available preferential rates when you specify origin and destination countries.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is VAT/GST?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Value Added Tax (VAT) or Goods and Services Tax (GST) is a consumption tax applied to goods and services. POTAL covers VAT/GST rates for all 240 countries and territories, including standard rates, reduced rates, and product-specific rates.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is sanctions screening?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sanctions screening checks if a trade party appears on restricted party lists (OFAC SDN, BIS Entity, EU, UN, UK). POTAL screens against 21,301 entries from 19 sources. Mandatory for all US exporters and recommended globally.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get an API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Sign up at potal.app, go to Dashboard > API Keys, and click 'Create Key'. You'll get a publishable key (pk_live_) for client-side use and a secret key (sk_live_) for server-side use. The Free plan includes 200 API calls per month.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I exceed my plan limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paid plans have overage pricing: Basic $0.015/lookup, Pro $0.012/lookup, Enterprise $0.01/lookup. Overages are billed at the end of the month. Free plan users are blocked at the limit.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is de minimis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'De minimis is the threshold below which imported goods are exempt from customs duties and/or taxes. Thresholds vary by country — e.g., US $800, EU \u20AC150 (customs), AU A$1,000. POTAL includes de minimis data for all 240 countries.',
      },
    },
  ],
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}
