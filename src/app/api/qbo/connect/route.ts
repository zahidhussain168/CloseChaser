import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl } from "@/lib/qbo/oauth";
import { signState } from "@/lib/qbo/state";
import { getFirm } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Kicks off the Intuit consent flow.
 *
 * The firm is signed into the state so the callback does not have to rely on a
 * session cookie surviving the round trip to Intuit. A nonce cookie is set as
 * well and checked when it comes back, but its absence is not fatal.
 */
export async function GET(request: NextRequest) {
  const firm = await getFirm();
  if (!firm) {
    // Stay on the host the bookkeeper is already using; the session lives there.
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const { state, nonce } = signState(firm.id);
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  // Set on the response itself so the header travels with this redirect.
  response.cookies.set("qbo_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
  return response;
}
