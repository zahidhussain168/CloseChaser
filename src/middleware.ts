import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files, so auth
     * cookies stay fresh and protected routes are guarded.
     */
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
