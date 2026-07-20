import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/qbo/oauth";
import { saveQboConnection } from "@/lib/qbo/connection";
import { getFirm } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Come back to the SAME host the bookkeeper is actually on.
 *
 * A Vercel project answers on several aliases, and the Supabase session cookie
 * is per-domain. Redirecting to a configured URL instead of the current origin
 * can land them on a host where they are not signed in, which reads as a failed
 * connection even when it worked.
 */
function back(request: NextRequest, status: string, detail?: string) {
  const url = new URL("/settings", request.nextUrl.origin);
  url.searchParams.set("qbo", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 140));
  return NextResponse.redirect(url);
}

/** Where Intuit sends the bookkeeper back after they approve (or decline). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const realmId = params.get("realmId");
  const state = params.get("state");

  const expected = cookies().get("qbo_state")?.value;
  cookies().delete("qbo_state");

  if (params.get("error")) return back(request, "declined");
  if (!code || !realmId) {
    return back(request, "error", "QuickBooks did not return a company.");
  }
  if (!state || !expected || state !== expected) {
    return back(request, "error", "That connection request expired. Please try again.");
  }

  const firm = await getFirm();
  if (!firm) {
    // Say so rather than bouncing to a login page that looks like a dead end.
    return back(
      request,
      "error",
      "You were signed out during the connection. Sign in and try again.",
    );
  }

  try {
    const tokens = await exchangeCode(code);
    await saveQboConnection({ firmId: firm.id, realmId, tokens });
  } catch (e) {
    return back(request, "error", e instanceof Error ? e.message : "Could not connect QuickBooks.");
  }

  return back(request, "connected");
}
