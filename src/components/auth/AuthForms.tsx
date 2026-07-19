"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import {
  signInAction,
  signUpAction,
  type AuthState,
} from "@/app/(auth)/actions";

const initial: AuthState = { error: null };

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-sheet border px-3 py-2 text-sm"
      style={{
        color: "var(--pending)",
        borderColor: "var(--pending)",
        background: "var(--pending-soft, rgba(179,64,46,0.06))",
      }}
    >
      {error}
    </p>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(signInAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ErrorNote error={state.error} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Email</span>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Password</span>
        <input
          name="password"
          type="password"
          required
          className="field"
          autoComplete="current-password"
        />
      </label>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-sm text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="underline" style={{ color: "var(--ink)" }}>
          Create your firm
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useFormState(signUpAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ErrorNote error={state.error} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Firm name</span>
        <input
          name="firmName"
          type="text"
          required
          className="field"
          placeholder="e.g. Sarah Chen Bookkeeping"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Email</span>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-ink-muted">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="field"
          autoComplete="new-password"
        />
      </label>
      <SubmitButton pendingText="Setting up…">Create your firm</SubmitButton>
      <p className="text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="underline" style={{ color: "var(--ink)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
