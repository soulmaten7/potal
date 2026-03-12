// app/legal/[slug]/page.tsx
"use client";

import { notFound } from 'next/navigation';
import { use } from 'react';

const LEGAL_DOCS: Record<string, { title: string; lastUpdated: string; sections: { heading: string; body: string }[] }> = {
  'terms': {
    title: 'Terms of Service',
    lastUpdated: '2026-03-05',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing and using POTAL ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately. POTAL provides a Total Landed Cost (TLC) calculation API and Shopify widget for cross-border commerce.',
      },
      {
        heading: '2. Service Description',
        body: 'POTAL provides an API and embeddable widget that calculates import duties, taxes, and fees for international shipments across 240 countries. The Service includes REST API endpoints, a Shopify App, and related developer tools. POTAL does not guarantee the accuracy of duty/tax calculations, as rates may change based on trade policy updates.',
      },
      {
        heading: '3. API Usage and Rate Limits',
        body: 'API access is subject to rate limits based on your subscription plan: Free (100 calls/month), Basic (2,000 calls/month, $20/mo), Pro (10,000 calls/month, $80/mo), and Enterprise (50,000 calls/month, $300/mo). For paid plans, overage calls are automatically billed at per-call rates. Exceeding your Free plan limit will result in blocked requests until the next billing cycle.',
      },
      {
        heading: '4. User Obligations',
        body: 'You agree not to: (a) use the Service for any unlawful purpose; (b) share or expose your API keys publicly; (c) interfere with or disrupt the Service or its infrastructure; (d) attempt to gain unauthorized access to any part of the Service; (e) exceed your plan rate limits through automated abuse.',
      },
      {
        heading: '5. Intellectual Property',
        body: 'All content, design, and technology of POTAL are owned by POTAL or its licensors. You may not reproduce, distribute, or create derivative works from the Service without explicit permission. The API output (duty/tax calculations) may be displayed in your application per your subscription terms.',
      },
      {
        heading: '6. Accuracy Disclaimer',
        body: 'POTAL calculations are estimates based on publicly available trade data, HS code classifications, and government tariff databases. Actual duties and taxes may vary based on customs classification, trade agreements, and regulatory changes. POTAL is not liable for discrepancies between estimated and actual charges.',
      },
      {
        heading: '7. Limitation of Liability',
        body: 'POTAL is provided "as is" without warranties of any kind. We are not responsible for: (a) inaccurate duty or tax calculations; (b) changes in trade policies; (c) any indirect, incidental, or consequential damages arising from use of the Service. Our maximum liability shall not exceed the fees paid by you in the 12 months preceding the claim.',
      },
      {
        heading: '8. Modifications',
        body: 'We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use of the Service after changes constitutes acceptance of the revised Terms.',
      },
      {
        heading: '9. Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with the laws of the Republic of Korea. Any disputes shall be resolved in the courts of competent jurisdiction in the Republic of Korea, unless otherwise required by applicable law.',
      },
      {
        heading: '10. Contact',
        body: 'For questions about these Terms, please contact us at contact@potal.app or through our Contact page.',
      },
    ],
  },

  'privacy': {
    title: 'Privacy Policy',
    lastUpdated: '2026-03-05',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect minimal data to provide and improve our Service: (a) Account information (email, name) when you register; (b) API usage data (endpoints called, request metadata); (c) Device information and browser type; (d) IP address for security and fraud prevention; (e) Shopify store information when you install our app. We do NOT store product prices or customer data from your store.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We use collected information to: (a) provide API services and manage your account; (b) monitor usage and enforce rate limits; (c) improve our calculation accuracy and Service quality; (d) detect and prevent fraud or abuse; (e) communicate about Service updates. We do NOT sell your personal information to third parties.',
      },
      {
        heading: '3. Shopify App Data Access',
        body: 'When you install the POTAL Shopify App, we access: your store URL, product data (for widget display), and theme information (for widget integration). We do not access customer personal data, payment information, or order history beyond what is needed for widget functionality.',
      },
      {
        heading: '4. Data Retention',
        body: 'API usage logs are retained for up to 12 months. Account data is retained until you request deletion. Contact contact@potal.app to request data deletion at any time.',
      },
      {
        heading: '5. Cookies',
        body: 'We use essential cookies for session management and optional analytics cookies. You can manage cookie preferences through your browser settings. We do not use cookies for advertising or cross-site tracking.',
      },
      {
        heading: '6. Security',
        body: 'We implement industry-standard security measures including HTTPS encryption, API key hashing, secure server infrastructure, and access controls. No method of Internet transmission is 100% secure.',
      },
      {
        heading: '7. Your Rights',
        body: 'Depending on your location, you may have rights to: access, correct, delete, restrict processing of, or port your data, and to opt out of analytics. Contact contact@potal.app to exercise these rights.',
      },
      {
        heading: '8. Children\'s Privacy',
        body: 'POTAL is a B2B service not intended for users under 13. We do not knowingly collect information from children under 13.',
      },
      {
        heading: '9. Changes to This Policy',
        body: 'We may update this Privacy Policy periodically. The effective date at the top indicates the latest revision.',
      },
    ],
  },

  'cookie': {
    title: 'Cookie Policy',
    lastUpdated: '2026-03-05',
    sections: [
      {
        heading: '1. What Are Cookies',
        body: 'Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.',
      },
      {
        heading: '2. Cookies We Use',
        body: 'Essential Cookies: Required for the Service to function (session management, API authentication). These cannot be disabled.\n\nAnalytics Cookies: Help us understand how visitors use POTAL (page views, API usage patterns). Anonymized and can be opted out.\n\nPreference Cookies: Remember your settings (language, dashboard preferences). Not required but enhance your experience.',
      },
      {
        heading: '3. Third-Party Cookies',
        body: 'We do NOT use advertising or tracking cookies. The POTAL widget embedded on third-party sites does not set cookies on end-user browsers.',
      },
      {
        heading: '4. Managing Cookies',
        body: 'You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Disabling essential cookies may affect Service functionality.',
      },
    ],
  },

  'privacy-settings': {
    title: 'Privacy Settings',
    lastUpdated: '2026-03-05',
    sections: [
      {
        heading: 'Your Privacy Controls',
        body: 'POTAL respects your privacy. You can manage: Analytics Cookies (help us improve), API Usage Logs (usage tracking), and Email Notifications (service updates). Visit your Dashboard settings to update preferences, or contact contact@potal.app to delete all data.',
      },
      {
        heading: 'Do Not Track',
        body: 'POTAL honors "Do Not Track" browser signals. When enabled, we will not collect analytics data from your sessions.',
      },
    ],
  },
};

export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const doc = LEGAL_DOCS[slug as keyof typeof LEGAL_DOCS];

  if (!doc) {
    notFound();
  }

  return (
    <div style={{ backgroundColor: '#ffffff' }} className="min-h-screen pb-28">
      {/* Header */}
      <div style={{ padding: '80px 24px 32px' }}>
        <div className="max-w-[800px] mx-auto">
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#02122c', marginBottom: '4px' }}>{doc.title}</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Last updated: {doc.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-6">
        <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }} className="space-y-6">
          {doc.sections.map((section, idx) => (
            <div key={idx}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#02122c', marginBottom: '8px' }}>{section.heading}</h2>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
            Questions? <a href="mailto:contact@potal.app" style={{ color: '#F59E0B', fontWeight: 700, textDecoration: 'none' }}>Contact us</a>
          </p>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none' }}>&larr; Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}
