import type { Metadata } from "next";
import Link from "next/link";
import { ArticleShell } from "@/components/site/ArticleShell";

const DESC =
  "A step-by-step approach to catch-up and cleanup bookkeeping: what documents to request, how to work month by month, and how to get everything from a busy client.";

export const metadata: Metadata = {
  title: "Catch-up bookkeeping: how to get documents from a client",
  description: DESC,
  alternates: { canonical: "/resources/catch-up-bookkeeping" },
  openGraph: {
    title: "Catch-up bookkeeping: how to get documents from a client",
    description: DESC,
    url: "/resources/catch-up-bookkeeping",
  },
};

export default function CatchUpGuidePage() {
  return (
    <ArticleShell
      kicker="Guide"
      title="Catch-up bookkeeping, without the back-and-forth"
      intro="A new client with months of untouched books, or an existing one who fell behind. Catch-up work is mostly a document problem: you cannot reconcile what you cannot see. Here is how to gather it in order and start clean."
    >
      <h2>What catch-up really means</h2>
      <p>
        Catch-up bookkeeping is bringing a set of books current after a gap, whether
        that is three months or two years. Cleanup is fixing books that were kept, but
        kept wrong. Both start the same way: get the source documents in hand before you
        touch a single entry.
      </p>

      <h2>The documents to request first</h2>
      <p>
        Ask for the whole period up front. Requesting one month at a time turns a two
        week job into a two month one:
      </p>
      <ul>
        <li>Bank statements for every account, every month in the gap, all pages</li>
        <li>Credit card statements for the same period</li>
        <li>Loan statements and any financing agreements</li>
        <li>The prior year tax return, so the opening balances tie out</li>
        <li>Payroll reports if payroll ran during the period</li>
        <li>A list of regular vendors and what the business actually does</li>
      </ul>

      <h2>Work month by month</h2>
      <ol>
        <li>Start at the last reconciled month, or the prior return, whichever is more recent</li>
        <li>Reconcile one month fully before moving to the next</li>
        <li>Keep a running list of transactions only the client can explain</li>
        <li>Send that list of questions in batches, not one at a time</li>
      </ol>

      <h2>Getting it from a busy client</h2>
      <p>
        The client who fell behind on their books is not going to log into a portal to
        help you catch them up. That is exactly the wall most catch-up projects hit.
      </p>
      <p>
        RuledOff sends one no-login link that holds the whole request: every statement,
        every question about an unexplained transaction, all in one place, saved as they
        go. It reminds them on a schedule so you are not the one nagging, and posts what
        comes back into the books. Pair it with the{" "}
        <Link href="/resources/month-end-close-checklist">month-end close checklist</Link>{" "}
        once you are caught up, and see{" "}
        <Link href="/compare/uncat">how RuledOff compares to Uncat</Link> for the
        transaction-cleanup side.
      </p>
    </ArticleShell>
  );
}
