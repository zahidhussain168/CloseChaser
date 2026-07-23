import { NextResponse } from "next/server";
import { runReminders } from "@/lib/scheduler";
import { runRecurring } from "@/lib/recurring";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily reminder scheduler. On Vercel, set CRON_SECRET in project env and add a
 * cron in vercel.json. Vercel then calls this with `Authorization: Bearer
 * <CRON_SECRET>`. For local/manual runs, pass `?key=<CRON_SECRET>`.
 */
function authorized(req: Request): boolean {
  const secret = serverEnv.cronSecret;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // A query-string key is handy for local/manual runs but would leak the secret
  // into access logs, so it is only accepted outside production. Vercel Cron
  // always sends the Authorization header.
  if (process.env.NODE_ENV !== "production") {
    const url = new URL(req.url);
    return url.searchParams.get("key") === secret;
  }
  return false;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Generate + auto-chase recurring monthly closes first, then send any due
  // reminders (including for the chases just started).
  const recurring = await runRecurring(createAdminClient());
  const report = await runReminders();
  return NextResponse.json({ ...report, recurring });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
