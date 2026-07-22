"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { FormState } from "@/lib/forms";

/**
 * A brief green confirmation shown next to a submit button after a form action
 * succeeds. It auto-dismisses after a few seconds so it does not linger once the
 * form has reset, and re-appears on each new success. role="status" lets screen
 * readers announce it without stealing focus.
 */
export function SavedFlash({
  state,
  label = "Saved",
}: {
  state: FormState;
  label?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [state]);

  if (!show) return null;

  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 text-sm"
      style={{ color: "var(--cleared)" }}
    >
      <Check size={15} /> {label}
    </span>
  );
}
