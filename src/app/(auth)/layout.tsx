import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 inline-flex">
        <Wordmark />
      </Link>
      <div className="sheet page-enter p-6 sm:p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-muted">
        Close the books. Ruled off.
      </p>
    </main>
  );
}
