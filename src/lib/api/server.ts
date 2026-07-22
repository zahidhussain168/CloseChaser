import "server-only";
import { createClient } from "@/lib/supabase/server";

/** The current user's Supabase access token, from the server cookie session. */
export async function getServerToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
