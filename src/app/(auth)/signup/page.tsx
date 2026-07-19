import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create your firm · RuledOff" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your firm</h1>
        <p className="mt-1 text-sm text-ink-muted">
          One flat account. Unlimited clients. Your clients never log in.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
