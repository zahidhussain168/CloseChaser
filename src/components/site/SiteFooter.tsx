import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-2/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-[13.5px] text-muted">
            Close the month without chasing your clients.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-10 gap-y-3 text-[14px]">
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Product</span>
            <a href="/#features" className="text-muted transition-colors hover:text-text">Features</a>
            <a href="/#how" className="text-muted transition-colors hover:text-text">How it works</a>
            <Link href="/pricing" className="text-muted transition-colors hover:text-text">Pricing</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Account</span>
            <Link href="/login" className="text-muted transition-colors hover:text-text">Sign in</Link>
            <Link href="/signup" className="text-muted transition-colors hover:text-text">Start free</Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-5 text-[12.5px] text-faint">
          RuledOff, 2026. For solo bookkeepers.
        </div>
      </div>
    </footer>
  );
}
