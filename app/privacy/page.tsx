import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – POTAL",
  description:
    "Privacy Policy for POTAL. Learn how we collect, use, and protect your data when using our Total Landed Cost calculation service and Shopify app.",
};

export default function PrivacyPage() {
  return (
    <article style={{ backgroundColor: "#ffffff", color: "#02122c" }} className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>
          Last updated: March 2026
        </p>

        <div style={{ lineHeight: "1.7", color: "#334155" }} className="space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              1. Introduction
            </h2>
            <p>
              POTAL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a Total Landed Cost calculation infrastructure platform operated by EUNTAE JANG. We help e-commerce merchants and AI shopping agents calculate accurate import duties, taxes, and fees for international orders across 181 countries. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website at potal.app, our Shopify app, our API services, and all related services, features, and functionality (collectively, the &quot;Service&quot;).
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We collect information in several ways depending on how you interact with our Service:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li>
                <strong>Account Information:</strong> When you sign up as a merchant, we collect your email address and authentication credentials (via email/password or Google OAuth through Supabase Auth).
              </li>
              <li>
                <strong>API Usage Data:</strong> When you use our API, we log API requests including endpoints called, request parameters (product descriptions, HS codes, origin/destination countries), response times, and usage counts for billing and service improvement purposes.
              </li>
              <li>
                <strong>Shopify Store Data:</strong> When you install our Shopify app, we receive your store domain, access tokens, and basic store information through Shopify&apos;s OAuth process. We store this securely to provide our service to your store.
              </li>
              <li>
                <strong>Billing Information:</strong> Payment processing is handled by Stripe. We do not store credit card numbers or full payment details on our servers. Stripe may collect billing address and payment method information.
              </li>
              <li>
                <strong>Device and Usage Data:</strong> We automatically collect information about your device (type, OS, browser), IP address, pages visited, and usage analytics to improve our platform.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              3. How We Use Your Information
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We use the information we collect for the following purposes:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px" }} className="space-y-2">
              <li>To provide, maintain, and improve the Service including Total Landed Cost calculations</li>
              <li>To process API requests and deliver accurate duty, tax, and fee calculations</li>
              <li>To manage your merchant account and API keys</li>
              <li>To process billing and subscription management through Stripe</li>
              <li>To monitor API usage and enforce rate limits per your subscription plan</li>
              <li>To improve HS code classification accuracy through aggregated, anonymized usage patterns</li>
              <li>To detect, prevent, and address fraudulent activity and security issues</li>
              <li>To comply with legal obligations</li>
              <li>To communicate service updates and important notices</li>
            </ul>
          </section>

          {/* 4. Shopify App Data */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              4. Shopify App Data
            </h2>
            <p style={{ marginBottom: "12px" }}>
              When you install the POTAL Shopify app:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li>We access your store&apos;s product data (names, descriptions, prices) solely to calculate landed costs</li>
              <li>We access order and shipping information to provide accurate duty and tax estimates</li>
              <li>We do not access or store customer personal information (names, addresses, payment details) from your Shopify store</li>
              <li>All data access is limited to the scopes explicitly granted during app installation (read_orders, read_products, read_shipping)</li>
            </ul>
            <p>
              We comply with Shopify&apos;s API Terms of Service and Partner Program Agreement. You can revoke our access at any time by uninstalling the app from your Shopify admin.
            </p>
          </section>

          {/* 5. Data Storage and Technology Partners */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              5. Data Storage and Technology Partners
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We use the following technology partners to operate our Service:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px" }} className="space-y-2">
              <li>
                <strong>Supabase:</strong> Database storage and authentication. Implements industry-standard encryption and security measures.
              </li>
              <li>
                <strong>Vercel:</strong> Application hosting and deployment with edge network delivery.
              </li>
              <li>
                <strong>Stripe:</strong> Payment processing and subscription management. PCI DSS Level 1 compliant.
              </li>
              <li>
                <strong>Shopify:</strong> E-commerce platform integration via OAuth and API.
              </li>
              <li>
                <strong>OpenAI:</strong> AI-powered HS code classification (product descriptions are sent for classification; no personal data is shared).
              </li>
            </ul>
          </section>

          {/* 6. Data Security */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              6. Data Security
            </h2>
            <p>
              We implement reasonable technical, administrative, and physical security measures to protect your information. All data transmission uses HTTPS/TLS encryption. API keys are hashed before storage. Shopify access tokens are stored encrypted in our database. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              7. Data Retention
            </h2>
            <p>
              We retain account data for as long as your account is active. API usage logs are retained for billing verification and service improvement for up to 12 months. Cached tariff data (HS codes, duty rates) is retained to improve service performance. When you delete your account or uninstall our Shopify app, we will delete your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          {/* 8. Data Sharing */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              8. Data Sharing and Third Parties
            </h2>
            <p style={{ marginBottom: "12px" }}>
              <strong>We do not sell your personal data to third parties.</strong> We may share information with:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li><strong>Service Providers:</strong> Supabase, Vercel, Stripe, and OpenAI who process data on our behalf under strict confidentiality obligations</li>
              <li><strong>Legal Compliance:</strong> Government authorities when required by law or to protect our rights and safety</li>
              <li><strong>Business Transitions:</strong> In the event of merger, acquisition, or sale of assets, your data may be transferred as part of that transaction</li>
            </ul>
          </section>

          {/* 9. GDPR Compliance */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              9. GDPR and International Data Protection
            </h2>
            <p style={{ marginBottom: "12px" }}>
              For users in the European Economic Area (EEA), United Kingdom, and other jurisdictions with data protection laws, you have the following rights:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (right to be forgotten)</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Restriction:</strong> Request restriction of processing of your data</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
            </ul>
            <p>
              We process data based on contractual necessity (providing the Service), legitimate interest (improving our Service), and consent (where applicable). To exercise any of these rights, please contact us at the email below.
            </p>
          </section>

          {/* 10. Shopify Mandatory Webhooks */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              10. Shopify Data Protection Requests
            </h2>
            <p>
              We support Shopify&apos;s mandatory data protection webhooks including: customer data request, customer data erasure, and shop data erasure. When a customer or merchant requests data deletion through Shopify, we process these requests promptly and delete all associated data from our systems.
            </p>
          </section>

          {/* 11. Children's Privacy */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              11. Children&apos;s Privacy
            </h2>
            <p>
              POTAL is a B2B service designed for e-commerce merchants and developers. It is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          {/* 12. Changes */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              12. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by updating the &quot;Last updated&quot; date at the top of this policy. Your continued use of the Service after modifications constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#02122c" }}>
              13. Contact Us
            </h2>
            <p style={{ marginBottom: "12px" }}>
              If you have questions, concerns, or requests regarding this Privacy Policy, please contact us at:
            </p>
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "12px"
            }}>
              <p style={{ marginBottom: "8px" }}>
                <strong>POTAL</strong><br />
                Developer: EUNTAE JANG (장은태)<br />
                Email:{" "}
                <a href="mailto:contact@potal.app" style={{ color: "#F59E0B", textDecoration: "none" }}>
                  contact@potal.app
                </a>
              </p>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: "8px" }}>
                We will respond to all inquiries within 30 days.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "24px",
            marginTop: "32px",
            fontSize: "12px",
            color: "#94a3b8"
          }}>
            <p>
              This Privacy Policy is provided in English. If you access POTAL from outside the United States, please be aware that your information may be transferred to, stored in, and processed in the United States and other countries that may have different data protection laws than your country of residence.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
