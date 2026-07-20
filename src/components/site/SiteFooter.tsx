import Link from "next/link";

/** Quiet close to the page. The ceremony already happened above. */
export function SiteFooter() {
  return (
    <footer className="border-t border-site-border bg-site-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-editorial text-lg font-semibold text-site-ink">
            RuledOff
          </span>
          <p className="mt-1 max-w-xs text-[13px] text-site-secondary">
            Close the month without chasing your clients.
          </p>
        </div>
        <nav className="flex items-center gap-6 text-[14px] text-site-secondary">
          <Link href="/pricing" className="transition-colors hover:text-site-ink">
            Pricing
          </Link>
          <Link href="/login" className="transition-colors hover:text-site-ink">
            Log in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-site-ink">
            Start free
          </Link>
        </nav>
      </div>
      <div className="border-t border-site-border">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-site-secondary">
            RuledOff, 2026. For solo bookkeepers.
          </span>
        </div>
      </div>
    </footer>
  );
}
