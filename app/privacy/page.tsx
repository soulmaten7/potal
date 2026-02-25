import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – POTAL",
  description:
    "Privacy Policy for POTAL. Learn how we collect, use, and protect your data when using our global price comparison service.",
};

export default function PrivacyPage() {
  return (
    <article style={{ backgroundColor: "#02122c", color: "#ffffff" }} className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "32px" }}>
          Last updated: February 2026
        </p>

        <div style={{ lineHeight: "1.7", color: "rgba(255,255,255,0.85)" }} className="space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              1. Introduction
            </h2>
            <p>
              POTAL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a global price comparison shopping service operated by EUNTAE JANG. We help users compare product prices across major online retailers including Amazon, Walmart, eBay, Target, and AliExpress. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit and use our website and mobile application at potal.app, including all related services, features, and functionality (collectively, the &quot;Service&quot;).
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We collect information in several ways:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li>
                <strong>Search and Interaction Data:</strong> When you use our search features (text search, image search via camera or photo upload, voice search via microphone), we process your search queries to provide price comparisons. This data is used to improve search accuracy and service performance.
              </li>
              <li>
                <strong>User Preferences:</strong> We store information about your preferences such as your ZIP code, preferred retailers, sorting preferences, and notification settings via cookies. This enables personalization of your experience.
              </li>
              <li>
                <strong>Wishlist and History:</strong> If you create a wishlist or save items, we store this data in our Supabase database to allow you to access your saved items across sessions and devices.
              </li>
              <li>
                <strong>Device and Usage Data:</strong> We automatically collect information about your device (type, OS, browser), IP address, pages visited, time spent, clicks, and other usage analytics through Google Analytics and similar technologies.
              </li>
              <li>
                <strong>Cookies:</strong> We use cookies and similar tracking technologies to remember preferences, maintain sessions, and analyze usage patterns.
              </li>
            </ul>
            <p>
              <strong>Note on Account Requirements:</strong> POTAL does not require you to create an account or provide personal identification to use our service. We do not collect names, email addresses, or personal contact information unless voluntarily provided (e.g., through a contact form or support inquiry).
            </p>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              3. How We Use Your Information
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We use the information we collect for the following purposes:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px" }} className="space-y-2">
              <li>To provide, maintain, and improve the Service</li>
              <li>To personalize your experience and deliver customized content and search results</li>
              <li>To process search queries and deliver price comparison results</li>
              <li>To monitor and analyze usage trends, user engagement, and service performance</li>
              <li>To detect, prevent, and address fraudulent activity and security issues</li>
              <li>To comply with legal obligations and requests from authorities</li>
              <li>To communicate updates, feature announcements, and service changes</li>
            </ul>
          </section>

          {/* 4. Data Storage and Technology Partners */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              4. Data Storage and Technology Partners
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We use the following technology partners to operate our Service:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px" }} className="space-y-2">
              <li>
                <strong>Supabase:</strong> We use Supabase for secure database storage of user preferences, wishlist items, and recent search history. Supabase implements industry-standard encryption and security measures.
              </li>
              <li>
                <strong>Google Analytics:</strong> We use Google Analytics to track and analyze user behavior, traffic patterns, and service usage to improve our platform.
              </li>
              <li>
                <strong>Web APIs:</strong> Our Service uses your device&apos;s camera, photo library, and microphone (via Web Speech API) to enable image and voice search features. These features operate with your explicit permission and are handled locally on your device whenever possible.
              </li>
            </ul>
          </section>

          {/* 5. Third-Party Retailers and Affiliate Links */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              5. Third-Party Retailers and Affiliate Links
            </h2>
            <p style={{ marginBottom: "12px" }}>
              POTAL is a price comparison service that links to products on third-party retailer websites. When you click on product links and navigate to Amazon, Walmart, eBay, Target, AliExpress, or other retailers, you are subject to their respective privacy policies and terms of service. We have no control over their data practices.
            </p>
            <p style={{ marginBottom: "12px" }}>
              <strong>Affiliate Relationships:</strong> POTAL may participate in affiliate marketing programs with retailers including Amazon Associates Program. When you make a purchase through our links, we may receive a referral commission at no additional cost to you. This does not influence the accuracy of our price comparisons.
            </p>
            <p>
              We encourage you to review the privacy policies of these retailers before providing them with your personal information.
            </p>
          </section>

          {/* 6. Cookies and Tracking Technologies */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              6. Cookies and Tracking Technologies
            </h2>
            <p style={{ marginBottom: "12px" }}>
              We use cookies and similar technologies (including localStorage and sessionStorage) for the following purposes:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li><strong>Essential Cookies:</strong> To maintain session information and ensure the Service functions properly</li>
              <li><strong>Preference Cookies:</strong> To remember your ZIP code, preferred retailers, sorting preferences, and other settings</li>
              <li><strong>Analytics Cookies:</strong> To track usage patterns and improve the Service through Google Analytics</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect your ability to use certain features of our Service.
            </p>
          </section>

          {/* 7. Data Security */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              7. Data Security
            </h2>
            <p>
              We implement reasonable technical, administrative, and physical security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. Our Service uses HTTPS encryption for all data transmission. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              8. Data Retention
            </h2>
            <p>
              We retain personal and usage data only as long as necessary to provide our Service and fulfill the purposes outlined in this policy. Preference data stored in cookies is typically retained for up to 1 year or until deleted. Wishlist and search history data stored in Supabase is retained as long as you use the Service. Analytics data is typically retained for 26 months. You can request deletion of your data at any time by contacting us.
            </p>
          </section>

          {/* 9. Data Sharing and Third Parties */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              9. Data Sharing and Third Parties
            </h2>
            <p style={{ marginBottom: "12px" }}>
              <strong>We do not sell your personal data to third parties.</strong> We may share information with:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li><strong>Service Providers:</strong> Supabase and Google Analytics who process data on our behalf under strict confidentiality obligations</li>
              <li><strong>Legal Compliance:</strong> Government authorities when required by law or to protect our rights and safety</li>
              <li><strong>Business Transitions:</strong> In the event of merger, acquisition, or sale of assets, your data may be transferred as part of that transaction</li>
            </ul>
            <p>
              We do not share your data with retailers for marketing purposes, and retailers only receive information directly from your interaction with their websites.
            </p>
          </section>

          {/* 10. Mobile App (WebView) */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              10. Mobile App and WebView
            </h2>
            <p>
              POTAL offers an iOS mobile application that loads potal.app through a WebView. This privacy policy applies equally to the mobile app and website. The mobile app may request permissions for camera access (for image search), photo library access (for image uploads), and microphone access (for voice search). These permissions are requested only when needed and are handled by your device&apos;s operating system.
            </p>
          </section>

          {/* 11. User Rights and Choices */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              11. User Rights and Choices
            </h2>
            <p style={{ marginBottom: "12px" }}>
              Depending on your location, you may have certain rights regarding your data:
            </p>
            <ul style={{ listStyleType: "disc", paddingLeft: "24px", marginBottom: "12px" }} className="space-y-2">
              <li><strong>Access:</strong> You can request a copy of the data we hold about you</li>
              <li><strong>Correction:</strong> You can request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> You can request deletion of your data (right to be forgotten)</li>
              <li><strong>Portability:</strong> You can request your data in a portable format</li>
              <li><strong>Opt-out:</strong> You can opt out of analytics tracking and certain cookies</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* 12. Children's Privacy */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              12. Children&apos;s Privacy
            </h2>
            <p>
              POTAL is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will delete such information immediately. If you believe we have collected information from a child under 13, please contact us.
            </p>
          </section>

          {/* 13. Changes to This Privacy Policy */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              13. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by updating the &quot;Last updated&quot; date at the top of this policy. Your continued use of the Service after any such modifications constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 14. Contact Us */}
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#ffffff" }}>
              14. Contact Us
            </h2>
            <p style={{ marginBottom: "12px" }}>
              If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
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
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>
                We will respond to all inquiries within 30 days.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "24px",
            marginTop: "32px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)"
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
