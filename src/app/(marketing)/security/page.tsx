import type { Metadata } from "next";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  Clock,
  Lock,
  CreditCard,
  Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

const DESC =
  "How RuledOff protects your clients' data: no client logins, private encrypted storage, magic links that expire and can be revoked, and encrypted QuickBooks tokens.";

export const metadata: Metadata = {
  title: "Security at RuledOff",
  description: DESC,
  alternates: { canonical: "/security" },
  openGraph: { title: "Security at RuledOff", description: DESC, url: "/security" },
};

type Item = { icon: LucideIcon; title: string; body: string };

const PILLARS: Item[] = [
  {
    icon: KeyRound,
    title: "No client accounts, no passwords",
    body: "Your client never creates an account. They open one link and answer. There is no client password to guess, reuse, or leak, because there is no client login at all.",
  },
  {
    icon: Clock,
    title: "Links that expire and can be revoked",
    body: "Each magic link is a long, random token scoped to a single client, valid for 30 days. You can revoke and reissue a link at any time, which instantly invalidates the old one.",
  },
  {
    icon: Database,
    title: "Private, encrypted file storage",
    body: "Uploads go to a private storage bucket, never a public URL. Files are encrypted at rest, and access is served through short-lived signed links, not open addresses.",
  },
  {
    icon: Lock,
    title: "Encrypted in transit and at rest",
    body: "Every page and request is served over HTTPS. Sensitive credentials, including QuickBooks refresh tokens, are encrypted before they are stored.",
  },
  {
    icon: ShieldCheck,
    title: "QuickBooks tokens stay server-side",
    body: "Your QuickBooks connection tokens are never exposed to the browser. They are held encrypted on the server and used only to sync the items you approve.",
  },
  {
    icon: CreditCard,
    title: "We never see card numbers",
    body: "Billing is handled by Paddle as the merchant of record. Card details go straight to Paddle. RuledOff never stores or processes your payment card data.",
  },
];

export default function SecurityPage() {
  return (
    <main>
      <SiteNav />

      <section className="mx-auto max-w-4xl px-6 sm:px-8 pb-8 pt-8 lg:pt-14">
        <Reveal>
          <p className="kicker">Security</p>
          <h1 className="mt-5 font-editorial text-[clamp(34px,4.8vw,58px)] font-medium leading-[1.06] tracking-[-0.01em] text-site-ink">
            Built so your client never has to trust a login.
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-site-secondary">
            The safest client portal is the one that does not exist. RuledOff collects
            what you need through a single, expiring link, keeps files private, and keeps
            your QuickBooks connection locked to the server. Here is exactly how.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.05}>
                  <div className="flex h-full flex-col rounded-[12px] border border-site-border bg-site-white p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-brand-50 text-brand dark:bg-brand-tint">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <h2 className="mt-4 font-editorial text-[19px] font-medium leading-[1.25] tracking-[-0.01em] text-site-ink">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-site-secondary">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-bg">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-16">
          <Reveal>
            <p className="kicker">Plainly</p>
            <h2 className="mt-4 font-editorial text-[clamp(24px,3.4vw,38px)] font-medium tracking-[-0.01em] text-site-ink">
              What we do not do.
            </h2>
            <div className="guide mt-6 flex flex-col gap-4">
              <p>
                We would rather be clear than sound impressive. RuledOff is a young
                product, so here is the honest boundary:
              </p>
              <ul>
                <li>
                  We do not claim formal certifications like SOC 2 yet. When that changes,
                  it will be stated here, not implied.
                </li>
                <li>
                  We do not ask your client for anything beyond the documents and answers
                  you request. No account, no marketing, no upsell.
                </li>
                <li>
                  We do not store your payment card details. Billing runs through Paddle.
                </li>
                <li>
                  You control access. Revoke a client link, or disconnect QuickBooks, and
                  the access is gone.
                </li>
              </ul>
              <p>
                Have a security question before you trust us with a client close?{" "}
                <Link href="/#faq">Read the FAQ</Link>, or reach out and we will answer
                straight.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-site-border bg-site-paper">
        <div className="mx-auto max-w-3xl px-6 sm:px-8 py-16 text-center">
          <Reveal>
            <h2 className="font-editorial text-[clamp(24px,3.4vw,36px)] font-medium tracking-[-0.01em] text-site-ink">
              Collect the close, keep it private.
            </h2>
            <div className="mt-7 flex justify-center">
              <Button href="/signup">Start free for 14 days</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
