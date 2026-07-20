import Link from "next/link";
import { Button } from "./Button";

/** Minimal editorial top nav. Not sticky: it scrolls away as the page settles. */
export function SiteNav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:py-7">
      <Link
        href="/"
        className="font-editorial text-[22px] font-semibold tracking-tight text-site-ink"
      >
        RuledOff
      </Link>
      <div className="flex items-center gap-5 sm:gap-7">
        <Link
          href="/pricing"
          className="hidden text-sm text-site-secondary transition-colors hover:text-site-ink sm:block"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="text-sm text-site-secondary transition-colors hover:text-site-ink"
        >
          Log in
        </Link>
        <Button href="/signup" className="min-h-[42px] px-4 text-sm">
          Start free
        </Button>
      </div>
    </nav>
  );
}
