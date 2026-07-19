import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Wordmark";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <Wordmark size={30} />
      <h1 className="mt-10 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
        Chase the close, not your clients.
      </h1>
      <p className="mt-5 max-w-lg text-lg text-ink-muted">
        RuledOff finds what&apos;s blocking a client&apos;s month-end and chases
        them for it — a branded link they open on their phone. No account, no
        login, no download. When every item is answered, the books are{" "}
        <span className="font-display" style={{ color: "var(--cleared)" }}>
          ruled off
        </span>
        .
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link href="/signup" className="btn btn-primary">
          Create your firm
        </Link>
        <Link href="/login" className="btn">
          Sign in
        </Link>
      </div>

      <div className="mt-16 border-t pt-6" style={{ borderColor: "var(--rule)" }}>
        <p className="text-sm text-ink-muted">
          Built for solo bookkeepers.{" "}
          <span className="num" style={{ color: "var(--ink)" }}>
            $29
          </span>
          /mo flat, unlimited clients.
        </p>
      </div>
    </main>
  );
}
