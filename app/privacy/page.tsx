import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – POTAL",
  description:
    "Privacy Policy for POTAL. How we collect, use, and protect your data when you use our global price comparison service.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: January 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            1. Introduction
          </h2>
          <p>
            POTAL (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates a
            global price comparison service that helps users compare product
            prices and shipping options across retailers including Amazon,
            AliExpress, Temu, and others. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            2. Information We Collect
          </h2>
          <p>
            We may collect information you provide directly (e.g., account
            details, search queries), information collected automatically
            (e.g., device and usage data, cookies), and information from
            third-party services (e.g., when you sign in with a provider). We use
            this to operate the service, personalize results, and improve our
            product.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            3. How We Use Your Information
          </h2>
          <p>
            We use collected information to provide and improve our comparison
            service, to communicate with you, to comply with legal obligations,
            and to analyze usage patterns. We do not sell your personal
            information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. Affiliate Disclosure and Third-Party Links
          </h2>
          <p>
            POTAL participates in affiliate marketing programs. When you click
            on product links and make a purchase, we may receive a commission
            at no extra cost to you. Specifically:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Amazon:</strong> POTAL participates in the Amazon
              Services LLC Associates Program, an affiliate advertising program
              designed to provide a means for sites to earn advertising fees by
              advertising and linking to Amazon.com and affiliated sites. As an
              Amazon Associate, we earn from qualifying purchases.
            </li>
            <li>
              <strong>AliExpress / Temu and other retailers:</strong> We may
              use affiliate or partner links to AliExpress, Temu, and other
              retailers. Clicks and purchases through these links may result in
              compensation to POTAL. Product prices and availability are
              determined by the respective retailers.
            </li>
          </ul>
          <p className="mt-3">
            Your use of third-party sites is subject to their own privacy
            policies and terms. We encourage you to read them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            5. Cookies and Analytics
          </h2>
          <p>
            We use cookies and similar technologies for authentication,
            preferences, and analytics (e.g., Google Analytics). You can manage
            cookie preferences in your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            6. Data Retention and Security
          </h2>
          <p>
            We retain your information only as long as necessary to provide our
            services and fulfill the purposes described in this policy. We
            implement reasonable technical and organizational measures to
            protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            7. Your Rights
          </h2>
          <p>
            Depending on your jurisdiction, you may have rights to access,
            correct, delete, or port your data, or to object to or restrict
            processing. Contact us at the email below to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            8. Contact
          </h2>
          <p>
            For privacy-related questions or requests, contact us at{" "}
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
