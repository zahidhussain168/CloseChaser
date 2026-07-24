/** Formatting helpers. Amounts/dates always render in tabular mono (.num). */

export function formatMoney(
  amount: number | null | undefined,
  currency = "USD",
): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

/** 'YYYY-MM-01' or Date → "December 2025". */
export function formatMonth(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function monthKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** "3 open" / "1 open". Count renders in mono at the call site. */
export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Up to two uppercase initials from a name. Empty string if there are none. */
export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** Black or white text, whichever stays legible on the given hex colour. */
export function readableOn(hex: string): string {
  const c = (hex || "").replace("#", "");
  if (c.length !== 6) return "#FFFFFF";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#1A1A1A" : "#FFFFFF";
}

/** Compact relative time: "just now", "5m ago", "2h ago", "3d ago", or a date. */
export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  const ms = Date.now() - d.getTime();
  if (Number.isNaN(ms)) return "";
  const s = Math.floor(ms / 1000);
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}
