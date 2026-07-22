import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-2/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:px-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-[13.5px] text-muted">
            Close the month without chasing your clients.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-6 text-[14px] sm:flex sm:flex-wrap">
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Product</span>
            <Link href="/#features" className="text-muted transition-colors hover:text-text">Features</Link>
            <Link href="/#how" className="text-muted transition-colors hover:text-text">How it works</Link>
            <Link href="/compare" className="text-muted transition-colors hover:text-text">Compare</Link>
            <Link href="/pricing" className="text-muted transition-colors hover:text-text">Pricing</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Resources</span>
            <Link href="/resources" className="text-muted transition-colors hover:text-text">Guides</Link>
            <Link href="/faq" className="text-muted transition-colors hover:text-text">FAQ</Link>
            <Link href="/security" className="text-muted transition-colors hover:text-text">Security</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Legal</span>
            <Link href="/terms" className="text-muted transition-colors hover:text-text">Terms</Link>
            <Link href="/privacy" className="text-muted transition-colors hover:text-text">Privacy</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-faint">Account</span>
            <Link href="/login" className="text-muted transition-colors hover:text-text">Sign in</Link>
            <Link href="/signup" className="text-muted transition-colors hover:text-text">Start free</Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 sm:px-8 py-5 text-[12.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>RuledOff, 2026. For solo bookkeepers.</span>
          <span className="flex gap-4">
            <Link href="/terms" className="transition-colors hover:text-text">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-text">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
