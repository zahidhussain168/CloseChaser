import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      {/* Form side */}
      <div className="flex flex-col bg-bg px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <Link href="/" className="tap inline-flex w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="page-enter w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-muted">
          Close the month without chasing your clients.
        </p>
      </div>

      {/* Brand showcase (desktop) */}
      <AuthShowcase />
    </main>
  );
}
