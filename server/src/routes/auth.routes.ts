import { Router } from "express";
import { z } from "zod";
import { admin } from "../lib/supabase";
import { asyncHandler } from "../middleware/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { authLimiter } from "../middleware/rateLimit";
import { badRequest, unauthorized } from "../lib/errors";

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/** Create a firm account. Signs up the user in Supabase; a DB trigger creates
 *  the firm row (name from metadata) and the 14-day trial window. */
authRouter.post(
  "/signup",
  authLimiter,
  validate({ body: credentials.extend({ firmName: z.string().trim().min(1) }) }),
  asyncHandler(async (req, res) => {
    const { email, password, firmName } = req.body as { email: string; password: string; firmName: string };
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firm_name: firmName },
    });
    if (error) throw badRequest(error.message);

    // Sign in to return a session the client can use immediately.
    const { data: session, error: signInErr } = await admin.auth.signInWithPassword({ email, password });
    if (signInErr || !session.session) {
      return res.status(201).json({ user: { id: data.user.id, email }, session: null });
    }
    res.status(201).json({ user: { id: data.user.id, email }, session: session.session });
  }),
);

/** Exchange email + password for an access token. */
authRouter.post(
  "/login",
  authLimiter,
  validate({ body: credentials }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const { data, error } = await admin.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw unauthorized("Invalid email or password");
    res.json({ user: { id: data.user.id, email: data.user.email }, session: data.session });
  }),
);

/** The current user + their firm. */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const { data: firm } = await auth.db.from("firms").select("*").eq("id", auth.firmId).single();
    res.json({ user: { id: auth.userId, email: auth.email }, firm });
  }),
);
