"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error: string | null };

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

  const admin = createAdminClient();

  // Create the bookkeeper, auto-confirmed so the demo flow has no email step.
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
