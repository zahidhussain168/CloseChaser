import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { env } from "../config/env";
import { badRequest, serviceUnavailable } from "../lib/errors";
import { z } from "zod";
import {
  isQboConfigured,
  authorizeUrl,
  verifyState,
  exchangeCode,
  saveConnection,
  getConnection,
  deleteConnection,
} from "../services/qbo";
import { validate, uuid } from "../middleware/validate";
import { ensureCurrentPeriod } from "../services/periods";
import { importBlockingTransactions } from "../services/qboSync";

/** QuickBooks Online OAuth + connection management. Mounted at /qbo.
 *  The transaction pull and answer write-back reuse the stored, encrypted
 *  tokens; those sync endpoints are the next port from the Next.js app. */
export const qboRouter = Router();

/** Begin the OAuth flow: returns the Intuit consent URL (open it in the browser). */
qboRouter.get(
  "/connect",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isQboConfigured()) throw serviceUnavailable("QuickBooks is not configured");
    const { auth } = req as AuthedRequest;
    res.json({ url: authorizeUrl(auth.firmId) });
  }),
);

/** Intuit redirects here with code, state, and realmId. Public (state is
 *  HMAC-signed, so no session is needed). */
qboRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    if (!isQboConfigured()) throw serviceUnavailable("QuickBooks is not configured");
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    const realmId = String(req.query.realmId ?? "");
    if (!code || !state || !realmId) throw badRequest("Missing code, state, or realmId");

    const verified = verifyState(state);
    if (!verified) throw badRequest("Invalid OAuth state");

    const tokens = await exchangeCode(code);
    await saveConnection({ firmId: verified.firmId, realmId, tokens });

    // Send the user back to the app's connections screen.
    res.redirect(`${env.APP_URL.replace(/\/$/, "")}/settings/connections?qbo=connected`);
  }),
);

/** Whether the caller's firm has a live QBO connection. */
qboRouter.get(
  "/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    const conn = await getConnection(auth.firmId);
    res.json({ connected: Boolean(conn), realmId: conn?.realm_id ?? null, companyName: conn?.company_name ?? null, lastSyncedAt: conn?.last_synced_at ?? null });
  }),
);

/** Pull this month's blocking transactions (uncategorized / Ask My Accountant)
 *  from QuickBooks into a client's current close as items. */
qboRouter.post(
  "/import",
  requireAuth,
  validate({ body: z.object({ clientId: uuid }) }),
  asyncHandler(async (req, res) => {
    if (!isQboConfigured()) throw serviceUnavailable("QuickBooks is not configured");
    const { auth } = req as AuthedRequest;
    const conn = await getConnection(auth.firmId);
    if (!conn) throw badRequest("Connect QuickBooks first");

    // ensureCurrentPeriod runs under RLS, so it also confirms the client is the firm's.
    const period = await ensureCurrentPeriod(auth.db, req.body.clientId);
    if (!period) throw badRequest("Could not open the close period");

    const added = await importBlockingTransactions(conn, period.id, period.month);
    res.json({ ok: true, added });
  }),
);

/** Disconnect QuickBooks. */
qboRouter.delete(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    await deleteConnection(auth.firmId);
    res.status(204).end();
  }),
);
