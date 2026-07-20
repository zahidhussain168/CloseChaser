import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/qbo/oauth";
import { saveQboConnection } from "@/lib/qbo/connection";
import { getFirm } from "@/lib/data";

export const dynamic = "force-dynamic";

function back(status: string, detail?: string) {
  const url = new URL("/settings", process.env.NEXT_PUBLIC_APP_URL);
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

  if (params.get("error")) return back("declined");
  if (!code || !realmId) return back("error", "QuickBooks did not return a company.");
  if (!state || !expected || state !== expected) {
    return back("error", "That connection request expired. Please try again.");
  }

  const firm = await getFirm();
  if (!firm) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  try {
    const tokens = await exchangeCode(code);
    await saveQboConnection({ firmId: firm.id, realmId, tokens });
  } catch (e) {
    return back("error", e instanceof Error ? e.message : "Could not connect QuickBooks.");
  }

  return back("connected");
}
