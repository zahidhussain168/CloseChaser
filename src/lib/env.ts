/**
 * Centralised env access. Values are read from process.env (populated from
 * .env.local in dev / Vercel project settings in prod). We never hardcode
 * secret values anywhere in the codebase.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local.`,
    );
  }
  return v;
}

/** Safe on the client (only NEXT_PUBLIC_* are inlined by Next). */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Server-only. Do not import into client components. */
export const serverEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY");
  },
  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  get resendFrom() {
    return process.env.RESEND_FROM ?? "onboarding@resend.dev";
  },
  /**
   * Sandbox only: when set, every chase email is redirected here instead of the
   * client's real address. Lets the demo deliver while using an unverified
   * Resend sender (which can only send to the account owner). Leave unset in
   * production once a domain is verified.
   */
  get resendTestRecipient() {
    return process.env.RESEND_TEST_RECIPIENT ?? "";
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
