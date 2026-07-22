import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/site/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RuledOff collects, uses, and protects data.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 21, 2026">
      <p>
        This policy explains what data RuledOff handles and why. We keep it plain. If
        anything is unclear, email{" "}
        <a href="mailto:support@ruledoff.com">support@ruledoff.com</a>.
      </p>

      <h2>Who this covers</h2>
      <p>
        There are two kinds of people in RuledOff. The <strong>bookkeeper</strong> holds
        an account with us. Their <strong>clients</strong> receive a link to respond and
        never create an account. This policy covers both.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> the bookkeeper's name, email, firm name, and
          branding settings.
        </li>
        <li>
          <strong>Client and close data:</strong> the client details you add, the items
          you request, and the answers and files your clients upload in response.
        </li>
        <li>
          <strong>Connection data:</strong> if you connect QuickBooks, the tokens needed
          to sync, stored encrypted and never exposed to the browser.
        </li>
        <li>
          <strong>Usage and technical data:</strong> basic logs needed to run and secure
          the service.
        </li>
      </ul>
      <p>
        We do not store payment card details. Billing is handled by Paddle as merchant of
        record.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the service: collecting items, sending reminders, syncing to your books.</li>
        <li>To secure and support the product, and to meet legal obligations.</li>
      </ul>
      <p>We do not sell your data, and we do not use client uploads for advertising.</p>

      <h2>Service providers we rely on</h2>
      <p>
        We share data only with the providers needed to run RuledOff, each under their own
        terms: hosting and database (Supabase), email delivery (Resend), payments
        (Paddle), accounting sync you enable (Intuit QuickBooks), and the model provider
        used to draft your reminder wording when you use that feature. These providers
        process data on our instructions.
      </p>

      <h2>Where data lives and how long</h2>
      <p>
        Data is stored with our hosting provider and encrypted in transit and at rest.
        Uploaded files sit in a private store, reachable only through short-lived signed
        links. We keep data for as long as your account is active, and remove it within a
        reasonable period after you delete it or close your account, except where we must
        keep records by law.
      </p>

      <h2>Client links</h2>
      <p>
        The links you send clients are long, random, and scoped to a single client. They
        expire, and you can revoke them at any time. See our{" "}
        <Link href="/security">security page</Link> for detail.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Access, correct, export, or delete your data.</li>
        <li>Disconnect QuickBooks, which removes the stored tokens.</li>
        <li>
          Ask us a privacy question or make a request under laws like GDPR or CCPA by
          emailing <a href="mailto:support@ruledoff.com">support@ruledoff.com</a>.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in and the product working. We
        do not use advertising trackers.
      </p>

      <h2>Changes</h2>
      <p>
        If we make a material change to this policy, we will update the date above and,
        where appropriate, tell account holders directly.
      </p>
    </LegalShell>
  );
}
