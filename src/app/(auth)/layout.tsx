import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="brand-wash flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="sheet page-enter rounded-2xl p-7 shadow-elev2 sm:p-9">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Close the month without chasing your clients.
        </p>
      </div>
    </main>
  );
}
