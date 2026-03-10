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
      <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

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
            3. Subscription Plans and Billing
          </h2>
          <p>
            Access to the POTAL API is governed by your subscription plan.
            Each plan includes a monthly API call allocation. Usage beyond
            your plan&apos;s limits may result in rate limiting or additional
            charges depending on your plan tier. You are responsible for
            securing your API keys and must not share them publicly.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Free Plan:</strong> 500 API calls per month.
            </li>
            <li>
              <strong>Starter Plan:</strong> 5,000 API calls per month ($9/mo).
            </li>
            <li>
              <strong>Growth Plan:</strong> 25,000 API calls per month ($29/mo).
            </li>
            <li>
              <strong>Enterprise Plan:</strong> Custom volume and pricing.
            </li>
          </ul>
          <p className="mt-3">
            All paid subscriptions are billed through Paddle.com, our Merchant of
            Record. By subscribing, you also agree to{" "}
            <a
              href="https://www.paddle.com/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:underline"
            >
              Paddle&apos;s Terms of Service
            </a>
            . Paddle handles all payment processing, invoicing, sales tax, and
            VAT on our behalf. You may cancel your subscription at any time
            through your POTAL dashboard; cancellation takes effect at the end
            of the current billing cycle. See our{" "}
            <a href="/refund" className="text-amber-600 hover:underline">
              Refund Policy
            </a>{" "}
            for details on refunds.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. Free Trial
          </h2>
          <p>
            Certain paid plans may include a free trial period. You will not be
            charged during the trial. If you do not cancel before the trial
            ends, your subscription will automatically convert to a paid plan
            at the listed price. You may cancel at any time during the trial
            without charge.
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
