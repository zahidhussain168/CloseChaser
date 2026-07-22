import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/site/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of RuledOff.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 21, 2026">
      <p>
        These terms govern your use of RuledOff. By creating an account or using the
        service, you agree to them. Please read them alongside our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. What RuledOff is</h2>
      <p>
        RuledOff is a tool for bookkeepers to collect the documents, receipts, and
        answers needed to close a client's books, and to follow up with that client
        automatically. You are the account holder. Your clients receive links to respond
        and never create an account with us.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure.</li>
        <li>You are responsible for activity under your account.</li>
        <li>You must have the right to request and store the client data you upload or collect.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to use RuledOff to:</p>
      <ul>
        <li>Break the law or infringe anyone's rights.</li>
        <li>Upload malware, or attempt to breach or overload the service.</li>
        <li>Send unsolicited messages, or collect data you are not authorized to collect.</li>
      </ul>

      <h2>4. Billing</h2>
      <p>
        Paid plans are billed through Paddle, our merchant of record, at the price shown
        at signup. Subscriptions renew until cancelled. You can cancel at any time and
        keep access through the end of the paid period. Taxes are handled by Paddle where
        applicable. We do not store your card details.
      </p>

      <h2>5. Third-party services</h2>
      <p>
        RuledOff connects to services you choose, such as QuickBooks Online, and relies
        on providers for hosting, email delivery, and payments. Your use of a connected
        service is also governed by that service's own terms.
      </p>

      <h2>6. Your data</h2>
      <p>
        You own the data you and your clients put into RuledOff. We process it to provide
        the service, as described in our <Link href="/privacy">Privacy Policy</Link>. You
        can export or request deletion of your data. If you close your account, we remove
        your data within a reasonable period, except where we must keep records by law.
      </p>

      <h2>7. Availability and changes</h2>
      <p>
        We work to keep RuledOff running but do not guarantee uninterrupted service. We
        may update, add, or remove features. If we make a material change to these terms,
        we will let account holders know.
      </p>

      <h2>8. Warranties and liability</h2>
      <p>
        RuledOff is provided as is, without warranties of any kind. To the extent
        permitted by law, our liability for any claim relating to the service is limited
        to the amount you paid us in the twelve months before the claim. RuledOff is a
        tool to help you manage a close. It is not accounting, tax, or legal advice.
      </p>

      <h2>9. Termination</h2>
      <p>
        You can stop using RuledOff and close your account at any time. We may suspend or
        end access if these terms are broken, with notice where practical.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:support@ruledoff.com">support@ruledoff.com</a>.
      </p>
    </LegalShell>
  );
}
