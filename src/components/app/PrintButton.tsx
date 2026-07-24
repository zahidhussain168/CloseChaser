"use client";

import { Download } from "lucide-react";

/** Triggers the browser print dialog (Save as PDF) for the Close Receipt. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary text-sm no-print"
    >
      <Download size={15} /> Save as PDF
    </button>
  );
}
