import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Create your firm",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <span className="pill pill-brand mb-3">Start free for 14 days</span>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-text">
          Create your firm
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          No card required. Unlimited clients, set up in under a minute.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
