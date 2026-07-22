import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { getDashboard } from "../services/dashboard";

/** The dashboard payload: clients annotated with blocking counts + the rollup.
 *  Mounted at /dashboard. */
export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { auth } = req as AuthedRequest;
    res.json(await getDashboard(auth.db));
  }),
);
