// app/legal/[slug]/page.tsx
import { notFound } from 'next/navigation';

const LEGAL_DOCS: Record<string, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  'terms': {
    title: 'Terms of Service',
    lastUpdated: '2025-06-01',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing and using POTAL ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately. POTAL is a product comparison and search aggregation service. We do not sell products directly.',
      },
      {
        heading: '2. Service Description',
        body: 'POTAL aggregates publicly available product listings from third-party retailers including Amazon, Walmart, eBay, Target, Best Buy, AliExpress, Temu, and Shein. We display pricing, shipping estimates, and product information sourced from these platforms. POTAL does not guarantee the accuracy, completeness, or timeliness of this information. Prices, availability, and delivery estimates are subject to change without notice by the respective retailers.',
      },
      {
        heading: '3. Affiliate Disclosure',
        body: 'POTAL participates in affiliate programs with various retailers. When you click on a product link and make a purchase, POTAL may earn a commission at no additional cost to you. This does not influence our product rankings or search results, which are determined algorithmically based on price, delivery speed, and trust factors.',
      },
      {
        heading: '4. User Obligations',
        body: 'You agree not to: (a) use the Service for any unlawful purpose; (b) scrape, crawl, or extract data from the Service without authorization; (c) interfere with or disrupt the Service or its infrastructure; (d) attempt to gain unauthorized access to any part of the Service; (e) use automated tools or bots to access the Service in an excessive manner.',
      },
      {
        heading: '5. Intellectual Property',
        body: 'All content, design, and technology of POTAL are owned by POTAL Inc. or its licensors. Product images, descriptions, and trademarks belong to their respective owners and are displayed under fair use for comparison purposes. You may not reproduce, distribute, or create derivative works from the Service without explicit permission.',
      },
      {
        heading: '6. Limitation of Liability',
        body: 'POTAL is provided "as is" without warranties of any kind. We are not responsible for: (a) inaccurate pricing or product information from third-party retailers; (b) issues with purchases made through affiliate links; (c) changes in product availability or pricing after display; (d) any indirect, incidental, or consequential damages arising from use of the Service. Our maximum liability shall not exceed the amount you paid to use the Service (if any).',
      },
      {
        heading: '7. Modifications',
        body: 'We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use of the Service after changes constitutes acceptance of the revised Terms.',
      },
      {
        heading: '8. Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law provisions.',
      },
      {
        heading: '9. Contact',
        body: 'For questions about these Terms, please contact us at legal@potal.com or through our Contact page.',
      },
    ],
  },

  'privacy': {
    title: 'Privacy Policy',
    lastUpdated: '2025-06-01',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect minimal data to provide and improve our Service: (a) Search queries and filter preferences; (b) Device information and browser type; (c) IP address for regional pricing and fraud prevention; (d) Cookies for session management; (e) Account information if you create an account. We do NOT collect payment information — all purchases are made directly on third-party retailer websites.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use collected information to: (a) provide and personalize search results; (b) improve our algorithms and Service quality; (c) detect and prevent fraud or abuse; (d) communicate about Service updates; (e) generate anonymized analytics. We do NOT sell your personal information to third parties.',
      },
      {
        heading: '3. Affiliate Links and Third-Party Retailers',
        body: 'When you click a product link, you are redirected to a third-party retailer\'s website. At that point, the retailer\'s privacy policy governs data collection. We may receive confirmation of purchases made through affiliate links (order amount, not personal details) for commission tracking.',
      },
      {
        heading: '4. Data Retention',
        body: 'Search history and preferences are retained for up to 12 months. Account data is retained until you request deletion. Contact privacy@potal.com to request data deletion at any time.',
      },
      {
        heading: '5. Cookies',
        body: 'We use essential cookies for session management and optional analytics cookies. You can manage cookie preferences through your browser settings. We do not use cookies for advertising or cross-site tracking.',
      },
      {
        heading: '6. Security',
        body: 'We implement industry-standard security measures including HTTPS encryption, secure server infrastructure, and access controls. No method of Internet transmission is 100% secure.',
      },
      {
        heading: '7. Your Rights',
        body: 'Depending on your location, you may have rights to: access, correct, delete, restrict processing of, or port your data, and to opt out of analytics. Contact privacy@potal.com to exercise these rights.',
      },
      {
        heading: '8. Children\'s Privacy',
        body: 'POTAL is not intended for users under 13. We do not knowingly collect information from children under 13. If discovered, such information will be promptly deleted.',
      },
      {
        heading: '9. Changes to This Policy',
        body: 'We may update this Privacy Policy periodically. The effective date at the top indicates the latest revision.',
      },
    ],
  },

  'cookie': {
    title: 'Cookie Policy',
    lastUpdated: '2025-06-01',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.',
      },
      {
        heading: '2. Cookies We Use',
        body: 'Essential Cookies: Required for the Service to function (session management, authentication). These cannot be disabled.\n\nAnalytics Cookies: Help us understand how visitors use POTAL (page views, search patterns). Anonymized and can be opted out.\n\nPreference Cookies: Remember your settings (market scope, filters, display). Not required but enhance your experience.',
      },
      {
        heading: '3. Third-Party Cookies',
        body: 'We do NOT use advertising or tracking cookies. When you click through to a retailer\'s website, that retailer may set their own cookies per their privacy policy.',
      },
      {
        heading: '4. Managing Cookies',
        body: 'You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Disabling essential cookies may affect Service functionality.',
      },
    ],
  },

  'privacy-settings': {
    title: 'Privacy Settings',
    lastUpdated: '2025-06-01',
    sections: [
      {
        heading: 'Your Privacy Controls',
        body: 'POTAL respects your privacy. You can manage: Analytics Cookies (help us improve), Search History (personalized suggestions), and Email Notifications (service updates). Visit Account Settings to update preferences, or contact privacy@potal.com to delete all data.',
      },
      {
        heading: 'Do Not Track',
        body: 'POTAL honors "Do Not Track" browser signals. When enabled, we will not collect analytics data from your sessions.',
      },
    ],
  },
};

export default function LegalPage({ params }: { params: { slug: string } }) {
  const doc = LEGAL_DOCS[params.slug as keyof typeof LEGAL_DOCS];

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-[#02122c] pt-28 pb-12">
        <div className="max-w-[800px] mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{doc.title}</h1>
          <p className="text-slate-400 text-sm">Last updated: {doc.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 space-y-8">
          {doc.sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-bold text-[#02122c] mb-3">{section.heading}</h2>
              <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 mb-4">
            Questions? <a href="/contact" className="text-[#02122c] font-bold hover:text-[#F59E0B] transition-colors underline">Contact us</a>
          </p>
          <a href="/" className="text-sm text-slate-400 hover:text-[#02122c] transition-colors">← Back to POTAL</a>
        </div>
      </div>
    </div>
  );
}
