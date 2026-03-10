import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy – POTAL",
  description:
    "Refund Policy for POTAL. Learn about our refund and cancellation terms for subscription plans.",
};

export default function RefundPage() {
  return (
    <article className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Refund Policy
      </h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            1. Overview
          </h2>
          <p>
            POTAL is a B2B SaaS platform that provides Total Landed Cost
            calculation APIs and widgets. All paid subscriptions are processed
            through Paddle.com, our Merchant of Record. This Refund Policy
            outlines the terms under which refunds may be issued for POTAL
            subscription plans.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            2. Free Trial
          </h2>
          <p>
            Certain paid plans include a free trial period. During the trial,
            you have full access to the plan&apos;s features at no cost. If you
            cancel before the trial period ends, you will not be charged. If you
            do not cancel, your subscription will automatically convert to a
            paid plan at the end of the trial.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            3. Cancellation
          </h2>
          <p>
            You may cancel your subscription at any time through the POTAL
            dashboard. Upon cancellation, you will retain access to your paid
            plan features until the end of the current billing cycle. No
            further charges will be made after cancellation. Cancellation does
            not automatically trigger a refund for the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            4. Refund Eligibility
          </h2>
          <p>
            We offer refunds under the following circumstances:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Within 7 days of first payment:</strong> If you are
              unsatisfied with the Service within the first 7 days of your
              initial paid subscription, you may request a full refund. This
              applies to first-time subscribers only.
            </li>
            <li>
              <strong>Service outage:</strong> If the POTAL API experiences
              extended downtime (more than 48 consecutive hours) that materially
              impacts your ability to use the Service, you may request a
              pro-rata refund or credit for the affected period.
            </li>
            <li>
              <strong>Billing errors:</strong> If you are charged incorrectly
              (e.g., duplicate charges, wrong plan amount), we will issue a full
              refund for the erroneous charge promptly.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            5. Non-Refundable Cases
          </h2>
          <p>
            Refunds are generally not provided in the following cases:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              Requests made more than 7 days after the initial payment (for
              first-time subscriber refunds).
            </li>
            <li>
              Partial month usage after cancellation — you retain access until
              the end of the billing cycle.
            </li>
            <li>
              API calls already consumed during the billing period.
            </li>
            <li>
              Inaccurate duty or tax calculations — as stated in our Terms of
              Service, POTAL provides estimates only and is not liable for
              differences between calculated and actual customs charges.
            </li>
            <li>
              Failure to cancel before a free trial converts to a paid
              subscription, unless the request is made within 48 hours of
              conversion.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            6. How to Request a Refund
          </h2>
          <p>
            To request a refund, please contact us at{" "}
            <a
              href="mailto:contact@potal.app"
              className="text-amber-600 hover:underline"
            >
              contact@potal.app
            </a>{" "}
            with the following information:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Your account email address</li>
            <li>Subscription plan and billing date</li>
            <li>Reason for the refund request</li>
          </ul>
          <p className="mt-3">
            We will review your request and respond within 5 business days. If
            approved, refunds will be processed through Paddle and returned to
            your original payment method. Please allow 5–10 business days for
            the refund to appear on your statement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            7. Downgrades
          </h2>
          <p>
            If you downgrade to a lower plan or to the Free plan, the change
            takes effect at the start of the next billing cycle. No refund is
            issued for the remaining time on the higher plan — you continue to
            enjoy the higher plan&apos;s features until the cycle ends.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            8. Enterprise Plans
          </h2>
          <p>
            Enterprise plan customers with custom contracts may have separate
            refund and cancellation terms as specified in their individual
            agreements. Please refer to your Enterprise agreement or contact
            your account manager for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Refund Policy from time to time. Changes will be
            reflected by the &quot;Last updated&quot; date at the top of this
            page. Your continued use of the Service after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">
            10. Contact
          </h2>
          <p>
            For any questions about this Refund Policy, please contact us at{" "}
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
