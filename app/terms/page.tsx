import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – POTAL",
  description:
    "Terms of Service for POTAL. Rules and conditions for using our Total Landed Cost API and Shopify app.",
};

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-slate-600 mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using POTAL (&quot;Service&quot;), you agree to be
            bound by these Terms of Service. If you do not agree, do not use the
            Service. We may update these terms from time to time; continued use
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            2. Description of Service
          </h2>
          <p>
            POTAL is a Total Landed Cost API and Shopify app that helps
            e-commerce sellers calculate and display import duties, taxes, and
            fees for international orders. Our service provides real-time
            calculations covering 240 countries using AI-powered HS Code
            classification, FTA detection, and de minimis rules. We provide
            calculation tools and data — actual customs charges are determined
            by the destination country&apos;s customs authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            3. Plans and Access
          </h2>
          <p>
            POTAL provides all features free of charge — forever. There are
            no paid tiers, no usage limits, and no hidden fees. You are
            responsible for securing your API keys and must not share them
            publicly. Enterprise organizations may contact us for dedicated
            support and custom SLAs.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Forever Free Plan:</strong> All 140 features, all 240 countries, all 155+ API endpoints — free forever with no usage limits.
            </li>
            <li>
              <strong>Enterprise:</strong> For organizations requiring dedicated support, custom SLAs, or on-premise deployment —{" "}
              <a href="/contact" className="text-amber-600 hover:underline">Contact Us</a>.
            </li>
          </ul>
          <p className="mt-3">
            As POTAL is free to use, no payment processing is required for
            standard access. Enterprise agreements, if any, will be handled
            directly. See our{" "}
            <a href="/refund" className="text-amber-600 hover:underline">
              Refund Policy
            </a>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. Service Availability
          </h2>
          <p>
            POTAL is provided free of charge. We strive to maintain high
            availability but do not guarantee uninterrupted service. We may
            perform maintenance or updates that temporarily affect availability.
            Enterprise users with custom SLAs will be notified in advance of
            planned maintenance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            5. Shopify App
          </h2>
          <p>
            If you install the POTAL Shopify app, you grant us access to
            read your store&apos;s product catalog, order data, and shipping
            information as needed to calculate landed costs. We access only
            the data scopes approved during installation (read_products,
            read_orders, read_shipping). We do not modify your store data.
            You may uninstall the app at any time through your Shopify admin.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            6. Accuracy Disclaimer
          </h2>
          <p>
            POTAL provides duty and tax estimates based on publicly available
            tariff data, trade agreements, and AI classification. These are
            estimates only. Actual charges may vary based on customs
            valuation, origin verification, and local regulations. POTAL is
            not a licensed customs broker and does not guarantee the accuracy
            of calculations. You should consult a licensed customs broker for
            binding tariff classifications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            7. User Conduct
          </h2>
          <p>
            You agree to use the Service only for lawful purposes. You may not
            scrape, reverse-engineer, or abuse the API beyond your plan&apos;s
            rate limits. You are responsible for maintaining the confidentiality
            of your API keys and account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            8. Service Availability
          </h2>
          <p>
            We aim to maintain high availability of the Service but do not
            guarantee uninterrupted access. Planned maintenance will be
            communicated in advance when possible. For Enterprise plan
            customers, uptime commitments are defined in a separate Service
            Level Agreement (SLA). POTAL shall not be liable for any downtime
            or service interruptions beyond our reasonable control.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            9. Limitation of Liability
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available.&quot; To the maximum extent permitted by law, POTAL&apos;s
            total aggregate liability for any claims arising from your use of
            the Service shall not exceed the amount you paid to POTAL in the
            twelve (12) months preceding the claim. POTAL shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages, including but not limited to incorrect duty calculations,
            customs delays, lost profits, or additional charges assessed by
            customs authorities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            10. Termination
          </h2>
          <p>
            You may terminate your account at any time by canceling your
            subscription and deleting your account through the POTAL dashboard.
            We may suspend or terminate your access if you violate these Terms,
            engage in fraudulent activity, or abuse the Service. Upon
            termination, your API keys will be revoked and access to paid
            features will cease at the end of the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            11. Intellectual Property
          </h2>
          <p>
            All content, features, and functionality of the Service, including
            but not limited to tariff data compilations, algorithms, software,
            APIs, and trademarks, are owned by POTAL and protected by
            intellectual property laws. Your subscription grants you a limited,
            non-exclusive, non-transferable license to use the Service for your
            internal business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            12. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the Republic of Korea. Any
            disputes shall be resolved in the courts of competent jurisdiction
            in the Republic of Korea, unless otherwise required by applicable
            law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            13. Contact
          </h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:contact@potal.app"
              className="text-amber-600 hover:underline"
            >
              contact@potal.app
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
