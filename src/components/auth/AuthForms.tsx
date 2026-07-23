"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Building2, AlertCircle } from "lucide-react";
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
      className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm"
      style={{
        color: "var(--pending)",
        borderColor: "color-mix(in srgb, var(--pending) 40%, transparent)",
        background: "var(--pending-soft, rgba(179,64,46,0.06))",
      }}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{error}</span>
    </p>
  );
}

function AuthSubmit({ children, pending }: { children: string; pending: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[15px] font-semibold text-white shadow-brand transition-[background-color,transform] duration-150 hover:bg-brand-600 active:translate-y-[1px] disabled:opacity-70"
    >
      {busy ? pending : children}
    </button>
  );
}

function PasswordField({
  autoComplete,
  minLength,
  hint,
}: {
  autoComplete: string;
  minLength?: number;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">Password</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Lock size={16} />
        </span>
        <input
          name="password"
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="field pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:text-text"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function EmailField() {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text">Email</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Mail size={16} />
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourfirm.com"
          className="field pl-10"
        />
      </span>
    </label>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(signInAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <ErrorNote error={state.error} />
      <EmailField />
      <PasswordField autoComplete="current-password" />
      <AuthSubmit pending="Signing in">Sign in</AuthSubmit>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
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
        <span className="font-medium text-text">Firm name</span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Building2 size={16} />
          </span>
          <input
            name="firmName"
            type="text"
            required
            placeholder="e.g. Sarah Chen Bookkeeping"
            className="field pl-10"
          />
        </span>
      </label>
      <EmailField />
      <PasswordField autoComplete="new-password" minLength={8} hint="At least 8 characters." />
      <AuthSubmit pending="Setting up">Create your firm</AuthSubmit>
      <p className="text-center text-xs leading-relaxed text-muted">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline hover:text-text">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-text">Privacy Policy</Link>.
      </p>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
