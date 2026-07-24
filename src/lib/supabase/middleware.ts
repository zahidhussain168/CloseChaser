import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";

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

  // Note: an expired trial is NOT locked out of the app. The basic collection
  // loop stays usable indefinitely; the premium features (Close Forecast, AI
  // analyst, Chase Everyone, auto-chase) gate themselves in the UI and are
  // enforced in their server actions via entitlements. This keeps the product
  // genuinely useful for free while the paid plan sells the automation and
  // intelligence, rather than trapping someone the moment the trial ends.

  return response;
}
