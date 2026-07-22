import { Router } from "express";
import { admin } from "../lib/supabase";
import { asyncHandler } from "../middleware/asyncHandler";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", service: "ruledoff-api", time: new Date().toISOString() });
});

/** Readiness: confirms the database is reachable. */
healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const { error } = await admin.from("firms").select("id", { count: "exact", head: true });
    if (error) return res.status(503).json({ status: "degraded", db: "unreachable", error: error.message });
    res.json({ status: "ready", db: "ok" });
  }),
);
