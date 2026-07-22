import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admin, userClient } from "../lib/supabase";
import { unauthorized } from "../lib/errors";

/** Authenticated request context: the Supabase user, an RLS-scoped client, and
 *  the caller's firm. Populated by requireAuth. */
export type AuthedRequest = Request & {
  auth: {
    userId: string;
    email: string | null;
    token: string;
    db: SupabaseClient; // RLS-scoped to this user
    firmId: string;
  };
};

function bearer(req: Request): string | null {
  const h = req.header("authorization");
  if (h && h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

/**
 * Verify the Supabase access token, attach an RLS-scoped client, and resolve
 * the caller's firm. Every authenticated route runs behind this.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = bearer(req);
    if (!token) throw unauthorized("Missing bearer token");

    // Validate the token against Supabase (admin client verifies any user JWT).
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) throw unauthorized("Invalid or expired token");

    const db = userClient(token);
    // The firm is owned by the user; RLS ensures only their own row returns.
    const { data: firm } = await db.from("firms").select("id").eq("owner_id", data.user.id).single();
    if (!firm) throw unauthorized("No firm for this account");

    (req as AuthedRequest).auth = {
      userId: data.user.id,
      email: data.user.email ?? null,
      token,
      db,
      firmId: firm.id,
    };
    next();
  } catch (err) {
    next(err);
  }
}
