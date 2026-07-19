import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { getFirm } from "@/lib/data";
import { signOutAction } from "@/app/(auth)/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const firm = await getFirm();
  if (!firm) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          borderColor: "var(--rule)",
          background: "color-mix(in srgb, var(--paper) 88%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="inline-flex">
              <Wordmark size={20} />
            </Link>
            <nav className="hidden gap-5 text-sm sm:flex">
              <Link href="/dashboard" className="text-ink-muted hover:text-ink">
                Clients
              </Link>
              <Link href="/settings" className="text-ink-muted hover:text-ink">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {firm.name}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
