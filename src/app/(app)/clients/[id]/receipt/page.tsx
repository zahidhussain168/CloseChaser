import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getCloseReceipt } from "@/lib/receipt";
import { PrintButton } from "@/components/app/PrintButton";
import { ProLock } from "@/components/app/ProLock";
import { isScale } from "@/lib/entitlements";
import { formatDate, formatMonth } from "@/lib/format";

export const metadata: Metadata = { title: "Close Receipt" };

function stateLabel(s: string) {
  if (s === "accepted") return "Accepted";
  if (s === "answered") return "Answered";
  if (s === "nudged") return "Chased";
  return "Requested";
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  if (!(await isScale())) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/clients/${params.id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-text">
          <ArrowLeft size={16} /> Back to client
        </Link>
        <ProLock feature="closeReceipt" />
      </div>
    );
  }

  const receipt = await getCloseReceipt(params.id);
  if (!receipt) notFound();

  const generatedAt = new Date().toISOString();
  const monthLabel = formatMonth(receipt.month);
  const complete = receipt.totalRequested > 0 && receipt.totalAccepted === receipt.totalRequested;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/clients/${params.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-text">
          <ArrowLeft size={16} /> Back to client
        </Link>
        <PrintButton />
      </div>

      <div className="receipt-print sheet overflow-hidden">
        {/* Header */}
        <div className="border-b border-line px-7 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Close Receipt</p>
              <h1 className="mt-1 font-display text-2xl text-text">{monthLabel} close</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {receipt.clientName}
                {receipt.clientEmail ? ` · ${receipt.clientEmail}` : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold text-text">{receipt.firmName}</div>
              {complete ? (
                <span className="pill pill-success mt-2 text-[11px]"><Check size={11} /> Ruled off</span>
              ) : (
                <span className="pill pill-warning mt-2 text-[11px]">In progress</span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { k: "Items requested", v: String(receipt.totalRequested) },
              { k: "Accepted", v: `${receipt.totalAccepted} / ${receipt.totalRequested}` },
              { k: "First chased", v: receipt.firstChaseAt ? formatDate(receipt.firstChaseAt) : "Not chased" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-surface-2/50 px-3 py-2.5">
                <div className="text-[11px] uppercase tracking-wide text-faint">{s.k}</div>
                <div className="num mt-0.5 text-[15px] font-bold text-text">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Item audit trail */}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wide text-faint">
              <th className="px-7 py-2.5 font-semibold">Item</th>
              <th className="py-2.5 font-semibold">Requested</th>
              <th className="py-2.5 font-semibold">Answered</th>
              <th className="px-7 py-2.5 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((it, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-7 py-3">
                  <div className="font-medium text-text">{it.title}</div>
                  <div className="text-[12px] capitalize text-faint">{it.type}</div>
                </td>
                <td className="num py-3 text-[13px] text-ink-muted">{formatDate(it.requestedAt)}</td>
                <td className="num py-3 text-[13px] text-ink-muted">{it.answeredAt ? formatDate(it.answeredAt) : "-"}</td>
                <td className="px-7 py-3 text-right">
                  <span className={it.state === "accepted" ? "pill pill-success num text-[11px]" : "num text-[12px] text-ink-muted"}>
                    {stateLabel(it.state)}
                  </span>
                </td>
              </tr>
            ))}
            {receipt.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-7 py-8 text-center text-sm text-ink-muted">No items were requested for this close.</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Footer */}
        <div className="border-t border-line bg-surface-2/40 px-7 py-4 text-[12px] text-faint">
          Generated {formatDate(generatedAt)} by {receipt.firmName} via RuledOff. This receipt records
          what was requested, when it was chased, and when it was answered, as a proof of close.
        </div>
      </div>
    </div>
  );
}
