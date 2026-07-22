import type { Metadata } from "next";
import Link from "next/link";
import { ArticleShell } from "@/components/site/ArticleShell";

const DESC =
  "How bookkeepers can collect W-9s and 1099 information from contractors before the January 31 deadline, without the year-end scramble.";

export const metadata: Metadata = {
  title: "How to collect W-9s and 1099 info from contractors",
  description: DESC,
  alternates: { canonical: "/resources/collect-w9-and-1099" },
  openGraph: {
    title: "How to collect W-9s and 1099 info from contractors",
    description: DESC,
    url: "/resources/collect-w9-and-1099",
  },
};

export default function W9GuidePage() {
  return (
    <ArticleShell
      kicker="Guide"
      title="Collect W-9s and 1099s without the scramble"
      intro="Every January, the same fire drill: chasing clients for contractor details you needed weeks ago. Here is who needs a 1099, what to gather, and how to collect it before the deadline instead of during it."
    >
      <h2>Who needs a 1099-NEC</h2>
      <p>
        In general, a business files a 1099-NEC for each independent contractor or
        unincorporated vendor it paid <strong>600 dollars or more</strong> during the
        year for services. A few common exceptions:
      </p>
      <ul>
        <li>Payments to most corporations are usually exempt (with some exceptions, like attorneys)</li>
        <li>Payments made by credit card or through a processor like PayPal are reported on a 1099-K by the processor, not by your client</li>
        <li>Payments for products, rather than services, generally do not count</li>
      </ul>
      <p>
        When in doubt, collect a W-9 anyway. It is far easier to have one on file and
        not need it than to chase it in January.
      </p>

      <h2>What to collect from each contractor</h2>
      <ul>
        <li>A signed <strong>Form W-9</strong> with legal name, business name, tax classification, and TIN</li>
        <li>The total paid to that contractor for the year, for services</li>
        <li>A current mailing address for the form</li>
      </ul>

      <h2>The timeline that keeps you calm</h2>
      <ol>
        <li>Collect a W-9 the moment a client onboards a new contractor, not at year end</li>
        <li>In early December, confirm totals and addresses while the year is fresh</li>
        <li>File 1099-NEC forms to recipients and the IRS by <strong>January 31</strong></li>
      </ol>

      <h2>How to chase without the fire drill</h2>
      <p>
        The reason 1099 season hurts is that the information lives with the client and
        their contractors, not with you. RuledOff ships a{" "}
        <strong>1099 and W-9 starter pack</strong>: a ready-made request for the signed
        W-9, the contractor list and totals, and the confirmed mailing address. It goes
        out as one no-login link, and RuledOff reminds the client until it is all back.
      </p>
      <p>
        Read the <Link href="/resources/month-end-close-checklist">month-end close checklist</Link>{" "}
        for the monthly version of this, or see{" "}
        <Link href="/pricing">what RuledOff costs</Link> (one flat plan, unlimited clients).
      </p>
    </ArticleShell>
  );
}
