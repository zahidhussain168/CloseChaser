"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

const PRIMARY = [
  { href: "/#features", label: "Features" },
  { href: "/#how", label: "How it works" },
  { href: "/compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
];

const RESOURCES = [
  { href: "/resources/month-end-close-checklist", label: "Month-end close checklist" },
  { href: "/resources/collect-w9-and-1099", label: "Collect W-9s and 1099s" },
  { href: "/resources/catch-up-bookkeeping", label: "Catch-up bookkeeping" },
  { href: "/security", label: "Security" },
];

/** Sticky marketing nav with a frosted background once you scroll. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={
        "sticky top-0 z-50 transition-colors duration-300 " +
        (scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent")
      }
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/#features" className="text-sm text-muted transition-colors hover:text-text">
            Features
          </Link>
          <Link href="/#how" className="text-sm text-muted transition-colors hover:text-text">
            How it works
          </Link>
          <Link href="/compare" className="text-sm text-muted transition-colors hover:text-text">
            Compare
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setResOpen(true)}
            onMouseLeave={() => setResOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setResOpen(false);
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setResOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setResOpen((o) => !o)}
              aria-expanded={resOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-text"
            >
              Resources
              <ChevronDown
                size={14}
                className={"transition-transform " + (resOpen ? "rotate-180" : "")}
              />
            </button>
            {resOpen && (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
                <div className="w-64 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--elev-2)]">
                  {RESOURCES.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => setResOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/pricing" className="text-sm text-muted transition-colors hover:text-text">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-text sm:block"
          >
            Sign in
          </Link>
          <Button href="/signup" className="hidden sm:inline-flex">
            Start free
          </Button>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text transition-colors hover:bg-surface-2 md:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-bg md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8 py-4">
            {PRIMARY.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-line py-3 text-[15px] font-medium text-text"
              >
                {l.label}
              </Link>
            ))}

            <div className="border-b border-line py-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Resources
              </div>
              <div className="flex flex-col gap-1">
                {RESOURCES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-1.5 text-[15px] text-muted transition-colors hover:text-text"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg border border-line-strong py-2.5 text-center text-[15px] font-medium text-text"
              >
                Sign in
              </Link>
              <Button
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex-1 justify-center"
              >
                Start free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
