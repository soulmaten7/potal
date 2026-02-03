import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – POTAL",
  description:
    "Terms of Service for POTAL. Rules and conditions for using our global price comparison service.",
};

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: January 2026</p>

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
            POTAL is a global price comparison service that aggregates product
            information, prices, and shipping options from multiple retailers
            (including but not limited to Amazon, AliExpress, Temu, and others)
            to help you find the best deals. We do not sell products directly;
            we link you to third-party retailers. Availability, pricing, and
            terms of sale are determined by those retailers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            3. Affiliate Disclosure
          </h2>
          <p>
            POTAL participates in affiliate marketing programs. This means we
            may earn fees when you click on links to retailer sites and make
            purchases. This does not increase the price you pay. Specifically:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Amazon Services LLC Associates Program:</strong> POTAL
              participates in the Amazon Services LLC Associates Program, an
              affiliate advertising program designed to provide a means for
              sites to earn advertising fees by advertising and linking to
              Amazon.com and affiliated sites. As an Amazon Associate, we earn
              from qualifying purchases.
            </li>
            <li>
              <strong>Other retailers (e.g., AliExpress, Temu):</strong> We may
              use affiliate or partner links to other retailers. Clicks and
              qualifying purchases through these links may result in
              compensation to POTAL. We are not responsible for the accuracy of
              third-party product data, pricing, or fulfillment.
            </li>
          </ul>
          <p className="mt-3">
            By using our links, you acknowledge that we may receive commission
            from purchases you make on third-party sites. All product and
            purchase decisions are between you and the respective retailer.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. User Conduct
          </h2>
          <p>
            You agree to use the Service only for lawful purposes. You may not
            scrape, automate access, circumvent restrictions, or use the Service
            in any way that could harm us or third parties. You are responsible
            for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            5. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available.&quot; We do not guarantee the accuracy, completeness, or
            timeliness of product or price data from third parties. We are not
            liable for any transactions you enter into with retailers. Your use
            of third-party sites is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            6. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, POTAL and its affiliates
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or for any loss of profits or
            data, arising from your use of the Service or any third-party
            links.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            7. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the United States. Any
            disputes shall be resolved in the courts of competent jurisdiction
            in the United States, unless otherwise required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            8. Contact
          </h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:support@potal.com"
              className="text-indigo-600 hover:underline"
            >
              support@potal.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
