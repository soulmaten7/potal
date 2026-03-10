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

// FAQ structured data for Google Rich Snippets
const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is POTAL?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'POTAL is a Total Landed Cost API and Shopify app. We help e-commerce sellers calculate and display import duties, taxes, and fees for international orders — covering 240 countries with AI-powered HS Code classification.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the duty calculations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our calculations are based on official tariff schedules, trade agreements (FTAs), and de minimis thresholds. While we provide highly accurate estimates, actual customs charges may vary based on the destination country\'s customs authority assessment.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I install the POTAL Shopify app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Search for "POTAL" in the Shopify App Store, click Install, and approve the required permissions (read_products, read_orders, read_shipping). The widget will automatically appear on your product pages via the theme app extension.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get my API key?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sign up at potal.app, then go to your Dashboard. Your API keys are generated automatically. You can manage and rotate keys from the Dashboard at any time.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I exceed my plan\'s API call limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On the Free plan, API calls stop at the 100-call limit. On paid plans (Basic, Pro, Enterprise), overage calls are automatically billed: Basic $0.015/call, Pro $0.012/call, Enterprise $0.01/call.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a free plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Our Free plan includes 100 API calls per month — no credit card required. Paid plans (Basic, Pro, Enterprise) come with a 14-day free trial. A payment method is collected at signup, but you won\'t be charged until the trial ends.',
      },
    },
    {
      '@type': 'Question',
      name: 'What data does the Shopify app access?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The app only accesses read_products (to classify items), read_orders (to track calculation usage), and read_shipping (to include shipping in landed cost). We never modify your store data.',
      },
    },
  ],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
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
