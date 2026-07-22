import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { getSubscriptionState } from "@/lib/paddle/subscription";
import type { Firm } from "@/lib/types";

/**
 * Public path prefixes that never require a bookkeeper session.
 *
 * /api/qbo/callback is public because Intuit returns the browser here by a top
 * level redirect and the session cookie may not arrive. Guarding it here sent
 * the callback to /login and the connection was lost without a word. It is
 * protected instead by the HMAC signed state it requires.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/pricing",
  "/compare",
  "/resources",
  "/security",
  "/faq",
  "/terms",
  "/privacy",
  "/c/",
  "/api/cron",
  "/api/client",
  "/api/qbo/callback",
  "/api/paddle/webhook", // Paddle authenticates via signature, not a session
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    serverEnv.supabaseUrl,
    serverEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in bookkeeper landing on an auth page → send to the dashboard.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Subscription gate: once the trial ends (and the firm is not paying), the
  // authenticated app is blocked and the user is sent to billing so they can
  // subscribe. /settings/plan and /api/* stay reachable so they can pay and so
  // cron/webhooks/attachments keep working. Public marketing/portal pages are
  // untouched.
  if (
    user &&
    !isPublic(pathname) &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/settings/plan")
  ) {
    const { data: firm } = await supabase
      .from("firms")
      .select(
        "subscription_status, trial_ends_at, paddle_subscription_id, current_period_end",
      )
      .eq("owner_id", user.id)
      .maybeSingle();
    if (firm && !getSubscriptionState(firm as unknown as Firm).active) {
      const url = request.nextUrl.clone();
      url.pathname = "/settings/plan";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
