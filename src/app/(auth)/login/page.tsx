import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-text">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Sign in to pick up where your closes left off.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
