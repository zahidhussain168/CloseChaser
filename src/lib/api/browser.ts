"use client";
import { createClient } from "@/lib/supabase/client";

/** The current user's Supabase access token, from the browser session. */
export async function getBrowserToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
