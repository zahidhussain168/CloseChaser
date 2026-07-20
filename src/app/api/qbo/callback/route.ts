import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/qbo/oauth";
import { saveQboConnection } from "@/lib/qbo/connection";
import { verifyState } from "@/lib/qbo/state";

export const dynamic = "force-dynamic";

/**
 * Where Intuit sends the bookkeeper back after they approve (or decline).
 *
 * This route is deliberately reachable without a session. Intuit returns the
 * browser by a top level redirect, and depending on which host the session was
 * established on, the cookie may not arrive. Trust comes from the signed state
 * instead, which only this server can mint.
 */
function back(request: NextRequest, status: string, detail?: string) {
  // Return to the host the request actually arrived on, not a configured URL.
  const url = new URL("/settings/connections", request.nextUrl.origin);
  url.searchParams.set("qbo", status);
  if (detail) url.searchParams.set("detail", detail.slice(0, 140));
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const realmId = params.get("realmId");

  if (params.get("error")) return back(request, "declined");
  if (!code || !realmId) {
    return back(request, "error", "QuickBooks did not return a company.");
  }

  const verified = verifyState(params.get("state"));
  if (!verified) {
    return back(request, "error", "That connection request expired. Please try again.");
  }

  // Defence in depth: when the nonce cookie did survive, it must match. A
  // missing cookie is tolerated because the signature already proves origin.
  const nonce = cookies().get("qbo_nonce")?.value;
  if (nonce && nonce !== verified.nonce) {
    return back(request, "error", "That connection request did not match. Please try again.");
  }

  try {
    const tokens = await exchangeCode(code);
    await saveQboConnection({ firmId: verified.firmId, realmId, tokens });
  } catch (e) {
    return back(request, "error", e instanceof Error ? e.message : "Could not connect QuickBooks.");
  }

  const response = back(request, "connected");
  response.cookies.delete("qbo_nonce");
  return response;
}
