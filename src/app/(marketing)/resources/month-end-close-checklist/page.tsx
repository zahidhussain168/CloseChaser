import type { Metadata } from "next";
import Link from "next/link";
import { ArticleShell } from "@/components/site/ArticleShell";

const DESC =
  "A practical month-end close checklist for bookkeepers: what to reconcile, what to request from the client, and how to close the books on time every month.";

export const metadata: Metadata = {
  title: "The month-end close checklist for bookkeepers",
  description: DESC,
  alternates: { canonical: "/resources/month-end-close-checklist" },
  openGraph: {
    title: "The month-end close checklist for bookkeepers",
    description: DESC,
    url: "/resources/month-end-close-checklist",
  },
};

export default function MonthEndChecklistPage() {
  return (
    <ArticleShell
      kicker="Guide"
      title="The month-end close checklist"
      intro="A close runs late for one reason more than any other: something is still missing from the client. This is the repeatable list that gets every month over the line, and the part you can hand off so you are not the reminder system."
    >
      <h2>Before you start</h2>
      <p>
        Set a target close date and work backward. A close that has a deadline gets
        done. Open the period in your books, and make sure last month is locked so
        nothing drifts.
      </p>

      <h2>What to request from the client</h2>
      <p>
        This is the part that stalls closes, because it depends on someone else. Ask
        for all of it at once, early, so a slow reply on one item does not hold up the
        rest:
      </p>
      <ul>
        <li>Bank statements for every account, all pages, for the month</li>
        <li>Credit card statements for the month</li>
        <li>An explanation for each uncategorized or Ask My Accountant transaction</li>
        <li>Receipts for larger or unusual charges</li>
        <li>The purpose of any transfers between accounts</li>
        <li>Owner draws, contributions, or anything personal that ran through the business</li>
        <li>New loans, lines of credit, or large asset purchases</li>
        <li>Payroll reports if payroll runs outside the books</li>
      </ul>

      <h2>Reconcile</h2>
      <ul>
        <li>Reconcile every bank and credit card account to the statement</li>
        <li>Clear the uncategorized account to zero</li>
        <li>Match deposits to income, and confirm nothing is double counted</li>
        <li>Reconcile loans and confirm the interest and principal split</li>
      </ul>

      <h2>Review before you close</h2>
      <ul>
        <li>Scan the profit and loss for anything that looks off month over month</li>
        <li>Check the balance sheet for negative balances or stray amounts</li>
        <li>Confirm sales tax and payroll liabilities tie out</li>
        <li>Note anything you had to assume, so next month is faster</li>
      </ul>

      <h2>Close and lock</h2>
      <p>
        Once it ties out, lock the period so the numbers stay put, and send the client
        a short note that the month is done. That final mark, the books ruled off, is
        the whole job.
      </p>

      <h2>How RuledOff helps</h2>
      <p>
        The request step above is the one that eats your evenings. RuledOff pulls the
        uncategorized transactions from{" "}
        <Link href="/#features">QuickBooks</Link>, adds your document and statement
        requests, and sends the client one no-login link. It chases them on a schedule
        and stops the moment everything is in, then posts the answers and receipts back
        to the books. See how it{" "}
        <Link href="/#how">works end to end</Link>, or read the{" "}
        <Link href="/resources/catch-up-bookkeeping">catch-up bookkeeping guide</Link>{" "}
        if you are starting from behind.
      </p>
    </ArticleShell>
  );
}
