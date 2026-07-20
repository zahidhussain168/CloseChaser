"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

/** Sticky marketing nav with a frosted background once you scroll. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-50 transition-colors duration-300 " +
        (scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-xl"
          : "border-b border-transparent")
      }
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-sm text-muted transition-colors hover:text-text">
            Features
          </a>
          <a href="#how" className="text-sm text-muted transition-colors hover:text-text">
            How it works
          </a>
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
          <Button href="/signup">Start free</Button>
        </div>
      </nav>
    </header>
  );
}
