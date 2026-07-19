import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Privileged Supabase client using the SECRET key. Bypasses RLS.
 *
 * Use ONLY on trusted server paths where the caller has been authorised
 * out-of-band — e.g. the public magic-link routes (scoped by token) and the
 * cron scheduler. Never import this into a client component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    serverEnv.supabaseUrl,
    serverEnv.supabaseSecretKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
