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
            calculations covering 139+ countries using AI-powered HS Code
            classification, FTA detection, and de minimis rules. We provide
            calculation tools and data — actual customs charges are determined
            by the destination country&apos;s customs authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            3. API Usage and Rate Limits
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
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. Shopify App
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
            5. Accuracy Disclaimer
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
            6. User Conduct
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
            7. Limitation of Liability
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available.&quot; To the maximum extent permitted by law, POTAL
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to
            incorrect duty calculations, customs delays, or additional charges
            assessed by customs authorities, arising from your use of the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            8. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the United States. Any
            disputes shall be resolved in the courts of competent jurisdiction
            in the United States, unless otherwise required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            9. Contact
          </h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:support@potal.app"
              className="text-amber-600 hover:underline"
            >
              support@potal.app
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
