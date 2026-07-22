import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

/**
 * Admin client (SERVICE key): bypasses RLS. Use only on trusted paths where the
 * caller is authorised out of band, the magic-link portal (scoped by token),
 * the cron scheduler, and webhooks. Never expose to end users.
 */
export const admin: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Per-request client bound to a user's access token. Queries run under that
 * user's Row Level Security policies, exactly like the Next.js app did with the
 * cookie session. This is how authenticated endpoints stay scoped to the caller.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
