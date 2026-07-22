"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

export type AuthState = { error: string | null };

function requestIp(): string {
  const xff = headers().get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : headers().get("x-real-ip") ?? "unknown";
}

const signupSchema = z.object({
  firmName: z.string().trim().min(1, "Your firm name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    firmName: formData.get("firmName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { firmName, email, password } = parsed.data;

  // Throttle sign-ups per network to blunt automated account creation.
  const rl = await rateLimit(`signup:${requestIp()}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return { error: "Too many sign-ups from this network. Please try again later." };
  }

  const admin = createAdminClient();

  // Accounts are auto-confirmed for a frictionless trial start. To require email
  // verification instead, set email_confirm:false and configure Supabase Auth
  // SMTP + a confirmation template first (otherwise confirmation mails throttle
  // and signups break).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firm_name: firmName },
  });
  if (createErr || !created.user) {
    return { error: createErr?.message ?? "Could not create the account" };
  }

  // Bootstrap the firm (bypasses RLS via the secret key).
  const { error: firmErr } = await admin.from("firms").insert({
    owner_id: created.user.id,
    name: firmName,
  });
  if (firmErr) {
    return { error: `Account made, but firm setup failed: ${firmErr.message}` };
  }

  // Establish the session (sets auth cookies) then head to the dashboard.
  const supabase = createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) return { error: signInErr.message };

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Throttle by network and by account to blunt credential stuffing.
  const ipRl = await rateLimit(`login:ip:${requestIp()}`, 30, 10 * 60_000);
  const emailRl = await rateLimit(`login:email:${parsed.data.email.toLowerCase()}`, 10, 10 * 60_000);
  if (!ipRl.ok || !emailRl.ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
