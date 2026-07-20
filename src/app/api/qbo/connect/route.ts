import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl } from "@/lib/qbo/oauth";
import { getFirm } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Kicks off the Intuit consent flow. The state value is stored in a short-lived
 * httpOnly cookie and checked on the way back, so a forged callback cannot bind
 * somebody else's QuickBooks company to this firm.
 */
export async function GET(request: NextRequest) {
  const firm = await getFirm();
  if (!firm) {
    // Stay on the host the bookkeeper is already using; the session lives there.
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const state = randomBytes(24).toString("base64url");
  cookies().set("qbo_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
