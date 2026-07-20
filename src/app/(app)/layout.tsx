import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { SidebarNav } from "@/components/app/SidebarNav";
import { getFirm } from "@/lib/data";
import { signOutAction } from "@/app/(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  const initials = firm.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="lg:flex lg:min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between px-4 py-6 lg:flex"
        style={{
          background: "var(--paper-sheet)",
          borderRight: "1px solid var(--rule)",
        }}
      >
        <div>
          <Link href="/dashboard" className="tap mb-8 inline-flex px-2">
            <Logo />
          </Link>
          <SidebarNav />
        </div>
        <div>
          <div
            className="mb-3 flex items-center gap-2.5 rounded-[8px] px-2 py-2"
            style={{ background: "var(--paper-deep)" }}
          >
            <span
              className="num flex h-8 w-8 items-center justify-center rounded-full text-xs"
              style={{ background: "var(--paper-sheet)", color: "var(--ink)" }}
            >
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {firm.name}
              </span>
              <span className="block text-[11px] text-ink-muted">
                Bookkeeper
              </span>
            </span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="px-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 backdrop-blur lg:hidden"
        style={{
          background: "color-mix(in srgb, var(--paper) 88%, transparent)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <Link href="/dashboard" className="tap">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <SidebarNav orientation="horizontal" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="px-2 text-sm text-ink-muted hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
